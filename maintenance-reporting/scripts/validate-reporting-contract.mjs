import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const configPath = path.join(root, "config", "site-allowlist.json");
const config = JSON.parse(await fs.readFile(configPath, "utf8"));

const active = new Set(config.activeSites);
const excluded = new Set(config.excludedSites.map((site) => site.name));
if (active.size !== 14) throw new Error(`Expected 14 active sites; found ${active.size}`);
if (active.size !== config.activeSites.length) throw new Error("Duplicate active site names found");
for (const site of active) {
  if (excluded.has(site)) throw new Error(`Site appears in both active and excluded lists: ${site}`);
}
for (const required of ["Green Meadows Paper Company", "Lexington", "Marion", "Nashville Box", "Demo Site"]) {
  if (!excluded.has(required)) throw new Error(`Required exclusion missing: ${required}`);
}

console.log(JSON.stringify({ valid: true, activeSites: [...active], excludedSites: [...excluded] }, null, 2));
