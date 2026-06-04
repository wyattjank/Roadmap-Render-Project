import type { MonthCell, ReleaseColumn } from '../lib/releases';

import {

  monthGridTemplateColumns,

  releaseMonthGridPlacement,

  MONTH_COLUMN_WIDTH,

} from '../lib/releases';



interface Props {

  monthCells: MonthCell[];

  releaseColumns: ReleaseColumn[];

  today: string;

}



const GUTTER = 32;



export function ReleaseTimelineHeader({ monthCells, releaseColumns, today }: Props) {

  const todayMonth = today.slice(0, 7);

  const gridCols = monthGridTemplateColumns(monthCells.length, GUTTER, MONTH_COLUMN_WIDTH);



  return (

    <div className="theme-header border-b" style={{ borderColor: 'var(--app-border)' }}>

      <div

        className="border-b"

        style={{

          display: 'grid',

          gridTemplateColumns: gridCols,

          borderColor: 'var(--app-border)',

        }}

      >

        <div className="min-h-[28px]" />

        {monthCells.map((m) => {

          const isToday = m.date.startsWith(todayMonth);

          return (

            <div

              key={m.date}

              className="flex items-center justify-center border-r py-1.5 text-center text-[10px] font-semibold"

              style={{

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



      <div

        className="theme-grid-bg py-2"

        style={{

          display: 'grid',

          gridTemplateColumns: gridCols,

          rowGap: 4,

        }}

      >

        <div />

        {releaseColumns.map((col) => {

          const { colStart, colSpan } = releaseMonthGridPlacement(monthCells, col.id);

          return (

            <div

              key={col.id}

              className="theme-release-pill mx-0.5 flex flex-col items-center justify-center rounded-lg px-2 py-1.5 shadow-sm"

              style={{ gridColumn: `${colStart + 1} / span ${colSpan}` }}

            >

              <span className="text-sm font-bold" style={{ color: 'var(--app-accent)' }}>

                {col.label}

              </span>

              <span className="text-[10px]" style={{ color: 'var(--app-text-muted)' }}>

                {col.start.slice(0, 7)} – {col.end.slice(0, 7)}

              </span>

            </div>

          );

        })}

      </div>



      <div

        className="flex items-center gap-3 border-t px-3 py-1 text-[10px]"

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




