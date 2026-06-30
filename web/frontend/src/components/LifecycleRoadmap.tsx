import { Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  fetchLifecycle,
  publishLifecycle,
  saveLifecycle,
  type DataSource,
  type LifecycleEntry,
} from '../lib/api';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'eol', label: 'EOL' },
  { value: 'planned', label: 'Planned' },
  { value: 'deprecated', label: 'Deprecated' },
] as const;

const STATUS_STYLES: Record<LifecycleEntry['status'], string> = {
  active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  eol: 'bg-red-500/15 text-red-700 dark:text-red-300',
  planned: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  deprecated: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
};

function formatDate(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function newEntry(): LifecycleEntry {
  const id = `new-${Date.now()}`;
  return {
    id,
    software: '',
    version: '',
    status: 'active',
    eol_date: null,
    active_until: null,
    notes: '',
  };
}

interface Props {
  readOnly: boolean;
  dataSource: DataSource;
  onStatus: (msg: string) => void;
  onBusy: (busy: boolean) => void;
  saveSignal: number;
  publishSignal: number;
  onSaved: () => void;
  onPublished: () => void;
}

export function LifecycleRoadmap({
  readOnly,
  dataSource,
  onStatus,
  onBusy,
  saveSignal,
  publishSignal,
  onSaved,
  onPublished,
}: Props) {
  const [entries, setEntries] = useState<LifecycleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchLifecycle(dataSource);
      setEntries(res.entries);
      onStatus(`Loaded ${res.entries.length} software entries · ${dataSource === 'live' ? 'Published' : 'Draft'}`);
    } catch (e) {
      setEntries([]);
      setError(e instanceof Error ? e.message : String(e));
      onStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }, [dataSource, onStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!saveSignal) return;
    if (readOnly) return;
    void (async () => {
      onBusy(true);
      onStatus('Saving lifecycle draft…');
      try {
        const res = await saveLifecycle(entries.filter((e) => e.software.trim()), 'Lifecycle saved');
        setEntries(res.entries);
        onStatus(`Lifecycle saved (${res.saved} entries) · version ${res.version.id}`);
        onSaved();
      } catch (e) {
        onStatus(`Save failed: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        onBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveSignal]);

  useEffect(() => {
    if (!publishSignal) return;
    if (readOnly) return;
    void (async () => {
      onBusy(true);
      onStatus('Publishing lifecycle…');
      try {
        await saveLifecycle(entries.filter((e) => e.software.trim()), 'Pre-publish lifecycle snapshot');
        const res = await publishLifecycle();
        onStatus(`Lifecycle published (${res.version.id})`);
        onPublished();
      } catch (e) {
        onStatus(`Publish failed: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        onBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publishSignal]);

  const updateEntry = (id: string, patch: Partial<LifecycleEntry>) => {
    if (readOnly) return;
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const deleteEntry = (id: string) => {
    if (readOnly) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const addEntry = () => {
    if (readOnly) return;
    setEntries((prev) => [...prev, newEntry()]);
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm" style={{ color: 'var(--app-text-muted)' }}>
        Loading software lifecycle…
      </div>
    );
  }

  if (error && entries.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-sm text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className="flex shrink-0 items-center justify-between border-b px-4 py-3"
        style={{ borderColor: 'var(--app-border)' }}
      >
        <div>
          <h2 className="text-sm font-semibold">Software Lifecycle Roadmap</h2>
          <p className="text-xs" style={{ color: 'var(--app-text-muted)' }}>
            Track platform software versions, EOL dates, and support windows
          </p>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={addEntry}
            className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600"
          >
            <Plus className="h-3.5 w-3.5" />
            Add software
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead
            className="sticky top-0 z-10 text-left text-xs font-semibold uppercase tracking-wide"
            style={{ background: 'var(--app-surface-muted)', color: 'var(--app-text-muted)' }}
          >
            <tr>
              <th className="border-b px-4 py-2.5" style={{ borderColor: 'var(--app-border)' }}>
                Software
              </th>
              <th className="border-b px-4 py-2.5" style={{ borderColor: 'var(--app-border)' }}>
                Version
              </th>
              <th className="border-b px-4 py-2.5" style={{ borderColor: 'var(--app-border)' }}>
                Status
              </th>
              <th className="border-b px-4 py-2.5" style={{ borderColor: 'var(--app-border)' }}>
                EOL date
              </th>
              <th className="border-b px-4 py-2.5" style={{ borderColor: 'var(--app-border)' }}>
                Active until
              </th>
              <th className="border-b px-4 py-2.5" style={{ borderColor: 'var(--app-border)' }}>
                Notes
              </th>
              {!readOnly && (
                <th className="border-b px-4 py-2.5 w-12" style={{ borderColor: 'var(--app-border)' }} />
              )}
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td
                  colSpan={readOnly ? 6 : 7}
                  className="px-4 py-8 text-center text-sm"
                  style={{ color: 'var(--app-text-muted)' }}
                >
                  No software entries yet. Add your platform components to track versions and EOL dates.
                </td>
              </tr>
            )}
            {entries.map((entry) => (
              <tr
                key={entry.id}
                className="border-b transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                style={{ borderColor: 'var(--app-border)' }}
              >
                <td className="px-4 py-2">
                  {readOnly ? (
                    <span className="font-medium">{entry.software}</span>
                  ) : (
                    <input
                      className="theme-input w-full rounded px-2 py-1 text-sm"
                      value={entry.software}
                      onChange={(e) => updateEntry(entry.id, { software: e.target.value })}
                      placeholder="e.g. Rancher RKE"
                    />
                  )}
                </td>
                <td className="px-4 py-2">
                  {readOnly ? (
                    entry.version
                  ) : (
                    <input
                      className="theme-input w-full rounded px-2 py-1 text-sm"
                      value={entry.version}
                      onChange={(e) => updateEntry(entry.id, { version: e.target.value })}
                      placeholder="e.g. 2"
                    />
                  )}
                </td>
                <td className="px-4 py-2">
                  {readOnly ? (
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[entry.status]}`}
                    >
                      {STATUS_OPTIONS.find((o) => o.value === entry.status)?.label ?? entry.status}
                    </span>
                  ) : (
                    <select
                      className="theme-input rounded px-2 py-1 text-sm"
                      value={entry.status}
                      onChange={(e) =>
                        updateEntry(entry.id, { status: e.target.value as LifecycleEntry['status'] })
                      }
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-4 py-2">
                  {readOnly ? (
                    <span className={entry.eol_date ? 'text-red-600 dark:text-red-400' : ''}>
                      {formatDate(entry.eol_date)}
                    </span>
                  ) : (
                    <input
                      type="date"
                      className="theme-input rounded px-2 py-1 text-sm"
                      value={entry.eol_date ?? ''}
                      onChange={(e) =>
                        updateEntry(entry.id, { eol_date: e.target.value || null })
                      }
                    />
                  )}
                </td>
                <td className="px-4 py-2">
                  {readOnly ? (
                    formatDate(entry.active_until)
                  ) : (
                    <input
                      type="date"
                      className="theme-input rounded px-2 py-1 text-sm"
                      value={entry.active_until ?? ''}
                      onChange={(e) =>
                        updateEntry(entry.id, { active_until: e.target.value || null })
                      }
                    />
                  )}
                </td>
                <td className="px-4 py-2">
                  {readOnly ? (
                    <span style={{ color: 'var(--app-text-muted)' }}>{entry.notes || '—'}</span>
                  ) : (
                    <input
                      className="theme-input w-full rounded px-2 py-1 text-sm"
                      value={entry.notes}
                      onChange={(e) => updateEntry(entry.id, { notes: e.target.value })}
                      placeholder="Optional notes"
                    />
                  )}
                </td>
                {!readOnly && (
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => deleteEntry(entry.id)}
                      className="theme-btn-ghost rounded p-1 text-red-500 hover:bg-red-500/10"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
