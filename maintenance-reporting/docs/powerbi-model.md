# Power BI Model Specification

> **Paused / historical note:** This model describes an exploratory Power BI design that is currently on the back burner. It is retained for reference only; no Power BI refresh or publication is configured.

## Star schema

### Facts

- `FactWorkOrder` — all in-scope work orders, one row per site-scoped work-order ID.
- `FactPMSchedule` — preventive-maintenance schedules/templates, one row per schedule, pending endpoint validation.
- `FactPMWorkOrder` — PM-generated work orders, one row per site-scoped work-order ID, kept separate from general work.
- `FactRefreshCoverage` — one row per site and extraction run, including success, row count, error, and source ceiling flags.

### Dimensions

- `DimSite`
- `DimDate`
- `DimStatus`
- `DimPriority`
- `DimAsset`
- `DimLocation`

## Initial report pages

1. **Corporate Overview** — open work, completed work, PM schedule health, PM-generated work, site comparison, and freshness.
2. **Open Work** — aging, status, priority, site, asset, location, and assigned technician.
3. **PM Schedules** — due, overdue, completed, and compliance trend once schedule data is validated.
4. **Completed Work** — selectable completion window, site trend, category, and throughput.
5. **Completed PM Work** — PM-generated completions separate from general completed work.
6. **Site Detail** — drill-through for one active site.
7. **Data Freshness** — site coverage, last successful extraction, row counts, and exceptions.

## Time slicers

The default completed-work view uses two mutually exclusive buckets: `YTD Current` (January 1 of the extraction year through the extraction date) and `Historical` (before that year). The model should also retain the full completion date for custom year/month filtering.

## Access model

Publish through a Welch internal Power BI workspace and app backed by Entra groups. Corporate maintenance leadership may receive all-site access. Site-level RLS can be added for plant managers after the audience matrix is approved. The source identity must be read-only and credentials must not be stored in the PBIX or extracts.

## Simple refresh design

Fabric is not required for the first version. Power BI should consume curated CSV files from a Welch-controlled SharePoint or OneDrive folder. The existing Windows extractor will authenticate to UpKeep, write the files, and preserve a coverage manifest. Power BI will read the folder contents and refresh the report from the latest validated files.

Power BI should not perform 14 dynamic authenticated UpKeep API calls directly. The extractor must fail visibly when an active site is unavailable, and the report must show the last successful extraction, the number of sites included, and any pagination-ceiling warning.

If SharePoint/OneDrive refresh is not available for the chosen workspace, the fallback is a scheduled Windows refresh using Power BI Gateway. No Fabric capacity is assumed.
