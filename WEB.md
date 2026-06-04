# Roadmap Web Admin (POC)

Admin-only UI and API so you can edit the roadmap in a browser instead of CSV + `render.py`. Designed to grow into an ECS service with SSO later.

## Does this make sense?

| Phase | What |
|-------|------|
| **Now (POC)** | FastAPI app + admin token; timeline preview; edit tasks; save CSV; download Excel. Run locally or in Docker. |
| **Next** | Persist to DB or S3; scheduled export; read-only view for stakeholders. |
| **Later** | ECS service behind ALB; **Dex + LDAP + F5** for SSO; role mapping so only your team can edit; customer/other teams read-only or no access. |

The existing `render.py` logic stays the source of truth for Excel layout, colors, flags, and ordering.

## Run locally

From the project folder (where `render.py` and `roadmap.csv` live):

```powershell
pip install -r requirements.txt
$env:ROADMAP_ADMIN_TOKEN = "pick-a-long-secret"
uvicorn web.app:app --reload --host 127.0.0.1 --port 8080
```

Open: http://127.0.0.1:8080/?token=pick-a-long-secret  
(or enter the token in the header and click **Connect**)

### Draft, publish, and version history (admin)

| File / API | Purpose |
|------------|---------|
| `roadmap.csv` | **Live / published** — what Standard (read-only) view shows |
| `roadmap.draft.csv` | **Admin working copy** — Edit mode changes this |
| `history/` | Timestamped snapshots on **Save draft** and **Publish** |
| `PUT /api/roadmap` | Save draft + snapshot |
| `POST /api/publish` | Copy draft → live + snapshot |
| `GET /api/timeline?source=draft\|live` | Load draft or live |
| `GET /api/versions` | List snapshots (admin) |
| `POST /api/versions/{id}/restore` | Restore snapshot into draft |

Sidebar: **Edit** (draft) vs **Standard view** (live, no add/delete). Later: SSO/LDAP customers get live only.

### Interactive React UI (default after build)

Stack: **React**, **@xyflow/react** (pan/zoom/graph), **Framer Motion** (node polish).

```powershell
cd web/frontend
npm install
npm run dev          # hot reload at http://127.0.0.1:5173 (proxies API to :8080)
npm run build        # output → web/static/dist (served by FastAPI at /)
```

Or run `.\start-admin.ps1` — builds the UI then starts uvicorn.

- **Graph roadmap** — domain → feature → task nodes, animated gradient edges, sequential task chains  
- **Pan / zoom** — scroll and drag canvas; minimap + controls  
- **Drag nodes** — snap to 24px grid  
- **Click task** — spring-expand details; hover glow; selected node highlights connected paths  
- **Status filter** — planned / in progress / done (derived from dates)  
- **Save roadmap** / **Download Excel** — same API as before  

Legacy table UI: `web/static/admin.html` (used if React build is missing).

## API (admin token required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness (no auth) |
| GET | `/` | Admin UI |
| GET | `/api/timeline` | Timeline JSON for UI |
| GET | `/api/roadmap` | Task rows |
| PUT | `/api/roadmap` | Save tasks (body: `{ "tasks": [...] }`) |
| GET | `/api/releases` | Release rows |
| PUT | `/api/releases` | Save releases |
| POST | `/api/export/excel` | Generate and download Excel |

Auth: `Authorization: Bearer <ROADMAP_ADMIN_TOKEN>` or `?token=` on the URL (dev only).

## Docker / ECS (sketch)

```bash
docker build -t roadmap-admin .
docker run -p 8080:8080 \
  -e ROADMAP_ADMIN_TOKEN=your-secret \
  -v ./data:/data \
  roadmap-admin
```

Mount `/data` with `roadmap.csv` and `releases.csv`, or set `ROADMAP_DATA_DIR`.

For ECS: task definition with the image, secrets for `ROADMAP_ADMIN_TOKEN`, ALB target group on port 8080, health check `GET /health`.

## SSO later (Dex / LDAP / F5)

Not implemented in the POC. Planned approach:

1. Terminate SSO at F5; forward auth headers or OIDC to the app.  
2. Dex as OIDC bridge to LDAP groups.  
3. Map LDAP groups → `admin` vs `viewer`; only `admin` may call PUT/POST export.  
4. Replace bearer token with session cookie from OIDC middleware.

Until then, keep the admin token in AWS Secrets Manager and restrict network access (VPN / internal ALB only).
