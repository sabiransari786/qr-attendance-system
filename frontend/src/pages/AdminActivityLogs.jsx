import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ClipboardList } from 'lucide-react';
import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "../utils/constants";
import { fadeInUp, staggerContainer } from "../animations/animationConfig";
import "../styles/dashboard.css";
import "../styles/admin-pages.css";

const ACTION_OPTIONS = [
  "all",
  "AUTH_LOGIN",
  "AUTH_LOGOUT",
  "ATTENDANCE_MARK",
  "SESSION_CREATE",
  "SESSION_CLOSE",
  "ADMIN_USER_ROLE_UPDATE",
  "ADMIN_USER_STATUS_UPDATE",
  "ADMIN_USER_DELETE",
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "200", label: "200 OK" },
  { value: "201", label: "201 Created" },
  { value: "400", label: "400 Bad Request" },
  { value: "401", label: "401 Unauthorized" },
  { value: "403", label: "403 Forbidden" },
  { value: "404", label: "404 Not Found" },
  { value: "500", label: "500 Error" },
];

function getStatusBadge(code) {
  if (!code) return "ap__badge--warn";
  if (code >= 500) return "ap__badge--error";
  if (code >= 400) return "ap__badge--warn";
  return "ap__badge--ok";
}

function AdminActivityLogs() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 50 });

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  const fetchLogs = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "50" });
      if (search.trim()) params.append("search", search.trim());
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (actionFilter !== "all") params.append("action", actionFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`${API_BASE_URL}/auth/admin/logs?${params}`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setLogs(data.data.logs || []);
        setPagination(data.data.pagination || { page: 1, pages: 1, total: 0, limit: 50 });
      } else {
        setLogs([]);
      }
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(page); }, [page]);

  const handleApply = () => {
    if (page === 1) fetchLogs(1);
    else setPage(1);
  };

  const handleClear = () => {
    setSearch(""); setRoleFilter("all"); setActionFilter("all");
    setStatusFilter("all"); setStartDate(""); setEndDate("");
    setPage(1);
    setTimeout(() => fetchLogs(1), 0);
  };

  const stats = [
    { label: "Total Events", value: pagination.total || logs.length, sub: "Recorded" },
    { label: "Page", value: `${pagination.page}/${pagination.pages}`, sub: "Navigation" },
    { label: "Per Page", value: pagination.limit, sub: "Limit" },
    { label: "Showing", value: logs.length, sub: "Results" },
  ];

  const fmt = (ts) => {
    if (!ts) return "—";
    const d = new Date(ts);
    return d.toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });
  };

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
              <h1 className="ap__title">Activity Logs</h1>
              <p className="ap__subtitle">Monitor authentication, attendance, and admin actions in real time</p>
            </div>
          </div>
          <div className="ap__header-actions">
            <button className="ap__btn ap__btn--outline" onClick={() => fetchLogs(page)} disabled={loading}>↻ Refresh</button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div className="ap__stats" variants={staggerContainer}>
          {stats.map((s, i) => (
            <motion.div className="ap__stat" key={i} variants={fadeInUp}>
              <p className="ap__stat-label">{s.label}</p>
              <p className="ap__stat-value" style={{ fontSize: typeof s.value === "string" ? "1.25rem" : undefined }}>{s.value}</p>
              <p className="ap__stat-sub">{s.sub}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div className="ap__panel" variants={fadeInUp}>
          <div className="ap__panel-header">
            <h2 className="ap__panel-title">
              System Audit Log <span className="ap__panel-count">({loading ? "…" : logs.length} entries)</span>
            </h2>
            <button className="ap__btn ap__btn--ghost" style={{ fontSize: "0.78rem", padding: "0.4rem 0.8rem" }} onClick={handleClear}>
              Clear filters
            </button>
          </div>

          <div className="ap__filters">
            <input
              className="ap__search"
              placeholder="Search user, action, IP…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleApply()}
            />
            <select className="ap__select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
            <select className="ap__select" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
              {ACTION_OPTIONS.map((a) => (
                <option key={a} value={a}>{a === "all" ? "All Actions" : a}</option>
              ))}
            </select>
            <select className="ap__select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <input type="date" className="ap__search" style={{ flex: "0 0 auto", minWidth: "auto" }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <input type="date" className="ap__search" style={{ flex: "0 0 auto", minWidth: "auto" }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <button className="ap__btn ap__btn--primary" onClick={handleApply}>Apply</button>
          </div>

          <div className="ap__table-wrap">
            <table className="ap__table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Status</th>
                  <th>Path</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        {[1, 2, 3, 4, 5, 6, 7].map((c) => (
                          <td key={c}><div className="ap__skeleton" style={{ width: `${40 + c * 8}%` }} /></td>
                        ))}
                      </tr>
                    ))
                  : logs.length === 0
                  ? (
                    <tr><td colSpan={7}>
                      <div className="ap__empty">
                        <div className="ap__empty-icon"><ClipboardList size={48} /></div>
                        <p className="ap__empty-title">No activity logs found</p>
                        <p className="ap__empty-text">Try clearing your filters or selecting a different date range.</p>
                      </div>
                    </td></tr>
                  )
                  : logs.map((log, idx) => (
                      <motion.tr key={log.id} variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: idx * 0.02 }}>
                        <td className="ap__log-time">{fmt(log.created_at)}</td>
                        <td>
                          <div>
                            <p className="ap__user-name" style={{ fontSize: "0.82rem" }}>{log.user_name || "System"}</p>
                            <p className="ap__user-sub">{log.user_email || "anonymous"}</p>
                          </div>
                        </td>
                        <td>
                          {log.user_role ? (
                            <span className={`ap__badge ap__badge--${log.user_role}`}>{log.user_role}</span>
                          ) : "—"}
                        </td>
                        <td>
                          <span style={{
                            fontFamily: "monospace",
                            fontSize: "0.75rem",
                            color: "var(--color-primary)",
                            background: "rgba(49,156,181,0.08)",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "6px",
                          }}>
                            {log.action}
                          </span>
                        </td>
                        <td>
                          <span className={`ap__badge ${getStatusBadge(log.status_code)}`}>{log.status_code}</span>
                        </td>
                        <td className="ap__log-path" title={log.path}>{log.path}</td>
                        <td style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", fontFamily: "monospace" }}>
                          {log.ip_address || "—"}
                        </td>
                      </motion.tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="ap__pagination">
            <button
              className="ap__btn ap__btn--outline"
              style={{ padding: "0.4rem 1rem", fontSize: "0.82rem" }}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={pagination.page <= 1 || loading}
            >
              ← Previous
            </button>
            <span className="ap__page-info">Page {pagination.page} of {pagination.pages}</span>
            <button
              className="ap__btn ap__btn--outline"
              style={{ padding: "0.4rem 1rem", fontSize: "0.82rem" }}
              onClick={() => setPage((p) => Math.min(p + 1, pagination.pages))}
              disabled={pagination.page >= pagination.pages || loading}
            >
              Next →
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default AdminActivityLogs;
