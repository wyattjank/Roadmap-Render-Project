import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Board } from './components/Board';
import { FeatureDrawer } from './components/FeatureDrawer';
import { LifecycleRoadmap } from './components/LifecycleRoadmap';
import { Navbar } from './components/Navbar';
import { Sidebar, type AppTab } from './components/Sidebar';
import { VersionsPanel } from './components/VersionsPanel';
import {
  checkAdmin,
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('roadmap');
  const [state, setState] = useState<RoadmapState | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [lifecycleSaveSignal, setLifecycleSaveSignal] = useState(0);
  const [lifecyclePublishSignal, setLifecyclePublishSignal] = useState(0);
  const [lifecycleReloadSignal, setLifecycleReloadSignal] = useState(0);
  const [byObjectives, setByObjectives] = useState(true);
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterColors, setFilterColors] = useState<Set<string>>(new Set());
  const [filterObjectiveIds, setFilterObjectiveIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState('Loading…');
  const [busy, setBusy] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());
  const autoConnectDone = useRef(false);

  const readOnly = !isAdmin;
  const dataSource: DataSource = isAdmin ? 'draft' : 'live';
  const isLifecycle = activeTab === 'lifecycle';

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      return next;
    });
  }, []);

  const loadTimeline = useCallback(
    async (source: DataSource, tokenOverride?: string) => {
      setBusy(true);
      setStatus(source === 'live' ? 'Loading published roadmap…' : 'Loading draft…');
      try {
        const tl = await fetchTimeline(source, tokenOverride);
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
    [],
  );

  const connectAdmin = useCallback(async () => {
    const t = tokenInput.trim();
    if (!t) {
      setStatus('Enter admin token to enable editing.');
      return;
    }
    setToken(t);
    setBusy(true);
    setStatus('Verifying admin access…');
    try {
      const ok = await checkAdmin(t);
      if (!ok) {
        setIsAdmin(false);
        setStatus('Invalid admin token.');
        return;
      }
      setIsAdmin(true);
      await loadTimeline('draft', t);
    } catch (e) {
      setIsAdmin(false);
      setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }, [tokenInput, loadTimeline]);

  const signOutAdmin = useCallback(() => {
    setIsAdmin(false);
    setToken('');
    setTokenInput('');
    sessionStorage.removeItem('roadmap_admin_token');
    setSelectedFeatureId(null);
    void loadTimeline('live');
    setLifecycleReloadSignal((n) => n + 1);
    setStatus('Signed out · viewing published data');
  }, [loadTimeline]);

  useEffect(() => {
    if (autoConnectDone.current) return;
    autoConnectDone.current = true;

    const q = new URLSearchParams(window.location.search).get('token');
    const t = (q || getToken()).trim();
    if (q) setTokenInput(q);

    void (async () => {
      if (t) {
        setToken(t);
        const ok = await checkAdmin(t);
        if (ok) {
          setIsAdmin(true);
          await loadTimeline('draft', t);
          return;
        }
      }
      await loadTimeline('live');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (tab: AppTab) => {
    setActiveTab(tab);
    setSelectedFeatureId(null);
    if (tab === 'lifecycle') {
      setLifecycleReloadSignal((n) => n + 1);
    }
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
    if (!isAdmin) return;
    if (isLifecycle) {
      setLifecycleSaveSignal((n) => n + 1);
      return;
    }
    if (!state) return;
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
    if (!isAdmin) return;
    if (isLifecycle) {
      if (!window.confirm('Publish lifecycle draft to live? Viewers will see these changes.')) return;
      setLifecyclePublishSignal((n) => n + 1);
      return;
    }
    if (!state) return;
    if (!window.confirm('Publish draft to live? All viewers will see this.')) return;
    setBusy(true);
    setStatus('Publishing…');
    try {
      await saveRoadmap(
        stateToCsvRows(state),
        'Pre-publish snapshot',
        stateToDomainMeta(state),
      );
      const res = await publishLive();
      setStatus(`Published to live (${res.version.id})`);
    } catch (e) {
      setStatus(`Publish failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async () => {
    setBusy(true);
    try {
      const blob = await exportExcel(dataSource);
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
        appTitle={isLifecycle ? 'Software Lifecycle' : (state?.appTitle ?? 'Roadmap')}
        onTitleChange={(appTitle) => state && setState({ ...state, appTitle })}
        readOnly={readOnly}
        isAdmin={isAdmin}
        titleReadOnly={readOnly || isLifecycle}
        showRoadmapControls={!isLifecycle}
        onSignOutAdmin={signOutAdmin}
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
        onConnect={connectAdmin}
        onSave={handleSave}
        onPublish={handlePublish}
        onVersions={() => setVersionsOpen(true)}
        onExport={handleExport}
        busy={busy}
        canSave={isAdmin && (isLifecycle || !!state)}
        status={status}
        tokenInput={tokenInput}
        onTokenChange={setTokenInput}
        theme={theme}
        onThemeToggle={toggleTheme}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar tab={activeTab} onTabChange={handleTabChange} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <main className="theme-surface flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {isLifecycle ? (
              <LifecycleRoadmap
                readOnly={readOnly}
                dataSource={dataSource}
                onStatus={setStatus}
                onBusy={setBusy}
                saveSignal={lifecycleSaveSignal}
                publishSignal={lifecyclePublishSignal}
                onSaved={() => setLifecycleReloadSignal((n) => n + 1)}
                onPublished={() => setLifecycleReloadSignal((n) => n + 1)}
                key={`${lifecycleReloadSignal}-${dataSource}`}
              />
            ) : !state ? (
              <div
                className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-sm"
                style={{ color: 'var(--app-text-muted)' }}
              >
                <p className={status.startsWith('Error') ? 'font-medium text-red-500' : ''}>
                  {status}
                </p>
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

      {state && selectedFeature && !isLifecycle && (
        <FeatureDrawer
          feature={selectedFeature}
          timeline={state.timeline}
          readOnly={readOnly}
          onClose={() => setSelectedFeatureId(null)}
          onUpdate={(patch) => updateFeature(selectedFeature.id, patch)}
          onDelete={() => deleteFeature(selectedFeature.id)}
        />
      )}

      {isAdmin && (
        <VersionsPanel
          open={versionsOpen}
          onClose={() => setVersionsOpen(false)}
          kind={isLifecycle ? 'lifecycle' : 'roadmap'}
          onRestored={() => {
            if (isLifecycle) {
              setLifecycleReloadSignal((n) => n + 1);
            } else {
              void loadTimeline('draft');
            }
          }}
        />
      )}
    </div>
  );
}
