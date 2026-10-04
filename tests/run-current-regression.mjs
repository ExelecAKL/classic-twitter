import { createRequire } from "node:module";
import { existsSync } from "node:fs";

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright"));
} catch {
  console.error("Playwright is required for this optional runner. Install it locally or set PLAYWRIGHT_MODULE to an existing installation. See README.md.");
  process.exit(1);
}
const baseURL = process.argv[2] || "http://127.0.0.1:4173";
const executablePath = process.env.BROWSER_EXECUTABLE || [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe"
].find(existsSync);
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const failures = [];
let checks = 0;

async function check(name, predicate) {
  checks += 1;
  try {
    if (!await predicate()) throw new Error("condition was false");
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

try {
  await page.goto(`${baseURL}/tests/current-regression-fixture.html`);
  await page.locator('#current-results[data-status="pass"], #current-results[data-status="fail"]').waitFor({ timeout: 40000 });
  const fixtureResults = await page.locator("#current-results li").evaluateAll((items) =>
    items.map((item) => ({ name: item.textContent, passed: item.dataset.passed === "true" })));
  for (const result of fixtureResults) {
    checks += 1;
    console.log(result.name);
    if (!result.passed) failures.push(result.name);
  }
  await page.locator("#explore-nav").hover();
  await check("Navigation mouse hover paints only one blue-tinted pill", () => page.evaluate(() => {
    const anchor = getComputedStyle(document.querySelector("#explore-nav"));
    const pill = getComputedStyle(document.querySelector("#explore-pill"));
    const [red, green, blue] = pill.backgroundColor.match(/[\d.]+/g)?.map(Number) || [];
    return anchor.backgroundColor === "rgba(0, 0, 0, 0)" && blue > red && green > red;
  }));
  for (const id of ["recent-option", "trend-card", "menu-row"]) {
    await page.locator(`#${id}`).hover();
    await check(`${id} mouse hover uses the Twitter-blue tint`, () => page.locator(`#${id}`).evaluate((element) => {
      const [red, green, blue] = getComputedStyle(element).backgroundColor.match(/[\d.]+/g)?.map(Number) || [];
      return blue > red && green > red;
    }));
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`\nCurrent UI regression failed (${failures.length}/${checks}):\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`\nCurrent UI regression passed (${checks}/${checks}).`);
}
