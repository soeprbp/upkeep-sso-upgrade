export const sourceSummary = {
  title: "OAuth Implementation Plan for Welch",
  sourceKind: "Word document",
  rolloutWindow: "2-week rollout",
  users: "~110 UpKeep users",
  corporateCoverage: "~90% Welch email addresses",
  nonAdCoverage: "~10% personal or non-AD addresses"
};

export const rolloutPhases = [
  {
    id: "planning-prereqs",
    title: "Planning & prerequisites",
    window: "Week 1, Days 1-2",
    status: "in-progress",
    summary:
      "Kickoff the work, confirm Entra coverage, validate UpKeep SSO prerequisites, and line up the people and access needed for the rollout.",
    owner: "IT leadership + systems administrators",
    focus: [
      "Kickoff and roles",
      "Enterprise user data review",
      "Azure AD and Entra readiness",
      "Company ID and protocol checks",
      "Executive sponsorship"
    ],
    milestones: [
      "Confirm the rollout scope and owners",
      "Verify which users already have Welch AD accounts",
      "Identify users who need remediation before cutover",
      "Check UpKeep SSO support and company code requirements"
    ]
  },
  {
    id: "technical-setup",
    title: "Technical integration setup",
    window: "Week 1, Days 3-4",
    status: "pending",
    summary:
      "Register the UpKeep application in Entra ID, configure SAML claims and certificates, and validate the first admin sign-in.",
    owner: "Systems administrators",
    focus: [
      "Entra enterprise app",
      "SAML entity and ACS URLs",
      "NameID and attribute mapping",
      "Certificate export",
      "Admin smoke test"
    ],
    milestones: [
      "Create and configure the app registration",
      "Paste the IdP values into UpKeep",
      "Keep native login enabled during testing",
      "Complete a web and mobile smoke test"
    ]
  },
  {
    id: "communications",
    title: "Communications & readiness",
    window: "Week 1, ongoing",
    status: "watch",
    summary:
      "Prepare the user-facing messaging, quick guides, and helpdesk notes so the transition feels familiar instead of abrupt.",
    owner: "Communications + IT support",
    focus: [
      "Announcement email",
      "Pilot instructions",
      "Wave communications",
      "Quick guide and FAQ",
      "Helpdesk prep"
    ],
    milestones: [
      "Send the initial user announcement",
      "Prepare the pilot group instructions",
      "Package mobile and web login guidance",
      "Brief the support desk on common issues"
    ]
  },
  {
    id: "pilot",
    title: "Pilot rollout",
    window: "Week 2, Days 1-2",
    status: "pending",
    summary:
      "Move a small cross-section of users onto SSO first, observe any friction, and keep password login available as the safety net.",
    owner: "IT admins + pilot users",
    focus: [
      "Pilot enablement",
      "Login monitoring",
      "Profile matching",
      "User feedback",
      "Fallback path"
    ],
    milestones: [
      "Enable SSO for the pilot group",
      "Confirm accounts match on email",
      "Collect feedback from web and mobile users",
      "Tune instructions or attribute mapping"
    ]
  },
  {
    id: "waves",
    title: "Phased full rollout",
    window: "Week 2, Days 3-4",
    status: "pending",
    summary:
      "Roll the remaining users forward in waves so IT can concentrate support and catch issues before the whole organization flips.",
    owner: "Project sponsors + helpdesk",
    focus: [
      "Wave planning",
      "Site or department rollout",
      "Monitoring and support",
      "Stakeholder updates"
    ],
    milestones: [
      "Split the remaining users into rollout waves",
      "Guide each wave through their first SSO login",
      "Watch Entra and UpKeep sign-in logs",
      "Triage any account mismatches quickly"
    ]
  },
  {
    id: "cutover",
    title: "Final cutover",
    window: "Week 2, Day 5",
    status: "pending",
    summary:
      "Disable native login, confirm SSO-only access works on web and mobile, and lock in emergency access controls.",
    owner: "UpKeep admins",
    focus: [
      "Native login off",
      "Post-cutover validation",
      "Break-glass admin account",
      "Final user notice"
    ],
    milestones: [
      "Disable legacy passwords",
      "Verify the SSO-only flow",
      "Confirm break-glass access exists",
      "Send completion notice"
    ]
  },
  {
    id: "support",
    title: "Training & support",
    window: "Ongoing",
    status: "watch",
    summary:
      "Keep a quick guide, support notes, and troubleshooting paths ready for the first days after cutover.",
    owner: "Helpdesk",
    focus: [
      "Quick guide",
      "Training session",
      "Helpdesk playbook",
      "Post-launch monitoring"
    ],
    milestones: [
      "Publish the login guide",
      "Share mobile login steps",
      "Coach the helpdesk on the issue matrix",
      "Track tickets after go-live"
    ]
  }
];

export const readinessMetrics = [
  { label: "Total users", value: "~110" },
  { label: "Welch emails", value: "~100" },
  { label: "Non-AD users", value: "~10" },
  { label: "Rollout length", value: "2 weeks" }
];

export const technicalChecklist = [
  "Verify the Welch domain in Entra ID",
  "Confirm UpKeep SAML support and company code",
  "Set NameID to the user email address",
  "Download the Base64 signing certificate",
  "Keep native login enabled until final cutover",
  "Test both browser and mobile login paths"
];

export const communicationPlan = [
  {
    label: "July 15, 2026",
    detail: "Initial project email sent to the C-suite and managers.",
    status: "sent"
  },
  {
    label: "Day 4",
    detail: "Brief the pilot group with step-by-step login guidance.",
    status: "planned"
  },
  {
    label: "Week 2",
    detail: "Send wave-specific reminders before each user group goes live.",
    status: "planned"
  },
  {
    label: "Final day",
    detail: "Announce SSO-only access after the cutover completes.",
    status: "planned"
  }
];

export const risks = [
  {
    label: "User confusion",
    severity: "medium",
    mitigation:
      "Use a short guide, pilot feedback, and on-call helpdesk support during the rollout windows."
  },
  {
    label: "Users without Entra accounts",
    severity: "high",
    mitigation:
      "Create or migrate Welch-backed identities before their SSO switch date."
  },
  {
    label: "SAML mismatch",
    severity: "high",
    mitigation:
      "Validate entity IDs, ACS URLs, NameID mapping, and certificate values before broad rollout."
  },
  {
    label: "Mobile login friction",
    severity: "medium",
    mitigation:
      "Document the company code and device steps separately for the mobile app."
  },
  {
    label: "Native login lockout",
    severity: "high",
    mitigation:
      "Keep a break-glass admin path and only disable password login after SSO is stable."
  }
];
