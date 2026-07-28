import fs from "node:fs/promises";
import path from "node:path";
import { createSiteClients } from "../../lib/upkeep-client.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..", "..");
const config = JSON.parse(
  await fs.readFile(path.join(projectRoot, "maintenance-reporting", "config", "site-allowlist.json"), "utf8")
);
const outputDir = path.join(projectRoot, "data", "generated", "maintenance-reporting");
await fs.mkdir(outputDir, { recursive: true });

const clients = await createSiteClients();
const checkedAtUtc = new Date().toISOString();
const coverage = [];
const schedules = [];

for (const site of config.activeSites) {
  const client = clients.get(site);
  if (!client) {
    coverage.push({ site, status: "missing-client", rows: 0, checkedAtUtc });
    continue;
  }
  try {
    const rows = await client.listPaginated("/preventive-maintenance", { limit: 200, maxPages: 50 });
    for (const row of rows) {
      schedules.push({
        sourceSite: site,
        sourceId: row.id ?? row._id ?? "",
        sourceEndpoint: "/preventive-maintenance",
        extractedAtUtc: checkedAtUtc,
        name: row.name ?? row.title ?? "",
        status: row.status ?? "",
        frequency: row.frequency ?? "",
        nextDueDate: row.nextDueDate ?? row.nextDue ?? "",
        asset: row.asset ?? "",
        location: row.location ?? ""
      });
    }
    coverage.push({ site, status: "success", rows: rows.length, checkedAtUtc });
  } catch (error) {
    coverage.push({
      site,
      status: "error",
      rows: 0,
      checkedAtUtc,
      error: error instanceof Error ? error.message.replace(/ - .*/, "") : String(error)
    });
  }
}

const result = {
  checkedAtUtc,
  endpoint: "/preventive-maintenance",
  coverage,
  scheduleRows: schedules.length,
  completeCoverage: coverage.every((site) => site.status === "success")
};
await fs.writeFile(path.join(outputDir, "pm-coverage.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
await fs.writeFile(path.join(outputDir, "pm-schedules.json"), `${JSON.stringify(schedules, null, 2)}\n`, "utf8");
console.log(JSON.stringify(result, null, 2));
