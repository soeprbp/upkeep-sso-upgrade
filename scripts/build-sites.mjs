import { spawnSync } from "node:child_process";
import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const buildCommand =
  process.platform === "win32" ? (process.env.ComSpec ?? "cmd.exe") : "npm";
const buildArguments =
  process.platform === "win32"
    ? ["/d", "/s", "/c", "npm run build"]
    : ["run", "build"];
const build = spawnSync(buildCommand, buildArguments, {
  cwd: root,
  env: { ...process.env, NEXT_PUBLIC_BASE_PATH: "" },
  stdio: "inherit"
});

if (build.error) {
  throw build.error;
}

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const dist = path.join(root, "dist");
await rm(dist, { recursive: true, force: true });
await mkdir(path.join(dist, "server"), { recursive: true });
await mkdir(path.join(dist, ".openai"), { recursive: true });

await cp(path.join(root, "out"), path.join(dist, "client"), {
  recursive: true
});
await cp(
  path.join(root, "worker", "sites-static.mjs"),
  path.join(dist, "server", "index.js")
);
await cp(
  path.join(root, ".openai", "hosting.json"),
  path.join(dist, ".openai", "hosting.json")
);

console.log("Sites artifact staged in dist/.");
