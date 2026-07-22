import path from "node:path";
import { loadDotEnv, requireEnv, parseUpKeepSites } from "./env.mjs";
import { ResponseCache } from "./cache.mjs";

export const DEFAULT_UPKEEP_BASE_URL = "https://api.onupkeep.com/api/v2";

export class UpKeepClient {
  constructor(options = {}) {
    this.baseUrl =
      options.baseUrl ?? process.env.UPKEEP_API_BASE_URL ?? DEFAULT_UPKEEP_BASE_URL;
    this.timeoutMs = Number(options.timeoutMs ?? process.env.UPKEEP_TIMEOUT_MS ?? 15000);
    this.sessionToken = options.sessionToken ?? process.env.UPKEEP_SESSION_TOKEN ?? null;
    this.cache = options.cache ?? new ResponseCache(options.cacheOptions ?? {});
  }

  static fromEnv() {
    loadDotEnv();
    return new UpKeepClient();
  }

  async authenticate() {
    if (this.sessionToken) {
      return this.sessionToken;
    }

    const email = requireEnv("UPKEEP_EMAIL");
    const password = requireEnv("UPKEEP_PASSWORD");
    const body = new URLSearchParams({ email, password });
    const response = await this.fetchWithTimeout(`${this.baseUrl}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });

    const data = await this.readJson(response);
    if (!response.ok || !data.success || !data.result?.sessionToken) {
      throw new Error(`UpKeep authentication failed: ${this.describeFailure(response, data)}`);
    }

    this.sessionToken = data.result.sessionToken;
    return this.sessionToken;
  }

  /**
   * Switch the session to a different site using the switch-site endpoint.
   * Returns a NEW session token scoped to the target site.
   *
   * @param {string} siteUserId — the per-site user ID from UserSites (e.g. "0lfHXKmhQj")
   * @returns {Promise<string>} — new session token for the target site
   */
  async switchSite(siteUserId) {
    const token = await this.authenticate();
    const response = await this.fetchWithTimeout(
      "https://api.onupkeep.com/api/v1/auth/switch-site",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Session-Token": token
        },
        body: JSON.stringify({ id: siteUserId })
      }
    );

    const data = await this.readJson(response);
    if (!response.ok || !data.success || !data.result?.sessionToken) {
      throw new Error(`switch-site failed for ${siteUserId}: ${this.describeFailure(response, data)}`);
    }

    return data.result.sessionToken;
  }

  async request(endpoint, options = {}) {
    const token = await this.authenticate();
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const method = (options.method ?? "GET").toUpperCase();
    const body = options.body ? String(options.body) : undefined;

    // Check cache for GET requests
    const cached = await this.cache.get(method, url, body);
    if (cached !== null) {
      return cached;
    }

    const response = await this.fetchWithTimeout(url, {
      ...options,
      headers: {
        "Session-Token": token,
        ...(options.headers ?? {})
      }
    });
    const data = await this.readJson(response);

    if (!response.ok || data.success === false) {
      throw new Error(`UpKeep request failed for ${endpoint}: ${this.describeFailure(response, data)}`);
    }

    // Cache successful GET responses
    await this.cache.set(method, url, data, body);

    return data;
  }

  async listPaginated(endpoint, options = {}) {
    const limit = Number(options.limit ?? process.env.UPKEEP_PAGE_SIZE ?? 200);
    const maxPages = Number(options.maxPages ?? process.env.UPKEEP_MAX_PAGES ?? 20);
    const results = [];

    for (let page = 0; page < maxPages; page += 1) {
      const offset = page * limit;
      const separator = endpoint.includes("?") ? "&" : "?";
      const data = await this.request(`${endpoint}${separator}limit=${limit}&offset=${offset}`);
      const pageResults = Array.isArray(data.results)
        ? data.results
        : Array.isArray(data.result)
          ? data.result
          : Array.isArray(data)
            ? data
            : [];

      results.push(...pageResults);
      if (pageResults.length < limit) {
        break;
      }
    }

    return results;
  }

  async patchUser(userId, fields) {
    if (!userId) {
      throw new Error("patchUser requires a user id");
    }

    const body = new URLSearchParams();
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined && value !== "") {
        body.set(key, String(value));
      }
    }

    return this.request(`/users/${encodeURIComponent(userId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });
  }

  async disableUser(userId) {
    return this.setUserEnabled(userId, false);
  }

  async enableUser(userId) {
    return this.setUserEnabled(userId, true);
  }

  async setUserEnabled(userId, enabled) {
    if (!userId) {
      throw new Error("setUserEnabled requires a user id");
    }

    const apiOrigin = new URL(this.baseUrl).origin;
    return this.request(`${apiOrigin}/api/v1/users/${enabled ? "enable" : "disable"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId })
    });
  }

  async fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  async readJson(response) {
    const text = await response.text();
    if (!text) {
      return {};
    }
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }

  describeFailure(response, data) {
    const detail = data?.message ?? data?.error ?? data?.raw ?? JSON.stringify(data);
    return `${response.status} ${response.statusText}${detail ? ` - ${detail}` : ""}`;
  }
}

/**
 * Create authenticated UpKeepClient instances for all configured sites.
 *
 * Authenticates ONCE with UPKEEP_EMAIL/UPKEEP_PASSWORD, then uses
 * the switch-site endpoint to get a session token scoped to each site.
 *
 * Returns a Map<siteName, UpKeepClient> with each client authenticated
 * and ready to make API requests.
 *
 * Uses parseUpKeepSites() from env.mjs — supports both multi-site
 * (UPKEEP_SITES=name:siteUserId) and single-site (UPKEEP_EMAIL) configs.
 */
export async function createSiteClients(options = {}) {
  const sites = parseUpKeepSites();
  if (sites.length === 0) {
    throw new Error(
      "No UpKeep sites configured. Set UPKEEP_SITES or UPKEEP_EMAIL + UPKEEP_PASSWORD."
    );
  }

  // Auth once with primary credentials
  const primaryClient = new UpKeepClient({
    baseUrl: options.baseUrl,
    timeoutMs: options.timeoutMs,
  });
  await primaryClient.authenticate();

  const clients = new Map();

  for (const site of sites) {
    if (!site.siteUserId) {
      // Single-site mode: use primary client directly
      clients.set(site.name, primaryClient);
      continue;
    }

    const newToken = await primaryClient.switchSite(site.siteUserId);
    const cacheDir = path.resolve(
      process.cwd(),
      ".cache",
      "upkeep",
      site.name.replace(/[^a-zA-Z0-9_-]/g, "_")
    );
    const siteClient = new UpKeepClient({
      baseUrl: options.baseUrl,
      timeoutMs: options.timeoutMs,
      sessionToken: newToken,
      cacheOptions: { cacheDir },
    });
    clients.set(site.name, siteClient);
  }

  return clients;
}

export function normalizeUpKeepUser(user) {
  const email =
    user.email ??
    user.username ??
    user.userName ??
    user.loginEmail ??
    user.contactEmail ??
    "";
  const firstName = user.firstName ?? user.first_name ?? "";
  const lastName = user.lastName ?? user.last_name ?? "";
  const displayName =
    user.name ??
    user.fullName ??
    `${firstName} ${lastName}`.trim() ??
    email;

  return {
    id: user.id ?? user._id ?? "",
    email: String(email).trim().toLowerCase(),
    displayName,
    firstName,
    lastName,
    jobTitle: user.jobTitle ?? user.title ?? "",
    accountType: user.accountType ?? user.role ?? user.userType ?? "",
    role: user.role ?? user.accountType ?? user.userType ?? "",
    status:
      user.status ??
      (user.isActive === false || user.isDisabled ? "inactive" : "active"),
    raw: user
  };
}
