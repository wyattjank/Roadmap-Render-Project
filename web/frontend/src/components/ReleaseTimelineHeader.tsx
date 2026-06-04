import type { MonthCell, ReleaseColumn } from '../lib/releases';

interface Props {
  monthCells: MonthCell[];
  releaseColumns: ReleaseColumn[];
  gridTemplateColumns: string;
  today: string;
}

const MONTH_W = 72;
const GUTTER = 32;

export function ReleaseTimelineHeader({
  monthCells,
  releaseColumns,
  gridTemplateColumns,
  today,
}: Props) {
  const totalMonthWidth = monthCells.length * MONTH_W;
  const boardMinWidth =
    releaseColumns.reduce((sum, c) => sum + Math.max(c.monthSpan * MONTH_W - 8, 140), 0) +
    (releaseColumns.length - 1) * 8 +
    16;
  const todayMonth = today.slice(0, 7);
  const minWidth = Math.max(totalMonthWidth + GUTTER, boardMinWidth + GUTTER);

  return (
    <div className="theme-header border-b" style={{ borderColor: 'var(--app-border)', minWidth }}>
      <div className="flex border-b" style={{ borderColor: 'var(--app-border)' }}>
        <div className="w-8 shrink-0" />
        <div className="flex">
          {monthCells.map((m) => {
            const isToday = m.date.startsWith(todayMonth);
            return (
              <div
                key={m.date}
                className="flex shrink-0 items-center justify-center border-r py-1.5 text-center text-[10px] font-semibold"
                style={{
                  width: MONTH_W,
                  borderColor: 'var(--app-border)',
                  color: isToday ? '#b91c1c' : 'var(--app-text-muted)',
                  background: isToday ? 'var(--app-month-today)' : undefined,
                }}
                title={m.date}
              >
                {m.label}
              </div>
            );
          })}
        </div>
      </div>

      <div className="theme-grid-bg flex py-2 pl-2">
        <div className="w-8 shrink-0" />
        <div
          className="gap-2"
          style={{
            display: 'grid',
            gridTemplateColumns,
            columnGap: 8,
          }}
        >
          {releaseColumns.map((col) => (
            <div
              key={col.id}
              className="theme-release-pill flex flex-col items-center justify-center rounded-lg px-2 py-1.5 shadow-sm"
            >
              <span className="text-sm font-bold" style={{ color: 'var(--app-accent)' }}>
                {col.label}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--app-text-muted)' }}>
                {col.start.slice(0, 7)} – {col.end.slice(0, 7)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="flex items-center gap-3 border-t px-10 py-1 text-[10px]"
        style={{ borderColor: 'var(--app-border)', color: 'var(--app-text-muted)' }}
      >
        <span className="flex items-center gap-1.5">
          <span
            className="theme-task-solid inline-block h-3 w-8 rounded-sm"
            style={{ background: 'var(--app-task-bg)' }}
          />
          Solid = committed
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="theme-task-dashed inline-block h-3 w-8 rounded-sm"
            style={{ background: 'var(--app-task-bg)' }}
          />
          Dashed = flag yes (custom label on card)
        </span>
      </div>
    </div>
  );
}

export const MONTH_COLUMN_WIDTH = MONTH_W;
