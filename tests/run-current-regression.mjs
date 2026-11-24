import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { join } from "node:path";

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

async function checkPowerPopup() {
  const popup = await browser.newPage({ viewport: { width: 25, height: 25 } });
  await popup.addInitScript(() => {
    const handlers = new Set();
    const key = "classic-twitter-popup-test";
    const browserApi = window.chrome ||= {};
    browserApi.runtime ||= {};
    window.fixtureVoiceStarts = 0;
    window.fixturePopupMotions = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const animation = animate.apply(this, args);
      if (this.matches(".power-face, #mode-label")) {
        window.fixturePopupMotions.push({
          target: this.matches(".power-face") ? "face" : "label",
          frames: animation.effect.getKeyframes()
        });
      }
      return animation;
    };
    if (window.AudioContext) {
      window.AudioContext = class extends AudioContext {
        createOscillator() {
          const voice = super.createOscillator();
          const start = voice.start.bind(voice);
          voice.start = (...args) => { start(...args); window.fixtureVoiceStarts += 1; };
          return voice;
        }
      };
    }
    browserApi.storage = {
      local: {
        get(defaults, callback) {
          queueMicrotask(() => callback({ ...defaults, ...JSON.parse(sessionStorage.getItem(key) || "{}") }));
        },
        set(values, callback) {
          queueMicrotask(() => {
            if (window.rejectNextPopupWrite) {
              window.rejectNextPopupWrite = false;
              browserApi.runtime.lastError = { message: "Fixture write error" };
              callback();
              delete browserApi.runtime.lastError;
              return;
            }
            const old = JSON.parse(sessionStorage.getItem(key) || "{}");
            sessionStorage.setItem(key, JSON.stringify({ ...old, ...values }));
            for (const handler of handlers) handler(Object.fromEntries(
              Object.entries(values).map(([name, value]) => [name, { oldValue: old[name], newValue: value }])
            ), "local");
            callback();
          });
        }
      },
      onChanged: { addListener: (handler) => handlers.add(handler) }
    };
  });

  const theme = () => popup.locator("html").getAttribute("data-popup-theme");
  const power = popup.getByRole("button", { name: "Classic Twitter", exact: true });
  const dark = popup.getByRole("switch", { name: "Dark mode", exact: true });
  const deElon = popup.getByRole("switch", { name: /De-Elon mode/ });
  const mode = () => popup.getByRole("status").textContent();
  const capture = async (name) => {
    if (process.env.POPUP_PREVIEW_DIR) await popup.screenshot({ path: join(process.env.POPUP_PREVIEW_DIR, name) });
  };
  const waitForDots = (monochrome) => popup.waitForFunction((mono) => {
    const canvas = document.querySelector("#power-wave");
    const strip = canvas.getContext("2d").getImageData(canvas.width - 48, 30, 37, canvas.height - 60).data;
    let lit = 0;
    let dark = 0;
    for (let i = 0; i < strip.length; i += 4) {
      const [r, g, b, a] = [strip[i], strip[i + 1], strip[i + 2], strip[i + 3]];
      if (a < 100) continue;
      if (b < 60 && r < 55) dark += 1;
      if (b > 140 && (mono ? r === g && g === b : b - r > 50)) lit += 1;
    }
    return lit > 20 && dark > 100 && canvas.parentElement.hasAttribute("data-wave-dark");
  }, monochrome, { timeout: 2500 });

  try {
    await popup.goto(`${baseURL}/popup/popup.html`);
    await popup.locator('html[data-popup-theme="light"]').waitFor();
    await check("Toolbar sizing starts wide even inside a 25px bootstrap viewport", () => popup.evaluate(() =>
      innerWidth === 25 && document.documentElement.scrollWidth >= 352 &&
      document.querySelector(".app-shell").getBoundingClientRect().width === 352));
    await popup.setViewportSize({ width: 352, height: 460 });
    await check("Power popup starts in Twitter Mode with no header icon or footer message", async () => {
      const cleanLayout = await popup.evaluate(() => !document.querySelector("header svg, header img, footer") &&
        getComputedStyle(document.querySelector("header")).borderBottomWidth === "0px" &&
        getComputedStyle(document.documentElement).fontFamily.startsWith("TwitterChirp"));
      return cleanLayout && await mode() === "Twitter Mode" && await power.getAttribute("aria-pressed") === "true";
    });
    await capture("classic-twitter-power-light.png");
    await check("Settings keep a compact moon row and only the De-Elon explanation", async () =>
      await dark.isEnabled() && await popup.evaluate(() =>
        !!document.querySelector(".setting-row-dark .dark-mode-icon") &&
        !document.querySelector(".setting-row-dark .setting-description") &&
        document.querySelectorAll(".settings .setting-description").length === 1 &&
        getComputedStyle(document.querySelector(".bird-outline")).stroke === "rgb(29, 161, 242)" &&
        getComputedStyle(document.querySelector("#deElon + .switch-track")).backgroundColor === "rgb(29, 161, 242)"));
    await check("Holding the power button tightens its contact shadow and lowers the face", async () => {
      const box = await power.boundingBox();
      if (!box) return false;
      await popup.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await popup.mouse.down();
      try {
        await popup.waitForFunction(() => {
          const face = getComputedStyle(document.querySelector(".power-face"));
          return face.boxShadow.includes("0px 4px 9px") && new DOMMatrix(face.transform).m42 > 3;
        }, undefined, { timeout: 2000 });
        await capture("classic-twitter-power-pressed.png");
        return true;
      } finally {
        await popup.mouse.move(5, 5);
        await popup.mouse.up();
      }
    });

    await power.press("Space");
    await check("Keyboard toggle switches to black X Mode and pauses the two preferences", async () =>
      await theme() === "x" && await mode() === "X Mode" && await power.getAttribute("aria-pressed") === "false" &&
      await dark.isDisabled() && await deElon.isDisabled() &&
      await popup.locator("body").evaluate((body) => getComputedStyle(body).backgroundColor) === "rgb(0, 0, 0)");
    await check("Powering off ripples in grayscale and stays silent", async () => {
      await waitForDots(true);
      await capture("classic-twitter-power-wave-x.png");
      return await popup.evaluate(() => window.fixtureVoiceStarts === 0 &&
        getComputedStyle(document.querySelector("#mode-label")).color === "rgb(244, 244, 244)");
    });
    await popup.reload();
    await popup.locator('html[data-popup-theme="x"]').waitFor();
    await capture("classic-twitter-power-x.png");

    await popup.evaluate(() => {
      const canvas = document.querySelector("#power-wave");
      window.popupInkFrames = [];
      let remaining = 120;
      function sampleInk() {
        if (canvas.parentElement.dataset.waveActive === "twitter") {
          const pixel = canvas.getContext("2d").getImageData(0, 0, 1, 1).data;
          const heading = getComputedStyle(document.querySelector("h1"));
          window.popupInkFrames.push({
            alpha: pixel[3],
            red: Number(heading.color.match(/\d+/)?.[0]),
            transition: heading.transitionDuration
          });
        }
        if (--remaining > 0) requestAnimationFrame(sampleInk);
      }
      requestAnimationFrame(sampleInk);
    });
    await power.click();
    await check("Powering on rebounds, animates visible text, chirps, and sends blue dots to the edge", async () => {
      await waitForDots(false);
      await capture("classic-twitter-power-wave.png");
      await popup.waitForFunction(() => window.fixtureVoiceStarts === 2, undefined, { timeout: 2500 });
      const feedback = await popup.evaluate(() => {
        const face = window.fixturePopupMotions.some(({ target, frames }) => target === "face" &&
          frames.some((keyframe) => keyframe.boxShadow && keyframe.transform));
        const label = window.fixturePopupMotions.some(({ target, frames }) => target === "label" &&
          frames.every((keyframe) => keyframe.transform && !("opacity" in keyframe)));
        const lightInk = window.popupInkFrames.some(({ alpha, red }) => alpha >= 230 && red >= 249);
        if (!face || !label || !lightInk) throw new Error(`Missing feedback: ${JSON.stringify({ face, label, lightInk })}`);
        return true;
      });
      return feedback && await mode() === "Twitter Mode" && await power.getAttribute("aria-pressed") === "true";
    });
    await check("Twitter text blends in the same frame that the pulse backing lightens", async () => {
      await popup.locator(".app-shell:not([data-wave-active])").waitFor();
      return await popup.evaluate(() => {
        const crossing = window.popupInkFrames.filter(({ alpha }) => alpha > 130 && alpha < 205);
        if (!crossing.some(({ red, transition }) => red > 60 && red < 215 && transition === "0s")) {
          throw new Error(`No intermediate ink in the brightening frames: ${JSON.stringify(crossing.slice(0, 8))}`);
        }
        return getComputedStyle(document.querySelector("h1")).color === "rgb(20, 23, 26)";
      });
    });

    await popup.getByText("Dark mode", { exact: true }).click();
    await popup.getByText("De-Elon mode", { exact: true }).click();
    await popup.reload();
    await popup.locator('html[data-popup-theme="dim"]').waitFor();
    await check("Dim and De-Elon choices survive closing and reopening the popup", async () =>
      await mode() === "Twitter Mode" && await dark.isChecked() && !(await deElon.isChecked()));
    await capture("classic-twitter-power-dim.png");

    await popup.emulateMedia({ reducedMotion: "reduce" });
    await power.click();
    await power.click();
    await check("Reduced motion bypasses the bounce and wave but still powers on", async () =>
      await theme() === "dim" && await popup.evaluate(() =>
        document.querySelector(".power-face").getAnimations().length === 0 &&
        document.querySelector("#mode-label").getAnimations().length === 0 &&
        getComputedStyle(document.querySelector("#power-wave")).display === "none"));

    await popup.evaluate(() => { window.rejectNextPopupWrite = true; });
    await power.click();
    await check("A failed storage write restores the previous mode and shows an error", async () => {
      await popup.getByText("Couldn’t save that setting. Try again.", { exact: true }).waitFor({ timeout: 2500 });
      return await theme() === "dim" && await mode() === "Twitter Mode";
    });
  } finally {
    await popup.close();
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
  await checkPowerPopup();
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`\nCurrent UI regression failed (${failures.length}/${checks}):\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`\nCurrent UI regression passed (${checks}/${checks}).`);
}
