"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  CalendarRange,
  ChevronRight,
  Circle,
  FileText,
  Github,
  LayoutDashboard,
  ListChecks,
  Menu,
  NotebookText,
  Printer,
  Settings,
  ShieldAlert,
  Sparkles,
  UsersRound
} from "lucide-react";
import {
  communicationPlan,
  risks,
  rolloutPhases,
  sourceSummary,
  technicalChecklist
} from "../data/implementation-plan.js";
import { userReadinessSummary } from "../data/user-readiness-summary.js";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, active: false },
  { label: "Timeline", icon: CalendarRange, active: true },
  { label: "Users", icon: UsersRound, active: false, href: "/users" },
  { label: "Risks", icon: ShieldAlert, active: false },
  { label: "Docs", icon: FileText, active: false },
  { label: "GitHub", icon: Github, active: false },
  { label: "Actions", icon: ListChecks, active: false },
  { label: "Notes", icon: NotebookText, active: false }
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

export default function Page() {
  const [selectedPhaseId, setSelectedPhaseId] = useState(rolloutPhases[2].id);
  const selectedIndex = Math.max(
    0,
    rolloutPhases.findIndex((phase) => phase.id === selectedPhaseId)
  );
  const selectedPhase =
    useMemo(
      () => rolloutPhases.find((phase) => phase.id === selectedPhaseId) ?? rolloutPhases[0],
      [selectedPhaseId]
    ) ?? rolloutPhases[0];
  const overallProgress = Math.round(((selectedIndex + 1) / rolloutPhases.length) * 100);

  return (
    <main className="workspace">
      <aside className="sidebar">
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

        <nav className="nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                className={`nav-item ${item.active ? "nav-item-active" : ""}`}
                href={item.href ?? "#"}
              >
                <span className="nav-item-left">
                  <Icon size={16} />
                  <span>{item.label}</span>
                </span>
                <ChevronRight size={14} />
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="settings-btn" type="button">
            <Settings size={16} />
            Project Settings
          </button>

          <div className="user-card">
            <div className="avatar">JB</div>
            <div className="user-copy">
              <strong>Justin Baker</strong>
              <span>Project Owner</span>
            </div>
          </div>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button" type="button" aria-label="Open menu">
              <Menu size={18} />
            </button>
            <div className="topbar-copy">
              <p className="eyebrow">Implementation workspace</p>
              <h2>UpKeep SSO Upgrade</h2>
              <div className="status-row">
                <span className="status-chip status-chip-active">
                  <BadgeCheck size={14} />
                  {phaseLabel(selectedPhase.status)}
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
              May 12, 2025
            </span>
            <span className="meta-item">
              <UsersRound size={16} />
              6
            </span>
            <span className="meta-item">
              <Bell size={16} />
              <span className="badge-dot">3</span>
            </span>
          </div>
        </header>

        <section className="panel panel-hero">
          <div className="panel-head">
            <h3>Rollout Timeline (2 Weeks)</h3>
            <span className="hero-chip">
              <ShieldAlert size={14} />
              {rolloutPhases.length} phases
            </span>
          </div>

          <div className="rail">
            {rolloutPhases.map((phase, index) => {
              const isActive = phase.id === selectedPhase.id;
              const isComplete = index < selectedIndex;
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
                    {isComplete ? <BadgeCheck size={14} /> : <Circle size={14} />}
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
                <h3>Phase {selectedIndex + 1}: {selectedPhase.title}</h3>
              </div>
              <span className={`status-pill ${phaseTone(selectedPhase.status)}`}>
                {phaseLabel(selectedPhase.status)}
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
                <span className="metric-value">{userReadinessSummary.totals.upkeepUsers || "~110"}</span>
                <span className="metric-label">UpKeep users</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">{userReadinessSummary.readinessPercent}%</span>
                <span className="metric-label">AD match readiness</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">{userReadinessSummary.totals.matched}</span>
                <span className="metric-label">Matched AD users</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">{userReadinessSummary.totals.needsAction}</span>
                <span className="metric-label">Need action</span>
              </div>
            </div>

            <div className="readiness-footer">
              <strong>{userReadinessSummary.source}</strong>
              <Link href="/users">View users page</Link>
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
            <a className="footer-link" href="#communications">
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
                    <span>{item.label} - {item.detail}</span>
                    <span className="status-value">Planned</span>
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
                    <span>{item.label} - {item.detail}</span>
                    <span className="status-value">Planned</span>
                  </div>
                ))}
              </div>
            </div>
            <a className="footer-link" href="#risks">
              View all messages <ArrowRight size={14} />
            </a>
          </article>

          <article id="risks" className="panel panel-lg">
            <div className="panel-head">
              <div>
                <p className="section-label">Risks</p>
                <h3>Risks</h3>
              </div>
              <a className="footer-link" href="#">
                View all risks <ArrowRight size={14} />
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
            <div className="panel-head">
              <div>
                <p className="section-label">GitHub Repository</p>
                <h3>GitHub Repository</h3>
              </div>
              <Github size={16} />
            </div>
            <div className="github-card">
              <a href="https://github.com/soeprbp/upkeep-dashboard" target="_blank" rel="noreferrer">
                welchcorp/upkeep-sso-upgrade
              </a>
              <div className="repo-meta">
                <span>Hosting: GitHub.com</span>
                <span>Visibility: Private</span>
              </div>
              <div className="repo-stats">
                <div>
                  <strong>42</strong>
                  <span>Commits</span>
                </div>
                <div>
                  <strong>main</strong>
                  <span>Default Branch</span>
                </div>
                <div>
                  <strong>3</strong>
                  <span>Open PRs</span>
                </div>
                <div>
                  <strong>All Checks</strong>
                  <span>Passing</span>
                </div>
              </div>
              <a className="footer-link" href="https://github.com/soeprbp/upkeep-dashboard" target="_blank" rel="noreferrer">
                Open in GitHub <ArrowRight size={14} />
              </a>
            </div>
          </article>
        </section>

        <footer className="action-bar">
          <div className="action-group">
            <button className="action primary" type="button">
              <BadgeCheck size={16} />
              Mark Complete
            </button>
            <button className="action" type="button">
              <NotebookText size={16} />
              Add Note
            </button>
            <button className="action" type="button">
              <ArrowRight size={16} />
              Export Plan
            </button>
          </div>

          <button className="action" type="button">
            <Printer size={16} />
            Print
          </button>
        </footer>
      </section>
    </main>
  );
}
