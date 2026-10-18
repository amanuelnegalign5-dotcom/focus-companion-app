# Focus Companion PWA

A small, installable, local-first personal knowledge and action app. This first release is a Progressive Web App (PWA), not a signed iOS/Android native package.

## Included in this prototype

- Amharic-first interface with English toggle.
- Ethiopian calendar date as the primary date, Gregorian date secondarily.
- Ethiopian/Gregorian conversion module with tests for New Year, Pagume, and round-trip dates.
- Passphrase-protected local vault. Application records are encrypted with AES-GCM and a key derived using PBKDF2-SHA-256, then stored in IndexedDB.
- Quick capture and notes with types, tags, favorites, related-note links, backlinks, and local search.
- Tasks, priorities, Ethiopian due-date entry, completion, and daily Top 3.
- Focus timer with 25-, 50-, and 90-minute presets, pausing/resuming, task association, distraction capture, and session history.
- Weekly activity summary and reflection.
- Encrypted backup export and restore.
- Offline application shell caching after the app is served securely and opened once.
- Responsive mobile and desktop layouts; install guidance for iPhone, Android, and desktop.

## Important boundaries

- This is an installable PWA, not an App Store/Play Store app or signed native package.
- The app must be served from HTTPS to install and use browser cryptography/service workers. Opening `index.html` directly from a ZIP will not provide the installable/offline experience.
- No note/task/AI data is sent to a server by this code. The static app files must be hosted somewhere so the browser can download them. Hosting code publicly does not publish the vault contents, which stay inside the browser's IndexedDB.
- Browser-vault encryption is an additional at-rest protection, not a full native security audit. A compromised device/browser or maliciously replaced app code can still threaten data. Keep encrypted backups.
- If the passphrase is lost, the vault cannot be recovered. A backup must be restored using the passphrase with which it was exported.
- Local-network synchronization, on-device AI, Screen Time integration, cross-app blocking, native push notifications, Orthodox holiday overlays, advanced rich text, and native builds are not implemented in this first version.
- Ethiopian conversion uses a date-only JDN algorithm; the bundled automated tests cover representative dates, but this is not a substitute for a formal calendar audit before consequential date scheduling.

## Run locally for testing

Requires Node.js 20+.

```sh
npm test
python3 -m http.server 8000
```

Then visit `http://localhost:8000` in a browser on the same device. `localhost` is a secure development context. For a phone to access your app over a network, use an HTTPS host instead; a plain LAN IP over HTTP will not support service workers/Web Crypto in most browsers.

## Free static hosting and home-screen installation

You must publish the *app files*, not your private data, to a static HTTPS host. One common option is GitHub Pages for a public repository. Do not place personal notes, exported backups, passwords, or any private data into a public repository.

1. Create a repository and upload the contents of this directory to its root.
2. Enable GitHub Pages for the repository's main branch/root directory.
3. Wait until the site is available over HTTPS.
4. Open the published address once while online, then use the installation steps below.
5. Test by enabling airplane mode and reopening the installed app.

### iPhone

Open the HTTPS address in Safari → Share → Add to Home Screen → enable “Open as Web App” → Add.

### Android

Open the HTTPS address in Chrome → menu → Install app or Add to Home screen.

### Desktop

Open the HTTPS address in a supporting browser such as Chrome or Edge, then use its install control or menu.

## Local use and sharing

The installed PWA stores a separate encrypted vault in each browser/device profile. Sharing the app address shares the app, not its notes. This prototype does not synchronize personal data between devices.

## Files

- `index.html`: PWA entry point and restrictive same-origin CSP.
- `styles.css`: responsive design system.
- `app.js`: UI, encrypted vault, note/task/focus workflows.
- `calendar.js`: Ethiopian/Gregorian conversion functions.
- `manifest.webmanifest`: install metadata.
- `sw.js`: offline app-shell cache.
- `icons/`: application icons.
- `tests/calendar.test.mjs`: automated date tests.
