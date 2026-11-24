(() => {
  "use strict";

  const DEFAULTS = Object.freeze({
    deElon: true,
    getBackToX: false,
    classicDark: false
  });

  const ATTR = Object.freeze({
    enabled: "data-twitter-classic",
    ready: "data-twitter-classic-ready",
    theme: "data-twitter-classic-theme",
    deElon: "data-twitter-classic-de-elon",
    page: "data-twitter-classic-page",
    logo: "data-twitter-classic-logo",
    nativeTabs: "data-twitter-classic-native-tabs",
    nativeTabsButton: "data-twitter-classic-native-tabs-button",
    timelinePlus: "data-twitter-classic-timeline-plus",
    timelinePlusShell: "data-twitter-classic-timeline-plus-shell"
  });

  const POST_TEXT_SELECTOR = '[data-testid="tweetText"], article div[dir][lang][class*="whitespace-pre-wrap"]';
  const POST_ROW_SELECTOR = '[role="link"][data-href*="/status/"]';
  const QUOTED_POST_SELECTOR = '[data-slot="embedded-tweet-frame"], [data-testid="quoteTweet"]';
  const VIRTUAL_FEED_SLOT_SELECTOR = ':is(main, [role="main"]) :is(ul > li[data-index], [data-testid="cellInnerDiv"][style*="translateY("])';
  const MEASURED_HIDDEN_SLOT = "data-twitter-classic-hidden-feed-slot";
  const PROTECTED_CONTENT_SELECTOR = [
    POST_TEXT_SELECTOR,
    '[data-testid="User-Name"]',
    '[data-testid="UserDescription"]',
    '[data-testid="Tweet-User-Avatar"]',
    '[data-testid="SideNav_AccountSwitcher_Button"]',
    '[data-testid="UserCell"]',
    '[data-testid="card.wrapper"]',
    '[data-testid="card.layoutLarge.media"]',
    '[contenteditable="true"]'
  ].join(",");

  const MEDIA_SELECTOR = [
    '[class~="bg-black"][class~="tabular-nums"]:has(> video)',
    'article [data-slot="xds-context-menu-trigger"]:has(img, video)',
    '[data-testid="videoPlayer"]',
    '[data-testid="swipe-to-dismiss"]',
    '[data-testid="tweetPhoto"]',
    '[data-testid="card.layoutLarge.media"]',
    "video",
    "canvas",
    "picture"
  ].join(",");

  const AVATAR_SELECTOR = [
    '[data-testid="Tweet-User-Avatar"]',
    '[data-testid*="UserAvatar"]',
    '[data-testid*="avatar" i]',
    "img"
  ].join(",");

  const COUNTER_SELECTOR = [
    '[role="progressbar"]',
    '[data-testid*="characterCount" i]',
    '[aria-label*="character count" i]'
  ].join(",");
  const draftCharacters = new Intl.Segmenter(undefined, { granularity: "grapheme" });

  const PRIMARY_NAV = 'nav[aria-label="Primary"]';
  const MODERN_COMPOSER_TOOLBAR = '[data-truncated-list]:has([aria-label="Add media"], [data-icon="icon-photo"], use[href="#icon-photo"])';
  const MODERN_RETWEET = 'article button[data-slot="xds-menu-trigger"][aria-label*="repost" i]';
  const GROK_TRANSLATION_ICON = 'svg:is([data-icon*="grok" i], :has(use[href*="grok" i], path[d^="m9.27 15.28 7.98-5.92"]))';
  const AD_DISCLOSURE_TEXT = /^Ad from (?:[a-z\d-]+\.)+[a-z\d-]+$/i;
  const AD_BADGE_TEXT = /^(?:Ad|Promoted|Sponsored)$/i;
  const POST_MENU_SELECTOR = '[data-testid="caret"], :is(button, [role="button"])[aria-label="More" i]';
  const EXCLUDED_AD_LABEL_SELECTOR = `${QUOTED_POST_SELECTOR}, ${POST_TEXT_SELECTOR}, [data-testid="User-Name"], [data-testid="UserDescription"]`;

  const OBSERVED_ATTRIBUTES = [
    "aria-label", "aria-description", "aria-current", "aria-selected",
    "aria-describedby", "aria-valuenow", "aria-valuemax", "aria-valuemin",
    "title", "placeholder", "data-placeholder", "href", "data-href", "data-theme",
    "class", "style", "hidden", "data-index", "data-testid", "stroke", "stroke-dasharray", "stroke-dashoffset"
  ];

  const LABEL_TARGET_SELECTOR = [
    '[role="menuitem"]',
    '[role="tab"]',
    '[role="tooltip"]',
    '[role="heading"]',
    '[role="dialog"] button',
    '[role="dialog"] [role="button"]',
    '[data-testid="SideNav_NewTweet_Button"]',
    '[data-testid="tweetButton"]',
    '[data-testid="tweetButtonInline"]',
    '[data-testid="retweet"]',
    '[data-testid="unretweet"]',
    '[data-testid="socialContext"]',
    '[data-testid="trend"]',
    '[data-testid="dm-inbox-title"]',
    '[data-twitter-classic-modern-submit]',
    '[data-twitter-classic-modern-compose]',
    '[data-twitter-classic-modern-toolbar] button',
    `${PRIMARY_NAV} > a`,
    '[data-slot="xds-dock-launcher"][aria-label="Chat"]',
    '[data-testid="chat-drawer-main"]:is(button, [role="button"])',
    MODERN_RETWEET,
    'header[role="banner"] nav a',
    "input[placeholder]",
    'textarea:is([placeholder], [data-placeholder], [aria-label="Post your reply"])'
  ].join(",");

  const SAFE_ARTICLE_CONTROL_SELECTOR = [
    '[data-testid="toolBar"]',
    '[data-testid="retweet"]',
    '[data-testid="unretweet"]',
    '[data-testid="socialContext"]',
    '[data-testid="tweetButton"]',
    '[data-testid="tweetButtonInline"]',
    MODERN_RETWEET
  ].join(",");

  const EXACT_LABELS = new Map([
    ["Chat", "Messages"],
    ["Search", "Search Twitter"],
    ["Search X", "Search Twitter"],
    ["Happening now.", "Happening now"],
    ["Post", "Tweet"],
    ["Posts", "Tweets"],
    ["post", "tweet"],
    ["posts", "tweets"],
    ["Post text", "Tweet text"],
    ["Post your reply", "Tweet your reply"],
    ["Reply Tweet", "Reply"],
    ["Reply Post", "Reply"],
    ["Post all", "Tweet all"],
    ["Schedule post", "Schedule Tweet"],
    ["Delete post", "Delete Tweet"],
    ["Pin post", "Pin Tweet"],
    ["Unpin post", "Unpin Tweet"],
    ["Pinned post", "Pinned Tweet"],
    ["Embed post", "Embed Tweet"],
    ["Report post", "Report Tweet"],
    ["Show posts", "Show Tweets"],
    ["See new posts", "See new Tweets"],
    ["New posts", "New Tweets"],
    ["Quote Post", "Quote Tweet"],
    ["Quote post", "Quote Tweet"],
    ["Quote Posts", "Quote Tweets"],
    ["Quote posts", "Quote Tweets"],
    ["Repost", "Retweet"],
    ["Reposts", "Retweets"],
    ["repost", "retweet"],
    ["reposts", "retweets"],
    ["Reposted", "Retweeted"],
    ["reposted", "retweeted"],
    ["Undo Repost", "Undo Retweet"],
    ["Undo repost", "Undo Retweet"]
  ]);

  const NOTIFICATION_REPLACEMENTS = [
    [/\bNew post notifications for\b/g, "New Tweet notifications for"],
    [/\bRecent posts from\b/g, "Recent Tweets from"],
    [/\bRecent post from\b/g, "Recent Tweet from"],
    [/\bliked your post\b/gi, (match) => match.replace(/post/i, "Tweet")],
    [/\breplied to your post\b/gi, (match) => match.replace(/post/i, "Tweet")],
    [/\bmentioned you in a post\b/gi, (match) => match.replace(/a post/i, "a Tweet")],
    [/\bshared your post\b/gi, (match) => match.replace(/post/i, "Tweet")],
    [/\bbookmarked your post\b/gi, (match) => match.replace(/post/i, "Tweet")]
  ];

  const NORMALIZABLE_SELECTOR = [
    "div",
    "section",
    "article",
    "header",
    "footer",
    "form",
    "label",
    "input",
    "textarea",
    "button",
    "a",
    "span",
    "p",
    "h1",
    "h2",
    "h3",
    "h4"
  ].join(",");

  const FAVICON_ID = "twitter-classic-favicon";
  const HOME_HEADER_SELECTOR = "[data-twitter-classic-home-header]";
  const pendingRoots = new Set();
  let options = { ...DEFAULTS };
  let observer = null;
  let scheduledFrame = 0;
  let readyTimer = 0;
  let initialized = false;
  const chatRoots = new Map();
  const grokPrompts = new Map();
  let chatRetryTimer = 0;
  let chatRetryCount = 0;

  let birdUrl;
  let homeOutlineUrl;
  let homeFilledUrl;
  let loginBackgroundUrl;
  let chatStylesheetUrl;

  try {
    birdUrl = chrome.runtime.getURL("assets/twitter-bird.svg");
    homeOutlineUrl = chrome.runtime.getURL("assets/twitter-home-outline.svg");
    homeFilledUrl = chrome.runtime.getURL("assets/twitter-home-filled.svg");
    loginBackgroundUrl = chrome.runtime.getURL("assets/twitter-login-background.png");
    chatStylesheetUrl = chrome.runtime.getURL("styles/twitter-chat.css");
  } catch (_error) {
    return;
  }

  // Install the local bird before X gets a chance to paint its boot mark.
  // Storage is asynchronous, so Get back to X may remove this a moment later.
  const bootRoot = document.documentElement;
  if (bootRoot) {
    bootRoot.setAttribute(ATTR.enabled, "on");
    bootRoot.setAttribute(ATTR.ready, "loading");
    bootRoot.style.setProperty(
      "--twitter-classic-bird-image",
      `url("${birdUrl}")`
    );
  }

  function normalizedOptions(values) {
    return Object.fromEntries(
      Object.keys(DEFAULTS).map((name) => [
        name,
        typeof values?.[name] === "boolean" ? values[name] : DEFAULTS[name]
      ])
    );
  }

  function pageKind() {
    if (location.pathname.startsWith("/messages") || location.pathname.startsWith("/i/chat")) {
      return "messages";
    }
    if (location.pathname === "/home") {
      return "home";
    }
    if (location.pathname.startsWith("/notifications")) {
      return "notifications";
    }
    if (/^\/[^/]+\/status\/\d+/.test(location.pathname)) {
      return "status";
    }
    return "other";
  }

  function setRootState() {
    const root = document.documentElement;
    if (!root || options.getBackToX) {
      return;
    }

    const theme = options.classicDark ? "dim" : "light";
    root.setAttribute(ATTR.enabled, "on");
    root.setAttribute(ATTR.theme, theme);
    root.setAttribute(ATTR.deElon, options.deElon ? "on" : "off");
    root.setAttribute(ATTR.page, pageKind());
    const nativeTheme = options.classicDark ? "dark" : "light";
    if (root.getAttribute("data-theme") !== nativeTheme) {
      root.setAttribute("data-theme", nativeTheme);
    }
    root.style.setProperty("--twitter-classic-bird-image", `url("${birdUrl}")`);
    root.style.setProperty("--twitter-classic-home-outline", `url("${homeOutlineUrl}")`);
    root.style.setProperty("--twitter-classic-home-filled", `url("${homeFilledUrl}")`);
    root.style.setProperty(
      "--twitter-classic-login-background",
      `url("${loginBackgroundUrl}")`
    );
  }

  function markShellReady(force = false) {
    const root = document.documentElement;
    if (!root || options.getBackToX) {
      return;
    }
    const shellExists = Boolean(
      root.getAttribute("data-twitter-classic-landing") === "native" ||
        document.querySelector(
          'header[role="banner"], main header[data-page-header], [data-testid="primaryColumn"], [data-twitter-classic-native-landing="on"]'
        )
    );
    if (!force && !shellExists) {
      return;
    }
    root.setAttribute(ATTR.ready, "ready");
    if (readyTimer) {
      clearTimeout(readyTimer);
      readyTimer = 0;
    }
  }

  function addMatches(root, selector, matches) {
    const element = root instanceof Element ? root : null;
    if (element?.matches(selector)) {
      matches.add(element);
    }
    const ancestor = element?.closest(selector);
    if (ancestor) {
      matches.add(ancestor);
    }
    root.querySelectorAll?.(selector).forEach((match) => matches.add(match));
  }

  function replaceExactLabel(value) {
    if (typeof value !== "string") {
      return value;
    }
    const match = value.match(/^(\s*)(.*?)(\s*)$/s);
    if (!match) {
      return value;
    }
    const replacement = EXACT_LABELS.get(match[2]);
    return replacement === undefined
      ? value
      : `${match[1]}${replacement}${match[3]}`;
  }

  function replaceCountLabels(value) {
    return replaceExactLabel(value)
      .replace(/\bShow (\d[\d,.]*(?:[KMB])?) posts\b/g, "Show $1 Tweets")
      .replace(/\b(\d[\d,.]*(?:[KMB])?) posts\b/g, "$1 Tweets");
  }

  function replaceRepostTerms(value) {
    return value
      .replace(/\bReposted\b/g, "Retweeted")
      .replace(/\breposted\b/g, "retweeted")
      .replace(/\bReposts\b/g, "Retweets")
      .replace(/\breposts\b/g, "retweets")
      .replace(/\bRepost\b/g, "Retweet")
      .replace(/\brepost\b/g, "retweet");
  }

  function transformForTarget(value, target) {
    if (target.hasAttribute("data-twitter-classic-profile-replies")) {
      return value.replace(/^(\s*)Replies(\s*)$/, "$1Tweets & replies$2");
    }
    if (
      target.closest(`[data-testid="socialContext"], [data-testid="retweet"], [data-testid="unretweet"], ${MODERN_RETWEET}`)
    ) {
      return replaceRepostTerms(value);
    }
    if (target.matches('[data-testid="trend"]') || target.closest('[data-testid="trend"]')) {
      return replaceCountLabels(value);
    }
    return replaceExactLabel(value);
  }

  function isSafeLabelTarget(target) {
    if (target.closest(PROTECTED_CONTENT_SELECTOR)) {
      return false;
    }
    const article = target.closest('article');
    return !article || Boolean(target.closest(SAFE_ARTICLE_CONTROL_SELECTOR));
  }

  function restoreReplyHintAttributes(editor) {
    for (const attribute of ["placeholder", "data-placeholder", "aria-label"]) {
      const current = editor.getAttribute(attribute);
      if (current?.trim() === "Post your reply") {
        editor.setAttribute(attribute, replaceExactLabel(current));
      }
    }
  }

  function rewriteLabelTarget(target) {
    if (!(target instanceof Element)) return;
    if (target.matches("textarea")) restoreReplyHintAttributes(target);
    if (!isSafeLabelTarget(target)) {
      return;
    }

    for (const attribute of ["aria-label", "aria-description", "title", "placeholder"]) {
      const current = target.getAttribute(attribute);
      if (!current) {
        continue;
      }
      const next = transformForTarget(current, target);
      if (next !== current) {
        target.setAttribute(attribute, next);
      }
    }

    const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const parent = node.parentElement;
      if (parent && !parent.closest(PROTECTED_CONTENT_SELECTOR)) {
        const current = node.nodeValue;
        const next = transformForTarget(current, target);
        if (next !== current) {
          node.nodeValue = next;
        }
      }
      node = walker.nextNode();
    }

    if (target.matches('[data-testid="tweetButtonInline"]')) {
      const text = target.textContent.trim();
      if (text) {
        target.removeAttribute("data-twitter-classic-fallback-label");
      } else {
        const isReply =
          pageKind() === "status" ||
          /reply/i.test(target.getAttribute("aria-label") || "") ||
          Boolean(target.closest('[data-twitter-classic-reply-composer="on"]'));
        target.setAttribute("data-twitter-classic-fallback-label", isReply ? "reply" : "tweet");
      }
    }
  }

  function restoreLabels(root) {
    const targets = new Set();
    addMatches(root, LABEL_TARGET_SELECTOR, targets);
    targets.forEach(rewriteLabelTarget);
  }

  function restoreProfileTabs(root) {
    const profile = location.pathname.match(/^\/([a-z0-9_]{1,15})(?:\/(?:with_replies|media|likes|reposts|articles|highlights|subscriptions))?\/?$/i);
    if (!profile) return;

    const prefix = `/${profile[1].toLowerCase()}/`;
    const lists = new Set();
    addMatches(root, 'main [role="tablist"]', lists);
    for (const list of lists) {
      const tabs = new Map();
      for (const tab of list.querySelectorAll('a[role="tab"][href]')) {
        if (tab.closest('[role="tablist"]') !== list) continue;
        const path = tab.getAttribute("href").split(/[?#]/)[0].replace(/\/$/, "").toLowerCase();
        if (path.startsWith(prefix)) tabs.set(path.slice(prefix.length), tab);
      }
      const replies = tabs.get("with_replies");
      if (!replies || !tabs.has("media")) continue;

      list.setAttribute("data-twitter-classic-profile-tabs", "on");
      replies.setAttribute("data-twitter-classic-profile-replies", "on");
      for (const route of ["reposts", "articles", "highlights", "subscriptions"]) {
        tabs.get(route)?.setAttribute("data-twitter-classic-profile-extra-tab", "on");
      }
      rewriteLabelTarget(replies);
    }
  }

  function rewriteNotificationPhrases(root) {
    const articles = new Set();
    addMatches(root, 'article, [data-testid="cellInnerDiv"]', articles);
    for (const article of articles) {
      const isNotification =
        pageKind() === "notifications" ||
        article.matches('[aria-label*="Notification" i]') ||
        Boolean(article.closest('[aria-label*="Notifications" i]'));
      if (!isNotification) {
        continue;
      }
      const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        const parent = node.parentElement;
        if (parent && !parent.closest(PROTECTED_CONTENT_SELECTOR)) {
          let next = node.nodeValue;
          for (const [pattern, replacement] of NOTIFICATION_REPLACEMENTS) {
            next = next.replace(pattern, replacement);
          }
          if (next !== node.nodeValue) {
            node.nodeValue = next;
          }
        }
        node = walker.nextNode();
      }

      article.querySelectorAll("[aria-label], [title]").forEach((element) => {
        for (const attribute of ["aria-label", "title"]) {
          const current = element.getAttribute(attribute);
          if (!current) {
            continue;
          }
          let next = current;
          for (const [pattern, replacement] of NOTIFICATION_REPLACEMENTS) {
            next = next.replace(pattern, replacement);
          }
          if (next !== current) {
            element.setAttribute(attribute, next);
          }
        }
      });
    }

    if (pageKind() !== "notifications") return;

    // The newer notifications list renders some system rows without article
    // or cellInnerDiv. Match the leading system copy only on this timeline.
    const main = 'main, [role="main"]';
    const containers = root instanceof Element && root.closest(main) ? [root] : root.querySelectorAll(main);
    const protectedContent = `article, ${POST_ROW_SELECTOR}, [data-slot="embedded-tweet-frame"], ${PROTECTED_CONTENT_SELECTOR}`;
    const rewrite = (value) => value.replace(/^(\s*)New post notifications for\b/, "$1New Tweet notifications for");
    for (const container of containers) {
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const next = rewrite(node.nodeValue);
        if (next !== node.nodeValue && !node.parentElement?.closest(protectedContent)) {
          node.nodeValue = next;
        }
      }

      for (const element of [container, ...container.querySelectorAll('[aria-label], [title]')]) {
        if (element.closest(protectedContent)) continue;
        for (const attribute of ["aria-label", "title"]) {
          const current = element.getAttribute(attribute);
          if (!current) continue;
          const next = rewrite(current);
          if (current !== next) element.setAttribute(attribute, next);
        }
      }
    }
  }

  function preserveNewTweetsPill(root) {
    const selector = [
      '[data-testid="pillLabel"]',
      '[data-testid="toast"]',
      '[role="status"]',
      '[role="alert"]',
      "[aria-live]"
    ].join(",");
    const controls = new Set();
    addMatches(root, selector, controls);

    for (const control of controls) {
      if (control.closest('article, [data-testid="tweetText"]')) {
        continue;
      }
      control.setAttribute("data-twitter-classic-live-control", "on");
      const walker = document.createTreeWalker(control, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        if (/^\s*posted\s*$/i.test(node.nodeValue)) {
          const capitalized = /^\s*P/.test(node.nodeValue) ? "Tweeted" : "tweeted";
          node.nodeValue = node.nodeValue.replace(/posted/i, capitalized);
        } else if (/^\s*See new posts\s*$/i.test(node.nodeValue)) {
          node.nodeValue = node.nodeValue.replace(/posts/i, "Tweets");
        }
        node = walker.nextNode();
      }

      for (const element of [control, ...control.querySelectorAll("[aria-label]")]) {
        const label = element.getAttribute("aria-label");
        if (label && /posts are available/i.test(label)) {
          element.setAttribute(
            "aria-label",
            label.replace(/posts are available/gi, "Tweets are available")
          );
        }
      }
    }
  }

  function restoreDocumentBranding() {
    const nextTitle = document.title
      .replace(/\bon X(?=:)/g, "on Twitter")
      .replace(/\s\/\sX$/, " / Twitter")
      .replace(/^X$/, "Twitter");
    if (nextTitle !== document.title) {
      document.title = nextTitle;
    }

    if (!document.head) {
      return;
    }
    let favicon = document.getElementById(FAVICON_ID);
    for (const candidate of document.head.querySelectorAll('link[rel~="icon"]')) {
      if (candidate.id !== FAVICON_ID) {
        candidate.remove();
      }
    }
    if (!(favicon instanceof HTMLLinkElement)) {
      favicon?.remove();
      favicon = document.createElement("link");
      favicon.id = FAVICON_ID;
      document.head.append(favicon);
    }
    favicon.rel = "icon";
    favicon.type = "image/svg+xml";
    favicon.sizes = "any";
    if (favicon.getAttribute("href") !== birdUrl) {
      favicon.href = birdUrl;
    }
  }

  function restoreBirdAndHomeIcon(root) {
    const logos = new Set();
    addMatches(
      root,
      [
        'header[role="banner"] h1 a[href="/home"]',
        'header[role="banner"] h1 a[href$="/home"]',
        'header[role="banner"] h1 a[aria-label="X"]',
        'header[role="banner"] h1 a[aria-label="Twitter"]',
        'a[href="/home"]:has(> svg[data-icon="icon-logo-x"], > svg > use[href="#icon-logo-x"])'
      ].join(","),
      logos
    );
    for (const logo of logos) {
      logo.setAttribute(ATTR.logo, "on");
      if (logo.getAttribute("aria-label") !== "Twitter") {
        logo.setAttribute("aria-label", "Twitter");
      }
      logo.parentElement?.setAttribute("data-twitter-classic-logo-slot", "on");
    }

    const homeLinks = new Set();
    addMatches(
      root,
      [
        '[data-testid="AppTabBar_Home_Link"]',
        'header[role="banner"] nav a[href="/home"]',
        'header[role="banner"] nav a[href$="/home"]',
        `${PRIMARY_NAV} > a[href="/home"]`
      ].join(","),
      homeLinks
    );
    for (const link of homeLinks) {
      link.setAttribute("data-twitter-classic-home-link", "on");
      const nativeHome = link.querySelector('svg[data-icon="icon-home"], svg:has(use[href="#icon-home"])');
      const modernSlot = nativeHome?.closest('span[aria-hidden="true"]');
      const modernGlyphs = modernSlot && nativeHome.parentElement.parentElement;
      if (modernGlyphs && modernGlyphs !== modernSlot && modernSlot.contains(modernGlyphs)) {
        // Replace both native glyphs in the stack while leaving the unread badge beside it.
        modernGlyphs.setAttribute("data-twitter-classic-home-icon-slot", "on");
        modernGlyphs.setAttribute("data-twitter-classic-home-icon-state", link.matches('[aria-current="page"]') ? "filled" : "outline");
        modernGlyphs.querySelectorAll("svg").forEach((svg) => svg.setAttribute("data-twitter-classic-native-home-icon", "on"));
        continue;
      }
      const svg = link.querySelector("svg");
      const slot = svg?.parentElement;
      if (!slot) {
        continue;
      }
      slot.setAttribute("data-twitter-classic-home-icon-slot", "on");
      slot.setAttribute(
        "data-twitter-classic-home-icon-state",
        link.getAttribute("aria-current") === "page" || pageKind() === "home" ? "filled" : "outline"
      );
      svg.setAttribute("data-twitter-classic-native-home-icon", "on");
    }
  }

  function createHomeHeader() {
    const header = document.createElement("div");
    header.setAttribute("data-twitter-classic-home-header", "on");
    header.setAttribute("role", "heading");
    header.setAttribute("aria-level", "1");

    const title = document.createElement("h2");
    title.textContent = "Home";

    header.append(title);
    return header;
  }

  function restoreHomeChrome() {
    document.querySelectorAll(
      `[${ATTR.nativeTabs}], [${ATTR.nativeTabsButton}], [${ATTR.timelinePlus}], [${ATTR.timelinePlusShell}], [data-twitter-classic-native-tabs-shell]`
    ).forEach((element) => {
      element.removeAttribute(ATTR.nativeTabs);
      element.removeAttribute(ATTR.nativeTabsButton);
      element.removeAttribute(ATTR.timelinePlus);
      element.removeAttribute(ATTR.timelinePlusShell);
      element.removeAttribute("data-twitter-classic-native-tabs-shell");
    });

    const root = document.documentElement;
    const isHome = pageKind() === "home";
    const existingHeader = document.querySelector(HOME_HEADER_SELECTOR);
    if (!isHome) {
      existingHeader?.remove();
      root.removeAttribute("data-twitter-classic-home-tabs");
      return;
    }

    // Retire the old toggle marker: its legacy rules also matched photo
    // carousels because those use role=tablist. Mark only the feed tabs now.
    root.removeAttribute("data-twitter-classic-home-tabs");

    const primary = document.querySelector('[data-testid="primaryColumn"]');
    const modernTablist = document.querySelector('main header[data-page-header] [role="tablist"]:has(> [data-pinned-timeline="for-you"], > [data-pinned-timeline="following"])');
    if (modernTablist) {
      existingHeader?.remove();
    } else if (primary) {
      const header = existingHeader || createHomeHeader();
      if (header.parentElement !== primary || primary.firstElementChild !== header) {
        primary.prepend(header);
      }
    }

    const tablist = modernTablist || [...(primary?.querySelectorAll('[role="tablist"]') || [])].find(
      (candidate) => !candidate.closest(`article, ${MEDIA_SELECTOR}`)
    );
    if (tablist) {
      tablist.setAttribute(ATTR.nativeTabs, "on");
      // Never mark an ancestor here. Some X builds populate that ancestor with
      // the entire feed after first paint, which was the v1.2 blank-Home bug.
      const row = tablist.parentElement;
      const safeRow = row && row !== primary &&
        !row.matches('main, [role="main"], [data-testid="primaryColumn"]') &&
        !row.querySelector('article, textarea, [data-testid^="tweetTextarea_"], [data-testid="toolBar"], [data-testid="tweetPhoto"], [data-testid="videoPlayer"]');
      if (safeRow) {
        row.setAttribute("data-twitter-classic-native-tabs-shell", "on");
      }
      const candidates = safeRow
        ? [...row.querySelectorAll('button, [role="button"]')]
        : [];
      const isSafeRowButton = (button) => {
        if (button.closest('[role="tablist"], [data-testid="toolBar"], [role="status"], [aria-live]')) {
          return false;
        }
        return true;
      };
      const timelineButton = candidates.find((button) => {
        if (!isSafeRowButton(button)) {
          return false;
        }
        const label = `${button.getAttribute("aria-label") || ""} ${button.title || ""}`;
        return /manage timelines|add timeline|timeline choices|choose feed/i.test(label);
      }) || candidates.find((button) => {
        if (!isSafeRowButton(button) || button.parentElement !== row) {
          return false;
        }
        const text = button.textContent.trim();
        return text === "+" || (Boolean(button.querySelector("svg")) && text.length <= 2);
      });
      if (timelineButton) {
        timelineButton.setAttribute(ATTR.timelinePlus, "on");
        let shell = timelineButton.parentElement;
        for (let depth = 0; shell && shell !== row && depth < 4; depth += 1) {
          shell.setAttribute(ATTR.timelinePlusShell, "on");
          shell = shell.parentElement;
        }
      }
    }
  }

  function markEditorPlaceholder(input) {
    const editor = input.matches('[contenteditable="true"], textarea')
      ? input
      : input.querySelector('[contenteditable="true"], textarea');
    if (!editor) {
      return;
    }
    restoreReplyHintAttributes(editor);

    const editorRoot = editor.closest(".DraftEditor-root") || editor.parentElement;
    const describedIds = (editor.getAttribute("aria-describedby") || "").split(/\s+/);
    const nativePlaceholder =
      editorRoot?.querySelector(".public-DraftEditorPlaceholder-root, .public-DraftEditorPlaceholder-inner") ||
      describedIds.map((id) => id && document.getElementById(id)).find((node) =>
        node && /placeholder/i.test(node.id)
      );
    const nativeText = nativePlaceholder?.textContent.trim();
    if (nativeText === "Post your reply" && !editor.contains(nativePlaceholder)) {
      const walker = document.createTreeWalker(nativePlaceholder, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const next = replaceExactLabel(node.nodeValue);
        if (next !== node.nodeValue) node.nodeValue = next;
      }
    }
    const attributeText = editor.getAttribute("data-placeholder") || editor.getAttribute("placeholder");
    const replyLike = pageKind() === "status" || /reply|comment/i.test(
      `${editor.getAttribute("aria-label") || ""} ${nativeText || ""} ${attributeText || ""}`
    );
    const englishInterface = !document.documentElement.lang || /^en\b/i.test(document.documentElement.lang);
    const placeholder = (nativeText === "Post your reply" ? "Tweet your reply" : nativeText) || attributeText ||
      (englishInterface ? (replyLike ? "Tweet your reply" : "What’s happening?") : "");
    const text = editor instanceof HTMLTextAreaElement ? editor.value : editor.textContent;
    const empty = !(text || "").replace(/[\u200b-\u200d\ufeff\r\n]/g, "").length;

    editor.setAttribute("data-twitter-classic-editor", "on");
    editor.setAttribute("data-twitter-classic-editor-empty", empty ? "on" : "off");
    editor.setAttribute("data-twitter-classic-editor-placeholder", placeholder);
    const hasNativePlaceholder = nativePlaceholder || (editor instanceof HTMLTextAreaElement && attributeText);
    editor.setAttribute("data-twitter-classic-editor-native-placeholder-present", hasNativePlaceholder ? "on" : "off");
    if (nativePlaceholder) {
      nativePlaceholder.setAttribute("data-twitter-classic-editor-native-placeholder", "on");
    }
  }

  function counterState(counter, arc) {
    const nativeStroke = arc?.getAttribute("stroke") || arc?.style.stroke || "";
    if (/^(?:#(?:f4212e|e0245e|ff0000)|red)$/i.test(nativeStroke)) {
      return "danger";
    }
    if (/^(?:#(?:ffd400|ffad1f|ffcc00)|yellow|orange)$/i.test(nativeStroke)) {
      return "warning";
    }
    const value = Number(counter.getAttribute("aria-valuenow"));
    const maximum = Number(counter.getAttribute("aria-valuemax"));
    if (counter.hasAttribute("aria-valuenow") && maximum > 0) {
      if (value >= maximum) return "danger";
      if (value / maximum >= 0.9) return "warning";
    }
    return "normal";
  }

  function markCharacterCounters(root) {
    const counters = new Set();
    addMatches(root, COUNTER_SELECTOR, counters);
    counters.forEach((counter) => {
      if (!counter.closest('[data-twitter-classic-composer], [data-testid="toolBar"], [data-twitter-classic-modern-composer]')) {
        return;
      }
      const circles = [...counter.querySelectorAll("svg circle")].filter((circle) =>
        !circle.closest("defs, clipPath, mask") &&
        Number(circle.getAttribute("r")) > 0 &&
        Boolean(circle.getAttribute("stroke") || circle.style.stroke)
      );
      const hasDash = (circle) => Boolean(
        circle.hasAttribute("stroke-dasharray") || circle.hasAttribute("stroke-dashoffset") ||
        circle.style.strokeDasharray || circle.style.strokeDashoffset
      );
      const arc = circles.find(hasDash) || circles.at(-1);
      counter.setAttribute("data-twitter-classic-counter", "on");
      counter.setAttribute("data-twitter-classic-counter-state", counterState(counter, arc));
      circles.forEach((circle) => {
        circle.removeAttribute("data-twitter-classic-counter-track");
        circle.removeAttribute("data-twitter-classic-counter-arc");
        circle.setAttribute(
          circle === arc ? "data-twitter-classic-counter-arc" : "data-twitter-classic-counter-track",
          "on"
        );
      });
    });
  }

  function estimateDraftLength(value) {
    // The early ring is visual guidance for a standard Tweet. Use twitter-text's
    // character weights, with X's own count taking over as soon as it mounts.
    const text = value.normalize("NFC").replace(/https?:\/\/[^\s<>"']+/gi, (url) => {
      const punctuation = url.match(/[.,!?;:]+$/)?.[0] || "";
      return "x".repeat(23) + punctuation;
    });
    let length = 0;
    for (const { segment } of draftCharacters.segment(text)) {
      if (/[\p{Extended_Pictographic}\p{Regional_Indicator}\u20e3]/u.test(segment)) {
        length += 2;
        continue;
      }
      for (const character of segment) {
        const code = character.codePointAt(0);
        const singleWeight = code <= 0x10ff || (code >= 0x2000 && code <= 0x200d) ||
          (code >= 0x2010 && code <= 0x201f) || (code >= 0x2032 && code <= 0x2037);
        length += singleWeight ? 1 : 2;
      }
    }
    return length;
  }

  function restoreEarlyCounter(editor, submit) {
    const slot = submit.parentElement?.firstElementChild;
    if (!slot?.matches('div.flex.items-center.gap-1')) return;

    let counter = slot.querySelector(':scope > [data-twitter-classic-early-counter]');
    const nativeRing = slot.querySelector(COUNTER_SELECTOR);
    // X can leave the progress bar mounted after removing its number.
    const nativeNumber = [...slot.children].some((element) => element !== counter && /^[-−]?\d+$/.test(element.textContent.trim()));
    if (!editor.value || nativeNumber) {
      counter?.remove();
      return;
    }
    if (!counter) {
      counter = document.createElement("span");
      counter.setAttribute("data-twitter-classic-early-counter", "on");
      counter.setAttribute("role", "img");
      counter.title = "Characters remaining";
      const number = document.createElement("span");
      number.setAttribute("data-twitter-classic-early-count", "on");
      const ring = document.createElement("span");
      ring.setAttribute("data-twitter-classic-early-ring", "on");
      ring.setAttribute("aria-hidden", "true");
      counter.append(number, ring);
      slot.prepend(counter);
    }
    const reportedLength = Number.parseInt(nativeRing?.getAttribute("aria-valuenow"), 10);
    const hasNativeLength = Number.isFinite(reportedLength);
    const limit = Number(nativeRing?.getAttribute("aria-valuemax")) || 280;
    const length = Math.min(limit, hasNativeLength ? reportedLength : estimateDraftLength(editor.value));
    const remaining = String(limit - length);
    const [number, ring] = counter.children;
    ring.hidden = Boolean(nativeRing);
    if (number.textContent !== remaining) number.textContent = remaining;
    const label = `${remaining} ${hasNativeLength ? "" : "estimated "}characters remaining`;
    if (counter.getAttribute("aria-label") !== label) counter.setAttribute("aria-label", label);
    const progress = `${length / limit * 100}%`;
    if (counter.style.getPropertyValue("--twitter-counter-progress") !== progress) {
      counter.style.setProperty("--twitter-counter-progress", progress);
    }
  }

  function markComposer(input) {
    if (!(input instanceof Element)) {
      return;
    }

    markEditorPlaceholder(input);
    let current = input;
    for (let depth = 0; current && depth < 18; depth += 1) {
      if (current.matches('[data-testid="primaryColumn"], article[data-testid="tweet"], main') ||
          current.querySelector('article[data-testid="tweet"], [data-testid="tweetPhoto"], [data-testid="videoPlayer"]')) {
        current.removeAttribute("data-twitter-classic-composer-shell");
        current.removeAttribute("data-twitter-classic-composer");
        break;
      }
      const rect = current.getBoundingClientRect();
      if (!rect.height || rect.height <= 190) {
        current.setAttribute("data-twitter-classic-composer-shell", "on");
      }
      current = current.parentElement;
    }

    const placeholder = `${input.getAttribute("data-placeholder") || ""} ${
      input.getAttribute("aria-label") || ""
    } ${input.getAttribute("placeholder") || ""}`;
    const replyLike = pageKind() === "status" || /reply/i.test(placeholder);

    current = input.parentElement;
    for (let depth = 0; current && depth < 15; depth += 1) {
      if (current.matches('[data-testid="primaryColumn"], main')) {
        break;
      }
      const toolbar = current.querySelector('[data-testid="toolBar"]');
      const button = current.querySelector('[data-testid="tweetButtonInline"]');
      if (toolbar && button) {
        if (current.querySelector('article[data-testid="tweet"], [data-testid="tweetPhoto"], [data-testid="videoPlayer"]')) {
          break;
        }
        current.setAttribute(
          "data-twitter-classic-composer",
          replyLike ? "reply" : "home"
        );
        toolbar.setAttribute("data-twitter-classic-composer-toolbar", "on");
        markCharacterCounters(current);

        let actionRow = toolbar.parentElement;
        for (let actionDepth = 0; actionRow && actionDepth < 8; actionDepth += 1) {
          if (actionRow.contains(button)) {
            const rect = actionRow.getBoundingClientRect();
            if (!rect.height || rect.height <= 120) {
              actionRow.setAttribute("data-twitter-classic-composer-actions", "on");
              let part = toolbar;
              while (part && part !== actionRow) {
                part.setAttribute("data-twitter-classic-composer-actions-part", "on");
                part = part.parentElement;
              }
            }
            break;
          }
          actionRow = actionRow.parentElement;
        }
        break;
      }
      current = current.parentElement;
    }

    if (!replyLike) {
      return;
    }

    current = input.parentElement;
    for (let depth = 0; current && depth < 15; depth += 1) {
      if (current.matches('[data-testid="primaryColumn"], main')) {
        break;
      }
      const button = current.querySelector('[data-testid="tweetButtonInline"]');
      if (button) {
        const rect = current.getBoundingClientRect();
        if (!rect.height || rect.height <= 220) {
          current.setAttribute("data-twitter-classic-reply-composer", "on");
          button.removeAttribute("data-twitter-classic-fallback-label");
        }
        break;
      }
      current = current.parentElement;
    }
  }

  function markComposers(root) {
    const inputs = new Set();
    addMatches(root,
      '[contenteditable="true"][data-testid^="tweetTextarea_"], [data-testid^="tweetTextarea_"] [contenteditable="true"], textarea[data-testid^="tweetTextarea_"]',
      inputs
    );
    inputs.forEach(markComposer);

    const inlineButtons = new Set();
    addMatches(root, '[data-testid="tweetButtonInline"]', inlineButtons);
    for (const button of inlineButtons) {
      const text = button.textContent.trim();
      if (text) {
        button.removeAttribute("data-twitter-classic-fallback-label");
      }
    }
  }

  function markModernComposers(root) {
    const toolbars = new Set();
    addMatches(root, MODERN_COMPOSER_TOOLBAR, toolbars);
    const existingToolbar = root instanceof Element && root
      .closest('[data-twitter-classic-modern-composer]')?.querySelector(MODERN_COMPOSER_TOOLBAR);
    if (existingToolbar) toolbars.add(existingToolbar);
    for (const toolbar of toolbars) {
      // The current composer has a native textarea and a container-query toolbar.
      // Stop at the first ancestor containing both, before reaching a feed or dialog.
      let composer = toolbar.parentElement;
      for (let depth = 0; composer && depth < 8; depth++, composer = composer.parentElement) {
        if (composer.matches('main, body, [role="dialog"]') || composer.querySelector('article')) {
          break;
        }
        const editor = composer.querySelector('textarea[aria-multiline="true"]');
        if (!editor) continue;

        composer.setAttribute("data-twitter-classic-modern-composer", "on");
        toolbar.setAttribute("data-twitter-classic-modern-toolbar", "on");
        editor.setAttribute("data-twitter-classic-modern-editor", "on");
        for (const button of composer.querySelectorAll('button[data-slot="xds-button"]')) {
          if (!toolbar.contains(button) && /^(Post|Tweet|Reply)( all)?$/.test(button.textContent.trim())) {
            button.setAttribute("data-twitter-classic-modern-submit", "on");
            rewriteLabelTarget(button);
            restoreEarlyCounter(editor, button);
          }
        }
        toolbar.querySelectorAll("button[aria-label]").forEach(rewriteLabelTarget);
        markCharacterCounters(composer);
        break;
      }
    }
  }

  function restoreModernHomeLabels(root) {
    const composeLinks = new Set();
    addMatches(root, 'a#sidebar-compose-post[href="/compose/post"]', composeLinks);
    for (const link of composeLinks) {
      link.setAttribute("data-twitter-classic-modern-compose", "on");
      rewriteLabelTarget(link);
    }

    if (pageKind() !== "home") return;

    const controls = new Set();
    addMatches(root, 'main :is(button, [role="button"], a)', controls);
    const showPosts = /^(\s*Show [\d,.]+[KMB]?(?: new)? )posts(\s*)$/i;
    for (const control of controls) {
      if (control.closest(`article, ${PROTECTED_CONTENT_SELECTOR}`)) continue;
      const label = control.getAttribute("aria-label");
      if (label && showPosts.test(label)) control.setAttribute("aria-label", label.replace(showPosts, "$1Tweets$2"));
      if (!showPosts.test(control.textContent)) continue;
      const walker = document.createTreeWalker(control, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const next = node.nodeValue.replace(/\bposts(\s*)$/i, "Tweets$1");
        if (next !== node.nodeValue) node.nodeValue = next;
      }
    }
  }

  function replaceTranslationGlyph(original) {
    if (!original) return;
    const parent = original.parentElement;
    const existingIcon = parent.querySelector(':scope > svg[data-twitter-classic-translation-icon]');
    if (existingIcon) {
      if (existingIcon !== original.previousElementSibling) original.before(existingIcon);
    } else {
      const svgNamespace = "http://www.w3.org/2000/svg";
      const icon = document.createElementNS(svgNamespace, "svg");
      icon.setAttribute("viewBox", "0 0 24 24");
      icon.setAttribute("aria-hidden", "true");
      icon.setAttribute("data-twitter-classic-translation-icon", "on");
      const glyph = document.createElementNS(svgNamespace, "path");
      glyph.setAttribute("d", "M7.5 3v2M2.5 6h10M4.5 6c1 4 3.5 7 7 9M10.5 6c-1 4-3.5 7-7 9M13 21l4.5-11L22 21M14.4 17.5h6.2");
      icon.append(glyph);
      original.before(icon);
    }
    original.setAttribute("data-twitter-classic-translation-original", "on");
  }

  function restoreTranslationIcons(root) {
    const controls = new Set();
    addMatches(root, 'button, a[role="button"], [role="button"], [data-testid="translateTweet"]', controls);
    const translationLabel = /^(?:Show translation|Hide translation|Translate (?:post|Tweet))$/i;
    for (const control of controls) {
      if (![control.getAttribute("aria-label"), control.textContent].some((label) => translationLabel.test(label?.trim() || ""))) continue;
      control.setAttribute("data-twitter-classic-translation-control", "on");
      control.removeAttribute("data-twitter-classic-post-twitter");
      replaceTranslationGlyph(control.querySelector(GROK_TRANSLATION_ICON));
    }

    // After translating, X renders the glyph in its own span beside the
    // source-language label, rather than inside the translation button.
    const badges = new Set();
    addMatches(root, `article ${GROK_TRANSLATION_ICON}`, badges);
    const labels = new Set();
    addMatches(root, "article span:nth-child(2)", labels);
    for (const label of labels) {
      const glyph = label.previousElementSibling;
      if (glyph?.matches("span")) {
        const icon = glyph.querySelector(GROK_TRANSLATION_ICON);
        if (icon) badges.add(icon);
      }
    }
    for (const icon of badges) {
      const badge = icon.closest("span");
      if (!badge?.matches(":first-child") || badge.closest(PROTECTED_CONTENT_SELECTOR)) continue;
      const label = badge.nextElementSibling;
      if (!label?.matches("span") || !/^Translated from \S/i.test(label.textContent.trim())) continue;
      replaceTranslationGlyph(icon);
    }
  }

  function markBackButtons(root) {
    const buttons = new Set();
    addMatches(
      root,
      '[data-testid="app-bar-back"], :is(button, a, [role="button"])[aria-label="Back"]',
      buttons
    );
    for (const button of buttons) {
      if (!button.closest(MEDIA_SELECTOR)) {
        button.setAttribute("data-twitter-classic-back", "on");
      }
    }
  }

  function markSearchPill(input) {
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    input.setAttribute("data-twitter-classic-search-input", "on");
    let oldShell = input.parentElement;
    for (let depth = 0; oldShell && depth < 10; depth += 1) {
      if (oldShell.matches('[data-testid="primaryColumn"], [data-testid="sidebarColumn"], main')) {
        break;
      }
      oldShell.removeAttribute("data-twitter-classic-search-pill");
      oldShell = oldShell.parentElement;
    }
    const sidebar = input.closest('[data-testid="sidebarColumn"]');
    if (sidebar) {
      const inputRect = input.getBoundingClientRect();
      let shell = input.parentElement;
      for (let depth = 0; shell && shell !== sidebar && depth < 10; depth += 1) {
        const rect = shell.getBoundingClientRect();
        if (
          rect.width >= Math.max(180, inputRect.width * 0.8) &&
          rect.height > 0 &&
          rect.height <= 96
        ) {
          shell.setAttribute("data-twitter-classic-search-shell", "on");
        }
        shell = shell.parentElement;
      }
    }

    let current = input;
    let fallback = input.parentElement;
    for (let depth = 0; current?.parentElement && depth < 10; depth += 1) {
      current = current.parentElement;
      if (current.matches('[data-testid="primaryColumn"], [data-testid="sidebarColumn"], main')) {
        break;
      }
      if (current.matches('form, [role="search"]')) {
        fallback = current;
      }
      const rect = current.getBoundingClientRect();
      const radius = Number.parseFloat(getComputedStyle(current).borderTopLeftRadius) || 0;
      if (rect.height >= 28 && rect.height <= 84 && radius >= Math.min(16, rect.height * 0.3)) {
        current.setAttribute("data-twitter-classic-search-pill", "on");
        return;
      }
    }
    fallback?.setAttribute("data-twitter-classic-search-pill", "on");
  }

  function markSearchPills(root) {
    const inputs = new Set();
    addMatches(
      root,
      [
        'input[placeholder*="Search" i]',
        'input[aria-label*="Search" i]',
        '[data-testid="SearchBox_Search_Input"]',
        '[data-testid="dm-search-bar"] input'
      ].join(","),
      inputs
    );
    inputs.forEach(markSearchPill);

    document.querySelectorAll('[data-testid="sidebarColumn"]').forEach((sidebar) => {
      const search = sidebar.querySelector(
        'form[role="search"], [data-twitter-classic-search-pill="on"]'
      );
      if (!search) {
        return;
      }
      const searchRect = search.getBoundingClientRect();
      [...sidebar.querySelectorAll("div, section")].slice(0, 500).forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (
          !element.textContent.trim() &&
          rect.width >= searchRect.width * 0.85 &&
          rect.height > 0 &&
          rect.height <= 26 &&
          rect.top >= searchRect.bottom - 1 &&
          rect.top <= searchRect.bottom + 48
        ) {
          element.setAttribute("data-twitter-classic-search-separator", "on");
        }
      });
    });
  }

  function clearDeElonMarkers() {
    document
      .querySelectorAll('[data-twitter-classic-post-twitter="on"]')
      .forEach((element) => element.removeAttribute("data-twitter-classic-post-twitter"));
  }

  function markDeElonCardShells(card) {
    if (!(card instanceof Element)) {
      return;
    }
    card.setAttribute("data-twitter-classic-post-twitter", "on");

    // X wraps right-rail cards in two single-child spacing/border shells.
    // Hiding only the Premium card leaves those shells as two empty lines.
    let shell = card.parentElement;
    for (let depth = 0; shell && depth < 2; depth += 1) {
      if (shell.matches('[data-testid="sidebarColumn"], main, body') || shell.children.length !== 1) {
        break;
      }
      const rect = shell.getBoundingClientRect();
      if (rect.width > 620 || rect.height > 500) {
        break;
      }
      shell.setAttribute("data-twitter-classic-post-twitter", "on");
      shell = shell.parentElement;
    }
  }

  function markDeElonControls(root) {
    if (!options.deElon) {
      clearDeElonMarkers();
      return;
    }

    const direct = new Set();
    addMatches(
      root,
      [
        'header[role="banner"] a[href="/i/grok"]',
        'header[role="banner"] a[href^="/i/premium"]',
        'header[role="banner"] a[href="/i/connect_people"]',
        'header[role="banner"] a[href*="creators/studio"]',
        `${PRIMARY_NAV} > a:is([href="/i/grok"], [href="/i/connect_people"], [href="/i/calls"], [href^="/i/premium"], [href*="creators/studio"])`,
        'a[href="/i/grok"]',
        ':is(button, a, [role="button"])[aria-label*="Grok" i]',
        ':is(button, a, [role="button"])[title*="Grok" i]',
        '[data-testid*="grok" i]',
        '[data-testid="contentDisclosureButton"]',
        '[data-testid="verified_profile_visitor_upsell"]'
      ].join(","),
      direct
    );
    const profileSummaryControls = new Set();
    addMatches(root, 'button, [role="button"], a[href]:has(svg[data-icon="icon-logo-grok"], use[href="#icon-logo-grok"])', profileSummaryControls);
    for (const control of profileSummaryControls) {
      const label = control.getAttribute("aria-label") || control.textContent;
      if (/^Profile Summary$/i.test(label.trim())) direct.add(control);
    }
    for (const element of direct) {
      if (element.closest('[data-twitter-classic-translation-control]')) continue;
      if (element.closest(PROTECTED_CONTENT_SELECTOR)) continue;
      if (element.closest(`article, ${POST_ROW_SELECTOR}`) && !element.matches('button')) continue;
      const dock = element.closest('[data-slot="xds-dock-window"]');
      (dock || element).setAttribute("data-twitter-classic-post-twitter", "on");
    }

    const sidebarCards = new Set();
    addMatches(root, 'aside section:has(> h2, > * > h2)', sidebarCards);
    for (const card of sidebarCards) {
      const heading = card.querySelector(":scope > h2, :scope > * > h2");
      if (/^Today(?:’|')s News$/i.test(heading.textContent.trim())) {
        card.setAttribute("data-twitter-classic-post-twitter", "on");
      }
    }

    const anchors = new Set();
    addMatches(root, 'a[href^="/i/premium"], a[href*="premium_sign_up"]', anchors);
    for (const anchor of anchors) {
      if (anchor.closest(`article, ${PROTECTED_CONTENT_SELECTOR}`)) continue;
      const callout = anchor.closest('main [data-slot="xds-callout"]');
      if (callout && anchor.matches('a[href^="/i/premium_sign_up"]')) {
        callout.setAttribute("data-twitter-classic-post-twitter", "on");
        continue;
      }
      let card = anchor.closest("aside, section");
      if (card) {
        const rect = card.getBoundingClientRect();
        if (rect.height > 420 || rect.width > 620) {
          card = null;
        }
      }
      markDeElonCardShells(card || anchor);
    }

    const textCandidates = root.querySelectorAll?.("h1, h2, h3, span, div[dir='auto']") || [];
    for (const textElement of [...textCandidates].slice(0, 1600)) {
      if (!/^(Grok|Premium|Subscribe to Premium|Creator Studio|Get Verified|Generate image)$/i.test(textElement.textContent.trim())) {
        continue;
      }
      const control = textElement.closest(
        'header[role="banner"] a, header[role="banner"] button, [role="menuitem"], aside, section'
      );
      if (control && !textElement.closest(`article, ${PROTECTED_CONTENT_SELECTOR}`)) {
        if (control.closest('[data-testid="sidebarColumn"]')) {
          markDeElonCardShells(control);
        } else {
          control.setAttribute("data-twitter-classic-post-twitter", "on");
        }
      }
    }
  }

  function clearGrokPrompt(row) {
    row.removeAttribute("data-twitter-classic-grok-prompt");
    grokPrompts.delete(row);
  }

  function hasPaidPostBadge(article) {
    for (const menu of article.querySelectorAll(POST_MENU_SELECTOR)) {
      if (menu.closest(EXCLUDED_AD_LABEL_SELECTOR) || menu.closest("article") !== article) continue;
      // The visible badge is next to the menu, not part of the author's
      // name or the tweet text. Legacy layouts may wrap the menu once.
      for (let branch = menu, depth = 0; depth < 2; depth += 1, branch = branch.parentElement) {
        const group = branch.parentElement;
        if (!group || group === article) break;
        for (const badge of group.children) {
          if (badge === branch || !badge.matches("span, div, [aria-label]")) continue;
          if (badge.closest(EXCLUDED_AD_LABEL_SELECTOR) ||
              badge.querySelector(`a, button, [role="link"], [role="button"], ${EXCLUDED_AD_LABEL_SELECTOR}`)) continue;
          if (AD_BADGE_TEXT.test((badge.getAttribute("aria-label") || badge.textContent).trim())) return true;
        }
      }
    }
    return false;
  }

  function markFeedAds(root) {
    if (root.getRootNode() instanceof ShadowRoot) return;
    const posts = new Set();
    addMatches(root, `:is(main, [role="main"]) :is(article, ${POST_ROW_SELECTOR}, [data-testid="cellInnerDiv"])`, posts);
    const rows = new Set();
    for (const post of posts) {
      if (post.closest(QUOTED_POST_SELECTOR)) continue;
      rows.add(post.closest(POST_ROW_SELECTOR) || post.closest('[data-testid="cellInnerDiv"]') || post);
    }
    for (const row of rows) {
      const article = row.matches("article") ? row : row.querySelector("article");
      const paid = article && !article.closest(QUOTED_POST_SELECTOR) && (
        article.closest('[data-testid="placementTracking"]') || hasPaidPostBadge(article) ||
        [...row.querySelectorAll('a[href], [aria-label^="Ad from " i], [data-testid="promotedIndicator"], [data-testid="placementTracking"]')]
          .some((label) => {
            if (label.closest(EXCLUDED_AD_LABEL_SELECTOR)) return false;
            if (label.matches('[data-testid="promotedIndicator"], [data-testid="placementTracking"], [aria-label^="Ad from " i]')) return true;
            return label.matches('a[href^="http://" i], a[href^="https://" i]') &&
              AD_DISCLOSURE_TEXT.test(label.textContent.trim());
          }));
      row.toggleAttribute("data-twitter-classic-feed-ad", Boolean(paid));
    }
  }

  function markGrokPrompts(root) {
    if (!options.deElon || root.getRootNode() instanceof ShadowRoot) return;
    const bodies = new Set();
    addMatches(root, POST_TEXT_SELECTOR, bodies);
    for (const body of bodies) {
      const article = body.closest("article");
      if (!article?.closest('main, [role="main"]') || body.closest(QUOTED_POST_SELECTOR)) continue;

      const row = article.closest(POST_ROW_SELECTOR) || article;
      const existing = grokPrompts.get(row);
      const path = row.getAttribute("data-href") || article.querySelector('a[href*="/status/"]:has(time)')?.getAttribute("href");
      const isOpenTweet = pageKind() === "status" && (!path || path.split("?")[0] === location.pathname);
      const directPrompt = /^(?:(?:hey|hi|yo)\s+)?@grok(?=$|[\s,.:!?])/i.test(body.textContent.trim());
      if (isOpenTweet || !directPrompt || row.closest('[data-twitter-classic-feed-ad]')) {
        if (existing === body) clearGrokPrompt(row);
        continue;
      }
      row.setAttribute("data-twitter-classic-grok-prompt", "collapsed");
      grokPrompts.set(row, body);
    }
  }

  function containsOnlyHiddenPost(slot) {
    for (let element = slot; element; ) {
      if (element.hasAttribute("data-twitter-classic-feed-ad") ||
          (options.deElon && element.matches('[data-twitter-classic-grok-prompt="collapsed"]'))) return true;
      const child = element.firstElementChild;
      if (!child || child.nextElementSibling) return false;
      element = child;
    }
    return false;
  }

  function reconcileVirtualFeedSlots() {
    const checkNativeVisibility = [];
    for (const slot of document.querySelectorAll(`${VIRTUAL_FEED_SLOT_SELECTOR}, [${MEASURED_HIDDEN_SLOT}]`)) {
      if (!slot.matches(VIRTUAL_FEED_SLOT_SELECTOR)) {
        slot.removeAttribute(MEASURED_HIDDEN_SLOT);
      } else if (containsOnlyHiddenPost(slot)) {
        slot.toggleAttribute(MEASURED_HIDDEN_SLOT, true);
      } else {
        // Sample the native display without our shim so a recycled row (or a
        // row no longer hidden by another stylesheet) can become visible.
        slot.removeAttribute(MEASURED_HIDDEN_SLOT);
        if (options.deElon && slot.style.position === "absolute") checkNativeVisibility.push(slot);
      }
    }
    const hidden = checkNativeVisibility.filter((slot) => getComputedStyle(slot).display === "none");
    for (const slot of hidden) slot.setAttribute(MEASURED_HIDDEN_SLOT, "");
  }

  function parseColor(value) {
    const match = value?.match(/rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)(?:\D+([\d.]+))?/i);
    if (!match) {
      return null;
    }
    return {
      r: Number(match[1]),
      g: Number(match[2]),
      b: Number(match[3]),
      a: match[4] === undefined ? 1 : Number(match[4])
    };
  }

  function isDarkColor(value) {
    const color = parseColor(value);
    return Boolean(color && color.a > 0.5 && Math.max(color.r, color.g, color.b) <= 52);
  }

  function isLightColor(value) {
    const color = parseColor(value);
    return Boolean(color && color.a > 0.6 && Math.min(color.r, color.g, color.b) >= 218);
  }

  function isSaturatedColor(value) {
    const color = parseColor(value);
    if (!color || color.a < 0.55) {
      return false;
    }
    const max = Math.max(color.r, color.g, color.b);
    const min = Math.min(color.r, color.g, color.b);
    return max >= 105 && max - min >= 65;
  }

  function hasSaturatedAncestor(element) {
    let current = element;
    for (let depth = 0; current && depth < 9; depth += 1) {
      if (isSaturatedColor(getComputedStyle(current).backgroundColor)) {
        return true;
      }
      if (current.matches('main, [role="dialog"], [role="menu"], header[role="banner"]')) {
        break;
      }
      current = current.parentElement;
    }
    return false;
  }

  function normalizeElement(element) {
    if (!(element instanceof Element)) {
      return;
    }
    const style = getComputedStyle(element);
    if (
      element.closest(`${MEDIA_SELECTOR}, ${AVATAR_SELECTOR}`) ||
      /url\s*\(/i.test(style.backgroundImage)
    ) {
      // React Native keeps many avatars in CSS backgrounds. Treat those as
      // image assets so the surface fallback never clears the picture.
      element.removeAttribute("data-twitter-classic-surface");
      element.removeAttribute("data-twitter-classic-border");
      element.removeAttribute("data-twitter-classic-ui-text");
      return;
    }
    if (style.display === "none") {
      return;
    }

    if (isDarkColor(style.backgroundColor) && !isSaturatedColor(style.backgroundColor)) {
      const rect = element.getBoundingClientRect();
      const radius = Number.parseFloat(style.borderTopLeftRadius) || 0;
      const soft =
        radius >= 10 &&
        rect.width > 0 &&
        rect.height > 0 &&
        rect.width <= 780 &&
        rect.height <= 260;
      element.setAttribute("data-twitter-classic-surface", soft ? "soft" : "surface");
    }

    if (
      isDarkColor(style.borderTopColor) ||
      isDarkColor(style.borderRightColor) ||
      isDarkColor(style.borderBottomColor) ||
      isDarkColor(style.borderLeftColor)
    ) {
      element.setAttribute("data-twitter-classic-border", "on");
    }

    if (isLightColor(style.color) && !hasSaturatedAncestor(element)) {
      element.setAttribute("data-twitter-classic-ui-text", "on");
    }
  }

  function normalizeVisualLeaks(root) {
    const element = root instanceof Text ? root.parentElement : root;
    if (!(element instanceof Element || element instanceof Document || element instanceof DocumentFragment)) {
      return;
    }
    const nodes = [];
    if (element instanceof Element && element.matches(NORMALIZABLE_SELECTOR)) {
      nodes.push(element);
    }
    nodes.push(...(element.querySelectorAll?.(NORMALIZABLE_SELECTOR) || []));
    const limit = element instanceof DocumentFragment ||
      element === document.documentElement || element === document ? 3500 : 900;
    nodes.slice(0, limit).forEach(normalizeElement);
  }

  function observeChanges(mutations) {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach(schedule);
        if (!mutation.addedNodes.length && mutation.removedNodes.length) {
          schedule(mutation.target);
        }
      } else if (!(mutation.target === document.documentElement && mutation.attributeName === "style")) {
        schedule(mutation.target);
      }
    }
  }

  function restoreChatShadowRoots() {
    const hosts = new Set(document.querySelectorAll(
      '[data-testid="xchatEmbedRoute"], [data-testid="xchatEmbedOverlays"], [data-testid="xchatEmbedDrawer"]'
    ));
    // Recent X builds dropped the host test IDs. The mounted Chat document
    // carries its own marker inside the open shadow root.
    for (const candidate of document.querySelectorAll('body > div, main [class*="--dm-bottom-inset"], [data-slot="xds-dock-window"], [data-slot="xds-dock-window"] div')) {
      if (candidate.shadowRoot?.querySelector('[data-xchat-root]')) hosts.add(candidate);
    }
    let waitingForShadow = false;
    let routeMounted = false;
    for (const host of hosts) {
      host.setAttribute("data-twitter-classic-chat-host", "on");
      host.setAttribute("data-twitter-classic-theme", options.classicDark ? "dim" : "light");
      const shadow = host.shadowRoot;
      if (!shadow) {
        waitingForShadow = true;
        continue;
      }
      if (host.matches('[data-testid="xchatEmbedRoute"]') || shadow.querySelector('[data-xchat-root="route"]')) {
        routeMounted = true;
      }
      let stylesheet = shadow.querySelector('link[data-twitter-classic-chat-stylesheet="on"]');
      if (!stylesheet) {
        stylesheet = document.createElement("link");
        stylesheet.rel = "stylesheet";
        stylesheet.href = chatStylesheetUrl;
        stylesheet.setAttribute("data-twitter-classic-chat-stylesheet", "on");
        shadow.append(stylesheet);
      }
      if (!chatRoots.has(shadow)) {
        const chatObserver = new MutationObserver(observeChanges);
        chatObserver.observe(shadow, {
          subtree: true,
          childList: true,
          characterData: true,
          attributes: true,
          attributeFilter: OBSERVED_ATTRIBUTES
        });
        chatRoots.set(shadow, { host, observer: chatObserver });
        pendingRoots.add(shadow);
      }
    }
    for (const [shadow, entry] of chatRoots) {
      if (!entry.host.isConnected) {
        entry.observer.disconnect();
        chatRoots.delete(shadow);
      }
    }
    // attachShadow itself does not fire the document observer. Retry only
    // while entering Chat or while a known embed host is still attaching.
    if ((pageKind() === "messages" && !routeMounted) || waitingForShadow) {
      if (!chatRetryTimer && chatRetryCount < 24) {
        chatRetryCount += 1;
        chatRetryTimer = window.setTimeout(() => {
          chatRetryTimer = 0;
          schedule(document.documentElement);
        }, 350);
      }
    } else {
      chatRetryCount = 0;
      if (chatRetryTimer) {
        clearTimeout(chatRetryTimer);
        chatRetryTimer = 0;
      }
    }
  }

  function syncNativeAuthForm(input) {
    const form = input.closest("form");
    if (!form) {
      return;
    }

    const fields = [...form.querySelectorAll('input:not([type="hidden"])')].filter((field) => {
      const rect = field.getBoundingClientRect();
      const style = getComputedStyle(field);
      return (
        !field.disabled &&
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== "none" &&
        style.visibility !== "hidden"
      );
    });
    const button = [...form.querySelectorAll('button, [role="button"]')].find((candidate) =>
      /^Continue$/i.test(candidate.textContent.trim())
    );
    if (!button) {
      return;
    }

    const filled = fields.length > 0 && fields.every((field) => Boolean(field.value.trim()));
    button.setAttribute("data-twitter-classic-native-auth-submit", "on");
    button.setAttribute(
      "data-twitter-classic-native-auth-filled",
      filled ? "on" : "off"
    );
  }

  function markNativeAuthControls() {
    document
      .querySelectorAll(
        [
          'form input[type="text"]',
          'form input[type="email"]',
          'form input[type="password"]',
          'form input[autocomplete="username"]'
        ].join(",")
      )
      .forEach((input) => {
        const rect = input.getBoundingClientRect();
        if (!rect.width || !rect.height) {
          return;
        }

        input.setAttribute("data-twitter-classic-native-auth-input", "on");
        const shell = input.closest("label") || input.parentElement;
        shell?.setAttribute("data-twitter-classic-native-auth-input-shell", "on");

        if (!input.hasAttribute("data-twitter-classic-native-auth-bound")) {
          input.setAttribute("data-twitter-classic-native-auth-bound", "on");
          const refresh = () => syncNativeAuthForm(input);
          input.addEventListener("input", refresh);
          input.addEventListener("change", refresh);
        }
        syncNativeAuthForm(input);
      });
  }

  function reconcileSignedOutLanding() {
    const root = document.documentElement;
    const existing = document.getElementById("twitter-classic-landing");
    const footer = document.getElementById("twitter-classic-landing-footer");
    const authRoute =
      location.pathname === "/" ||
      /^\/i\/(?:jf\/onboarding|flow\/(?:login|signup)|onboarding)/i.test(location.pathname);
    const isLanding =
      authRoute &&
      !document.querySelector('header[role="banner"]') &&
      (location.pathname !== "/" ||
        /Happening now|Log ?in|Sign up/i.test(document.body?.textContent || "") ||
        Boolean(
          document.querySelector(
            '[role="dialog"], [aria-modal="true"], [data-testid="sheetDialog"]'
          )
        ));

    // v1.3 originally rendered a replacement page. Keep X's real auth DOM
    // and flows instead; only semantic markers and CSS are applied now.
    existing?.remove();
    footer?.remove();

    if (!isLanding) {
      root.removeAttribute("data-twitter-classic-landing");
      return;
    }

    root.setAttribute("data-twitter-classic-landing", "native");
    const landingRoot = document.querySelector('main, [role="main"], #react-root');
    landingRoot?.setAttribute("data-twitter-classic-native-landing", "on");

    const headings = [...document.querySelectorAll("h1, h2, [role='heading']")];
    const heading = headings.find((element) => /^Happening now\.?$/i.test(element.textContent.trim()));
    if (heading) {
      heading.setAttribute("data-twitter-classic-native-landing-heading", "on");
      const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        if (/^\s*Happening now\.\s*$/i.test(node.nodeValue)) {
          node.nodeValue = node.nodeValue.replace(/\.\s*$/, "");
        }
        node = walker.nextNode();
      }
    }

    markNativeAuthControls();

    const largeLogo = [...document.querySelectorAll("svg")]
      .filter((svg) => !svg.closest('button, a, [role="button"]'))
      .map((svg) => ({ svg, rect: svg.getBoundingClientRect() }))
      .filter(({ rect }) => rect.width >= 220 && rect.height >= 220)
      .sort((a, b) => b.rect.width * b.rect.height - a.rect.width * a.rect.height)[0];

    if (largeLogo) {
      largeLogo.svg.setAttribute("data-twitter-classic-native-landing-x", "on");
      let art = largeLogo.svg.parentElement;
      let current = art;
      for (let depth = 0; current && depth < 7; depth += 1) {
        if (current.matches("body, #react-root, main, [role='main']")) {
          break;
        }
        const rect = current.getBoundingClientRect();
        if (rect.width >= Math.min(360, innerWidth * 0.3) && rect.height >= innerHeight * 0.5) {
          art = current;
          break;
        }
        current = current.parentElement;
      }
      art?.setAttribute("data-twitter-classic-native-landing-art", "on");
    }

    document
      .querySelectorAll(
        ':is([role="dialog"], [aria-modal="true"], [data-testid="sheetDialog"]) svg'
      )
      .forEach((svg) => {
        if (svg.closest('button, [role="button"]')) {
          return;
        }
        const dialog = svg.closest(
          '[role="dialog"], [aria-modal="true"], [data-testid="sheetDialog"]'
        );
        const rect = svg.getBoundingClientRect();
        const dialogRect = dialog?.getBoundingClientRect();
        if (
          dialogRect &&
          rect.width >= 28 &&
          rect.width <= 100 &&
          rect.height >= 28 &&
          rect.height <= 100 &&
          Math.abs(rect.left + rect.width / 2 - (dialogRect.left + dialogRect.width / 2)) < 140
        ) {
          svg.setAttribute("data-twitter-classic-native-auth-x", "on");
          svg.parentElement?.setAttribute("data-twitter-classic-native-auth-logo", "on");
        }
      });

    const qrCard = [...document.querySelectorAll("div, section, aside")]
      .map((element) => ({ element, rect: element.getBoundingClientRect() }))
      .filter(
        ({ element, rect }) =>
          /Scan to get the app/i.test(element.textContent || "") &&
          rect.width >= 140 &&
          rect.width <= 380 &&
          rect.height >= 160 &&
          rect.height <= 430
      )
      .sort(
        (left, right) =>
          left.rect.width * left.rect.height - right.rect.width * right.rect.height
      )[0]?.element;

    if (qrCard) {
      qrCard.setAttribute("data-twitter-classic-native-qr-card", "on");
      const qrMedia = [...qrCard.querySelectorAll("svg, img, canvas")]
        .map((element) => ({ element, rect: element.getBoundingClientRect() }))
        .filter(
          ({ rect }) =>
            rect.width >= 90 &&
            rect.height >= 90 &&
            Math.abs(rect.width - rect.height) <= Math.max(20, rect.width * 0.2)
        )
        .sort((left, right) => right.rect.width - left.rect.width)[0];
      if (qrMedia) {
        let mediaShell = qrMedia.element.parentElement;
        for (let depth = 0; mediaShell && mediaShell !== qrCard && depth < 3; depth += 1) {
          const rect = mediaShell.getBoundingClientRect();
          if (
            rect.width <= qrMedia.rect.width + 32 &&
            rect.height <= qrMedia.rect.height + 32
          ) {
            mediaShell.setAttribute("data-twitter-classic-native-qr-media", "on");
            break;
          }
          mediaShell = mediaShell.parentElement;
        }
      }
    }

    document.querySelectorAll("footer, nav[aria-label='Footer']").forEach((footerElement) => {
      footerElement.setAttribute("data-twitter-classic-native-landing-footer", "on");
      const walker = document.createTreeWalker(footerElement, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        if (/\u00a9\s*20\d{2}\s+X Corp\.?/i.test(node.nodeValue)) {
          node.nodeValue = node.nodeValue.replace(
            /\u00a9\s*20\d{2}\s+X Corp\.?/i,
            "\u00a9 2021 Twitter, Inc."
          );
        }
        node = walker.nextNode();
      }
    });
  }

  function restoreFooterBranding(root) {
    const footers = new Set();
    addMatches(root, 'nav[aria-label="Footer"], [data-testid="sidebarColumn"] footer, footer[role="contentinfo"]', footers);
    for (const footer of footers) {
      const walker = document.createTreeWalker(footer, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const next = node.nodeValue.replace(/(\u00a9\s*20\d{2}\s+)X Corp\.?/gi, "$1Twitter, Inc.");
        if (next !== node.nodeValue) node.nodeValue = next;
      }
    }
  }

  function restoreChatSuggestionCopy(root) {
    const suggestions = new Set();
    addMatches(root, '[data-testid^="dm-cold-inbox-suggestion-"]', suggestions);
    for (const suggestion of suggestions) {
      const walker = document.createTreeWalker(suggestion, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const next = node.nodeValue.replace(/^(\s*)You interact a lot on X(\s*)$/, "$1You interact a lot on Twitter$2");
        if (next !== node.nodeValue) node.nodeValue = next;
      }
    }
  }

  function processRoot(root) {
    const normalized = root instanceof Text ? root.parentElement : root;
    if (!(normalized instanceof Element || normalized instanceof Document || normalized instanceof DocumentFragment)) {
      return;
    }
    restoreLabels(normalized);
    restoreProfileTabs(normalized);
    rewriteNotificationPhrases(normalized);
    preserveNewTweetsPill(normalized);
    restoreBirdAndHomeIcon(normalized);
    markComposers(normalized);
    markModernComposers(normalized);
    restoreModernHomeLabels(normalized);
    restoreTranslationIcons(normalized);
    restoreChatSuggestionCopy(normalized);
    restoreFooterBranding(normalized);
    markCharacterCounters(normalized);
    markBackButtons(normalized);
    markSearchPills(normalized);
    markDeElonControls(normalized);
    markFeedAds(normalized);
    markGrokPrompts(normalized);
    normalizeVisualLeaks(normalized);
  }

  function flush() {
    scheduledFrame = 0;
    if (options.getBackToX) {
      pendingRoots.clear();
      return;
    }

    setRootState();
    restoreDocumentBranding();
    restoreHomeChrome();
    reconcileSignedOutLanding();
    restoreChatShadowRoots();
    for (const [row, body] of grokPrompts) {
      if (!row.isConnected || !row.contains(body)) clearGrokPrompt(row);
    }

    const roots = [...pendingRoots];
    pendingRoots.clear();
    if (!roots.length) {
      roots.push(document.documentElement);
    }
    for (const root of roots) {
      if (root?.isConnected === false) {
        continue;
      }
      processRoot(root);
    }
    reconcileVirtualFeedSlots();
    markShellReady();
  }

  function schedule(root = document.documentElement) {
    if (options.getBackToX) {
      return;
    }
    const normalized = root instanceof Text ? root.parentElement : root;
    if (!normalized) {
      return;
    }
    pendingRoots.add(normalized);
    if (pendingRoots.size > 36) {
      pendingRoots.clear();
      pendingRoots.add(document.documentElement);
    }
    if (!scheduledFrame) {
      scheduledFrame = requestAnimationFrame(flush);
    }
  }

  function start() {
    if (initialized) {
      return;
    }
    initialized = true;

    if (options.getBackToX) {
      const root = document.documentElement;
      root?.setAttribute(ATTR.enabled, "off");
      root?.setAttribute(ATTR.ready, "ready");
      root?.removeAttribute(ATTR.theme);
      root?.removeAttribute(ATTR.deElon);
      root?.removeAttribute(ATTR.page);
      return;
    }

    setRootState();
    if (!document.documentElement.hasAttribute(ATTR.ready)) {
      document.documentElement.setAttribute(ATTR.ready, "loading");
    }
    readyTimer = window.setTimeout(() => {
      readyTimer = 0;
      markShellReady(true);
    }, 8000);
    observer = new MutationObserver(observeChanges);
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: OBSERVED_ATTRIBUTES
    });

    document.addEventListener("input", (event) => {
      const target = event.composedPath()[0];
      if (target instanceof Element &&
          target.matches('[data-twitter-classic-editor], [data-twitter-classic-modern-editor], [data-testid^="tweetTextarea_"]')) {
        schedule(target);
      }
    }, true);

    schedule(document.documentElement);
    document.addEventListener("DOMContentLoaded", () => schedule(document), { once: true });
    window.addEventListener("pageshow", () => schedule(document));
    window.addEventListener("popstate", () => schedule(document));
    window.addEventListener("hashchange", () => schedule(document));
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }
    const previous = options;
    const next = { ...options };
    for (const name of Object.keys(DEFAULTS)) {
      if (changes[name] && typeof changes[name].newValue === "boolean") {
        next[name] = changes[name].newValue;
      }
    }
    options = normalizedOptions(next);
    if (!initialized) {
      return;
    }
    if (previous.getBackToX !== options.getBackToX) {
      location.reload();
      return;
    }
    setRootState();
    schedule(document.documentElement);
  });

  chrome.storage.local.get(DEFAULTS, (storedOptions) => {
    options = chrome.runtime.lastError ? { ...DEFAULTS } : normalizedOptions(storedOptions);
    if (document.documentElement) {
      start();
    } else {
      document.addEventListener("readystatechange", start, { once: true });
    }
  });
})();
