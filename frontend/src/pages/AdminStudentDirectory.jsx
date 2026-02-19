import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "../utils/constants";
import { fadeInUp, staggerContainer } from "../animations/animationConfig";
import "../styles/dashboard.css";
import "../styles/admin-pages.css";

const SKELETON_ROWS = 6;

function AdminStudentDirectory() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

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
      setStudents([
        { id: 1, name: "Rahul Singh", email: "rahul@demo.com", student_id: "STU-0001", department: "Computer Science", is_active: true },
        { id: 2, name: "Priya Verma", email: "priya@demo.com", student_id: "STU-0002", department: "Electrical", is_active: true },
        { id: 3, name: "Amit Patel", email: "amit@demo.com", student_id: "STU-0003", department: "Mechanical", is_active: false },
        { id: 4, name: "Neha Gupta", email: "neha@demo.com", student_id: "STU-0004", department: "Civil", is_active: true },
        { id: 5, name: "Karan Joshi", email: "karan@demo.com", student_id: "STU-0005", department: "Computer Science", is_active: true },
        { id: 6, name: "Sneha Mishra", email: "sneha@demo.com", student_id: "STU-0006", department: "Electronics", is_active: false },
      ]);
    } finally {
      setLoading(false);
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
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && s.is_active) ||
      (statusFilter === "inactive" && !s.is_active);
    return matchesSearch && matchesDept && matchesStatus;
  });

  const stats = [
    { label: "Total Students", value: students.length, sub: "Registered" },
    { label: "Active", value: students.filter((s) => s.is_active !== false).length, sub: "Accounts" },
    { label: "Inactive", value: students.filter((s) => s.is_active === false).length, sub: "Suspended" },
    { label: "Departments", value: departments.length - 1, sub: "Enrolled" },
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
              <p className="ap__subtitle">Review and manage all registered students</p>
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
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                      <tr key={i}>
                        {[1, 2, 3, 4, 5].map((c) => (
                          <td key={c}><div className="ap__skeleton" style={{ width: `${60 + c * 10}%` }} /></td>
                        ))}
                      </tr>
                    ))
                  : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="ap__empty">
                          <div className="ap__empty-icon">🎓</div>
                          <p className="ap__empty-title">No students found</p>
                          <p className="ap__empty-text">Try adjusting your search or filters.</p>
                        </div>
                      </td>
                    </tr>
                  )
                  : filtered.map((s, idx) => (
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
                              {getInitials(s.name)}
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
                          <span className={`ap__badge ${s.is_active !== false ? "ap__badge--active" : "ap__badge--inactive"}`}>
                            <span style={{ fontSize: "0.5rem" }}>●</span>
                            {s.is_active !== false ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default AdminStudentDirectory;
