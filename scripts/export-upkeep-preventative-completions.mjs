import fs from "node:fs/promises";
import path from "node:path";
import { toCsv } from "../lib/csv.mjs";
import { UpKeepClient } from "../lib/upkeep-client.mjs";

function toMonthKey(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function startOfUtcMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addUtcMonths(date, months) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function withinRange(isoString, start, endExclusive) {
  if (!isoString) {
    return false;
  }

  const value = new Date(isoString);
  return value >= start && value < endExclusive;
}

async function main() {
  const now = new Date();
  const endExclusive = startOfUtcMonth(now);
  const start = addUtcMonths(endExclusive, -1);
  const monthKey = toMonthKey(start);

  const client = UpKeepClient.fromEnv();
  const workOrders = await client.listPaginated("/work-orders", { limit: 200, maxPages: 20 });

  const rows = workOrders
    .filter((workOrder) => String(workOrder.status ?? "").toLowerCase() === "complete")
    .filter((workOrder) => String(workOrder.category ?? "").toLowerCase() === "preventative")
    .filter((workOrder) => withinRange(workOrder.dateCompleted ?? workOrder.updatedAt, start, endExclusive))
    .map((workOrder) => ({
      workOrderNo: workOrder.workOrderNo ?? "",
      id: workOrder.id ?? "",
      title: workOrder.title ?? "",
      description: workOrder.description ?? "",
      category: workOrder.category ?? "",
      status: workOrder.status ?? "",
      dateCompleted: workOrder.dateCompleted ?? "",
      createdAt: workOrder.createdAt ?? "",
      updatedAt: workOrder.updatedAt ?? "",
      completedByUsername: workOrder.completedByUsername ?? "",
      assignedToUsername: workOrder.assignedToUsername ?? "",
      assignedByUsername: workOrder.assignedByUsername ?? "",
      location: workOrder.objectLocationForWorkOrder ?? workOrder.location ?? "",
      asset: workOrder.asset ?? "",
      priority: workOrder.priority ?? "",
      time: workOrder.time ?? "",
      laborCost: workOrder.laborCost ?? ""
    }))
    .sort((left, right) => String(left.dateCompleted).localeCompare(String(right.dateCompleted)));

  const outputDir = path.resolve(process.cwd(), "data/generated");
  await fs.mkdir(outputDir, { recursive: true });

  const fileName = `upkeep-preventative-completions-${monthKey}.csv`;
  const outputPath = path.join(outputDir, fileName);
  const columns = [
    { key: "workOrderNo", header: "workOrderNo" },
    { key: "id", header: "id" },
    { key: "title", header: "title" },
    { key: "description", header: "description" },
    { key: "category", header: "category" },
    { key: "status", header: "status" },
    { key: "dateCompleted", header: "dateCompleted" },
    { key: "createdAt", header: "createdAt" },
    { key: "updatedAt", header: "updatedAt" },
    { key: "completedByUsername", header: "completedByUsername" },
    { key: "assignedToUsername", header: "assignedToUsername" },
    { key: "assignedByUsername", header: "assignedByUsername" },
    { key: "location", header: "location" },
    { key: "asset", header: "asset" },
    { key: "priority", header: "priority" },
    { key: "time", header: "time" },
    { key: "laborCost", header: "laborCost" }
  ];

  await fs.writeFile(outputPath, toCsv(rows, columns), "utf8");

  console.log(
    `Exported ${rows.length} completed Preventative work orders for ${monthKey} to ${outputPath}`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
