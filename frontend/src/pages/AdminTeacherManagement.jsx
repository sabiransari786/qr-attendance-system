import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "../utils/constants";
import { DEPARTMENTS } from "../config/dummyData";
import { fadeInUp, staggerContainer } from "../animations/animationConfig";
import "../styles/admin-pages.css";
import "../styles/admin-approval-page.css";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
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
      }}
    >
      <span>{toast.type === "error" ? "✗" : "✓"}</span>
      <span>{toast.message}</span>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          fontSize: "1.1rem",
          marginLeft: "0.5rem",
        }}
      >
        ×
      </button>
    </div>
  );
};

const EMPTY_FORM = {
  name: "",
  email: "",
  contactNumber: "",
  teacherId: "",
  department: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminTeacherManagement() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [tab, setTab] = useState("registered"); // "registered" | "pending" | "create"
  const [registeredTeachers, setRegisteredTeachers] = useState([]);
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");

  // Create form
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch registered teachers (role=faculty in users table)
  // ───────────────────────────────────────────────────────────────────────────
  const fetchRegisteredTeachers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/admin/users?role=faculty`, {
        headers: authHeaders,
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRegisteredTeachers(data.data);
      }
    } catch {
      showToast("Failed to fetch teachers", "error");
    } finally {
      setLoading(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch pending teachers (approved_users with faculty role, not yet registered)
  // ───────────────────────────────────────────────────────────────────────────
  const fetchPendingTeachers = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/auth/admin/approved-users?role=faculty&isRegistered=false`,
        { headers: authHeaders }
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setPendingTeachers(data.data);
      }
    } catch {
      showToast("Failed to fetch pending approvals", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegisteredTeachers();
    fetchPendingTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // Toggle activate / deactivate
  // ───────────────────────────────────────────────────────────────────────────
  const handleToggleStatus = async (teacher) => {
    const newStatus = teacher.is_active ? false : true;
    setActionLoading(`status-${teacher.id}`);
    try {
      const res = await fetch(
        `${API_BASE_URL}/auth/admin/users/${teacher.id}/status`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({ isActive: newStatus }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setRegisteredTeachers((prev) =>
          prev.map((t) =>
            t.id === teacher.id ? { ...t, is_active: newStatus } : t
          )
        );
        showToast(
          `Teacher ${newStatus ? "activated" : "deactivated"} successfully`
        );
      } else {
        showToast(data.message || "Status update failed", "error");
      }
    } catch {
      showToast("Failed to update status", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Delete pending approval
  // ───────────────────────────────────────────────────────────────────────────
  const handleDeletePending = async (id) => {
    if (!window.confirm("Remove this pending teacher approval?")) return;
    setActionLoading(`delete-${id}`);
    try {
      const res = await fetch(
        `${API_BASE_URL}/auth/admin/approved-users/${id}`,
        { method: "DELETE", headers: authHeaders }
      );
      const data = await res.json();
      if (data.success) {
        setPendingTeachers((prev) => prev.filter((t) => t.id !== id));
        showToast("Pending approval removed");
      } else {
        showToast(data.message || "Delete failed", "error");
      }
    } catch {
      showToast("Failed to delete", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Create teacher pre-registration
  // ───────────────────────────────────────────────────────────────────────────
  const handleCreateTeacher = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.contactNumber || !form.teacherId) {
      showToast("Name, Email, Contact Number and Teacher ID are required", "error");
      return;
    }
    if (!/^\d{10}$/.test(form.contactNumber.trim())) {
      showToast("Contact number must be 10 digits", "error");
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/admin/approved-users`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          contactNumber: form.contactNumber.trim(),
          role: "faculty",
          teacherId: form.teacherId.trim().toUpperCase(),
          department: form.department || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          `Teacher ID "${form.teacherId.trim().toUpperCase()}" created! Teacher can now register.`
        );
        setForm(EMPTY_FORM);
        fetchPendingTeachers();
        setTab("pending");
      } else {
        showToast(data.message || "Failed to create teacher", "error");
      }
    } catch {
      showToast("Server error. Please try again.", "error");
    } finally {
      setFormLoading(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Filtered lists
  // ───────────────────────────────────────────────────────────────────────────
  const filteredRegistered = registeredTeachers.filter(
    (t) =>
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.email?.toLowerCase().includes(search.toLowerCase()) ||
      t.teacher_id?.toLowerCase().includes(search.toLowerCase()) ||
      t.department?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPending = pendingTeachers.filter(
    (t) =>
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.email?.toLowerCase().includes(search.toLowerCase()) ||
      t.teacher_id?.toLowerCase().includes(search.toLowerCase())
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="ap" style={{ minHeight: "100vh", paddingTop: "5rem" }}>
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* ── Header ── */}
      <motion.div
        className="ap__header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: "2rem" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
          <button
            onClick={() => navigate("/admin-dashboard")}
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
          <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: 700 }}>
            👨‍🏫 Teacher Management
          </h1>
        </div>
        <p style={{ margin: 0, opacity: 0.7 }}>
          Admin creates Teacher IDs — only pre-registered teachers can sign up and log in.
        </p>
      </motion.div>

      {/* ── Summary Cards ── */}
      <motion.div
        style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {[
          { label: "Total Registered", value: registeredTeachers.length, color: "#6366f1", icon: "👤" },
          { label: "Active", value: registeredTeachers.filter((t) => t.is_active).length, color: "#10b981", icon: "✅" },
          { label: "Deactivated", value: registeredTeachers.filter((t) => !t.is_active).length, color: "#ef4444", icon: "🚫" },
          { label: "Pending Signup", value: pendingTeachers.length, color: "#f59e0b", icon: "⏳" },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: `1px solid ${card.color}44`,
              borderRadius: "12px",
              padding: "1rem 1.5rem",
              flex: "1 1 140px",
              textAlign: "center",
              backdropFilter: "blur(8px)",
            }}
          >
            <div style={{ fontSize: "1.5rem" }}>{card.icon}</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 700, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>{card.label}</div>
          </div>
        ))}
      </motion.div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { key: "registered", label: "📋 Registered Teachers" },
          { key: "pending", label: `⏳ Pending Signups (${pendingTeachers.length})` },
          { key: "create", label: "➕ Create Teacher ID" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "0.6rem 1.2rem",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.2)",
              cursor: "pointer",
              background: tab === t.key ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.07)",
              color: "inherit",
              fontWeight: tab === t.key ? 600 : 400,
              transition: "all 0.2s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Search (for list tabs) ── */}
      {tab !== "create" && (
        <input
          type="text"
          placeholder="Search by name, email, teacher ID, department…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "480px",
            padding: "0.65rem 1rem",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.08)",
            color: "inherit",
            fontSize: "0.9rem",
            marginBottom: "1.5rem",
            outline: "none",
          }}
        />
      )}

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        {/* ────── REGISTERED TEACHERS ────── */}
        {tab === "registered" && (
          <motion.div
            key="registered"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {loading ? (
              <p style={{ opacity: 0.6 }}>Loading teachers…</p>
            ) : filteredRegistered.length === 0 ? (
              <p style={{ opacity: 0.6 }}>No registered teachers found.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {filteredRegistered.map((teacher) => (
                  <motion.div
                    key={teacher.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: `1px solid ${teacher.is_active ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                      borderRadius: "12px",
                      padding: "1rem 1.25rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "1.1rem",
                        flexShrink: 0,
                      }}
                    >
                      {teacher.name?.charAt(0).toUpperCase() || "T"}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontWeight: 600, marginBottom: "0.2rem" }}>
                        {teacher.name}
                        <span
                          style={{
                            marginLeft: "0.5rem",
                            fontSize: "0.75rem",
                            padding: "0.15rem 0.5rem",
                            borderRadius: "20px",
                            background: teacher.is_active ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
                            color: teacher.is_active ? "#10b981" : "#ef4444",
                          }}
                        >
                          {teacher.is_active ? "Active" : "Deactivated"}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.82rem", opacity: 0.7 }}>{teacher.email}</div>
                      <div style={{ fontSize: "0.8rem", opacity: 0.6, marginTop: "0.15rem" }}>
                        🪪 {teacher.teacher_id || "—"} &nbsp;|&nbsp; 🏛 {teacher.department || "N/A"}
                      </div>
                    </div>

                    {/* Actions */}
                    <button
                      onClick={() => handleToggleStatus(teacher)}
                      disabled={actionLoading === `status-${teacher.id}`}
                      style={{
                        padding: "0.5rem 1.1rem",
                        borderRadius: "8px",
                        border: "none",
                        cursor: "pointer",
                        background: teacher.is_active ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)",
                        color: teacher.is_active ? "#ef4444" : "#10b981",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        opacity: actionLoading === `status-${teacher.id}` ? 0.5 : 1,
                      }}
                    >
                      {actionLoading === `status-${teacher.id}`
                        ? "…"
                        : teacher.is_active
                        ? "Deactivate"
                        : "Activate"}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ────── PENDING SIGNUPS ────── */}
        {tab === "pending" && (
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <p style={{ opacity: 0.65, fontSize: "0.9rem", marginBottom: "1rem" }}>
              These teacher IDs have been created by admin but the teacher hasn't signed up yet.
              Share their Teacher ID with them so they can register.
            </p>
            {loading ? (
              <p style={{ opacity: 0.6 }}>Loading…</p>
            ) : filteredPending.length === 0 ? (
              <p style={{ opacity: 0.6 }}>No pending teacher approvals.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {filteredPending.map((teacher) => (
                  <motion.div
                    key={teacher.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      background: "rgba(245,158,11,0.07)",
                      border: "1px solid rgba(245,158,11,0.3)",
                      borderRadius: "12px",
                      padding: "1rem 1.25rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg,#f59e0b,#d97706)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "1.1rem",
                        flexShrink: 0,
                      }}
                    >
                      {teacher.name?.charAt(0).toUpperCase() || "T"}
                    </div>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontWeight: 600, marginBottom: "0.2rem" }}>
                        {teacher.name}
                        <span
                          style={{
                            marginLeft: "0.5rem",
                            fontSize: "0.75rem",
                            padding: "0.15rem 0.5rem",
                            borderRadius: "20px",
                            background: "rgba(245,158,11,0.2)",
                            color: "#f59e0b",
                          }}
                        >
                          Awaiting Signup
                        </span>
                      </div>
                      <div style={{ fontSize: "0.82rem", opacity: 0.7 }}>{teacher.email}</div>
                      <div style={{ fontSize: "0.8rem", opacity: 0.6, marginTop: "0.15rem" }}>
                        🪪 Teacher ID: <strong>{teacher.teacher_id || "—"}</strong>
                        &nbsp;|&nbsp; 🏛 {teacher.department || "N/A"}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePending(teacher.id)}
                      disabled={actionLoading === `delete-${teacher.id}`}
                      style={{
                        padding: "0.5rem 1.1rem",
                        borderRadius: "8px",
                        border: "none",
                        cursor: "pointer",
                        background: "rgba(239,68,68,0.15)",
                        color: "#ef4444",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        opacity: actionLoading === `delete-${teacher.id}` ? 0.5 : 1,
                      }}
                    >
                      {actionLoading === `delete-${teacher.id}` ? "…" : "Remove"}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ────── CREATE TEACHER ID ────── */}
        {tab === "create" && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ maxWidth: 560 }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: "16px",
                padding: "2rem",
              }}
            >
              <h2 style={{ margin: "0 0 0.4rem", fontSize: "1.2rem" }}>
                ➕ Create New Teacher ID
              </h2>
              <p style={{ margin: "0 0 1.5rem", opacity: 0.65, fontSize: "0.88rem" }}>
                Admin assigns a unique Teacher ID. The teacher uses this ID during sign-up.
                Only pre-registered teachers can log in.
              </p>

              <form onSubmit={handleCreateTeacher} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Name */}
                <div>
                  <label style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.88rem", opacity: 0.8 }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Dr. Ramesh Kumar"
                    required
                    style={inputStyle}
                  />
                </div>

                {/* Email + Contact */}
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <label style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.88rem", opacity: 0.8 }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="teacher@college.edu"
                      required
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <label style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.88rem", opacity: 0.8 }}>
                      Contact Number * (10 digits)
                    </label>
                    <input
                      type="tel"
                      value={form.contactNumber}
                      onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                      placeholder="9876543210"
                      maxLength={10}
                      required
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Teacher ID + Department */}
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <label style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.88rem", opacity: 0.8 }}>
                      Teacher ID * (unique)
                    </label>
                    <input
                      type="text"
                      value={form.teacherId}
                      onChange={(e) =>
                        setForm({ ...form, teacherId: e.target.value.toUpperCase() })
                      }
                      placeholder="e.g. FAC-2025-001"
                      required
                      style={{ ...inputStyle, fontFamily: "monospace", letterSpacing: "0.05em" }}
                    />
                    <p style={{ margin: "0.3rem 0 0", fontSize: "0.75rem", opacity: 0.55 }}>
                      Share this ID with the teacher for sign-up
                    </p>
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <label style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.88rem", opacity: 0.8 }}>
                      Department
                    </label>
                    <select
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Info box */}
                <div
                  style={{
                    background: "rgba(99,102,241,0.1)",
                    border: "1px solid rgba(99,102,241,0.3)",
                    borderRadius: "8px",
                    padding: "0.75rem 1rem",
                    fontSize: "0.83rem",
                    opacity: 0.85,
                    lineHeight: 1.5,
                  }}
                >
                  ℹ️ After creating, share the <strong>Teacher ID</strong> and their
                  registered <strong>email</strong> with the teacher. They must use the same email
                  and teacher ID during sign-up. If deactivated later, they cannot log in even if already registered.
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  style={{
                    padding: "0.75rem",
                    borderRadius: "10px",
                    border: "none",
                    background: formLoading
                      ? "rgba(99,102,241,0.4)"
                      : "linear-gradient(135deg,#6366f1,#8b5cf6)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "1rem",
                    cursor: formLoading ? "not-allowed" : "pointer",
                    letterSpacing: "0.02em",
                    marginTop: "0.25rem",
                  }}
                >
                  {formLoading ? "Creating…" : "✓ Create Teacher ID"}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared input style
// ─────────────────────────────────────────────────────────────────────────────
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
