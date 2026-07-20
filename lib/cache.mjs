import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_CACHE_DIR = path.resolve(process.cwd(), ".cache", "upkeep");
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

export class ResponseCache {
  constructor(options = {}) {
    this.cacheDir = options.cacheDir ?? DEFAULT_CACHE_DIR;
    this.ttlMs = Number(options.ttlMs ?? process.env.UPKEEP_CACHE_TTL_MS ?? DEFAULT_TTL_MS);
    this.enabled = options.enabled ?? process.env.UPKEEP_CACHE_ENABLED !== "false";
  }

  /**
   * Build a cache key from request details.
   */
  static keyFor(method, url, body) {
    const input = body ? `${method}:${url}:${body}` : `${method}:${url}`;
    return crypto.createHash("sha256").update(input).digest("hex").slice(0, 16);
  }

  /**
   * Read a cached response if it exists and hasn't expired.
   * Returns null on miss.
   */
  async get(method, url, body) {
    if (!this.enabled || method !== "GET") {
      return null;
    }

    const key = ResponseCache.keyFor(method, url, body);
    const filePath = path.join(this.cacheDir, `${key}.json`);

    try {
      const raw = await fs.readFile(filePath, "utf8");
      const entry = JSON.parse(raw);
      const age = Date.now() - entry.cachedAt;

      if (age > this.ttlMs) {
        await fs.unlink(filePath).catch(() => {});
        return null;
      }

      return entry.data;
    } catch {
      return null;
    }
  }

  /**
   * Store a response in the cache.
   */
  async set(method, url, data, body) {
    if (!this.enabled || method !== "GET") {
      return;
    }

    const key = ResponseCache.keyFor(method, url, body);
    const filePath = path.join(this.cacheDir, `${key}.json`);

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(
      filePath,
      JSON.stringify({ cachedAt: Date.now(), url, data }),
      "utf8"
    );
  }

  /**
   * Clear all cached responses.
   */
  async clear() {
    const files = await fs.readdir(this.cacheDir).catch(() => []);
    await Promise.all(
      files
        .filter((f) => f.endsWith(".json"))
        .map((f) => fs.unlink(path.join(this.cacheDir, f)).catch(() => {}))
    );
  }
}
