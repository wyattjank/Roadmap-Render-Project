import { Eye, Layers, Pencil } from 'lucide-react';

export type ViewMode = 'edit' | 'readonly' | 'lifecycle';

interface Props {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

const MODES: { id: ViewMode; icon: typeof Pencil; label: string; hint: string }[] = [
  { id: 'edit', icon: Pencil, label: 'Edit', hint: 'Edit draft — add, delete, save, publish' },
  { id: 'readonly', icon: Eye, label: 'Standard view', hint: 'Published live roadmap (read-only)' },
  {
    id: 'lifecycle',
    icon: Layers,
    label: 'Lifecycle',
    hint: 'Software lifecycle — versions, EOL dates, support windows',
  },
];

export function Sidebar({ mode, onModeChange }: Props) {
  return (
    <aside
      className="theme-header flex w-14 shrink-0 flex-col items-center border-r py-4"
      style={{ borderColor: 'var(--app-border)' }}
    >
      {MODES.map(({ id, icon: Icon, label, hint }) => {
        const active = mode === id;
        return (
          <button
            key={id}
            type="button"
            title={hint}
            onClick={() => onModeChange(id)}
            className={`theme-btn-ghost relative mb-3 flex h-11 w-11 flex-col items-center justify-center rounded-lg transition ${
              active ? 'bg-blue-500/15' : ''
            }`}
            style={{ color: active ? 'var(--app-accent)' : 'var(--app-text-muted)' }}
          >
            {active && (
              <span
                className="absolute left-0 top-1/2 h-7 w-0.5 -translate-y-1/2 rounded-r"
                style={{ background: 'var(--app-accent)' }}
              />
            )}
            <Icon className="h-5 w-5" strokeWidth={1.75} />
            <span className="mt-0.5 text-[8px] font-semibold uppercase leading-none tracking-tight">
              {id === 'edit' ? 'Edit' : id === 'readonly' ? 'View' : 'Life'}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
