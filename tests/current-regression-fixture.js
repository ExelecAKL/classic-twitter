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
          <div id="new-translated-status"><span><svg><path d="m9.27 15.28 7.98-5.92"/></svg></span><span>Translated from Spanish</span><button>Show original</button></div>
          <div id="new-video" class="bg-black tabular-nums" style="background-color:black">
            <video preload="none"></video>
            <div id="new-video-controls" class="group/controls" style="background-image:linear-gradient(transparent, #000b)">
              <button id="new-video-mute" class="text-white" aria-label="Unmute" style="color:white">Sound</button>
              <span id="new-video-time" class="text-on-color" style="color:white;background-color:#000c">00:06 / 01:10</span>
              <div id="new-volume-popup" role="dialog" aria-label="Volume slider">
                <div id="new-volume-group" role="group" data-orientation="vertical" class="text-white" style="background:white">
                  <div data-orientation="vertical">
                    <div id="new-volume-track" data-orientation="vertical" class="bg-current/30">
                      <div id="new-volume-fill" data-orientation="vertical" class="bg-current" style="height:37%;background:white"></div>
                    </div>
                    <div id="new-volume-thumb" data-orientation="vertical" class="bg-current" style="bottom:37%;background:white">
                      <input type="range" aria-label="Volume slider" value="37">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button id="new-bookmark">Bookmark</button>
          <button id="new-retweet" data-slot="xds-menu-trigger" aria-label="12 reposts. Repost"></button>
          <p><a href="/i/grok" id="new-feed-link">A link about Grok</a></p>
          <textarea id="new-reply-editor" aria-label="Post your reply" placeholder="Post your reply"></textarea>
          <button id="new-reply-submit">Reply</button>
        </article>
        <ul>
          <li id="new-prompt-slot" data-index="1" style="min-height:350px"><div style="min-height:350px"><div id="new-prompt" role="link" data-href="/fixture/status/1"><article><div class="whitespace-pre-wrap" dir="auto" lang="en"><a href="/grok">@grok</a> can you explain this?</div></article></div></div></li>
          <li id="new-mention" role="link" data-testid="mentionGrokRow" aria-label="Conversation about Grok" data-href="/fixture/status/2"><article><div class="whitespace-pre-wrap" dir="auto" lang="en">I read a thread about <a href="/grok">@grok</a> today.</div></article></li>
          <li id="new-quote" role="link" data-href="/fixture/status/3"><article><div data-slot="embedded-tweet-frame"><div class="whitespace-pre-wrap" dir="auto" lang="en"><a href="/grok">@grok</a> please explain</div></div></article></li>
          <li id="new-ad-slot" data-index="4"><div id="new-paid-post" role="link" data-href="/fixture/status/4" style="min-height:480px"><article><p>Paid campaign</p><a href="https://example.com" aria-label="Ad from example.com Learn more">Learn more</a></article></div></li>
          <li><div id="new-organic-ai-post" role="link" data-href="/fixture/status/5"><article><div class="whitespace-pre-wrap" dir="auto" lang="en">Ordinary discussion of ads and AI.</div></article></div></li>
          <li><div id="new-organic-quote-post" role="link" data-href="/fixture/status/6"><article><p>Discussing an ad</p><div data-slot="embedded-tweet-frame"><a href="https://example.com" aria-label="Ad from example.com Learn more">Quoted ad</a></div></article></div></li>
          <li id="new-ad-disclosure-slot" data-index="7"><div id="new-ad-disclosure-post" role="link" data-href="/fixture/status/7" style="min-height:480px"><article><p>Paid campaign</p><a href="https://example.com/campaign" target="_blank" rel="noopener noreferrer">Ad from example.com</a></article></div></li>
          <li><div id="new-organic-linked-text" role="link" data-href="/fixture/status/8"><article><div class="whitespace-pre-wrap" dir="auto" lang="en"><a href="https://example.com/campaign">Ad from example.com</a></div></article></div></li>
          <li id="new-badge-ad-slot" data-index="9" style="min-height:520px"><div id="new-badge-ad" role="link" data-href="/fixture/status/9"><article>
            <div class="@container/post-actions"><div><a href="/fixture">Work tutorial</a></div>
              <div class="-me-[5px] flex shrink-0 items-center gap-1 whitespace-nowrap"><div><span id="new-ad-header-badge">Ad</span></div><button disabled aria-hidden="true">•••</button></div>
            </div><div class="whitespace-pre-wrap" dir="auto" lang="en">Three models. Three different strengths.</div>
            <span>There’s a new version of this post</span>
          </article></div></li>
          <li><div id="new-ad-negative-control" role="link" data-href="/fixture/status/10"><article>
            <div class="@container/post-actions"><div><a href="/ad">Ad</a></div><div><button aria-label="More">•••</button></div></div>
            <div class="whitespace-pre-wrap" dir="auto" lang="en">Sponsored</div>
            <div data-slot="embedded-tweet-frame"><article><div><span>Ad</span><button aria-label="More">•••</button></div></article></div>
          </article></div></li>
        </ul>
        <div id="legacy-ad-post" data-testid="cellInnerDiv"><article data-testid="tweet">
          <div><div aria-label="Promoted"></div><div><button data-testid="caret">•••</button></div></div>
          <div data-testid="tweetText">No external disclosure link on this ad.</div>
        </article></div>
        <div id="legacy-tracked-ad" data-testid="placementTracking"><article data-testid="tweet"><div data-testid="tweetText">Tracked promotion</div></article></div>
      </main>
      <aside><section id="new-news"><header><h2>Today’s News</h2></header></section>
        <section id="new-trends"><h2>What’s happening</h2></section>
        <nav aria-label="Footer"><span>© 2026 X Corp.</span></nav></aside>
      <div id="new-grok-dock" data-slot="xds-dock-window"><button data-slot="xds-dock-launcher" aria-label="Expand Grok">Grok</button></div>
      <div id="new-chat-dock" data-slot="xds-dock-window"><button data-slot="xds-dock-launcher" aria-label="Chat"><svg viewBox="0 0 24 24"></svg></button><div id="new-chat-drawer-host"></div></div>
      <button id="legacy-chat-launcher" data-testid="chat-drawer-main" aria-label="Chat"><svg viewBox="0 0 24 24"></svg></button>
      <div id="legacy-chat-drawer" data-testid="chat-drawer-main"><div id="legacy-chat-drawer-host" data-testid="xchatEmbedDrawer"></div></div>
      <div id="new-profile-hover" role="dialog" data-slot="xds-preview-card-popup">
        <img id="new-hover-cover" src="/assets/twitter-login-background.png" alt="Profile cover" width="200" height="52">
        <button id="new-hover-message" aria-label="Message">Message</button>
        <button id="new-hover-follow" aria-label="Follow @fixture">Follow</button>
        <button id="legacy-hover-follow" data-testid="123-follow">Follow</button>
        <button id="new-hover-following" aria-label="Unfollow @another" data-testid="456-unfollow">Following</button>
        <p id="new-hover-bio">Profile Summary</p>
        <button id="new-hover-summary"><svg data-icon="icon-logo-grok"></svg><span>Profile Summary</span></button>
      </div>
    `;
    document.body.append(fixture);
    const find = (selector) => fixture.querySelector(selector);
    const visible = (selector) => Boolean(find(selector)?.getClientRects().length);
    const drawers = ["#new-chat-drawer-host", "#legacy-chat-drawer-host"].map((selector) => {
      const shadow = find(selector).attachShadow({ mode: "open" });
      shadow.innerHTML = `
        <div data-xchat-root="drawer" style="background-color:black;color:white">
          <h2 data-testid="dm-inbox-title">Chat</h2>
          <div data-testid="dm-cold-inbox-suggestion-42"><p>You interact a lot on X</p></div>
          <div data-testid="dm-chat-preview">You interact a lot on X</div>
        </div>`;
      return shadow;
    });
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
    await check("Composer digits match native typography and stay visible when backspacing from warning", async () => {
      const editor = find("textarea");
      const slot = find("#new-counter-slot");
      const early = () => slot.querySelector("[data-twitter-classic-early-counter]");
      const remaining = () => early()?.querySelector("[data-twitter-classic-early-count]");
      const type = (text) => {
        editor.value = text;
        editor.dispatchEvent(new InputEvent("input", { bubbles: true }));
      };
      if (early()) return false;
      type("a");
      await waitFor(() => remaining()?.textContent === "279");
      const earlyProgress = parseFloat(early().style.getPropertyValue("--twitter-counter-progress"));
      const font = style(remaining());
      if (!remaining().getClientRects().length || earlyProgress <= 0 || earlyProgress >= 1 ||
          font.fontSize !== "13px" || font.fontWeight !== "400" || font.lineHeight !== "16px" || font.fontVariantNumeric !== "normal") return false;
      type("a👩‍💻");
      await waitFor(() => remaining()?.textContent === "277");
      type("a".repeat(266));
      slot.insertAdjacentHTML("beforeend", '<div class="text-warning">14</div><div role="progressbar" aria-valuenow="266" aria-valuemax="280"><svg><circle r="9" stroke="currentColor"></circle><circle r="9" stroke="currentColor" stroke-dasharray="56.5" stroke-dashoffset="2.8"></circle></svg></div>');
      const native = slot.querySelector('[role="progressbar"]');
      await waitFor(() => !early() && native.dataset.twitterClassicCounterState === "warning");
      const nativeArc = native.querySelector('[data-twitter-classic-counter-arc]');
      const preserved = nativeArc.getAttribute("stroke-dashoffset") === "2.8";
      slot.querySelector(".text-warning").remove();
      type("a".repeat(222));
      native.setAttribute("aria-valuenow", "222");
      await waitFor(() => remaining()?.textContent === "58");
      const oneRing = style(early().querySelector("[data-twitter-classic-early-ring]")).display === "none";
      type("a".repeat(224));
      native.setAttribute("aria-valuenow", "224");
      await waitFor(() => remaining()?.textContent === "56");
      native.remove();
      type("");
      await waitFor(() => !early());
      return preserved && oneRing;
    });
    await check("Show translation keeps its native control and settings with a neutral icon", () => {
      const button = find("#new-translate");
      return visible("#new-translate") && visible("#new-translation-settings") && button.textContent === "Show translation" &&
        button.querySelectorAll('[data-twitter-classic-translation-icon]').length === 1 &&
        style(button.querySelector('[data-twitter-classic-translation-original]')).display === "none";
    });
    await check("Translated-from attribution swaps the inline Grok path and keeps the language and Show original", async () => {
      const status = find("#new-translated-status");
      const native = status.querySelector("svg[data-twitter-classic-translation-original]");
      const neutral = status.querySelector("svg[data-twitter-classic-translation-icon]");
      const correct = Boolean(native && neutral?.getClientRects().length) && style(native).display === "none" &&
        status.children[1].textContent === "Translated from Spanish" && visible("#new-translated-status button");
      const rerender = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "m9.27 15.28 7.98-5.92");
      rerender.append(path);
      if (!native) return false;
      native.replaceWith(rerender);
      await waitFor(() => rerender.hasAttribute("data-twitter-classic-translation-original"));
      return correct && status.querySelectorAll("svg[data-twitter-classic-translation-icon]").length === 1;
    });
    await check("Modern and legacy square Messages launchers use Twitter blue and a white outline", () =>
      ["#new-chat-dock button", "#legacy-chat-launcher"].every((selector) => {
        const launcher = find(selector);
        return launcher.getAttribute("aria-label") === "Messages" && blue(style(launcher).backgroundColor) &&
          style(launcher).borderTopColor === "rgb(255, 255, 255)" &&
          style(launcher.querySelector("svg")).color === "rgb(255, 255, 255)";
      }));
    await check("Both Messages drawers follow Light and Dim and rebrand only the suggestion subtitle", async () => {
      await waitFor(() => drawers.every((shadow) => shadow.querySelector("link")?.sheet));
      const panels = drawers.map((shadow) => shadow.querySelector("[data-xchat-root]"));
      const readable = panels.every((panel) => light(style(panel).backgroundColor) && ink(style(panel).color) &&
        panel.querySelector("h2").textContent === "Messages" &&
        panel.querySelector('[data-testid^="dm-cold-inbox-suggestion-"]').textContent === "You interact a lot on Twitter" &&
        panel.querySelector('[data-testid="dm-chat-preview"]').textContent === "You interact a lot on X");
      await window.fixtureSetOptions({ classicDark: true });
      await waitFor(() => panels.every((panel) => dim(style(panel).backgroundColor)));
      const dimReadable = panels.every((panel) => light(style(panel).color));
      await window.fixtureSetOptions({ classicDark: false });
      await waitFor(() => panels.every((panel) => light(style(panel).backgroundColor)));
      return readable && dimReadable;
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
    await check("Video volume retains a neutral track, blue fill and thumb, and white speaker in Light and Dim", async () => {
      const slider = find("#new-volume-thumb input");
      const fill = find("#new-volume-fill");
      const thumb = find("#new-volume-thumb");
      const styled = () => style(find("#new-volume-popup")).backgroundColor === "rgba(15, 20, 25, 0.86)" &&
        transparent(style(find("#new-volume-group")).backgroundColor) &&
        style(find("#new-volume-track")).backgroundColor === "rgba(255, 255, 255, 0.45)" &&
        blue(style(fill).backgroundColor) && blue(style(thumb).backgroundColor) &&
        blue(style(thumb).outlineColor) && style(find("#new-video-mute")).color === "rgb(255, 255, 255)";
      const lightMode = styled() && slider.value === "37" && fill.style.height === "37%" && thumb.style.bottom === "37%";
      await window.fixtureSetOptions({ classicDark: true });
      await waitFor(() => document.documentElement.dataset.twitterClassicTheme === "dim");
      const dimMode = styled();
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
    await check("Native Follow buttons turn blue without changing Following or Message", () => {
      const fill = "rgb(29, 161, 242)";
      return ["#new-hover-follow", "#legacy-hover-follow"].every((selector) => {
        const colors = style(find(selector));
        return colors.backgroundColor === fill && colors.color === "rgb(7, 28, 44)";
      }) && ["#new-hover-following", "#new-hover-message"].every((selector) => style(find(selector)).backgroundColor !== fill);
    });
    await check("Only the core Home tabs show unless an extra timeline is active", () => {
      const extra = find('[role="tab"]:not([data-pinned-timeline])');
      const hasCoreTabs = ["for-you", "following"].every((id) => visible(`[data-pinned-timeline="${id}"]`));
      const hiddenByDefault = !extra.getClientRects().length;
      extra.setAttribute("aria-selected", "true");
      const visibleWhileActive = Boolean(extra.getClientRects().length);
      extra.setAttribute("aria-selected", "false");
      return hasCoreTabs && hiddenByDefault && visibleWhileActive;
    });
    await check("Direct and mid-tweet Grok tags leave no visible row while quotes stay visible", () => {
      const slot = find("#new-prompt-slot");
      return !visible("#new-prompt") && slot.getBoundingClientRect().height === 1 &&
        style(slot).visibility === "hidden" && !slot.querySelector("button") && !visible("#new-mention") && visible("#new-quote") &&
        find("#new-mention a").textContent === "@grok";
    });
    await check("The virtualizer remeasures already hidden rows and clears the shim on recycled posts", async () => {
      const timeline = document.createElement("ul");
      timeline.style.position = "relative";
      timeline.innerHTML = `
        <li id="virtual-hidden" data-index="22" hidden style="display:none;position:absolute;transform:translateY(0px);min-height:500px;"><article>Hidden timeline item</article></li>
        <li id="virtual-follower" data-index="23" style="position:absolute;transform:translateY(500px)"><article>Next visible Tweet</article></li>`;
      find("main").append(timeline);
      const hidden = find("#virtual-hidden");
      const follower = find("#virtual-follower");
      const offset = () => follower.getBoundingClientRect().top - hidden.getBoundingClientRect().top;
      const observer = new ResizeObserver(() => {
        const height = hidden.getBoundingClientRect().height;
        // X's virtualizer may ignore a zero-sized hidden row and retain its estimate.
        if (height > 0 && follower.style.transform !== `translateY(${height}px)`) {
          follower.style.transform = `translateY(${height}px)`;
        }
      });
      observer.observe(hidden);
      try {
        await waitFor(() => offset() === 1 && style(hidden).visibility === "hidden");
        hidden.removeAttribute("hidden");
        hidden.style.removeProperty("display");
        hidden.style.minHeight = "100px";
        hidden.dataset.index = "25";
        await waitFor(() => offset() === 100 && style(hidden).visibility === "visible");
        return !hidden.hasAttribute("data-twitter-classic-hidden-feed-slot");
      } finally {
        observer.disconnect();
        timeline.remove();
      }
    });
    for (const wrapped of [false, true]) {
      await check(wrapped ? "A wrapped conversation ad cannot leave its stale 400px gap"
        : "A stronger browser ad rule cannot leave its stale 400px gap", async () => {
      const timeline = document.createElement("div");
      timeline.id = "urt-tracked-test";
      timeline.innerHTML = `
        <style>#urt-tracked-test > ul > li:has([target="_blank"][href*="?twclid="]) { display: none !important; }</style>
        <ul style="position:relative">
          <li data-index="30" style="position:absolute;transform:translateY(0px);min-height:400px">
            ${wrapped ? '<div class="flex flex-col">' : ""}
            <div role="link" data-href="/fixture/status/30"><article>
              <div data-testid="tweetText"><a id="masked-click" target="_blank" href="https://example.com/?twclid=old-ad&amp;campaign=keep">Ad destination</a></div>
            </article></div>
            ${wrapped ? "</div>" : ""}
          </li>
          <li data-index="31" style="position:absolute;transform:translateY(400px)"><div role="link" data-href="/fixture/status/31"><article>Next tweet</article></div></li>
        </ul>
        <article><div data-testid="tweetText"><a id="untouched-click" target="_blank" href="https://example.com/?twclid=untouched">Unfiltered post link</a></div></article>`;
      find("main").append(timeline);
      const hidden = timeline.querySelector('[data-index="30"]');
      const next = timeline.querySelector('[data-index="31"]');
      const link = find("#masked-click");
      const offset = () => next.getBoundingClientRect().top - hidden.getBoundingClientRect().top;
      const observer = new ResizeObserver(() => {
        const h = hidden.getBoundingClientRect().height;
        if (h > 0 && next.style.transform !== `translateY(${h}px)`) next.style.transform = `translateY(${h}px)`;
      });
      observer.observe(hidden);
      try {
        await waitFor(() => offset() === 1 && style(hidden).visibility === "hidden");
        const trackerRemoved = link.getAttribute("href") === "https://example.com/?campaign=keep" &&
          find("#untouched-click").getAttribute("href") === "https://example.com/?twclid=untouched";
        link.setAttribute("href", "https://example.com/?twclid=refreshed-ad&campaign=keep");
        await waitFor(() => !link.getAttribute("href").includes("twclid") && offset() === 1);
        link.closest("[data-href]").setAttribute("data-href", "/fixture/status/34");
        hidden.style.minHeight = "100px";
        await waitFor(() => offset() === 100 && style(hidden).visibility === "visible");
        return trackerRemoved && !hidden.hasAttribute("data-twitter-classic-hidden-feed-slot");
      } finally {
        observer.disconnect();
        timeline.remove();
      }
      });
    }
    await check("Ad filtering preserves organic posts, quotes, and recycled feed rows", async () => {
      const slot = find("#new-ad-slot");
      const collapsed = !visible("#new-paid-post") && slot.getBoundingClientRect().height === 1;
      const unaffected = visible("#new-organic-ai-post") && visible("#new-organic-quote-post");
      const disclosure = find("#new-paid-post a");
      disclosure.setAttribute("aria-label", "Visit website");
      await waitFor(() => visible("#new-paid-post"));
      disclosure.setAttribute("aria-label", "Ad from example.com Learn more");
      await waitFor(() => !visible("#new-paid-post"));
      return collapsed && unaffected;
    });
    await check("Plain-text Ad from disclosures collapse only their paid row, including text updates", async () => {
      const slot = find("#new-ad-disclosure-slot");
      const hidden = !visible("#new-ad-disclosure-post") && slot.getBoundingClientRect().height === 1;
      const disclosure = find("#new-ad-disclosure-post a");
      disclosure.firstChild.nodeValue = "Visit website";
      await waitFor(() => visible("#new-ad-disclosure-post"));
      disclosure.firstChild.nodeValue = "Ad from example.com";
      await waitFor(() => !visible("#new-ad-disclosure-post"));
      return hidden && visible("#new-organic-linked-text");
    });
    await check("Header badges hide ads even with an unlabeled More button, while organic content stays visible", async () => {
      const slot = find("#new-badge-ad-slot");
      const filtered = !visible("#new-badge-ad") && slot.getBoundingClientRect().height === 1 &&
        !visible("#legacy-ad-post") && !visible("#legacy-tracked-ad article");
      const badge = find("#new-ad-header-badge");
      badge.remove();
      await waitFor(() => visible("#new-badge-ad"));
      badge.textContent = "Sponsored";
      find("#new-badge-ad button").before(badge);
      await waitFor(() => !visible("#new-badge-ad"));
      return filtered && visible("#new-ad-negative-control");
    });

    await window.fixtureSetOptions({ deElon: false });
    await waitFor(() => document.documentElement.dataset.twitterClassicDeElon === "off");
    await check("Turning off De-Elon brings back the native extra tabs, toolbar and dock", () =>
      ['[role="tab"]:not([data-pinned-timeline])', "#new-news", "#new-grok-dock", "#new-explain", '[aria-label="Generate image"]'].every(visible));
    await check("Turning off De-Elon displays native Grok prompt rows", () =>
      visible("#new-prompt") && style(find("#new-prompt-slot")).visibility === "visible");
    await check("Turning off De-Elon restores the Grok Profile Summary action", () => visible("#new-hover-summary"));
    await check("Ad filtering and gap prevention stay active with De-Elon off", () =>
      ["#new-paid-post", "#new-ad-disclosure-post", "#new-badge-ad", "#legacy-ad-post", "#legacy-tracked-ad article"].every((selector) => !visible(selector)) &&
      find("#new-badge-ad-slot").getBoundingClientRect().height === 1);
    await check("Pausing Classic Twitter restores native ad visibility", () => {
      const root = document.documentElement;
      root.setAttribute("data-twitter-classic", "off");
      try {
        return visible("#new-badge-ad") && visible("#new-ad-disclosure-post");
      } finally {
        root.setAttribute("data-twitter-classic", "on");
      }
    });
    fixture.remove();
    await window.fixtureSetOptions({ deElon: true });
    await waitFor(() => document.documentElement.dataset.twitterClassicDeElon === "on");
  }

  async function checkTweetDetailHeader() {
    const fixture = document.createElement("main");
    fixture.innerHTML = `
      <div id="tweet-detail-bar" class="bg-primary/80 sticky" style="background-color:#000">
        <div class="mobile"><button aria-label="Back">Back</button><div><h2>Post</h2></div></div>
        <div class="desktop"><button aria-label="Back">Back</button><div><h2>Post</h2></div></div>
      </div>
      <article><h2 id="tweet-detail-user-heading">Post</h2><div data-testid="tweetText">Post</div></article>`;
    document.body.append(fixture);
    history.pushState(null, "", "/fixture/status/30");
    window.dispatchEvent(new PopStateEvent("popstate"));
    const bar = fixture.querySelector("#tweet-detail-bar");
    await window.fixtureSetOptions({ classicDark: true });
    await waitFor(() => document.documentElement.dataset.twitterClassicTheme === "dim" &&
      bar.hasAttribute("data-twitter-classic-tweet-detail-header"));
    await check("Both Tweet detail headings say Tweet over Dim navy without rewriting the post", () =>
      [...bar.querySelectorAll("h2")].every((title) => title.textContent === "Tweet") &&
      style(bar).backgroundColor === "rgb(21, 32, 43)" &&
      fixture.querySelector("#tweet-detail-user-heading").textContent === "Post" &&
      fixture.querySelector('[data-testid="tweetText"]').textContent === "Post");
    fixture.remove();
    await window.fixtureSetOptions({ classicDark: false });
    await goHome();
  }

  async function checkDimPageHeaders() {
    const fixture = document.createElement("main");
    const tabs = (pair) => `<div role="tablist">${pair.map((name, i) =>
      `<button role="tab" aria-selected="${i === 0}">${name}<span data-tab-underline style="background:#fff"></span></button>`).join("")}</div>`;
    fixture.innerHTML = `
      <section id="dim-explore">
        <div class="bg-primary/80 sticky" style="background:#000"><form role="search"><input aria-label="Search query"></form></div>
        <div class="bg-primary/80 sticky" style="background:#000"><div>${tabs(["Explore", "Trending"])}</div></div>
      </section>
      ${["Notifications", "History"].map((page) => `
        <header data-page-header aria-label="${page}">
          <div class="bg-primary/80" style="background:#000"></div>
          <h2>${page}</h2>${tabs(page === "History" ? ["Bookmarks", "Likes"] : ["All", "Mentions"])}
        </header>`).join("")}
      <div class="bg-black tabular-nums" id="dim-page-video" style="background:#000"><video preload="none"></video></div>`;
    document.body.append(fixture);
    await window.fixtureSetOptions({ classicDark: true });
    await waitFor(() => document.documentElement.dataset.twitterClassicTheme === "dim");
    const navy = "rgb(21, 32, 43)";
    const surfacesAreNavy = (scope) => [...scope.querySelectorAll('[class~="bg-primary/80"]')]
      .every((el) => style(el).backgroundColor === navy);
    const tabsAreBlue = (scope) => blue(style(scope.querySelector('[aria-selected="true"] [data-tab-underline]')).backgroundColor);
    await check("Explore keeps its native search and tabs on Dim navy with a blue underline", () => {
      const explore = fixture.querySelector("#dim-explore");
      return surfacesAreNavy(explore) && tabsAreBlue(explore) && !!explore.querySelector("form input");
    });
    for (const page of ["Notifications", "History"]) {
      await check(`${page} uses a Dim navy header and a blue native tab underline`, () => {
        const header = fixture.querySelector(`header[aria-label="${page}"]`);
        return surfacesAreNavy(header) && tabsAreBlue(header) && header.querySelector("h2").textContent === page;
      });
    }
    await check("Dim page chrome does not recolor the black video surface", () =>
      style(fixture.querySelector("#dim-page-video")).backgroundColor === "rgb(0, 0, 0)");
    fixture.remove();
    await window.fixtureSetOptions({ classicDark: false });
    await waitFor(() => document.documentElement.dataset.twitterClassicTheme === "light");
  }

  async function checkModernProfile() {
    const fixture = document.createElement("main");
    fixture.innerHTML = `
      <div class="profile-content">
        <div id="profile-sticky-header" class="bg-primary/80 sticky" style="background-color:#000"><button aria-label="Back">Back</button></div>
        <div id="verification-banner-wrap"><div data-slot="xds-callout" role="status"><p>You aren’t verified yet</p><a href="/i/premium_sign_up">Get verified</a><button aria-label="Dismiss">×</button></div></div>
        <span id="profile-verified-badge" role="img" aria-label="Verified account">✓</span>
        <div id="profile-sticky-tabs" class="bg-primary/80 sticky" style="background-color:#000"><div><div role="tablist">
          <button role="tab" aria-haspopup="menu" aria-selected="true">Posts</button>
          <a role="tab" href="/fixture/with_replies">Replies</a>
          <a role="tab" href="/fixture/reposts" aria-selected="false">Reposts</a>
          <a role="tab" href="/fixture/media">Media</a>
          <a role="tab" href="/fixture/articles" aria-selected="false">Articles</a>
        </div></div></div>
        <aside><style>#profile-search::before { content:""; background-color:#000; mask-image:linear-gradient(#000,transparent); }</style>
          <div id="profile-search" class="before:bg-primary sticky"><div><form role="search"><input aria-label="Search query"></form></div></div>
        </aside>
        <div id="profile-media-black" class="bg-black tabular-nums" style="background-color:#000"><video preload="none"></video></div>
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
    await check("Dim colors the sticky profile bars and search scrim navy without recoloring video", async () => {
      const find = (selector) => fixture.querySelector(selector);
      await window.fixtureSetOptions({ classicDark: true });
      await waitFor(() => document.documentElement.dataset.twitterClassicTheme === "dim");
      const navy = "rgb(21, 32, 43)";
      const scrim = style(find("#profile-search"), "::before");
      const correct = ["#profile-sticky-header", "#profile-sticky-tabs"].every((selector) =>
        style(find(selector)).backgroundColor === navy) &&
        scrim.backgroundColor === navy && scrim.maskImage.includes("linear-gradient") &&
        style(find("#profile-media-black")).backgroundColor === "rgb(0, 0, 0)";
      await window.fixtureSetOptions({ classicDark: false });
      await waitFor(() => document.documentElement.dataset.twitterClassicTheme === "light");
      return correct;
    });
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
    await checkTweetDetailHeader();
    await checkDimPageHeaders();
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
