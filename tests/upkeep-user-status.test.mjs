import assert from "node:assert/strict";
import test from "node:test";

import { UpKeepClient } from "../lib/upkeep-client.mjs";

class RecordingUpKeepClient extends UpKeepClient {
  async request(endpoint, options) {
    return { endpoint, options };
  }
}

test("disables a user through the web application's status endpoint", async () => {
  const client = new RecordingUpKeepClient();
  const result = await client.disableUser("user-123");

  assert.equal(result.endpoint, "https://api.onupkeep.com/api/v1/users/disable");
  assert.equal(result.options.method, "POST");
  assert.equal(result.options.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(result.options.body), { id: "user-123" });
});

test("enables a user through the inverse status endpoint", async () => {
  const client = new RecordingUpKeepClient();
  const result = await client.enableUser("user-123");

  assert.equal(result.endpoint, "https://api.onupkeep.com/api/v1/users/enable");
  assert.deepEqual(JSON.parse(result.options.body), { id: "user-123" });
});

test("requires an explicit user id for status changes", async () => {
  const client = new RecordingUpKeepClient();

  await assert.rejects(client.disableUser(""), /requires a user id/);
  await assert.rejects(client.enableUser(), /requires a user id/);
});
