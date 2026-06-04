import { TAG_COLORS, type TagColorId } from '../lib/roadmap-data';

interface Props {
  filterColors: Set<string>;
  filterObjectiveIds: Set<string>;
  objectives: { id: string; title: string }[];
  onToggleColor: (c: string) => void;
  onToggleObjective: (id: string) => void;
  onClose: () => void;
}

export function FilterDropdown({
  filterColors,
  filterObjectiveIds,
  objectives,
  onToggleColor,
  onToggleObjective,
  onClose,
}: Props) {
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} aria-hidden />
      <div
        className="theme-panel absolute right-0 top-full z-40 mt-2 w-72 rounded-xl border p-4 shadow-lg"
        style={{ borderColor: 'var(--app-border)' }}
      >
        <p className="theme-label mb-2 uppercase tracking-wide">
          Tag color
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {(Object.keys(TAG_COLORS) as TagColorId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onToggleColor(id)}
              className={`flex items-center gap-2 rounded-lg border px-2 py-1 text-xs transition ${
                filterColors.has(id)
                  ? 'border-[var(--app-accent)] bg-blue-500/10'
                  : 'border-[var(--app-border)] theme-btn-ghost'
              }`}
            >
              <span
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: TAG_COLORS[id].hex }}
              />
              {TAG_COLORS[id].label}
            </button>
          ))}
        </div>
        <p className="theme-label mb-2 uppercase tracking-wide">Domain</p>
        <ul className="max-h-40 space-y-1 overflow-y-auto">
          {objectives.map((o) => (
            <li key={o.id}>
              <label className="theme-btn-ghost flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={filterObjectiveIds.has(o.id)}
                  onChange={() => onToggleObjective(o.id)}
                  className="rounded border-gray-300 text-blue-500"
                />
                <span className="line-clamp-1">{o.title}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
