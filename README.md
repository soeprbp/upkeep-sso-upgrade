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

## GitHub Pages

The site is configured for static export. Set `NEXT_PUBLIC_BASE_PATH` to the repository path when building for a project page, for example:

```bash
NEXT_PUBLIC_BASE_PATH=/upkeep-sso-upgrade npm run build
```

The included GitHub Actions workflow handles this automatically.
