import fs from "node:fs/promises";
import { parseCsv } from "../lib/csv.mjs";
import { UpKeepClient } from "../lib/upkeep-client.mjs";

const allowedFields = [
  "email",
  "accountType",
  "firstName",
  "lastName",
  "jobTitle",
  "phoneNumber",
  "isLocationBased"
];

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

async function main() {
  const filePath = argValue("--file");
  const apply = process.argv.includes("--apply");

  if (!filePath) {
    throw new Error(
      "Usage: npm run upkeep:apply-user-updates -- --file updates.csv [--apply]"
    );
  }

  const rows = parseCsv(await fs.readFile(filePath, "utf8"));
  const updates = rows
    .map((row) => ({
      upkeepId: row.upkeepId ?? row.id ?? row.userId,
      fields: pickPatchFields(row)
    }))
    .filter((update) => update.upkeepId && Object.keys(update.fields).length > 0);

  if (!apply) {
    console.log(
      JSON.stringify(
        {
          mode: "dry-run",
          updateCount: updates.length,
          message: "Re-run with --apply to PATCH these users in UpKeep.",
          updates
        },
        null,
        2
      )
    );
    return;
  }

  const client = UpKeepClient.fromEnv();
  const results = [];
  for (const update of updates) {
    const response = await client.patchUser(update.upkeepId, update.fields);
    results.push({
      upkeepId: update.upkeepId,
      success: response.success !== false,
      result: response.result ?? null
    });
  }

  console.log(JSON.stringify({ mode: "apply", updateCount: results.length, results }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
