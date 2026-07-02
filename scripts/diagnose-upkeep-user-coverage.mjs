import { loadDotEnv, requireEnv } from "../lib/env.mjs";
import { UpKeepClient } from "../lib/upkeep-client.mjs";

loadDotEnv();

function summarizeResponse(data) {
  const results = data.results ?? data.result ?? [];
  return Array.isArray(results) ? results.length : 0;
}

async function publicSessionToken() {
  const email = requireEnv("UPKEEP_EMAIL");
  const password = requireEnv("UPKEEP_PASSWORD");
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
  const client = UpKeepClient.fromEnv();
  const expectedMinimum = Number(process.env.UPKEEP_EXPECTED_MIN_USERS ?? 117);
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
  const teams = await client.listPaginated("/teams");
  const teamUserIds = new Set();
  const teamCounts = [];
  for (const team of teams) {
    const users = await client.listPaginated(`/teams/${encodeURIComponent(team.id)}/users`);
    for (const user of users) {
      teamUserIds.add(user.id ?? user.email ?? JSON.stringify(user));
    }
    teamCounts.push({ team: team.name, count: users.length });
  }

  const sessionToken = await publicSessionToken();
  const publicWorkOrders = await countPublicWorkOrderUserRefs(sessionToken);

  console.log(
    JSON.stringify(
      {
        expectedMinimum,
        v2UsersCount: allUsers.length,
        coverageStatus: allUsers.length < expectedMinimum ? "below_expected" : "ok",
        pageTests,
        teams: teams.length,
        teamUserUnionCount: teamUserIds.size,
        teamCounts,
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
