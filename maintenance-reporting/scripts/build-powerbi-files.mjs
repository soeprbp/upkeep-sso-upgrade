import fs from "node:fs/promises";
import path from "node:path";
import { toCsv } from "../../lib/csv.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..", "..");
const inputDir = path.join(projectRoot, "data", "generated", "maintenance-reporting");
const outputDir = path.join(inputDir, "powerbi");
await fs.mkdir(outputDir, { recursive: true });

const readJson = async (name) => JSON.parse(await fs.readFile(path.join(inputDir, name), "utf8"));
const workOrders = await readJson("work-orders.json");
const pmSchedules = await readJson("pm-schedules.json");
const coverage = await readJson("refresh-coverage.json");
const pmCoverage = await readJson("pm-coverage.json");
const summary = await readJson("maintenance-summary.json");
const columnsFor = (rows) => {
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  return keys.map((key) => ({ key, header: key }));
};

await fs.writeFile(
  path.join(outputDir, "fact-work-orders.csv"),
  toCsv(workOrders, columnsFor(workOrders)),
  "utf8"
);
await fs.writeFile(
  path.join(outputDir, "fact-pm-schedules.csv"),
  toCsv(pmSchedules, columnsFor(pmSchedules)),
  "utf8"
);
await fs.writeFile(
  path.join(outputDir, "fact-refresh-coverage.csv"),
  toCsv(coverage.coverage, columnsFor(coverage.coverage)),
  "utf8"
);
await fs.writeFile(
  path.join(outputDir, "fact-pm-coverage.csv"),
  toCsv(pmCoverage.coverage, columnsFor(pmCoverage.coverage)),
  "utf8"
);
await fs.writeFile(
  path.join(outputDir, "site-maintenance-summary.csv"),
  toCsv(summary.bySite, columnsFor(summary.bySite)),
  "utf8"
);

console.log(JSON.stringify({
  outputDir,
  files: [
    "fact-work-orders.csv",
    "fact-pm-schedules.csv",
    "fact-refresh-coverage.csv",
    "fact-pm-coverage.csv",
    "site-maintenance-summary.csv"
  ],
  workOrderRows: workOrders.length,
  pmScheduleRows: pmSchedules.length,
  workOrderPublishable: coverage.publishable,
  pmCoverageComplete: pmCoverage.completeCoverage
}, null, 2));
