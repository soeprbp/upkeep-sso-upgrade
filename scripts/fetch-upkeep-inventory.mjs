import fs from "node:fs/promises";
import path from "node:path";
import { toCsv } from "../lib/csv.mjs";
import { createSiteClients } from "../lib/upkeep-client.mjs";

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

  const clients = await createSiteClients();

  // Read existing users file if available (produced by fetch-upkeep-users.mjs)
  const usersPayloadPath = path.join(outputDir, "upkeep-users.json");
  let allUsers = [];
  try {
    const payload = JSON.parse(await fs.readFile(usersPayloadPath, "utf8"));
    allUsers = payload.users ?? payload;
  } catch {
    // Users file not available — will be empty, locations still fetched
  }

  // Aggregate account types and statuses across all sites
  const accountTypes = new Map();
  const statuses = new Map();
  for (const user of allUsers) {
    increment(accountTypes, user.role ?? user.accountType ?? user.userType);
    increment(statuses, user.status);
  }

  // Fetch locations per site
  const allLocations = [];
  const perSite = {};

  for (const [siteName, client] of clients) {
    // Per-site user counts from the users file
    const siteUsers = allUsers.filter((u) => u.site === siteName);
    const siteAccountTypes = new Map();
    const siteStatuses = new Map();
    for (const user of siteUsers) {
      increment(siteAccountTypes, user.role ?? user.accountType ?? user.userType);
      increment(siteStatuses, user.status);
    }

    let locations = [];
    try {
      locations = (await client.listPaginated("/locations")).map((loc) => ({
        ...normalizeLocation(loc),
        site: siteName
      }));
      allLocations.push(...locations);
      console.log(`  ${siteName}: ${siteUsers.length} users, ${locations.length} locations`);
    } catch (error) {
      locations = [];
      console.warn(`  ${siteName}: location fetch failed — ${error instanceof Error ? error.message : error}`);
    }

    perSite[siteName] = {
      users: siteUsers.length,
      locations: locations.length,
      accountTypes: summarizeCounts(siteAccountTypes),
      statuses: summarizeCounts(siteStatuses)
    };
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    accountTypes: summarizeCounts(accountTypes),
    statuses: summarizeCounts(statuses),
    perSite,
    locations: {
      total: allLocations.length,
      sampleNames: allLocations
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
    toCsv(allLocations, [{ key: "site" }, { key: "id" }, { key: "name" }, { key: "parentLocation" }]),
    "utf8"
  );

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
