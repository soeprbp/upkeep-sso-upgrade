import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  CircleAlert,
  RefreshCw,
  UsersRound
} from "lucide-react";
import Link from "next/link";
import { upkeepInventorySummary } from "../../data/upkeep-inventory-summary.js";
import { userReadinessSummary } from "../../data/user-readiness-summary.js";

function formatDate(value: string | null) {
  if (!value) {
    return "Not run yet";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function segmentStyle(value: number, total: number) {
  if (total === 0) {
    return { width: "0%" };
  }
  return { width: `${Math.max(2, Math.round((value / total) * 100))}%` };
}

export default function UsersPage() {
  const summary = userReadinessSummary;
  const inventory = upkeepInventorySummary;
  const total = summary.totals.upkeepUsers;
  const topActions = summary.actionBuckets.filter((bucket) => bucket.count > 0);

  return (
    <main className="users-page">
      <header className="users-topbar">
        <Link className="back-link" href="/">
          <ArrowLeft size={16} />
          Timeline
        </Link>
        <div>
          <p className="eyebrow">Identity readiness</p>
          <h1>UpKeep users vs local AD</h1>
        </div>
        <span className="status-chip">
          <CalendarClock size={14} />
          {formatDate(summary.generatedAt)}
        </span>
      </header>

      <section className="users-hero panel">
        <div>
          <p className="section-label">First-pass reconciliation</p>
          <h2>{summary.readinessPercent}% ready for SSO</h2>
          <p className="panel-copy">
            This page shows only sanitized totals. User-level names and email addresses
            remain in ignored local files under <code>data/generated</code>.
          </p>
        </div>
        <div className="readiness-score">
          <UsersRound size={22} />
          <strong>{total}</strong>
          <span>UpKeep users checked</span>
        </div>
      </section>

      <section className="users-grid">
        <article className="panel panel-lg">
          <div className="panel-head">
            <div>
              <p className="section-label">Readiness chart</p>
              <h3>AD match status</h3>
            </div>
            <span className="status-pill tone-progress">{summary.source}</span>
          </div>

          <div className="stacked-chart" aria-label="User readiness chart">
            {summary.chartSegments.map((segment) => (
              <span
                key={segment.label}
                className={segment.className}
                style={segmentStyle(segment.value, total)}
                title={`${segment.label}: ${segment.value}`}
              />
            ))}
          </div>

          <div className="legend-grid">
            {summary.chartSegments.map((segment) => (
              <div key={segment.label} className="legend-item">
                <span className={`legend-swatch ${segment.className}`} />
                <span>{segment.label}</span>
                <strong>{segment.value}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <div>
              <p className="section-label">Action load</p>
              <h3>{summary.totals.needsAction} need attention</h3>
            </div>
            <AlertTriangle size={16} />
          </div>
          <div className="readiness-grid">
            <div className="metric-card">
              <span className="metric-value">{summary.totals.missingAdUser}</span>
              <span className="metric-label">Missing AD user</span>
            </div>
            <div className="metric-card">
              <span className="metric-value">{summary.totals.disabledAdUser}</span>
              <span className="metric-label">Disabled AD user</span>
            </div>
            <div className="metric-card">
              <span className="metric-value">{summary.totals.missingUpkeepEmail}</span>
              <span className="metric-label">Missing UpKeep email</span>
            </div>
            <div className="metric-card">
              <span className="metric-value">{summary.totals.matched}</span>
              <span className="metric-label">Ready accounts</span>
            </div>
          </div>
          <div className="payroll-strip">
            <div>
              <span>{summary.totals.missingAdPayrollActive}</span>
              <small>active payroll, no AD</small>
            </div>
            <div>
              <span>{summary.totals.missingAdPayrollInactive}</span>
              <small>inactive payroll</small>
            </div>
            <div>
              <span>{summary.totals.missingAdPayrollNotFound}</span>
              <small>not found in payroll</small>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <div>
              <p className="section-label">UpKeep inventory</p>
              <h3>Current account types</h3>
            </div>
            <UsersRound size={16} />
          </div>
          <div className="compact-list">
            {inventory.accountTypes.map((item) => (
              <div key={item.label} className="compact-row">
                <span>{item.label}</span>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
          <p className="panel-copy">
            UpKeep currently has {inventory.locations.total} locations available for
            group-driven mapping.
          </p>
        </article>

        <article className="panel panel-lg">
          <div className="panel-head">
            <div>
              <p className="section-label">Work queue</p>
              <h3>Remediation buckets</h3>
            </div>
            <CircleAlert size={16} />
          </div>

          <div className="bucket-list">
            {summary.actionBuckets.map((bucket) => (
              <div key={bucket.label} className={`bucket-row bucket-${bucket.tone}`}>
                <div>
                  <strong>{bucket.label}</strong>
                  <span>{bucket.description}</span>
                </div>
                <span>{bucket.count}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <div>
              <p className="section-label">Refresh command</p>
              <h3>Run the first pass</h3>
            </div>
            <RefreshCw size={16} />
          </div>
          <div className="command-card">
            <code>npm run users:reconcile</code>
          </div>
          <p className="panel-copy">
            This fetches UpKeep users, checks each address against local AD, writes
            ignored detailed exports, and updates this page with sanitized counts.
          </p>
          {topActions.length === 0 ? (
            <div className="empty-state">
              <BadgeCheck size={16} />
              <span>No action buckets have counts yet.</span>
            </div>
          ) : null}
        </article>
      </section>
    </main>
  );
}
