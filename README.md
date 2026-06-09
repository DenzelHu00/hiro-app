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

Messages and backend features (login, real messaging) are not included yet; those would require a server or third-party service in a future version.
