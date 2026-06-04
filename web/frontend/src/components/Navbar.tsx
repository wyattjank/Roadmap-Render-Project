import { ChevronDown, Filter, History, Moon, Search, Sun, Target, Upload } from 'lucide-react';
import type { Theme } from '../lib/theme';
import { FilterDropdown } from './FilterDropdown';

interface Props {
  appTitle: string;
  onTitleChange: (t: string) => void;
  readOnly: boolean;
  byObjectives: boolean;
  onToggleByObjectives: () => void;
  search: string;
  onSearchChange: (q: string) => void;
  filterOpen: boolean;
  onFilterToggle: () => void;
  onFilterClose: () => void;
  filterColors: Set<string>;
  filterObjectiveIds: Set<string>;
  onToggleFilterColor: (c: string) => void;
  onToggleFilterObjective: (id: string) => void;
  objectives: { id: string; title: string }[];
  onConnect: () => void;
  onSave: () => void;
  onPublish: () => void;
  onVersions: () => void;
  onExport: () => void;
  busy: boolean;
  canSave: boolean;
  status: string;
  tokenInput: string;
  onTokenChange: (t: string) => void;
  theme: Theme;
  onThemeToggle: () => void;
}

export function Navbar({
  appTitle,
  onTitleChange,
  readOnly,
  byObjectives,
  onToggleByObjectives,
  search,
  onSearchChange,
  filterOpen,
  onFilterToggle,
  onFilterClose,
  filterColors,
  filterObjectiveIds,
  onToggleFilterColor,
  onToggleFilterObjective,
  objectives,
  onConnect,
  onSave,
  onPublish,
  onVersions,
  onExport,
  busy,
  canSave,
  status,
  tokenInput,
  onTokenChange,
  theme,
  onThemeToggle,
}: Props) {
  return (
    <header className="theme-header flex h-14 shrink-0 flex-wrap items-center gap-2 border-b px-3 sm:gap-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-violet-500 to-orange-400">
          <Target className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        {readOnly ? (
          <span className="truncate text-sm font-semibold sm:text-base">{appTitle}</span>
        ) : (
          <input
            className="min-w-0 max-w-[140px] truncate border-none bg-transparent text-sm font-semibold outline-none sm:max-w-[220px] sm:text-base"
            value={appTitle}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        )}
        {readOnly && (
          <span className="theme-muted rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase">
            Live · read-only
          </span>
        )}
      </div>

      {!readOnly && (
        <>
          <input
            type="password"
            placeholder="Token"
            value={tokenInput}
            onChange={(e) => onTokenChange(e.target.value)}
            className="theme-input w-24 rounded-lg px-2 py-1 text-xs sm:w-28"
          />
          <button
            type="button"
            onClick={onConnect}
            disabled={busy}
            className="theme-muted theme-btn-ghost rounded-lg px-2 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            Connect
          </button>
        </>
      )}

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onThemeToggle}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          className="theme-btn-ghost flex h-8 w-8 items-center justify-center rounded-lg"
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" style={{ color: 'var(--app-text)' }} />
          ) : (
            <Moon className="h-4 w-4" style={{ color: 'var(--app-text)' }} />
          )}
        </button>

        <button
          type="button"
          onClick={onToggleByObjectives}
          className={`theme-btn-ghost hidden items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium sm:flex ${
            byObjectives ? 'bg-blue-500/15' : ''
          }`}
          style={{ color: byObjectives ? 'var(--app-accent)' : 'var(--app-text-muted)' }}
        >
          <Target className="h-3.5 w-3.5" />
          BY OBJECTIVES
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={onFilterToggle}
            className={`theme-btn-ghost flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium ${
              filterOpen || filterColors.size || filterObjectiveIds.size ? 'bg-blue-500/15' : ''
            }`}
            style={{
              color:
                filterOpen || filterColors.size || filterObjectiveIds.size
                  ? 'var(--app-accent)'
                  : 'var(--app-text-muted)',
            }}
          >
            <Filter className="h-3.5 w-3.5" />
            FILTER
          </button>
          {filterOpen && (
            <FilterDropdown
              filterColors={filterColors}
              filterObjectiveIds={filterObjectiveIds}
              objectives={objectives}
              onToggleColor={onToggleFilterColor}
              onToggleObjective={onToggleFilterObjective}
              onClose={onFilterClose}
            />
          )}
        </div>

        <div className="relative hidden md:block">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
            style={{ color: 'var(--app-text-muted)' }}
          />
          <input
            type="search"
            placeholder="Search tasks"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="theme-input w-44 rounded-lg py-1.5 pl-8 pr-2 text-xs lg:w-52"
          />
        </div>

        <button
          type="button"
          onClick={onExport}
          disabled={!canSave || busy}
          className="theme-btn-ghost rounded-lg px-2 py-1.5 text-xs font-medium disabled:opacity-50"
          style={{ color: 'var(--app-text-muted)' }}
        >
          Excel
        </button>

        {!readOnly && (
          <>
            <button
              type="button"
              onClick={onVersions}
              disabled={!canSave || busy}
              title="Version history"
              className="theme-btn-ghost flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium disabled:opacity-50"
              style={{ color: 'var(--app-text-muted)' }}
            >
              <History className="h-3.5 w-3.5" />
              History
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={!canSave || busy}
              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            >
              Save draft
            </button>
            <button
              type="button"
              onClick={onPublish}
              disabled={!canSave || busy}
              className="flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              Publish
            </button>
          </>
        )}
      </div>

      <p
        className={`w-full truncate text-[11px] sm:w-auto sm:flex-1 ${
          status.startsWith('Error') ? 'text-red-500' : ''
        }`}
        style={status.startsWith('Error') ? undefined : { color: 'var(--app-text-muted)' }}
      >
        {status}
      </p>
    </header>
  );
}
