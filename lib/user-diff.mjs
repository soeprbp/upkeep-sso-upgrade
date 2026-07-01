export function diffUsers(upkeepUsers, entraUsers) {
  const entraByEmail = new Map();
  for (const user of entraUsers) {
    if (user.email) {
      entraByEmail.set(user.email, user);
    }
    if (user.userPrincipalName) {
      entraByEmail.set(String(user.userPrincipalName).trim().toLowerCase(), user);
    }
  }

  return upkeepUsers.map((upkeepUser) => {
    const entraUser = upkeepUser.email ? entraByEmail.get(upkeepUser.email) : null;
    let status = "matched";
    let action = "No action needed";

    if (!upkeepUser.email) {
      status = "missing_upkeep_email";
      action = "Add or correct the UpKeep email before SSO cutover";
    } else if (!entraUser) {
      status = "missing_entra_user";
      action = "Create/migrate Welch Entra account or remove from SSO scope";
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
      upkeepRole: upkeepUser.role,
      upkeepStatus: upkeepUser.status,
      entraId: entraUser?.id ?? "",
      entraEmail: entraUser?.email ?? "",
      entraDisplayName: entraUser?.displayName ?? "",
      entraAccountEnabled: entraUser ? String(entraUser.accountEnabled) : ""
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
