import fs from "node:fs/promises";
import path from "node:path";
import { createSiteClients } from "../../lib/upkeep-client.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..", "..");
const config = JSON.parse(
  await fs.readFile(path.join(projectRoot, "maintenance-reporting", "config", "site-allowlist.json"), "utf8")
);
const outputDir = path.join(projectRoot, "data", "generated", "maintenance-reporting");
await fs.mkdir(outputDir, { recursive: true });

const extractedAtUtc = new Date().toISOString();
const clients = await createSiteClients();
const pageSize = Number(process.env.UPKEEP_PAGE_SIZE ?? 200);
const maxPages = Number(process.env.UPKEEP_MAX_PAGES ?? 20);
const extractionDate = new Date(extractedAtUtc);
const currentYearStart = new Date(Date.UTC(extractionDate.getUTCFullYear(), 0, 1));
const workOrders = [];
const coverage = [];

for (const siteName of config.activeSites) {
  const client = clients.get(siteName);
  if (!client) {
    coverage.push({ site: siteName, status: "missing-client", rows: 0, extractedAtUtc });
    continue;
  }

  try {
    const rows = await client.listPaginated("/work-orders");
    for (const row of rows) {
      workOrders.push({
        sourceSite: siteName,
        sourceId: row.id ?? row._id ?? "",
        sourceEndpoint: "/work-orders",
        extractedAtUtc,
        sourceUpdatedAt: row.updatedAt ?? "",
        sourceStatus: row.status ?? "",
        workOrderNo: row.workOrderNo ?? "",
        title: row.title ?? "",
        category: row.category ?? "",
        priority: row.priority ?? "",
        dateCompleted: row.dateCompleted ?? "",
        completionPeriod: row.dateCompleted
          ? new Date(row.dateCompleted) >= currentYearStart
            ? "YTD Current"
            : "Historical"
          : "Not completed",
        createdAt: row.createdAt ?? "",
        location: row.objectLocationForWorkOrder ?? row.location ?? "",
        asset: row.asset ?? "",
        assignedToUsername: row.assignedToUsername ?? ""
      });
    }
    const ceilingSuspected = rows.length >= pageSize * maxPages;
    coverage.push({
      site: siteName,
      status: ceilingSuspected ? "success-ceiling-suspected" : "success",
      rows: rows.length,
      ceilingSuspected,
      extractedAtUtc
    });
  } catch (error) {
    coverage.push({
      site: siteName,
      status: "error",
      rows: 0,
      extractedAtUtc,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

const manifest = {
  extractedAtUtc,
  activeSites: config.activeSites,
  excludedSites: config.excludedSites,
  workOrderRows: workOrders.length,
  coverage,
  publishable: coverage.every((site) => site.status === "success") &&
    coverage.every((site) => !site.ceilingSuspected)
};

const terminalStatuses = new Set(["complete", "closed", "cancelled", "canceled"]);
const summaryBySite = new Map(config.activeSites.map((site) => [site, {
  site,
  totalWorkOrders: 0,
  openWorkOrders: 0,
  completedWorkOrders: 0,
  pmWorkOrders: 0,
  completedPMWorkOrders: 0
}]));
for (const row of workOrders) {
  const summary = summaryBySite.get(row.sourceSite);
  if (!summary) continue;
  summary.totalWorkOrders += 1;
  const status = String(row.sourceStatus).trim().toLowerCase();
  const isCompleted = Boolean(row.dateCompleted) || status === "complete";
  const isPM = String(row.category).trim().toLowerCase() === "preventative";
  if (isCompleted) summary.completedWorkOrders += 1;
  if (!terminalStatuses.has(status) && !isCompleted) summary.openWorkOrders += 1;
  if (isPM) summary.pmWorkOrders += 1;
  if (isPM && isCompleted) summary.completedPMWorkOrders += 1;
}
const summary = {
  extractedAtUtc,
  currentPeriod: `YTD Current (${extractionDate.getUTCFullYear()}-01-01 through ${extractedAtUtc.slice(0, 10)})`,
  publishable: manifest.publishable,
  totals: [...summaryBySite.values()].reduce((totals, site) => {
    for (const key of Object.keys(totals)) totals[key] += site[key];
    return totals;
  }, { totalWorkOrders: 0, openWorkOrders: 0, completedWorkOrders: 0, pmWorkOrders: 0, completedPMWorkOrders: 0 }),
  bySite: [...summaryBySite.values()],
  completedByPeriod: workOrders.reduce((periods, row) => {
    if (row.completionPeriod === "YTD Current") periods.ytdCurrent += 1;
    if (row.completionPeriod === "Historical") periods.historical += 1;
    return periods;
  }, { ytdCurrent: 0, historical: 0 }),
  notes: [
    "PM work orders are provisionally identified by category = Preventative.",
    "Open work excludes terminal statuses and rows with a completion date.",
    "A false publishable flag means the snapshot requires a pagination/backfill decision before production use."
  ]
};

await fs.writeFile(path.join(outputDir, "work-orders.json"), `${JSON.stringify(workOrders, null, 2)}\n`, "utf8");
await fs.writeFile(path.join(outputDir, "refresh-coverage.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
await fs.writeFile(path.join(outputDir, "maintenance-summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(JSON.stringify(manifest, null, 2));
