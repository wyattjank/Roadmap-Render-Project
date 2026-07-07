import { ChevronDown, Filter, History, Moon, Search, Sun, Target, Upload } from 'lucide-react';
import type { Theme } from '../lib/theme';
import { FilterDropdown } from './FilterDropdown';

interface Props {
  appTitle: string;
  onTitleChange: (t: string) => void;
  readOnly: boolean;
  isAdmin?: boolean;
  titleReadOnly?: boolean;
  showRoadmapControls?: boolean;
  onSignOutAdmin?: () => void;
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
  isAdmin = false,
  titleReadOnly,
  showRoadmapControls = true,
  onSignOutAdmin,
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
  const titleLocked = titleReadOnly ?? readOnly;
  return (
    <header className="app-navbar theme-header shrink-0 border-b">
      <div className="flex h-11 min-w-0 items-center gap-2 overflow-x-auto px-3 sm:px-4">
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-violet-500 to-orange-400">
            <Target className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          {titleLocked ? (
            <span className="max-w-[120px] truncate text-sm font-semibold sm:max-w-[200px] sm:text-base">
              {appTitle}
            </span>
          ) : (
            <input
              className="w-[120px] shrink-0 border-none bg-transparent text-sm font-semibold outline-none sm:w-[180px] sm:text-base"
              value={appTitle}
              onChange={(e) => onTitleChange(e.target.value)}
            />
          )}
          {readOnly ? (
            <span className="theme-muted hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase sm:inline">
              Live · read-only
            </span>
          ) : (
            <span className="hidden shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700 dark:text-amber-300 sm:inline">
              Admin · editing draft
            </span>
          )}
        </div>

        {!isAdmin ? (
          <div className="flex shrink-0 items-center gap-2">
            <input
              type="password"
              placeholder="Admin token"
              value={tokenInput}
              onChange={(e) => onTokenChange(e.target.value)}
              className="theme-input w-24 rounded-lg px-2 py-1 text-xs sm:w-28"
            />
            <button
              type="button"
              onClick={onConnect}
              disabled={busy}
              className="theme-muted theme-btn-ghost shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium disabled:opacity-50"
            >
              Sign in
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onSignOutAdmin}
            className="theme-btn-ghost shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium"
            style={{ color: 'var(--app-text-muted)' }}
          >
            Sign out
          </button>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onThemeToggle}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            className="theme-btn-ghost flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" style={{ color: 'var(--app-text)' }} />
            ) : (
              <Moon className="h-4 w-4" style={{ color: 'var(--app-text)' }} />
            )}
          </button>

          {showRoadmapControls && (
          <>
          <button
            type="button"
            onClick={onToggleByObjectives}
            className={`theme-btn-ghost hidden shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium sm:flex ${
              byObjectives ? 'bg-blue-500/15' : ''
            }`}
            style={{ color: byObjectives ? 'var(--app-accent)' : 'var(--app-text-muted)' }}
          >
            <Target className="h-3.5 w-3.5" />
            BY OBJECTIVES
          </button>

          <div className="relative shrink-0">
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
              <span className="hidden sm:inline">FILTER</span>
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

          <div className="relative hidden shrink-0 md:block">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
              style={{ color: 'var(--app-text-muted)' }}
            />
            <input
              type="search"
              placeholder="Search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="theme-input w-32 rounded-lg py-1.5 pl-8 pr-2 text-xs lg:w-40"
            />
          </div>
          </>
          )}

          <button
            type="button"
            onClick={onExport}
            disabled={!canSave || busy}
            className="theme-btn-ghost shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium disabled:opacity-50"
            style={{ color: 'var(--app-text-muted)' }}
          >
            Excel
          </button>

          {!readOnly && isAdmin && (
            <>
              <button
                type="button"
                onClick={onVersions}
                disabled={!canSave || busy}
                title="Version history"
                className="theme-btn-ghost hidden shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium disabled:opacity-50 sm:flex"
                style={{ color: 'var(--app-text-muted)' }}
              >
                <History className="h-3.5 w-3.5" />
                History
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={!canSave || busy}
                className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-200"
              >
                Save
              </button>
              <button
                type="button"
                onClick={onPublish}
                disabled={!canSave || busy}
                className="flex shrink-0 items-center gap-1 rounded-lg bg-blue-500 px-2 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
              >
                <Upload className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Publish</span>
              </button>
            </>
          )}
        </div>
      </div>

      <p
        className={`truncate px-3 pb-1.5 text-[11px] sm:px-4 ${
          status.startsWith('Error') ? 'text-red-500' : ''
        }`}
        style={status.startsWith('Error') ? undefined : { color: 'var(--app-text-muted)' }}
      >
        {status}
      </p>
    </header>
  );
}
