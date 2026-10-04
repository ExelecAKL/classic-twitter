import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const failures = [];
let checks = 0;

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

function check(condition, message) {
  checks += 1;
  if (!condition) failures.push(message);
}

function includes(source, token, label) {
  check(source.includes(token), `${label} is missing ${JSON.stringify(token)}`);
}

const manifestText = read("manifest.json");
const manifest = JSON.parse(manifestText);
const fixture = read("tests/v13-regression-fixture.html");
const fixtureRunner = read("tests/v13-regression-fixture.js");
const runtime = read("scripts/v13-main.js");
const theme = read("styles/twitter-v13.css");
const popup = read("popup/popup.js");

for (const [name, source] of [
  ["scripts/v13-main.js", runtime],
  ["popup/popup.js", popup],
  ["tests/v13-regression-fixture.js", fixtureRunner]
]) {
  try {
    new vm.Script(source, { filename: name });
    check(true, `${name} syntax`);
  } catch (error) {
    check(false, `${name} syntax error: ${error.message}`);
  }
}

check(manifest.manifest_version === 3, "manifest must remain Manifest V3");
check(Array.isArray(manifest.permissions) && manifest.permissions.includes("storage"), "manifest must request storage for popup settings");
check(manifest.action?.default_popup === "popup/popup.html", "manifest action must point to popup/popup.html");

const contentScript = manifest.content_scripts?.[0] || {};
check(contentScript.run_at === "document_start", "content script must run at document_start");
check(contentScript.js?.includes("scripts/v13-main.js"), "manifest must load scripts/v13-main.js");
check(contentScript.css?.at(-1) === "styles/twitter-v13.css", "styles/twitter-v13.css must load last");

for (const token of [
  "data-twitter-classic-native-tabs",
  "data-twitter-classic-fallback-label",
  "data-twitter-classic-de-elon",
  "data-twitter-classic-theme",
  "data-twitter-classic-ui-text",
  "Recent Tweet from",
  "Tweeted"
]) includes(`${runtime}\n${theme}`, token, "v1.3 implementation");

includes(theme, "app-bar-back", "back-button CSS");
includes(theme, "data-twitter-classic-post-twitter", "De-Elon CSS");
includes(runtime, "data-twitter-classic-native-landing", "native signed-out reskin");
check(!runtime.includes("function buildLanding"), "signed-out flow must not build a replacement DOM");
check(!runtime.includes("location.assign(\"/i/flow"), "signed-out flow must not replace native auth navigation");
includes(theme, "data-twitter-classic-timeline-plus", "timeline-plus CSS");
includes(theme, "data-twitter-classic-timeline-plus-shell", "timeline-plus shell CSS");
includes(theme, "characterCount", "composer counter CSS");
includes(theme, "data-twitter-classic-search-separator", "sidebar Search separator CSS");

for (const id of [
  "feed-shell",
  "native-tablist",
  "new-tweets-status",
  "reply-button",
  "notification-item",
  "grok-nav",
  "premium-nav",
  "leaked-white-text",
  "manage-timelines",
  "timeline-plus-shell",
  "composer-media-control",
  "home-character-counter",
  "search-separator",
  "premium-shell-outer"
]) includes(fixture, `id=\"${id}\"`, "v1.3 fixture");

includes(fixtureRunner, "Home feed remains visible", "fixture assertions");
includes(fixtureRunner, "For You and Following stay visible", "fixture assertions");
includes(fixtureRunner, "Home header has no sparkle control", "fixture assertions");
includes(fixtureRunner, "composer media control has no ring", "fixture assertions");
includes(fixtureRunner, "timeline plus and its shell are completely flat", "fixture assertions");
includes(fixtureRunner, "Home character counter is visible and Twitter blue", "fixture assertions");
includes(fixtureRunner, "composer has one continuous light-gray divider", "fixture assertions");
includes(fixtureRunner, "sidebar Search separator is removed", "fixture assertions");
includes(fixtureRunner, "reply button stays Reply", "fixture assertions");
includes(fixtureRunner, "notification system phrase is rewritten", "fixture assertions");
includes(fixtureRunner, "new-Tweets status pill remains visible", "fixture assertions");
includes(fixtureRunner, "back icon resolves to Twitter blue", "fixture assertions");
includes(fixtureRunner, "Grok is hidden in De-Elon mode", "fixture assertions");
includes(fixtureRunner, "white UI-text leak is normalized", "fixture assertions");

if (failures.length) {
  console.error(`v1.3 validation failed (${failures.length}/${checks}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`v1.3 static validation passed (${checks}/${checks}).`);
  console.log("Browser fixture: node tests/serve-fixtures.mjs, then open the printed URL.");
}
