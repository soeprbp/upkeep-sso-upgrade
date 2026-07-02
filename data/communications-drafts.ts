export type CommunicationDraft = {
  id: string;
  title: string;
  audience: string;
  subject: string;
  preheader: string;
  summary: string;
  body: string[];
  footer: string;
};

export const communicationDrafts: CommunicationDraft[] = [
  {
    id: "initial-announcement",
    title: "Initial user announcement",
    audience: "All UpKeep users",
    subject: "UpKeep is moving to Microsoft Entra ID sign-in",
    preheader:
      "Here is what is changing, when it starts, and what you need to do if you use UpKeep.",
    summary:
      "This version introduces the rollout, explains the shift to Welch sign-in, and sets expectations for the phased cutover.",
    body: [
      "Hi team,",
      "We are upgrading UpKeep sign-in to Microsoft Entra ID single sign-on (SSO). Going forward, you will use your Welch work account to access UpKeep instead of a separate UpKeep password.",
      "The change will happen in phases over the next two weeks. A small pilot group will test the new sign-in flow first, then we will move the rest of the users in waves before the final cutover.",
      "What this means for you:",
      "Use Continue with SSO and your Welch email address when you sign in to UpKeep.",
      "If you use the mobile app, you may be asked for the company ID provided by IT.",
      "If you are in a later rollout wave, you will receive a follow-up message with your specific timing and any extra steps.",
      "We will keep native password login available during testing and the pilot period. Once the rollout is complete, UpKeep will use SSO only.",
      "If you have trouble signing in or your account uses a non-Welch email address, please contact the helpdesk.",
      "Thanks for your patience while we make this transition."
    ],
    footer: "Tone: straightforward, reassuring, and concise."
  },
  {
    id: "admin-brief",
    title: "Admin briefing",
    audience: "IT admins and support leads",
    subject: "UpKeep SSO rollout: admin readiness and support checklist",
    preheader:
      "Here is the rollout purpose, support expectations, and the admin actions we need ready before pilot.",
    summary:
      "This version is aimed at the technical owners and helpdesk so they understand the rollout plan, the support load, and the admin tasks that keep the transition safe.",
    body: [
      "Hi team,",
      "We are moving UpKeep authentication from local passwords to Microsoft Entra ID SSO as part of the broader identity standardization effort.",
      "The rollout is phased so we can validate SAML, account matching, mobile login, and support readiness before we disable native login.",
      "Why we are doing this:",
      "Reduce password friction for users",
      "Improve security by relying on managed company credentials",
      "Centralize access control and user lifecycle management",
      "Lower support overhead from password resets and account confusion",
      "What we need from admins and support:",
      "Confirm the SSO configuration is correct in both Entra and UpKeep",
      "Review pilot users and verify email matching before their switch date",
      "Keep break-glass access available during the rollout",
      "Be ready to help users who need the company ID, mobile guidance, or account cleanup",
      "Please treat any login issue during pilot as a priority and send screenshots or exact error text to the rollout channel."
    ],
    footer: "Tone: operational, direct, and action-focused."
  },
  {
    id: "management-brief",
    title: "Upper management update",
    audience: "Leadership and upper management",
    subject: "UpKeep SSO upgrade underway to improve security and simplify access",
    preheader:
      "A short leadership note on why we are making the change and how the phased rollout reduces risk.",
    summary:
      "This version gives leadership the business rationale, rollout approach, and a simple reassurance that the transition is being managed in phases.",
    body: [
      "Hi team,",
      "We are beginning an UpKeep authentication upgrade that moves users from local passwords to Microsoft Entra ID single sign-on.",
      "The goal is to make access easier for users, improve security by using company-managed credentials, and reduce the long-term support burden tied to password resets and account maintenance.",
      "We are handling this as a phased rollout rather than a single cutover so we can validate the technical configuration, support the pilot group closely, and reduce disruption.",
      "During the rollout, users will receive clear instructions before their turn, and we will keep native login available until the pilot and wave testing are stable.",
      "The key success factors are accurate account matching, a clear help path for users, and a controlled final cutover once the pilot confirms the flow is working as expected.",
      "We will share progress updates as the rollout moves through pilot, waves, and final cutover."
    ],
    footer: "Tone: brief, business-oriented, and confidence-building."
  },
  {
    id: "pilot-instructions",
    title: "Pilot group instructions",
    audience: "Pilot users",
    subject: "UpKeep pilot sign-in instructions",
    preheader:
      "Please use these steps for your first SSO login and send back any issues you see.",
    summary:
      "This version gives the pilot team a clear first-login path and asks for quick feedback while native login is still available.",
    body: [
      "Hi pilot team,",
      "You are in the first group testing the new UpKeep SSO sign-in flow.",
      "When you are ready, please follow these steps:",
      "Open UpKeep and select Continue with SSO on the main login screen.",
      "Enter your Welch email address when prompted.",
      "Complete the Microsoft sign-in steps if you are redirected to Entra ID.",
      "If you are using the mobile app, enter the company ID if the app asks for it.",
      "After sign-in, confirm that you can reach your normal UpKeep workspace and complete your usual work order tasks.",
      "If anything fails, send the exact error message and a screenshot to IT so we can correct it quickly.",
      "Native login will stay available during the pilot, so use the backup path if you cannot complete SSO.",
      "Please reply after your first successful login and include any friction you noticed, even if you worked around it."
    ],
    footer: "Tone: specific, procedural, and feedback-oriented."
  }
];
