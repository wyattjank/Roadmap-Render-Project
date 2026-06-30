import { History, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  fetchLifecycleVersions,
  fetchVersions,
  restoreLifecycleVersion,
  restoreVersion,
  type VersionEntry,
} from '../lib/api';

type HistoryKind = 'roadmap' | 'lifecycle';

interface Props {
  open: boolean;
  onClose: () => void;
  onRestored: () => void;
  kind?: HistoryKind;
}

function sourceBadge(source?: string, label?: string) {
  const isLive =
    source === 'live' ||
    (label?.toLowerCase().includes('publish') && !label?.toLowerCase().includes('pre-publish'));
  if (isLive) {
    return (
      <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-700 dark:text-emerald-300">
        Published
      </span>
    );
  }
  return (
    <span className="rounded-full bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-blue-700 dark:text-blue-300">
      Draft
    </span>
  );
}

export function VersionsPanel({ open, onClose, onRestored, kind = 'roadmap' }: Props) {
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const title = kind === 'lifecycle' ? 'Lifecycle version history' : 'Roadmap version history';

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError('');
    const fetcher = kind === 'lifecycle' ? fetchLifecycleVersions : fetchVersions;
    fetcher()
      .then((r) => setVersions(r.versions))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [open, kind]);

  const handleRestore = async (id: string) => {
    if (
      !window.confirm(
        `Restore draft from version ${id}? Current draft will be snapshotted first.`,
      )
    ) {
      return;
    }
    setBusyId(id);
    try {
      if (kind === 'lifecycle') {
        await restoreLifecycleVersion(id);
      } else {
        await restoreVersion(id);
      }
      onRestored();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} aria-hidden />
      <aside className="theme-panel fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l shadow-2xl">
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: 'var(--app-border)' }}
        >
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" style={{ color: 'var(--app-accent)' }} />
            <h2 className="text-sm font-semibold">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="theme-btn-ghost rounded-lg p-1.5">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p
          className="border-b px-5 py-3 text-xs"
          style={{ borderColor: 'var(--app-border)', color: 'var(--app-text-muted)' }}
        >
          Up to 50 snapshots kept. Created on each save or publish. Restore replaces your working
          draft (not live until you publish).
        </p>
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading && (
            <p className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
              Loading…
            </p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && versions.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--app-text-muted)' }}>
              No versions yet. Save draft to create one.
            </p>
          )}
          <ul className="space-y-2">
            {versions.map((v) => (
              <li
                key={v.id}
                className="theme-muted rounded-lg border px-3 py-2.5 text-sm"
                style={{ borderColor: 'var(--app-border)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{v.label}</span>
                  {sourceBadge(v.source, v.label)}
                </div>
                <div className="mt-0.5 text-xs" style={{ color: 'var(--app-text-muted)' }}>
                  {v.created_at.replace('T', ' ').slice(0, 19)} UTC · {v.task_count}{' '}
                  {kind === 'lifecycle' ? 'entries' : 'tasks'}
                </div>
                <button
                  type="button"
                  disabled={busyId === v.id}
                  onClick={() => handleRestore(v.id)}
                  className="mt-2 text-xs font-medium hover:underline disabled:opacity-50"
                  style={{ color: 'var(--app-accent)' }}
                >
                  {busyId === v.id ? 'Restoring…' : 'Restore to draft'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
}
