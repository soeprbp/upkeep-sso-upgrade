import fs from "node:fs/promises";
import { parseCsv } from "./csv.mjs";
import { loadDotEnv, requireEnv } from "./env.mjs";

export function normalizeEntraUser(user) {
  const email = user.mail ?? user.userPrincipalName ?? user.email ?? "";
  return {
    id: user.id ?? "",
    email: String(email).trim().toLowerCase(),
    displayName: user.displayName ?? user.name ?? "",
    userPrincipalName: user.userPrincipalName ?? "",
    accountEnabled:
      user.accountEnabled === undefined ? true : String(user.accountEnabled).toLowerCase() !== "false",
    raw: user
  };
}

export async function readEntraUsersFromCsv(filePath) {
  const text = await fs.readFile(filePath, "utf8");
  return parseCsv(text).map((row) =>
    normalizeEntraUser({
      id: row.id,
      displayName: row.displayName ?? row.DisplayName,
      mail: row.mail ?? row.Mail,
      userPrincipalName: row.userPrincipalName ?? row.UserPrincipalName,
      accountEnabled: row.accountEnabled ?? row.AccountEnabled
    })
  );
}

export async function fetchEntraUsersFromGraph() {
  loadDotEnv();
  const tenantId = requireEnv("AZURE_TENANT_ID");
  const clientId = requireEnv("AZURE_CLIENT_ID");
  const clientSecret = requireEnv("AZURE_CLIENT_SECRET");
  const tokenBody = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
    scope: "https://graph.microsoft.com/.default"
  });

  const tokenResponse = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody
    }
  );
  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new Error(`Microsoft Graph token request failed: ${tokenResponse.status}`);
  }

  const users = [];
  let nextUrl =
    "https://graph.microsoft.com/v1.0/users?$select=id,displayName,userPrincipalName,mail,accountEnabled&$top=999";

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Microsoft Graph users request failed: ${response.status}`);
    }
    users.push(...(data.value ?? []));
    nextUrl = data["@odata.nextLink"] ?? null;
  }

  return users.map(normalizeEntraUser);
}
