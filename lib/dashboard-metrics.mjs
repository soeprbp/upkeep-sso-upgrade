export function calculateCompletionProgress(completedCount, totalCount) {
  if (!Number.isFinite(totalCount) || totalCount <= 0) {
    return 0;
  }

  const safeCompletedCount = Math.min(
    totalCount,
    Math.max(0, Number.isFinite(completedCount) ? completedCount : 0)
  );
  return Math.round((safeCompletedCount / totalCount) * 100);
}

export function calculateCoveragePercent(actualCount, expectedCount) {
  if (!Number.isFinite(expectedCount) || expectedCount <= 0) {
    return 100;
  }

  const safeActualCount = Math.max(
    0,
    Number.isFinite(actualCount) ? actualCount : 0
  );
  return Math.min(100, Math.round((safeActualCount / expectedCount) * 100));
}
