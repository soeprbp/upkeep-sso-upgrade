import fs from "node:fs/promises";
import sql from "mssql";
import { parseCsv } from "./csv.mjs";
import { loadDotEnv, requireEnv } from "./env.mjs";

function firstValue(row, names) {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== null && String(row[name]).trim() !== "") {
      return row[name];
    }
  }
  return "";
}

function normalizeEmail(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizeActive(value) {
  if (value === undefined || value === null || value === "") {
    return true;
  }
  const text = String(value).trim().toLowerCase();
  return ["1", "true", "active", "a", "yes", "y", "current", "employed"].includes(text);
}

export function normalizePayrollUser(row) {
  const email = normalizeEmail(
    firstValue(row, [
      "email",
      "Email",
      "workEmail",
      "WorkEmail",
      "work_email",
      "companyEmail",
      "CompanyEmail",
      "userPrincipalName",
      "UserPrincipalName"
    ])
  );

  return {
    employeeId: String(firstValue(row, ["employeeId", "EmployeeId", "employeeID", "EmployeeID", "EmpNo", "empNo", "emp_no"])),
    email,
    firstName: String(firstValue(row, ["firstName", "FirstName", "first_name", "givenName", "GivenName"])),
    lastName: String(firstValue(row, ["lastName", "LastName", "last_name", "surname", "Surname"])),
    displayName: String(firstValue(row, ["displayName", "DisplayName", "name", "Name"])),
    jobTitle: String(firstValue(row, ["jobTitle", "JobTitle", "job_title", "title", "Title", "position", "Position"])),
    department: String(firstValue(row, ["department", "Department", "dept", "Dept", "dept_name", "dept_code"])),
    location: String(firstValue(row, ["location", "Location", "work_location", "plant", "Plant", "site", "Site"])),
    active: normalizeActive(firstValue(row, ["active", "Active", "status", "Status", "employmentStatus", "EmploymentStatus"])),
    raw: row
  };
}

export async function readPayrollUsersFromCsv(filePath) {
  const text = await fs.readFile(filePath, "utf8");
  return parseCsv(text).map(normalizePayrollUser);
}

export async function fetchPayrollUsersFromSql() {
  loadDotEnv();
  const connectionString = requireEnv("PAYROLL_SQL_CONNECTION_STRING");
  const query = requireEnv("PAYROLL_SQL_QUERY");
  const pool = await sql.connect(connectionString);
  try {
    const result = await pool.request().query(query);
    return result.recordset.map(normalizePayrollUser);
  } finally {
    await pool.close();
  }
}

export async function loadPayrollUsers(options = {}) {
  if (options.csvPath) {
    return readPayrollUsersFromCsv(options.csvPath);
  }

  return fetchPayrollUsersFromSql();
}
