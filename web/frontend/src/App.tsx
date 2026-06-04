import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Board } from './components/Board';
import { FeatureDrawer } from './components/FeatureDrawer';
import { Navbar } from './components/Navbar';
import { Sidebar, type ViewMode } from './components/Sidebar';
import { VersionsPanel } from './components/VersionsPanel';
import {
  exportExcel,
  fetchTimeline,
  getToken,
  publishLive,
  saveRoadmap,
  setToken,
  type DataSource,
} from './lib/api';
import {
  newFeatureFromRelease,
  newObjective,
  applyObjectivePatch,
  domainId,
  stateToCsvRows,
  stateToDomainMeta,
  timelineToState,
} from './lib/map-timeline';
import { TAG_COLORS, type RoadmapState, type TagColorId } from './lib/roadmap-data';
import { overlappingReleasesForTask, primaryReleaseForTask } from './lib/releases';
import { applyTheme, getStoredTheme, type Theme } from './lib/theme';

export default function App() {
  const [tokenInput, setTokenInput] = useState(getToken());
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [state, setState] = useState<RoadmapState | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [byObjectives, setByObjectives] = useState(true);
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterColors, setFilterColors] = useState<Set<string>>(new Set());
  const [filterObjectiveIds, setFilterObjectiveIds] = useState<Set<string>>(new Set());
  const initialToken = getToken();
  const [status, setStatus] = useState(
    initialToken
      ? 'Click Connect or wait…'
      : 'Enter admin token (e.g. dev-admin) and click Connect.',
  );
  const [busy, setBusy] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());
  const autoConnectDone = useRef(false);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      return next;
    });
  }, []);

  const readOnly = viewMode === 'readonly';
  const dataSource: DataSource = readOnly ? 'live' : 'draft';

  const loadTimeline = useCallback(
    async (source: DataSource, tokenOverride?: string) => {
      const t = (tokenOverride ?? tokenInput).trim();
      if (!t) {
        setStatus('Enter admin token (e.g. dev-admin) and click Connect.');
        return;
      }
      setToken(t);
      setTokenInput(t);
      setBusy(true);
      setStatus(source === 'live' ? 'Loading published view…' : 'Loading draft…');
      try {
        const tl = await fetchTimeline(source, t);
        setState(timelineToState(tl));
        const label = source === 'live' ? 'Published (live)' : 'Draft';
        setStatus(`Loaded ${tl.tasks.length} tasks · ${label}`);
      } catch (e) {
        setState(null);
        setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setBusy(false);
      }
    },
    [tokenInput],
  );

  const connect = useCallback(
    () => loadTimeline(dataSource),
    [loadTimeline, dataSource],
  );

  useEffect(() => {
    if (autoConnectDone.current) return;
    const q = new URLSearchParams(window.location.search).get('token');
    const t = (q || getToken()).trim();
    if (q) setTokenInput(q);
    if (!t) return;
    autoConnectDone.current = true;
    void loadTimeline('draft', t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setSelectedFeatureId(null);
    void loadTimeline(mode === 'readonly' ? 'live' : 'draft');
  };

  const selectedFeature = useMemo(
    () => state?.features.find((f) => f.id === selectedFeatureId) ?? null,
    [state, selectedFeatureId],
  );

  const updateFeature = useCallback((id: string, patch: Partial<import('./lib/roadmap-data').Feature>) => {
    if (readOnly) return;
    setState((s) => {
      if (!s) return s;
      return {
        ...s,
        features: s.features.map((f) => {
          if (f.id !== id) return f;
          const next = { ...f, ...patch };
          if ((patch.startDate || patch.endDate) && s.timeline && !patch.column) {
            const cols = overlappingReleasesForTask(
              next.startDate,
              next.endDate,
              s.timeline.releases,
            );
            next.column = cols[0] ?? primaryReleaseForTask(
              next.startDate,
              next.endDate,
              s.timeline.releases,
            );
          }
          return next;
        }),
      };
    });
  }, [readOnly]);

  const deleteFeature = useCallback((id: string) => {
    if (readOnly) return;
    setState((s) => {
      if (!s) return s;
      return { ...s, features: s.features.filter((f) => f.id !== id) };
    });
    setSelectedFeatureId(null);
  }, [readOnly]);

  const addFeature = useCallback(
    (
      objectiveId: string,
      title: string,
      tagColor: TagColorId,
      column: string,
      featureGroup: string,
    ) => {
      if (readOnly) return;
      setState((s) => {
        if (!s) return s;
        return {
          ...s,
          features: [
            ...s.features,
            newFeatureFromRelease(
              objectiveId,
              title,
              featureGroup,
              tagColor,
              column,
              s.timeline.releases,
              TAG_COLORS[tagColor].hex,
            ),
          ],
        };
      });
    },
    [readOnly],
  );

  const addObjective = useCallback(() => {
    if (readOnly || !state) return;
    const title = window.prompt('Domain / objective name');
    if (!title?.trim()) return;
    setState((s) => {
      if (!s) return s;
      return { ...s, objectives: [...s.objectives, newObjective(title.trim())] };
    });
  }, [readOnly, state]);

  const updateObjective = useCallback(
    (objectiveId: string, patch: { title?: string; currentState?: string }) => {
      if (readOnly) return;
      setState((s) => (s ? applyObjectivePatch(s, objectiveId, patch) : s));
      if (patch.title?.trim()) {
        const newId = domainId(patch.title.trim());
        if (newId !== objectiveId) {
          setCollapsedIds((prev) => {
            const next = new Set(prev);
            if (next.has(objectiveId)) {
              next.delete(objectiveId);
              next.add(newId);
            }
            return next;
          });
        }
      }
    },
    [readOnly],
  );

  const deleteObjective = useCallback(
    (objectiveId: string) => {
      if (readOnly) return;
      setSelectedFeatureId((sel) => {
        const feat = state?.features.find((f) => f.id === sel);
        return feat?.objectiveId === objectiveId ? null : sel;
      });
      setState((s) => {
        if (!s) return s;
        return {
          ...s,
          objectives: s.objectives.filter((o) => o.id !== objectiveId),
          features: s.features.filter((f) => f.objectiveId !== objectiveId),
        };
      });
      setCollapsedIds((prev) => {
        const next = new Set(prev);
        next.delete(objectiveId);
        return next;
      });
    },
    [readOnly, state?.features],
  );

  const handleSave = async () => {
    if (!state || readOnly) return;
    setBusy(true);
    setStatus('Saving draft…');
    try {
      const res = await saveRoadmap(
        stateToCsvRows(state),
        'Draft saved',
        stateToDomainMeta(state),
      );
      setState(timelineToState(res.timeline));
      setStatus(`Draft saved (${res.saved} tasks) · version ${res.version.id}`);
    } catch (e) {
      setStatus(`Save failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async () => {
    if (!state || readOnly) return;
    if (!window.confirm('Publish draft to live? Customers/read-only view will see this.')) {
      return;
    }
    setBusy(true);
    setStatus('Publishing…');
    try {
      await saveRoadmap(
        stateToCsvRows(state),
        'Pre-publish snapshot',
        stateToDomainMeta(state),
      );
      const res = await publishLive();
      setStatus(`Published to live (${res.version.id}). Switch to Standard view to preview.`);
    } catch (e) {
      setStatus(`Publish failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async () => {
    setBusy(true);
    try {
      const blob = await exportExcel(readOnly ? 'live' : 'draft');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'roadmap.xlsx';
      a.click();
      URL.revokeObjectURL(a.href);
      setStatus('Excel downloaded.');
    } catch (e) {
      setStatus(`Export failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="theme-surface flex h-full flex-col overflow-hidden">
      <Navbar
        appTitle={state?.appTitle ?? 'Roadmap'}
        onTitleChange={(appTitle) => state && setState({ ...state, appTitle })}
        readOnly={readOnly}
        byObjectives={byObjectives}
        onToggleByObjectives={() => setByObjectives((v) => !v)}
        search={search}
        onSearchChange={setSearch}
        filterOpen={filterOpen}
        onFilterToggle={() => setFilterOpen((v) => !v)}
        onFilterClose={() => setFilterOpen(false)}
        filterColors={filterColors}
        filterObjectiveIds={filterObjectiveIds}
        onToggleFilterColor={(c) =>
          setFilterColors((prev) => {
            const next = new Set(prev);
            if (next.has(c)) next.delete(c);
            else next.add(c);
            return next;
          })
        }
        onToggleFilterObjective={(id) =>
          setFilterObjectiveIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
          })
        }
        objectives={state?.objectives ?? []}
        onConnect={connect}
        onSave={handleSave}
        onPublish={handlePublish}
        onVersions={() => setVersionsOpen(true)}
        onExport={handleExport}
        busy={busy}
        canSave={!!state}
        status={status}
        tokenInput={tokenInput}
        onTokenChange={setTokenInput}
        theme={theme}
        onThemeToggle={toggleTheme}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar mode={viewMode} onModeChange={handleModeChange} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <main className="theme-surface flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {!state ? (
              <div
                className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-sm"
                style={{ color: 'var(--app-text-muted)' }}
              >
                <p className={status.startsWith('Error') ? 'font-medium text-red-500' : ''}>
                  {status}
                </p>
                {!readOnly && (
                  <>
                    <p className="text-xs">
                      Admin: set{' '}
                      <code className="theme-muted rounded px-1">ROADMAP_ADMIN_TOKEN</code> and open{' '}
                      <code className="theme-muted rounded px-1">
                        http://127.0.0.1:8080/?token=dev-admin
                      </code>
                    </p>
                    <button
                      type="button"
                      onClick={() => connect()}
                      className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                    >
                      Connect
                    </button>
                  </>
                )}
              </div>
            ) : byObjectives ? (
              <Board
                timeline={state.timeline}
                objectives={state.objectives}
                features={state.features}
                collapsedIds={collapsedIds}
                search={search}
                filterColors={filterColors}
                filterObjectiveIds={filterObjectiveIds}
                onToggleCollapse={toggleCollapse}
                onFeatureClick={setSelectedFeatureId}
                onAddFeature={addFeature}
                onAddObjective={addObjective}
                onDeleteObjective={deleteObjective}
                onUpdateObjective={updateObjective}
                readOnly={readOnly}
              />
            ) : (
              <div
                className="flex flex-1 items-center justify-center text-sm"
                style={{ color: 'var(--app-text-muted)' }}
              >
                Enable <strong className="mx-1">By Objectives</strong> to view the board.
              </div>
            )}
          </main>
        </div>
      </div>

      {state && selectedFeature && (
        <FeatureDrawer
          feature={selectedFeature}
          timeline={state.timeline}
          readOnly={readOnly}
          onClose={() => setSelectedFeatureId(null)}
          onUpdate={(patch) => updateFeature(selectedFeature.id, patch)}
          onDelete={() => deleteFeature(selectedFeature.id)}
        />
      )}

      <VersionsPanel
        open={versionsOpen}
        onClose={() => setVersionsOpen(false)}
        onRestored={() => void loadTimeline('draft')}
      />
    </div>
  );
}
