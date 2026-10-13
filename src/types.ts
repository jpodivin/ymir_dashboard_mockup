export type PipelineStage =
  | "intake"
  | "triage"
  | "backport"
  | "rebase"
  | "rebuild"
  | "build"
  | "consolidation"
  | "qe"
  | "complete"
  | "retry"
  | "attention";

export type RouteKind = "backport" | "rebase" | "rebuild" | "unassigned";
export type IssueState = "queued" | "running" | "retry" | "attention" | "complete";
export type EventTone = "blue" | "green" | "amber" | "red" | "muted";

export interface IssueEvent {
  id: string;
  message: string;
  time: string;
  tone: EventTone;
  issueKey: string;
}

export interface WorkflowIssue {
  key: string;
  summary: string;
  packageName: string;
  branch: string;
  route: RouteKind;
  stage: PipelineStage;
  state: IssueState;
  agent: string;
  updatedAt: string;
  build?: "pending" | "passed" | "failed";
  mergeRequest?: string;
  attentionReason?: string;
  events: IssueEvent[];
}

export interface WorkflowSnapshot {
  issues: WorkflowIssue[];
  activity: IssueEvent[];
  playing: boolean;
  finished: boolean;
  step: number;
  totalSteps: number;
}

/**
 * Boundary between the dashboard and its source of workflow state.
 * The demo and a future polling or streaming adapter can share this contract.
 */
export interface WorkflowDataSource {
  getSnapshot(): WorkflowSnapshot;
  subscribe(listener: (snapshot: WorkflowSnapshot) => void): () => void;
}
