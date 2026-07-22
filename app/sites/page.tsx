import {
  Activity,
  ArrowLeft,
  Ban,
  Building2,
  CalendarClock,
  FlaskConical
} from "lucide-react";
import Link from "next/link";
import { siteUsageSummary } from "../../data/site-usage-summary.js";

function formatDate(value: string | null) {
  if (!value) return "No activity recorded";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

const statusLabels = {
  active: "Active",
  inactive: "Not active",
  test: "Test only"
};

export default function SitesPage() {
  const summary = siteUsageSummary;

  return (
    <main className="users-page sites-page">
      <header className="users-topbar">
        <Link className="back-link" href="/">
          <ArrowLeft size={16} />
          Timeline
        </Link>
        <div>
          <p className="eyebrow">Operational footprint</p>
          <h1>UpKeep site usage</h1>
        </div>
        <span className="status-chip">
          <CalendarClock size={14} />
          Audited {formatDate(summary.generatedAt)}
        </span>
      </header>

      <section className="users-hero panel sites-hero">
        <div>
          <p className="section-label">Current operating status</p>
          <h2>{summary.totals.active} production sites are active</h2>
          <p className="panel-copy">
            Status is based on operational work-order and purchasing activity.
            Service-account logins, including <code>+</code> accounts, do not
            count as evidence that a site is being used.
          </p>
        </div>
        <div className="site-summary-grid" aria-label="Site status totals">
          <div className="site-summary-card site-summary-active">
            <Activity size={18} />
            <strong>{summary.totals.active}</strong>
            <span>Active</span>
          </div>
          <div className="site-summary-card site-summary-inactive">
            <Ban size={18} />
            <strong>{summary.totals.inactive}</strong>
            <span>Not active</span>
          </div>
          <div className="site-summary-card site-summary-test">
            <FlaskConical size={18} />
            <strong>{summary.totals.testOnly}</strong>
            <span>Test only</span>
          </div>
        </div>
      </section>

      <section className="panel site-usage-panel">
        <div className="panel-head">
          <div>
            <p className="section-label">All configured sites</p>
            <h3>{summary.totals.configured} sites reviewed</h3>
          </div>
          <Building2 size={18} />
        </div>

        <div className="usage-table">
          <div className="usage-table-head">
            <span>Site</span>
            <span>Status</span>
            <span>Work orders</span>
            <span>Last 90 days</span>
            <span>Latest activity</span>
          </div>
          {summary.sites.map((site) => (
            <div className="usage-table-row" key={site.name}>
              <div className="usage-site-name">
                <strong>{site.name}</strong>
                {site.note ? <small>{site.note}</small> : null}
              </div>
              <span className={`usage-status usage-status-${site.status}`}>
                {statusLabels[site.status]}
              </span>
              <span>{site.workOrders.toLocaleString()}</span>
              <span>{site.recentWorkOrders.toLocaleString()}</span>
              <span>{formatDate(site.latestActivity)}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
