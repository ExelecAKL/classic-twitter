(function () {
  "use strict";

  const DEFAULTS = Object.freeze({
    deElon: true,
    getBackToX: false,
    classicDark: false
  });

  const optionNames = Object.keys(DEFAULTS);
  const controls = Object.fromEntries(
    optionNames.map((name) => [name, document.getElementById(name)])
  );
  const rows = {
    deElon: document.getElementById("de-elon-row"),
    classicDark: document.getElementById("classic-dark-row")
  };
  const status = document.getElementById("status");

  let options = { ...DEFAULTS };

  function normalizedOptions(values) {
    return Object.fromEntries(
      optionNames.map((name) => [
        name,
        typeof values[name] === "boolean" ? values[name] : DEFAULTS[name]
      ])
    );
  }

  function statusMessage() {
    if (options.getBackToX) {
      return "X is restored. Classic Twitter is paused.";
    }

    if (options.classicDark && options.deElon) {
      return "Classic Twitter is on with De-Elon and dim mode.";
    }

    if (options.classicDark) {
      return "Classic Twitter is on in classic dim mode.";
    }

    if (options.deElon) {
      return "Classic Twitter is on in light De-Elon mode.";
    }

    return "Classic Twitter is on in light mode.";
  }

  function render() {
    optionNames.forEach((name) => {
      controls[name].checked = options[name];
    });

    const restorationPaused = options.getBackToX;

    ["deElon", "classicDark"].forEach((name) => {
      controls[name].disabled = restorationPaused;
      rows[name].classList.toggle("is-disabled", restorationPaused);
      rows[name].setAttribute("aria-disabled", String(restorationPaused));
    });

    document.documentElement.dataset.popupTheme =
      options.classicDark && !restorationPaused ? "dim" : "light";
    status.dataset.mode = restorationPaused ? "x" : "twitter";
    status.textContent = statusMessage();
  }

  function saveOption(name) {
    chrome.storage.local.set({ [name]: options[name] }, () => {
      if (chrome.runtime.lastError) {
        status.dataset.mode = "x";
        status.textContent = "That setting could not be saved. Please try again.";
      }
    });
  }

  optionNames.forEach((name) => {
    controls[name].addEventListener("change", () => {
      options[name] = controls[name].checked;
      render();
      saveOption(name);
    });
  });

  chrome.storage.local.get(DEFAULTS, (storedOptions) => {
    options = normalizedOptions(storedOptions);
    render();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }

    let changed = false;

    optionNames.forEach((name) => {
      if (changes[name] && typeof changes[name].newValue === "boolean") {
        options[name] = changes[name].newValue;
        changed = true;
      }
    });

    if (changed) {
      render();
    }
  });
})();
