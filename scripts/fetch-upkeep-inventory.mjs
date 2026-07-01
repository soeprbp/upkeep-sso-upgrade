import fs from "node:fs/promises";
import path from "node:path";
import { toCsv } from "../lib/csv.mjs";
import { UpKeepClient } from "../lib/upkeep-client.mjs";

function increment(map, key) {
  const normalized = key ? String(key).trim() : "(blank)";
  map.set(normalized, (map.get(normalized) ?? 0) + 1);
}

function summarizeCounts(map) {
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function normalizeLocation(location) {
  return {
    id: location.id ?? location._id ?? "",
    name: location.name ?? "",
    parentLocation: location.parentLocation ?? location.parent ?? "",
    raw: location
  };
}

async function main() {
  const outputDir = path.resolve("data/generated");
  await fs.mkdir(outputDir, { recursive: true });
  const client = UpKeepClient.fromEnv();

  const usersPayloadPath = path.join(outputDir, "upkeep-users.json");
  let users = [];
  try {
    const payload = JSON.parse(await fs.readFile(usersPayloadPath, "utf8"));
    users = payload.users ?? payload;
  } catch {
    users = await client.listPaginated(process.env.UPKEEP_USERS_ENDPOINT ?? "/users");
  }

  const accountTypes = new Map();
  const statuses = new Map();
  for (const user of users) {
    increment(accountTypes, user.role ?? user.accountType ?? user.userType);
    increment(statuses, user.status);
  }

  let locations = [];
  try {
    locations = (await client.listPaginated("/locations")).map(normalizeLocation);
  } catch (error) {
    locations = [];
    console.warn(`Location inventory skipped: ${error instanceof Error ? error.message : error}`);
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    accountTypes: summarizeCounts(accountTypes),
    statuses: summarizeCounts(statuses),
    locations: {
      total: locations.length,
      sampleNames: locations
        .map((location) => location.name)
        .filter(Boolean)
        .slice(0, 25)
    }
  };

  await fs.writeFile(
    path.join(outputDir, "upkeep-inventory-summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8"
  );
  await fs.writeFile(
    path.join(outputDir, "upkeep-locations.csv"),
    toCsv(locations, [{ key: "id" }, { key: "name" }, { key: "parentLocation" }]),
    "utf8"
  );

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
