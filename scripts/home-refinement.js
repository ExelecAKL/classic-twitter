(() => {
  "use strict";

  const PAGE_ATTRIBUTE = "data-twitter-classic-page";
  const TABS_ATTRIBUTE = "data-twitter-classic-home-tabs";
  const HEADER_ATTRIBUTE = "data-twitter-classic-home-header";
  let scheduledFrame = 0;

  function updateSwitcher(button) {
    const isOpen = document.documentElement.getAttribute(TABS_ATTRIBUTE) === "open";
    button.setAttribute("aria-expanded", String(isOpen));
    button.setAttribute(
      "aria-label",
      isOpen ? "Hide timeline choices" : "Show timeline choices"
    );
    button.title = isOpen ? "Hide timeline choices" : "Show timeline choices";
  }

  function createHeader() {
    const header = document.createElement("div");
    header.setAttribute(HEADER_ATTRIBUTE, "on");
    header.setAttribute("role", "heading");
    header.setAttribute("aria-level", "1");

    const title = document.createElement("h2");
    title.textContent = "Home";

    const switcher = document.createElement("button");
    switcher.type = "button";
    switcher.textContent = "✦";
    updateSwitcher(switcher);
    switcher.addEventListener("click", () => {
      const root = document.documentElement;
      const next = root.getAttribute(TABS_ATTRIBUTE) === "open" ? "closed" : "open";
      root.setAttribute(TABS_ATTRIBUTE, next);
      updateSwitcher(switcher);
    });

    header.append(title, switcher);
    return header;
  }

  function reconcileHomeHeader() {
    const root = document.documentElement;
    if (!root) {
      return;
    }

    const isHome = location.pathname === "/home";
    root.setAttribute(PAGE_ATTRIBUTE, isHome ? "home" : "other");

    const existing = document.querySelector(`[${HEADER_ATTRIBUTE}]`);
    if (!isHome) {
      existing?.remove();
      root.removeAttribute(TABS_ATTRIBUTE);
      return;
    }

    if (!root.hasAttribute(TABS_ATTRIBUTE)) {
      root.setAttribute(TABS_ATTRIBUTE, "closed");
    }

    const primaryColumn = document.querySelector('[data-testid="primaryColumn"]');
    if (!primaryColumn) {
      return;
    }

    const header = existing || createHeader();
    const switcher = header.querySelector("button");
    if (switcher) {
      updateSwitcher(switcher);
    }

    if (header.parentElement !== primaryColumn || primaryColumn.firstElementChild !== header) {
      primaryColumn.prepend(header);
    }
  }

  function schedule() {
    if (!scheduledFrame) {
      scheduledFrame = requestAnimationFrame(() => {
        scheduledFrame = 0;
        reconcileHomeHeader();
      });
    }
  }

  function start() {
    reconcileHomeHeader();
    new MutationObserver(schedule).observe(document.documentElement, {
      childList: true,
      subtree: true
    });
    document.addEventListener("DOMContentLoaded", schedule, { once: true });
    window.addEventListener("pageshow", schedule);
    window.addEventListener("popstate", schedule);
  }

  if (document.documentElement) {
    start();
  } else {
    document.addEventListener("readystatechange", start, { once: true });
  }
})();
