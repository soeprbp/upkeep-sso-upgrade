import fs from "node:fs/promises";
import path from "node:path";
import { toCsv } from "../lib/csv.mjs";

const columns = [
  { key: "upkeepId" },
  { key: "sourceStatus" },
  { key: "email" },
  { key: "firstName" },
  { key: "lastName" },
  { key: "jobTitle" },
  { key: "accountType" },
  { key: "suggestedLocationName" },
  { key: "notes" }
];

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function splitGroups(value) {
  return String(value ?? "")
    .split(";")
    .map((group) => group.trim())
    .filter(Boolean);
}

function findMappedValue(groups, mapping) {
  for (const group of groups) {
    if (mapping[group]) {
      return mapping[group];
    }
  }
  return "";
}

function deriveNames(row) {
  const firstName = firstNonEmpty(row.entraGivenName, row.upkeepFirstName);
  const lastName = firstNonEmpty(row.entraSurname, row.upkeepLastName);
  return { firstName, lastName };
}

async function main() {
  const diffPath = path.resolve(
    argValue("--diff") ?? "data/generated/user-diff.json"
  );
  const mappingPath = path.resolve(
    argValue("--mapping") ?? "config/upkeep-group-mapping.example.json"
  );
  const outputPath = path.resolve(
    argValue("--output") ?? "data/generated/upkeep-user-update-proposals.csv"
  );

  const diffPayload = await readJson(diffPath, null);
  if (!diffPayload) {
    throw new Error(`Diff file not found: ${diffPath}`);
  }

  const mapping = await readJson(mappingPath, {
    accountTypeByGroup: {},
    locationByGroup: {},
    defaultAccountType: ""
  });

  const rows = (diffPayload.rows ?? [])
    .map((row) => {
      const groups = splitGroups(row.entraGroups);
      const { firstName, lastName } = deriveNames(row);
      const accountType =
        findMappedValue(groups, mapping.accountTypeByGroup ?? {}) ||
        row.upkeepRole ||
        mapping.defaultAccountType ||
        "";
      const suggestedLocationName = findMappedValue(
        groups,
        mapping.locationByGroup ?? {}
      );
      const jobTitle = firstNonEmpty(row.entraJobTitle, row.payrollJobTitle);

      const notes = [];
      if (
        row.status === "missing_entra_user" &&
        row.payrollMatchStatus === "active"
      ) {
        notes.push("Active payroll match needs AD/Entra account before SSO");
      }
      if (groups.length === 0 && row.status === "matched") {
        notes.push("No AD groups exported for mapping");
      }

      return {
        upkeepId: row.upkeepId,
        sourceStatus: row.status,
        email: row.upkeepEmail,
        firstName,
        lastName,
        jobTitle,
        accountType,
        suggestedLocationName,
        notes: notes.join("; ")
      };
    })
    .filter((row) => row.upkeepId);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, toCsv(rows, columns), "utf8");
  console.log(
    JSON.stringify(
      {
        proposalCount: rows.length,
        output: outputPath,
        mapping: mappingPath,
        message: "Review this CSV before using upkeep:apply-user-updates."
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
