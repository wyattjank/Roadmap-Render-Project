import type { TimelinePayload } from './types';

export type TagColorId = 'green' | 'orange' | 'purple' | 'teal' | 'yellow' | 'blue';

export const TAG_COLORS: Record<TagColorId, { label: string; hex: string }> = {
  green: { label: 'Baseline', hex: '#22C55E' },
  orange: { label: 'Optional', hex: '#F97316' },
  purple: { label: 'Purple', hex: '#A855F7' },
  teal: { label: 'Teal', hex: '#14B8A6' },
  yellow: { label: 'Yellow', hex: '#EAB308' },
  blue: { label: 'Blue', hex: '#3B82F6' },
};

export interface Feature {
  id: string;
  sourceId?: number;
  objectiveId: string;
  title: string;
  description: string;
  /** Release id (R22, R1, …) */
  column: string;
  tagColor: TagColorId;
  color: string;
  featureGroup: string;
  startDate: string;
  endDate: string;
  /** yes | no — dashed border when yes */
  flag: string;
  /** Shown on card when flag is yes (e.g. At Risk, BLOCKED/DELAYED) */
  flagLabel: string;
  votes: number;
}

export interface Objective {
  id: string;
  title: string;
  /** Expandable "current state" notes for this domain */
  currentState: string;
}

export interface RoadmapState {
  appTitle: string;
  objectives: Objective[];
  features: Feature[];
  timeline: TimelinePayload;
}

let _id = 0;
export function uid(prefix: string) {
  _id += 1;
  return `${prefix}-${_id}`;
}

