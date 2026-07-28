import fs from "node:fs/promises";
import path from "node:path";
import { toCsv } from "../lib/csv.mjs";
import {
  fetchEntraUsersFromGraph,
  readEntraUsersFromCsv
} from "../lib/entra-users.mjs";
import {
  isUpKeepServiceAccount,
  isUpKeepSiteIgnored,
  loadDotEnv
} from "../lib/env.mjs";
import { loadPayrollUsers } from "../lib/payroll-users.mjs";
import { diffUsers, summarizeDiff } from "../lib/user-diff.mjs";

const columns = [
  { key: "status" },
  { key: "action" },
  { key: "site" },
  { key: "upkeepId" },
  { key: "upkeepEmail" },
  { key: "upkeepDisplayName" },
  { key: "upkeepRole" },
  { key: "upkeepStatus" },
  { key: "entraId" },
  { key: "entraEmail" },
  { key: "entraDisplayName" },
  { key: "entraGivenName" },
  { key: "entraSurname" },
  { key: "entraAccountEnabled" },
  { key: "entraJobTitle" },
  { key: "entraDepartment" },
  { key: "entraOffice" },
  { key: "entraCompany" },
  { key: "entraEmployeeId" },
  { key: "entraGroups" },
  { key: "payrollMatchStatus" },
  { key: "payrollEmployeeId" },
  { key: "payrollStatus" },
  { key: "payrollJobTitle" },
  { key: "payrollDepartment" },
  { key: "payrollLocation" }
];

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

async function readUpKeepUsers(filePath) {
  const payload = JSON.parse(await fs.readFile(filePath, "utf8"));
  return {
    users: Array.isArray(payload) ? payload : (payload.users ?? []),
    coverage: Array.isArray(payload) ? null : (payload.coverage ?? null)
  };
}

async function main() {
  loadDotEnv();
  const upkeepPath = path.resolve(
    argValue("--upkeep") ?? "data/generated/upkeep-users.json"
  );
  const entraCsvPath = argValue("--entra-csv");
  const outputDir = path.resolve(process.cwd(), "data/generated");
  await fs.mkdir(outputDir, { recursive: true });

  const upkeepPayload = await readUpKeepUsers(upkeepPath);
  // Keep each site account so remediation remains attributable to every UpKeep site.
  const upkeepUsers = upkeepPayload.users.filter(
    (user) =>
      !isUpKeepSiteIgnored(user.site) && !isUpKeepServiceAccount(user.email)
  );
  const entraUsers = entraCsvPath
    ? await readEntraUsersFromCsv(path.resolve(entraCsvPath))
    : await fetchEntraUsersFromGraph();
  const payrollCsvPath = argValue("--payroll-csv");
  const includePayroll =
    payrollCsvPath || process.env.PAYROLL_SQL_CONNECTION_STRING;
  const payrollUsers = includePayroll
    ? await loadPayrollUsers({
        csvPath: payrollCsvPath ? path.resolve(payrollCsvPath) : null
      })
    : [];

  const rows = diffUsers(upkeepUsers, entraUsers, payrollUsers, {
    payrollChecked: Boolean(includePayroll)
  });
  const summary = summarizeDiff(rows);
  const timestamp = new Date().toISOString();

  await fs.writeFile(
    path.join(outputDir, "user-diff.json"),
    `${JSON.stringify({ generatedAt: timestamp, upkeepCoverage: upkeepPayload.coverage, summary, rows }, null, 2)}\n`,
    "utf8"
  );
  await fs.writeFile(
    path.join(outputDir, "user-diff.csv"),
    toCsv(rows, columns),
    "utf8"
  );

  console.log(JSON.stringify(summary, null, 2));
  console.log(`Wrote ${path.join(outputDir, "user-diff.json")}`);
  console.log(`Wrote ${path.join(outputDir, "user-diff.csv")}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
