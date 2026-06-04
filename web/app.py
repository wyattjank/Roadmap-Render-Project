"""
Roadmap admin API + UI. Run from project root:

  set ROADMAP_ADMIN_TOKEN=your-secret
  uvicorn web.app:app --reload --app-dir .
"""

import os
import sys
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from render import export_to_excel, load_releases, load_roadmap  # noqa: E402
from web.store import (  # noqa: E402
    load_release_records,
    load_roadmap_records,
    save_releases_csv,
    save_roadmap_csv,
)
from web.timeline_data import build_timeline_payload  # noqa: E402
from web.domain_meta import (  # noqa: E402
    ensure_draft_meta_from_live,
    load_domain_meta,
    publish_meta,
    save_domain_meta,
)
from web.versions import (  # noqa: E402
    create_snapshot,
    ensure_draft_from_live,
    list_versions,
    publish_draft_to_live,
    restore_version,
)

DATA_DIR = Path(os.environ.get("ROADMAP_DATA_DIR", ROOT))
LIVE_CSV = DATA_DIR / "roadmap.csv"
DRAFT_CSV = DATA_DIR / "roadmap.draft.csv"
DRAFT_DOMAINS = DATA_DIR / "domains.draft.json"
LIVE_DOMAINS = DATA_DIR / "domains.json"
RELEASES_CSV = DATA_DIR / "releases.csv"
EXPORT_XLSX = DATA_DIR / "roadmap.xlsx"
HISTORY_DIR = DATA_DIR / "history"
ADMIN_TOKEN = os.environ.get("ROADMAP_ADMIN_TOKEN", "")

app = FastAPI(title="Roadmap Admin", version="0.2.0")
bearer = HTTPBearer(auto_error=False)

STATIC_DIR = Path(__file__).parent / "static"
REACT_DIST = STATIC_DIR / "dist"
if (REACT_DIST / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=REACT_DIST / "assets"), name="assets")


def require_admin(
    request: Request,
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> None:
    if not ADMIN_TOKEN:
        raise HTTPException(
            status_code=503,
            detail="ROADMAP_ADMIN_TOKEN is not set on the server.",
        )
    token = creds.credentials if creds else None
    if not token and request:
        token = request.query_params.get("token")
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid or missing admin token.")


def _roadmap_path(source: str) -> Path:
    """live = published (read-only for customers); draft = admin working copy."""
    ensure_draft_from_live(LIVE_CSV, DRAFT_CSV)
    if source == "live":
        return LIVE_CSV
    return DRAFT_CSV


def _domains_path(source: str) -> Path:
    ensure_draft_meta_from_live(LIVE_DOMAINS, DRAFT_DOMAINS)
    if source == "live":
        return LIVE_DOMAINS
    return DRAFT_DOMAINS


def _timeline_with_meta(roadmap, releases, source: str) -> dict:
    payload = build_timeline_payload(roadmap, releases)
    payload["domain_meta"] = load_domain_meta(_domains_path(source))
    payload["source"] = source
    return payload


class RoadmapSave(BaseModel):
    tasks: list[dict]
    domain_meta: dict[str, str] | None = None
    snapshot_label: str | None = None


class ReleasesSave(BaseModel):
    releases: list[dict]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/", response_class=HTMLResponse)
def admin_ui(request: Request):
    react_index = REACT_DIST / "index.html"
    if react_index.exists():
        return FileResponse(react_index)
    legacy = STATIC_DIR / "admin.html"
    if legacy.exists():
        return FileResponse(legacy)
    return HTMLResponse("<p>UI not built. Run: cd web/frontend && npm install && npm run build</p>", status_code=500)


@app.get("/api/timeline")
def api_timeline(request: Request, _: None = Depends(require_admin)):
    source = request.query_params.get("source", "draft")
    roadmap = load_roadmap(_roadmap_path(source))
    releases = load_releases(RELEASES_CSV)
    return _timeline_with_meta(roadmap, releases, source)


@app.get("/api/roadmap")
def api_get_roadmap(request: Request, _: None = Depends(require_admin)):
    source = request.query_params.get("source", "draft")
    return {"tasks": load_roadmap_records(_roadmap_path(source)), "source": source}


@app.put("/api/roadmap")
def api_put_roadmap(body: RoadmapSave, _: None = Depends(require_admin)):
    """Save admin draft and record a version snapshot."""
    save_roadmap_csv(DRAFT_CSV, body.tasks)
    if body.domain_meta is not None:
        save_domain_meta(DRAFT_DOMAINS, body.domain_meta)
    label = body.snapshot_label or "Draft saved"
    version = create_snapshot(HISTORY_DIR, DRAFT_CSV, label=label)
    roadmap = load_roadmap(DRAFT_CSV)
    releases = load_releases(RELEASES_CSV)
    return {
        "saved": len(body.tasks),
        "timeline": _timeline_with_meta(roadmap, releases, "draft"),
        "version": version,
        "source": "draft",
    }


@app.post("/api/publish")
def api_publish(_: None = Depends(require_admin)):
    """Copy draft → live (what read-only / customer view will use)."""
    ensure_draft_from_live(LIVE_CSV, DRAFT_CSV)
    publish_draft_to_live(DRAFT_CSV, LIVE_CSV)
    publish_meta(DRAFT_DOMAINS, LIVE_DOMAINS)
    version = create_snapshot(HISTORY_DIR, LIVE_CSV, label="Published to live")
    roadmap = load_roadmap(LIVE_CSV)
    releases = load_releases(RELEASES_CSV)
    return {
        "published": True,
        "timeline": _timeline_with_meta(roadmap, releases, "live"),
        "version": version,
        "source": "live",
    }


@app.get("/api/versions")
def api_versions(_: None = Depends(require_admin)):
    return {"versions": list_versions(HISTORY_DIR)}


@app.post("/api/versions/{version_id}/restore")
def api_restore_version(version_id: str, _: None = Depends(require_admin)):
    try:
        meta = restore_version(HISTORY_DIR, version_id, DRAFT_CSV)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    create_snapshot(HISTORY_DIR, DRAFT_CSV, label=f"Before restore ({version_id})")
    roadmap = load_roadmap(DRAFT_CSV)
    releases = load_releases(RELEASES_CSV)
    return {
        "restored": version_id,
        "meta": meta,
        "timeline": _timeline_with_meta(roadmap, releases, "draft"),
    }


@app.get("/api/releases")
def api_get_releases(_: None = Depends(require_admin)):
    return {"releases": load_release_records(RELEASES_CSV)}


@app.put("/api/releases")
def api_put_releases(body: ReleasesSave, _: None = Depends(require_admin)):
    save_releases_csv(RELEASES_CSV, body.releases)
    return {"saved": len(body.releases)}


@app.post("/api/export/excel")
def api_export_excel(request: Request, _: None = Depends(require_admin)):
    source = request.query_params.get("source", "live")
    roadmap = load_roadmap(_roadmap_path(source))
    releases = load_releases(RELEASES_CSV)
    if roadmap.empty:
        raise HTTPException(status_code=400, detail="No valid roadmap rows.")
    export_to_excel(roadmap, releases, EXPORT_XLSX)
    return FileResponse(
        EXPORT_XLSX,
        filename="roadmap.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
