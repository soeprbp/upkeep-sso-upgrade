export const userReadinessSummary = {
  "generatedAt": "2026-07-01T18:07:38.945Z",
  "source": "Local UpKeep export compared with local AD lookup",
  "totals": {
    "upkeepUsers": 54,
    "matched": 37,
    "needsAction": 17,
    "missingUpkeepEmail": 0,
    "missingAdUser": 8,
    "disabledAdUser": 9,
    "missingAdPayrollActive": 7,
    "missingAdPayrollInactive": 0,
    "missingAdPayrollNotFound": 1
  },
  "readinessPercent": 69,
  "chartSegments": [
    {
      "label": "Matched",
      "value": 37,
      "className": "segment-good"
    },
    {
      "label": "Missing AD user",
      "value": 8,
      "className": "segment-risk"
    },
    {
      "label": "Disabled AD user",
      "value": 9,
      "className": "segment-watch"
    },
    {
      "label": "Missing UpKeep email",
      "value": 0,
      "className": "segment-muted"
    }
  ],
  "actionBuckets": [
    {
      "label": "Ready for SSO",
      "count": 37,
      "tone": "good",
      "description": "UpKeep account has a matching enabled AD identity."
    },
    {
      "label": "Create or migrate AD identity",
      "count": 8,
      "tone": "risk",
      "description": "UpKeep account did not match a local AD user."
    },
    {
      "label": "Enable or replace AD identity",
      "count": 9,
      "tone": "watch",
      "description": "AD account exists but is disabled."
    },
    {
      "label": "Correct UpKeep email",
      "count": 0,
      "tone": "muted",
      "description": "UpKeep account is missing an email."
    }
  ]
};
