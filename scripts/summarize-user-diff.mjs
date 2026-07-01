import fs from "node:fs/promises";
import path from "node:path";

function count(rows, status) {
  return rows.filter((row) => row.status === status).length;
}

async function main() {
  const inputPath = path.resolve(process.argv[2] ?? "data/generated/user-diff.json");
  const outputPath = path.resolve(process.argv[3] ?? "data/user-readiness-summary.js");
  const payload = JSON.parse(await fs.readFile(inputPath, "utf8"));
  const rows = payload.rows ?? [];
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.mkdir(path.resolve("data/generated"), { recursive: true });

  const matched = count(rows, "matched");
  const missingUpkeepEmail = count(rows, "missing_upkeep_email");
  const missingAdUser = count(rows, "missing_entra_user");
  const disabledAdUser = count(rows, "disabled_entra_user");
  const missingAdPayrollActive = rows.filter(
    (row) => row.status === "missing_entra_user" && row.payrollMatchStatus === "active"
  ).length;
  const missingAdPayrollNotFound = rows.filter(
    (row) =>
      row.status === "missing_entra_user" &&
      (!row.payrollMatchStatus || row.payrollMatchStatus === "not_checked_or_not_found")
  ).length;
  const missingAdPayrollInactive = rows.filter(
    (row) => row.status === "missing_entra_user" && row.payrollMatchStatus === "inactive"
  ).length;
  const upkeepUsers = rows.length;
  const needsAction = missingUpkeepEmail + missingAdUser + disabledAdUser;
  const readinessPercent =
    upkeepUsers === 0 ? 0 : Math.round((matched / upkeepUsers) * 100);

  const summary = {
    generatedAt: payload.generatedAt ?? new Date().toISOString(),
    source: "Local UpKeep export compared with local AD lookup",
    totals: {
      upkeepUsers,
      matched,
      needsAction,
      missingUpkeepEmail,
      missingAdUser,
      disabledAdUser,
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
    ]
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
