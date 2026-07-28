import fs from "node:fs";
import path from "node:path";

export const DEFAULT_IGNORED_UPKEEP_SITES = [
  "Demo Site",
  "Green Meadows Paper Company"
];

function explicitlyIncludedIgnoredSites() {
  const included = new Set(
    String(process.env.UPKEEP_INCLUDE_IGNORED_SITES ?? "")
      .split(",")
      .map((name) => name.trim().toLowerCase())
      .filter(Boolean)
  );
  if (
    String(process.env.UPKEEP_INCLUDE_DEMO_SITE ?? "")
      .trim()
      .toLowerCase() === "true"
  ) {
    included.add("demo site");
  }
  return included;
}

export function isUpKeepSiteIgnored(siteName) {
  const normalizedName = String(siteName ?? "")
    .trim()
    .toLowerCase();
  const ignoredSites = new Set(
    DEFAULT_IGNORED_UPKEEP_SITES.map((name) => name.toLowerCase())
  );
  return (
    ignoredSites.has(normalizedName) &&
    !explicitlyIncludedIgnoredSites().has(normalizedName)
  );
}

export function isUpKeepServiceAccount(email) {
  return String(email ?? "")
    .trim()
    .includes("+");
}

export function loadDotEnv(file = ".env.local") {
  const fullPath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(fullPath)) {
    return;
  }

  const lines = fs.readFileSync(fullPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [rawKey, ...rawValue] = trimmed.split("=");
    const key = rawKey.trim();
    const value = rawValue
      .join("=")
      .trim()
      .replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Parse UPKEEP_SITES env var into an array of site configs.
 *
 * Format: "SiteName:siteUserId,SiteName:siteUserId,..."
 * The siteUserId is the per-site user ID returned by the UpKeep GraphQL
 * UserSites query (e.g. "5dTBKo1bAg"). Primary email/password come from
 * UPKEEP_EMAIL + UPKEEP_PASSWORD; the switch-site endpoint is used to
 * obtain a session token scoped to each site.
 *
 * Falls back to single-site mode using UPKEEP_EMAIL / UPKEEP_PASSWORD
 * if UPKEEP_SITES is not set.
 *
 * @returns {Array<{ name: string, siteUserId: string }>}
 */
export function parseUpKeepSites() {
  loadDotEnv();

  const sitesVar = process.env.UPKEEP_SITES;
  const email = process.env.UPKEEP_EMAIL;

  if (sitesVar) {
    if (!email) {
      throw new Error(
        "UPKEEP_EMAIL is required when UPKEEP_SITES is set (used for primary auth)"
      );
    }

    const sites = sitesVar.split(",").map((entry) => {
      const trimmed = entry.trim();
      const colonIdx = trimmed.indexOf(":");
      if (colonIdx === -1) {
        throw new Error(
          `Invalid UPKEEP_SITES entry "${trimmed}" — expected format "SiteName:siteUserId"`
        );
      }
      const name = trimmed.slice(0, colonIdx).trim();
      const siteUserId = trimmed.slice(colonIdx + 1).trim();
      if (!name || !siteUserId) {
        throw new Error(
          `Invalid UPKEEP_SITES entry "${trimmed}" — both name and siteUserId are required`
        );
      }
      return { name, siteUserId };
    });

    return sites.filter((site) => !isUpKeepSiteIgnored(site.name));
  }

  // Backward compat: single-site from UPKEEP_EMAIL + UPKEEP_PASSWORD
  if (email && process.env.UPKEEP_PASSWORD) {
    return [{ name: "default", siteUserId: "" }];
  }

  return [];
}
