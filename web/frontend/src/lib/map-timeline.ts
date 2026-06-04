import { primaryReleaseForTask } from './releases';
import type { RoadmapCsvRow, TimelinePayload } from './types';
import type { Feature, Objective, RoadmapState, TagColorId } from './roadmap-data';
import { normalizeFromCsv, toCsvFlagFields } from './flags';
import { uid } from './roadmap-data';

const TAG_CYCLE: TagColorId[] = ['blue', 'teal', 'green', 'orange', 'yellow', 'purple'];

function flagToTag(hex: string, index: number): TagColorId {
  if (hex) {
    const h = hex.toLowerCase();
    if (h.includes('ef6c') || h.includes('f97')) return 'orange';
    if (h.includes('2e7d') || h.includes('22c55')) return 'green';
  }
  return TAG_CYCLE[index % TAG_CYCLE.length];
}

export function domainId(domain: string) {
  return `dom-${encodeURIComponent(domain)}`;
}

export function timelineToState(tl: TimelinePayload): RoadmapState {
  const objectives: Objective[] = [];
  const seenDomains = new Set<string>();
  const features: Feature[] = [];

  for (const t of tl.tasks) {
    if (!seenDomains.has(t.domain)) {
      seenDomains.add(t.domain);
      objectives.push({
        id: domainId(t.domain),
        title: t.domain,
        currentState: tl.domain_meta?.[t.domain] ?? '',
      });
    }
    const col = primaryReleaseForTask(t.start, t.end, tl.releases);
    const { flag, flagLabel } = normalizeFromCsv(t.flag, t.flag_label);
    features.push({
      id: `feat-${t.id}`,
      sourceId: t.id,
      objectiveId: domainId(t.domain),
      title: t.task,
      description: t.notes || '',
      column: col,
      tagColor: flagToTag(t.color, t.id),
      color: t.color || '#78909c',
      featureGroup: t.feature,
      startDate: t.start || '',
      endDate: t.end || '',
      flag,
      flagLabel,
      votes: 0,
    });
  }

  const startLabel = tl.months[0]?.label ?? '';
  const endLabel = tl.months.at(-1)?.label ?? '';

  return {
    appTitle: `Roadmap (${startLabel} – ${endLabel})`,
    objectives,
    features,
    timeline: tl,
  };
}

export function stateToCsvRows(state: RoadmapState): RoadmapCsvRow[] {
  return state.features.map((f) => {
    const objective = state.objectives.find((o) => o.id === f.objectiveId);
    const csvFlag = toCsvFlagFields(f.flag, f.flagLabel);
    return {
      domain: objective?.title ?? '',
      feature: f.featureGroup || f.title,
      task: f.title,
      start_date: f.startDate,
      end_date: f.endDate,
      notes: f.description,
      flag: csvFlag.flag,
      flag_label: csvFlag.flag_label,
    };
  });
}

export function newFeatureFromRelease(
  objectiveId: string,
  title: string,
  featureGroup: string,
  tagColor: TagColorId,
  releaseId: string,
  releases: TimelinePayload['releases'],
  color: string,
): Feature {
  const rel = releases.find((r) => r.release === releaseId);
  return {
    id: uid('feat'),
    objectiveId,
    title,
    description: '',
    column: releaseId,
    tagColor,
    color,
    featureGroup,
    startDate: rel?.start ?? '',
    endDate: rel?.end ?? '',
    flag: 'no',
    flagLabel: '',
    votes: 0,
  };
}

export function newObjective(title: string): Objective {
  return { id: domainId(title), title, currentState: '' };
}

export function stateToDomainMeta(state: RoadmapState): Record<string, string> {
  const out: Record<string, string> = {};
  for (const o of state.objectives) {
    const text = (o.currentState || '').trim();
    if (text) out[o.title] = text;
  }
  return out;
}

/** Rename domain title and re-key features to the new domain id. */
export function applyObjectivePatch(
  state: RoadmapState,
  objectiveId: string,
  patch: { title?: string; currentState?: string },
): RoadmapState {
  const obj = state.objectives.find((o) => o.id === objectiveId);
  if (!obj) return state;

  let title = obj.title;
  let id = obj.id;
  if (patch.title !== undefined) {
    const next = patch.title.trim();
    if (next && next !== obj.title) {
      title = next;
      id = domainId(next);
    }
  }

  const currentState = patch.currentState !== undefined ? patch.currentState : obj.currentState;

  return {
    ...state,
    objectives: state.objectives.map((o) =>
      o.id === objectiveId ? { ...o, id, title, currentState } : o,
    ),
    features: state.features.map((f) =>
      f.objectiveId === objectiveId ? { ...f, objectiveId: id } : f,
    ),
  };
}
