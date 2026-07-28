# Welch Corporate Maintenance Reporting

This is a paused side project for a future internal maintenance reporting solution. It is intentionally isolated from the existing UpKeep SSO/AD rollout application so it can be moved into its own repository later.

## Scope

- One corporate reporting model for the 14 active production sites.
- Four inactive sites and Demo Site are excluded from production reporting.
- PM schedules and PM-generated work orders are separate reporting objects.
- Read-only UpKeep extraction only; no work orders, users, assets, or configuration are changed.

## Project structure

- `config/site-allowlist.json` — explicit reporting scope and exclusions.
- `docs/data-contract.md` — metric definitions, grain, field rules, and validation requirements.
- `docs/powerbi-model.md` — proposed Power BI star schema, pages, security, and refresh design.
- `docs/powerbi-build-guide.md` — step-by-step Power BI Desktop connection, model, page, and publication guardrails.
- `docs/powerbi-measures.dax` — prototype date table and reusable maintenance measures.
- `scripts/validate-reporting-contract.mjs` — validates the reporting scope and contract assumptions.
- `scripts/extract-work-order-snapshot.mjs` — read-only site-by-site work-order snapshot scaffold.

## Current status

This project is currently on the back burner. The Power BI prototype was not selected because it was not sufficiently reproducible or handoff-friendly for the intended maintenance and corporate audience. The generated SharePoint CSV snapshot was removed after the prototype was paused.

The repo keeps the read-only extraction scaffold and data contract for possible future reuse. No unattended refresh or production handoff is currently configured. If resumed, the next implementation should establish an approved Welch-owned UpKeep service/integration identity first, then build a handoff-ready Excel workbook with scheduled refresh and plain-English operating instructions. End users must not need UpKeep API credentials.

From the repository root, the validation command remains available:

```powershell
node maintenance-reporting/scripts/validate-reporting-contract.mjs
```

The extractor is not scheduled. If it is run manually, it requires the existing UpKeep environment variables and writes only to the ignored `data/generated/maintenance-reporting/` directory.
