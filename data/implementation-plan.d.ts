export type PhaseStatus = "done" | "in-progress" | "pending" | "watch";

export type Phase = {
  id: string;
  title: string;
  window: string;
  status: PhaseStatus;
  summary: string;
  owner: string;
  focus: string[];
  milestones: string[];
};

export type Risk = {
  label: string;
  severity: "low" | "medium" | "high";
  mitigation: string;
};

export const sourceSummary: {
  title: string;
  sourceKind: string;
  rolloutWindow: string;
  users: string;
  corporateCoverage: string;
  nonAdCoverage: string;
};

export const rolloutPhases: Phase[];
export const readinessMetrics: Array<{ label: string; value: string }>;
export const technicalChecklist: string[];
export const communicationPlan: Array<{
  label: string;
  detail: string;
  status: "sent" | "planned";
}>;
export const projectUpdates: Array<{
  label: string;
  detail: string;
  status: "waiting" | "complete";
}>;
export const risks: Risk[];
