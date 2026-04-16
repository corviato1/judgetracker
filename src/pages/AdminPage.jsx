import React, { useState, useEffect, useCallback } from "react";
import "./AdminPage.css";
import ThemeToggle from "../components/ThemeToggle";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "traffic", label: "Search & Traffic" },
  { id: "players", label: "Game Players" },
  { id: "duel", label: "Judge Duel" },
  { id: "email", label: "Email Results" },
  { id: "ratelimits", label: "API & Rate Limits" },
  { id: "cache", label: "Cache" },
  { id: "ads", label: "Ad Space" },
];

function StatCard({ label, value }) {
  return (
    <div className="adm-stat-card">
      <div className="adm-stat-value">{value ?? "—"}</div>
      <div className="adm-stat-label">{label}</div>
    </div>
  );
}

function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        onLogin();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Invalid password.");
      }
    } catch {
      setError("Could not reach server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adm-login-wrap">
      <div className="adm-login-box">
        <h2 className="adm-login-title">Admin Access</h2>
        <p className="adm-login-sub">JudgeTracker internal dashboard</p>
        <form onSubmit={handleSubmit} className="adm-login-form">
          <input
            type="password"
            className="adm-login-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error && <p className="adm-login-error">{error}</p>}
          <button className="adm-login-btn" type="submit" disabled={loading}>
            {loading ? "Checking…" : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}

function SeedPanel() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/seed-judges", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus({ ok: true, message: `Seeded ${data.seeded} judges into the database.${data.errors?.length ? ` (${data.errors.length} query errors)` : ""}` });
      } else {
        setStatus({ ok: false, message: data.error || "Seed failed." });
      }
    } catch {
      setStatus({ ok: false, message: "Network error." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "2rem", padding: "1rem", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}>
      <h3 className="adm-section-title" style={{ marginBottom: "0.5rem" }}>Database Tools</h3>
      <p style={{ fontSize: "0.85rem", color: "#a0aec0", marginBottom: "0.75rem" }}>
        Populate the judges database from CourtListener using common surname queries.
        Run this once to enable Judge Duel. Requires COURTLISTENER_API_TOKEN to be set.
      </p>
      <button
        className="adm-login-btn"
        onClick={handleSeed}
        disabled={loading}
        style={{ width: "auto", padding: "0.5rem 1.25rem" }}
      >
        {loading ? "Seeding judges… (may take ~30s)" : "Seed judges from CourtListener"}
      </button>
      {status && (
        <p style={{
          marginTop: "0.6rem",
          fontSize: "0.85rem",
          color: status.ok ? "#68d391" : "#fc8181",
        }}>
          {status.message}
        </p>
      )}
    </div>
  );
}

function OverviewTab() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch("/api/admin/overview", { credentials: "include" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setErr("Failed to load."));
  }, []);

  if (err) return <p className="adm-err">{err}</p>;
  if (!data) return <p className="adm-loading">Loading…</p>;

  return (
    <div>
      <div className="adm-stat-grid">
        <StatCard label="Page views (7d)" value={data.pageViews7d} />
        <StatCard label="Page views (30d)" value={data.pageViews30d} />
        <StatCard label="Unique sessions (7d)" value={data.uniqueSessions7d} />
        <StatCard label="Unique sessions (30d)" value={data.uniqueSessions30d} />
        <StatCard label="Active users (1h)" value={data.activeUsers1h} />
        <StatCard label="New sessions (30d)" value={data.newSessions} />
        <StatCard label="Returning sessions (30d)" value={data.returningSessions} />
      </div>

      <div className="adm-two-col">
        <div>
          <h3 className="adm-section-title">Top 10 Judges Viewed</h3>
          <table className="adm-table">
            <thead><tr><th>Judge ID</th><th>Views</th></tr></thead>
            <tbody>
              {(data.topJudges || []).map((r, i) => (
                <tr key={i}><td>{r.judge_id}</td><td>{r.views}</td></tr>
              ))}
              {!data.topJudges?.length && <tr><td colSpan="2" className="adm-empty">No data yet</td></tr>}
            </tbody>
          </table>
        </div>
        <div>
          <h3 className="adm-section-title">Top 10 Search Queries</h3>
          <table className="adm-table">
            <thead><tr><th>Query</th><th>Count</th></tr></thead>
            <tbody>
              {(data.topSearches || []).map((r, i) => (
                <tr key={i}><td>{r.query}</td><td>{r.count}</td></tr>
              ))}
              {!data.topSearches?.length && <tr><td colSpan="2" className="adm-empty">No data yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <SeedPanel />
    </div>
  );
}

function TrafficTab() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch("/api/admin/traffic", { credentials: "include" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setErr("Failed to load."));
  }, []);

  if (err) return <p className="adm-err">{err}</p>;
  if (!data) return <p className="adm-loading">Loading…</p>;

  return (
    <div>
      <div className="adm-two-col">
        <div>
          <h3 className="adm-section-title">Daily Search Volume (30d)</h3>
          <table className="adm-table">
            <thead><tr><th>Day</th><th>Searches</th></tr></thead>
            <tbody>
              {(data.dailySearchVolume || []).map((r, i) => (
                <tr key={i}><td>{r.day?.slice(0, 10)}</td><td>{r.count}</td></tr>
              ))}
              {!data.dailySearchVolume?.length && <tr><td colSpan="2" className="adm-empty">No data yet</td></tr>}
            </tbody>
          </table>
        </div>
        <div>
          <h3 className="adm-section-title">No-Results Queries</h3>
          <table className="adm-table">
            <thead><tr><th>Query</th><th>Count</th></tr></thead>
            <tbody>
              {(data.noResultsQueries || []).map((r, i) => (
                <tr key={i}><td>{r.query}</td><td>{r.count}</td></tr>
              ))}
              {!data.noResultsQueries?.length && <tr><td colSpan="2" className="adm-empty">No data yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="adm-two-col">
        <div>
          <h3 className="adm-section-title">Referrers</h3>
          <table className="adm-table">
            <thead><tr><th>Referrer</th><th>Count</th></tr></thead>
            <tbody>
              {(data.referrers || []).map((r, i) => (
                <tr key={i}><td className="adm-truncate">{r.referrer || "(direct)"}</td><td>{r.count}</td></tr>
              ))}
              {!data.referrers?.length && <tr><td colSpan="2" className="adm-empty">No data yet</td></tr>}
            </tbody>
          </table>
        </div>
        <div>
          <h3 className="adm-section-title">Devices</h3>
          <table className="adm-table">
            <thead><tr><th>Device</th><th>Count</th></tr></thead>
            <tbody>
              {(data.devices || []).map((r, i) => (
                <tr key={i}><td>{r.device_type}</td><td>{r.count}</td></tr>
              ))}
              {!data.devices?.length && <tr><td colSpan="2" className="adm-empty">No data yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="adm-two-col">
        <div>
          <h3 className="adm-section-title">Browsers</h3>
          <table className="adm-table">
            <thead><tr><th>Browser</th><th>Count</th></tr></thead>
            <tbody>
              {(data.browsers || []).map((r, i) => (
                <tr key={i}><td>{r.browser}</td><td>{r.count}</td></tr>
              ))}
              {!data.browsers?.length && <tr><td colSpan="2" className="adm-empty">No data yet</td></tr>}
            </tbody>
          </table>
        </div>
        <div>
          <h3 className="adm-section-title">Countries (30d)</h3>
          <table className="adm-table">
            <thead><tr><th>Country</th><th>Sessions</th></tr></thead>
            <tbody>
              {(data.countries || []).map((r, i) => (
                <tr key={i}><td>{r.country}</td><td>{r.count}</td></tr>
              ))}
              {!data.countries?.length && <tr><td colSpan="2" className="adm-empty">No data yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <h3 className="adm-section-title">Avg Time on Page (by route)</h3>
      <table className="adm-table">
        <thead><tr><th>Route</th><th>Avg (ms)</th><th>Views</th></tr></thead>
        <tbody>
          {(data.timeOnPage || []).map((r, i) => (
            <tr key={i}><td>{r.route}</td><td>{Math.round(r.avg_ms)}</td><td>{r.views}</td></tr>
          ))}
          {!data.timeOnPage?.length && <tr><td colSpan="3" className="adm-empty">No data yet</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function PlayersTab() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    fetch(`/api/admin/players?search=${encodeURIComponent(search)}&page=${page}`, { credentials: "include" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setErr("Failed to load."));
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const expand = async (sessionId) => {
    if (expandedId === sessionId) { setExpandedId(null); setDetail(null); return; }
    setExpandedId(sessionId);
    setDetail(null);
    try {
      const res = await fetch(`/api/admin/players/${sessionId}`, { credentials: "include" });
      const d = await res.json();
      setDetail(d);
    } catch {
      setDetail({ error: "Failed to load timeline." });
    }
  };

  if (err) return <p className="adm-err">{err}</p>;
  if (!data) return <p className="adm-loading">Loading…</p>;

  const t = data.totals || {};

  return (
    <div>
      <div className="adm-stat-grid">
        <StatCard label="Total unique players" value={t.total_players} />
        <StatCard label="Avg rounds/session" value={t.avg_rounds ? Number(t.avg_rounds).toFixed(1) : "—"} />
        <StatCard label="Duel sessions" value={t.duel_count} />
        <StatCard label="Quiz sessions" value={t.quiz_count} />
      </div>

      <div className="adm-search-bar">
        <input
          className="adm-search-input"
          placeholder="Search by session ID…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <table className="adm-table adm-table-full">
        <thead>
          <tr>
            <th>Session ID</th>
            <th>Game</th>
            <th>Started</th>
            <th>Rounds</th>
            <th>Score</th>
            <th>Result</th>
            <th>Device</th>
            <th>Country</th>
          </tr>
        </thead>
        <tbody>
          {(data.sessions || []).map((s) => (
            <React.Fragment key={s.id}>
              <tr
                className={`adm-row-clickable ${expandedId === s.session_id ? "adm-row-expanded" : ""}`}
                onClick={() => expand(s.session_id)}
              >
                <td className="adm-mono adm-truncate">{s.session_id}</td>
                <td>{s.game_type}</td>
                <td>{s.started_at?.slice(0, 16)}</td>
                <td>{s.rounds_completed}</td>
                <td>{s.final_score ?? "—"}</td>
                <td>{s.result_label || "—"}</td>
                <td>{s.device_type || "—"}</td>
                <td>{s.country || "—"}</td>
              </tr>
              {expandedId === s.session_id && (
                <tr>
                  <td colSpan="8" className="adm-timeline-cell">
                    {!detail ? (
                      <p className="adm-loading">Loading timeline…</p>
                    ) : detail.error ? (
                      <p className="adm-err">{detail.error}</p>
                    ) : (
                      <div className="adm-timeline">
                        <strong>Event Timeline</strong>
                        <table className="adm-table" style={{ marginTop: "0.5rem" }}>
                          <thead><tr><th>Time</th><th>Type</th><th>Route</th><th>Details</th></tr></thead>
                          <tbody>
                            {(detail.events || []).map((ev, i) => (
                              <tr key={i}>
                                <td>{ev.created_at?.slice(11, 19)}</td>
                                <td>{ev.event_type}</td>
                                <td>{ev.route || "—"}</td>
                                <td className="adm-truncate">{ev.query || ev.judge_id || JSON.stringify(ev.metadata || {}).slice(0, 60)}</td>
                              </tr>
                            ))}
                            {!detail.events?.length && <tr><td colSpan="4" className="adm-empty">No events</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
          {!data.sessions?.length && (
            <tr><td colSpan="8" className="adm-empty">No player sessions yet</td></tr>
          )}
        </tbody>
      </table>

      <div className="adm-pagination">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="adm-page-btn">← Prev</button>
        <span>Page {page}</span>
        <button disabled={data.sessions?.length < 50} onClick={() => setPage((p) => p + 1)} className="adm-page-btn">Next →</button>
      </div>
    </div>
  );
}

function DuelTab() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch("/api/admin/duel-stats", { credentials: "include" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setErr("Failed to load."));
  }, []);

  if (err) return <p className="adm-err">{err}</p>;
  if (!data) return <p className="adm-loading">Loading…</p>;

  const t = data.totals || {};

  return (
    <div>
      <div className="adm-stat-grid">
        <StatCard label="Total games played" value={t.total_games} />
        <StatCard label="Avg score" value={t.avg_score ? Number(t.avg_score).toFixed(1) : "—"} />
        <StatCard label="Completion rate" value={t.completion_rate ? `${(t.completion_rate * 100).toFixed(0)}%` : "—"} />
      </div>

      <div className="adm-two-col">
        <div>
          <h3 className="adm-section-title">Most-Selected Winning Judges</h3>
          <table className="adm-table">
            <thead><tr><th>Judge</th><th>Wins</th></tr></thead>
            <tbody>
              {(data.winningJudges || []).map((r, i) => (
                <tr key={i}><td>{r.judge_name || r.selected_judge_id}</td><td>{r.wins}</td></tr>
              ))}
              {!data.winningJudges?.length && <tr><td colSpan="2" className="adm-empty">No data yet</td></tr>}
            </tbody>
          </table>
        </div>
        <div>
          <h3 className="adm-section-title">Most-Used Filter Combos</h3>
          <table className="adm-table">
            <thead><tr><th>Filters</th><th>Count</th></tr></thead>
            <tbody>
              {(data.filterCombos || []).map((r, i) => (
                <tr key={i}><td className="adm-truncate">{r.filter_combo}</td><td>{r.count}</td></tr>
              ))}
              {!data.filterCombos?.length && <tr><td colSpan="2" className="adm-empty">No data yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <h3 className="adm-section-title">Per-Stat Win Rates</h3>
      <table className="adm-table">
        <thead><tr><th>Stat</th><th>Win Rate</th><th>Rounds</th></tr></thead>
        <tbody>
          {(data.statWinRates || []).map((r, i) => (
            <tr key={i}><td>{r.stat_key}</td><td>{(r.win_rate * 100).toFixed(0)}%</td><td>{r.rounds}</td></tr>
          ))}
          {!data.statWinRates?.length && <tr><td colSpan="3" className="adm-empty">No data yet</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function EmailTab() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [filters, setFilters] = useState({ email: "", dateFrom: "", dateTo: "", judge: "" });
  const [page, setPage] = useState(1);
  const [downloading, setDownloading] = useState(null);

  const load = useCallback(() => {
    const params = new URLSearchParams({
      page,
      ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
    });
    fetch(`/api/admin/quiz-email-submissions?${params}`, { credentials: "include" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setErr("Failed to load."));
  }, [filters, page]);

  useEffect(() => { load(); }, [load]);

  const downloadPdf = async (id, email) => {
    setDownloading(id);
    try {
      const res = await fetch(`/api/admin/quiz-email-submissions/${id}/pdf`, { credentials: "include" });
      if (!res.ok) { alert("PDF not available for this submission."); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quiz-result-${email.split("@")[0]}-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Download failed.");
    } finally {
      setDownloading(null);
    }
  };

  if (err) return <p className="adm-err">{err}</p>;

  return (
    <div>
      <div className="adm-filter-bar">
        <input className="adm-filter-input" placeholder="Filter by email…" value={filters.email}
          onChange={(e) => { setFilters((f) => ({ ...f, email: e.target.value })); setPage(1); }} />
        <input className="adm-filter-input" placeholder="Filter by judge…" value={filters.judge}
          onChange={(e) => { setFilters((f) => ({ ...f, judge: e.target.value })); setPage(1); }} />
        <input className="adm-filter-input" type="date" title="From date" value={filters.dateFrom}
          onChange={(e) => { setFilters((f) => ({ ...f, dateFrom: e.target.value })); setPage(1); }} />
        <input className="adm-filter-input" type="date" title="To date" value={filters.dateTo}
          onChange={(e) => { setFilters((f) => ({ ...f, dateTo: e.target.value })); setPage(1); }} />
      </div>

      {!data ? <p className="adm-loading">Loading…</p> : (
        <>
          <table className="adm-table adm-table-full">
            <thead>
              <tr>
                <th>#</th>
                <th>Email</th>
                <th>Session ID</th>
                <th>Matched Judge</th>
                <th>Result</th>
                <th>Submitted</th>
                <th>PDF</th>
              </tr>
            </thead>
            <tbody>
              {(data.submissions || []).map((s, i) => (
                <tr key={s.id}>
                  <td>{(page - 1) * 50 + i + 1}</td>
                  <td>{s.email}</td>
                  <td className="adm-mono adm-truncate">{s.session_id}</td>
                  <td>{s.judge_name || s.matched_judge_id || "—"}</td>
                  <td>{s.result_label || "—"}</td>
                  <td>{s.created_at?.slice(0, 16)}</td>
                  <td>
                    <button
                      className="adm-pdf-btn"
                      disabled={downloading === s.id}
                      onClick={() => downloadPdf(s.id, s.email)}
                    >
                      {downloading === s.id ? "…" : "Download PDF"}
                    </button>
                  </td>
                </tr>
              ))}
              {!data.submissions?.length && (
                <tr><td colSpan="7" className="adm-empty">No submissions yet</td></tr>
              )}
            </tbody>
          </table>

          <div className="adm-pagination">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="adm-page-btn">← Prev</button>
            <span>Page {page}</span>
            <button disabled={data.submissions?.length < 50} onClick={() => setPage((p) => p + 1)} className="adm-page-btn">Next →</button>
          </div>
        </>
      )}
    </div>
  );
}

function RateLimitsTab() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch("/api/admin/rate-limits", { credentials: "include" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setErr("Failed to load."));
  }, []);

  if (err) return <p className="adm-err">{err}</p>;
  if (!data) return <p className="adm-loading">Loading…</p>;

  const api = data.apiCalls || {};
  const cache = data.cacheStats || {};

  return (
    <div>
      <h3 className="adm-section-title">CourtListener API Calls</h3>
      <div className="adm-stat-grid">
        <StatCard label="Today" value={api.today} />
        <StatCard label="This week" value={api.week} />
        <StatCard label="This month" value={api.month} />
        <StatCard label="Cache entries (total)" value={cache.total_entries} />
        <StatCard label="Cache entries (active)" value={cache.active_entries} />
      </div>

      <h3 className="adm-section-title">Recent Errors (last 50)</h3>
      <table className="adm-table">
        <thead><tr><th>Time</th><th>Type</th><th>Details</th></tr></thead>
        <tbody>
          {(data.recentErrors || []).map((e, i) => (
            <tr key={i}>
              <td>{e.created_at?.slice(0, 16)}</td>
              <td>{e.event_type}</td>
              <td className="adm-truncate">{JSON.stringify(e.metadata || {}).slice(0, 80)}</td>
            </tr>
          ))}
          {!data.recentErrors?.length && <tr><td colSpan="3" className="adm-empty">No errors logged</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

const PAGE_KEY_OPTIONS = ["home", "judges", "scotus", "profile", "which-judge", "duel", "advertise"];

function SponsorEditRow({ placement, onSaved }) {
  const [fields, setFields] = useState({
    page_key: placement.page_key || "",
    sponsor_url: placement.sponsor_url || "",
    sponsor_image_url: placement.sponsor_image_url || "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSave = async (e) => {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      const body = {
        page_key: fields.page_key || null,
        sponsor_url: fields.sponsor_url || null,
        sponsor_image_url: fields.sponsor_image_url || null,
      };
      const res = await fetch(`/api/admin/ads/${placement.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d.error || "Save failed.");
      } else {
        onSaved();
      }
    } catch {
      setErr("Network error.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr>
      <td colSpan="7" style={{ padding: "0.75rem 1rem", background: "rgba(124,158,255,0.07)" }}>
        <form onSubmit={handleSave} style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
          <select
            className="adm-filter-input"
            style={{ minWidth: "120px" }}
            value={fields.page_key}
            onChange={(e) => setFields((f) => ({ ...f, page_key: e.target.value }))}
          >
            <option value="">— Page Key —</option>
            {PAGE_KEY_OPTIONS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <input
            className="adm-filter-input"
            style={{ flex: "1", minWidth: "200px" }}
            placeholder="Sponsor URL (https://…)"
            value={fields.sponsor_url}
            onChange={(e) => setFields((f) => ({ ...f, sponsor_url: e.target.value }))}
          />
          <input
            className="adm-filter-input"
            style={{ flex: "1", minWidth: "200px" }}
            placeholder="Sponsor Image URL (https://…)"
            value={fields.sponsor_image_url}
            onChange={(e) => setFields((f) => ({ ...f, sponsor_image_url: e.target.value }))}
          />
          {err && <span className="adm-err" style={{ margin: 0 }}>{err}</span>}
          <button className="adm-pdf-btn" type="submit" disabled={saving} style={{ whiteSpace: "nowrap" }}>
            {saving ? "Saving…" : "Save Sponsor"}
          </button>
        </form>
      </td>
    </tr>
  );
}

function AdsTab() {
  const [placements, setPlacements] = useState(null);
  const [impressions, setImpressions] = useState(null);
  const [inquiries, setInquiries] = useState(null);
  const [inquiryPage, setInquiryPage] = useState(1);
  const [err, setErr] = useState(null);
  const [form, setForm] = useState({ name: "", slug: "", dimensions: "", notes: "", active: true, page_key: "", sponsor_url: "", sponsor_image_url: "" });
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const loadPlacements = () =>
    fetch("/api/admin/ads", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setPlacements(d.placements))
      .catch(() => setErr("Failed to load ad placements."));

  const loadImpressions = () =>
    fetch("/api/admin/ads/impressions", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setImpressions(d.impressions))
      .catch(() => {});

  const loadInquiries = (page) =>
    fetch(`/api/admin/ads/inquiries?page=${page}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setInquiries(d.inquiries))
      .catch(() => {});

  useEffect(() => { loadPlacements(); loadImpressions(); loadInquiries(1); }, []);
  useEffect(() => { loadInquiries(inquiryPage); }, [inquiryPage]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormErr("");
    if (!form.name || !form.slug) { setFormErr("Name and slug are required."); return; }
    setSaving(true);
    try {
      const body = {
        ...form,
        page_key: form.page_key || null,
        sponsor_url: form.sponsor_url || null,
        sponsor_image_url: form.sponsor_image_url || null,
      };
      const res = await fetch("/api/admin/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setFormErr(d.error || "Save failed.");
      } else {
        setForm({ name: "", slug: "", dimensions: "", notes: "", active: true, page_key: "", sponsor_url: "", sponsor_image_url: "" });
        await loadPlacements();
      }
    } catch {
      setFormErr("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id, current) => {
    await fetch(`/api/admin/ads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ active: !current }),
    });
    await loadPlacements();
  };

  if (err) return <p className="adm-err">{err}</p>;

  return (
    <div>
      <h3 className="adm-section-title">Ad Placements</h3>
      <p style={{ fontSize: "0.82rem", opacity: 0.65, marginBottom: "0.75rem" }}>
        Set a Page Key, Sponsor URL, and Sponsor Image URL to replace the house banner on that page with a live sponsor ad.
      </p>
      {!placements ? <p className="adm-loading">Loading…</p> : (
        <table className="adm-table adm-table-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Page Key</th>
              <th>Sponsor URL</th>
              <th>Sponsor Image</th>
              <th>Active</th>
              <th>Sponsor</th>
            </tr>
          </thead>
          <tbody>
            {placements.map((p) => (
              <React.Fragment key={p.id}>
                <tr>
                  <td>{p.name}</td>
                  <td className="adm-mono">{p.slug}</td>
                  <td className="adm-mono">{p.page_key || "—"}</td>
                  <td className="adm-truncate" title={p.sponsor_url || ""} style={{ maxWidth: "140px" }}>
                    {p.sponsor_url ? <a href={p.sponsor_url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>↗ link</a> : "—"}
                  </td>
                  <td className="adm-truncate" style={{ maxWidth: "120px" }}>
                    {p.sponsor_image_url ? <a href={p.sponsor_image_url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>↗ image</a> : "—"}
                  </td>
                  <td>
                    <button
                      className={p.active ? "adm-toggle-on" : "adm-toggle-off"}
                      onClick={() => toggleActive(p.id, p.active)}
                    >
                      {p.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td>
                    <button
                      className="adm-pdf-btn"
                      style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
                      onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                    >
                      {expandedId === p.id ? "Close" : "Edit"}
                    </button>
                  </td>
                </tr>
                {expandedId === p.id && (
                  <SponsorEditRow
                    placement={p}
                    onSaved={() => { setExpandedId(null); loadPlacements(); }}
                  />
                )}
              </React.Fragment>
            ))}
            {!placements.length && (
              <tr><td colSpan="7" className="adm-empty">No placements yet</td></tr>
            )}
          </tbody>
        </table>
      )}

      <h3 className="adm-section-title" style={{ marginTop: "1.5rem" }}>Add New Placement</h3>
      <form className="adm-ad-form" onSubmit={handleCreate}>
        <input className="adm-filter-input" placeholder="Name" value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <input className="adm-filter-input" placeholder="Slug (e.g. sidebar-top)" value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
        <input className="adm-filter-input" placeholder="Dimensions (e.g. 300x250)" value={form.dimensions}
          onChange={(e) => setForm((f) => ({ ...f, dimensions: e.target.value }))} />
        <input className="adm-filter-input" placeholder="Notes" value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        <select
          className="adm-filter-input"
          value={form.page_key}
          onChange={(e) => setForm((f) => ({ ...f, page_key: e.target.value }))}
        >
          <option value="">— Page Key (optional) —</option>
          {PAGE_KEY_OPTIONS.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        <input className="adm-filter-input" placeholder="Sponsor URL (optional)" value={form.sponsor_url}
          onChange={(e) => setForm((f) => ({ ...f, sponsor_url: e.target.value }))} />
        <input className="adm-filter-input" placeholder="Sponsor Image URL (optional)" value={form.sponsor_image_url}
          onChange={(e) => setForm((f) => ({ ...f, sponsor_image_url: e.target.value }))} />
        {formErr && <p className="adm-err">{formErr}</p>}
        <button className="adm-pdf-btn" type="submit" disabled={saving}>{saving ? "Saving…" : "Add Placement"}</button>
      </form>

      <h3 className="adm-section-title" style={{ marginTop: "1.5rem" }}>Impressions (last 30d)</h3>
      {!impressions ? <p className="adm-loading">Loading…</p> : (
        <table className="adm-table">
          <thead><tr><th>Placement</th><th>Day</th><th>Impressions</th></tr></thead>
          <tbody>
            {impressions.map((r, i) => (
              <tr key={i}><td>{r.name}</td><td>{r.day?.slice(0, 10)}</td><td>{r.impressions}</td></tr>
            ))}
            {!impressions.length && <tr><td colSpan="3" className="adm-empty">No impressions yet</td></tr>}
          </tbody>
        </table>
      )}

      <h3 className="adm-section-title" style={{ marginTop: "2rem" }}>Ad Placement Inquiries</h3>
      {!inquiries ? <p className="adm-loading">Loading…</p> : (
        <>
          <table className="adm-table adm-table-full">
            <thead>
              <tr><th>Date</th><th>Name</th><th>Company</th><th>Email</th><th>Placement</th><th>Message</th></tr>
            </thead>
            <tbody>
              {inquiries.map((r) => (
                <tr key={r.id}>
                  <td>{r.created_at?.slice(0, 10)}</td>
                  <td>{r.name}</td>
                  <td>{r.company || "—"}</td>
                  <td>{r.email}</td>
                  <td>{r.placement_interest || "—"}</td>
                  <td className="adm-truncate" title={r.message || ""}>{r.message || "—"}</td>
                </tr>
              ))}
              {!inquiries.length && <tr><td colSpan="6" className="adm-empty">No inquiries yet</td></tr>}
            </tbody>
          </table>
          <div className="adm-pagination">
            <button disabled={inquiryPage <= 1} onClick={() => setInquiryPage((p) => p - 1)} className="adm-page-btn">← Prev</button>
            <span>Page {inquiryPage}</span>
            <button disabled={inquiries.length < 50} onClick={() => setInquiryPage((p) => p + 1)} className="adm-page-btn">Next →</button>
          </div>
        </>
      )}
    </div>
  );
}

function CacheTab() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  const load = () => {
    setErr(null);
    fetch("/api/admin/cache-stats", { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setErr(e.message || "Failed to load cache stats."));
  };

  useEffect(() => { load(); }, []);

  if (err) return <p className="adm-err">{err}</p>;
  if (!data) return <p className="adm-loading">Loading…</p>;

  const db = data.db || {};
  const mem = data.memory || {};
  const ttls = data.ttls || {};

  const hitPct = mem.hits + mem.misses > 0
    ? ((mem.hits / (mem.hits + mem.misses)) * 100).toFixed(1)
    : "0.0";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
        <h3 className="adm-section-title" style={{ margin: 0 }}>Cache Overview</h3>
        <button className="adm-pdf-btn" onClick={load} style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}>
          Refresh
        </button>
      </div>

      <h4 className="adm-section-title" style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "0.4rem" }}>
        Database cache (PostgreSQL)
      </h4>
      <div className="adm-stat-grid" style={{ marginBottom: "1.5rem" }}>
        <StatCard label="Total rows" value={db.totalRows} />
        <StatCard label="Active rows" value={db.activeRows} />
        <StatCard label="Active — judge profiles" value={db.activeJudgeRows} />
        <StatCard label="Active — search results" value={db.activeSearchRows} />
        <StatCard label="Active — opinions" value={db.activeOpinionRows} />
        <StatCard
          label="DB storage used"
          value={db.activeBytes != null ? `${(db.activeBytes / 1024 / 1024).toFixed(2)} MB` : "—"}
        />
        <StatCard
          label="DB cap"
          value={db.capBytes != null ? `${(db.capBytes / 1024 / 1024).toFixed(0)} MB` : "—"}
        />
        <StatCard
          label="DB usage"
          value={db.activeBytes != null && db.capBytes ? `${((db.activeBytes / db.capBytes) * 100).toFixed(1)}%` : "—"}
        />
      </div>

      <div className="adm-two-col" style={{ marginBottom: "1.5rem" }}>
        <div>
          <table className="adm-table">
            <thead><tr><th>Field</th><th>Value</th></tr></thead>
            <tbody>
              <tr><td>Oldest entry</td><td>{db.oldestEntry ? db.oldestEntry.slice(0, 16) : "—"}</td></tr>
              <tr><td>Newest entry</td><td>{db.newestEntry ? db.newestEntry.slice(0, 16) : "—"}</td></tr>
            </tbody>
          </table>
        </div>
        <div>
          <table className="adm-table">
            <thead><tr><th>Cache type</th><th>TTL</th></tr></thead>
            <tbody>
              <tr><td>Search results</td><td>{ttls.searchHours}h</td></tr>
              <tr><td>Judge profiles</td><td>{ttls.judgeHours}h (7 days)</td></tr>
              <tr><td>Opinions</td><td>{ttls.opinionsHours}h (7 days)</td></tr>
              <tr><td>In-memory layer</td><td>{ttls.memMinutes} min</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <h4 className="adm-section-title" style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "0.4rem" }}>
        In-memory cache (current process)
      </h4>
      <div className="adm-stat-grid">
        <StatCard label="Entries in memory" value={`${mem.size} / ${mem.maxSize}`} />
        <StatCard label="Hits (since start)" value={mem.hits} />
        <StatCard label="Misses (since start)" value={mem.misses} />
        <StatCard label="Hit rate" value={`${hitPct}%`} />
      </div>
    </div>
  );
}

const TAB_COMPONENTS = {
  overview: OverviewTab,
  traffic: TrafficTab,
  players: PlayersTab,
  duel: DuelTab,
  email: EmailTab,
  ratelimits: RateLimitsTab,
  cache: CacheTab,
  ads: AdsTab,
};

const AdminPage = () => {
  const [authenticated, setAuthenticated] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetch("/api/admin/session", { credentials: "include" })
      .then((r) => { if (r.ok) setAuthenticated(true); else setAuthenticated(false); })
      .catch(() => setAuthenticated(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    setAuthenticated(false);
  };

  if (authenticated === null) return <p className="adm-loading" style={{ padding: "2rem" }}>Checking session…</p>;
  if (!authenticated) return <AdminLogin onLogin={() => setAuthenticated(true)} />;

  const TabContent = TAB_COMPONENTS[activeTab] || (() => <p>Tab not found.</p>);

  return (
    <div className="adm-shell">
      <div className="adm-header">
        <span className="adm-header-title">JudgeTracker Admin</span>
        <div className="adm-header-right">
          <ThemeToggle />
          <button className="adm-logout-btn" onClick={handleLogout}>Log out</button>
        </div>
      </div>

      <div className="adm-tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`adm-tab ${activeTab === t.id ? "adm-tab-active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="adm-content">
        <TabContent />
      </div>
    </div>
  );
};

export default AdminPage;
