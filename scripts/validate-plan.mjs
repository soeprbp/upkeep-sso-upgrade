import {
  communicationPlan,
  readinessMetrics,
  risks,
  rolloutPhases,
  sourceSummary,
  technicalChecklist
} from "../data/implementation-plan.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(sourceSummary.users === "~110 UpKeep users", "source summary should capture user count");
assert(rolloutPhases.length === 7, "expected seven rollout phases");
assert(readinessMetrics.length === 4, "expected four readiness metrics");
assert(technicalChecklist.length >= 6, "expected a technical checklist");
assert(communicationPlan.length === 4, "expected four communication milestones");
assert(risks.some((risk) => risk.severity === "high"), "expected high-severity risks");

console.log("Rollout plan validation passed.");
