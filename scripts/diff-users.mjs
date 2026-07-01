import fs from "node:fs/promises";
import path from "node:path";
import { toCsv } from "../lib/csv.mjs";
import { fetchEntraUsersFromGraph, readEntraUsersFromCsv } from "../lib/entra-users.mjs";
import { diffUsers, summarizeDiff } from "../lib/user-diff.mjs";

const columns = [
  { key: "status" },
  { key: "action" },
  { key: "upkeepId" },
  { key: "upkeepEmail" },
  { key: "upkeepDisplayName" },
  { key: "upkeepRole" },
  { key: "upkeepStatus" },
  { key: "entraId" },
  { key: "entraEmail" },
  { key: "entraDisplayName" },
  { key: "entraAccountEnabled" }
];

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

async function readUpKeepUsers(filePath) {
  const payload = JSON.parse(await fs.readFile(filePath, "utf8"));
  return Array.isArray(payload) ? payload : payload.users ?? [];
}

async function main() {
  const upkeepPath = path.resolve(
    argValue("--upkeep") ?? "data/generated/upkeep-users.json"
  );
  const entraCsvPath = argValue("--entra-csv");
  const outputDir = path.resolve(process.cwd(), "data/generated");
  await fs.mkdir(outputDir, { recursive: true });

  const upkeepUsers = await readUpKeepUsers(upkeepPath);
  const entraUsers = entraCsvPath
    ? await readEntraUsersFromCsv(path.resolve(entraCsvPath))
    : await fetchEntraUsersFromGraph();

  const rows = diffUsers(upkeepUsers, entraUsers);
  const summary = summarizeDiff(rows);
  const timestamp = new Date().toISOString();

  await fs.writeFile(
    path.join(outputDir, "user-diff.json"),
    `${JSON.stringify({ generatedAt: timestamp, summary, rows }, null, 2)}\n`,
    "utf8"
  );
  await fs.writeFile(path.join(outputDir, "user-diff.csv"), toCsv(rows, columns), "utf8");

  console.log(JSON.stringify(summary, null, 2));
  console.log(`Wrote ${path.join(outputDir, "user-diff.json")}`);
  console.log(`Wrote ${path.join(outputDir, "user-diff.csv")}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
