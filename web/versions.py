"""Admin version history for roadmap.csv (draft/live workflow)."""

from __future__ import annotations

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

from web.store import load_roadmap_records

META_FILE = "index.json"
MAX_VERSIONS = 50


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _load_index(history_dir: Path) -> list[dict]:
    path = history_dir / META_FILE
    if not path.exists():
        return []
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []


def _save_index(history_dir: Path, entries: list[dict]) -> None:
    history_dir.mkdir(parents=True, exist_ok=True)
    (history_dir / META_FILE).write_text(
        json.dumps(entries[:MAX_VERSIONS], indent=2),
        encoding="utf-8",
    )


def ensure_draft_from_live(live: Path, draft: Path) -> None:
    """Create working draft from published live file if draft is missing."""
    if draft.exists():
        return
    if live.exists():
        shutil.copy2(live, draft)
    else:
        draft.parent.mkdir(parents=True, exist_ok=True)
        draft.write_text(
            "domain,feature,task,start_date,end_date,notes,flag,flag_label,flag_color\n",
            encoding="utf-8",
        )


def publish_draft_to_live(draft: Path, live: Path) -> None:
    shutil.copy2(draft, live)


def list_versions(history_dir: Path) -> list[dict]:
    return _load_index(history_dir)


def create_snapshot(
    history_dir: Path,
    source: Path,
    *,
    label: str,
    actor: str = "admin",
) -> dict:
    """Copy roadmap CSV into history and append metadata."""
    history_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    dest = history_dir / f"roadmap-{ts}.csv"
    shutil.copy2(source, dest)
    try:
        task_count = len(load_roadmap_records(dest))
    except Exception:
        task_count = 0
    entry = {
        "id": ts,
        "filename": dest.name,
        "created_at": _now_iso(),
        "label": label,
        "actor": actor,
        "task_count": task_count,
    }
    entries = [entry, *_load_index(history_dir)]
    _save_index(history_dir, entries)
    return entry


def restore_version(history_dir: Path, version_id: str, draft: Path) -> dict:
    """Restore a history snapshot into the admin draft."""
    src = history_dir / f"roadmap-{version_id}.csv"
    if not src.exists():
        raise FileNotFoundError(f"Version {version_id} not found")
    shutil.copy2(src, draft)
    entries = _load_index(history_dir)
    meta = next((e for e in entries if e["id"] == version_id), None)
    return meta or {"id": version_id, "label": "restored"}
