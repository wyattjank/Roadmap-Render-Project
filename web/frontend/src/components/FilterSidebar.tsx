import { motion } from 'framer-motion';
import type { TaskStatus } from '../lib/types';
import { STATUS_LABELS } from '../lib/status';

const ALL: TaskStatus[] = ['planned', 'in_progress', 'done'];

interface Props {
  active: Set<TaskStatus>;
  onToggle: (s: TaskStatus) => void;
  taskCount: number;
  today: string;
}

export function FilterSidebar({ active, onToggle, taskCount, today }: Props) {
  return (
    <motion.aside
      className="sidebar"
      initial={{ x: -24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
    >
      <h2>Filters</h2>
      <p className="sidebar-meta">Today: {today}</p>
      <p className="sidebar-meta">{taskCount} tasks visible</p>
      <ul className="filter-list">
        {ALL.map((s) => (
          <li key={s}>
            <label className={`filter-chip status-${s}`}>
              <input
                type="checkbox"
                checked={active.has(s)}
                onChange={() => onToggle(s)}
              />
              {STATUS_LABELS[s]}
            </label>
          </li>
        ))}
      </ul>
      <div className="sidebar-legend">
        <h3>Flags</h3>
        <span className="legend-item baseline">Baseline</span>
        <span className="legend-item optional">Optional</span>
      </div>
      <p className="sidebar-hint">
        Drag canvas to pan · Scroll to zoom · Drag nodes (snap to grid) · Click task to expand
      </p>
    </motion.aside>
  );
}
