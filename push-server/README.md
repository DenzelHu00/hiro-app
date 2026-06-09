# HiRO push notification sender

This folder lets the HiRO team **send** Web Push notifications to users who subscribed in the app.

## One-time setup

```bash
cd push-server
npm install
npm run setup
```

This creates `vapid.json` (private — do not commit) and updates `push-config.js` with the public key.

Edit `vapid.json` and set `subject` to your team email, e.g. `mailto:hiro@yourorg.org`.

Commit and push `push-config.js` so the live app can subscribe.

## Collect a subscription (per device)

1. Open the live HiRO app on a phone (installed to Home Screen on iPhone).
2. Settings → turn on notification toggles → **Save preferences** → allow notifications.
3. Settings → **Copy push subscription for admin** → paste into `subscriptions.json` (replace the example file).

For multiple devices, add each subscription object to the array in `subscriptions.json`.

## Send a notification

```bash
npm run send -- --title "HiRO Genetics" --body "Update on your FLNC variant." --category genetics --url "./"
```

## Deploy note

GitHub Pages hosts the app only. **Sending** push always runs from this script (or a future server). Users receive pushes via the service worker in `sw.js`.
