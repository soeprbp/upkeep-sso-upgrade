import { UpKeepClient } from "../lib/upkeep-client.mjs";

async function main() {
  const client = UpKeepClient.fromEnv();
  await client.authenticate();
  const teams = await client.listPaginated("/teams", { limit: 1, maxPages: 1 });
  const usersEndpoint = process.env.UPKEEP_USERS_ENDPOINT ?? "/users";

  let usersProbe = null;
  try {
    usersProbe = await client.listPaginated(usersEndpoint, { limit: 1, maxPages: 1 });
  } catch (error) {
    usersProbe = { error: error instanceof Error ? error.message : String(error) };
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseUrl: client.baseUrl,
        auth: "success",
        teamsProbeCount: teams.length,
        usersEndpoint,
        usersProbeCount: Array.isArray(usersProbe) ? usersProbe.length : 0,
        usersProbeError: Array.isArray(usersProbe) ? null : usersProbe.error
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
