export const userReadinessSummary = {
  "generatedAt": "2026-07-20T17:23:18.580Z",
  "source": "Local UpKeep export compared with local AD lookup",
  "totals": {
    "upkeepUsers": 317,
    "matched": 154,
    "needsAction": 163,
    "missingUpkeepEmail": 0,
    "missingAdUser": 140,
    "disabledAdUser": 23,
    "terminatedPayrollUser": 0,
    "missingAdPayrollActive": 0,
    "missingAdPayrollInactive": 0,
    "missingAdPayrollNotFound": 140
  },
  "coverage": {
    "expectedMinimum": 117,
    "actual": 317,
    "status": "ok",
    "message": "UpKeep user export met the configured minimum across 19 site(s)."
  },
  "readinessPercent": 49,
  "chartSegments": [
    {
      "label": "Matched",
      "value": 154,
      "className": "segment-good"
    },
    {
      "label": "Terminated payroll",
      "value": 0,
      "className": "segment-danger"
    },
    {
      "label": "Missing AD user",
      "value": 140,
      "className": "segment-risk"
    },
    {
      "label": "Disabled AD user",
      "value": 23,
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
      "count": 154,
      "tone": "good",
      "description": "UpKeep account has a matching enabled AD identity."
    },
    {
      "label": "Disable in UpKeep",
      "count": 0,
      "tone": "danger",
      "description": "Payroll status is inactive or terminated."
    },
    {
      "label": "Create or migrate AD identity",
      "count": 140,
      "tone": "risk",
      "description": "UpKeep account did not match a local AD user."
    },
    {
      "label": "Enable or replace AD identity",
      "count": 23,
      "tone": "watch",
      "description": "AD account exists but is disabled."
    },
    {
      "label": "Correct UpKeep email",
      "count": 0,
      "tone": "muted",
      "description": "UpKeep account is missing an email."
    }
  ],
  "perSite": {
    "Welch Packaging (Default)": {
      "users": 53,
      "matched": 0,
      "needsAction": 0,
      "status": "active"
    },
    "Ohio Corr": {
      "users": 16,
      "matched": 0,
      "needsAction": 0,
      "status": "active"
    },
    "Bridgeview": {
      "users": 26,
      "matched": 0,
      "needsAction": 0,
      "status": "active"
    },
    "Green Meadows Paper Company": {
      "users": 29,
      "matched": 0,
      "needsAction": 0,
      "status": "active"
    },
    "Indy Corr": {
      "users": 19,
      "matched": 0,
      "needsAction": 0,
      "status": "active"
    },
    "Detroit": {
      "users": 10,
      "matched": 0,
      "needsAction": 0,
      "status": "active"
    },
    "Lexington": {
      "users": 6,
      "matched": 0,
      "needsAction": 0,
      "status": "active"
    },
    "Marion": {
      "users": 6,
      "matched": 0,
      "needsAction": 0,
      "status": "active"
    },
    "Lincoln": {
      "users": 9,
      "matched": 0,
      "needsAction": 0,
      "status": "active"
    },
    "Nashville Box": {
      "users": 3,
      "matched": 0,
      "needsAction": 0,
      "status": "active"
    },
    "Cleveland": {
      "users": 19,
      "matched": 0,
      "needsAction": 0,
      "status": "active"
    },
    "Indy Brown Box": {
      "users": 14,
      "matched": 0,
      "needsAction": 0,
      "status": "active"
    },
    "Demo Site": {
      "users": 16,
      "matched": 0,
      "needsAction": 0,
      "status": "active"
    },
    "Columbus": {
      "users": 14,
      "matched": 0,
      "needsAction": 0,
      "status": "active"
    },
    "Atcorr": {
      "users": 10,
      "matched": 0,
      "needsAction": 0,
      "status": "active"
    },
    "Excel": {
      "users": 22,
      "matched": 0,
      "needsAction": 0,
      "status": "active"
    },
    "ElkCorr": {
      "users": 15,
      "matched": 0,
      "needsAction": 0,
      "status": "active"
    },
    "Toledo": {
      "users": 15,
      "matched": 0,
      "needsAction": 0,
      "status": "active"
    },
    "PAX": {
      "users": 15,
      "matched": 0,
      "needsAction": 0,
      "status": "active"
    }
  }
};
