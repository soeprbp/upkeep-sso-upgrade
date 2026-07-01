export type UserReadinessSummary = {
  generatedAt: string | null;
  source: string;
  totals: {
    upkeepUsers: number;
    matched: number;
    needsAction: number;
    missingUpkeepEmail: number;
    missingAdUser: number;
    disabledAdUser: number;
    missingAdPayrollActive: number;
    missingAdPayrollInactive: number;
    missingAdPayrollNotFound: number;
  };
  coverage: {
    expectedMinimum: number;
    actual: number;
    status: string;
    message: string;
  };
  readinessPercent: number;
  chartSegments: Array<{
    label: string;
    value: number;
    className: string;
  }>;
  actionBuckets: Array<{
    label: string;
    count: number;
    tone: "good" | "risk" | "watch" | "muted";
    description: string;
  }>;
};

export const userReadinessSummary: UserReadinessSummary;
