# Work machine quick start (Cursor + git pull)

Use this the first time you open the repo on your **work PC** (enterprise firewall / proxy). Everything runs on **localhost** — no cloud deployment required for local dev.

## Before you leave home (recommended)

On the machine where the app already works, push a build so work may not need npm:

```powershell
cd path\to\Roadmap-Render-Project\web\frontend
npm run build
cd ..\..
git add -f web/static/dist
git commit -m "Include built UI for work machines without npm"
git push
```

`web/static/dist` is normally gitignored; `-f` adds it once for teammates behind strict firewalls. Skip this if your work machine can run `npm install` fine.

---

## Tomorrow morning in Cursor

### 1. Get the code

1. Open **Cursor**.
2. **File → Open Folder** → clone path, e.g. `C:\Users\<you>\source\Roadmap-Render-Project`.
3. Open terminal: **Terminal → New Terminal** (PowerShell).
4. Pull latest:

```powershell
git pull
```

If the repo is new on this PC:

```powershell
git clone <your-repo-url>
cd Roadmap-Render-Project
```

### 2. Python (required)

Check Python:

```powershell
python --version
```

Should be **3.10+**. Then from the **project root** (folder with `render.py` and `start-admin.ps1`):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**If pip fails** (firewall blocks PyPI):

- Use your org’s internal PyPI mirror, or  
- Ask IT to allow `pypi.org` temporarily, or  
- On home machine: `pip download -r requirements.txt -d wheels` → copy `wheels/` USB → `pip install --no-index --find-links=wheels -r requirements.txt`

**If `Activate.ps1` is blocked:**

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### 3. UI build (only if `web/static/dist` is missing)

Check:

```powershell
Test-Path web\static\dist\index.html
```

If **False**, you need a build:

```powershell
node --version
npm --version
cd web\frontend
npm install
npm run build
cd ..\..
```

**If `npm install` fails** (common behind corporate proxy):

```powershell
# If IT gave you a proxy (example — use your real URL/port):
$env:HTTP_PROXY = "http://proxy.corp.example.com:8080"
$env:HTTPS_PROXY = "http://proxy.corp.example.com:8080"
npm install
```

Or use the **pre-built `web/static/dist`** from git (`git pull` after someone force-added it) or copy that folder from your home PC.

Without `web/static/dist`, the server still runs but falls back to legacy `admin.html` (limited UI).

### 4. Start the app

From project root (venv activated optional if `python` points at venv):

```powershell
.\start-admin.ps1
```

Wait for:

```text
Application startup complete
```

### 5. Open in browser

```text
http://127.0.0.1:8080/?token=dev-admin
```

- Uses **loopback only** — should not trip outbound firewall rules.
- Token is only for local POC; use a real secret in shared/deployed environments.

**Hard refresh** after pull: `Ctrl+Shift+R`.

---

## What corporate firewalls usually affect

| Action | Needs internet? | Typical work issue |
|--------|-----------------|-------------------|
| `git pull` / `git push` | Yes (Git host) | Blocked → use VPN or internal GitLab |
| `pip install` | Yes (PyPI) | Use mirror or offline wheels |
| `npm install` | Yes (npm registry) | Use proxy env or commit `web/static/dist` |
| `.\start-admin.ps1` / uvicorn | **No** (localhost) | Usually OK |
| Using the UI in browser | **No** (127.0.0.1) | Usually OK |
| Google Fonts | **No** (removed) | N/A |

The app does **not** need outbound calls while you edit the roadmap (after install/build).

---

## Cursor workflow (daily)

1. `git pull`
2. `.\.venv\Scripts\Activate.ps1` (if using venv)
3. `.\start-admin.ps1`
4. Edit in browser → **Save draft** / **Publish** in the UI
5. `git status` → commit CSV changes if you intend to share data (not draft files unless team agrees)

Optional dev UI (hot reload) — only if `npm run dev` is allowed:

```powershell
# Terminal 1 — from project root
$env:ROADMAP_ADMIN_TOKEN = "dev-admin"
python -m uvicorn web.app:app --host 127.0.0.1 --port 8080

# Terminal 2
cd web\frontend
npm run dev
# Open http://127.0.0.1:5173
```

---

## Troubleshooting at work

| Problem | Fix |
|---------|-----|
| Port 8080 in use | `start-admin.ps1` tries to free it; or reboot / kill old `python` |
| `python` not found | Install Python from software center, or use `py -3.12` |
| Blank or old UI | Run `npm run build` or pull commit with `web/static/dist` |
| `Cannot reach server` in UI | Server not running — run `start-admin.ps1` |
| `503` / token errors | Script sets `dev-admin`; add `?token=dev-admin` to URL |
| `npm ERR! network` | Proxy vars, pre-built dist, or build at home and push |
| Banner scroll still wrong | Confirm new JS in DevTools (e.g. `index-CkQ-f5O0.js`); restart server + hard refresh |

---

## Files you care about

| Path | Notes |
|------|--------|
| `roadmap.csv` | Published data (often in git) |
| `roadmap.draft.csv` | Local draft (gitignored) |
| `releases.csv` | Release windows |
| `domains.draft.json` | Domain “current state” (gitignored) |
| `web/static/dist/` | Built React UI (gitignored unless force-added) |

---

## Airgapped / no-internet work

Same steps as production airgap: Python + pre-built `web/static/dist` only. See [AIRGAPPED.md](AIRGAPPED.md).

---

## One-liner cheat sheet

```powershell
git pull
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
.\start-admin.ps1
# Browser: http://127.0.0.1:8080/?token=dev-admin
```
