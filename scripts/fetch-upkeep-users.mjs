import fs from "node:fs/promises";
import path from "node:path";
import { toCsv } from "../lib/csv.mjs";
import { normalizeUpKeepUser, createSiteClients } from "../lib/upkeep-client.mjs";

const columns = [
  { key: "site", header: "site" },
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

  const clients = await createSiteClients();
  const allUsers = [];
  const siteSummaries = {};

  for (const [siteName, client] of clients) {
    try {
      const rawUsers = await client.listPaginated(endpoint);
      const users = rawUsers.map((u) => ({
        ...normalizeUpKeepUser(u),
        site: siteName
      }));
      allUsers.push(...users);
      siteSummaries[siteName] = { count: users.length, status: "ok" };
      console.log(`  ${siteName}: ${users.length} users`);
    } catch (error) {
      siteSummaries[siteName] = {
        count: 0,
        status: "error",
        message: error instanceof Error ? error.message : String(error)
      };
      console.warn(`  ${siteName}: FAILED — ${error instanceof Error ? error.message : error}`);
    }
  }

  const timestamp = new Date().toISOString();
  const expectedMinimum = Number(process.env.UPKEEP_EXPECTED_MIN_USERS ?? 0);
  const coverage = {
    expectedMinimum,
    actual: allUsers.length,
    status: expectedMinimum > 0 && allUsers.length < expectedMinimum ? "below_expected" : "ok",
    message:
      expectedMinimum > 0 && allUsers.length < expectedMinimum
        ? `UpKeep returned ${allUsers.length} users across ${clients.size} site(s), below expected minimum ${expectedMinimum}. Verify each site's API credentials have full visibility.`
        : `UpKeep user export met the configured minimum across ${clients.size} site(s).`
  };

  await fs.writeFile(
    path.join(outputDir, "upkeep-users.json"),
    `${JSON.stringify({ extractedAt: timestamp, endpoint, sites: siteSummaries, coverage, users: allUsers }, null, 2)}\n`,
    "utf8"
  );
  await fs.writeFile(
    path.join(outputDir, "upkeep-users.csv"),
    toCsv(allUsers, columns),
    "utf8"
  );

  console.log(`\nFetched ${allUsers.length} total UpKeep users from ${clients.size} site(s).`);
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
