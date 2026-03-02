import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Loader, CheckCircle, XCircle, ClipboardList, Send, ScrollText, AlertTriangle, Circle, Inbox, Calendar, UserCheck } from 'lucide-react';
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
        maxWidth: "380px",
      }}
    >
      <span>{toast.type === "error" ? <X size={14} /> : <Check size={14} />}</span>
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

const STATUS_CONFIG = {
  pending:  { label: "Pending",  color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  icon: <Loader size={14} /> },
  approved: { label: "Approved", color: "#10b981", bg: "rgba(16,185,129,0.12)",  icon: <CheckCircle size={14} /> },
  rejected: { label: "Rejected", color: "#ef4444", bg: "rgba(239,68,68,0.12)",   icon: <XCircle size={14} /> },
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function StudentAttendanceRequest() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [tab, setTab] = useState("new"); // "new" | "history"
  const [sessions, setSessions] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const [selectedSession, setSelectedSession] = useState("");
  const [reason, setReason] = useState("");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Fetch requestable sessions
  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/requestable-sessions`, { headers });
      const data = await res.json();
      if (data.success) setSessions(data.data || []);
    } catch {
      showToast("Failed to load sessions", "error");
    } finally {
      setLoadingSessions(false);
    }
  };

  // Fetch student request history
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/manual-requests/student`, { headers });
      const data = await res.json();
      if (data.success) setMyRequests(data.data || []);
    } catch {
      showToast("Failed to load request history", "error");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSession) {
      showToast("Please select a session", "error");
      return;
    }
    if (!reason.trim() || reason.trim().length < 10) {
      showToast("Please provide a reason (min 10 characters)", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/manual-request`, {
        method: "POST",
        headers,
        body: JSON.stringify({ session_id: Number(selectedSession), reason: reason.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Attendance request sent to teacher successfully!");
        setSelectedSession("");
        setReason("");
        fetchSessions();
        fetchHistory();
        setTab("history");
      } else {
        showToast(data.message || "Failed to submit request", "error");
      }
    } catch {
      showToast("Server error. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", padding: "5rem 1rem 3rem", maxWidth: 700, margin: "0 auto" }}>
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{ marginBottom: "2rem" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.4rem" }}>
          <button
            onClick={() => navigate("/student-dashboard")}
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
          <h1 style={{ margin: 0, fontSize: "1.7rem", fontWeight: 700 }}><ClipboardList size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />Generate Attendance Request</h1>
        </div>
        <p style={{ margin: 0, opacity: 0.65, fontSize: "0.9rem" }}>
          Couldn't scan QR due to network issues or other reasons? Send a request to your teacher for manual attendance.
        </p>
      </motion.div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {[
          { key: "new", label: <><Send size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />New Request</> },
          { key: "history", label: <><ScrollText size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />My Requests ({myRequests.length})</> },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "0.6rem 1.2rem",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.2)",
              cursor: "pointer",
              background: tab === t.key ? "rgba(102,126,234,0.45)" : "rgba(255,255,255,0.07)",
              color: "inherit",
              fontWeight: tab === t.key ? 700 : 400,
              fontSize: "0.9rem",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ──── NEW REQUEST TAB ──── */}
        {tab === "new" && (
          <motion.div
            key="new"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(102,126,234,0.3)",
                borderRadius: "16px",
                padding: "2rem",
              }}
            >
              <h2 style={{ margin: "0 0 0.4rem", fontSize: "1.1rem" }}>Send Attendance Request</h2>
              <p style={{ margin: "0 0 1.5rem", opacity: 0.6, fontSize: "0.85rem" }}>
                Select the session you attended and briefly explain why you couldn't scan the QR.
                The teacher will review and approve or reject your request.
              </p>

              {loadingSessions ? (
                <p style={{ opacity: 0.6 }}>Loading available sessions…</p>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                  {/* Session selector */}
                  <div>
                    <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.88rem", opacity: 0.85 }}>
                      Select Session *
                    </label>
                    {sessions.length === 0 ? (
                      <div
                        style={{
                          padding: "1rem",
                          borderRadius: "8px",
                          background: "rgba(245,158,11,0.1)",
                          border: "1px solid rgba(245,158,11,0.3)",
                          fontSize: "0.88rem",
                          opacity: 0.85,
                        }}
                      >
                        <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />No sessions available for requesting right now.
                        Either your attendance is already marked, you already have a pending request,
                        or there are no sessions from the last 7 days.
                      </div>
                    ) : (
                      <select
                        value={selectedSession}
                        onChange={(e) => setSelectedSession(e.target.value)}
                        required
                        style={inputStyle}
                      >
                        <option value="">— Select a session —</option>
                        {sessions.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.subject} | {s.location} | {fmtDate(s.start_time)} | {s.faculty_name}
                            {s.status === "active" ? <Circle size={10} style={{ fill: '#22c55e', color: '#22c55e', display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }} /> : ""}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Reason */}
                  <div>
                    <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.88rem", opacity: 0.85 }}>
                      Reason * <span style={{ opacity: 0.5 }}>(min 10 characters)</span>
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. I was present in class but couldn't scan the QR code due to poor network connection. I was seated in the back row."
                      required
                      maxLength={500}
                      rows={4}
                      style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
                    />
                    <p style={{ margin: "0.3rem 0 0", fontSize: "0.75rem", opacity: 0.5, textAlign: "right" }}>
                      {reason.length}/500
                    </p>
                  </div>

                  {/* Info banner */}
                  <div
                    style={{
                      background: "rgba(99,102,241,0.08)",
                      border: "1px solid rgba(99,102,241,0.25)",
                      borderRadius: "8px",
                      padding: "0.75rem 1rem",
                      fontSize: "0.82rem",
                      lineHeight: 1.55,
                      opacity: 0.85,
                    }}
                  >
                    ℹ️ Your teacher will review this request. If approved, your attendance will be marked as <strong>Present</strong>.
                    You'll be able to track the status under <strong>My Requests</strong>.
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || sessions.length === 0}
                    style={{
                      padding: "0.8rem",
                      borderRadius: "10px",
                      border: "none",
                      background:
                        submitting || sessions.length === 0
                          ? "rgba(102,126,234,0.35)"
                          : "linear-gradient(135deg,#667eea,#764ba2)",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "1rem",
                      cursor: submitting || sessions.length === 0 ? "not-allowed" : "pointer",
                    }}
                  >
                    {submitting ? "Sending…" : <><Send size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />Send Request to Teacher</>}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}

        {/* ──── HISTORY TAB ──── */}
        {tab === "history" && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {loadingHistory ? (
              <p style={{ opacity: 0.6 }}>Loading…</p>
            ) : myRequests.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "3rem",
                  opacity: 0.5,
                  fontSize: "0.95rem",
                }}
              >
                <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}><Inbox size={48} /></div>
                No requests submitted yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {myRequests.map((r) => {
                  const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        background: cfg.bg,
                        border: `1px solid ${cfg.color}44`,
                        borderRadius: "14px",
                        padding: "1.1rem 1.3rem",
                      }}
                    >
                      {/* Top row */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.6rem" }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: "1rem" }}>{r.subject}</span>
                          <span style={{ marginLeft: "0.6rem", opacity: 0.6, fontSize: "0.82rem" }}>{r.location}</span>
                        </div>
                        <span
                          style={{
                            padding: "0.2rem 0.7rem",
                            borderRadius: "20px",
                            background: `${cfg.color}22`,
                            color: cfg.color,
                            fontWeight: 600,
                            fontSize: "0.8rem",
                          }}
                        >
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>

                      <div style={{ fontSize: "0.82rem", opacity: 0.7, marginBottom: "0.5rem" }}>
                        <Calendar size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />Session: {fmtDate(r.start_time)} &nbsp;|&nbsp; <UserCheck size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />{r.faculty_name}
                      </div>

                      <div
                        style={{
                          fontSize: "0.85rem",
                          padding: "0.5rem 0.75rem",
                          background: "rgba(0,0,0,0.1)",
                          borderRadius: "6px",
                          marginBottom: r.rejection_note ? "0.5rem" : 0,
                        }}
                      >
                        <span style={{ opacity: 0.6, fontSize: "0.78rem" }}>Your reason: </span>
                        {r.reason}
                      </div>

                      {r.rejection_note && (
                        <div
                          style={{
                            fontSize: "0.83rem",
                            padding: "0.45rem 0.75rem",
                            background: "rgba(239,68,68,0.08)",
                            borderRadius: "6px",
                            borderLeft: "3px solid #ef4444",
                          }}
                        >
                          <span style={{ opacity: 0.6, fontSize: "0.78rem" }}>Teacher note: </span>
                          {r.rejection_note}
                        </div>
                      )}

                      <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", opacity: 0.5 }}>
                        Submitted: {fmtDate(r.created_at)}
                        {r.reviewed_at && ` · Reviewed: ${fmtDate(r.reviewed_at)}`}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "0.65rem 0.9rem",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.07)",
  color: "inherit",
  fontSize: "0.9rem",
  outline: "none",
  boxSizing: "border-box",
};
