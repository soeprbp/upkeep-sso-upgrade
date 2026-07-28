# Power BI Prototype Build Guide

> **Paused / historical note:** This guide documents an exploratory Power BI prototype. Power BI is not the active reporting or handoff path. Do not treat these steps as a supported production deployment.

This guide builds the first Welch corporate maintenance report from the curated CSV files in the SharePoint/OneDrive `Upkeep Reporting` folder.

## 1. Connect the files

In Power BI Desktop:

1. Select **Get data → SharePoint folder**.
2. Use the Welch SharePoint site URL, not the local OneDrive path:
   `https://welchpkg.sharepoint.com`
3. Authenticate with **Organizational account**.
4. Filter the returned `Folder Path` to the `Upkeep Reporting` folder.
5. Combine or load these five files as separate queries:
   - `fact-work-orders.csv`
   - `fact-pm-schedules.csv`
   - `fact-pm-coverage.csv`
   - `fact-refresh-coverage.csv`
   - `site-maintenance-summary.csv`

The local OneDrive shortcut is an upload convenience. It should not be used as the Power BI source path.

## 2. Query preparation

Set these types before loading:

| Query | Important types |
| --- | --- |
| FactWorkOrders | `dateCompleted`, `createdAt`, `sourceUpdatedAt`, `extractedAtUtc` = Date/Time; `priority` = Whole Number |
| FactPMSchedules | `nextDueDate` = Date; `extractedAtUtc` = Date/Time |
| FactPMCoverage | `rows` = Whole Number; `checkedAtUtc` = Date/Time |
| FactRefreshCoverage | `rows` = Whole Number; `ceilingSuspected` = True/False; `extractedAtUtc` = Date/Time |
| SiteMaintenanceSummary | all count columns = Whole Number |

Rename the CSV queries to the names above. Keep the source fields; they support audit and freshness reporting.

## 3. Model relationships

Create these relationships:

- `DimSite[Site]` 1 → * `FactWorkOrders[sourceSite]`
- `DimSite[Site]` 1 → * `FactPMSchedules[sourceSite]`
- `DimSite[Site]` 1 → * `FactPMCoverage[site]`
- `DimSite[Site]` 1 → * `FactRefreshCoverage[site]`
- `DimDate[Date]` 1 → * `FactWorkOrders[CompletionDate]` (active)
- `DimDate[Date]` 1 → * `FactWorkOrders[CreatedDate]` (inactive)

Build `DimSite` from the active-site list in `config/site-allowlist.json`. Do not include the five excluded sites. Build `DimDate` with the DAX in `powerbi-measures.dax`.

## 4. Initial report pages

### Corporate Overview

Cards: Open Work Orders, Completed Work Orders YTD, PM-Generated Work YTD, PM Completion Rate, Sites Reporting, and Last Refresh.

Charts: open work by site, completed work by month, PM completion by site, and a freshness/exception table.

### Open Work

Use a table and bar charts for status, priority, site, assigned technician, asset, and age buckets. Open work is a current-state measure; do not apply the historical/YTD completion slicer to it.

### PM Schedules

Show schedule count, due/overdue status, and coverage warnings. Label this page **Prototype — partial endpoint coverage** until all active sites have a validated schedule endpoint.

### Completed Work

Use `dateCompleted` for the YTD Current/Historical selector, monthly trend, site comparison, category, and throughput.

### Site Detail

Add a drill-through filter on `DimSite[Site]`, with open work, completed work, PM work, and refresh status.

### Data Freshness

Show every active site, last extraction time, row count, status, and `ceilingSuspected`. A failed or ceiling-suspected site must be visible, not silently omitted.

## 5. Publication guardrails

This package is prototype-ready, not publication-ready. The current validation status is:

- 14 active sites are in scope.
- Welch Packaging has a suspected 20,000-row work-order ceiling.
- Five active sites returned 404 for the PM schedule endpoint.
- PM-generated work is provisionally identified by `category = Preventative`.

Do not label the report as complete corporate coverage until the work-order history and PM endpoint gaps are resolved or explicitly accepted by the business owner.
