# Validation Status — 2026-07-28

## Project status

The maintenance reporting project is paused. The generated SharePoint CSV snapshot was removed when the Power BI prototype was abandoned. The historical extraction observations below are not evidence of a current published report.

## Work orders

- 14 active production sites queried successfully.
- 58,854 rows extracted with a 100-page test.
- Indy Corr, Excel, and PAX are below the test ceiling.
- Welch Packaging (Default) reached the 20,000-row test ceiling and remains incomplete.
- Work-order package is therefore marked `publishable: false` until Welch history is backfilled or a source-side date filter is validated.

## Preventive maintenance schedules

- Endpoint tested: `/preventive-maintenance`.
- 9 active sites responded successfully, producing 59 schedules.
- 5 active sites returned HTTP 404: Bridgeview, Indy Corr, Indy Brown Box, Excel, and ElkCorr.
- PM schedule reporting must show coverage warnings and must not imply full company coverage.
- PM-generated work orders remain available as a separate provisional view using `category = Preventative`.

## Power BI handoff package

Generated under the ignored local path `data/generated/maintenance-reporting/powerbi/`:

- `fact-work-orders.csv`
- `fact-pm-schedules.csv`
- `fact-refresh-coverage.csv`
- `fact-pm-coverage.csv`
- `site-maintenance-summary.csv`

These files are suitable for a prototype Power BI import, but not for corporate publication until the completeness gates above are resolved.
