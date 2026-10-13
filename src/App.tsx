import { useEffect, useMemo, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { demoProvider } from "./data/demoProvider";
import type { PipelineStage, WorkflowIssue, WorkflowSnapshot } from "./types";

type IconName =
  | "grid"
  | "flow"
  | "archive"
  | "settings"
  | "search"
  | "play"
  | "pause"
  | "replay"
  | "close"
  | "arrow"
  | "clock"
  | "check"
  | "alert"
  | "external"
  | "chevron"
  | "spark";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const shared = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  const shapes: Record<IconName, ReactNode> = {
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
    flow: <><rect x="3.5" y="3.5" width="6" height="6" rx="1.5" /><rect x="14.5" y="14.5" width="6" height="6" rx="1.5" /><path d="M9.5 6.5h5a2 2 0 0 1 2 2v6" /><path d="m13.5 12.5 3 3 3-3" /></>,
    archive: <><path d="M4 7h16v13H4z" /><path d="M3 4h18v3H3zM9 11h6" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.1.9-1.5 2.6-1.4-.6a7.8 7.8 0 0 1-1.7 1l-.2 1.5h-3l-.2-1.5a7.8 7.8 0 0 1-1.7-1l-1.4.6L6 16l1.1-.9a7 7 0 0 1 0-2.1L6 12l1.5-2.6 1.4.6a7.8 7.8 0 0 1 1.7-1l.2-1.5h3l.2 1.5a7.8 7.8 0 0 1 1.7 1l1.4-.6 1.5 2.6-1.1.9a7 7 0 0 1-.1 2.1Z" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4.5 4.5" /></>,
    play: <path d="m8 5 11 7-11 7z" fill="currentColor" stroke="none" />,
    pause: <><path d="M8 5v14M16 5v14" strokeWidth="3" /></>,
    replay: <><path d="M20 7v5h-5" /><path d="M19 12a7 7 0 1 1-2-5l3 5" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    alert: <><path d="M12 3 2.9 19h18.2L12 3Z" /><path d="M12 9v4m0 3h.01" /></>,
    external: <><path d="M14 4h6v6" /><path d="m20 4-9 9" /><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    spark: <><path d="m12 3 1.5 6.5L20 12l-6.5 1.5L12 20l-1.5-6.5L4 12l6.5-2.5L12 3Z" /><path d="m19 3 .7 2.3L22 6l-2.3.7L19 9l-.7-2.3L16 6l2.3-.7L19 3Z" /></>,
  };
  return <svg {...shared}>{shapes[name]}</svg>;
}

interface NodeSpec {
  id: PipelineStage;
  x: number;
  y: number;
  title: string;
  subtitle: string;
  accent: string;
  tag?: string;
}

const nodes: NodeSpec[] = [
  { id: "intake", x: 45, y: 288, title: "Issue intake", subtitle: "New · retry · requested", accent: "blue" },
  { id: "triage", x: 280, y: 288, title: "Triage", subtitle: "Choose a resolution", accent: "violet" },
  { id: "backport", x: 530, y: 76, title: "Backport", subtitle: "Apply upstream patch", accent: "blue" },
  { id: "rebase", x: 530, y: 288, title: "Rebase", subtitle: "Move to upstream version", accent: "violet" },
  { id: "rebuild", x: 530, y: 500, title: "Rebuild", subtitle: "Build with updated deps", accent: "teal" },
  { id: "build", x: 780, y: 288, title: "Build + merge request", subtitle: "Copr validation · GitLab MR", accent: "blue" },
  { id: "consolidation", x: 1020, y: 288, title: "MR consolidation", subtitle: "If eligible · combine changes", accent: "violet" },
  { id: "qe", x: 1260, y: 288, title: "QE + release checks", subtitle: "Testing · errata verification", accent: "amber" },
  { id: "complete", x: 1500, y: 288, title: "Merge & closeout", subtitle: "Merged · release ready", accent: "green" },
  { id: "retry", x: 780, y: 600, title: "Retry queue", subtitle: "Recoverable failure", accent: "amber" },
  { id: "attention", x: 280, y: 520, title: "Needs attention", subtitle: "Maintainer input required", accent: "red" },
];

const edges = [
  { from: "intake", to: "triage", path: "M235 349 L280 349" },
  { from: "triage", to: "backport", path: "M470 320 C505 320 500 136 530 136" },
  { from: "triage", to: "rebase", path: "M470 349 L530 349" },
  { from: "triage", to: "rebuild", path: "M470 378 C505 378 500 560 530 560" },
  { from: "backport", to: "build", path: "M720 136 C755 136 745 349 780 349" },
  { from: "rebase", to: "build", path: "M720 349 L780 349" },
  { from: "rebuild", to: "build", path: "M720 560 C755 560 745 349 780 349" },
  { from: "build", to: "consolidation", path: "M970 349 L1020 349" },
  { from: "consolidation", to: "qe", path: "M1210 349 L1260 349" },
  { from: "qe", to: "complete", path: "M1450 349 L1500 349" },
  { from: "build", to: "retry", path: "M875 410 C875 470 875 540 875 600" },
  { from: "triage", to: "attention", path: "M375 410 L375 520" },
  { from: "build", to: "qe", path: "M970 315 C1000 250 1020 218 1060 218 L1210 218 C1240 218 1260 248 1260 288", optional: true },
  { from: "retry", to: "backport", path: "M875 722 C875 760 842 765 810 765 L22 765 C10 765 10 740 10 720 L10 136 C10 115 27 112 45 112 L530 112 L530 136", retry: true },
];

const stageLabels: Record<PipelineStage, string> = {
  intake: "Intake",
  triage: "Triage",
  backport: "Backport",
  rebase: "Rebase",
  rebuild: "Rebuild",
  build: "Build + MR",
  consolidation: "Consolidation",
  qe: "QE checks",
  complete: "Complete",
  retry: "Retry",
  attention: "Needs attention",
};

const filters = [
  { id: "all", label: "All issues" },
  { id: "active", label: "In flight" },
  { id: "attention", label: "Needs attention" },
  { id: "complete", label: "Completed" },
] as const;

type IssueFilter = (typeof filters)[number]["id"];

function stateLabel(issue: WorkflowIssue): string {
  if (issue.state === "complete") return "Complete";
  if (issue.state === "attention") return "Action needed";
  if (issue.state === "retry") return "Retrying";
  if (issue.stage === "qe") return "In verification";
  if (issue.stage === "build") return "Building";
  if (issue.state === "queued") return "Queued";
  return "In progress";
}

function routeLabel(route: WorkflowIssue["route"]): string {
  return route === "unassigned" ? "Triage" : route[0].toUpperCase() + route.slice(1);
}

function IconButton({
  title,
  onClick,
  icon,
  active = false,
}: {
  title: string;
  onClick: () => void;
  icon: IconName;
  active?: boolean;
}) {
  return (
    <button
      className={`rail-button${active ? " rail-button--active" : ""}`}
      type="button"
      aria-label={title}
      title={title}
      onClick={onClick}
    >
      <Icon name={icon} size={19} />
    </button>
  );
}

function StatusPill({ issue }: { issue: WorkflowIssue }) {
  return <span className={`status-pill status-pill--${issue.state}`}><span />{stateLabel(issue)}</span>;
}

function GraphNode({
  spec,
  issues,
  onSelect,
}: {
  spec: NodeSpec;
  issues: WorkflowIssue[];
  onSelect: (key: string) => void;
}) {
  const width = 190;
  const height = 122;
  const matches = issues.filter((issue) => issue.stage === spec.id);
  return (
    <g className={`graph-node graph-node--${spec.accent}`}>
      <rect x={spec.x} y={spec.y} width={width} height={height} rx="14" className="node-card" />
      <circle cx={spec.x + 19} cy={spec.y + 22} r="4" className="node-dot" />
      <text x={spec.x + 31} y={spec.y + 26} className="node-title">{spec.title}</text>
      <text x={spec.x + 16} y={spec.y + 49} className="node-subtitle">{spec.subtitle}</text>
      {spec.tag && <text x={spec.x + width - 15} y={spec.y + 20} textAnchor="end" className="node-tag">{spec.tag}</text>}
      <rect x={spec.x + 15} y={spec.y + 62} width={width - 30} height="1" className="node-divider" />
      {matches.length ? (
        matches.slice(0, 2).map((issue, index) => {
          const tokenY = spec.y + 70 + index * 23;
          return (
            <g
              key={issue.key}
              className={`issue-token issue-token--${issue.state}`}
              role="button"
              tabIndex={0}
              aria-label={`${issue.key}, ${stateLabel(issue)}. Open issue details.`}
              onClick={() => onSelect(issue.key)}
              onKeyDown={(event: KeyboardEvent<SVGGElement>) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(issue.key);
                }
              }}
            >
              <rect x={spec.x + 14} y={tokenY} width={width - 28} height="20" rx="6" />
              <text x={spec.x + 24} y={tokenY + 14}>{issue.key}</text>
              <circle cx={spec.x + width - 25} cy={tokenY + 10} r="3" />
            </g>
          );
        })
      ) : (
        <text x={spec.x + 17} y={spec.y + 83} className="node-empty">No issues at this step</text>
      )}
      {matches.length > 2 && (
        <text x={spec.x + width - 14} y={spec.y + 116} textAnchor="end" className="node-more">+{matches.length - 2} more</text>
      )}
      <text x={spec.x + width - 15} y={spec.y + 26} textAnchor="end" className="node-count">{matches.length}</text>
    </g>
  );
}

function WorkflowGraph({ issues, onSelect }: { issues: WorkflowIssue[]; onSelect: (key: string) => void }) {
  return (
    <div className="graph-scroll" aria-label="Issue workflow graph">
              <svg className="workflow-graph" viewBox="0 0 1730 785" role="group" aria-labelledby="graph-title graph-description">
        <title id="graph-title">Ymir issue workflow</title>
        <desc id="graph-description">Issues move from intake and triage through backport, rebase, or rebuild, then build validation, optional merge request consolidation, QE and release checks, and closeout. Failures can retry; issues needing human input go to attention.</desc>
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0 0 8 4 0 8Z" fill="#c3ccd8" />
          </marker>
          <marker id="arrowhead-retry" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0 0 8 4 0 8Z" fill="#d4a43a" />
          </marker>
        </defs>
        <g className="edge-layer">
          {edges.map((edge) => (
            <path
              key={`${edge.from}-${edge.to}`}
              d={edge.path}
              className={`graph-edge${edge.to === "retry" ? " graph-edge--warning" : ""}${edge.to === "attention" ? " graph-edge--danger" : ""}${"optional" in edge && edge.optional ? " graph-edge--optional" : ""}${"retry" in edge && edge.retry ? " graph-edge--retry" : ""}`}
              markerEnd={`url(#${edge.to === "retry" ? "arrowhead-retry" : "arrowhead"})`}
            />
          ))}
        </g>
        <g className="edge-labels" aria-hidden="true">
          <text x="490" y="212">route</text>
          <text x="1070" y="205">optional consolidation</text>
          <text x="884" y="500">build failure</text>
          <text x="216" y="495">clarification</text>
          <text x="410" y="752">retry after repair</text>
        </g>
        {nodes.map((spec) => (
          <GraphNode key={spec.id} spec={spec} issues={issues} onSelect={onSelect} />
        ))}
        <g className="flow-caption" aria-hidden="true">
          <text x="48" y="270">PACKAGING WORKFLOW</text>
          <text x="1260" y="270">POST-MERGE LIFECYCLE</text>
        </g>
      </svg>
    </div>
  );
}

function App() {
  const [snapshot, setSnapshot] = useState<WorkflowSnapshot>(() => demoProvider.getSnapshot());
  const [filter, setFilter] = useState<IssueFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = demoProvider.subscribe(setSnapshot);
    demoProvider.start();
    return () => {
      unsubscribe();
      demoProvider.pause();
    };
  }, []);

  const activeCount = snapshot.issues.filter((issue) => !["complete", "attention"].includes(issue.state)).length;
  const attentionCount = snapshot.issues.filter((issue) => issue.state === "attention" || issue.state === "retry").length;
  const qeCount = snapshot.issues.filter((issue) => issue.stage === "qe").length;
  const completedCount = snapshot.issues.filter((issue) => issue.state === "complete").length;
  const demoStateLabel = snapshot.finished ? "DEMO COMPLETE" : snapshot.playing ? "AUTO-PLAYING" : "PAUSED";

  const filteredIssues = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return snapshot.issues.filter((issue) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "active" && !["complete", "attention"].includes(issue.state)) ||
        (filter === "attention" && ["attention", "retry"].includes(issue.state)) ||
        (filter === "complete" && issue.state === "complete");
      const matchesQuery =
        !needle ||
        [issue.key, issue.packageName, issue.summary, issue.branch].some((value) => value.toLowerCase().includes(needle));
      return matchesFilter && matchesQuery;
    });
  }, [filter, query, snapshot.issues]);

  const selectedIssue = snapshot.issues.find((issue) => issue.key === selectedKey) ?? null;

  const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="app-shell">
      <aside className="rail" aria-label="Primary navigation">
        <a className="brand-mark" href="#overview" aria-label="Ymir workflow overview" onClick={() => goTo("overview")}>Y</a>
        <div className="rail-divider" />
        <IconButton title="Overview" icon="grid" active onClick={() => goTo("overview")} />
        <IconButton title="Pipeline graph" icon="flow" onClick={() => goTo("pipeline")} />
        <IconButton title="Issue list" icon="archive" onClick={() => goTo("issues")} />
        <div className="rail-spacer" />
        <IconButton title="About this demo" icon="settings" onClick={() => goTo("about-demo")} />
        <div className="avatar" aria-label="Ymir demo workspace">YM</div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <div className="breadcrumbs"><span>Ymir</span><span className="breadcrumb-slash">/</span><strong>Workflow overview</strong></div>
          <div className="topbar-actions">
            <span className="system-status"><i /> Simulated event feed</span>
            <span className="topbar-divider" />
            <div className="workspace-button" aria-label="Package maintenance workspace"><span className="workspace-avatar">Y</span><span>Package maintenance</span><Icon name="chevron" size={14} /></div>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <div className="eyebrow">OPERATIONS / RELEASE ENGINEERING</div>
              <h1>Workflow overview</h1>
              <p>Track package issues from upstream fix through release verification.</p>
            </div>
            <div className="demo-controls">
              <span className="demo-badge"><span className="demo-badge-dot" />Demo mode</span>
              {snapshot.playing ? (
                <button className="control-button" type="button" onClick={() => demoProvider.pause()}><Icon name="pause" size={15} />Pause</button>
              ) : snapshot.finished ? (
                <button className="control-button control-button--primary" type="button" onClick={() => demoProvider.replay()}><Icon name="replay" size={15} />Replay demo</button>
              ) : (
                <button className="control-button control-button--primary" type="button" onClick={() => demoProvider.start()}><Icon name="play" size={15} />Resume demo</button>
              )}
              {snapshot.playing && <button className="icon-control" type="button" aria-label="Restart demo" title="Restart demo" onClick={() => demoProvider.replay()}><Icon name="replay" size={16} /></button>}
            </div>
          </section>

          <section className="metrics-grid" aria-label="Issue summary">
            <MetricCard label="In the pipeline" value={activeCount} detail="Across all workflow stages" icon="flow" color="blue" />
            <MetricCard label="Needs attention" value={attentionCount} detail="Retry or maintainer review" icon="alert" color="amber" />
            <MetricCard label="QE & release" value={qeCount} detail="Verification in progress" icon="clock" color="violet" />
            <MetricCard label="Closed out" value={completedCount} detail="Completed in this demo" icon="check" color="green" />
          </section>

          <section className="panel graph-panel" id="pipeline">
            <div className="panel-heading graph-heading">
              <div>
                <div className="section-title-line"><h2>Issue pipeline</h2><span className={`live-pill${snapshot.playing ? " live-pill--playing" : " live-pill--paused"}`}><i />{demoStateLabel}</span></div>
                <p className="panel-description">Each token is a mock issue. Select one to inspect its path and recent events.</p>
              </div>
              <div className="progress-indicator" aria-label={`Demo step ${snapshot.step} of ${snapshot.totalSteps}`}>
                <div className="progress-copy"><span>DEMO PROGRESS</span><strong>{String(snapshot.step).padStart(2, "0")} <em>/ {String(snapshot.totalSteps).padStart(2, "0")}</em></strong></div>
                <div className="progress-track"><span style={{ width: `${(snapshot.step / snapshot.totalSteps) * 100}%` }} /></div>
              </div>
            </div>
            <WorkflowGraph issues={snapshot.issues} onSelect={setSelectedKey} />
            <div className="graph-footer">
              <div className="legend"><span><i className="legend-dot legend-dot--blue" />In progress</span><span><i className="legend-dot legend-dot--amber" />Retry</span><span><i className="legend-dot legend-dot--red" />Needs attention</span><span><i className="legend-dot legend-dot--green" />Complete</span></div>
              <span className="graph-footnote"><Icon name="clock" size={13} /> {snapshot.finished ? "Demo sequence complete · replay any time" : snapshot.playing ? "Demo advances every 2.4 seconds" : "Demo paused · resume to continue"}</span>
            </div>
          </section>

          <section className="lower-grid">
            <div className="panel issues-panel" id="issues">
              <div className="panel-heading issue-panel-heading">
                <div><h2>Issues <span className="heading-count">{filteredIssues.length}</span></h2><p className="panel-description">Click an issue to see its current run details.</p></div>
              <label className="search-field"><Icon name="search" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search issues" aria-label="Search issues" /></label>
              </div>
              <div className="filter-tabs" role="tablist" aria-label="Filter issues">
                {filters.map((item) => (
                  <button key={item.id} type="button" role="tab" aria-selected={filter === item.id} className={filter === item.id ? "filter-tab filter-tab--active" : "filter-tab"} onClick={() => setFilter(item.id)}>{item.label}{item.id === "all" && <span>{snapshot.issues.length}</span>}</button>
                ))}
              </div>
              <div className="issue-table-wrap">
                <table className="issue-table">
                  <thead><tr><th>Issue / package</th><th>Route</th><th>Current stage</th><th>Status</th><th>Updated</th><th><span className="sr-only">Open issue</span></th></tr></thead>
                  <tbody>
                    {filteredIssues.map((issue) => (
                      <tr key={issue.key} onClick={() => setSelectedKey(issue.key)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") setSelectedKey(issue.key); }}>
                        <td><div className="issue-primary"><strong>{issue.key}</strong><span>{issue.packageName}</span></div></td>
                        <td><span className={`route-label route-label--${issue.route}`}>{routeLabel(issue.route)}</span></td>
                        <td><span className="stage-cell">{stageLabels[issue.stage]}</span></td>
                        <td><StatusPill issue={issue} /></td>
                        <td className="updated-cell">{issue.updatedAt}</td>
                        <td><button className="row-open" type="button" aria-label={`Open ${issue.key}`} onClick={(event) => { event.stopPropagation(); setSelectedKey(issue.key); }}><Icon name="chevron" size={15} /></button></td>
                      </tr>
                    ))}
                    {!filteredIssues.length && <tr><td className="empty-row" colSpan={6}>No issues match that search.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="table-foot"><span>Showing {filteredIssues.length} of {snapshot.issues.length} demo issues</span><span>Source: simulated workflow events</span></div>
            </div>

            <div className="panel activity-panel" id="activity">
              <div className="panel-heading"><div><h2>Recent activity</h2><p className="panel-description">Updates from the demo workflow.</p></div><button className="quiet-button" type="button" onClick={() => { setFilter("all"); setQuery(""); goTo("issues"); }}>View all</button></div>
              <div className="activity-list">
                {snapshot.activity.slice(0, 6).map((event) => {
                  const issue = snapshot.issues.find((item) => item.key === event.issueKey);
                  return (
                    <button className="activity-row" type="button" key={event.id} onClick={() => setSelectedKey(event.issueKey)}>
                      <span className={`activity-marker activity-marker--${event.tone}`}><Icon name={event.tone === "green" ? "check" : event.tone === "red" ? "alert" : "arrow"} size={12} /></span>
                      <span className="activity-copy"><span><strong>{event.issueKey}</strong> {event.message}</span><small>{issue?.packageName ?? "Package issue"} · {event.time}</small></span>
                    </button>
                  );
                })}
              </div>
              <div className="activity-note"><span className="note-icon"><Icon name="spark" size={15} /></span><span><strong>Demo data</strong><br />This dashboard uses synthetic issues and simulated transitions.</span></div>
            </div>
          </section>

          <footer className="page-footer" id="about-demo"><span><span className="footer-mark">Y</span> Ymir workflow dashboard</span><span>Demo source · {snapshot.finished ? "Replay available" : snapshot.playing ? "Running" : "Paused"}</span></footer>
        </div>
      </main>

      {selectedIssue && <IssueDetail issue={selectedIssue} onClose={() => setSelectedKey(null)} />}
    </div>
  );
}

function MetricCard({ label, value, detail, icon, color }: { label: string; value: number; detail: string; icon: IconName; color: string }) {
  return (
    <div className="metric-card">
      <span className={`metric-icon metric-icon--${color}`}><Icon name={icon} size={18} /></span>
      <div className="metric-main"><span>{label}</span><strong>{String(value).padStart(2, "0")}</strong><small>{detail}</small></div>
      <span className={`metric-spark metric-spark--${color}`} aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></span>
    </div>
  );
}

function IssueDetail({ issue, onClose }: { issue: WorkflowIssue; onClose: () => void }) {
  const onBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };
  return (
    <div className="detail-backdrop" onMouseDown={onBackdrop} role="presentation">
      <aside className="detail-drawer" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <div className="drawer-topline"><span className="drawer-kicker">DEMO ISSUE</span><button className="icon-control" type="button" aria-label="Close issue details" onClick={onClose}><Icon name="close" size={17} /></button></div>
        <div className="drawer-title-row"><div><h2 id="detail-title">{issue.key}</h2><p>{issue.summary}</p></div><StatusPill issue={issue} /></div>
        <div className="drawer-package"><span className="package-avatar">{issue.packageName.slice(0, 1).toUpperCase()}</span><span><strong>{issue.packageName}</strong><small>Target release branch</small></span><b>{issue.branch}</b></div>
        <div className="drawer-section"><div className="drawer-section-heading"><h3>Current run</h3><span>{issue.updatedAt}</span></div><div className="run-card"><span className={`run-icon run-icon--${issue.state}`}><Icon name={issue.state === "attention" ? "alert" : issue.state === "complete" ? "check" : issue.state === "retry" ? "replay" : "flow"} size={17} /></span><span><strong>{stageLabels[issue.stage]}</strong><small>{issue.agent}</small></span></div>
          <div className="detail-facts"><Fact label="Resolution route" value={routeLabel(issue.route)} /><Fact label="Build validation" value={issue.build ? issue.build[0].toUpperCase() + issue.build.slice(1) : "Not started"} /><Fact label="Merge request" value={issue.mergeRequest ?? "Not created"} /></div>
          {issue.attentionReason && <div className={`attention-callout attention-callout--${issue.state}`}><Icon name="alert" size={16} /><span>{issue.attentionReason}</span></div>}
        </div>
        <div className="drawer-section drawer-events"><div className="drawer-section-heading"><h3>Issue activity</h3><span>{issue.events.length} updates</span></div>
          {issue.events.length ? <ol className="event-timeline">{issue.events.map((event) => <li key={event.id}><span className={`timeline-dot timeline-dot--${event.tone}`} /><div><p>{event.message}</p><small>{event.time}</small></div></li>)}</ol> : <p className="no-events">No new events in this run yet.</p>}
        </div>
        <div className="drawer-footer"><span><i /> Mock issue · safe to explore</span><button type="button" onClick={onClose}>Done</button></div>
      </aside>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="detail-fact"><span>{label}</span><strong>{value}</strong></div>;
}

export default App;
