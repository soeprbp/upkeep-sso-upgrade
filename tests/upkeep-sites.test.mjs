import assert from "node:assert/strict";
import test from "node:test";

import { parseUpKeepSites } from "../lib/env.mjs";

function withSiteEnvironment(includeDemoSite, callback) {
  const previous = {
    UPKEEP_EMAIL: process.env.UPKEEP_EMAIL,
    UPKEEP_SITES: process.env.UPKEEP_SITES,
    UPKEEP_INCLUDE_DEMO_SITE: process.env.UPKEEP_INCLUDE_DEMO_SITE
  };

  process.env.UPKEEP_EMAIL = "test@example.com";
  process.env.UPKEEP_SITES = "Plant A:one,Demo Site:demo,Plant B:two";
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

test("excludes Demo Site by default", () => {
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
