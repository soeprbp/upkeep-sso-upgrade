import assert from "node:assert/strict";
import test from "node:test";

import { diffUsers } from "../lib/user-diff.mjs";

const upkeepUser = {
  id: "upkeep-1",
  site: "Plant A",
  email: "worker@example.com",
  displayName: "Example Worker",
  role: "TECH",
  status: "active"
};

test("flags an enabled AD account when payroll has no match", () => {
  const rows = diffUsers(
    [upkeepUser],
    [{ id: "ad-1", email: upkeepUser.email, accountEnabled: true }],
    [],
    { payrollChecked: true }
  );

  assert.equal(rows[0].status, "missing_payroll_user");
  assert.equal(rows[0].hasMissingPayroll, true);
  assert.equal(rows[0].site, "Plant A");
});

test("keeps disabled AD and missing payroll as independent callouts", () => {
  const rows = diffUsers(
    [upkeepUser],
    [{ id: "ad-1", email: upkeepUser.email, accountEnabled: false }],
    [],
    { payrollChecked: true }
  );

  assert.equal(rows[0].status, "missing_payroll_user");
  assert.equal(rows[0].hasMissingPayroll, true);
  assert.equal(rows[0].hasDisabledAd, true);
});

test("does not mark an account ready when payroll was not checked", () => {
  const rows = diffUsers(
    [upkeepUser],
    [{ id: "ad-1", email: upkeepUser.email, accountEnabled: true }],
    [],
    { payrollChecked: false }
  );

  assert.equal(rows[0].status, "payroll_not_checked");
  assert.equal(rows[0].payrollMatchStatus, "not_checked");
});
