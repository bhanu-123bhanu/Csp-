# Sanitary Map AI — Local Dev Scaffold

This is a small Vite + React + Tailwind scaffold containing the `App` refactor of the code you provided. It includes a simple `window.storage` fallback that uses `localStorage` so the app will run locally in the browser without additional backend.

What I created
- `package.json` — project manifest
- `index.html` — Vite entry
- `src/main.jsx` — app bootstrap
- `src/App.jsx` — the refactored app (your code, reorganized)
- `src/index.css` — Tailwind import + minor utility
- `tailwind.config.cjs`, `postcss.config.cjs` — Tailwind setup
- `.env.example` — add your Google Maps key here

Quick start (Windows PowerShell)

1. Install dependencies

```powershell
npm install
```

2. Create `.env` file (copy `.env.example` and set your Maps key)

```powershell
# one-liner to create .env from example (PowerShell)
Copy-Item -Path .env.example -Destination .env -Force
# then open .env and replace YOUR_GOOGLE_MAPS_EMBED_API_KEY_HERE with your key
```

3. Run dev server

```powershell
npm run dev
```

Open the URL shown by Vite (usually http://localhost:5173).

Notes
- The app uses `import.meta.env.VITE_GOOGLE_MAPS_KEY` for the maps embed. Add your API key to `.env` as shown above.
- The storage layer is a fallback to `localStorage` using keys like `report:report_163...`. If your host provides a different `window.storage` API, the app will use that instead.
- Admin demo credentials: `admin` / `admin123`.

Next steps (optional)
- Replace `window.storage` with a real backend; add authentication.
- Add tests or a simple build pipeline.
- Improve map markers (the current iframe is a simple view embed).

If you want, I can run a local dev server next (installing deps and starting), or split `App.jsx` into smaller components. Which would you like me to do next?