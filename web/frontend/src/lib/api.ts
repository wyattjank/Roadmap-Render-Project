import type { TimelinePayload } from './types';

const TOKEN_KEY = 'roadmap_admin_token';
const FETCH_TIMEOUT_MS = 20_000;

export type DataSource = 'draft' | 'live';

export interface VersionEntry {
  id: string;
  filename: string;
  created_at: string;
  label: string;
  actor: string;
  task_count: number;
}

export function getToken(): string {
  const q = new URLSearchParams(window.location.search).get('token');
  if (q) {
    sessionStorage.setItem(TOKEN_KEY, q);
    return q;
  }
  return sessionStorage.getItem(TOKEN_KEY) || '';
}

export function setToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

function headers(token: string): HeadersInit {
  if (!token) throw new Error('No admin token');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error(
        'Request timed out — is the server running? Start it with .\\start-admin.ps1',
      );
    }
    if (e instanceof TypeError) {
      throw new Error(
        'Cannot reach server — start uvicorn on port 8080 (run .\\start-admin.ps1 from the project folder).',
      );
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function parseError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const body = text ? JSON.parse(text) : {};
    if (typeof body.detail === 'string') return body.detail;
    if (body.detail) return JSON.stringify(body.detail);
  } catch {
    if (text) return `HTTP ${res.status}: ${text.slice(0, 200)}`;
  }
  return `HTTP ${res.status} ${res.statusText}`;
}

export async function fetchTimeline(
  source: DataSource = 'draft',
  token?: string,
): Promise<TimelinePayload> {
  const t = token ?? getToken();
  const res = await fetchWithTimeout(`/api/timeline?source=${source}`, {
    headers: headers(t),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function saveRoadmap(
  tasks: import('./types').RoadmapCsvRow[],
  snapshotLabel?: string,
  domainMeta?: Record<string, string>,
) {
  const res = await fetchWithTimeout('/api/roadmap', {
    method: 'PUT',
    headers: headers(getToken()),
    body: JSON.stringify({
      tasks,
      domain_meta: domainMeta ?? {},
      snapshot_label: snapshotLabel,
    }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{
    saved: number;
    timeline: TimelinePayload;
    version: VersionEntry;
  }>;
}

export async function publishLive() {
  const res = await fetchWithTimeout('/api/publish', {
    method: 'POST',
    headers: headers(getToken()),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{
    published: boolean;
    timeline: TimelinePayload;
    version: VersionEntry;
  }>;
}

export async function fetchVersions() {
  const res = await fetchWithTimeout('/api/versions', { headers: headers(getToken()) });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ versions: VersionEntry[] }>;
}

export async function restoreVersion(versionId: string) {
  const res = await fetchWithTimeout(`/api/versions/${versionId}/restore`, {
    method: 'POST',
    headers: headers(getToken()),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ timeline: TimelinePayload; restored: string }>;
}

export async function exportExcel(source: DataSource = 'live'): Promise<Blob> {
  const res = await fetchWithTimeout(`/api/export/excel?source=${source}`, {
    method: 'POST',
    headers: headers(getToken()),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.blob();
}
