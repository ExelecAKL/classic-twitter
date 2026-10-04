(() => {
  "use strict";
  const results = [];
  const errors = [];
  window.addEventListener("error", (event) => errors.push(event.message));
  const query = (selector) => document.querySelector(selector);
  const style = (element, pseudo) => getComputedStyle(element, pseudo);
  const channels = (color) => color.match(/[\d.]+/g)?.slice(0, 3).map(Number) || [];
  const transparent = (color) => color === "transparent" || color === "rgba(0, 0, 0, 0)";
  const blue = (color) => {
    const [r, g, b] = channels(color);
    return r >= 20 && r <= 40 && g >= 145 && g <= 170 && b >= 235;
  };
  const light = (color) => channels(color).length === 3 && channels(color).every((value) => value >= 215);
  const ink = (color) => channels(color).length === 3 && channels(color).every((value) => value < 130);
  const tint = (color) => {
    const [r, g, b] = channels(color);
    return b > r && g > r;
  };
  const dim = (color) => {
    const [r, g, b] = channels(color);
    return r > 0 && r <= 65 && g <= 75 && b <= 90 && b > r;
  };

  async function waitFor(predicate, timeout = 6000) {
    const deadline = performance.now() + timeout;
    do {
      if (predicate()) {
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 40));
    } while (performance.now() < deadline);
    throw new Error("timed out waiting for runtime reconciliation");
  }

  async function check(name, test) {
    try {
      const detail = await test();
      if (detail !== true) throw new Error(typeof detail === "string" ? detail : "condition was false");
      results.push({ name, passed: true });
    } catch (error) {
      results.push({ name, passed: false, detail: error.message });
    }
  }

  function chatRoot() { return query("#chat-shadow-host").shadowRoot; }
  function chatQuery(selector) { return chatRoot().querySelector(selector); }
  function chatReady() {
    return query("#chat-shadow-host").getAttribute("data-twitter-classic-chat-host") === "on" &&
      Boolean(chatRoot().querySelector('link[href*="twitter-chat.css"]')?.sheet);
  }

  async function goHome() {
    document.documentElement.dataset.fixturePage = "home";
    history.pushState(null, "", "/home");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await waitFor(() => document.documentElement.dataset.twitterClassicPage === "home");
  }

  async function run() {
    await waitFor(() => document.documentElement.dataset.twitterClassicReady === "ready");
    if (document.documentElement.dataset.fixturePage !== "home") await goHome();

    await check("Carousel keeps full photo sizes and absolute background layers", () => {
      const carousel = query("#media-carousel").getBoundingClientRect();
      const photo = query("#photo-one").getBoundingClientRect();
      const image = query("#photo-one-bg").getBoundingClientRect();
      return carousel.width > 400 && photo.width > 200 && photo.height > 200 &&
        Math.abs(photo.width - image.width) < 2 && Math.abs(photo.height - image.height) < 2 &&
        style(query("#photo-one-bg")).position === "absolute" &&
        style(query("#photo-one-bg")).backgroundImage.includes("twitter-login-background.png") &&
        parseFloat(style(query("#photo-one-spacer")).paddingBottom) > 200;
    });
    await check("Media tablist is not marked as the Home tab strip", () =>
      !query("#media-tablist").hasAttribute("data-twitter-classic-native-tabs") &&
      query('#home-main [role="tablist"]').hasAttribute("data-twitter-classic-native-tabs"));
    await check("Tweet body and media-action copy are untouched", () =>
      query("#media-caption").textContent === "Two photos with their original carousel dimensions." &&
      query("#tweet-actions").textContent === "2 replies5 retweets118 likes");

    query("#explore-nav").focus();
    await check("Navigation keyboard focus paints only one blue-tinted pill", () =>
      transparent(style(query("#explore-nav")).backgroundColor) &&
      tint(style(query("#explore-pill")).backgroundColor) &&
      transparent(style(query("#explore-pill > div")).backgroundColor));
    query("#search-input").focus();
    await check("Focused search has exactly one rounded blue border", () => {
      const ringOwners = ["search-form", "search-pill", "search-inner", "search-input"].map((id) => query(`#${id}`)).filter((element) => {
        const computed = style(element);
        return (parseFloat(computed.borderTopWidth) > 0 && blue(computed.borderTopColor)) ||
          computed.boxShadow !== "none" || parseFloat(computed.outlineWidth) > 0;
      });
      return ringOwners.length === 1 && ringOwners[0].getAttribute("data-twitter-classic-search-pill") === "on";
    });
    await check("Recent profile background image survives its transparent overlay", () =>
      style(query("#recent-avatar")).backgroundImage.includes("icon-128.png") &&
      style(query("#recent-avatar")).zIndex === "-1" &&
      style(query("#recent-avatar img")).opacity === "0" &&
      transparent(style(query("#recent-avatar-overlay")).backgroundColor) &&
      transparent(style(query("#recent-avatar").parentElement).backgroundColor));
    await check("Selected search option uses a blue-tinted row without nested fills", () =>
      tint(style(query("#selected-option")).backgroundColor) &&
      transparent(style(query("#recent-option .avatar")).backgroundColor));

    await check("Empty Draft.js editor shows one muted native hint", () => {
      const placeholder = query("#draft-placeholder");
      const computed = style(placeholder);
      const [red] = channels(computed.color);
      return placeholder.textContent === "What’s happening?" && computed.display !== "none" &&
        computed.visibility === "visible" && red >= 70 && red <= 170 &&
        !query("#editor").hasAttribute("data-twitter-classic-editor-fallback-placeholder") &&
        ["none", "normal", '""'].includes(style(query("#editor"), "::before").content);
    });
    await check("Counter retains a gray track and native proportional blue arc", () =>
      style(query("#counter")).display !== "none" &&
      parseFloat(style(query("#counter")).borderTopWidth) === 0 &&
      style(query("#counter-track")).stroke !== style(query("#counter-progress")).stroke &&
      blue(style(query("#counter-progress")).stroke) &&
      query("#counter-progress").getAttribute("stroke-dashoffset") === "45.23893421169302" &&
      Math.abs(parseFloat(style(query("#counter-progress")).strokeDashoffset) - 45.23893421169302) < 0.001);

    for (const [state, length, percentage, color, offset] of [
      ["warning", 270, "96.43", "rgb(255, 212, 0)", "1.7951958020513104"],
      ["danger", 281, "100.36", "rgb(244, 33, 46)", "0"]
    ]) {
      query("#editor").textContent = "a".repeat(length);
      query("#draft-placeholder").style.display = "none";
      query("#counter").setAttribute("aria-valuenow", percentage);
      query("#counter-progress").setAttribute("stroke", color);
      query("#counter-progress").setAttribute("stroke-dashoffset", offset);
      query("#editor").dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: "a" }));
      await waitFor(() => query("#counter").getAttribute("data-twitter-classic-counter-state") === state);
      await check(`Counter becomes ${state} while preserving native dash geometry`, () => {
        const [red, green, blueChannel] = channels(style(query("#counter-progress")).stroke);
        const stateColor = state === "warning"
          ? red >= 220 && green >= 100 && green <= 230 && blueChannel < 80
          : red >= 200 && green < 90 && blueChannel < 140;
        return stateColor && query("#counter-progress").getAttribute("stroke-dashoffset") === offset &&
          style(query("#counter-track")).stroke !== style(query("#counter-progress")).stroke;
      });
    }
    await check("Typing leaves user text intact and removes the empty-editor hint", () =>
      query("#editor").textContent === "a".repeat(281) &&
      style(query("#draft-placeholder")).display === "none" &&
      query("#editor").getAttribute("data-twitter-classic-editor-empty") === "off");
    const nativePlaceholder = query("#draft-placeholder");
    nativePlaceholder.remove();
    query("#editor").replaceChildren();
    await waitFor(() => query("#editor").getAttribute("data-twitter-classic-editor-empty") === "on");
    await check("Clearing text through a removal-only rerender restores the hint", () =>
      query("#editor").getAttribute("data-twitter-classic-editor-native-placeholder-present") === "off" &&
      /happening/.test(style(query("#editor"), "::before").content));
    nativePlaceholder.style.display = "";
    query("#editor-shell").prepend(nativePlaceholder);
    query("#counter").setAttribute("aria-valuenow", "10");
    query("#counter-progress").setAttribute("stroke", "rgb(29, 155, 240)");
    query("#counter-progress").setAttribute("stroke-dashoffset", "45.23893421169302");

    document.documentElement.dataset.fixturePage = "chat";
    history.pushState(null, "", "/i/chat");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await waitFor(() => document.documentElement.dataset.twitterClassicPage === "messages" && chatReady());
    await check("Current Chat open shadow root receives its local theme sheet", () =>
      chatReady() && chatRoot().querySelectorAll('link[href*="twitter-chat.css"]').length === 1);
    await check("Chat panels use light surfaces and readable dark text", () =>
      ["chat-root", "chat-inbox", "chat-screen", "chat-screen-header", "chat-messages", "chat-composer"].every((id) =>
        light(style(chatQuery(`#${id}`)).backgroundColor) && ink(style(chatQuery(`#${id}`)).color)));
    await check("Chat search, incoming messages and editor use light gray", () =>
      ["chat-search", "chat-input-shell", "incoming-bubble"].every((id) => light(style(chatQuery(`#${id}`)).backgroundColor)));
    await check("Outgoing Chat keeps Twitter blue and white copy", () =>
      blue(style(chatQuery("#outgoing-bubble")).backgroundColor) &&
      style(chatQuery("#outgoing-bubble span")).color === "rgb(255, 255, 255)");
    await check("Chat overlay shadow root gets a readable light palette", () => {
      const host = query("#chat-overlays-host");
      const dialog = host.shadowRoot.querySelector("#shadow-dialog");
      return host.getAttribute("data-twitter-classic-chat-host") === "on" &&
        light(style(dialog).backgroundColor) && ink(style(dialog).color);
    });
    await check("Chat profile keeps the native background image and opacity", () =>
      style(chatQuery("#chat-avatar")).backgroundImage.includes("icon-128.png") &&
      style(chatQuery("#chat-avatar img")).opacity === "0");

    await window.fixtureSetOptions({ classicDark: true });
    await waitFor(() => document.documentElement.dataset.twitterClassicTheme === "dim" &&
      query("#chat-shadow-host").getAttribute("data-twitter-classic-theme") === "dim");
    await check("Classic dark mode reaches Chat shadow panels as navy", () =>
      ["chat-root", "chat-inbox", "chat-screen", "chat-composer"].every((id) => dim(style(chatQuery(`#${id}`)).backgroundColor)));
    window.fixtureMountChat();
    await waitFor(chatReady);
    await check("Chat rerender reinjects one theme sheet and retains navy", () =>
      chatRoot().querySelectorAll('link[href*="twitter-chat.css"]').length === 1 &&
      dim(style(chatQuery("#chat-root")).backgroundColor) &&
      chatQuery("#incoming-bubble").textContent === "Incoming message");
    await window.fixtureSetOptions({ classicDark: false });
    await waitFor(() => document.documentElement.dataset.twitterClassicTheme === "light");
    await check("Switching back to light restores shadow Chat surfaces", () =>
      light(style(chatQuery("#chat-root")).backgroundColor) && ink(style(chatQuery("#chat-root")).color));
    await goHome();
    await check("SPA return preserves the Home media carousel and native tabs", () =>
      query("#photo-one").getBoundingClientRect().height > 200 &&
      !query("#media-tablist").hasAttribute("data-twitter-classic-native-tabs") &&
      query('#home-main [role="tablist"]').getAttribute("data-twitter-classic-native-tabs") === "on");
    await check("No fixture runtime errors", () => errors.length ? errors.join("; ") : true);
  }

  run().catch((error) => results.push({ name: "Fixture completion", passed: false, detail: error.message })).finally(() => {
    const passed = results.every((result) => result.passed);
    window.currentFixtureResults = results;
    window.currentFixturePassed = passed;
    document.documentElement.dataset.currentFixtureStatus = passed ? "pass" : "fail";
    const panel = query("#current-results");
    panel.dataset.status = passed ? "pass" : "fail";
    panel.replaceChildren();
    const summary = document.createElement("strong");
    summary.textContent = `${passed ? "PASS" : "FAIL"}: ${results.filter((result) => result.passed).length}/${results.length} current UI checks`;
    const list = document.createElement("ol");
    for (const result of results) {
      const item = document.createElement("li");
      item.dataset.passed = String(result.passed);
      item.textContent = `${result.passed ? "PASS" : "FAIL"} ${result.name}${result.detail ? `: ${result.detail}` : ""}`;
      list.append(item);
    }
    panel.append(summary, list);
    panel.style.borderColor = passed ? "#17bf63" : "#e0245e";
  });
})();
