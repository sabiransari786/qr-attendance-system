import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, AlertTriangle, Check, Loader } from 'lucide-react';
import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "../utils/constants";
import { fadeInUp, staggerContainer } from "../animations/animationConfig";
import "../styles/dashboard.css";
import "../styles/admin-pages.css";

const SKELETON_ROWS = 6;
const SEM_ORDER = ["1st", "2nd", "3rd", "4th", "5th", "6th"];
const SEM_COLORS = {
  "1st": "#6366f1", "2nd": "#8b5cf6", "3rd": "#3b82f6",
  "4th": "#10b981", "5th": "#f59e0b", "6th": "#ef4444",
  graduated: "#6b7280",
};

function AdminStudentDirectory() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [semFilter, setSemFilter] = useState("all");

  // Promote state
  const [promoting, setPromoting] = useState(null);   // student id being promoted
  const [confirmId, setConfirmId] = useState(null);   // student id awaiting confirm
  const [toast, setToast] = useState(null);           // { msg, ok }

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/students`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) setStudents(data.data);
      else setStudents([]);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async (studentId) => {
    setConfirmId(null);
    setPromoting(studentId);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/admin/students/${studentId}/promote`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, true);
        await fetchStudents(); // refresh list
      } else {
        showToast(data.message || "Promote nahi hua.", false);
      }
    } catch {
      showToast("Server error. Try again.", false);
    } finally {
      setPromoting(null);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const departments = ["all", ...Array.from(new Set(students.map((s) => s.department).filter(Boolean)))];

  const filtered = students.filter((s) => {
    const matchesSearch =
      !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id?.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === "all" || s.department === deptFilter;
    const matchesSem  = semFilter  === "all" || s.semester === semFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active"   && s.is_active) ||
      (statusFilter === "inactive" && !s.is_active);
    return matchesSearch && matchesDept && matchesSem && matchesStatus;
  });

  const stats = [
    { label: "Total Students",  value: students.length, sub: "Registered" },
    { label: "Active",          value: students.filter((s) => s.is_active !== false).length, sub: "Accounts" },
    { label: "Graduated",       value: students.filter((s) => s.semester === "graduated").length, sub: "Alumni" },
    { label: "Departments",     value: departments.length - 1, sub: "Enrolled" },
  ];

  const getInitials = (name = "") =>
    name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <motion.div
      className="dashboard ap"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: "fixed", top: 20, right: 20, zIndex: 9999,
              background: toast.ok ? "#10b981" : "#ef4444",
              color: "#fff", padding: "12px 20px", borderRadius: 10,
              fontWeight: 600, fontSize: "0.9rem", boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              maxWidth: 380,
            }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm promote dialog */}
      <AnimatePresence>
        {confirmId !== null && (() => {
          const s = students.find(x => x.id === confirmId);
          const curIdx = SEM_ORDER.indexOf(s?.semester);
          const nextSem = curIdx === 5 ? "Graduated" : curIdx >= 0 ? `${SEM_ORDER[curIdx + 1]} Semester` : "?";
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed", inset: 0, zIndex: 9998,
                background: "rgba(0,0,0,0.55)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              onClick={() => setConfirmId(null)}
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{
                  background: "var(--color-surface, #1e293b)",
                  border: "1px solid var(--color-border, #334155)",
                  borderRadius: 16, padding: 28, minWidth: 320, maxWidth: 380,
                  boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
                }}
              >
                <p style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 8 }}>Confirm Promote</p>
                <p style={{ color: "var(--color-text-secondary)", marginBottom: 20, lineHeight: 1.6 }}>
                  <strong>{s?.name}</strong> ko<br />
                  <span style={{ color: SEM_COLORS[s?.semester] }}>{s?.semester} Semester</span>
                  {" → "}
                  <span style={{ color: "#10b981", fontWeight: 700 }}>{nextSem}</span>
                  <br />karna chahte ho?
                  {curIdx === 5 && (
                    <><br /><span style={{ color: "#ef4444", fontSize: "0.82rem" }}>
                      <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />Account deactivate ho jayega (graduated).
                    </span></>
                  )}
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    className="ap__btn ap__btn--outline"
                    style={{ flex: 1 }}
                    onClick={() => setConfirmId(null)}
                  >Cancel</button>
                  <button
                    className="ap__btn ap__btn--primary"
                    style={{ flex: 1, background: "#10b981", borderColor: "#10b981" }}
                    onClick={() => handlePromote(confirmId)}
                  >Promote <Check size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '2px' }} /></button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Floating objects */}
      <div className="ap__objects" aria-hidden="true">
        <span className="ap__object ap__object--a" />
        <span className="ap__object ap__object--b" />
        <span className="ap__object ap__object--c" />
      </div>

      <div className="ap__inner">
        {/* Header */}
        <motion.div className="ap__header" variants={fadeInUp}>
          <div className="ap__header-left">
            <button className="ap__back-btn" onClick={() => navigate("/admin-dashboard")}>
              ← Dashboard
            </button>
            <div>
              <p className="ap__eyebrow">Admin Panel</p>
              <h1 className="ap__title">Student Directory</h1>
              <p className="ap__subtitle">Review, manage, and promote registered students</p>
            </div>
          </div>
          <div className="ap__header-actions">
            <button className="ap__btn ap__btn--outline" onClick={fetchStudents} disabled={loading}>
              ↻ Refresh
            </button>
            <button className="ap__btn ap__btn--primary" onClick={() => navigate("/admin/approvals")}>
              + Add Student
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

        {/* Filters + Table */}
        <motion.div className="ap__panel" variants={fadeInUp}>
          <div className="ap__panel-header">
            <h2 className="ap__panel-title">
              Student List{" "}
              <span className="ap__panel-count">({loading ? "…" : filtered.length} results)</span>
            </h2>
          </div>

          <div className="ap__filters">
            <input
              className="ap__search"
              placeholder="Search name, email, roll no…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="ap__select" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              {departments.map((d) => (
                <option key={d} value={d}>{d === "all" ? "All Departments" : d}</option>
              ))}
            </select>
            <select className="ap__select" value={semFilter} onChange={(e) => setSemFilter(e.target.value)}>
              <option value="all">All Semesters</option>
              {SEM_ORDER.map(s => <option key={s} value={s}>{s} Sem</option>)}
              <option value="graduated">Graduated</option>
            </select>
            <select className="ap__select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="ap__table-wrap">
            <table className="ap__table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Roll Number</th>
                  <th>Department</th>
                  <th>Semester</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                      <tr key={i}>
                        {[1, 2, 3, 4, 5, 6, 7].map((c) => (
                          <td key={c}><div className="ap__skeleton" style={{ width: `${50 + c * 8}%` }} /></td>
                        ))}
                      </tr>
                    ))
                  : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="ap__empty">
                          <div className="ap__empty-icon"><GraduationCap size={48} /></div>
                          <p className="ap__empty-title">No students found</p>
                          <p className="ap__empty-text">Try adjusting your search or filters.</p>
                        </div>
                      </td>
                    </tr>
                  )
                  : filtered.map((s, idx) => {
                      const curIdx = SEM_ORDER.indexOf(s.semester);
                      const canPromote = curIdx >= 0 && s.is_active !== false;
                      const isGraduated = s.semester === "graduated";
                      const semColor = SEM_COLORS[s.semester] || "#6b7280";
                      return (
                        <motion.tr
                          key={s.id}
                          variants={fadeInUp}
                          initial="hidden"
                          animate="visible"
                          transition={{ delay: idx * 0.03 }}
                        >
                          <td style={{ color: "var(--color-text-secondary)", fontSize: "0.78rem" }}>#{s.id}</td>
                          <td>
                            <div className="ap__avatar-cell">
                              <div className="ap__avatar ap__avatar--student">
                                {s.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="ap__user-name">{s.name}</p>
                                <p className="ap__user-sub">{s.email}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontFamily: "monospace", fontSize: "0.82rem", color: "var(--color-primary)" }}>
                              {s.student_id || "—"}
                            </span>
                          </td>
                          <td style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
                            {s.department || "—"}
                          </td>
                          <td>
                            <span style={{
                              display: "inline-block",
                              background: semColor + "22",
                              color: semColor,
                              border: `1px solid ${semColor}55`,
                              borderRadius: 6,
                              padding: "2px 10px",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              textTransform: "capitalize",
                            }}>
                              {isGraduated ? <><GraduationCap size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />Grad</> : s.semester ? `Sem ${s.semester}` : "—"}
                            </span>
                          </td>
                          <td>
                            <span className={`ap__badge ${s.is_active !== false ? "ap__badge--active" : "ap__badge--inactive"}`}>
                              <span style={{ fontSize: "0.5rem" }}>●</span>
                              {s.is_active !== false ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>
                            {canPromote ? (
                              <button
                                onClick={() => setConfirmId(s.id)}
                                disabled={promoting === s.id}
                                style={{
                                  background: "transparent",
                                  border: "1px solid #10b981",
                                  color: "#10b981",
                                  borderRadius: 6,
                                  padding: "4px 12px",
                                  fontSize: "0.78rem",
                                  fontWeight: 600,
                                  cursor: promoting === s.id ? "wait" : "pointer",
                                  whiteSpace: "nowrap",
                                  opacity: promoting === s.id ? 0.5 : 1,
                                }}
                              >
                                {promoting === s.id ? <><Loader size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />…</> : "↑ Promote"}
                              </button>
                            ) : (
                              <span style={{ color: "var(--color-text-secondary)", fontSize: "0.78rem" }}>
                                {isGraduated ? <><GraduationCap size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />done</> : "—"}
                              </span>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default AdminStudentDirectory;
