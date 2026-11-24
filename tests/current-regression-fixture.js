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

  async function checkModernHome() {
    const fixture = document.createElement("div");
    fixture.innerHTML = `
      <a id="new-logo" aria-label="X" href="/home"><svg data-icon="icon-logo-x"></svg></a>
      <div id="new-rail" style="--x-sidebar-expanded:1"><nav aria-label="Primary">
        <a href="/home" aria-current="page"><span><span aria-hidden="true"><span><span><svg data-icon="icon-home"></svg></span><span><svg data-icon="icon-home-fill"></svg></span></span></span><span><span>Home</span></span></span></a>
        <a href="/i/chat" aria-label="Chat">Chat</a>
        <a href="/i/history" aria-label="History">History</a>
        <a href="/i/connect_people">Follow</a>
        <a href="/i/calls">Calls</a>
        <a href="/i/jf/creators/studio">Creator Studio</a>
      </nav>
      <div id="new-rail-compose"><a id="sidebar-compose-post" href="/compose/post" aria-label="Post"><span>Post</span></a></div></div>
      <main>
        <header data-page-header>
          <h1 class="sr-only" style="position:absolute;width:1px;height:1px;clip-path:inset(50%);overflow:hidden">Home</h1>
          <div><div role="tablist">
            <button role="tab" data-pinned-timeline="for-you" aria-selected="true">For you<span data-tab-underline></span></button>
            <button role="tab" data-pinned-timeline="following" aria-selected="false">Following</button>
            <button role="tab" aria-selected="false">NFL</button>
            <button role="tab" aria-selected="false">NBA</button>
          </div><button aria-label="Manage timelines" style="margin:8px">+</button></div>
        </header>
        <div><div><div id="new-editor-mirror" aria-hidden="true" class="pointer-events-none col-start-1" style="font-size:17px;color:black"></div><textarea class="text-transparent!" aria-multiline="true" placeholder="What's happening?"></textarea></div>
          <div>
            <div data-truncated-list="fixture">
              <div data-truncated-item="1"><button aria-label="Add media"><svg data-icon="icon-photo"></svg></button></div>
              <div data-truncated-item="2"><button aria-label="Generate image"><svg data-icon="icon-logo-grok"></svg></button></div>
              <div data-truncator="2"><button aria-label="More">…</button></div>
            </div>
            <div><div id="new-counter-slot" class="flex items-center gap-1" style="display:flex"></div><button id="new-submit" data-slot="xds-button" disabled>Post</button></div>
          </div>
        </div>
        <button id="new-pill" aria-label="Show 35 posts">Show <b>35</b> posts</button>
        <article>
          <button id="new-explain" data-slot="xds-button" aria-label="Explain this post"><svg data-icon="icon-logo-grok"></svg></button>
          <button id="new-translate" data-slot="xds-button" title="Translate with Grok"><svg data-icon="icon-logo-grok"></svg><span>Show translation</span></button>
          <button id="new-translation-settings" aria-label="Translation settings">⚙</button>
          <div id="new-video" class="bg-black tabular-nums" style="background-color:black">
            <video preload="none"></video>
            <div id="new-video-controls" class="group/controls" style="background-image:linear-gradient(transparent, #000b)">
              <button id="new-video-mute" class="text-white" aria-label="Unmute" style="color:white">Sound</button>
              <span id="new-video-time" class="text-on-color" style="color:white;background-color:#000c">00:06 / 01:10</span>
            </div>
          </div>
          <button id="new-bookmark">Bookmark</button>
          <button id="new-retweet" data-slot="xds-menu-trigger" aria-label="12 reposts. Repost"></button>
          <p><a href="/i/grok" id="new-feed-link">A link about Grok</a></p>
          <textarea id="new-reply-editor" aria-label="Post your reply" placeholder="Post your reply"></textarea>
          <button id="new-reply-submit">Reply</button>
        </article>
        <ul>
          <li id="new-prompt-slot"><div id="new-prompt" role="link" data-href="/fixture/status/1" style="min-height:350px"><article><div class="whitespace-pre-wrap" dir="auto" lang="en"><a href="/grok">@grok</a> can you explain this?</div></article></div></li>
          <li id="new-mention" role="link" data-testid="mentionGrokRow" aria-label="Conversation about Grok" data-href="/fixture/status/2"><article><div class="whitespace-pre-wrap" dir="auto" lang="en">I read a thread about <a href="/grok">@grok</a> today.</div></article></li>
          <li id="new-quote" role="link" data-href="/fixture/status/3"><article><div data-slot="embedded-tweet-frame"><div class="whitespace-pre-wrap" dir="auto" lang="en"><a href="/grok">@grok</a> please explain</div></div></article></li>
        </ul>
      </main>
      <aside><section id="new-news"><header><h2>Today’s News</h2></header></section>
        <section id="new-trends"><h2>What’s happening</h2></section>
        <nav aria-label="Footer"><span>© 2026 X Corp.</span></nav></aside>
      <div id="new-grok-dock" data-slot="xds-dock-window"><button data-slot="xds-dock-launcher" aria-label="Expand Grok">Grok</button></div>
      <div id="new-chat-dock" data-slot="xds-dock-window"><button data-slot="xds-dock-launcher" aria-label="Chat">Chat</button></div>
      <div id="new-profile-hover" role="dialog" data-slot="xds-preview-card-popup">
        <img id="new-hover-cover" src="/assets/twitter-login-background.png" alt="Profile cover" width="200" height="52">
        <button id="new-hover-message" aria-label="Message">Message</button>
        <button id="new-hover-follow">Follow</button>
        <p id="new-hover-bio">Profile Summary</p>
        <button id="new-hover-summary"><svg data-icon="icon-logo-grok"></svg><span>Profile Summary</span></button>
      </div>
    `;
    document.body.append(fixture);
    const find = (selector) => fixture.querySelector(selector);
    const visible = (selector) => Boolean(find(selector)?.getClientRects().length);
    await waitFor(() => find("#new-submit")?.textContent === "Tweet" && find("#new-news")?.hasAttribute("data-twitter-classic-post-twitter"));

    await check("New Home restores the bird, Home glyph, heading and selected tab", () =>
      style(find("#new-logo")).backgroundImage.includes("twitter-bird.svg") &&
      style(find("#new-logo svg")).visibility === "hidden" &&
      find("[data-twitter-classic-home-icon-state=filled]")?.querySelectorAll("svg[data-twitter-classic-native-home-icon]").length === 2 &&
      style(find("h1")).position === "static" &&
      style(find("h1")).clipPath === "none" &&
      blue(style(find("[data-tab-underline]")).backgroundColor));
    await check("Home tabs align, expanded sidebar has a right gutter, and footer restores Twitter, Inc.", () => {
      const rail = find("#new-rail");
      const nav = rail.querySelector("nav");
      const expanded = parseFloat(style(nav).paddingInlineEnd);
      rail.style.setProperty("--x-sidebar-expanded", "0");
      const compact = parseFloat(style(nav).paddingInlineEnd);
      rail.style.setProperty("--x-sidebar-expanded", "1");
      const plus = find('[aria-label="Manage timelines"]').getBoundingClientRect();
      const tabs = find('main [role="tablist"]').getBoundingClientRect();
      return expanded === 26 && compact === 12 && Math.abs(plus.top - tabs.top) < 2 &&
        find('nav[aria-label="Footer"]').textContent.trim() === "© 2026 Twitter, Inc.";
    });
    await check("Modern composer retains native hints, TwitterChirp and blue Tweet actions", () =>
      find("textarea").placeholder === "What's happening?" &&
      style(find("textarea")).fontFamily.includes("TwitterChirp") &&
      blue(style(find('[aria-label="Add media"] svg')).color) &&
      blue(style(find("#new-submit")).backgroundColor) && find("#new-submit").disabled &&
      find("#sidebar-compose-post").getAttribute("aria-label") === "Tweet" &&
      find("#new-pill").textContent === "Show 35 Tweets" &&
      find("#new-retweet").getAttribute("aria-label") === "12 retweets. Retweet");
    await check("The native composer hint is muted and disappears when typing", () => {
      const editor = find("textarea");
      const muted = style(editor, "::placeholder").color === "rgb(101, 119, 134)";
      const startsWithHint = editor.value === "" && editor.matches(":placeholder-shown");
      editor.value = "Fixture draft";
      const typingHidesHint = !editor.matches(":placeholder-shown");
      editor.value = "";
      return muted && startsWithHint && typingHidesHint && editor.matches(":placeholder-shown");
    });
    await check("Modern composing shows one readable text layer with the original caret", () => {
      const editor = style(find("textarea"));
      const mirror = style(find("#new-editor-mirror"));
      return transparent(editor.color) && blue(editor.caretColor) && ink(mirror.color) && editor.fontSize === mirror.fontSize;
    });
    await check("The early counter starts on the first character and hands off to the native warning", async () => {
      const editor = find("textarea");
      const slot = find("#new-counter-slot");
      const early = () => slot.querySelector("[data-twitter-classic-early-counter]");
      const type = (text) => {
        editor.value = text;
        editor.dispatchEvent(new InputEvent("input", { bubbles: true }));
      };
      if (early()) return false;
      type("a");
      await waitFor(early);
      const earlyProgress = parseFloat(early().style.getPropertyValue("--twitter-counter-progress"));
      if (!early().getClientRects().length || earlyProgress <= 0 || earlyProgress >= 1) return false;
      type("a".repeat(266));
      slot.insertAdjacentHTML("beforeend", '<div role="progressbar" aria-valuenow="266" aria-valuemax="280"><svg><circle r="9" stroke="currentColor"></circle><circle r="9" stroke="currentColor" stroke-dasharray="56.5" stroke-dashoffset="2.8"></circle></svg></div>');
      const native = slot.querySelector('[role="progressbar"]');
      await waitFor(() => !early() && native.dataset.twitterClassicCounterState === "warning");
      const nativeArc = native.querySelector('[data-twitter-classic-counter-arc]');
      const preserved = nativeArc.getAttribute("stroke-dashoffset") === "2.8";
      native.remove();
      type("");
      await waitFor(() => !early());
      return preserved;
    });
    await check("Show translation keeps its native control and settings with a neutral icon", () => {
      const button = find("#new-translate");
      return visible("#new-translate") && visible("#new-translation-settings") && button.textContent === "Show translation" &&
        button.querySelectorAll('[data-twitter-classic-translation-icon]').length === 1 &&
        style(button.querySelector('[data-twitter-classic-translation-original]')).display === "none";
    });
    await check("Playback chrome keeps white controls and dark overlays in Light and Dim", async () => {
      const readable = () => style(find("#new-video")).backgroundColor === "rgb(0, 0, 0)" &&
        style(find("#new-video-mute")).color === "rgb(255, 255, 255)" &&
        style(find("#new-video-time")).color === "rgb(255, 255, 255)" &&
        style(find("#new-video-time")).backgroundColor === "rgba(0, 0, 0, 0.8)" &&
        style(find("#new-video-controls")).backgroundImage.includes("linear-gradient");
      const lightMode = readable();
      await window.fixtureSetOptions({ classicDark: true });
      await waitFor(() => document.documentElement.dataset.twitterClassicTheme === "dim");
      const dimMode = readable();
      await window.fixtureSetOptions({ classicDark: false });
      await waitFor(() => document.documentElement.dataset.twitterClassicTheme === "light");
      return lightMode && dimMode;
    });
    await check("Inline reply hint is restored without rewriting the draft or Reply button", async () => {
      const editor = find("#new-reply-editor");
      const restored = editor.matches(":placeholder-shown") && editor.placeholder === "Tweet your reply" &&
        editor.getAttribute("aria-label") === "Tweet your reply";
      editor.value = "Post your reply";
      editor.placeholder = "Post your reply";
      await waitFor(() => editor.placeholder === "Tweet your reply");
      return restored && editor.value === "Post your reply" && find("#new-reply-submit").textContent === "Reply";
    });
    await check("De-Elon removes new surfaces while keeping Messages, History, trends and posts", () =>
      ["#new-news", "#new-grok-dock", "#new-explain", '[aria-label="Generate image"]',
        'nav a[href="/i/calls"]', 'nav a[href="/i/connect_people"]', 'nav a[href*="/creators/studio"]'].every((selector) => !visible(selector)) &&
      ["#new-chat-dock", "#new-trends", "#new-bookmark", "#new-feed-link", '[aria-label="Manage timelines"]'].every(visible) &&
      find('nav a[href="/i/chat"]').textContent === "Messages" &&
      find('nav a[href="/i/history"]').textContent === "History");
    await check("Hover card stays visible and only its Grok Profile Summary action is hidden", () =>
      !visible("#new-hover-summary") &&
      ["#new-profile-hover", "#new-hover-cover", "#new-hover-message", "#new-hover-follow", "#new-hover-bio"].every(visible));
    await check("Only the core Home tabs show unless an extra timeline is active", () => {
      const extra = find('[role="tab"]:not([data-pinned-timeline])');
      const hasCoreTabs = ["for-you", "following"].every((id) => visible(`[data-pinned-timeline="${id}"]`));
      const hiddenByDefault = !extra.getClientRects().length;
      extra.setAttribute("aria-selected", "true");
      const visibleWhileActive = Boolean(extra.getClientRects().length);
      extra.setAttribute("aria-selected", "false");
      return hasCoreTabs && hiddenByDefault && visibleWhileActive;
    });
    await check("A direct Grok prompt folds into one short row while mentions and quotes stay visible", () => {
      const button = find("#new-prompt-slot [data-twitter-classic-grok-toggle]");
      const collapsed = !visible("#new-prompt") && find("#new-prompt-slot").getBoundingClientRect().height < 70;
      button.click();
      const expanded = visible("#new-prompt") && button.getAttribute("aria-expanded") === "true";
      button.click();
      return collapsed && expanded && !visible("#new-prompt") && visible("#new-mention") && visible("#new-quote") &&
        find("#new-mention a").textContent === "@grok";
    });

    await window.fixtureSetOptions({ deElon: false });
    await waitFor(() => document.documentElement.dataset.twitterClassicDeElon === "off");
    await check("Turning off De-Elon brings back the native extra tabs, toolbar and dock", () =>
      ['[role="tab"]:not([data-pinned-timeline])', "#new-news", "#new-grok-dock", "#new-explain", '[aria-label="Generate image"]'].every(visible));
    await check("Turning off De-Elon displays native Grok prompt rows", () =>
      visible("#new-prompt") && !visible("#new-prompt-slot [data-twitter-classic-grok-toggle]"));
    await check("Turning off De-Elon restores the Grok Profile Summary action", () => visible("#new-hover-summary"));
    fixture.remove();
    await window.fixtureSetOptions({ deElon: true });
    await waitFor(() => document.documentElement.dataset.twitterClassicDeElon === "on");
  }

  async function checkModernProfile() {
    const fixture = document.createElement("main");
    fixture.innerHTML = `
      <div class="profile-content">
        <div id="verification-banner-wrap"><div data-slot="xds-callout" role="status"><p>You aren’t verified yet</p><a href="/i/premium_sign_up">Get verified</a><button aria-label="Dismiss">×</button></div></div>
        <span id="profile-verified-badge" role="img" aria-label="Verified account">✓</span>
        <div role="tablist">
          <button role="tab" aria-haspopup="menu" aria-selected="true">Posts</button>
          <a role="tab" href="/fixture/with_replies">Replies</a>
          <a role="tab" href="/fixture/reposts" aria-selected="false">Reposts</a>
          <a role="tab" href="/fixture/media">Media</a>
          <a role="tab" href="/fixture/articles" aria-selected="false">Articles</a>
        </div>
      </div>
    `;
    document.body.append(fixture);
    history.pushState(null, "", "/fixture");
    window.dispatchEvent(new PopStateEvent("popstate"));
    const list = fixture.querySelector('[role="tablist"]');
    const visible = (element) => Boolean(element.getClientRects().length);
    const visibleLabels = () => [...list.children].filter(visible).map((tab) => tab.textContent).join(" | ");
    await waitFor(() => list.hasAttribute("data-twitter-classic-profile-tabs"));
    await check("Profiles keep Tweets, Tweets & replies and Media alongside any native Likes tab", () => {
      const initial = visibleLabels() === "Tweets | Tweets & replies | Media";
      const likes = document.createElement("a");
      likes.setAttribute("role", "tab");
      likes.href = "/fixture/likes";
      likes.textContent = "Likes";
      list.append(likes);
      return initial && visibleLabels() === "Tweets | Tweets & replies | Media | Likes" &&
        list.firstElementChild.getAttribute("aria-haspopup") === "menu";
    });
    await check("De-Elon collapses the verification promo wrapper and preserves the badge and profile", () =>
      !visible(fixture.querySelector("#verification-banner-wrap")) &&
      visible(fixture.querySelector("#profile-verified-badge")) && visible(list));
    await window.fixtureSetOptions({ deElon: false });
    await waitFor(() => document.documentElement.dataset.twitterClassicDeElon === "off");
    await check("Disabling De-Elon restores the additional profile tabs and verification promo", () =>
      visibleLabels().includes("Retweets") && visibleLabels().includes("Articles") && visible(fixture.querySelector("#verification-banner-wrap")));
    fixture.remove();
    await window.fixtureSetOptions({ deElon: true });
    await goHome();
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
    await check("Current Chat shell is themed through its internal marker", () =>
      chatReady() && light(style(chatQuery('[data-xchat-root="route"]')).backgroundColor) &&
      chatRoot().querySelectorAll('link[href*="twitter-chat.css"]').length === 1);
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
    await checkModernHome();
    await checkModernProfile();
    const notifications = document.createElement("main");
    notifications.innerHTML = `
      <div role="link" aria-label="New post notifications for Fixture User"><span>New post notifications for <b>Fixture User</b> and 2 others</span> · 2h</div>
      <article><div dir="auto" lang="en" class="whitespace-pre-wrap">New post notifications for my own group are distracting.</div></article>
    `;
    history.pushState(null, "", "/notifications");
    document.body.append(notifications);
    window.dispatchEvent(new PopStateEvent("popstate"));
    await waitFor(() => document.documentElement.dataset.twitterClassicPage === "notifications");
    await check("Modern notification prefixes restore Tweet wording and keep names and post text intact", () => {
      const row = notifications.querySelector('[role="link"]');
      return row.getAttribute("aria-label") === "New Tweet notifications for Fixture User" &&
        row.textContent === "New Tweet notifications for Fixture User and 2 others · 2h" &&
        row.querySelector("b").textContent === "Fixture User" &&
        notifications.querySelector("article").textContent === "New post notifications for my own group are distracting.";
    });
    notifications.remove();
    await goHome();
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
