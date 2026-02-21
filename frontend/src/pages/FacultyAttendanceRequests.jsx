import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "../utils/constants";

// ─────────────────────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────────────────────
const Toast = ({ toast, onClose }) => {
  if (!toast) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        zIndex: 9999,
        background: toast.type === "error" ? "#ef4444" : "#10b981",
        color: "#fff",
        padding: "0.85rem 1.5rem",
        borderRadius: "10px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        fontSize: "0.95rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        maxWidth: "420px",
      }}
    >
      <span>{toast.type === "error" ? "✗" : "✓"}</span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        onClick={onClose}
        style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "1.1rem" }}
      >
        ×
      </button>
    </div>
  );
};

const STATUS_TABS = ["pending", "approved", "rejected", "all"];
const STATUS_COLORS = {
  pending:  { color: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.35)", icon: "⏳" },
  approved: { color: "#10b981", bg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.35)", icon: "✅" },
  rejected: { color: "#ef4444", bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.35)",  icon: "✗" },
  all:      { color: "#8b5cf6", bg: "rgba(139,92,246,0.10)", border: "rgba(139,92,246,0.3)",  icon: "📋" },
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─────────────────────────────────────────────────────────────────────────────
// Reject modal
// ─────────────────────────────────────────────────────────────────────────────
function RejectModal({ request, onConfirm, onClose }) {
  const [note, setNote] = useState("");
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1e1e2e",
          border: "1px solid rgba(239,68,68,0.4)",
          borderRadius: "16px",
          padding: "2rem",
          width: "100%",
          maxWidth: 440,
        }}
      >
        <h3 style={{ margin: "0 0 0.4rem", color: "#ef4444" }}>✗ Reject Request</h3>
        <p style={{ margin: "0 0 1rem", opacity: 0.7, fontSize: "0.88rem" }}>
          Rejecting attendance request for <strong>{request.student_name}</strong> — <em>{request.subject}</em>
        </p>
        <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.85rem", opacity: 0.8 }}>
          Reason for rejection (optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. You were not present during the session."
          rows={3}
          maxLength={500}
          style={{
            width: "100%",
            padding: "0.65rem 0.9rem",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.07)",
            color: "inherit",
            fontSize: "0.9rem",
            outline: "none",
            boxSizing: "border-box",
            resize: "vertical",
            marginBottom: "1rem",
          }}
        />
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "0.55rem 1.2rem",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.2)",
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(note)}
            style={{
              padding: "0.55rem 1.4rem",
              borderRadius: "8px",
              border: "none",
              background: "#ef4444",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Reject
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function FacultyAttendanceRequests() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [statusTab, setStatusTab] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null); // request obj for modal
  const [search, setSearch] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const fetchRequests = async (status = statusTab) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/manual-requests/faculty?status=${status}`, { headers });
      const data = await res.json();
      if (data.success) setRequests(data.data || []);
    } catch {
      showToast("Failed to load requests", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(statusTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusTab]);

  const handleApprove = async (id) => {
    setActionLoading(`approve-${id}`);
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/manual-request/${id}/approve`, {
        method: "PATCH",
        headers,
      });
      const data = await res.json();
      if (data.success) {
        showToast("Attendance approved and marked as Present!");
        fetchRequests();
      } else {
        showToast(data.message || "Failed to approve", "error");
      }
    } catch {
      showToast("Server error", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id, note) => {
    setRejectTarget(null);
    setActionLoading(`reject-${id}`);
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/manual-request/${id}/reject`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ note }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Request rejected.");
        fetchRequests();
      } else {
        showToast(data.message || "Failed to reject", "error");
      }
    } catch {
      showToast("Server error", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = requests.filter(
    (r) =>
      !search ||
      r.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.student_roll?.toLowerCase().includes(search.toLowerCase()) ||
      r.subject?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div style={{ minHeight: "100vh", padding: "5rem 1rem 3rem" }}>
      <Toast toast={toast} onClose={() => setToast(null)} />
      {rejectTarget && (
        <RejectModal
          request={rejectTarget}
          onConfirm={(note) => handleReject(rejectTarget.id, note)}
          onClose={() => setRejectTarget(null)}
        />
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{ maxWidth: 900, margin: "0 auto 2rem" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.4rem" }}>
          <button
            onClick={() => navigate("/faculty-dashboard")}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "inherit",
              borderRadius: "8px",
              padding: "0.4rem 0.9rem",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            ← Back
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.7rem", fontWeight: 700 }}>
              📋 Student Attendance Requests
            </h1>
            {pendingCount > 0 && statusTab !== "pending" && (
              <span style={{ fontSize: "0.8rem", color: "#f59e0b" }}>
                ⚠️ {pendingCount} pending request{pendingCount > 1 ? "s" : ""} awaiting review
              </span>
            )}
          </div>
        </div>
        <p style={{ margin: 0, opacity: 0.6, fontSize: "0.88rem" }}>
          Students who couldn't scan the QR code can request manual attendance. Review and approve or reject below.
        </p>
      </motion.div>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Tabs + Search row */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1.5rem" }}>
          {STATUS_TABS.map((s) => {
            const cfg = STATUS_COLORS[s];
            const count = s === "all" ? requests.length : requests.filter((r) => r.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setStatusTab(s)}
                style={{
                  padding: "0.5rem 1.1rem",
                  borderRadius: "8px",
                  border: `1px solid ${statusTab === s ? cfg.color : "rgba(255,255,255,0.15)"}`,
                  background: statusTab === s ? cfg.bg : "rgba(255,255,255,0.05)",
                  color: statusTab === s ? cfg.color : "inherit",
                  cursor: "pointer",
                  fontWeight: statusTab === s ? 700 : 400,
                  fontSize: "0.88rem",
                  textTransform: "capitalize",
                }}
              >
                {cfg.icon} {s} {loading ? "" : `(${count})`}
              </button>
            );
          })}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student / subject…"
            style={{
              marginLeft: "auto",
              padding: "0.5rem 0.9rem",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.07)",
              color: "inherit",
              fontSize: "0.88rem",
              outline: "none",
              minWidth: 200,
            }}
          />
        </div>

        {/* List */}
        {loading ? (
          <p style={{ opacity: 0.6, textAlign: "center", padding: "2rem" }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", opacity: 0.45 }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>📭</div>
            <p style={{ fontSize: "0.95rem" }}>
              {search ? "No requests match your search." : `No ${statusTab === "all" ? "" : statusTab} requests.`}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              {filtered.map((r) => {
                const cfg = STATUS_COLORS[r.status] || STATUS_COLORS.pending;
                const isApproving = actionLoading === `approve-${r.id}`;
                const isRejecting = actionLoading === `reject-${r.id}`;

                return (
                  <motion.div
                    key={r.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      background: cfg.bg,
                      border: `1px solid ${cfg.border}`,
                      borderRadius: "14px",
                      padding: "1.2rem 1.4rem",
                    }}
                  >
                    {/* Header row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.7rem" }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: "1rem" }}>{r.student_name}</span>
                        {r.student_roll && (
                          <span style={{ marginLeft: "0.5rem", fontSize: "0.78rem", opacity: 0.6 }}>
                            ({r.student_roll})
                          </span>
                        )}
                        <div style={{ fontSize: "0.8rem", opacity: 0.6, marginTop: "0.1rem" }}>{r.student_email}</div>
                      </div>
                      <span
                        style={{
                          padding: "0.2rem 0.75rem",
                          borderRadius: "20px",
                          background: `${cfg.color}22`,
                          color: cfg.color,
                          fontWeight: 600,
                          fontSize: "0.78rem",
                          flexShrink: 0,
                        }}
                      >
                        {cfg.icon} {r.status}
                      </span>
                    </div>

                    {/* Session info */}
                    <div style={{ fontSize: "0.83rem", opacity: 0.75, marginBottom: "0.65rem" }}>
                      📚 <strong>{r.subject}</strong> &nbsp;|&nbsp; 📍 {r.location} &nbsp;|&nbsp; 📅 {fmtDate(r.start_time)}
                    </div>

                    {/* Reason */}
                    <div
                      style={{
                        padding: "0.6rem 0.9rem",
                        background: "rgba(0,0,0,0.12)",
                        borderRadius: "8px",
                        fontSize: "0.87rem",
                        marginBottom: "0.7rem",
                        lineHeight: 1.5,
                      }}
                    >
                      <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>Student's reason: </span>
                      <br />
                      {r.reason}
                    </div>

                    {r.rejection_note && (
                      <div
                        style={{
                          padding: "0.5rem 0.9rem",
                          background: "rgba(239,68,68,0.08)",
                          borderLeft: "3px solid #ef4444",
                          borderRadius: "6px",
                          fontSize: "0.83rem",
                          marginBottom: "0.7rem",
                        }}
                      >
                        <span style={{ opacity: 0.6, fontSize: "0.75rem" }}>Your rejection note: </span>
                        {r.rejection_note}
                      </div>
                    )}

                    {/* Footer + Actions */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", opacity: 0.5 }}>
                        Submitted: {fmtDate(r.created_at)}
                        {r.reviewed_at && ` · Reviewed: ${fmtDate(r.reviewed_at)}`}
                      </span>

                      {r.status === "pending" && (
                        <div style={{ display: "flex", gap: "0.6rem" }}>
                          <button
                            onClick={() => setRejectTarget(r)}
                            disabled={isRejecting || isApproving}
                            style={{
                              padding: "0.45rem 1.1rem",
                              borderRadius: "8px",
                              border: "1px solid rgba(239,68,68,0.5)",
                              background: "rgba(239,68,68,0.12)",
                              color: "#ef4444",
                              cursor: "pointer",
                              fontWeight: 600,
                              fontSize: "0.85rem",
                              opacity: isRejecting || isApproving ? 0.5 : 1,
                            }}
                          >
                            {isRejecting ? "…" : "✗ Reject"}
                          </button>
                          <button
                            onClick={() => handleApprove(r.id)}
                            disabled={isApproving || isRejecting}
                            style={{
                              padding: "0.45rem 1.1rem",
                              borderRadius: "8px",
                              border: "none",
                              background:
                                isApproving || isRejecting
                                  ? "rgba(16,185,129,0.35)"
                                  : "linear-gradient(135deg,#10b981,#059669)",
                              color: "#fff",
                              cursor: isApproving || isRejecting ? "not-allowed" : "pointer",
                              fontWeight: 700,
                              fontSize: "0.85rem",
                            }}
                          >
                            {isApproving ? "Approving…" : "✓ Approve"}
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
