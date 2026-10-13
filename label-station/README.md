# UpKeep Label Station

Installable Windows app for selecting Welch assets, queuing quantities, and printing bilingual UpKeep Public Request Portal QR labels. The desktop package carries its own local application runtime; it does not require IIS, a VM, or a separate server.

## Safety model

- Starts in `fixture` mode and makes no UpKeep requests.
- In the Windows app, the UpKeep email, password, and resulting session token are encrypted for the signed-in Windows user and are never exposed to the renderer/browser JavaScript.
- Live mode reads locations, assets, and Public Request Portals and can create one asset portal only after the user reviews and confirms the locked payload.
- Portal update and delete operations are not implemented.
- Creation is idempotent for an already-compliant asset portal, blocks duplicate URL slugs and conflicting existing portals, and requires a fresh UpKeep read after POST before printing.
- An asset is printable only when its existing portal is bound to that asset, has a safe `customUrl`, contains no custom fields, and exposes only optional Attachments and optional Priority. All other standard portal fields must be hidden.

## Run locally

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3025`. Fixture mode is ready immediately.

For live inventory, set `UPKEEP_LABEL_MODE=live`, `UPKEEP_EMAIL`, and `UPKEEP_PASSWORD` in `.env.local`, then restart the server. The server obtains and caches the session token automatically and retries authentication once after an unauthorized response. Browser development keeps writes disabled unless `UPKEEP_LABEL_ALLOW_WRITES=true` is set deliberately. Do not place credentials in variables prefixed with `NEXT_PUBLIC_`.

## Windows desktop app

Build the installer with:

```powershell
npm install
npm run desktop:dist
```

The installer is written to `dist-desktop`. A new installation defaults to **Only for me**, installs under the current user's local Programs folder, and does not require local administrator rights. On first launch, leave the app in Fixture mode for evaluation or open Settings, select Live UpKeep, and enter the current UpKeep integration email and password. Label Station verifies the login before saving it. The credentials and resulting token are protected by Windows DPAPI for the current Windows account and are never returned to the user interface.

Running a newer installer over an existing UpKeep Label Station installation updates it in its existing scope. A legacy all-users installation under Program Files therefore requires administrator approval for that update; after it is uninstalled, a fresh **Only for me** installation and its future updates do not. The installer uses a permanent Windows application GUID, retains the existing install location and shortcuts, preserves the current user's encrypted settings, and offers to relaunch the updated app when setup finishes. Do not change `appId` or the NSIS `guid` in future releases.

When an asset has no portal, select **Create Portal & Add to Queue**, review the asset, URL, and locked field policy, then confirm. Fixture mode simulates the full flow. Live mode sends `POST /api/v3/request-portal/`, re-reads the portal inventory, and enables printing only after the returned portal passes the exact Welch policy.

The current internal build is not code-signed, so Windows SmartScreen may display an Unknown Publisher warning. Production distribution should use a Welch code-signing certificate.

## Printing

1. Add assets to the batch queue and set each quantity.
2. Choose **Zebra 4 × 6** or **Letter 4-up**.
3. Use **Print Batch**.
4. In the print dialog choose US Letter portrait, 100% / Actual Size, disable Fit to Page and headers/footers, and use zero margins.

The Zebra profile produces one 4 × 6-inch page per physical label. The Letter 4-up profile fills a US Letter sheet with four equal 4.25 × 5.5-inch quarter-sheet laser shipping labels in a 2 × 2 arrangement. The stock has no template margin or gutter; safe space is applied inside each label. Quantities are expanded before pagination, so seven labels produce two sheets.

The Letter 4-up layout was physically verified on the intended quarter-sheet laser shipping-label stock on October 13, 2026. Long asset names, QR codes, and both instruction lines fit within all four labels when printed at Actual Size / 100% with Fit to Page disabled.

For a Zebra printer, install the correct Windows driver, create a 4 × 6 stock definition, select portrait/direct-thermal settings as appropriate for the installed media, and print at Actual Size. Run a single-label calibration before batching.

## Checks

```powershell
npm test
npm run build
```
