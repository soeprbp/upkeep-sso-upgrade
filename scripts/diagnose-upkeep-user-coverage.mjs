import { loadDotEnv, requireEnv } from "../lib/env.mjs";
import { createSiteClients } from "../lib/upkeep-client.mjs";

loadDotEnv();

function summarizeResponse(data) {
  const results = data.results ?? data.result ?? [];
  return Array.isArray(results) ? results.length : 0;
}

async function publicSessionToken(email, password) {
  const response = await fetch("https://api.onupkeep.com/api/public/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: email, password })
  });
  const data = await response.json();
  return data.sessionToken;
}

async function countPublicWorkOrderUserRefs(sessionToken) {
  const userIds = new Set();
  let workordersScanned = 0;

  for (let offset = 0; offset < 2500; offset += 500) {
    const response = await fetch("https://api.onupkeep.com/api/public/workorders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken, limit: 500, offset })
    });
    const data = await response.json();
    const rows = Array.isArray(data) ? data : Object.values(data).filter((value) => value && typeof value === "object");
    workordersScanned += rows.length;

    for (const workOrder of rows) {
      for (const key of ["assignedById", "assignedToId", "completedById", "createdById", "updatedById"]) {
        if (workOrder[key]) {
          userIds.add(String(workOrder[key]));
        }
      }
    }

    if (rows.length < 500) {
      break;
    }
  }

  return { workordersScanned, uniqueReferencedUserIds: userIds.size };
}

async function main() {
  const clients = await createSiteClients();
  const expectedMinimum = Number(process.env.UPKEEP_EXPECTED_MIN_USERS ?? 117);
  const perSiteResults = {};

  for (const [siteName, client] of clients) {
    const pageTests = [];

    for (const limit of [25, 50, 100, 200]) {
      for (const offset of [0, 50, 54]) {
        try {
          const data = await client.request(`/users?limit=${limit}&offset=${offset}`);
          pageTests.push({ limit, offset, count: summarizeResponse(data), status: "ok" });
        } catch (error) {
          pageTests.push({
            limit,
            offset,
            count: 0,
            status: "error",
            message: error instanceof Error ? error.message.replace(/ - .*/, "") : String(error)
          });
        }
      }
    }

    const allUsers = await client.listPaginated("/users", { limit: 25, maxPages: 10 });
    let teams = [];
    let teamsStatus = "ok";
    try {
      teams = await client.listPaginated("/teams");
    } catch (error) {
      teamsStatus = "unavailable";
      console.warn(
        `  ${siteName}: teams unavailable (${error instanceof Error ? error.message.replace(/ - .*/, "") : error})`
      );
    }
    const teamUserIds = new Set();
    const teamCounts = [];
    for (const team of teams) {
      const teamUsers = await client.listPaginated(`/teams/${encodeURIComponent(team.id)}/users`);
      for (const user of teamUsers) {
        teamUserIds.add(user.id ?? user.email ?? JSON.stringify(user));
      }
      teamCounts.push({ team: team.name, count: teamUsers.length });
    }

    perSiteResults[siteName] = {
      v2UsersCount: allUsers.length,
      coverageStatus: allUsers.length < expectedMinimum ? "below_expected" : "ok",
      pageTests,
      teams: teams.length,
      teamsStatus,
      teamUserUnionCount: teamUserIds.size,
      teamCounts
    };

    console.log(`  ${siteName}: ${allUsers.length} users, ${teams.length} teams`);
  }

  // Public API test uses first site's credentials (diagnostic only)
  const firstEntry = clients.values().next().value;
  let publicWorkOrders = { workordersScanned: 0, uniqueReferencedUserIds: 0 };
  try {
    const email = requireEnv("UPKEEP_EMAIL");
    const password = requireEnv("UPKEEP_PASSWORD");
    const sessionToken = await publicSessionToken(email, password);
    publicWorkOrders = await countPublicWorkOrderUserRefs(sessionToken);
  } catch (error) {
    console.warn(`Public API test skipped: ${error instanceof Error ? error.message : error}`);
  }

  const totalUsers = Object.values(perSiteResults).reduce((sum, s) => sum + s.v2UsersCount, 0);

  console.log(
    JSON.stringify(
      {
        expectedMinimum,
        totalUsersAcrossSites: totalUsers,
        overallCoverageStatus: totalUsers < expectedMinimum ? "below_expected" : "ok",
        sites: Object.keys(perSiteResults).length,
        perSite: perSiteResults,
        publicWorkOrders
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
