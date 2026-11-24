<p align="center">
  <img src="assets/twitter-bird.svg" alt="Classic Twitter blue bird" width="88">
</p>

<h1 align="center">Classic Twitter</h1>

<p align="center">
  Make X feel like Twitter again.<br>
  A lightweight browser extension inspired by Twitter's late-2021 / early-2022 interface.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.3.5-1da1f2" alt="Version 1.3.5">
  <img src="https://img.shields.io/badge/Manifest-V3-657786" alt="Manifest V3">
  <img src="https://img.shields.io/badge/Chrome%20%26%20Edge-supported-1da1f2" alt="Chrome and Edge supported">
  <img src="https://img.shields.io/badge/extension-runtime%20dependencies%3A%200-657786" alt="No runtime dependencies">
</p>

---

Classic Twitter restores Twitter-era colors, the blue bird, familiar Home icons, and **Tweet / Retweet** wording on the current X website. Choose the classic light theme or Twitter's navy **Dim** theme, and optionally hide newer X promotional surfaces.

This is a visual customization of X's existing interface—not a replacement social network or a custom login page. Timelines, posting, messages, search, and authentication continue to use X's native controls and behavior.

## Contents

- [Features](#features)
- [Install](#install)
- [Extension controls](#extension-controls)
- [Update or remove](#update-or-remove)
- [Privacy and permissions](#privacy-and-permissions)
- [Troubleshooting](#troubleshooting)
- [Development and testing](#development-and-testing)
- [Sharing the extension](#sharing-the-extension)
- [Contributing](#contributing)

## Features

- **Classic branding:** blue bird logos, a bird loading screen, Twitter favicon, and classic Home icons.
- **Twitter colors:** Twitter blue accents, readable light surfaces, and optional navy Dim mode.
- **Familiar wording:** Tweet, Retweet, Quote Tweet, and Messages in supported English interface labels.
- **Native Home feed:** For you and Following stay available; the timeline `+` blends into the tab strip.
- **Composer polish:** a muted “What's happening?” hint, flat blue toolbar icons, and a character ring that starts with the first character. X's native counter shows the exact count near the limit.
- **Media and search fixes:** full-size photo carousels, visible recent-search avatars, and a single search focus outline.
- **Consistent highlights:** one blue-tinted navigation highlight rather than overlapping hover layers.
- **Modern Chat support:** light and Dim styling for X's newer isolated Chat interface, while preserving native conversations and controls.
- **Signed-out styling:** Twitter artwork and bird branding on X's existing landing page and login dialogs.
- **Optional De-Elon mode:** hides supported Grok, Premium, subscription, and promotional surfaces.

### What's new in 1.3.5

Fixes overlapping text in X's refreshed composer and shows the character ring while typing. X's own counter takes over at the warning threshold. The native translation control uses a simple 文/A icon. Video controls retain their contrast over footage in Light and Dim mode.

### 1.3.4

Fixes the clipped Home heading, aligns the timeline controls, and adds a right gutter to the expanded navigation. The signed-in footer shows Twitter, Inc., and the current Messages panes follow Light or Dim. De-Elon folds Tweets that lead with a direct `@grok` mention into a compact, expandable row.

### 1.3.3

Restores the bird, Home icon, Tweet buttons, and blue composer tools on X's newer Home layout. De-Elon mode hides inactive extra timeline tabs, Calls, Creator Studio, Today’s News, and Grok controls, including the floating Grok panel. Chat appears as Messages, and saved posts remain available in History.

### 1.3.2

Fixed undersized carousel pictures, doubled navigation and search highlights, missing recent-search avatars, dark Chat panels, the missing composer hint, and the character counter's solid-blue track. Local validation covers 53 static checks and 47 browser-fixture checks, with additional mouse-hover checks available in the optional runner.

## Install

### From a GitHub download

1. Select **Code → Download ZIP** on this repository, then extract the ZIP.
2. Open your browser's extensions page:
   - Microsoft Edge: `edge://extensions`
   - Google Chrome: `chrome://extensions`
3. Turn on **Developer mode**.
4. Select **Load unpacked**.
5. Choose the extracted folder containing `manifest.json`—not the ZIP itself or an `assets` / `scripts` subfolder.
6. Refresh any open X tabs.
7. Optionally pin **Classic Twitter Light** to the browser toolbar for quick access to its switches.

### With Git

```sh
git clone https://github.com/karaagexc/classic-twitter.git
```

Then use **Load unpacked** and choose the cloned `classic-twitter` folder.

No build step, Node.js, or package installation is needed to use the extension. It runs on `https://x.com/*` and `https://twitter.com/*`; it does not change the domain displayed in the address bar.

## Extension controls

Select the bird icon in your browser toolbar to open the popup.

| Control | What it does | Default |
| --- | --- | --- |
| **De-Elon mode** | Hides supported newer X navigation and promotional surfaces, including Grok and Premium prompts. | On |
| **Classic dark mode** | Uses Twitter's navy Dim palette. Turn it off for the classic light theme. | Off |
| **Get back to X** | Pauses visual and wording restoration and reloads X in its native appearance. Turn it off to restore Classic Twitter. | Off |

Preferences are saved locally in the browser. Appearance switches update the extension's theme; **Get back to X** reloads the page. Refresh another open tab if it has not picked up a change.

## Update or remove

### Update an unpacked installation

1. Download the new source or pull the latest changes into the same folder.
2. Open `edge://extensions` or `chrome://extensions`.
3. Find **Classic Twitter Light** and select **Reload**.
4. Hard-refresh X with **Ctrl + Shift + R**.

Refreshing X alone does not reload an extension's manifest or popup files.

### Disable or uninstall

Use **Get back to X** for a temporary return to X's appearance. To disable or remove the extension, use your browser's extensions page, then refresh X.

## Privacy and permissions

- Requests only the **storage** permission to save the three popup preferences.
- Runs content scripts only on `x.com` and `twitter.com`.
- Does not collect, store, or send account content, credentials, or browsing history.
- Has no analytics or extension-controlled external network requests.
- Uses bundled artwork, icons, scripts, and styles.
- Keeps X's native authentication flow; it does not submit credentials or provide its own authentication service.

The extension reads the page's interface to apply styling and supported label replacements. User-authored Tweets and profile content are protected from general wording replacement. English interface restoration is the main wording target; other languages may retain their native labels.

## Troubleshooting

| Problem | What to try |
| --- | --- |
| Changes do not appear after an update | Reload the extension, then hard-refresh X. |
| A blank page or old styles remain | Close and reopen the X tab after reloading the extension. |
| The popup is missing a new switch | Reload the extension itself; refreshing the website is not enough. |
| X branding is still visible | Make sure **Get back to X** is off. Report the affected page and a screenshot if it persists. |
| Colors or media look wrong | Temporarily disable other X themes, userscripts, or extensions that modify the page. |
| A future X update breaks a panel | Check for an extension update. X regularly changes its markup and styles. |

When reporting an issue, include the extension version, browser/version, page type, selected theme, and steps to reproduce. Crop or blur private information before attaching screenshots. Do not share passwords, cookies, account tokens, or private conversations.

## Development and testing

The extension is plain JavaScript and CSS with no runtime dependencies. **Node.js is only needed for the local test tools.**

### Project layout

```text
classic-twitter/
├── manifest.json            # Manifest V3 entry points and permissions
├── assets/                  # Bundled bird, Home icons, and landing artwork
├── popup/                   # Preference switches
├── scripts/v13-main.js      # Active interface hooks and dynamic fixes
├── styles/                  # Classic palettes, refinements, and Chat styles
└── tests/                   # Static validation and local browser fixtures
```

The manifest loads `scripts/v13-main.js`. Earlier scripts are retained in the source for reference; the stylesheets are loaded in the order listed in `manifest.json`.

### Static checks

```sh
node tests/validate-v13.mjs
```

### Browser fixtures

```sh
node tests/serve-fixtures.mjs
```

With the server running, open:

- `http://127.0.0.1:4173/tests/v13-regression-fixture.html` — earlier Home and interface checks.
- `http://127.0.0.1:4173/tests/current-regression-fixture.html` — carousels, avatars, focus states, composer hints, counter colors, and Chat shadow roots.
- `http://127.0.0.1:4173/i/jf/onboarding/web` — signed-out and authentication styling fixture.

The first two fixtures display their pass/fail results in the page. These checks are local; they do not post Tweets, sign in, or send messages to X.

### Optional automated hover checks

Install Playwright as a local development tool and its Chromium browser:

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
```

Keep the fixture server running in another terminal, then run:

```sh
node tests/run-current-regression.mjs
```

The runner uses a detected Edge or Chrome installation on Windows, or Playwright's Chromium otherwise. `BROWSER_EXECUTABLE` can select a browser binary; `PLAYWRIGHT_MODULE` can point to an existing Playwright installation.

## Sharing the extension

Share this repository or a source ZIP so users can follow the **Load unpacked** steps above. This repository is not an extension-store listing.

If you package a signed extension, **keep the `.pem` private key private**. Other users do not need it to install or use the extension. The `.gitignore` excludes signing keys, packaged `.crx` files, archives, local credentials, and development dependencies from source commits. Publish packaged downloads separately only after checking the target browser's distribution requirements.

## Contributing

Bug reports and focused improvements are welcome. Before opening a change:

1. Keep native X actions and authentication behavior intact.
2. Avoid broad selectors that resize media, cover avatars, or affect user-authored content.
3. Use Twitter/X fonts and the existing theme variables.
4. Run the static checks and relevant browser fixtures.
5. Describe the affected page and include a privacy-safe screenshot when useful.

---

**Independent project.** Classic Twitter is not affiliated with, endorsed by, or an official product of X Corp. Twitter names, logos, and artwork belong to their respective rights holders. Compatibility can change when X updates its website.
