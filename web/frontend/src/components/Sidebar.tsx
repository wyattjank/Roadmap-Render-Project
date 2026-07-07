import { Layers, Map } from 'lucide-react';

export type AppTab = 'roadmap' | 'lifecycle';

interface Props {
  tab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const TABS: { id: AppTab; icon: typeof Map; label: string; hint: string }[] = [
  { id: 'roadmap', icon: Map, label: 'Roadmap', hint: 'Release roadmap by domain' },
  {
    id: 'lifecycle',
    icon: Layers,
    label: 'Lifecycle',
    hint: 'Software versions, EOL dates, support windows',
  },
];

export function Sidebar({ tab, onTabChange }: Props) {
  return (
    <aside
      className="theme-header flex w-14 shrink-0 flex-col items-center border-r py-4"
      style={{ borderColor: 'var(--app-border)' }}
    >
      {TABS.map(({ id, icon: Icon, label, hint }) => {
        const active = tab === id;
        return (
          <button
            key={id}
            type="button"
            title={hint}
            onClick={() => onTabChange(id)}
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
              {id === 'roadmap' ? 'Map' : 'Life'}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
