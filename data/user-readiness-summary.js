export const userReadinessSummary = {
  generatedAt: null,
  source: "No live reconciliation run yet",
  totals: {
    upkeepUsers: 0,
    matched: 0,
    needsAction: 0,
    missingUpkeepEmail: 0,
    missingAdUser: 0,
    disabledAdUser: 0
  },
  readinessPercent: 0,
  chartSegments: [
    { label: "Matched", value: 0, className: "segment-good" },
    { label: "Missing AD user", value: 0, className: "segment-risk" },
    { label: "Disabled AD user", value: 0, className: "segment-watch" },
    { label: "Missing UpKeep email", value: 0, className: "segment-muted" }
  ],
  actionBuckets: [
    {
      label: "Ready for SSO",
      count: 0,
      tone: "good",
      description: "UpKeep account has a matching enabled AD identity."
    },
    {
      label: "Create or migrate AD identity",
      count: 0,
      tone: "risk",
      description: "UpKeep account did not match a local AD user."
    },
    {
      label: "Enable or replace AD identity",
      count: 0,
      tone: "watch",
      description: "AD account exists but is disabled."
    },
    {
      label: "Correct UpKeep email",
      count: 0,
      tone: "muted",
      description: "UpKeep account is missing an email."
    }
  ]
};
