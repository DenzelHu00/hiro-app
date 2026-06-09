# HiRO App — Hearts in Rhythm Organization

A mobile-friendly web app with four main sections: **News**, **Resources**, **Messages**, and **Settings**.

## Run locally

Open `index.html` in your browser, or start a simple server:

```bash
cd ~/hiro-app
python3 -m http.server 8080
```

Then visit [http://localhost:8080](http://localhost:8080).

## Customize

| Area | File | What to change |
|------|------|----------------|
| Resource links | `index.html` | Replace `href="#"` with real URLs under each accordion section |
| News items | `index.html` | Add or edit `.news-card` blocks in the News panel |
| Colors / branding | `styles.css` | CSS variables at the top (`--color-primary`, `--color-accent`, etc.) |

## Structure

- `index.html` — layout, tabs, resource dropdowns (HTML `<details>` accordions)
- `styles.css` — HiRO branding and responsive layout
- `app.js` — tab switching, settings saved to `localStorage`

## Push notifications

The app supports **Web Push** (service worker + VAPID). GitHub Pages hosts the app; **sending** notifications uses the `push-server/` tools on your computer.

### Setup (once)

```bash
cd push-server
npm install
npm run setup
git add ../push-config.js
git commit -m "Configure Web Push VAPID public key"
git push
```

### Enable on a phone

1. Open the live site from **Home Screen** (required on iPhone).
2. Settings → turn on notification toggles → **Save preferences** → allow notifications.
3. Optional: **Copy push subscription for admin** → paste into `push-server/subscriptions.json`.

### Send a test push

```bash
cd push-server
npm run send -- --title "HiRO" --body "Test notification" --category genetics
```

See `push-server/README.md` for details.

Messages and secure inbox still need a backend; push delivery is implemented for subscribed devices.
