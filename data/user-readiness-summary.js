export const userReadinessSummary = {
  "generatedAt": "2026-07-22T17:19:56.138Z",
  "source": "All-site UpKeep export compared with local AD and payroll",
  "totals": {
    "upkeepUsers": 316,
    "matched": 125,
    "needsAction": 191,
    "missingUpkeepEmail": 0,
    "missingAdUser": 25,
    "disabledAdUser": 23,
    "terminatedPayrollUser": 17,
    "missingPayrollUser": 141,
    "payrollNotChecked": 0,
    "missingAdPayrollActive": 25,
    "missingAdPayrollInactive": 0,
    "missingAdPayrollNotFound": 0
  },
  "coverage": {
    "expectedMinimum": 117,
    "actual": 316,
    "status": "ok",
    "message": "UpKeep user export met the configured minimum across 19 site(s)."
  },
  "readinessPercent": 40,
  "chartSegments": [
    {
      "label": "Matched",
      "value": 125,
      "className": "segment-good"
    },
    {
      "label": "Terminated payroll",
      "value": 17,
      "className": "segment-danger"
    },
    {
      "label": "No payroll match",
      "value": 141,
      "className": "segment-risk"
    },
    {
      "label": "Missing AD user",
      "value": 25,
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
      "count": 125,
      "tone": "good",
      "description": "UpKeep account has a matching enabled AD identity."
    },
    {
      "label": "Verify payroll identity",
      "count": 141,
      "tone": "danger",
      "description": "No matching payroll record was found for the UpKeep account."
    },
    {
      "label": "Disable in UpKeep",
      "count": 17,
      "tone": "danger",
      "description": "Payroll status is inactive or terminated."
    },
    {
      "label": "Run payroll reconciliation",
      "count": 0,
      "tone": "watch",
      "description": "Payroll data was not checked, so these accounts are not yet ready."
    },
    {
      "label": "Create or migrate AD identity",
      "count": 25,
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
      "matched": 32,
      "needsAction": 21,
      "missingPayroll": 7,
      "disabledAd": 10,
      "status": "active"
    },
    "Ohio Corr": {
      "users": 15,
      "matched": 8,
      "needsAction": 7,
      "missingPayroll": 6,
      "disabledAd": 0,
      "status": "active"
    },
    "Bridgeview": {
      "users": 26,
      "matched": 11,
      "needsAction": 15,
      "missingPayroll": 10,
      "disabledAd": 5,
      "status": "active"
    },
    "Green Meadows Paper Company": {
      "users": 29,
      "matched": 0,
      "needsAction": 29,
      "missingPayroll": 29,
      "disabledAd": 0,
      "status": "active"
    },
    "Indy Corr": {
      "users": 19,
      "matched": 12,
      "needsAction": 7,
      "missingPayroll": 6,
      "disabledAd": 1,
      "status": "active"
    },
    "Detroit": {
      "users": 10,
      "matched": 5,
      "needsAction": 5,
      "missingPayroll": 5,
      "disabledAd": 0,
      "status": "active"
    },
    "Lexington": {
      "users": 6,
      "matched": 1,
      "needsAction": 5,
      "missingPayroll": 4,
      "disabledAd": 1,
      "status": "active"
    },
    "Marion": {
      "users": 6,
      "matched": 0,
      "needsAction": 6,
      "missingPayroll": 4,
      "disabledAd": 0,
      "status": "active"
    },
    "Lincoln": {
      "users": 9,
      "matched": 3,
      "needsAction": 6,
      "missingPayroll": 6,
      "disabledAd": 0,
      "status": "active"
    },
    "Nashville Box": {
      "users": 3,
      "matched": 0,
      "needsAction": 3,
      "missingPayroll": 2,
      "disabledAd": 0,
      "status": "active"
    },
    "Cleveland": {
      "users": 19,
      "matched": 7,
      "needsAction": 12,
      "missingPayroll": 7,
      "disabledAd": 1,
      "status": "active"
    },
    "Indy Brown Box": {
      "users": 14,
      "matched": 5,
      "needsAction": 9,
      "missingPayroll": 8,
      "disabledAd": 1,
      "status": "active"
    },
    "Demo Site": {
      "users": 16,
      "matched": 0,
      "needsAction": 16,
      "missingPayroll": 12,
      "disabledAd": 0,
      "status": "active"
    },
    "Columbus": {
      "users": 14,
      "matched": 4,
      "needsAction": 10,
      "missingPayroll": 9,
      "disabledAd": 0,
      "status": "active"
    },
    "Atcorr": {
      "users": 10,
      "matched": 2,
      "needsAction": 8,
      "missingPayroll": 5,
      "disabledAd": 2,
      "status": "active"
    },
    "Excel": {
      "users": 21,
      "matched": 11,
      "needsAction": 10,
      "missingPayroll": 6,
      "disabledAd": 1,
      "status": "active"
    },
    "ElkCorr": {
      "users": 16,
      "matched": 9,
      "needsAction": 7,
      "missingPayroll": 7,
      "disabledAd": 0,
      "status": "active"
    },
    "Toledo": {
      "users": 15,
      "matched": 10,
      "needsAction": 5,
      "missingPayroll": 4,
      "disabledAd": 0,
      "status": "active"
    },
    "PAX": {
      "users": 15,
      "matched": 5,
      "needsAction": 10,
      "missingPayroll": 4,
      "disabledAd": 1,
      "status": "active"
    }
  }
};
