import { Trash2, X } from 'lucide-react';
import { overlappingReleasesForTask, releaseById } from '../lib/releases';
import { FLAG_YES_NO_OPTIONS, FLAG_BORDER_COLORS, isFlagYes, type FlagYesNo, type FlagBorderColor } from '../lib/flags';
import { TAG_COLORS, type Feature, type TagColorId } from '../lib/roadmap-data';
import type { TimelinePayload } from '../lib/types';

interface Props {
  feature: Feature;
  timeline: TimelinePayload;
  readOnly?: boolean;
  onClose: () => void;
  onUpdate: (patch: Partial<Feature>) => void;
  onDelete: () => void;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-4">
      <div className="mb-1 text-xs font-medium" style={{ color: 'var(--app-text-muted)' }}>
        {label}
      </div>
      <div className="text-sm">{value || '—'}</div>
    </div>
  );
}

export function FeatureDrawer({
  feature,
  timeline,
  readOnly = false,
  onClose,
  onUpdate,
  onDelete,
}: Props) {
  const spanReleases = overlappingReleasesForTask(
    feature.startDate,
    feature.endDate,
    timeline.releases,
  );

  const setRelease = (releaseId: string) => {
    const rel = releaseById(timeline.releases, releaseId);
    onUpdate({
      column: releaseId,
      startDate: rel?.start ?? feature.startDate,
      endDate: rel?.end ?? feature.endDate,
    });
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
        aria-hidden
      />
      <aside className="theme-panel fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l shadow-2xl">
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: 'var(--app-border)' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'var(--app-text-muted)' }}>
            Task details
          </h2>
          <button type="button" onClick={onClose} className="theme-btn-ghost rounded-lg p-1.5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {readOnly ? (
            <>
              <Field label="Task" value={feature.title} />
              <Field label="Feature" value={feature.featureGroup} />
              <Field label="Notes" value={feature.description} />
              <Field label="Dates" value={`${feature.startDate} → ${feature.endDate}`} />
              <Field
                label="Flag"
                value={
                  isFlagYes(feature.flag)
                    ? `Yes${feature.flagLabel ? ` · ${feature.flagLabel}` : ''} · ${FLAG_BORDER_COLORS[feature.flagColor].label} border`
                    : 'No'
                }
              />
            </>
          ) : (
            <>
          <label className="theme-label mb-1 block">Task</label>
          <input
            className="theme-input mb-4 w-full rounded-lg px-3 py-2 text-sm font-medium"
            value={feature.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
          />

          <label className="theme-label mb-1 block">Feature (CSV row)</label>
          <input
            className="theme-input mb-4 w-full rounded-lg px-3 py-2 text-sm"
            value={feature.featureGroup}
            onChange={(e) => onUpdate({ featureGroup: e.target.value })}
          />

          <label className="theme-label mb-1 block">Notes</label>
          <textarea
            className="theme-input mb-4 min-h-[100px] w-full resize-y rounded-lg px-3 py-2 text-sm"
            value={feature.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
          />
            </>
          )}

          {spanReleases.length > 1 && (
            <p
              className="mb-3 rounded-lg px-3 py-2 text-xs"
              style={{ background: 'color-mix(in srgb, var(--app-accent) 12%, var(--app-surface))', color: 'var(--app-accent)' }}
            >
              Spans releases: <strong>{spanReleases.join(' → ')}</strong> (one bar across columns;
              edit dates to change width)
            </p>
          )}

          {!readOnly && (
            <>
          <label className="theme-label mb-1 block">
            Anchor release (narrow dates to this window)
          </label>
          <select
            className="theme-input mb-4 w-full rounded-lg px-3 py-2 text-sm"
            value={feature.column}
            onChange={(e) => setRelease(e.target.value)}
          >
            {timeline.releases.map((r) => (
              <option key={r.release} value={r.release}>
                {r.release} ({r.start} → {r.end})
              </option>
            ))}
          </select>

          <div className="mb-4 grid grid-cols-2 gap-2">
            <div>
              <label className="theme-label mb-1 block">Start</label>
              <input
                type="date"
                className="theme-input w-full rounded-lg px-2 py-1.5 text-sm"
                value={feature.startDate}
                onChange={(e) => onUpdate({ startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="theme-label mb-1 block">End</label>
              <input
                type="date"
                className="theme-input w-full rounded-lg px-2 py-1.5 text-sm"
                value={feature.endDate}
                onChange={(e) => onUpdate({ endDate: e.target.value })}
              />
            </div>
          </div>

          <label className="theme-label mb-1 block">Flag (dashed border)</label>
          <select
            className="theme-input mb-4 w-full rounded-lg px-3 py-2 text-sm"
            value={isFlagYes(feature.flag) ? 'yes' : 'no'}
            onChange={(e) => {
              const next = e.target.value as FlagYesNo;
              if (next === 'no') {
                onUpdate({ flag: 'no', flagLabel: '', flagColor: 'yellow' });
              } else {
                onUpdate({
                  flag: 'yes',
                  flagLabel: feature.flagLabel,
                  flagColor: feature.flagColor || 'yellow',
                });
              }
            }}
          >
            {FLAG_YES_NO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {isFlagYes(feature.flag) && (
            <>
              <label className="theme-label mb-1 block">Flag label</label>
              <input
                className="theme-input mb-4 w-full rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. At Risk, Customer Dependent, BLOCKED/DELAYED"
                value={feature.flagLabel}
                onChange={(e) => onUpdate({ flagLabel: e.target.value })}
              />

              <label className="theme-label mb-2 block">Flag border color</label>
              <div className="mb-4 flex flex-wrap gap-2">
                {(Object.keys(FLAG_BORDER_COLORS) as FlagBorderColor[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    title={FLAG_BORDER_COLORS[id].label}
                    onClick={() => onUpdate({ flagColor: id })}
                    className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-xs font-medium transition ${
                      feature.flagColor === id
                        ? 'border-[var(--app-text)]'
                        : 'border-transparent'
                    }`}
                    style={{ color: 'var(--app-text)' }}
                  >
                    <span
                      className="h-5 w-5 rounded-sm border-2 border-dashed"
                      style={{ borderColor: FLAG_BORDER_COLORS[id].hex }}
                    />
                    {FLAG_BORDER_COLORS[id].label}
                  </button>
                ))}
              </div>
            </>
          )}

          <label className="theme-label mb-2 block">Card color</label>
          <div className="mb-4 flex flex-wrap gap-2">
            {(Object.keys(TAG_COLORS) as TagColorId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() =>
                  onUpdate({
                    tagColor: id,
                    color: TAG_COLORS[id].hex,
                  })
                }
                className={`h-8 w-8 rounded-md border-2 ${
                  feature.tagColor === id ? 'border-[var(--app-text)]' : 'border-transparent'
                }`}
                style={{ backgroundColor: TAG_COLORS[id].hex }}
              />
            ))}
          </div>
            </>
          )}

          <p className="text-xs" style={{ color: 'var(--app-text-muted)' }}>
            Domain: {timeline.tasks.find((t) => t.id === feature.sourceId)?.domain ?? '—'}
          </p>
        </div>

        {!readOnly && (
        <div className="border-t p-5" style={{ borderColor: 'var(--app-border)' }}>
          <button
            type="button"
            onClick={onDelete}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete task
          </button>
        </div>
        )}
      </aside>
    </>
  );
}
