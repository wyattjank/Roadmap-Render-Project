import { History, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchVersions, restoreVersion, type VersionEntry } from '../lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
  onRestored: () => void;
}

export function VersionsPanel({ open, onClose, onRestored }: Props) {
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError('');
    fetchVersions()
      .then((r) => setVersions(r.versions))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [open]);

  const handleRestore = async (id: string) => {
    if (!window.confirm(`Restore draft from version ${id}? Current draft will be snapshotted first.`)) {
      return;
    }
    setBusyId(id);
    try {
      await restoreVersion(id);
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
            <h2 className="text-sm font-semibold">Version history</h2>
          </div>
          <button type="button" onClick={onClose} className="theme-btn-ghost rounded-lg p-1.5">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p
          className="border-b px-5 py-3 text-xs"
          style={{ borderColor: 'var(--app-border)', color: 'var(--app-text-muted)' }}
        >
          Admin only. Snapshots are created when you save draft or publish. Restore replaces your
          working draft (not live until you publish).
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
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm hover:border-gray-300"
              >
                <div className="font-medium text-gray-800">{v.label}</div>
                <div className="mt-0.5 text-xs text-gray-500">
                  {v.created_at.replace('T', ' ').slice(0, 19)} UTC · {v.task_count} tasks
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
