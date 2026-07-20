"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarRange,
  ChevronRight,
  Circle,
  FileText,
  Github,
  LayoutDashboard,
  ListChecks,
  Menu,
  NotebookText,
  Mail,
  Printer,
  Settings,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  type LucideIcon,
  UsersRound
} from "lucide-react";
import { communicationDrafts } from "../data/communications-drafts";
import {
  communicationPlan,
  risks,
  rolloutPhases,
  sourceSummary,
  technicalChecklist
} from "../data/implementation-plan.js";
import { userReadinessSummary } from "../data/user-readiness-summary.js";
import {
  calculateCompletionProgress,
  calculateCoveragePercent
} from "../lib/dashboard-metrics.mjs";

const repositoryUrl = "https://github.com/soeprbp/upkeep-sso-upgrade";
const docsUrl = `${repositoryUrl}/tree/main/docs`;
const technicalRunbookUrl = `${repositoryUrl}/blob/main/docs/tickets/UpKeep-Entra-Setup-Ticket.md`;
const communicationsUrl = `${repositoryUrl}/tree/main/docs/communications`;
const notesStorageKey = "upkeep-sso-notes";
const completedPhasesStorageKey = "upkeep-sso-completed-phases";
const validPhaseIds = new Set(rolloutPhases.map((phase) => phase.id));

type NavItem = {
  label: string;
  icon: LucideIcon;
  action?: "overview" | "timeline" | "risks" | "actions" | "notes";
  href?: string;
  external?: boolean;
};

const navItems: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, action: "overview" },
  { label: "Timeline", icon: CalendarRange, action: "timeline" },
  { label: "Users", icon: UsersRound, href: "/users" },
  { label: "Risks", icon: ShieldAlert, action: "risks" },
  { label: "Docs", icon: FileText, href: docsUrl, external: true },
  { label: "GitHub", icon: Github, href: repositoryUrl, external: true },
  { label: "Actions", icon: ListChecks, action: "actions" },
  { label: "Notes", icon: NotebookText, action: "notes" }
];

function phaseTone(status: string) {
  switch (status) {
    case "done":
      return "tone-done";
    case "in-progress":
      return "tone-progress";
    case "watch":
      return "tone-watch";
    default:
      return "tone-pending";
  }
}

function phaseLabel(status: string) {
  switch (status) {
    case "done":
      return "On Track";
    case "in-progress":
      return "In Progress";
    case "watch":
      return "Monitoring";
    default:
      return "Pending";
  }
}

function formatDataDate(value: string | null) {
  if (!value) {
    return "Not run yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export default function Page() {
  const notesRef = useRef<HTMLTextAreaElement | null>(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState(rolloutPhases[2].id);
  const [completedPhaseIds, setCompletedPhaseIds] = useState<string[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [savedNotes, setSavedNotes] = useState<
    Array<{ id: string; createdAt: string; phase: string; text: string }>
  >([]);
  const selectedIndex = Math.max(
    0,
    rolloutPhases.findIndex((phase) => phase.id === selectedPhaseId)
  );
  const selectedPhase = useMemo(
    () =>
      rolloutPhases.find((phase) => phase.id === selectedPhaseId) ??
      rolloutPhases[0],
    [selectedPhaseId]
  );
  const selectedPhaseStatus = completedPhaseIds.includes(selectedPhase.id)
    ? "done"
    : selectedPhase.status;
  const isSelectedPhaseComplete = completedPhaseIds.includes(selectedPhase.id);
  const overallProgress = calculateCompletionProgress(
    completedPhaseIds.length,
    rolloutPhases.length
  );
  const expectedUpKeepUsers =
    userReadinessSummary.coverage?.expectedMinimum ?? 0;
  const exportedUpKeepUsers =
    userReadinessSummary.coverage?.actual ??
    userReadinessSummary.totals.upkeepUsers;
  const coveragePercent = calculateCoveragePercent(
    exportedUpKeepUsers,
    expectedUpKeepUsers
  );
  const hasPartialApiCoverage =
    userReadinessSummary.coverage?.status === "below_expected";
  const dataRefreshedAt = formatDataDate(userReadinessSummary.generatedAt);
  const siteEntries = Object.entries(userReadinessSummary.perSite ?? {});
  const fetchedSiteCount = siteEntries.filter(
    ([, site]) => site.status === "active"
  ).length;
  const totalSiteCount = siteEntries.length || 19;

  useEffect(() => {
    try {
      const rawNotes = window.localStorage.getItem(notesStorageKey);
      if (rawNotes) {
        const parsedNotes = JSON.parse(rawNotes) as Array<{
          id: string;
          createdAt: string;
          phase: string;
          text: string;
        }>;
        if (Array.isArray(parsedNotes)) {
          setSavedNotes(parsedNotes);
        }
      }

      const rawCompletedPhases = window.localStorage.getItem(
        completedPhasesStorageKey
      );
      if (rawCompletedPhases) {
        const parsedCompletedPhases = JSON.parse(rawCompletedPhases) as unknown;
        if (Array.isArray(parsedCompletedPhases)) {
          setCompletedPhaseIds([
            ...new Set(
              parsedCompletedPhases.filter(
                (phaseId): phaseId is string =>
                  typeof phaseId === "string" && validPhaseIds.has(phaseId)
              )
            )
          ]);
        }
      }
    } catch {
      // Ignore malformed local dashboard state.
    }
  }, []);

  useEffect(() => {
    if (notesOpen) {
      notesRef.current?.focus();
    }
  }, [notesOpen]);

  function persistNotes(
    nextNotes: Array<{
      id: string;
      createdAt: string;
      phase: string;
      text: string;
    }>
  ) {
    setSavedNotes(nextNotes);
    try {
      window.localStorage.setItem(notesStorageKey, JSON.stringify(nextNotes));
    } catch {
      // Notes still remain available for the current browser session.
    }
  }

  function persistCompletedPhases(nextPhaseIds: string[]) {
    setCompletedPhaseIds(nextPhaseIds);
    try {
      window.localStorage.setItem(
        completedPhasesStorageKey,
        JSON.stringify(nextPhaseIds)
      );
    } catch {
      // Completion state still remains available for the current browser session.
    }
  }

  function scrollToSection(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function openNotes(preferredText?: string) {
    if (preferredText) {
      setNoteText(preferredText);
    }
    setNotesOpen(true);
    window.setTimeout(() => scrollToSection("notes"), 0);
  }

  function completeSelectedPhase() {
    if (isSelectedPhaseComplete) {
      return;
    }

    persistCompletedPhases([...completedPhaseIds, selectedPhase.id]);

    const nextPhase = rolloutPhases[selectedIndex + 1];
    if (nextPhase) {
      setSelectedPhaseId(nextPhase.id);
      scrollToSection("timeline");
      return;
    }

    setNotesOpen(true);
    window.setTimeout(() => scrollToSection("notes"), 0);
  }

  function exportPlan() {
    const payload = {
      sourceSummary,
      rolloutPhases,
      technicalChecklist,
      communicationPlan,
      communicationDrafts,
      risks,
      userReadinessSummary
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "upkeep-sso-upgrade-plan.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function saveNote() {
    const text = noteText.trim();
    if (!text) {
      return;
    }

    const nextNotes = [
      {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        phase: selectedPhase.title,
        text
      },
      ...savedNotes
    ];

    persistNotes(nextNotes);
    setNoteText("");
  }

  return (
    <main className="workspace" id="overview">
      <aside
        className={`sidebar ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
      >
        <div className="brand">
          <div className="brand-mark">
            <span>U</span>
          </div>
          <div>
            <p className="eyebrow">Welch Packaging</p>
            <h1>UpKeep SSO Upgrade</h1>
          </div>
        </div>

        <div className="sidebar-card">
          <div className="sidebar-card-head">
            <span className="sidebar-label">Project status</span>
            <span className="status-chip status-chip-active">
              <Sparkles size={14} />
              Active
            </span>
          </div>
          <p className="sidebar-copy">
            Transition local UpKeep credentials to Entra ID SSO with a two-week,
            phased rollout and SSO-only cutover.
          </p>
        </div>

        <div className="sidebar-card">
          <span className="sidebar-label">Source</span>
          <div className="source-stack">
            <strong>{sourceSummary.title}</strong>
            <span>{sourceSummary.rolloutWindow}</span>
            <span>{sourceSummary.users}</span>
            <span>{sourceSummary.corporateCoverage}</span>
          </div>
        </div>

        <div className="sidebar-card">
          <span className="sidebar-label">Published data</span>
          <p className="sidebar-copy">
            Public, sanitized project totals only. Credentials and user-level
            exports remain local and are not published.
          </p>
        </div>

        <nav className="nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const sharedContent = (
              <>
                <span className="nav-item-left">
                  <Icon size={16} />
                  <span>{item.label}</span>
                </span>
                <ChevronRight size={14} />
              </>
            );

            if (item.href) {
              return item.external ? (
                <a
                  key={item.label}
                  className="nav-item"
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {sharedContent}
                </a>
              ) : (
                <Link key={item.label} className="nav-item" href={item.href}>
                  {sharedContent}
                </Link>
              );
            }

            return (
              <button
                key={item.label}
                className="nav-item"
                type="button"
                onClick={() => {
                  if (item.action === "overview") {
                    scrollToSection("overview");
                  } else if (item.action === "timeline") {
                    scrollToSection("timeline");
                  } else if (item.action === "risks") {
                    scrollToSection("risks");
                  } else if (item.action === "actions") {
                    scrollToSection("actions");
                  } else if (item.action === "notes") {
                    openNotes(selectedPhase.summary);
                  }
                }}
              >
                {sharedContent}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            className="settings-btn"
            type="button"
            onClick={() => scrollToSection("tech")}
          >
            <Settings size={16} />
            Technical checklist
          </button>

          <div className="user-card">
            <div className="avatar">BS</div>
            <div className="user-copy">
              <strong>Brent Soper</strong>
              <span>Welch Packaging</span>
            </div>
          </div>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button"
              type="button"
              aria-label="Open menu"
              aria-expanded={!sidebarCollapsed}
              onClick={() => setSidebarCollapsed((current) => !current)}
            >
              <Menu size={18} />
            </button>
            <div className="topbar-copy">
              <p className="eyebrow">Implementation workspace</p>
              <h2>UpKeep SSO Upgrade</h2>
              <div className="topbar-status-row">
                <span className="status-chip status-chip-active">
                  <BadgeCheck size={14} />
                  {phaseLabel(selectedPhaseStatus)}
                </span>
                <span className="status-chip">
                  <ArrowRight size={14} />
                  Current Phase: {selectedIndex + 1} of {rolloutPhases.length}
                </span>
                <span className="status-chip">
                  <UsersRound size={14} />
                  Overall Progress: {overallProgress}%
                </span>
              </div>
            </div>
          </div>

          <div className="topbar-meta">
            <span className="meta-item">
              <CalendarRange size={16} />
              Data refreshed {dataRefreshedAt}
            </span>
            <span className="meta-item">
              <UsersRound size={16} />
              Expected scope: {expectedUpKeepUsers || "Not set"}
            </span>
            <span className="meta-item">
              <TrendingUp size={16} />
              API scope: {hasPartialApiCoverage ? "Partial" : "Complete"}
            </span>
          </div>
        </header>

        <section className="panel panel-hero" id="timeline">
          <div className="panel-head">
            <h3>Rollout Timeline (2 Weeks)</h3>
            <span className="hero-chip">
              <ShieldAlert size={14} />
              {rolloutPhases.length} phases
            </span>
          </div>

          <div className="rail">
            {rolloutPhases.map((phase) => {
              const isActive = phase.id === selectedPhase.id;
              const isComplete = completedPhaseIds.includes(phase.id);
              return (
                <button
                  key={phase.id}
                  className={`rail-step ${isActive ? "rail-step-active" : ""} ${
                    isComplete ? "rail-step-complete" : ""
                  }`}
                  type="button"
                  onClick={() => setSelectedPhaseId(phase.id)}
                >
                  <span className="rail-node">
                    {isComplete ? (
                      <BadgeCheck size={14} />
                    ) : (
                      <Circle size={14} />
                    )}
                  </span>
                  <span className="rail-title">{phase.title}</span>
                  <span className="rail-window">{phase.window}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="dashboard-grid">
          <article className="panel panel-lg">
            <div className="panel-head">
              <div>
                <p className="section-label">Phase detail</p>
                <h3>
                  Phase {selectedIndex + 1}: {selectedPhase.title}
                </h3>
              </div>
              <span className={`status-pill ${phaseTone(selectedPhaseStatus)}`}>
                {phaseLabel(selectedPhaseStatus)}
              </span>
            </div>

            <div className="detail-grid">
              <div className="detail-block">
                <span className="field-label">Objective</span>
                <p className="panel-copy">{selectedPhase.summary}</p>
              </div>
              <div className="detail-block">
                <span className="field-label">Scope</span>
                <p className="panel-copy small">
                  {selectedPhase.focus.join(" • ")}
                </p>
              </div>
              <div className="detail-block">
                <span className="field-label">Deliverables</span>
                <ul className="compact-list">
                  {selectedPhase.milestones.map((item) => (
                    <li key={item}>
                      <BadgeCheck size={14} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="detail-footer">
                <div>
                  <span className="field-label">Progress</span>
                  <div className="progress-track" aria-hidden="true">
                    <span
                      className="progress-fill"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                </div>
                <span className="progress-label">{overallProgress}%</span>
              </div>
              <div className="detail-meta">
                <div>
                  <span className="field-label">Phase Owner</span>
                  <strong>{selectedPhase.owner}</strong>
                </div>
                <div>
                  <span className="field-label">Target Window</span>
                  <strong>{selectedPhase.window}</strong>
                </div>
              </div>
            </div>
          </article>

          <article className="panel">
            <div className="panel-head">
              <div>
                <p className="section-label">Checklist</p>
                <h3>Phase milestone checklist</h3>
              </div>
            </div>
            <div className="checklist">
              {selectedPhase.milestones.map((item, index) => (
                <div key={item} className="checklist-row">
                  <span className="check-index">{index + 1}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="panel-head">
              <div>
                <p className="section-label">Readiness</p>
                <h3>Users & identity readiness</h3>
              </div>
              <span className="info-dot">i</span>
            </div>

            <div className="readiness-grid">
              <div className="metric-card">
                <span className="metric-value">
                  {userReadinessSummary.totals.upkeepUsers || "~110"}
                </span>
                <span className="metric-label">UpKeep users</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">
                  {userReadinessSummary.readinessPercent}%
                </span>
                <span className="metric-label">visible export matched</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">
                  {userReadinessSummary.totals.matched}
                </span>
                <span className="metric-label">Matched AD users</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">
                  {userReadinessSummary.totals.needsAction}
                </span>
                <span className="metric-label">need action in export</span>
              </div>
            </div>

            <div className="readiness-footer">
              <strong>{userReadinessSummary.source}</strong>
              <div className="readiness-footer-links">
                <span className="meta-item">
                  {fetchedSiteCount} of {totalSiteCount} sites fetched
                </span>
                <Link href="/users">View users page</Link>
              </div>
            </div>
          </article>

          <article className="panel">
            <div className="panel-head">
              <div>
                <p className="section-label">API coverage</p>
                <h3>UpKeep user export scope</h3>
              </div>
              <span
                className={`status-pill ${hasPartialApiCoverage ? "tone-watch" : "tone-done"}`}
              >
                {hasPartialApiCoverage ? "Partial" : "Complete"}
              </span>
            </div>

            <div className="coverage-card">
              <div className="coverage-meter-head">
                <div>
                  <span className="metric-value">{exportedUpKeepUsers}</span>
                  <span className="metric-label">
                    users visible through API
                  </span>
                </div>
                <div>
                  <span className="metric-value">
                    {expectedUpKeepUsers || "~117"}
                  </span>
                  <span className="metric-label">expected full scope</span>
                </div>
              </div>
              <div
                className="progress-track"
                aria-label={`${coveragePercent}% API coverage`}
              >
                <span
                  className="progress-fill coverage-fill"
                  style={{ width: `${coveragePercent}%` }}
                />
              </div>
              <div className="coverage-note">
                <TrendingUp size={16} />
                <span>
                  Access update pending. Re-run the UpKeep export when the
                  account scope changes; this panel should move toward the full
                  user population.
                </span>
              </div>
            </div>
          </article>

          <article id="tech" className="panel">
            <div className="panel-head">
              <div>
                <p className="section-label">Technical setup</p>
                <h3>Technical setup status</h3>
              </div>
            </div>
            <div className="status-list">
              {technicalChecklist.map((item) => (
                <div key={item} className="status-row">
                  <span className="status-icon">
                    <BadgeCheck size={14} />
                  </span>
                  <span>{item}</span>
                  <span className="status-value">Configured</span>
                </div>
              ))}
            </div>
            <a
              className="footer-link"
              href={technicalRunbookUrl}
              target="_blank"
              rel="noreferrer"
            >
              View technical runbook <ArrowRight size={14} />
            </a>
          </article>

          <article id="communications" className="panel">
            <div className="panel-head">
              <div>
                <p className="section-label">Communications</p>
                <h3>Communications</h3>
              </div>
            </div>
            <div className="message-group">
              <p className="group-title">Pilot Communication</p>
              <div className="status-list compact">
                {communicationPlan.slice(0, 2).map((item) => (
                  <div key={item.label} className="status-row">
                    <span className="status-icon">
                      <BadgeCheck size={14} />
                    </span>
                    <span>
                      {item.label} - {item.detail}
                    </span>
                    <span className="status-value">
                      {item.status === "sent" ? "Sent" : "Planned"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="message-group">
              <p className="group-title">Company-Wide Rollout Communication</p>
              <div className="status-list compact">
                {communicationPlan.slice(2).map((item) => (
                  <div key={item.label} className="status-row">
                    <span className="status-icon">
                      <BadgeCheck size={14} />
                    </span>
                    <span>
                      {item.label} - {item.detail}
                    </span>
                    <span className="status-value">
                      {item.status === "sent" ? "Sent" : "Planned"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="draft-grid">
              {communicationDrafts.map((draft) => (
                <article key={draft.id} className="draft-card">
                  <div className="draft-card-head">
                    <div>
                      <p className="group-title">{draft.audience}</p>
                      <h4>{draft.title}</h4>
                    </div>
                    <span className="draft-chip">
                      <Mail size={14} />
                      Draft
                    </span>
                  </div>

                  <div className="draft-meta">
                    <span>
                      <strong>Subject:</strong> {draft.subject}
                    </span>
                    <span>
                      <strong>Preheader:</strong> {draft.preheader}
                    </span>
                  </div>

                  <p className="panel-copy small">{draft.summary}</p>

                  <div className="draft-copy">
                    {draft.body.map((line, index) => (
                      <p key={`${draft.id}-${index}`}>{line}</p>
                    ))}
                  </div>

                  <div className="draft-footer">{draft.footer}</div>
                </article>
              ))}
            </div>
            <a
              className="footer-link"
              href={communicationsUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open communication documents <ArrowRight size={14} />
            </a>
          </article>

          <article id="risks" className="panel panel-lg">
            <div className="panel-head">
              <div>
                <p className="section-label">Risks</p>
                <h3>Risks</h3>
              </div>
              <a className="footer-link" href="#timeline">
                Back to timeline <ArrowRight size={14} />
              </a>
            </div>

            <div className="risk-table">
              <div className="risk-head">
                <span>Risk</span>
                <span>Severity</span>
                <span>Mitigation / Owner</span>
              </div>
              {risks.map((risk) => (
                <div key={risk.label} className="risk-row">
                  <span>{risk.label}</span>
                  <span className={`severity severity-${risk.severity}`}>
                    {risk.severity}
                  </span>
                  <span>{risk.mitigation}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <div id="actions" />
            <div className="panel-head">
              <div>
                <p className="section-label">GitHub Repository</p>
                <h3>GitHub Repository</h3>
              </div>
              <Github size={16} />
            </div>
            <div className="github-card">
              <a href={repositoryUrl} target="_blank" rel="noreferrer">
                soeprbp/upkeep-sso-upgrade
              </a>
              <div className="repo-meta">
                <span>Hosting: GitHub.com</span>
                <span>Visibility: Public</span>
              </div>
              <div className="repo-stats">
                <div>
                  <strong>Public</strong>
                  <span>Visibility</span>
                </div>
                <div>
                  <strong>main</strong>
                  <span>Default Branch</span>
                </div>
                <div>
                  <strong>Pages</strong>
                  <span>Hosting</span>
                </div>
                <div>
                  <strong>Actions</strong>
                  <span>Deployment</span>
                </div>
              </div>
              <a
                className="footer-link"
                href={repositoryUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open in GitHub <ArrowRight size={14} />
              </a>
            </div>
          </article>
        </section>

        <footer className="action-bar">
          <div className="action-group">
            <button
              className="action primary"
              type="button"
              onClick={completeSelectedPhase}
              disabled={isSelectedPhaseComplete}
            >
              <BadgeCheck size={16} />
              {isSelectedPhaseComplete ? "Completed" : "Mark Complete"}
            </button>
            <button
              className="action"
              type="button"
              onClick={() => openNotes(selectedPhase.summary)}
            >
              <NotebookText size={16} />
              Add Note
            </button>
            <button className="action" type="button" onClick={exportPlan}>
              <ArrowRight size={16} />
              Export Plan
            </button>
          </div>

          <button
            className="action"
            type="button"
            onClick={() => window.print()}
          >
            <Printer size={16} />
            Print
          </button>
        </footer>

        {notesOpen ? (
          <section className="panel notes-panel" id="notes">
            <div className="panel-head">
              <div>
                <p className="section-label">Notes</p>
                <h3>Capture a rollout note</h3>
              </div>
              <button
                className="action"
                type="button"
                onClick={() => setNotesOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="notes-layout">
              <label className="notes-field">
                <span className="field-label">Note text</span>
                <textarea
                  ref={notesRef}
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                  placeholder="Write a note about the current phase, a follow-up, or a blocker."
                />
              </label>

              <div className="notes-actions">
                <button
                  className="action primary"
                  type="button"
                  onClick={saveNote}
                >
                  <BadgeCheck size={16} />
                  Save Note
                </button>
                <button
                  className="action"
                  type="button"
                  onClick={() => setNoteText(selectedPhase.summary)}
                >
                  Fill phase summary
                </button>
                <button
                  className="action"
                  type="button"
                  onClick={() => scrollToSection("communications")}
                >
                  Jump to communications
                </button>
              </div>
            </div>

            <div className="saved-notes">
              {savedNotes.length === 0 ? (
                <div className="empty-state">
                  <BadgeCheck size={16} />
                  <span>No saved notes yet.</span>
                </div>
              ) : (
                savedNotes.map((note) => (
                  <article key={note.id} className="saved-note">
                    <div className="saved-note-head">
                      <strong>{note.phase}</strong>
                      <span>
                        {new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit"
                        }).format(new Date(note.createdAt))}
                      </span>
                    </div>
                    <p>{note.text}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
