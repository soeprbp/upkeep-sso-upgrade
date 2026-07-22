import fs from "node:fs/promises";
import path from "node:path";

import { loadDotEnv, parseUpKeepSites } from "../lib/env.mjs";
import { normalizeUpKeepUser, UpKeepClient } from "../lib/upkeep-client.mjs";

const TARGET_SITE = "Green Meadows Paper Company";
const APPLY = process.argv.includes("--apply");

function isActive(user) {
  const status = String(user.status ?? "").toLowerCase();
  return !user.raw?.deactivatedAt && !["disabled", "deactivated", "inactive"].includes(status);
}

function isEligible(user) {
  return user.email.includes("@") && !user.email.includes("+") && isActive(user);
}

async function fetchUsers(client) {
  return (await client.listPaginated("/users")).map(normalizeUpKeepUser);
}

async function main() {
  loadDotEnv();
  process.env.UPKEEP_CACHE_ENABLED = "false";
  process.env.UPKEEP_INCLUDE_IGNORED_SITES = [
    process.env.UPKEEP_INCLUDE_IGNORED_SITES,
    TARGET_SITE
  ]
    .filter(Boolean)
    .join(",");

  const site = parseUpKeepSites().find((entry) => entry.name === TARGET_SITE);
  if (!site?.siteUserId) {
    throw new Error(`${TARGET_SITE} is not configured with a site-scoped user id`);
  }

  const primaryClient = UpKeepClient.fromEnv();
  const siteToken = await primaryClient.switchSite(site.siteUserId);
  const client = new UpKeepClient({
    sessionToken: siteToken,
    cacheOptions: { enabled: false }
  });

  const before = await fetchUsers(client);
  const targets = before.filter(isEligible);
  const preservedPlusAccounts = before.filter((user) => user.email.includes("+"));

  console.log(`${TARGET_SITE}: ${before.length} total users`);
  console.log(`${targets.length} active non-plus accounts selected`);
  console.log(`${preservedPlusAccounts.length} plus-address accounts preserved`);

  const results = [];
  if (APPLY) {
    for (const user of targets) {
      try {
        await client.disableUser(user.id);
        results.push({ id: user.id, email: user.email, outcome: "disabled" });
        console.log(`Disabled ${user.email}`);
      } catch (error) {
        results.push({
          id: user.id,
          email: user.email,
          outcome: "error",
          message: error instanceof Error ? error.message : String(error)
        });
        console.error(`Failed ${user.email}`);
      }
    }
  }

  const after = APPLY ? await fetchUsers(client) : before;
  const afterById = new Map(after.map((user) => [user.id, user]));
  const verification = targets.map((user) => {
    const refreshedUser = afterById.get(user.id);
    const activeAfter = refreshedUser ? isActive(refreshedUser) : false;
    return {
      id: user.id,
      email: user.email,
      activeBefore: true,
      presentAfter: Boolean(refreshedUser),
      activeAfter,
      verifiedDeactivated: APPLY ? !activeAfter : false
    };
  });

  const timestamp = new Date().toISOString();
  const outputDir = path.resolve(process.cwd(), "outputs", "upkeep-user-status");
  const outputPath = path.join(
    outputDir,
    `green-meadows-deactivation-${timestamp.replace(/[:.]/g, "-")}.json`
  );
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    outputPath,
    `${JSON.stringify(
      {
        timestamp,
        mode: APPLY ? "apply" : "dry-run",
        site: TARGET_SITE,
        selectionRule: "active account with a valid email address that does not contain +",
        totalUsers: before.length,
        targetCount: targets.length,
        preservedPlusCount: preservedPlusAccounts.length,
        targets: targets.map(({ id, email, displayName, status }) => ({
          id,
          email,
          displayName,
          status
        })),
        results,
        verification
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  const failed = results.filter((result) => result.outcome === "error").length;
  const unverified = verification.filter((result) => APPLY && !result.verifiedDeactivated).length;
  console.log(`Audit manifest: ${outputPath}`);
  if (!APPLY) {
    console.log("Dry run only. Re-run with --apply to deactivate the selected accounts.");
  }
  if (failed || unverified) {
    throw new Error(`${failed} API failure(s); ${unverified} account(s) not verified deactivated`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
