import type {
  IssueEvent,
  IssueState,
  PipelineStage,
  WorkflowDataSource,
  WorkflowIssue,
  WorkflowSnapshot,
} from "../types";

const startingIssues: WorkflowIssue[] = [
  {
    key: "DEMO-4210",
    summary: "Fix certificate rotation handling",
    packageName: "openssl",
    branch: "rhel-10.1",
    route: "backport",
    stage: "backport",
    state: "running",
    agent: "Backport agent",
    updatedAt: "just now",
    events: [createEvent("DEMO-4210", "Upstream patch verified for this release branch", "3 min ago", "blue", "initial-4210")],
  },
  {
    key: "DEMO-4211",
    summary: "Refresh upstream crypto implementation",
    packageName: "crypto-policies",
    branch: "rhel-9.6.z",
    route: "rebase",
    stage: "qe",
    state: "running",
    agent: "Issue verification",
    updatedAt: "2 min ago",
    build: "passed",
    mergeRequest: "!1842",
    events: [createEvent("DEMO-4211", "Merged change entered release verification", "2 min ago", "blue", "initial-4211")],
  },
  {
    key: "DEMO-4212",
    summary: "Rebuild against updated system libraries",
    packageName: "podman",
    branch: "rhel-9.4.z",
    route: "rebuild",
    stage: "build",
    state: "running",
    agent: "Rebuild agent",
    updatedAt: "4 min ago",
    build: "pending",
    events: [createEvent("DEMO-4212", "Copr build submitted", "4 min ago", "blue", "initial-4212")],
  },
  {
    key: "DEMO-4213",
    summary: "Correct a race during service startup",
    packageName: "systemd",
    branch: "rhel-9.5.z",
    route: "backport",
    stage: "retry",
    state: "retry",
    agent: "Backport agent",
    updatedAt: "8 min ago",
    build: "failed",
    attentionReason: "Copr build needs another repair attempt",
    events: [createEvent("DEMO-4213", "Build failed; retry scheduled", "8 min ago", "amber", "initial-4213")],
  },
  {
    key: "DEMO-4214",
    summary: "Investigate an upstream regression report",
    packageName: "systemd",
    branch: "rhel-10.1",
    route: "unassigned",
    stage: "triage",
    state: "running",
    agent: "Triage agent",
    updatedAt: "1 min ago",
    events: [createEvent("DEMO-4214", "Issue accepted by triage queue", "1 min ago", "muted", "initial-4214")],
  },
  {
    key: "DEMO-4215",
    summary: "Apply upstream bounds check fix",
    packageName: "curl",
    branch: "rhel-9.6.z",
    route: "backport",
    stage: "complete",
    state: "complete",
    agent: "Closed out",
    updatedAt: "18 min ago",
    build: "passed",
    mergeRequest: "!1836",
    events: [createEvent("DEMO-4215", "Release verification completed", "18 min ago", "green", "initial-4215")],
  },
  {
    key: "DEMO-4216",
    summary: "Confirm affected release streams",
    packageName: "shadow-utils",
    branch: "rhel-10.1",
    route: "unassigned",
    stage: "attention",
    state: "attention",
    agent: "Triage agent",
    updatedAt: "12 min ago",
    attentionReason: "Waiting for maintainer clarification",
    events: [createEvent("DEMO-4216", "Triage is waiting for maintainer clarification", "12 min ago", "red", "initial-4216")],
  },
];

interface DemoStep {
  issueKey: string;
  stage: PipelineStage;
  message: string;
  tone: IssueEvent["tone"];
  build?: WorkflowIssue["build"];
  mergeRequest?: string;
}

const script: DemoStep[] = [
  { issueKey: "DEMO-4214", stage: "rebase", message: "Triage selected the rebase route", tone: "blue" },
  { issueKey: "DEMO-4210", stage: "build", message: "Patch applied; Copr build started", tone: "blue", build: "pending" },
  { issueKey: "DEMO-4213", stage: "backport", message: "Retry picked up from the backport queue", tone: "amber" },
  { issueKey: "DEMO-4211", stage: "complete", message: "QE checks passed; issue is ready for closeout", tone: "green" },
  { issueKey: "DEMO-4212", stage: "consolidation", message: "Build passed; merge request joined consolidation", tone: "green", build: "passed", mergeRequest: "!1847" },
  { issueKey: "DEMO-4210", stage: "consolidation", message: "Copr build passed; merge request opened", tone: "green", build: "passed", mergeRequest: "!1848" },
  { issueKey: "DEMO-4214", stage: "build", message: "Upstream version prepared for validation", tone: "blue", build: "pending" },
  { issueKey: "DEMO-4213", stage: "build", message: "Repair attempt submitted to Copr", tone: "blue", build: "pending" },
  { issueKey: "DEMO-4212", stage: "qe", message: "Consolidated merge request entered QE checks", tone: "blue" },
  { issueKey: "DEMO-4210", stage: "qe", message: "Merge request is merged; QE verification started", tone: "blue" },
  { issueKey: "DEMO-4214", stage: "consolidation", message: "Merge request created for the release branch", tone: "green", build: "passed", mergeRequest: "!1849" },
  { issueKey: "DEMO-4213", stage: "attention", message: "Repair still needs maintainer input", tone: "red" },
  { issueKey: "DEMO-4212", stage: "complete", message: "Release checks finished; issue closed", tone: "green" },
  { issueKey: "DEMO-4210", stage: "complete", message: "Release verification finished; issue closed", tone: "green" },
  { issueKey: "DEMO-4214", stage: "qe", message: "QE verification is running on the merged change", tone: "blue" },
];

const initialActivity: IssueEvent[] = [
  createEvent("DEMO-4212", "Copr build is running for podman", "4 min ago", "blue", "initial-1"),
  createEvent("DEMO-4211", "QE verification is reviewing merged change", "2 min ago", "blue", "initial-2"),
  createEvent("DEMO-4214", "Issue entered triage", "1 min ago", "muted", "initial-3"),
];

function createEvent(
  issueKey: string,
  message: string,
  time: string,
  tone: IssueEvent["tone"],
  id: string,
): IssueEvent {
  return { id, issueKey, message, time, tone };
}

function cloneIssue(issue: WorkflowIssue): WorkflowIssue {
  return { ...issue, events: [...issue.events] };
}

function stateForStage(stage: PipelineStage): IssueState {
  if (stage === "attention") return "attention";
  if (stage === "retry") return "retry";
  if (stage === "complete") return "complete";
  if (stage === "intake") return "queued";
  return "running";
}

function agentForStage(stage: PipelineStage): string {
  const agents: Record<PipelineStage, string> = {
    intake: "Issue fetcher",
    triage: "Triage agent",
    backport: "Backport agent",
    rebase: "Rebase agent",
    rebuild: "Rebuild agent",
    build: "Copr build validation",
    consolidation: "MR consolidation",
    qe: "QE + issue verification",
    complete: "Closed out",
    retry: "Retry queue",
    attention: "Maintainer review",
  };
  return agents[stage];
}

function cloneSnapshot(snapshot: WorkflowSnapshot): WorkflowSnapshot {
  return {
    ...snapshot,
    issues: snapshot.issues.map(cloneIssue),
    activity: [...snapshot.activity],
  };
}

/** Deterministic, auto-playing source used by the dashboard's demo mode. */
export class DemoWorkflowProvider implements WorkflowDataSource {
  private listeners = new Set<(snapshot: WorkflowSnapshot) => void>();
  private timer: ReturnType<typeof setInterval> | undefined;
  private cursor = 0;
  private snapshot: WorkflowSnapshot = {
    issues: startingIssues.map(cloneIssue),
    activity: [...initialActivity],
    playing: false,
    finished: false,
    step: 0,
    totalSteps: script.length,
  };

  getSnapshot(): WorkflowSnapshot {
    return cloneSnapshot(this.snapshot);
  }

  subscribe(listener: (snapshot: WorkflowSnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  start(): void {
    if (this.timer || this.snapshot.finished) return;
    this.snapshot = { ...this.snapshot, playing: true };
    this.publish();
    this.timer = setInterval(() => this.advance(), 2400);
  }

  pause(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    if (this.snapshot.playing) {
      this.snapshot = { ...this.snapshot, playing: false };
      this.publish();
    }
  }

  replay(): void {
    this.pause();
    this.cursor = 0;
    this.snapshot = {
      issues: startingIssues.map(cloneIssue),
      activity: [...initialActivity],
      playing: false,
      finished: false,
      step: 0,
      totalSteps: script.length,
    };
    this.publish();
    this.start();
  }

  private advance(): void {
    const step = script[this.cursor];
    if (!step) {
      this.pause();
      this.snapshot = { ...this.snapshot, finished: true, playing: false };
      this.publish();
      return;
    }

    const now = new Date();
    const event = createEvent(
      step.issueKey,
      step.message,
      "just now",
      step.tone,
      `demo-${this.cursor}`,
    );
    const issueIndex = this.snapshot.issues.findIndex((issue) => issue.key === step.issueKey);
    if (issueIndex < 0) {
      this.cursor += 1;
      return;
    }

    const issues = this.snapshot.issues.map((issue, index) => {
      if (index !== issueIndex) return issue;
      return {
        ...issue,
        stage: step.stage,
        state: stateForStage(step.stage),
        agent: agentForStage(step.stage),
        updatedAt: "just now",
        build: step.build ?? issue.build,
        mergeRequest: step.mergeRequest ?? issue.mergeRequest,
        attentionReason:
          step.stage === "attention"
            ? "Repair attempt needs maintainer input"
            : step.stage === "retry"
              ? "Retry queued after a failed build"
              : undefined,
        events: [event, ...issue.events].slice(0, 4),
      };
    });
    this.cursor += 1;
    this.snapshot = {
      ...this.snapshot,
      issues,
      activity: [
        { ...event, time: new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(now) },
        ...this.snapshot.activity,
      ].slice(0, 8),
      step: this.cursor,
    };
    this.publish();

    if (this.cursor >= script.length) {
      this.pause();
      this.snapshot = { ...this.snapshot, finished: true, playing: false };
      this.publish();
    }
  }

  private publish(): void {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot);
  }
}

export const demoProvider = new DemoWorkflowProvider();
