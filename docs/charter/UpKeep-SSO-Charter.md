# UpKeep SSO Charter

## Purpose

Move UpKeep authentication from local passwords to Microsoft Entra ID single sign-on in a controlled, phased rollout.

## Charter Statement

We are upgrading UpKeep authentication from local passwords to Microsoft Entra ID single sign-on. The rollout will be phased so the pilot group can validate the login path, support process, and account matching before broader enablement.

## Objectives

- Move UpKeep sign-in to Entra ID SSO.
- Reduce password friction and password-reset support.
- Improve security by using company-managed credentials.
- Maintain a controlled fallback path until the rollout is stable.

## Scope

### In scope

- Entra app configuration, SAML claims, certificate, metadata, and pilot validation
- User readiness, helpdesk preparation, and rollout communications

### Out of scope

- Redesigning UpKeep workflows
- Changing unrelated identity systems

## Stakeholders and Decision Rights

- IT / identity team: owns the technical implementation decisions for Entra
- Brent Soper: owns rollout coordination, user readiness, and vendor scheduling support
- Service desk lead: owns first-line support readiness

## Success Criteria

1. A pilot user can sign in to UpKeep through Entra without escalation.
2. The helpdesk has a clear first-response path for login issues.
3. UpKeep and Entra claim mapping match on the expected user identity field.
4. The team has enough confidence to move from pilot into phased rollout.

## Entra Setup Request

- Create or update the UpKeep enterprise app in Entra ID.
- Configure the SAML SSO settings required by UpKeep.
- Set NameID and claims mapping, likely to the user email address.
- Upload or configure the signing certificate.
- Verify the reply URL, ACS URL, and entity ID values.
- Test sign-in end to end with a pilot account.
- Confirm any final setup details needed for cutover.

## Assumptions and Risks

- The rollout will use a pilot-first approach followed by phased waves.
- Some users may need remediation before they can be switched to SSO.
- Mobile login guidance may need to be handled separately from browser login guidance.
- A working session can be scheduled if UpKeep input is needed.
- Native login remains the fallback until the rollout is stable.

## Open Decisions

- Final Entra app ownership and change window
- Whether any pilot users need pre-work before the app is enabled
- Exact support handoff to helpdesk during first login
- Whether UpKeep vendor participation is needed for metadata or test validation

## Immediate Next Actions

1. Hand the Entra setup ticket to the identity owner.
2. Share the rollout draft communications with the broader stakeholder group.
3. Schedule the UpKeep working session if vendor support is needed.
4. Confirm the pilot list and helpdesk coverage so the rollout can start cleanly.
