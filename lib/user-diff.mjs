function indexPayrollUsers(payrollUsers = []) {
  const byEmail = new Map();
  const byName = new Map();

  for (const user of payrollUsers) {
    if (user.email) {
      byEmail.set(user.email, user);
    }
    const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim().toLowerCase();
    if (name) {
      byName.set(name, user);
    }
    if (user.displayName) {
      byName.set(String(user.displayName).trim().toLowerCase(), user);
    }
  }

  return { byEmail, byName };
}

function findPayrollUser(upkeepUser, payrollIndex) {
  if (!payrollIndex) {
    return null;
  }

  if (upkeepUser.email && payrollIndex.byEmail.has(upkeepUser.email)) {
    return payrollIndex.byEmail.get(upkeepUser.email);
  }

  const displayName = String(upkeepUser.displayName ?? "").trim().toLowerCase();
  return displayName ? payrollIndex.byName.get(displayName) ?? null : null;
}

export function diffUsers(upkeepUsers, entraUsers, payrollUsers = []) {
  const entraByEmail = new Map();
  for (const user of entraUsers) {
    if (user.email) {
      entraByEmail.set(user.email, user);
    }
    if (user.userPrincipalName) {
      entraByEmail.set(String(user.userPrincipalName).trim().toLowerCase(), user);
    }
  }
  const payrollIndex = indexPayrollUsers(payrollUsers);

  return upkeepUsers.map((upkeepUser) => {
    const entraUser = upkeepUser.email ? entraByEmail.get(upkeepUser.email) : null;
    const payrollUser = !entraUser ? findPayrollUser(upkeepUser, payrollIndex) : null;
    let status = "matched";
    let action = "No action needed";

    if (!upkeepUser.email) {
      status = "missing_upkeep_email";
      action = "Add or correct the UpKeep email before SSO cutover";
    } else if (!entraUser) {
      status = "missing_entra_user";
      action = payrollUser?.active
        ? "Create or migrate Welch AD/Entra account for active payroll employee"
        : "Verify employment status in payroll or remove from SSO scope";
    } else if (!entraUser.accountEnabled) {
      status = "disabled_entra_user";
      action = "Enable or replace the Welch Entra account before rollout";
    }

    return {
      status,
      action,
      upkeepId: upkeepUser.id,
      upkeepEmail: upkeepUser.email,
      upkeepDisplayName: upkeepUser.displayName,
      upkeepFirstName: upkeepUser.firstName,
      upkeepLastName: upkeepUser.lastName,
      upkeepRole: upkeepUser.role,
      upkeepStatus: upkeepUser.status,
      entraId: entraUser?.id ?? "",
      entraEmail: entraUser?.email ?? "",
      entraDisplayName: entraUser?.displayName ?? "",
      entraGivenName: entraUser?.givenName ?? "",
      entraSurname: entraUser?.surname ?? "",
      entraAccountEnabled: entraUser ? String(entraUser.accountEnabled) : "",
      entraJobTitle: entraUser?.jobTitle ?? "",
      entraDepartment: entraUser?.department ?? "",
      entraOffice: entraUser?.office ?? "",
      entraCompany: entraUser?.company ?? "",
      entraEmployeeId: entraUser?.employeeId ?? "",
      entraGroups: entraUser?.groups?.join(";") ?? "",
      payrollMatchStatus: payrollUser ? (payrollUser.active ? "active" : "inactive") : "not_checked_or_not_found",
      payrollEmployeeId: payrollUser?.employeeId ?? "",
      payrollJobTitle: payrollUser?.jobTitle ?? "",
      payrollDepartment: payrollUser?.department ?? "",
      payrollLocation: payrollUser?.location ?? ""
    };
  });
}

export function summarizeDiff(rows) {
  return rows.reduce(
    (summary, row) => {
      summary.total += 1;
      summary[row.status] = (summary[row.status] ?? 0) + 1;
      return summary;
    },
    { total: 0 }
  );
}
