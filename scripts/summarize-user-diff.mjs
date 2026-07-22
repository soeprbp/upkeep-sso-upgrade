import fs from "node:fs/promises";
import path from "node:path";

function count(rows, status) {
  return rows.filter((row) => row.status === status).length;
}

function countPerSite(rows, status) {
  const map = {};
  for (const row of rows) {
    if (row.status === status) {
      const site = row.site || "(unknown)";
      map[site] = (map[site] ?? 0) + 1;
    }
  }
  return map;
}

async function main() {
  const inputPath = path.resolve(process.argv[2] ?? "data/generated/user-diff.json");
  const outputPath = path.resolve(process.argv[3] ?? "data/user-readiness-summary.js");
  const payload = JSON.parse(await fs.readFile(inputPath, "utf8"));
  const rows = payload.rows ?? [];

  // Read upkeep-users.json to get per-site user counts and site list
  let perSite = {};
  try {
    const upkeepPayload = JSON.parse(
      await fs.readFile(path.resolve("data/generated/upkeep-users.json"), "utf8")
    );
    const sites = upkeepPayload.sites ?? {};
    const matchedPerSite = countPerSite(rows, "matched");
    for (const [siteName, info] of Object.entries(sites)) {
      const siteRows = rows.filter((r) => r.site === siteName);
      const siteMatched = matchedPerSite[siteName] ?? 0;
      perSite[siteName] = {
        users: info.count ?? 0,
        matched: siteMatched,
        needsAction: siteRows.length - siteMatched,
        missingPayroll: siteRows.filter(
          (row) => row.hasMissingPayroll || row.payrollMatchStatus === "not_found"
        ).length,
        disabledAd: siteRows.filter(
          (row) => row.hasDisabledAd || row.status === "disabled_entra_user"
        ).length,
        status: info.status === "ok" ? "active" : "error"
      };
    }
  } catch {
    // No upkeep-users.json available — perSite stays empty
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.mkdir(path.resolve("data/generated"), { recursive: true });

  const matched = count(rows, "matched");
  const missingUpkeepEmail = count(rows, "missing_upkeep_email");
  const missingAdUser = count(rows, "missing_entra_user");
  const disabledAdUser = rows.filter(
    (row) => row.hasDisabledAd || row.status === "disabled_entra_user"
  ).length;
  const terminatedPayrollUser = count(rows, "terminated_payroll_user");
  const missingPayrollUser = rows.filter(
    (row) => row.hasMissingPayroll || row.payrollMatchStatus === "not_found"
  ).length;
  const payrollNotChecked = rows.filter(
    (row) => row.payrollMatchStatus === "not_checked"
  ).length;
  const missingAdPayrollActive = rows.filter(
    (row) => row.status === "missing_entra_user" && row.payrollMatchStatus === "active"
  ).length;
  const missingAdPayrollNotFound = rows.filter(
    (row) =>
      row.status === "missing_entra_user" &&
      row.payrollMatchStatus === "not_found"
  ).length;
  const missingAdPayrollInactive = rows.filter(
    (row) => row.status === "missing_entra_user" && row.payrollMatchStatus === "inactive"
  ).length;
  const upkeepUsers = rows.length;
  const needsAction = rows.filter((row) => row.status !== "matched").length;
  const readinessPercent =
    upkeepUsers === 0 ? 0 : Math.round((matched / upkeepUsers) * 100);

  const summary = {
    generatedAt: payload.generatedAt ?? new Date().toISOString(),
    source: "All-site UpKeep export compared with local AD and payroll",
    totals: {
      upkeepUsers,
      matched,
      needsAction,
      missingUpkeepEmail,
      missingAdUser,
      disabledAdUser,
      terminatedPayrollUser,
      missingPayrollUser,
      payrollNotChecked,
      missingAdPayrollActive,
      missingAdPayrollInactive,
      missingAdPayrollNotFound
    },
    coverage: payload.upkeepCoverage ?? {
      expectedMinimum: 0,
      actual: upkeepUsers,
      status: "unknown",
      message: "No UpKeep coverage metadata found."
    },
    readinessPercent,
    chartSegments: [
      { label: "Matched", value: matched, className: "segment-good" },
      { label: "Terminated payroll", value: terminatedPayrollUser, className: "segment-danger" },
      { label: "No payroll match", value: count(rows, "missing_payroll_user"), className: "segment-risk" },
      { label: "Missing AD user", value: missingAdUser, className: "segment-risk" },
      { label: "Disabled AD user", value: disabledAdUser, className: "segment-watch" },
      { label: "Missing UpKeep email", value: missingUpkeepEmail, className: "segment-muted" }
    ],
    actionBuckets: [
      {
        label: "Ready for SSO",
        count: matched,
        tone: "good",
        description: "UpKeep account has a matching enabled AD identity."
      },
      {
        label: "Verify payroll identity",
        count: missingPayrollUser,
        tone: "danger",
        description: "No matching payroll record was found for the UpKeep account."
      },
      {
        label: "Disable in UpKeep",
        count: terminatedPayrollUser,
        tone: "danger",
        description: "Payroll status is inactive or terminated."
      },
      {
        label: "Run payroll reconciliation",
        count: payrollNotChecked,
        tone: "watch",
        description: "Payroll data was not checked, so these accounts are not yet ready."
      },
      {
        label: "Create or migrate AD identity",
        count: missingAdUser,
        tone: "risk",
        description: "UpKeep account did not match a local AD user."
      },
      {
        label: "Enable or replace AD identity",
        count: disabledAdUser,
        tone: "watch",
        description: "AD account exists but is disabled."
      },
      {
        label: "Correct UpKeep email",
        count: missingUpkeepEmail,
        tone: "muted",
        description: "UpKeep account is missing an email."
      }
    ],
    perSite
  };

  const contents = `export const userReadinessSummary = ${JSON.stringify(summary, null, 2)};\n`;
  await fs.writeFile(outputPath, contents, "utf8");
  await fs.writeFile(
    path.resolve("data/generated/user-readiness-summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8"
  );

  console.log(JSON.stringify(summary.totals, null, 2));
  console.log(`Wrote sanitized summary to ${outputPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
