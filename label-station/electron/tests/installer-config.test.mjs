import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const expectedAppId = "com.welchpkg.upkeep-label-station";
const expectedGuid = "e510e08c-9759-5096-8c7d-1a970f4bb4f8";

test("installer identity and scope remain compatible with existing installs", async () => {
  const configUrl = new URL("../electron-builder.yml", import.meta.url);
  const config = await readFile(configUrl, "utf8");

  assert.match(config, new RegExp(`^appId: ${expectedAppId}$`, "m"));
  assert.match(config, new RegExp(`^  guid: ${expectedGuid}$`, "m"));
  assert.match(config, /^  oneClick: false$/m);
  assert.match(config, /^  perMachine: false$/m);
  assert.match(config, /^  selectPerMachineByDefault: false$/m);
  assert.match(config, /^  allowElevation: true$/m);
  assert.match(config, /^  allowToChangeInstallationDirectory: false$/m);
});

test("updates relaunch the app without deleting saved configuration", async () => {
  const configUrl = new URL("../electron-builder.yml", import.meta.url);
  const config = await readFile(configUrl, "utf8");

  assert.match(config, /^  runAfterFinish: true$/m);
  assert.match(config, /^  deleteAppDataOnUninstall: false$/m);
});
