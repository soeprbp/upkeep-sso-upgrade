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
  const expectedMinimum = Number(process.env.UPKEEP_EXPECTED_MIN_USERS ?? 0);
  const coverage = {
    expectedMinimum,
    actual: users.length,
    status: expectedMinimum > 0 && users.length < expectedMinimum ? "below_expected" : "ok",
    message:
      expectedMinimum > 0 && users.length < expectedMinimum
        ? `UpKeep returned ${users.length} users, below expected minimum ${expectedMinimum}. Verify API credentials have whole-environment visibility.`
        : "UpKeep user export met the configured minimum."
  };

  await fs.writeFile(
    path.join(outputDir, "upkeep-users.json"),
    `${JSON.stringify({ extractedAt: timestamp, endpoint, coverage, users }, null, 2)}\n`,
    "utf8"
  );
  await fs.writeFile(
    path.join(outputDir, "upkeep-users.csv"),
    toCsv(users, columns),
    "utf8"
  );

  console.log(`Fetched ${users.length} UpKeep users from ${endpoint}.`);
  if (coverage.status !== "ok") {
    console.warn(coverage.message);
  }
  console.log(`Wrote ${path.join(outputDir, "upkeep-users.json")}`);
  console.log(`Wrote ${path.join(outputDir, "upkeep-users.csv")}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
