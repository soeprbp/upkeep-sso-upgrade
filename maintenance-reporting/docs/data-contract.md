# Corporate Maintenance Reporting Data Contract

## Reporting scope

The production model contains only the 14 sites in `config/site-allowlist.json`. The extractor must emit a coverage record for every configured site, including failures. A missing site response is a refresh exception, not zero activity.

## Reporting objects

### Open work

One row per UpKeep work order currently eligible for maintenance follow-up. The initial rule is: status is not a terminal status (`complete`, `closed`, `cancelled`, or `canceled`). The exact status taxonomy must be confirmed from a live read before the first published report.

### Completed work

One row per work order with a valid `dateCompleted`. Completion reporting uses `dateCompleted`, not `updatedAt`, and converts timestamps to the approved corporate reporting timezone.

### PM schedules

One row per preventive-maintenance schedule/template from the authoritative UpKeep PM endpoint. This remains a separate fact from work orders. The endpoint, fields, and site coverage must be validated before it is enabled in the model.

### PM-generated work

One row per work order identified as PM-generated. `category = Preventative` is an interim classification only; it must be labeled as provisional until UpKeep lineage or a reliable source field confirms the relationship.

## Required dimensions

- Site
- Date
- Status
- Priority
- Asset
- Location
- Assigned technician, if approved for internal reporting

## Required audit fields

Every extracted row must include:

- `sourceSite`
- `sourceId`
- `extractedAtUtc`
- `sourceUpdatedAt`
- `sourceStatus`
- `sourceEndpoint`

## Time classification

The report uses the calendar year as the current-period boundary:

- `YTD Current` — January 1 of the extraction year through the extraction date.
- `Historical` — any work-order activity before January 1 of the extraction year.

Completed-work measures use `dateCompleted`. Open-work measures are current-state measures and are not assigned to a historical period unless a separate as-of snapshot strategy is introduced.

## Data-quality gates

The refresh is not publishable when any of the following occurs:

- A site is missing from the coverage manifest.
- A site returns an authentication or pagination error.
- Duplicate `(sourceSite, sourceId)` keys exist.
- A site unexpectedly returns zero rows without an explicit source confirmation.
- Work-order extraction stops at a suspected API ceiling.
- PM schedule coverage is partial but the PM page is presented as complete.

## Out of scope for v1

Descriptions, attachments, comments, personal contact details, and unrestricted raw API payloads are excluded unless a business owner approves each field.
