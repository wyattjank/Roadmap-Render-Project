import type { TimelineMonth, TimelineRelease } from './types';

export interface MonthCell {
  date: string;
  label: string;
  release: string | null;
}

export interface ReleaseColumn {
  id: string;
  label: string;
  start: string;
  end: string;
  monthSpan: number;
}

function parseDate(iso: string): Date {
  return new Date(iso + 'T12:00:00');
}

function monthEnd(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 12);
}

function overlapsMonth(monthStart: Date, release: TimelineRelease): boolean {
  if (!release.start || !release.end) return false;
  const rs = parseDate(release.start);
  const re = parseDate(release.end);
  const me = monthEnd(monthStart);
  return monthStart <= re && rs <= me;
}

/** Excel row 3: one release label per month column (first matching release). */
export function buildMonthCells(
  months: TimelineMonth[],
  releases: TimelineRelease[],
): MonthCell[] {
  return months.map((m) => {
    const monthStart = parseDate(m.date);
    let release: string | null = null;
    for (const rel of releases) {
      if (overlapsMonth(monthStart, rel)) {
        release = rel.release;
        break;
      }
    }
    return { date: m.date, label: m.label, release };
  });
}

export function buildReleaseColumns(
  months: TimelineMonth[],
  releases: TimelineRelease[],
): ReleaseColumn[] {
  const cells = buildMonthCells(months, releases);
  return releases.map((rel) => {
    const span = cells.filter((c) => c.release === rel.release).length;
    return {
      id: rel.release,
      label: rel.release,
      start: rel.start || '',
      end: rel.end || '',
      monthSpan: Math.max(span, 1),
    };
  });
}

export function overlapsRange(
  taskStart: string,
  taskEnd: string,
  relStart: string,
  relEnd: string,
): boolean {
  if (!taskStart || !taskEnd || !relStart || !relEnd) return false;
  const ts = parseDate(taskStart);
  const te = parseDate(taskEnd);
  const rs = parseDate(relStart);
  const re = parseDate(relEnd);
  return ts <= re && rs <= te;
}

/** All release columns whose window overlaps the task dates (matches Excel bar span). */
export function overlappingReleasesForTask(
  start: string | null,
  end: string | null,
  releases: TimelineRelease[],
): string[] {
  if (!start || !end || !releases.length) return [];
  const hits = releases
    .filter((rel) => overlapsRange(start, end, rel.start || '', rel.end || ''))
    .map((rel) => rel.release);
  return hits;
}

/** First overlapping release (anchor for drawer / new tasks). */
export function primaryReleaseForTask(
  start: string | null,
  end: string | null,
  releases: TimelineRelease[],
): string {
  const cols = overlappingReleasesForTask(start, end, releases);
  if (cols.length) return cols[0];
  if (!releases.length) return 'unscheduled';
  return releases[0].release;
}

export function releaseById(
  releases: TimelineRelease[],
  id: string,
): TimelineRelease | undefined {
  return releases.find((r) => r.release === id);
}

export function releaseGridTemplateColumns(
  releaseColumns: ReleaseColumn[],
  colWidth: (col: ReleaseColumn) => number,
): string {
  return releaseColumns.map((c) => `${colWidth(c)}px`).join(' ');
}

/** Grid placement: one bar from first to last overlapping release column. */
export function taskGridPlacement(
  startDate: string,
  endDate: string,
  fallbackColumn: string,
  releaseColumns: ReleaseColumn[],
  releases: TimelineRelease[],
): { colStart: number; colSpan: number } {
  const colIds = releaseColumns.map((c) => c.id);
  const overlapping = overlappingReleasesForTask(startDate, endDate, releases);

  let indices: number[];
  if (overlapping.length) {
    indices = overlapping.map((id) => colIds.indexOf(id)).filter((i) => i >= 0);
  } else {
    const i = colIds.indexOf(fallbackColumn);
    indices = i >= 0 ? [i] : [0];
  }

  if (!indices.length) return { colStart: 1, colSpan: 1 };
  const min = Math.min(...indices);
  const max = Math.max(...indices);
  return { colStart: min + 1, colSpan: max - min + 1 };
}
