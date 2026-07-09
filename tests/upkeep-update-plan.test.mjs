import assert from "node:assert/strict";
import test from "node:test";
import { buildUpdatePlan } from "../scripts/apply-upkeep-user-updates.mjs";

test("location suggestions are review-only and never become patch fields", () => {
  const plan = buildUpdatePlan([
    {
      upkeepId: "user-1",
      accountType: "TECH",
      suggestedLocationName: "Main Plant",
      notes: "Review location"
    }
  ]);

  assert.equal(plan.locationReviewCount, 1);
  assert.deepEqual(plan.unsupportedFields, []);
  assert.deepEqual(plan.updates, [
    { upkeepId: "user-1", fields: { accountType: "TECH" } }
  ]);
});

test("unknown non-empty update columns are reported", () => {
  const plan = buildUpdatePlan([
    { upkeepId: "user-1", accountType: "TECH", unexpectedField: "value" }
  ]);

  assert.deepEqual(plan.unsupportedFields, ["unexpectedField"]);
});
