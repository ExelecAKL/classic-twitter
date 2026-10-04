(() => {
  "use strict";

  const ROOT_ATTRIBUTE = "data-twitter-classic";
  const READY_ATTRIBUTE = "data-twitter-classic-ready";
  const LOGO_ATTRIBUTE = "data-twitter-classic-logo";
  const FAVICON_ID = "twitter-classic-favicon";

  const LOGO_SELECTOR = [
    'header[role="banner"] h1 a[href="/home"]',
    'header[role="banner"] h1 a[href$="/home"]',
    'header[role="banner"] h1 a[aria-label="X"]',
    'header[role="banner"] h1 a[aria-label="Twitter"]'
  ].join(",");

  const LABEL_TARGET_SELECTOR = [
    '[role="menuitem"]',
    '[role="tab"]',
    '[role="tooltip"]',
    '[role="dialog"] button',
    '[role="dialog"] [role="button"]',
    '[data-testid="primaryColumn"] [role="button"]',
    '[data-testid="trend"]',
    '[data-testid="SideNav_NewTweet_Button"]',
    '[data-testid="tweetButton"]',
    '[data-testid="tweetButtonInline"]',
    '[data-testid="retweet"]',
    '[data-testid="unretweet"]',
    '[data-testid="socialContext"]',
    'header[role="banner"] nav a',
    "input[placeholder]",
    "textarea[placeholder]"
  ].join(",");

  const PROTECTED_CONTENT_SELECTOR = [
    '[data-testid="tweetText"]',
    '[data-testid="User-Name"]',
    '[data-testid="UserDescription"]',
    '[data-testid="Tweet-User-Avatar"]',
    '[data-testid="SideNav_AccountSwitcher_Button"]',
    '[data-testid="UserCell"]',
    '[data-testid="card.wrapper"]',
    '[data-testid="card.layoutLarge.media"]',
    '[contenteditable="true"]'
  ].join(",");

  const SAFE_ARTICLE_CONTROL_SELECTOR = [
    '[data-testid="toolBar"]',
    '[data-testid="retweet"]',
    '[data-testid="unretweet"]',
    '[data-testid="socialContext"]',
    '[data-testid="tweetButton"]',
    '[data-testid="tweetButtonInline"]'
  ].join(",");

  const EXACT_LABELS = new Map([
    ["Chat", "Messages"],
    ["Search", "Search Twitter"],
    ["Search X", "Search Twitter"],
    ["Post", "Tweet"],
    ["Posts", "Tweets"],
    ["post", "tweet"],
    ["posts", "tweets"],
    ["Post your reply", "Tweet your reply"],
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

  const OBSERVED_ATTRIBUTES = [
    "aria-label",
    "aria-description",
    "title",
    "placeholder",
    "href",
    "rel"
  ];

  let birdUrl;
  let scheduledFrame = 0;
  let readyTimer = 0;
  const pendingRoots = new Set();

  try {
    birdUrl = chrome.runtime.getURL("assets/twitter-bird.svg");
  } catch (_error) {
    return;
  }

  function enableThemeScope() {
    const root = document.documentElement;
    if (!root) {
      return;
    }

    root.setAttribute(ROOT_ATTRIBUTE, "on");
    const birdImage = `url("${birdUrl}")`;
    if (root.style.getPropertyValue("--twitter-classic-bird-image") !== birdImage) {
      root.style.setProperty("--twitter-classic-bird-image", birdImage);
    }
    if (!root.hasAttribute(READY_ATTRIBUTE)) {
      root.setAttribute(READY_ATTRIBUTE, "loading");
    }
  }

  function markThemeReady(force = false) {
    const root = document.documentElement;
    if (
      !root ||
      (!force &&
        !document.querySelector(
          'header[role="banner"], main[role="main"], [data-testid="primaryColumn"]'
        ))
    ) {
      return;
    }

    root.setAttribute(READY_ATTRIBUTE, "ready");
    if (readyTimer) {
      clearTimeout(readyTimer);
      readyTimer = 0;
    }
  }

  function replaceExactLabel(value) {
    const match = value.match(/^(\s*)(.*?)(\s*)$/s);
    if (!match) {
      return value;
    }

    const replacement = EXACT_LABELS.get(match[2]);
    return replacement === undefined
      ? value
      : `${match[1]}${replacement}${match[3]}`;
  }

  function replacePostCountLabels(value) {
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
    if (
      target.matches('[data-testid="socialContext"]') ||
      target.closest('[data-testid="socialContext"]') ||
      target.matches('[data-testid="retweet"], [data-testid="unretweet"]') ||
      target.closest('[data-testid="retweet"], [data-testid="unretweet"]')
    ) {
      return replaceRepostTerms(value);
    }

    if (
      target.matches('[data-testid="trend"]') ||
      target.closest('[data-testid="trend"]') ||
      target.matches('[data-testid="primaryColumn"] [role="button"]')
    ) {
      return replacePostCountLabels(value);
    }

    return replaceExactLabel(value);
  }

  function isSafeTarget(target) {
    if (
      target.matches('[data-testid="socialContext"]') ||
      target.closest('[data-testid="socialContext"]')
    ) {
      return true;
    }

    if (target.closest(PROTECTED_CONTENT_SELECTOR)) {
      return false;
    }

    const article = target.closest('article[data-testid="tweet"]');
    return !article || Boolean(target.closest(SAFE_ARTICLE_CONTROL_SELECTOR));
  }

  function rewriteTarget(target) {
    if (!(target instanceof Element) || !isSafeTarget(target)) {
      return;
    }

    for (const attribute of ["aria-label", "aria-description", "title", "placeholder"]) {
      if (!target.hasAttribute(attribute)) {
        continue;
      }

      const current = target.getAttribute(attribute);
      const next = transformForTarget(current, target);
      if (next !== current) {
        target.setAttribute(attribute, next);
      }
    }

    const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
    let textNode = walker.nextNode();

    while (textNode) {
      const parent = textNode.parentElement;
      const isSocialContext = parent?.closest('[data-testid="socialContext"]');
      if (parent && (isSocialContext || !parent.closest(PROTECTED_CONTENT_SELECTOR))) {
        const current = textNode.nodeValue;
        const next = transformForTarget(current, target);
        if (next !== current) {
          textNode.nodeValue = next;
        }
      }
      textNode = walker.nextNode();
    }

    if (target.matches('[data-testid="tweetButtonInline"]')) {
      const trimmedText = target.textContent.trim();
      if (!trimmedText.includes("Tweet") && !trimmedText.includes("Post")) {
        target.setAttribute("data-twitter-classic-fallback-label", "on");
      } else {
        target.removeAttribute("data-twitter-classic-fallback-label");
      }
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

    if (typeof root.querySelectorAll === "function") {
      for (const match of root.querySelectorAll(selector)) {
        matches.add(match);
      }
    }
  }

  function restoreLogo(root) {
    const logos = new Set();
    addMatches(root, LOGO_SELECTOR, logos);

    for (const logo of logos) {
      logo.setAttribute(LOGO_ATTRIBUTE, "on");
      if (logo.getAttribute("aria-label") !== "Twitter") {
        logo.setAttribute("aria-label", "Twitter");
      }
    }
  }

  function restoreLabels(root) {
    const targets = new Set();
    addMatches(root, LABEL_TARGET_SELECTOR, targets);
    for (const target of targets) {
      rewriteTarget(target);
    }
  }

  function restoreDocumentTitle() {
    const current = document.title;
    const next = current
      .replace(/\bon X(?=:)/g, "on Twitter")
      .replace(/\s\/\sX$/, " / Twitter")
      .replace(/^X$/, "Twitter");

    if (next !== current) {
      document.title = next;
    }
  }

  function restoreFavicon() {
    if (!document.head) {
      return;
    }

    let favicon = document.getElementById(FAVICON_ID);
    if (!(favicon instanceof HTMLLinkElement)) {
      favicon?.remove();
      favicon = null;
    }

    for (const candidate of document.head.querySelectorAll('link[rel~="icon"]')) {
      if (candidate !== favicon) {
        candidate.remove();
      }
    }

    let isNew = false;
    if (!favicon) {
      favicon = document.createElement("link");
      isNew = true;
    }

    if (favicon.id !== FAVICON_ID) {
      favicon.id = FAVICON_ID;
    }
    if (favicon.rel !== "icon") {
      favicon.rel = "icon";
    }
    if (favicon.type !== "image/svg+xml") {
      favicon.type = "image/svg+xml";
    }
    if (favicon.sizes.value !== "any") {
      favicon.sizes = "any";
    }
    if (favicon.href !== birdUrl) {
      favicon.href = birdUrl;
    }

    if (isNew) {
      document.head.append(favicon);
    }
  }

  function flushPendingRoots() {
    scheduledFrame = 0;
    enableThemeScope();
    markThemeReady();
    restoreFavicon();
    restoreDocumentTitle();

    const roots = [...pendingRoots];
    pendingRoots.clear();
    for (const root of roots) {
      if (root?.isConnected === false) {
        continue;
      }
      restoreLogo(root);
      restoreLabels(root);
    }
  }

  function schedule(root) {
    const normalizedRoot = root instanceof Text ? root.parentElement : root;
    if (!normalizedRoot) {
      return;
    }

    pendingRoots.add(normalizedRoot);
    if (pendingRoots.size > 40) {
      pendingRoots.clear();
      pendingRoots.add(document.documentElement);
    }

    if (!scheduledFrame) {
      scheduledFrame = requestAnimationFrame(flushPendingRoots);
    }
  }

  function start() {
    enableThemeScope();
    if (document.documentElement.getAttribute(READY_ATTRIBUTE) !== "ready") {
      readyTimer = window.setTimeout(() => {
        readyTimer = 0;
        markThemeReady(true);
      }, 12000);
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          for (const node of mutation.addedNodes) {
            schedule(node);
          }
        } else {
          schedule(mutation.target);
        }
      }
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: OBSERVED_ATTRIBUTES
    });

    schedule(document.documentElement);
    document.addEventListener("DOMContentLoaded", () => schedule(document), { once: true });
    window.addEventListener("pageshow", () => schedule(document));
  }

  if (document.documentElement) {
    start();
  } else {
    document.addEventListener("readystatechange", start, { once: true });
  }
})();
