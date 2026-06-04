import { Plus } from 'lucide-react';

import { useMemo } from 'react';

import {

  buildMonthCells,

  buildReleaseColumns,

  releaseGridTemplateColumns,

  type ReleaseColumn,

} from '../lib/releases';

import type { Feature, Objective, TagColorId } from '../lib/roadmap-data';

import type { TimelinePayload } from '../lib/types';

import { MONTH_COLUMN_WIDTH, ReleaseTimelineHeader } from './ReleaseTimelineHeader';

import { ObjectiveSection } from './ObjectiveSection';



interface Props {

  timeline: TimelinePayload;

  objectives: Objective[];

  features: Feature[];

  collapsedIds: Set<string>;

  search: string;

  filterColors: Set<string>;

  filterObjectiveIds: Set<string>;

  onToggleCollapse: (id: string) => void;

  onFeatureClick: (id: string) => void;

  onAddFeature: (

    objectiveId: string,

    title: string,

    tagColor: TagColorId,

    column: string,

    featureGroup: string,

  ) => void;

  onAddObjective: () => void;

  onDeleteObjective: (objectiveId: string) => void;

  onUpdateObjective: (

    objectiveId: string,

    patch: { title?: string; currentState?: string },

  ) => void;

  readOnly: boolean;

}



export function Board({

  timeline,

  objectives,

  features,

  collapsedIds,

  search,

  filterColors,

  filterObjectiveIds,

  onToggleCollapse,

  onFeatureClick,

  onAddFeature,

  onAddObjective,

  onDeleteObjective,

  onUpdateObjective,

  readOnly,

}: Props) {

  const monthCells = useMemo(

    () => buildMonthCells(timeline.months, timeline.releases),

    [timeline.months, timeline.releases],

  );

  const releaseColumns = useMemo(

    () => buildReleaseColumns(timeline.months, timeline.releases),

    [timeline.months, timeline.releases],

  );



  const colWidth = (col: ReleaseColumn) =>

    Math.max(col.monthSpan * MONTH_COLUMN_WIDTH - 8, 140);



  const gridTemplateColumns = useMemo(

    () => releaseGridTemplateColumns(releaseColumns, colWidth),

    [releaseColumns],

  );



  const q = search.trim().toLowerCase();



  const visibleFeatures = useMemo(() => {

    return features.filter((f) => {

      if (q && !f.title.toLowerCase().includes(q) && !f.featureGroup.toLowerCase().includes(q)) {

        return false;

      }

      if (filterColors.size && !filterColors.has(f.tagColor)) return false;

      if (filterObjectiveIds.size && !filterObjectiveIds.has(f.objectiveId)) return false;

      return true;

    });

  }, [features, q, filterColors, filterObjectiveIds]);



  const visibleObjectives = useMemo(() => {

    if (!q && !filterColors.size && !filterObjectiveIds.size) return objectives;

    const ids = new Set(visibleFeatures.map((f) => f.objectiveId));

    return objectives.filter((o) => ids.has(o.id));

  }, [objectives, visibleFeatures, q, filterColors, filterObjectiveIds]);



  return (

    <div className="board-layout flex min-h-0 flex-1 flex-col overflow-hidden">

      {/* One scrollport: sticky timeline + board share horizontal scroll; no split scrollbars */}

      <div className="board-scrollport min-h-0 flex-1">

        <div className="board-scroll-inner min-w-max">

          <div className="board-sticky-header">

            <ReleaseTimelineHeader

              monthCells={monthCells}

              releaseColumns={releaseColumns}

              gridTemplateColumns={gridTemplateColumns}

              today={timeline.today}

            />

          </div>



          <div className="px-2 pb-8 pt-3">

            {visibleObjectives.map((obj) => (

              <ObjectiveSection

                key={obj.id}

                objective={obj}

                collapsed={collapsedIds.has(obj.id)}

                onToggleCollapse={() => onToggleCollapse(obj.id)}

                releaseColumns={releaseColumns}

                gridTemplateColumns={gridTemplateColumns}

                features={visibleFeatures.filter((f) => f.objectiveId === obj.id)}

                releases={timeline.releases}

                onFeatureClick={onFeatureClick}

                onAddFeature={(title, tag, col, group) =>

                  onAddFeature(obj.id, title, tag, col, group)

                }

                onDeleteObjective={() => onDeleteObjective(obj.id)}

                onUpdateObjective={(patch) => onUpdateObjective(obj.id, patch)}

                readOnly={readOnly}

              />

            ))}



            {visibleObjectives.length === 0 && (

              <p className="py-12 text-center text-sm" style={{ color: 'var(--app-text-muted)' }}>

                No objectives match your search or filters.

              </p>

            )}



            {!readOnly && (

              <button

                type="button"

                onClick={onAddObjective}

                className="theme-surface mt-2 flex w-full max-w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-4 text-sm font-medium transition hover:border-[var(--app-accent)]"

                style={{

                  borderColor: 'var(--app-border-strong)',

                  color: 'var(--app-text-muted)',

                }}

              >

                <Plus className="h-4 w-4" />

                Add domain (objective)

              </button>

            )}

          </div>

        </div>

      </div>

    </div>

  );

}

