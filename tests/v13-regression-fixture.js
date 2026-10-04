(() => {
  "use strict";

  const resultsPanel = document.getElementById("fixture-results");
  const results = [];

  function visible(element) {
    if (!element) return false;
    for (let current = element; current; current = current.parentElement) {
      const style = getComputedStyle(current);
      if (style.display === "none" || style.visibility === "hidden") return false;
    }
    return true;
  }

  function colorChannels(value) {
    const channels = String(value).match(/[\d.]+/g);
    return channels ? channels.slice(0, 3).map(Number) : [];
  }

  function isTwitterBlue(value) {
    const [red, green, blue] = colorChannels(value);
    return red >= 20 && red <= 40 && green >= 140 && green <= 175 && blue >= 230;
  }

  function isDarkInk(value) {
    const [red, green, blue] = colorChannels(value);
    return red < 100 && green < 110 && blue < 120;
  }

  function isTransparent(value) {
    const channels = String(value).match(/[\d.]+/g)?.map(Number) || [];
    return value === "transparent" || (channels.length >= 4 && channels[3] === 0);
  }

  function sameColor(left, right) {
    const leftChannels = colorChannels(left);
    const rightChannels = colorChannels(right);
    return leftChannels.length === 3 && rightChannels.length === 3 &&
      leftChannels.every((channel, index) => Math.abs(channel - rightChannels[index]) <= 1);
  }

  function isLightGray(value) {
    const [red, green, blue] = colorChannels(value);
    return red >= 215 && green >= 220 && blue >= 225 &&
      Math.max(red, green, blue) - Math.min(red, green, blue) <= 25;
  }

  function hasNoBorder(style) {
    return [
      style.borderTopWidth,
      style.borderRightWidth,
      style.borderBottomWidth,
      style.borderLeftWidth
    ].every((width) => Number.parseFloat(width) === 0);
  }

  function isFlatLayer(element, surface) {
    const style = getComputedStyle(element);
    const surfaceStyle = getComputedStyle(surface);
    return hasNoBorder(style) &&
      style.boxShadow === "none" &&
      Number.parseFloat(style.borderTopLeftRadius) === 0 &&
      (isTransparent(style.backgroundColor) || sameColor(style.backgroundColor, surfaceStyle.backgroundColor));
  }

  function pseudoHasNoRing(element, pseudo) {
    const style = getComputedStyle(element, pseudo);
    return style.display === "none" || style.content === "none" ||
      (hasNoBorder(style) && style.boxShadow === "none" && isTransparent(style.backgroundColor));
  }

  function hasContinuousLightDivider(element) {
    const style = getComputedStyle(element);
    const after = getComputedStyle(element, "::after");
    const nativeDivider = Number.parseFloat(style.borderBottomWidth) >= 1 &&
      isLightGray(style.borderBottomColor);
    const generatedDivider = after.display !== "none" && after.content !== "none" &&
      Number.parseFloat(after.height) >= 1 &&
      isLightGray(after.backgroundColor) &&
      Number.parseFloat(after.left) === 0 && Number.parseFloat(after.right) === 0;
    const originalBlackBorderIsGone = Number.parseFloat(style.borderBottomWidth) === 0 ||
      isLightGray(style.borderBottomColor);
    return originalBlackBorderIsGone && (nativeDivider || generatedDivider);
  }

  function separatorIsRemoved(element) {
    const style = getComputedStyle(element);
    return style.display === "none" || style.visibility === "hidden" || style.opacity === "0" ||
      (hasNoBorder(style) && style.boxShadow === "none" && isTransparent(style.backgroundColor) &&
        pseudoHasNoRing(element, "::before") && pseudoHasNoRing(element, "::after"));
  }

  function check(name, condition, detail) {
    results.push({ name, passed: Boolean(condition), detail });
  }

  function render() {
    const passed = results.every((result) => result.passed);
    resultsPanel.dataset.status = passed ? "pass" : "fail";
    resultsPanel.innerHTML = `
      <strong>${passed ? "PASS" : "FAIL"}: ${results.filter((result) => result.passed).length}/${results.length} v1.3 checks</strong>
      <ol>${results.map((result) => `
        <li class="${result.passed ? "pass" : "fail"}">
          ${result.name}${result.passed || !result.detail ? "" : ` â€” ${result.detail}`}
        </li>`).join("")}</ol>`;
    window.v13FixtureResults = results;
    window.v13FixturePassed = passed;
    document.documentElement.dataset.fixtureStatus = passed ? "pass" : "fail";
  }

  function run() {
    const root = document.documentElement;
    const feed = document.getElementById("feed-shell");
    const tabs = document.getElementById("native-tablist");
    const status = document.getElementById("new-tweets-status");
    const pill = status.querySelector('[data-testid="pillLabel"]');
    const reply = document.getElementById("reply-button");
    const notificationContext = document.querySelector('#notification-item [data-testid="socialContext"]');
    const userText = document.querySelector('#notification-item [data-testid="tweetText"]');
    const backPath = document.querySelector('[data-testid="app-bar-back"] path');
    const leakedText = document.getElementById("leaked-white-text");
    const homeHeader = document.querySelector('[data-twitter-classic-home-header="on"]');
    const timelinePlus = document.getElementById("manage-timelines");
    const timelinePlusShell = document.getElementById("timeline-plus-shell");
    const homeMedia = document.getElementById("composer-media-control");
    const characterCounter = document.getElementById("home-character-counter");
    const characterCounterCircle = characterCounter.querySelector("circle");
    const homeComposer = document.getElementById("home-composer");
    const searchSeparator = document.getElementById("search-separator");
    const premiumOuter = document.getElementById("premium-shell-outer");
    const premiumInner = document.getElementById("premium-shell-inner");

    check("extension is enabled", root.dataset.twitterClassic === "on", `data-twitter-classic=${root.dataset.twitterClassic || "missing"}`);
    check("light theme attribute is applied", root.dataset.twitterClassicTheme === "light", `theme=${root.dataset.twitterClassicTheme || "missing"}`);
    check("De-Elon attribute is enabled", root.dataset.twitterClassicDeElon === "on", `de-elon=${root.dataset.twitterClassicDeElon || "missing"}`);
    check("Home feed remains visible", visible(feed), `display=${getComputedStyle(feed).display}`);
    check("For You and Following stay visible", visible(tabs) && visible(document.getElementById("tweet-item")), `tabs=${getComputedStyle(tabs).display}`);
    check("Home header has no sparkle control", Boolean(homeHeader) && !homeHeader.querySelector("button"));
    check(
      "timeline plus and its shell are completely flat",
      visible(timelinePlus) && isFlatLayer(timelinePlus, tabs) &&
        isFlatLayer(timelinePlusShell, tabs) &&
        pseudoHasNoRing(timelinePlus, "::before") && pseudoHasNoRing(timelinePlus, "::after"),
      `button=${getComputedStyle(timelinePlus).cssText}; shell-background=${getComputedStyle(timelinePlusShell).backgroundColor}`
    );
    check("composer media control is Twitter blue", isTwitterBlue(getComputedStyle(homeMedia).color), `color=${getComputedStyle(homeMedia).color}`);
    check("composer media control has no ring", getComputedStyle(homeMedia).borderTopWidth === "0px", `border=${getComputedStyle(homeMedia).border}`);
    check(
      "Home character counter is visible and Twitter blue",
      visible(characterCounter) && characterCounter.getBoundingClientRect().width >= 12 &&
        [getComputedStyle(characterCounter).color, getComputedStyle(characterCounter).borderTopColor, getComputedStyle(characterCounterCircle).stroke].some(isTwitterBlue),
      `display=${getComputedStyle(characterCounter).display}; color=${getComputedStyle(characterCounter).color}; stroke=${getComputedStyle(characterCounterCircle).stroke}`
    );
    check("composer has one continuous light-gray divider", hasContinuousLightDivider(homeComposer), `border=${getComputedStyle(homeComposer).borderBottom}; after=${getComputedStyle(homeComposer, "::after").backgroundColor}`);
    check("sidebar Search separator is removed", searchSeparator.hasAttribute("data-twitter-classic-search-separator") && separatorIsRemoved(searchSeparator), `marker=${searchSeparator.getAttribute("data-twitter-classic-search-separator")}; border=${getComputedStyle(searchSeparator).border}; background=${getComputedStyle(searchSeparator).backgroundColor}`);
    check("new-Tweets status pill remains visible", visible(status), `display=${getComputedStyle(status).display}`);
    check("status copy becomes Tweeted", /^tweeted$/i.test(pill.textContent.trim()), `text=${JSON.stringify(pill.textContent.trim())}`);
    check("reply button stays Reply", reply.textContent.trim() === "Reply", `text=${JSON.stringify(reply.textContent.trim())}`);
    check("reply has no fallback Tweet marker", !reply.hasAttribute("data-twitter-classic-fallback-label"), `fallback=${reply.getAttribute("data-twitter-classic-fallback-label")}`);
    check("notification system phrase is rewritten", notificationContext.textContent.trim() === "Recent Tweet from", `text=${JSON.stringify(notificationContext.textContent.trim())}`);
    check("user-authored notification Tweet stays untouched", userText.textContent.includes("Recent post from"), `text=${JSON.stringify(userText.textContent.trim())}`);
    check("back icon resolves to Twitter blue", isTwitterBlue(getComputedStyle(backPath).fill) || isTwitterBlue(getComputedStyle(backPath).color), `fill=${getComputedStyle(backPath).fill}`);
    check("Grok is hidden in De-Elon mode", !visible(document.getElementById("grok-nav")));
    check("Premium and its empty shells are hidden", !visible(document.getElementById("premium-nav")) && !visible(document.getElementById("subscription-card")) && !visible(premiumInner) && !visible(premiumOuter));
    check("white UI-text leak is normalized", isDarkInk(getComputedStyle(leakedText).color), `color=${getComputedStyle(leakedText).color}`);
    check("only Twitter/X fonts are requested", /TwitterChirp|-apple-system|Segoe UI|Roboto|Helvetica|Arial|sans-serif/i.test(getComputedStyle(document.body).fontFamily), `font=${getComputedStyle(document.body).fontFamily}`);
    render();
  }

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (document.documentElement.dataset.twitterClassic === "on" || attempts >= 30) {
      clearInterval(timer);
      requestAnimationFrame(() => requestAnimationFrame(run));
    }
  }, 100);
})();
