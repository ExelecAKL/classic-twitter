(() => {
  "use strict";

  const DEFAULTS = Object.freeze({ deElon: true, getBackToX: false, classicDark: false });
  const root = document.documentElement;
  const power = document.getElementById("power-button");
  const face = power.querySelector(".power-face");
  const mode = document.getElementById("mode-label");
  const hint = document.getElementById("power-hint");
  const error = document.getElementById("save-error");
  const settings = document.querySelector(".settings");
  const canvas = document.getElementById("power-wave");
  const shell = canvas.parentElement;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const controls = Object.fromEntries(["classicDark", "deElon"].map((name) => [name, document.getElementById(name)]));
  const pending = new Set();
  let options = { ...DEFAULTS };
  let bounce;
  let labelAnimations = [];
  let waveFrame = 0;
  let audioContext;

  function render() {
    const paused = options.getBackToX;
    root.dataset.popupTheme = paused ? "x" : options.classicDark ? "dim" : "light";
    power.setAttribute("aria-pressed", String(!paused));
    const label = paused ? "X Mode" : "Twitter Mode";
    if (mode.textContent !== label) mode.textContent = label;
    hint.textContent = paused ? "Press to restore Twitter." : "Press to return to X.";
    settings.disabled = paused;
    for (const [name, input] of Object.entries(controls)) input.checked = options[name];
  }

  function saveOption(name, value, afterSave) {
    if (pending.has(name)) {
      render();
      return false;
    }
    const previous = options[name];
    if (value === previous) return false;
    pending.add(name);
    options[name] = value;
    error.textContent = "";
    render();
    chrome.storage.local.set({ [name]: value }, () => {
      pending.delete(name);
      if (chrome.runtime.lastError) {
        options[name] = previous;
        stopWave();
        render();
        error.textContent = "Couldn’t save that setting. Try again.";
      } else {
        afterSave?.();
      }
    });
    return true;
  }

  function stopWave() {
    if (!waveFrame) return;
    cancelAnimationFrame(waveFrame);
    waveFrame = 0;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    shell.removeAttribute("data-wave-active");
    shell.removeAttribute("data-wave-dark");
  }

  function playBounce() {
    if (reducedMotion.matches) return;
    bounce?.cancel();
    bounce = face.animate([
      { transform: "translateY(5px) scale(.976)", boxShadow: "var(--face-shadow-pressed)", easing: "cubic-bezier(.19,.92,.42,1)" },
      { transform: "translateY(-7px) scale(1.022)", boxShadow: "var(--face-shadow-lifted)", offset: .43, easing: "ease-in-out" },
      { transform: "translateY(-2px) scale(.997)", boxShadow: "var(--face-shadow-raised)", offset: .74, easing: "ease-out" },
      { transform: "translateY(-3px) scale(1)", boxShadow: "var(--face-shadow-raised)" }
    ], { duration: 360 });
  }

  function playLabelMotion(paused) {
    if (reducedMotion.matches) return;
    for (const animation of labelAnimations) animation.cancel();
    const direction = paused ? -1 : 1;
    // The new copy and its contrast color are visible immediately. Animate
    // position only so the labels never wait for a delayed reveal or fade.
    labelAnimations = [
      mode.animate([
        { transform: `translateY(${direction * 7}px) scale(.96)`, easing: "cubic-bezier(.16,.75,.3,1)" },
        { transform: `translateY(${direction * -2}px) scale(1.025)`, offset: .55, easing: "ease-out" },
        { transform: "none" }
      ], { duration: 410 }),
      hint.animate([
        { transform: `translateY(${direction * 4}px)` },
        { transform: "none" }
      ], { duration: 310, easing: "cubic-bezier(.2,.8,.22,1)" })
    ];
  }

  function armChirp() {
    if (!window.AudioContext) return;
    try {
      audioContext ||= new AudioContext();
      const ready = audioContext.state === "running"
        ? Promise.resolve(true)
        : audioContext.resume().then(() => true, () => false);
      return () => {
        void ready.then((started) => {
          if (!started || options.getBackToX) return;
          const start = audioContext.currentTime + .012;
          const notes = [
            { delay: 0, duration: .085, low: 1140, peak: 1870, tail: 1460, volume: .036 },
            { delay: .097, duration: .125, low: 1360, peak: 2190, tail: 1580, volume: .044 }
          ];
          for (const note of notes) {
            const time = start + note.delay;
            const end = time + note.duration;
            const voice = audioContext.createOscillator();
            const gain = audioContext.createGain();
            // Short swept notes with a soft envelope, synthesized locally.
            voice.type = "sine";
            voice.frequency.setValueAtTime(note.low, time);
            voice.frequency.exponentialRampToValueAtTime(note.peak, time + note.duration * .43);
            voice.frequency.exponentialRampToValueAtTime(note.tail, end);
            gain.gain.setValueAtTime(.0001, time);
            gain.gain.exponentialRampToValueAtTime(note.volume, time + .012);
            gain.gain.exponentialRampToValueAtTime(.0001, end);
            voice.connect(gain).connect(audioContext.destination);
            voice.start(time);
            voice.stop(end + .008);
            voice.onended = () => { voice.disconnect(); gain.disconnect(); };
          }
        }).catch(() => {});
      };
    } catch {
      // The mode toggle remains usable if the browser cannot start audio.
    }
  }

  function playWave(paused) {
    stopWave();
    if (reducedMotion.matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const light = !paused && !options.classicDark;
    const textTokens = ["--ink", "--indicator", "--secondary"];
    const computed = getComputedStyle(shell);
    const baseInk = textTokens.map((name) => {
      const hex = computed.getPropertyValue(name).trim().slice(1);
      return [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
    });
    const litInk = paused ? [[255, 255, 255], [244, 244, 244], [237, 237, 237]]
      : [[255, 255, 255], [245, 251, 255], [231, 239, 245]];
    const paintInk = (amount) => {
      for (const [i, name] of ["--wave-ink", "--wave-indicator", "--wave-secondary"].entries()) {
        const tone = baseInk[i].map((channel, rgb) => Math.round(channel + (litInk[i][rgb] - channel) * amount));
        shell.style.setProperty(name, `rgb(${tone.join(",")})`);
      }
      shell.style.setProperty("--wave-shadow", !light || amount >= .43
        ? "rgba(0,0,0,.94)" : `rgba(255,255,255,${Math.min(1, amount * 3)})`);
    };
    paintInk(1);
    shell.dataset.waveActive = paused ? "x" : "twitter";
    shell.toggleAttribute("data-wave-dark", true);

    const box = canvas.getBoundingClientRect();
    const button = power.getBoundingClientRect();
    const x = button.left + button.width / 2 - box.left;
    const y = button.top + button.height / 2 - box.top;
    const width = box.width;
    const height = box.height;
    const scale = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    const maxRadius = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
    const activeColors = paused ? ["#535353", "#a2a2a2", "#ececec", "#ffffff"]
      : ["#145781", "#1da1f2", "#52bbff", "#b6edff"];
    const settlingColors = ["#95c7e6", "#4a9dd1", "#1da1f2", "#167cba"];
    const levelOpacity = [.15, .53, .8, .95];
    const dots = [];
    const bands = [[], [], [], []];
    const spacing = 7;
    for (let py = spacing / 2; py < height; py += spacing) {
      for (let px = spacing / 2; px < width; px += spacing) {
        const angle = Math.atan2(py - y, px - x);
        dots.push({ x: px, y: py, distance: Math.hypot(px - x, py - y) + Math.sin(angle * 8) * 2.5 });
      }
    }
    let started;
    const crest = (distance, radius, bandWidth) => radius < 0 ? 0
      : Math.max(0, 1 - Math.abs(distance - radius) / bandWidth);

    function paint(now) {
      started ??= now;
      const time = Math.min(1, (now - started) / 920);
      ctx.clearRect(0, 0, width, height);
      if (time === 1 || reducedMotion.matches) {
        waveFrame = 0;
        shell.removeAttribute("data-wave-active");
        shell.removeAttribute("data-wave-dark");
        return;
      }

      // Use the same frame clock and backing strength for the ink blend.
      const veil = Math.min(1, (1 - time) / .26);
      const darkInk = light && veil < .64;
      const phase = light ? Math.max(0, Math.min(1, (veil - .48) / .32)) : veil;
      paintInk(phase * phase * (3 - 2 * phase));
      shell.toggleAttribute("data-wave-dark", !light || phase > .32);
      ctx.globalAlpha = veil * (light ? .98 : .8);
      ctx.fillStyle = paused ? "#030303" : "#04101c";
      ctx.fillRect(0, 0, width, height);

      const front = 34 + (maxRadius + 120) * (1 - Math.pow(1 - time, 1.24));
      const fade = Math.min(1, (1 - time) / .19);
      const colors = darkInk ? settlingColors : activeColors;
      for (const band of bands) band.length = 0;
      for (const dot of dots) {
        const glow = Math.max(
          crest(dot.distance, front, 24),
          crest(dot.distance, front - 55, 20) * .88,
          crest(dot.distance, front - 110, 17) * .66
        );
        dot.size = .55 + glow * glow * 2.48;
        bands[Math.min(3, Math.floor(glow * 4))].push(dot);
      }
      for (let level = 0; level < bands.length; level += 1) {
        ctx.beginPath();
        for (const dot of bands[level]) {
          ctx.moveTo(dot.x + dot.size, dot.y);
          ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        }
        ctx.globalAlpha = levelOpacity[level] * fade;
        ctx.fillStyle = colors[level];
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      waveFrame = requestAnimationFrame(paint);
    }
    waveFrame = requestAnimationFrame(paint);
  }

  power.addEventListener("click", () => {
    if (pending.has("getBackToX")) return;
    const paused = !options.getBackToX;
    if (!saveOption("getBackToX", paused, paused ? undefined : armChirp())) return;
    playBounce();
    playLabelMotion(paused);
    playWave(paused);
  });

  for (const [name, input] of Object.entries(controls)) {
    input.addEventListener("change", () => saveOption(name, input.checked));
  }
  reducedMotion.addEventListener("change", ({ matches }) => {
    if (!matches) return;
    bounce?.cancel();
    for (const animation of labelAnimations) animation.cancel();
    stopWave();
  });

  chrome.storage.local.get(DEFAULTS, (stored) => {
    for (const [name, fallback] of Object.entries(DEFAULTS)) {
      options[name] = typeof stored?.[name] === "boolean" ? stored[name] : fallback;
    }
    render();
    power.disabled = false;
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    const wasPaused = options.getBackToX;
    for (const name of Object.keys(DEFAULTS)) {
      const value = changes[name]?.newValue;
      if (typeof value === "boolean" && !pending.has(name)) options[name] = value;
    }
    if (wasPaused !== options.getBackToX) stopWave();
    render();
  });
})();
