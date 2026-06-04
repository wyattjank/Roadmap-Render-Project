import { ChevronDown, ClipboardList, Plus, Target, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { taskGridPlacement, type ReleaseColumn } from '../lib/releases';
import type { TimelineRelease } from '../lib/types';
import type { Feature, Objective, TagColorId } from '../lib/roadmap-data';
import { FeatureCard } from './FeatureCard';
import { InlineAddFeature } from './InlineAddFeature';

interface Props {
  objective: Objective;
  collapsed: boolean;
  releaseColumns: ReleaseColumn[];
  gridTemplateColumns: string;
  features: Feature[];
  releases: TimelineRelease[];
  onToggleCollapse: () => void;
  onFeatureClick: (id: string) => void;
  onAddFeature: (
    title: string,
    tagColor: TagColorId,
    column: string,
    featureGroup: string,
  ) => void;
  onDeleteObjective: () => void;
  onUpdateObjective: (patch: { title?: string; currentState?: string }) => void;
  readOnly: boolean;
}

export function ObjectiveSection({
  objective,
  collapsed,
  releaseColumns,
  gridTemplateColumns,
  features,
  releases,
  onToggleCollapse,
  onFeatureClick,
  onAddFeature,
  onDeleteObjective,
  onUpdateObjective,
  readOnly,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!stateOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setStateOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [stateOpen]);

  const handleDelete = (e: MouseEvent) => {
    e.stopPropagation();
    const n = features.length;
    const msg =
      n > 0
        ? `Delete domain "${objective.title}" and all ${n} task(s)?`
        : `Delete domain "${objective.title}"?`;
    if (window.confirm(msg)) onDeleteObjective();
  };

  const hasState = Boolean((objective.currentState || '').trim());

  return (
    <section className="mb-4 w-full max-w-full">
      <div ref={panelRef} className="mb-3 flex w-full max-w-full items-start gap-2">
        <div
          className={`flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl bg-blue-500 text-white shadow-sm transition-all ${
            stateOpen ? 'ring-2 ring-blue-300/50' : ''
          }`}
        >
          {!stateOpen ? (
            <div className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:gap-2">
              <div className="flex min-w-0 items-center gap-2 sm:flex-1">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Target className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold leading-snug sm:text-base">
                  {objective.title}
                </span>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:justify-start">
                <button
                  type="button"
                  onClick={() => setStateOpen(true)}
                  className="flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition hover:bg-white/25"
                >
                  <ClipboardList className="h-3.5 w-3.5 shrink-0" />
                  <span className="whitespace-nowrap">
                    {hasState ? 'Current state' : 'See current state'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  title={collapsed ? 'Expand tasks' : 'Collapse tasks'}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-white/15"
                >
                  <ChevronDown
                    className={`h-5 w-5 transition-transform duration-200 ${
                      collapsed ? '-rotate-90' : ''
                    }`}
                  />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-white/80">
                  Domain current state
                </span>
                <button
                  type="button"
                  onClick={() => setStateOpen(false)}
                  className="rounded-lg p-1 hover:bg-white/15"
                  title="Collapse"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-white/80">
                  Domain name
                </label>
                {readOnly ? (
                  <p className="text-sm font-semibold">{objective.title}</p>
                ) : (
                  <input
                    className="w-full rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm font-semibold text-white placeholder:text-white/50 outline-none focus:border-white/50 focus:bg-white/15"
                    value={objective.title}
                    onChange={(e) => onUpdateObjective({ title: e.target.value })}
                  />
                )}
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-white/80">
                  Current state
                </label>
                {readOnly ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/95">
                    {objective.currentState || '—'}
                  </p>
                ) : (
                  <textarea
                    className="min-h-[120px] w-full resize-y rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm leading-relaxed text-white placeholder:text-white/50 outline-none focus:border-white/50 focus:bg-white/15"
                    placeholder="Status of work in this domain — tenants supported, risks, blockers…"
                    value={objective.currentState}
                    onChange={(e) => onUpdateObjective({ currentState: e.target.value })}
                  />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="flex items-center gap-1 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/25"
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${collapsed ? '-rotate-90' : ''}`}
                  />
                  {collapsed ? 'Show tasks' : 'Hide tasks'}
                </button>
                <button
                  type="button"
                  onClick={() => setStateOpen(false)}
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-white/90"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={handleDelete}
            title="Delete domain"
            className="theme-surface flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-300/60 text-red-500 shadow-sm transition hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          collapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className="theme-grid-bg gap-2 rounded-lg p-2"
            style={{
              display: 'grid',
              gridTemplateColumns,
              rowGap: 8,
              columnGap: 8,
            }}
          >
            {features.map((f) => {
              const { colStart, colSpan } = taskGridPlacement(
                f.startDate,
                f.endDate,
                f.column,
                releaseColumns,
                releases,
              );
              return (
                <div
                  key={f.id}
                  style={{ gridColumn: `${colStart} / span ${colSpan}` }}
                  className="min-w-0"
                >
                  <FeatureCard feature={f} stretched onClick={() => onFeatureClick(f.id)} />
                </div>
              );
            })}

            <div style={{ gridColumn: '1 / -1' }} className="pt-1">
              {!readOnly && adding ? (
                <InlineAddFeature
                  defaultColumn={releaseColumns[0]?.id ?? ''}
                  releaseColumns={releaseColumns}
                  defaultFeatureGroup={objective.title}
                  onAdd={(title, tag, col, group) => {
                    onAddFeature(title, tag, col, group);
                    setAdding(false);
                  }}
                  onCancel={() => setAdding(false)}
                />
              ) : !readOnly ? (
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  className="theme-surface flex w-full items-center justify-center gap-1 rounded-lg border border-dashed py-2 text-xs font-medium transition hover:border-[var(--app-accent)]"
                  style={{
                    borderColor: 'var(--app-border-strong)',
                    color: 'var(--app-text-muted)',
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add task
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
