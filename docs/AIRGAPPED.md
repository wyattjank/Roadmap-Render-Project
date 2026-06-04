# Airgapped deployment considerations

End state for this project is operation in an **airgapped** (no public internet) environment. Plan builds, transfers, and runtime so nothing depends on outbound connectivity.

## Build phase (connected staging — once per release)

Do all of this **before** moving artifacts into the enclave:

| Step | Action |
|------|--------|
| 1 | `npm ci` + `npm run build` in `web/frontend` → commit or bundle `web/static/dist/` |
| 2 | `pip download -r requirements.txt -d wheels/` (or vendor wheels) for target OS/arch |
| 3 | Build container image (multi-stage: Node build stage + Python runtime) on staging CI |
| 4 | Export image: `docker save roadmap-admin:TAG -o roadmap-admin.tar` |
| 5 | Scan/sign image per org policy; record SBOM |
| 6 | Transfer via approved media (DIOD, one-way transfer, etc.) |

**Do not** run `npm install`, `pip install` from PyPI, or pull base images **inside** the airgap unless you operate an **internal mirror** (Artifactory, Nexus, disconnected ECR).

## Runtime (inside airgap)

### What the service needs

- **Process:** `uvicorn web.app:app --host 0.0.0.0 --port 8080` (no `--reload` in prod)
- **Env:** `ROADMAP_ADMIN_TOKEN`, `ROADMAP_DATA_DIR` (persistent volume)
- **Network:** inbound HTTPS from authorized clients only; **no egress required** for normal use
- **Storage:** writable `ROADMAP_DATA_DIR` for `roadmap.csv`, `roadmap.draft.csv`, `domains.json`, `domains.draft.json`, `releases.csv`, `history/`

### What must NOT be required at runtime

| Item | Risk if missing in airgap |
|------|---------------------------|
| Google Fonts / CDN | UI hangs or blocks on external CSS |
| npm / Node | Not needed if `web/static/dist` is baked in |
| PyPI | Not needed if wheels/image include deps |
| Public OIDC (Google, etc.) | SSO must use **internal** LDAP/IdP only |
| External Excel APIs | None today — export is local `openpyxl` |

The UI uses **system fonts only** (no Google Fonts in `index.html`). Rebuild after any template change.

## Container / ECS / on-prem K8s

- Use **private registry** inside the enclave (not Docker Hub pull at deploy time).
- Mount **persistent volume** for `ROADMAP_DATA_DIR`; task restart must not wipe CSVs.
- Health check: `GET /health` (no auth) on load balancer / orchestrator.
- **Single replica** is fine for admin editing; scale read-only later if needed.
- Logs: stdout only; forward to internal SIEM if required — avoid shipping logs to public cloud.

## Authentication in airgap

- **Now:** `ROADMAP_ADMIN_TOKEN` in secrets store (K8s secret, vault, etc.) — works offline.
- **Later (Dex/F5/LDAP):** Dex and LDAP must be **deployed inside** the same enclave or trusted enclave network. F5 VIP is internal-only. No callback URLs to the public internet.
- Disable or block `?token=` on URLs in production; use headers or HttpOnly cookies after SSO.

## Data classification

- `roadmap.csv` / draft may contain program details — classify per your ATO/RMF boundary.
- Version snapshots under `history/` duplicate that data — include in backup and disposal procedures.
- Excel export downloads to client workstation — same classification as source CSV.

## Backup and restore

- Backup: `ROADMAP_DATA_DIR` entire directory (live + draft + domains + history + releases).
- Restore: stop service → replace files → start service → verify `/api/timeline?source=live`.
- Version restore API only affects draft; keep filesystem backups for disaster recovery.

## Supply chain

- Pin versions in `requirements.txt` and `package-lock.json`.
- Rebuild image on every dependency bump; re-scan before re-transfer.
- Prefer minimal base image (e.g. `python:3.12-slim`) from mirrored registry.

## Testing checklist (in enclave)

- [ ] Open UI — no browser requests to external hosts (check DevTools Network).
- [ ] Connect with admin token; load timeline; edit task; save draft; publish.
- [ ] Domain “current state” saves to `domains.draft.json`.
- [ ] Export Excel succeeds without internet.
- [ ] `python render.py` still works if CLI is deployed alongside.
- [ ] Restart container — data persists on volume.
- [ ] Resize browser / scroll board — timeline header stays aligned (single scrollport).

## Optional internal mirrors

If policy allows mirrors instead of one-shot transfer:

- **Container:** private ECR / Harbor / Artifactory
- **Python:** internal PyPI simple index with uploaded wheels
- **Node:** internal npm registry with `package-lock.json` tarballs

Document mirror URLs in your deployment runbook, not in this public README if they are sensitive.

## Out of scope for airgap POC

- Automatic updates from GitHub
- Cloud-only secrets (use in-enclave vault)
- Public Route 53 / ACM unless you operate private PKI and internal DNS (see main README for connected AWS pattern)
