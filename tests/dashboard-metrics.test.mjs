import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateCompletionProgress,
  calculateCoveragePercent
} from "../lib/dashboard-metrics.mjs";

test("completion progress changes only with completed phase count", () => {
  assert.equal(calculateCompletionProgress(0, 7), 0);
  assert.equal(calculateCompletionProgress(1, 7), 14);
  assert.equal(calculateCompletionProgress(7, 7), 100);
  assert.equal(calculateCompletionProgress(8, 7), 100);
});

test("coverage percent handles partial, missing, and excessive counts", () => {
  assert.equal(calculateCoveragePercent(54, 117), 46);
  assert.equal(calculateCoveragePercent(117, 117), 100);
  assert.equal(calculateCoveragePercent(130, 117), 100);
  assert.equal(calculateCoveragePercent(0, 0), 100);
});
