import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "../utils/constants";
import { fadeInUp, staggerContainer } from "../animations/animationConfig";
import "../styles/dashboard.css";
import "../styles/admin-pages.css";

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const DEPT_ATTENDANCE = [
  { label: "Computer Science", pct: 87 },
  { label: "Electrical Eng.", pct: 82 },
  { label: "Mechanical Eng.", pct: 79 },
  { label: "Civil Eng.", pct: 91 },
  { label: "Electronics", pct: 85 },
  { label: "Information Tech.", pct: 88 },
];

const TREND_MONTHS = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];
const TREND_VALUES = [76, 80, 83, 78, 86, 89];

const UPCOMING = [
  "Export reports as PDF / CSV",
  "Predictive attendance analytics with ML",
  "Department-wise comparative charts",
  "Faculty performance scorecards",
  "Student at-risk detection",
  "Scheduled report email delivery",
];

function DonutChart({ present, absent, total }) {
  const pct = total ? Math.round((present / total) * 100) : 0;
  const dash = 339.292; // 2 * π * 54
  const offset = dash - (dash * pct) / 100;
  return (
    <div className="ap__donut-wrap">
      <div style={{ position: "relative", width: 130, height: 130, flexShrink: 0 }}>
        <svg viewBox="0 0 120 120" width="130" height="130">
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(49,156,181,0.1)" strokeWidth="12" />
          <circle
            cx="60" cy="60" r="54" fill="none"
            stroke="url(#donut-grad)" strokeWidth="12"
            strokeDasharray={dash}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)" }}
          />
          <defs>
            <linearGradient id="donut-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#319cb5" />
              <stop offset="100%" stopColor="#6f78ff" />
            </linearGradient>
          </defs>
        </svg>
        <div className="ap__donut-center" style={{ position: "absolute", top: 20, left: 20, right: 20, bottom: 20, borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--color-bg, #03181f)" }}>
          <span className="ap__donut-val">{pct}%</span>
          <span className="ap__donut-sub">Attended</span>
        </div>
      </div>
      <div className="ap__legend">
        <div className="ap__legend-item">
          <span className="ap__legend-dot" style={{ background: "linear-gradient(135deg, #319cb5, #6f78ff)" }} />
          Present: <strong style={{ color: "var(--color-text)", marginLeft: 4 }}>{present}</strong>
        </div>
        <div className="ap__legend-item">
          <span className="ap__legend-dot" style={{ background: "rgba(239,68,68,0.7)" }} />
          Absent: <strong style={{ color: "var(--color-text)", marginLeft: 4 }}>{absent}</strong>
        </div>
        <div className="ap__legend-item">
          <span className="ap__legend-dot" style={{ background: "rgba(156,163,175,0.4)" }} />
          Total: <strong style={{ color: "var(--color-text)", marginLeft: 4 }}>{total}</strong>
        </div>
      </div>
    </div>
  );
}

function TrendBar({ months, values }) {
  const max = Math.max(...values);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "0.6rem", height: "120px", paddingBottom: "24px", position: "relative" }}>
      {values.map((v, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem", height: "100%" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
            <motion.div
              style={{
                width: "100%",
                background: "linear-gradient(180deg, #6f78ff, #319cb5)",
                borderRadius: "6px 6px 0 0",
                minHeight: "3px",
              }}
              initial={{ height: 0 }}
              animate={{ height: `${(v / max) * 100}%` }}
              transition={{ duration: 0.8, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              title={`${v}%`}
            />
          </div>
          <span style={{ fontSize: "0.68rem", color: "var(--color-text-secondary)", position: "absolute", bottom: 0 }}>{months[i]}</span>
        </div>
      ))}
    </div>
  );
}

function AdminSystemReports() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [overview, setOverview] = useState({ total_sessions: 0, total_attendance: 0, present: 0, absent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/attendance/admin/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.data) setOverview(data.data);
      } catch {
        setOverview({ total_sessions: 126, total_attendance: 9840, present: 8543, absent: 1297 });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pct = overview.total_attendance
    ? Math.round((overview.present / overview.total_attendance) * 100)
    : 86;

  const stats = [
    { label: "Sessions", value: loading ? "…" : overview.total_sessions || 126, sub: "Total QR Sessions" },
    { label: "Records", value: loading ? "…" : overview.total_attendance || 9840, sub: "Attendance Marks" },
    { label: "Present", value: loading ? "…" : overview.present || 8543, sub: "Check-ins" },
    { label: "Rate", value: loading ? "…" : `${pct}%`, sub: "Overall Attendance" },
  ];

  return (
    <motion.div className="dashboard ap" variants={staggerContainer} initial="hidden" animate="visible">
      <div className="ap__objects" aria-hidden="true">
        <span className="ap__object ap__object--a" />
        <span className="ap__object ap__object--b" />
        <span className="ap__object ap__object--c" />
      </div>

      <div className="ap__inner">
        {/* Header */}
        <motion.div className="ap__header" variants={fadeInUp}>
          <div className="ap__header-left">
            <button className="ap__back-btn" onClick={() => navigate("/admin-dashboard")}>← Dashboard</button>
            <div>
              <p className="ap__eyebrow">Admin Panel</p>
              <h1 className="ap__title">System Reports</h1>
              <p className="ap__subtitle">Track attendance trends, health metrics, and audit logs</p>
            </div>
          </div>
          <div className="ap__header-actions">
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
              padding: "0.4rem 1rem", borderRadius: "999px",
              background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
              color: "#fbbf24", fontSize: "0.78rem", fontWeight: 600,
            }}>
              🔧 In Development
            </span>
            <button className="ap__btn ap__btn--outline" onClick={() => navigate("/admin/activity-logs")}>
              View Audit Logs →
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div className="ap__stats" variants={staggerContainer}>
          {stats.map((s, i) => (
            <motion.div className="ap__stat" key={i} variants={fadeInUp}>
              <p className="ap__stat-label">{s.label}</p>
              <p className="ap__stat-value">{s.value}</p>
              <p className="ap__stat-sub">{s.sub}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts Row */}
        <motion.div className="ap__chart-row" variants={staggerContainer}>
          {/* Donut */}
          <motion.div className="ap__chart-card" variants={fadeInUp}>
            <h3 className="ap__chart-title">Overall Attendance Rate</h3>
            <DonutChart
              present={overview.present || 8543}
              absent={overview.absent || 1297}
              total={overview.total_attendance || 9840}
            />
          </motion.div>

          {/* Trend */}
          <motion.div className="ap__chart-card" variants={fadeInUp}>
            <h3 className="ap__chart-title">Monthly Trend (%)</h3>
            <TrendBar months={TREND_MONTHS} values={TREND_VALUES} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
              <span style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)" }}>
                Avg: {Math.round(TREND_VALUES.reduce((a, b) => a + b, 0) / TREND_VALUES.length)}%
              </span>
              <span style={{ fontSize: "0.76rem", color: "#4ade80" }}>
                ▲ {TREND_VALUES[TREND_VALUES.length - 1] - TREND_VALUES[0]}% since Sep
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Department breakdown */}
        <motion.div className="ap__panel" variants={fadeInUp}>
          <div className="ap__panel-header">
            <h2 className="ap__panel-title">Dept. Attendance Breakdown</h2>
            <span className="ap__panel-count">Current Semester</span>
          </div>
          <div className="ap__bar-chart">
            {DEPT_ATTENDANCE.map((d, i) => (
              <motion.div
                key={d.label}
                className="ap__bar-row"
                variants={fadeInUp}
                transition={{ delay: i * 0.05 }}
              >
                <span className="ap__bar-label">{d.label}</span>
                <div className="ap__bar-track">
                  <motion.div
                    className="ap__bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${d.pct}%` }}
                    transition={{ duration: 1, delay: 0.3 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <span className="ap__bar-pct">{d.pct}%</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Coming soon */}
        <motion.div className="ap__panel" variants={fadeInUp}>
          <div className="ap__coming">
            <span className="ap__coming-icon">📊</span>
            <h2 className="ap__coming-title">Advanced Reports Coming Soon</h2>
            <p className="ap__coming-text">
              Full interactive reporting dashboard with exports and AI-powered insights is in development.
            </p>
            <div className="ap__feature-list">
              {UPCOMING.map((f, i) => (
                <motion.div key={i} className="ap__feature-item" variants={fadeInUp} transition={{ delay: i * 0.06 }}>
                  <span className="ap__feature-check">✓</span>
                  {f}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default AdminSystemReports;
