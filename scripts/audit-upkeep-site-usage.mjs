import fs from "node:fs/promises";
import path from "node:path";

import { loadDotEnv } from "../lib/env.mjs";
import { createSiteClients } from "../lib/upkeep-client.mjs";

const NOW = Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;
const ENDPOINTS = {
  users: "/users",
  workOrders: "/work-orders",
  preventiveMaintenance: "/preventive-maintenance",
  assets: "/assets",
  locations: "/locations",
  parts: "/parts",
  purchaseOrders: "/purchase-orders",
  teams: "/teams",
  meters: "/meters"
};

function timestampFor(record) {
  const candidates = [
    record.dateCompleted,
    record.completedAt,
    record.lastLogin,
    record.lastLoginAt,
    record.lastActive,
    record.lastActiveAt,
    record.updatedAt,
    record.createdAt
  ];
  for (const value of candidates) {
    const timestamp = Date.parse(value);
    if (Number.isFinite(timestamp)) return timestamp;
  }
  return null;
}

function summarizeRecords(records) {
  const timestamps = records.map(timestampFor).filter(Number.isFinite);
  const latestTimestamp = timestamps.length ? Math.max(...timestamps) : null;
  return {
    count: records.length,
    latestActivity: latestTimestamp ? new Date(latestTimestamp).toISOString() : null,
    activityLast90Days: timestamps.filter((value) => NOW - value <= 90 * DAY_MS).length,
    activityLast365Days: timestamps.filter((value) => NOW - value <= 365 * DAY_MS).length,
    status: "ok"
  };
}

function classify(site) {
  const workOrders = site.resources.workOrders;
  const purchaseOrders = site.resources.purchaseOrders;
  if (workOrders.status === "ok" && workOrders.activityLast90Days > 0) {
    return { classification: "active", reason: "Work-order activity recorded in the last 90 days" };
  }
  if (workOrders.status === "ok" && workOrders.activityLast365Days > 0) {
    return { classification: "active_low_frequency", reason: "Work-order activity recorded in the last year" };
  }
  if (purchaseOrders.status === "ok" && purchaseOrders.activityLast365Days > 0) {
    return { classification: "review", reason: "Recent purchasing activity but no recent work orders" };
  }
  if (workOrders.status === "error" || purchaseOrders.status === "error") {
    return { classification: "review", reason: "A primary operational API resource check failed" };
  }
  return { classification: "dormant", reason: "No work-order or purchasing activity found in the last year" };
}

async function main() {
  loadDotEnv();
  process.env.UPKEEP_CACHE_ENABLED = "false";
  process.env.UPKEEP_INCLUDE_IGNORED_SITES = [
    process.env.UPKEEP_INCLUDE_IGNORED_SITES,
    "Demo Site",
    "Green Meadows Paper Company"
  ]
    .filter(Boolean)
    .join(",");

  const clients = await createSiteClients();
  const sites = [];

  for (const [siteName, client] of clients) {
    const site = { site: siteName, resources: {} };
    console.log(`Auditing ${siteName}...`);

    for (const [resourceName, endpoint] of Object.entries(ENDPOINTS)) {
      try {
        const records = await client.listPaginated(endpoint, { limit: 200, maxPages: 50 });
        site.resources[resourceName] = summarizeRecords(records);
      } catch (error) {
        site.resources[resourceName] = {
          count: null,
          latestActivity: null,
          activityLast90Days: null,
          activityLast365Days: null,
          status: "error",
          message: error instanceof Error ? error.message.replace(/ - .*/, "") : String(error)
        };
      }
    }

    Object.assign(site, classify(site));
    sites.push(site);
    console.log(`  ${site.classification}: ${site.reason}`);
  }

  const generatedAt = new Date().toISOString();
  const summary = {
    generatedAt,
    siteCount: sites.length,
    countsByClassification: Object.fromEntries(
      [...new Set(sites.map((site) => site.classification))].map((classification) => [
        classification,
        sites.filter((site) => site.classification === classification).length
      ])
    ),
    sites
  };
  const outputDir = path.resolve(process.cwd(), "outputs", "upkeep-site-usage");
  const outputPath = path.join(
    outputDir,
    `site-usage-audit-${generatedAt.replace(/[:.]/g, "-")}.json`
  );
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  console.log(`\nAudit manifest: ${outputPath}`);
  console.log(JSON.stringify(summary.countsByClassification));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
