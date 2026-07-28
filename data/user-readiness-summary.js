export const userReadinessSummary = {
  "generatedAt": "2026-07-28T13:30:51.045Z",
  "source": "All-site UpKeep export compared with local AD and payroll",
  "totals": {
    "upkeepUsers": 204,
    "matched": 122,
    "needsAction": 82,
    "missingUpkeepEmail": 0,
    "missingAdUser": 18,
    "disabledAdUser": 23,
    "terminatedPayrollUser": 16,
    "missingPayrollUser": 40,
    "payrollNotChecked": 0,
    "missingAdPayrollActive": 18,
    "missingAdPayrollInactive": 0,
    "missingAdPayrollNotFound": 0
  },
  "coverage": {
    "expectedMinimum": 117,
    "actual": 271,
    "status": "ok",
    "message": "UpKeep user export met the configured minimum across 17 site(s)."
  },
  "readinessPercent": 60,
  "chartSegments": [
    {
      "label": "Matched",
      "value": 122,
      "className": "segment-good"
    },
    {
      "label": "Terminated payroll",
      "value": 16,
      "className": "segment-danger"
    },
    {
      "label": "No payroll match",
      "value": 40,
      "className": "segment-risk"
    },
    {
      "label": "Missing AD user",
      "value": 18,
      "className": "segment-risk"
    },
    {
      "label": "Disabled AD user",
      "value": 8,
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
      "count": 122,
      "tone": "good",
      "description": "UpKeep account has a matching enabled AD identity."
    },
    {
      "label": "Verify payroll identity",
      "count": 40,
      "tone": "danger",
      "description": "No matching payroll record was found for the UpKeep account."
    },
    {
      "label": "Disable in UpKeep",
      "count": 16,
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
      "count": 18,
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
      "users": 11,
      "matched": 7,
      "needsAction": 4,
      "missingPayroll": 4,
      "disabledAd": 0,
      "status": "active"
    },
    "Bridgeview": {
      "users": 18,
      "matched": 11,
      "needsAction": 7,
      "missingPayroll": 2,
      "disabledAd": 5,
      "status": "active"
    },
    "Indy Corr": {
      "users": 18,
      "matched": 11,
      "needsAction": 7,
      "missingPayroll": 5,
      "disabledAd": 2,
      "status": "active"
    },
    "Detroit": {
      "users": 6,
      "matched": 5,
      "needsAction": 1,
      "missingPayroll": 1,
      "disabledAd": 0,
      "status": "active"
    },
    "Lexington": {
      "users": 2,
      "matched": 1,
      "needsAction": 1,
      "missingPayroll": 0,
      "disabledAd": 1,
      "status": "active"
    },
    "Marion": {
      "users": 1,
      "matched": 0,
      "needsAction": 1,
      "missingPayroll": 0,
      "disabledAd": 0,
      "status": "active"
    },
    "Lincoln": {
      "users": 5,
      "matched": 3,
      "needsAction": 2,
      "missingPayroll": 2,
      "disabledAd": 0,
      "status": "active"
    },
    "Nashville Box": {
      "users": 0,
      "matched": 0,
      "needsAction": 0,
      "missingPayroll": 0,
      "disabledAd": 0,
      "status": "active"
    },
    "Cleveland": {
      "users": 13,
      "matched": 7,
      "needsAction": 6,
      "missingPayroll": 1,
      "disabledAd": 1,
      "status": "active"
    },
    "Indy Brown Box": {
      "users": 11,
      "matched": 5,
      "needsAction": 6,
      "missingPayroll": 6,
      "disabledAd": 0,
      "status": "active"
    },
    "Columbus": {
      "users": 6,
      "matched": 4,
      "needsAction": 2,
      "missingPayroll": 1,
      "disabledAd": 0,
      "status": "active"
    },
    "Atcorr": {
      "users": 7,
      "matched": 2,
      "needsAction": 5,
      "missingPayroll": 2,
      "disabledAd": 2,
      "status": "active"
    },
    "Excel": {
      "users": 16,
      "matched": 11,
      "needsAction": 5,
      "missingPayroll": 3,
      "disabledAd": 1,
      "status": "active"
    },
    "ElkCorr": {
      "users": 13,
      "matched": 9,
      "needsAction": 4,
      "missingPayroll": 4,
      "disabledAd": 0,
      "status": "active"
    },
    "Toledo": {
      "users": 12,
      "matched": 10,
      "needsAction": 2,
      "missingPayroll": 1,
      "disabledAd": 0,
      "status": "active"
    },
    "PAX": {
      "users": 12,
      "matched": 4,
      "needsAction": 8,
      "missingPayroll": 1,
      "disabledAd": 1,
      "status": "active"
    }
  }
};
