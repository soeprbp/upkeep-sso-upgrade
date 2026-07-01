import fs from "node:fs/promises";
import path from "node:path";
import { toCsv } from "../lib/csv.mjs";
import { normalizeUpKeepUser, UpKeepClient } from "../lib/upkeep-client.mjs";

const columns = [
  { key: "id", header: "id" },
  { key: "email", header: "email" },
  { key: "displayName", header: "displayName" },
  { key: "firstName", header: "firstName" },
  { key: "lastName", header: "lastName" },
  { key: "jobTitle", header: "jobTitle" },
  { key: "accountType", header: "accountType" },
  { key: "role", header: "role" },
  { key: "status", header: "status" }
];

async function main() {
  const endpoint = process.argv[2] ?? process.env.UPKEEP_USERS_ENDPOINT ?? "/users";
  const outputDir = path.resolve(process.cwd(), "data/generated");
  await fs.mkdir(outputDir, { recursive: true });

  const client = UpKeepClient.fromEnv();
  const users = (await client.listPaginated(endpoint)).map(normalizeUpKeepUser);
  const timestamp = new Date().toISOString();

  await fs.writeFile(
    path.join(outputDir, "upkeep-users.json"),
    `${JSON.stringify({ extractedAt: timestamp, endpoint, users }, null, 2)}\n`,
    "utf8"
  );
  await fs.writeFile(
    path.join(outputDir, "upkeep-users.csv"),
    toCsv(users, columns),
    "utf8"
  );

  console.log(`Fetched ${users.length} UpKeep users from ${endpoint}.`);
  console.log(`Wrote ${path.join(outputDir, "upkeep-users.json")}`);
  console.log(`Wrote ${path.join(outputDir, "upkeep-users.csv")}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
