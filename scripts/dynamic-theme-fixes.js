(() => {
  "use strict";

  const PAGE_ATTRIBUTE = "data-twitter-classic-page";
  const SURFACE_ATTRIBUTE = "data-twitter-classic-surface";
  const TEXT_ATTRIBUTE = "data-twitter-classic-text";
  const BORDER_ATTRIBUTE = "data-twitter-classic-border";
  const SEARCH_ATTRIBUTE = "data-twitter-classic-search-shell";
  const VERIFICATION_ATTRIBUTE = "data-twitter-classic-verification-banner";
  const NATIVE_TABS_ATTRIBUTE = "data-twitter-classic-native-tabs";
  const NATIVE_TABS_BUTTON_ATTRIBUTE = "data-twitter-classic-native-tabs-button";

  const OVERLAY_CONTEXT_SELECTOR = [
    '[role="dialog"]',
    '[role="menu"]',
    '[role="listbox"]',
    '[data-testid="Dropdown"]',
    '[data-testid="typeaheadDropdown"]',
    '[data-testid="sheetDialog"]'
  ].join(",");

  const PROTECTED_SELECTOR = [
    '[data-testid="videoPlayer"]',
    '[data-testid="swipe-to-dismiss"]',
    '[data-testid="tweetPhoto"]',
    '[data-testid="card.layoutLarge.media"]',
    '[data-testid="tweetButton"]',
    '[data-testid="tweetButtonInline"]',
    '[data-testid="SideNav_NewTweet_Button"]',
    '[data-testid="toast"]',
    "video",
    "canvas",
    "picture"
  ].join(",");

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
    "h4",
    "svg"
  ].join(",");

  let scheduledFrame = 0;
  let nativeTimelineButton = null;
  const pendingRoots = new Set();

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
    return Boolean(color && color.a > 0.55 && Math.max(color.r, color.g, color.b) <= 48);
  }

  function isLightText(value) {
    const color = parseColor(value);
    return Boolean(color && color.a > 0.65 && Math.min(color.r, color.g, color.b) >= 222);
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

  function pageKind() {
    if (location.pathname.startsWith("/messages")) {
      return "messages";
    }
    return location.pathname === "/home" ? "home" : "other";
  }

  function setPageKind() {
    document.documentElement?.setAttribute(PAGE_ATTRIBUTE, pageKind());
  }

  function isProtected(element) {
    return Boolean(element.closest(PROTECTED_SELECTOR));
  }

  function hasSaturatedAncestor(element, boundary) {
    let current = element;
    while (current && current !== boundary?.parentElement) {
      if (isSaturatedColor(getComputedStyle(current).backgroundColor)) {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  }

  function looksLikeSearch(element) {
    if (element.matches('input[placeholder*="Search" i]')) {
      return true;
    }
    return Boolean(element.querySelector?.('input[placeholder*="Search" i]'));
  }

  function chooseSurface(element, style, kind) {
    if (looksLikeSearch(element)) {
      return "soft";
    }

    const rect = element.getBoundingClientRect();
    const radius = Number.parseFloat(style.borderTopLeftRadius) || 0;
    const compactRounded =
      radius >= 10 && rect.width > 0 && rect.height > 0 && rect.width <= 760 && rect.height <= 220;

    if (kind === "messages" && compactRounded) {
      return "soft";
    }

    if (compactRounded && rect.width <= 96 && rect.height <= 96) {
      return "soft";
    }

    if (element.getAttribute("aria-selected") === "true") {
      return "selected";
    }

    return "light";
  }

  function normalizeElement(element, context, kind) {
    if (!(element instanceof Element) || isProtected(element)) {
      return;
    }

    const style = getComputedStyle(element);
    const darkGradient =
      kind === "messages" &&
      style.backgroundImage !== "none" &&
      style.backgroundImage.includes("gradient") &&
      !style.backgroundImage.includes("url(");

    if (isDarkColor(style.backgroundColor) || darkGradient) {
      if (!element.hasAttribute(SURFACE_ATTRIBUTE)) {
        element.setAttribute(SURFACE_ATTRIBUTE, chooseSurface(element, style, kind));
      }
    }

    if (
      isDarkColor(style.borderTopColor) ||
      isDarkColor(style.borderRightColor) ||
      isDarkColor(style.borderBottomColor) ||
      isDarkColor(style.borderLeftColor)
    ) {
      element.setAttribute(BORDER_ATTRIBUTE, "light");
    }

    if (isLightText(style.color) && !hasSaturatedAncestor(element, context)) {
      element.setAttribute(TEXT_ATTRIBUTE, "dark");
    }
  }

  function normalizeContext(context, kind, root = context) {
    if (!(context instanceof Element) || !(root instanceof Element)) {
      return;
    }

    const nodes = [];
    if (root.matches(NORMALIZABLE_SELECTOR)) {
      nodes.push(root);
    }
    nodes.push(...root.querySelectorAll(NORMALIZABLE_SELECTOR));

    for (const element of nodes.slice(0, 2600)) {
      if (element === context || context.contains(element)) {
        normalizeElement(element, context, kind);
      }
    }
  }

  function markSearchShell(input) {
    input.setAttribute(SEARCH_ATTRIBUTE, "on");
    let current = input.parentElement;
    for (let depth = 0; current && depth < 4; depth += 1) {
      if (current.matches('[data-testid="primaryColumn"], [data-testid="sidebarColumn"], main')) {
        break;
      }
      current.setAttribute(SEARCH_ATTRIBUTE, "on");
      if (current.matches('form, [role="search"]')) {
        break;
      }
      current = current.parentElement;
    }
  }

  function markSearchShells(root) {
    if (!(root instanceof Element || root instanceof Document)) {
      return;
    }
    const inputs = new Set();
    if (root instanceof Element && root.matches('input[placeholder*="Search" i]')) {
      inputs.add(root);
    }
    root.querySelectorAll?.('input[placeholder*="Search" i]').forEach((input) => inputs.add(input));
    inputs.forEach(markSearchShell);
  }

  function replaceControlledPosted(root) {
    if (!(root instanceof Element || root instanceof Document)) {
      return;
    }

    const selector = [
      '[data-testid="toast"]',
      '[role="status"]',
      '[role="alert"]',
      '[data-testid="primaryColumn"] [role="button"]'
    ].join(",");
    const controls = new Set();
    if (root instanceof Element && root.matches(selector)) {
      controls.add(root);
    }
    root.querySelectorAll?.(selector).forEach((control) => controls.add(control));

    for (const control of controls) {
      if (control.closest('article[data-testid="tweet"], [data-testid="tweetText"]')) {
        continue;
      }
      const walker = document.createTreeWalker(control, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        const value = node.nodeValue;
        if (value.trim() === "posted" || value.trim() === "Posted") {
          node.nodeValue = value.replace(/posted/i, "Tweeted");
        }
        node = walker.nextNode();
      }
    }
  }

  function markVerificationBanner(root) {
    if (!(root instanceof Element || root instanceof Document)) {
      return;
    }

    const text = root instanceof Element ? root.textContent : document.body?.textContent;
    if (!text || !/you (?:aren['’]t|are not) verified yet/i.test(text)) {
      return;
    }

    const candidates = [...root.querySelectorAll?.("div, section, aside") || []]
      .filter((element) => /you (?:aren['’]t|are not) verified yet/i.test(element.textContent))
      .sort((a, b) => a.querySelectorAll("*").length - b.querySelectorAll("*").length);

    let candidate = candidates[0] || null;
    while (candidate && candidate !== document.body) {
      const style = getComputedStyle(candidate);
      const rect = candidate.getBoundingClientRect();
      if (style.backgroundColor !== "rgba(0, 0, 0, 0)" && rect.height >= 70) {
        candidate.setAttribute(VERIFICATION_ATTRIBUTE, "on");
        return;
      }
      candidate = candidate.parentElement;
    }
  }

  function markNativeHomeChrome() {
    if (pageKind() !== "home") {
      nativeTimelineButton = null;
      return;
    }

    const root = document.documentElement;
    const primary = document.querySelector('[data-testid="primaryColumn"]');
    const tablist = primary?.querySelector('[role="tablist"]');
    if (!primary || !tablist) {
      return;
    }

    root.setAttribute("data-twitter-classic-home-tabs", "closed");
    tablist.setAttribute(NATIVE_TABS_ATTRIBUTE, "on");

    let container = tablist;
    while (container.parentElement && container.parentElement !== primary) {
      const parent = container.parentElement;
      if (parent.querySelector('[data-testid="tweetTextarea_0"], [data-testid="toolBar"]')) {
        break;
      }
      container = parent;
    }
    container.setAttribute(NATIVE_TABS_ATTRIBUTE, "on");

    const searchRegion = container.parentElement || container;
    const buttons = [...searchRegion.querySelectorAll('button, [role="button"]')].filter(
      (button) =>
        !button.closest(`[${NATIVE_TABS_ATTRIBUTE}]`) &&
        !button.closest("[data-twitter-classic-home-header]") &&
        !button.closest('[data-testid="toolBar"]') &&
        !button.matches(
          '[data-testid="tweetButton"], [data-testid="tweetButtonInline"], [data-testid="SideNav_NewTweet_Button"]'
        )
    );

    nativeTimelineButton =
      buttons.find((button) =>
        /add|timeline|feed|column/i.test(
          `${button.getAttribute("aria-label") || ""} ${button.title || ""} ${button.textContent || ""}`
        )
      ) || buttons.find((button) => button.querySelector("svg")) || null;

    if (nativeTimelineButton) {
      nativeTimelineButton.setAttribute(NATIVE_TABS_BUTTON_ATTRIBUTE, "on");
    }

    const classicButton = document.querySelector("[data-twitter-classic-home-header] button");
    if (classicButton && classicButton.dataset.twitterClassicTimelineBound !== "on") {
      classicButton.dataset.twitterClassicTimelineBound = "on";
      classicButton.addEventListener(
        "click",
        (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
          root.setAttribute("data-twitter-classic-home-tabs", "closed");
          nativeTimelineButton?.click();
        },
        true
      );
      classicButton.setAttribute("aria-expanded", "false");
      classicButton.setAttribute("aria-label", "Open timelines");
      classicButton.title = "Open timelines";
    }
  }

  function replaceMessagesHeading(root) {
    if (pageKind() !== "messages" || !(root instanceof Element || root instanceof Document)) {
      return;
    }
    root.querySelectorAll?.('h1, h2, [role="heading"]').forEach((heading) => {
      if (heading.textContent.trim() === "Chat") {
        const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
        let node = walker.nextNode();
        while (node) {
          if (node.nodeValue.trim() === "Chat") {
            node.nodeValue = node.nodeValue.replace("Chat", "Messages");
          }
          node = walker.nextNode();
        }
      }
    });
  }

  function processRoot(root) {
    const element = root instanceof Text ? root.parentElement : root;
    if (!(element instanceof Element || element instanceof Document)) {
      return;
    }

    markSearchShells(element);
    replaceControlledPosted(element);
    markVerificationBanner(element);
    replaceMessagesHeading(element);

    const kind = pageKind();
    if (element instanceof Element) {
      const overlay = element.matches(OVERLAY_CONTEXT_SELECTOR)
        ? element
        : element.closest(OVERLAY_CONTEXT_SELECTOR);
      if (overlay) {
        normalizeContext(overlay, kind, element);
      }

      if (kind === "messages") {
        const main = element.matches('main[role="main"]')
          ? element
          : element.closest('main[role="main"]');
        if (main) {
          normalizeContext(main, kind, element);
        }
      }
    } else {
      document.querySelectorAll(OVERLAY_CONTEXT_SELECTOR).forEach((context) =>
        normalizeContext(context, kind)
      );
      if (kind === "messages") {
        const main = document.querySelector('main[role="main"]');
        if (main) {
          normalizeContext(main, kind);
        }
      }
    }
  }

  function flush() {
    scheduledFrame = 0;
    setPageKind();
    markNativeHomeChrome();

    const roots = [...pendingRoots];
    pendingRoots.clear();
    roots.forEach(processRoot);
  }

  function schedule(root = document) {
    pendingRoots.add(root);
    if (pendingRoots.size > 60) {
      pendingRoots.clear();
      pendingRoots.add(document);
    }
    if (!scheduledFrame) {
      scheduledFrame = requestAnimationFrame(flush);
    }
  }

  function start() {
    setPageKind();
    schedule(document);

    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => schedule(node));
        } else {
          schedule(mutation.target);
        }
      }
    }).observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "style", "aria-selected", "placeholder"]
    });

    document.addEventListener("DOMContentLoaded", () => schedule(document), { once: true });
    window.addEventListener("pageshow", () => schedule(document));
    window.addEventListener("popstate", () => schedule(document));
  }

  if (document.documentElement) {
    start();
  } else {
    document.addEventListener("readystatechange", start, { once: true });
  }
})();
