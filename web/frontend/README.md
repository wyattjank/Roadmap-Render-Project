# Agile Roadmap UI

Full-page interactive roadmap: **React + Tailwind CSS + Lucide icons**. All state is local (`useState`) with seeded objectives/features.

## Run

```powershell
cd web/frontend
npm install
npm run dev          # http://127.0.0.1:5173
npm run build        # → web/static/dist (served by FastAPI on :8080)
```

From project root: `.\start-admin.ps1` builds the UI and starts the API.

## Features

- Now / Next / Later columns with objective banners
- Collapse objectives, feature drawer, filters, search
- Add objective / add feature (hover), tag colors, upvotes
