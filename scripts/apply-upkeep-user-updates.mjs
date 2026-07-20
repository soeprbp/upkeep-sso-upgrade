import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { parseCsv } from "../lib/csv.mjs";
import { UpKeepClient, createSiteClients } from "../lib/upkeep-client.mjs";

const allowedFields = [
  "email",
  "accountType",
  "firstName",
  "lastName",
  "jobTitle",
  "phoneNumber",
  "isLocationBased"
];
const identifierFields = ["upkeepId", "id", "userId", "site"];
const reviewOnlyFields = ["sourceStatus", "suggestedLocationName", "notes"];

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

function pickPatchFields(row) {
  const fields = {};
  for (const field of allowedFields) {
    if (row[field] !== undefined && row[field] !== "") {
      fields[field] = row[field];
    }
  }
  return fields;
}

export function buildUpdatePlan(rows) {
  const knownFields = new Set([
    ...identifierFields,
    ...allowedFields,
    ...reviewOnlyFields
  ]);
  const unsupportedFields = [
    ...new Set(
      rows.flatMap((row) =>
        Object.entries(row)
          .filter(
            ([field, value]) =>
              !knownFields.has(field) && String(value).trim() !== ""
          )
          .map(([field]) => field)
      )
    )
  ];
  const locationReviewCount = rows.filter(
    (row) => String(row.suggestedLocationName ?? "").trim() !== ""
  ).length;
  const updates = rows
    .map((row) => ({
      upkeepId: row.upkeepId ?? row.id ?? row.userId,
      site: row.site ?? "",
      fields: pickPatchFields(row)
    }))
    .filter(
      (update) => update.upkeepId && Object.keys(update.fields).length > 0
    );

  return { locationReviewCount, unsupportedFields, updates };
}

async function main() {
  const filePath = argValue("--file");
  const apply = process.argv.includes("--apply");

  if (!filePath) {
    throw new Error(
      "Usage: npm run upkeep:apply-user-updates -- --file updates.csv [--apply]"
    );
  }

  const rows = parseCsv(await fs.readFile(filePath, "utf8"));
  const { locationReviewCount, unsupportedFields, updates } =
    buildUpdatePlan(rows);
  if (unsupportedFields.length > 0) {
    throw new Error(
      `Unsupported non-empty update columns: ${unsupportedFields.join(", ")}`
    );
  }

  if (!apply) {
    const siteCounts = {};
    for (const update of updates) {
      const site = update.site || "(unknown)";
      siteCounts[site] = (siteCounts[site] ?? 0) + 1;
    }

    console.log(
      JSON.stringify(
        {
          mode: "dry-run",
          updateCount: updates.length,
          perSite: siteCounts,
          locationReviewCount,
          message:
            locationReviewCount > 0
              ? "Resolve suggestedLocationName values before applying; location updates require a separately verified UpKeep field or ID."
              : "Re-run with --apply to PATCH these users in UpKeep.",
          updates
        },
        null,
        2
      )
    );
    return;
  }

  if (locationReviewCount > 0) {
    throw new Error(
      `Refusing to apply while ${locationReviewCount} suggestedLocationName value(s) remain unresolved.`
    );
  }

  const siteClients = await createSiteClients();
  const siteNames = [...siteClients.keys()];
  const results = [];
  const siteCounts = {};

  for (const update of updates) {
    const siteName = update.site;
    const client = siteName
      ? siteClients.get(siteName)
      : siteNames.length === 1
        ? siteClients.values().next().value
        : null;

    if (!client) {
      results.push({
        upkeepId: update.upkeepId,
        site: siteName,
        success: false,
        error: siteName
          ? `No authenticated client for site "${siteName}". Available: ${siteNames.join(", ")}`
          : `No site specified and multiple sites configured. Available: ${siteNames.join(", ")}`
      });
      continue;
    }

    const response = await client.patchUser(update.upkeepId, update.fields);
    results.push({
      upkeepId: update.upkeepId,
      site: siteName,
      success: response.success !== false,
      result: response.result ?? null
    });
    siteCounts[siteName] = (siteCounts[siteName] ?? 0) + 1;
  }

  console.log(
    JSON.stringify(
      { mode: "apply", updateCount: results.length, perSite: siteCounts, results },
      null,
      2
    )
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
