"""Admin version history for roadmap and lifecycle data (draft/live workflow)."""

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


def _prune_orphan_files(history_dir: Path, entries: list[dict]) -> None:
    """Remove snapshot files no longer referenced by the index."""
    if not history_dir.exists():
        return
    keep: set[str] = set()
    for entry in entries:
        if name := entry.get("filename"):
            keep.add(name)
        if name := entry.get("domains_filename"):
            keep.add(name)
    for path in history_dir.iterdir():
        if path.name == META_FILE:
            continue
        if path.is_file() and path.name not in keep:
            path.unlink(missing_ok=True)


def _save_index(history_dir: Path, entries: list[dict]) -> None:
    history_dir.mkdir(parents=True, exist_ok=True)
    trimmed = entries[:MAX_VERSIONS]
    (history_dir / META_FILE).write_text(
        json.dumps(trimmed, indent=2),
        encoding="utf-8",
    )
    _prune_orphan_files(history_dir, trimmed)


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
    source_kind: str = "draft",
    file_prefix: str = "roadmap",
    companion: Path | None = None,
    companion_prefix: str = "domains",
    item_count: int | None = None,
) -> dict:
    """Copy a data file (and optional companion) into history and append metadata."""
    history_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    dest = history_dir / f"{file_prefix}-{ts}{source.suffix}"
    shutil.copy2(source, dest)

    domains_filename: str | None = None
    if companion and companion.exists():
        domains_dest = history_dir / f"{companion_prefix}-{ts}{companion.suffix}"
        shutil.copy2(companion, domains_dest)
        domains_filename = domains_dest.name

    if item_count is None:
        if file_prefix == "roadmap":
            try:
                item_count = len(load_roadmap_records(dest))
            except Exception:
                item_count = 0
        else:
            try:
                raw = json.loads(dest.read_text(encoding="utf-8"))
                item_count = len(raw) if isinstance(raw, list) else 0
            except Exception:
                item_count = 0

    entry = {
        "id": ts,
        "filename": dest.name,
        "created_at": _now_iso(),
        "label": label,
        "actor": actor,
        "source": source_kind,
        "task_count": item_count,
    }
    if domains_filename:
        entry["domains_filename"] = domains_filename

    entries = [entry, *_load_index(history_dir)]
    _save_index(history_dir, entries)
    return entry


def restore_version(
    history_dir: Path,
    version_id: str,
    draft: Path,
    *,
    companion_draft: Path | None = None,
    file_prefix: str = "roadmap",
    companion_prefix: str = "domains",
) -> dict:
    """Restore a history snapshot into the admin draft (and optional companion)."""
    src = history_dir / f"{file_prefix}-{version_id}{draft.suffix}"
    if not src.exists():
        raise FileNotFoundError(f"Version {version_id} not found")
    shutil.copy2(src, draft)

    entries = _load_index(history_dir)
    meta = next((e for e in entries if e["id"] == version_id), None)

    if companion_draft is not None:
        domains_name = (meta or {}).get("domains_filename")
        if domains_name:
            domains_src = history_dir / domains_name
            if domains_src.exists():
                shutil.copy2(domains_src, companion_draft)
            else:
                companion_draft.write_text("{}", encoding="utf-8")
        else:
            companion_draft.write_text("{}", encoding="utf-8")

    return meta or {"id": version_id, "label": "restored"}
