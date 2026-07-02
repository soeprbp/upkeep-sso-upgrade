export type UpkeepInventorySummary = {
  generatedAt: string | null;
  accountTypes: Array<{
    label: string;
    count: number;
  }>;
  statuses: Array<{
    label: string;
    count: number;
  }>;
  locations: {
    total: number;
    sampleNames: string[];
  };
};

export const upkeepInventorySummary: UpkeepInventorySummary;
