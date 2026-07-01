import { loadDotEnv, requireEnv } from "./env.mjs";

export const DEFAULT_UPKEEP_BASE_URL = "https://api.onupkeep.com/api/v2";

export class UpKeepClient {
  constructor(options = {}) {
    this.baseUrl =
      options.baseUrl ?? process.env.UPKEEP_API_BASE_URL ?? DEFAULT_UPKEEP_BASE_URL;
    this.timeoutMs = Number(options.timeoutMs ?? process.env.UPKEEP_TIMEOUT_MS ?? 15000);
    this.sessionToken = options.sessionToken ?? process.env.UPKEEP_SESSION_TOKEN ?? null;
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

  async request(endpoint, options = {}) {
    const token = await this.authenticate();
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

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
    role: user.role ?? user.accountType ?? user.userType ?? "",
    status: user.status ?? (user.isDisabled ? "disabled" : "active"),
    raw: user
  };
}
