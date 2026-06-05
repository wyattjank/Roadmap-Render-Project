export interface TimelineTask {
  id: number;
  domain: string;
  feature: string;
  task: string;
  start: string | null;
  end: string | null;
  notes: string;
  flag: string;
  flag_label: string;
  flag_color: string;
  color: string;
}

export interface TimelineRelease {
  release: string;
  start: string | null;
  end: string | null;
}

export interface TimelineMonth {
  date: string;
  label: string;
}

export interface TimelinePayload {
  x_start: string;
  x_end: string;
  total_days: number;
  today: string;
  months: TimelineMonth[];
  releases: TimelineRelease[];
  tasks: TimelineTask[];
  /** domain name → current state notes (admin) */
  domain_meta?: Record<string, string>;
  source?: string;
}

export interface RoadmapCsvRow {
  domain: string;
  feature: string;
  task: string;
  start_date: string;
  end_date: string;
  notes: string;
  flag: string;
  flag_label: string;
  flag_color: string;
}
