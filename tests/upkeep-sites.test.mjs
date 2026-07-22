import assert from "node:assert/strict";
import test from "node:test";

import { isUpKeepSiteIgnored, parseUpKeepSites } from "../lib/env.mjs";

function withSiteEnvironment(includeDemoSite, callback) {
  const previous = {
    UPKEEP_EMAIL: process.env.UPKEEP_EMAIL,
    UPKEEP_SITES: process.env.UPKEEP_SITES,
    UPKEEP_INCLUDE_DEMO_SITE: process.env.UPKEEP_INCLUDE_DEMO_SITE,
    UPKEEP_INCLUDE_IGNORED_SITES: process.env.UPKEEP_INCLUDE_IGNORED_SITES
  };

  process.env.UPKEEP_EMAIL = "test@example.com";
  process.env.UPKEEP_SITES =
    "Plant A:one,Demo Site:demo,Green Meadows Paper Company:green,Plant B:two";
  delete process.env.UPKEEP_INCLUDE_IGNORED_SITES;
  if (includeDemoSite === undefined) {
    delete process.env.UPKEEP_INCLUDE_DEMO_SITE;
  } else {
    process.env.UPKEEP_INCLUDE_DEMO_SITE = includeDemoSite;
  }

  try {
    callback();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("excludes ignored sites by default", () => {
  withSiteEnvironment(undefined, () => {
    assert.deepEqual(
      parseUpKeepSites().map((site) => site.name),
      ["Plant A", "Plant B"]
    );
  });
});

test("includes Demo Site only with an explicit opt-in", () => {
  withSiteEnvironment("true", () => {
    assert.deepEqual(
      parseUpKeepSites().map((site) => site.name),
      ["Plant A", "Demo Site", "Plant B"]
    );
  });
});

test("includes a named ignored site only when explicitly requested", () => {
  withSiteEnvironment(undefined, () => {
    process.env.UPKEEP_INCLUDE_IGNORED_SITES = "Green Meadows Paper Company";
    assert.deepEqual(
      parseUpKeepSites().map((site) => site.name),
      ["Plant A", "Green Meadows Paper Company", "Plant B"]
    );
  });
});

test("applies ignored-site policy to previously exported records", () => {
  withSiteEnvironment(undefined, () => {
    assert.equal(isUpKeepSiteIgnored("Demo Site"), true);
    assert.equal(isUpKeepSiteIgnored("Green Meadows Paper Company"), true);
    assert.equal(isUpKeepSiteIgnored("Plant A"), false);
  });
});
