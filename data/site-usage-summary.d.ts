export type SiteUsageStatus = "active" | "inactive" | "test";

export type SiteUsageSummary = {
  generatedAt: string;
  totals: {
    configured: number;
    active: number;
    inactive: number;
    testOnly: number;
  };
  sites: Array<{
    name: string;
    status: SiteUsageStatus;
    workOrders: number;
    recentWorkOrders: number;
    latestActivity: string | null;
    note?: string;
  }>;
};

export const siteUsageSummary: SiteUsageSummary;
