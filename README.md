# UpKeep SSO Upgrade Workspace

This repository is the working area for Welch Packaging's UpKeep authentication upgrade from local accounts to Microsoft Entra ID SSO.

## What is in here

- A static Next.js dashboard for the rollout timeline
- Structured implementation-plan data extracted from the source Word document
- A small extractor script for turning `.docx` content into JSON
- GitHub Pages deployment scaffolding

## Getting started

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` - local dashboard
- `npm run build` - static production build
- `npm run lint` - Next.js lint pass
- `npm run format` - Prettier write pass
- `npm run check:format` - Prettier check
- `npm run test` - validates the rollout data model
- `npm run extract:plan -- <path-to-docx>` - extracts paragraphs and a structured rollout JSON model from a Word document
- `npm run upkeep:smoke` - authenticates to UpKeep and verifies the known API v2 session-token flow
- `npm run upkeep:users` - fetches UpKeep users into `data/generated/upkeep-users.json` and `.csv`
- `npm run users:diff -- --entra-csv <entra-export.csv>` - compares UpKeep users with an Entra user export
- `npm run users:diff` - compares UpKeep users with Microsoft Graph using `AZURE_*` app credentials
- `npm run upkeep:apply-user-updates -- --file updates.csv` - previews UpKeep user PATCH requests
- `npm run upkeep:apply-user-updates -- --file updates.csv --apply` - applies reviewed UpKeep user PATCH requests
- `npm run ad:probe` - checks the local Windows domain lookup method available on this machine
- `npm run ad:users` - looks up exported UpKeep user emails in local AD and writes `data/generated/ad-users.csv`

## UpKeep and Entra user workflow

The reference dashboard uses the working UpKeep API v2 pattern:

1. `POST https://api.onupkeep.com/api/v2/auth` with `UPKEEP_EMAIL` and `UPKEEP_PASSWORD`
2. Read `result.sessionToken`
3. Send `Session-Token: <token>` on follow-up API requests

This repo keeps that same connector pattern in `lib/upkeep-client.mjs`. Put secrets in `.env.local`, never in committed files.

```bash
copy .env.example .env.local
npm run upkeep:smoke
npm run upkeep:users
npm run ad:probe
npm run ad:users
npm run users:diff -- --entra-csv data\generated\ad-users.csv
```

You can also check a few addresses directly before exporting the whole UpKeep list:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\export-ad-users.ps1 -Email user@welchpkg.com
```

For a manually exported Entra CSV instead of local AD:

```bash
npm run users:diff -- --entra-csv C:\path\to\entra-users.csv
```

For cloud Entra Graph comparison, omit `--entra-csv` and configure `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, and `AZURE_CLIENT_SECRET` in `.env.local`.

If UpKeep exposes the user list at a tenant-specific path, set `UPKEEP_USERS_ENDPOINT` in `.env.local` or pass it to the fetch script:

```bash
npm run upkeep:users -- /users
```

The diff output is written under `data/generated/`, which is intentionally ignored by git because it may contain user information.

User update CSVs must include `upkeepId` or `id`. Supported update columns are `email`, `accountType`, `firstName`, `lastName`, `phoneNumber`, and `isLocationBased`. The update command is dry-run unless `--apply` is present.

## GitHub Pages

The site is configured for static export. Set `NEXT_PUBLIC_BASE_PATH` to the repository path when building for a project page, for example:

```bash
NEXT_PUBLIC_BASE_PATH=/upkeep-sso-upgrade npm run build
```

The included GitHub Actions workflow handles this automatically.
