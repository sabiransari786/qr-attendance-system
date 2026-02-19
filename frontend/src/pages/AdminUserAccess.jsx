import { useContext, useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "../utils/constants";
import { fadeInUp, staggerContainer } from "../animations/animationConfig";
import "../styles/dashboard.css";
import "../styles/admin-pages.css";

const MOCK_USERS = [
  { id: 1, name: "Admin User", email: "admin@attendance.com", role: "admin", is_active: true, department: "Administration" },
  { id: 2, name: "Rahul Singh", email: "rahul@demo.com", role: "student", is_active: true, department: "Computer Science" },
  { id: 3, name: "Dr. Priya Sharma", email: "priya.faculty@demo.com", role: "faculty", is_active: true, department: "Electrical" },
  { id: 4, name: "Amit Patel", email: "amit@demo.com", role: "student", is_active: false, department: "Mechanical" },
  { id: 5, name: "Prof. Kiran Mehta", email: "kiran@demo.com", role: "faculty", is_active: true, department: "Civil" },
  { id: 6, name: "Sneha Mishra", email: "sneha@demo.com", role: "student", is_active: true, department: "Electronics" },
];

function AdminUserAccess() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const isMock = import.meta.env.VITE_USE_MOCK_API === "true";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMockMode, setIsMockMode] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeAction, setActiveAction] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    if (isMock) { setUsers(MOCK_USERS); setIsMockMode(true); setLoading(false); return; }
    try {
      const params = new URLSearchParams();
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      const res = await fetch(`${API_BASE_URL}/auth/admin/users?${params}`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) { setUsers(data.data); setIsMockMode(false); }
      else { setUsers(MOCK_USERS); setIsMockMode(true); }
    } catch {
      setUsers(MOCK_USERS);
      setIsMockMode(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId, role) => {
    setActiveAction(`role-${userId}`);
    try {
      if (!isMockMode) {
        const res = await fetch(`${API_BASE_URL}/auth/admin/users/${userId}/role`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ role }),
        });
        const data = await res.json();
        if (!data.success) throw new Error();
      }
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      showToast("Role updated successfully");
    } catch {
      showToast("Failed to update role", "error");
    } finally {
      setActiveAction(null);
    }
  };

  const handleStatusToggle = async (userId, isActive) => {
    setActiveAction(`status-${userId}`);
    try {
      if (!isMockMode) {
        const res = await fetch(`${API_BASE_URL}/auth/admin/users/${userId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ is_active: !isActive }),
        });
        const data = await res.json();
        if (!data.success) throw new Error();
      }
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: !u.is_active } : u)));
      showToast(`User ${!isActive ? "activated" : "deactivated"}`);
    } catch {
      showToast("Failed to update status", "error");
    } finally {
      setActiveAction(null);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Delete this user? This action cannot be undone.")) return;
    setActiveAction(`delete-${userId}`);
    try {
      if (!isMockMode) {
        await fetch(`${API_BASE_URL}/auth/admin/users/${userId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      showToast("User deleted");
    } catch {
      showToast("Failed to delete user", "error");
    } finally {
      setActiveAction(null);
    }
  };

  const filtered = useMemo(() =>
    users.filter((u) => {
      const match =
        !search ||
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.department?.toLowerCase().includes(search.toLowerCase());
      const role = roleFilter === "all" || u.role === roleFilter;
      const status =
        statusFilter === "all" ||
        (statusFilter === "active" && u.is_active) ||
        (statusFilter === "inactive" && !u.is_active);
      return match && role && status;
    }), [users, search, roleFilter, statusFilter]);

  const stats = [
    { label: "Total Users", value: users.length, sub: "All roles" },
    { label: "Students", value: users.filter((u) => u.role === "student").length, sub: "Enrolled" },
    { label: "Faculty", value: users.filter((u) => u.role === "faculty").length, sub: "Teaching" },
    { label: "Active", value: users.filter((u) => u.is_active).length, sub: "Accounts" },
  ];

  const getInitials = (name = "") =>
    name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <motion.div className="dashboard ap" variants={staggerContainer} initial="hidden" animate="visible">
      <div className="ap__objects" aria-hidden="true">
        <span className="ap__object ap__object--a" />
        <span className="ap__object ap__object--b" />
        <span className="ap__object ap__object--c" />
      </div>

      {/* In-page toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "88px", right: "24px", zIndex: 9999,
          padding: "0.75rem 1.25rem",
          background: toast.type === "error" ? "rgba(239,68,68,0.18)" : "rgba(34,197,94,0.18)",
          border: `1px solid ${toast.type === "error" ? "rgba(239,68,68,0.4)" : "rgba(34,197,94,0.4)"}`,
          color: toast.type === "error" ? "#f87171" : "#4ade80",
          borderRadius: "12px", fontSize: "0.875rem", backdropFilter: "blur(16px)",
        }}>
          {toast.type === "error" ? "✗" : "✓"} {toast.msg}
        </div>
      )}

      <div className="ap__inner">
        {/* Header */}
        <motion.div className="ap__header" variants={fadeInUp}>
          <div className="ap__header-left">
            <button className="ap__back-btn" onClick={() => navigate("/admin-dashboard")}>← Dashboard</button>
            <div>
              <p className="ap__eyebrow">Admin Panel</p>
              <h1 className="ap__title">User Access</h1>
              <p className="ap__subtitle">Manage roles, permissions and account status</p>
            </div>
          </div>
          <div className="ap__header-actions">
            {isMockMode && <span className="ap__mock-note">⚠ Mock data</span>}
            <button className="ap__btn ap__btn--outline" onClick={fetchUsers} disabled={loading}>↻ Refresh</button>
            <button className="ap__btn ap__btn--primary" onClick={() => navigate("/admin/approvals")}>+ Add User</button>
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

        {/* Panel */}
        <motion.div className="ap__panel" variants={fadeInUp}>
          <div className="ap__panel-header">
            <h2 className="ap__panel-title">
              All Users <span className="ap__panel-count">({loading ? "…" : filtered.length} results)</span>
            </h2>
          </div>

          <div className="ap__filters">
            <input
              className="ap__search"
              placeholder="Search name, email, department…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="ap__select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
            <select className="ap__select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button className="ap__btn ap__btn--ghost" onClick={fetchUsers}>Apply</button>
          </div>

          <div className="ap__table-wrap">
            <table className="ap__table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>User</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {[1, 2, 3, 4, 5, 6].map((c) => (
                          <td key={c}><div className="ap__skeleton" style={{ width: `${50 + c * 8}%` }} /></td>
                        ))}
                      </tr>
                    ))
                  : filtered.length === 0
                  ? (
                    <tr><td colSpan={6}>
                      <div className="ap__empty">
                        <div className="ap__empty-icon">👥</div>
                        <p className="ap__empty-title">No users found</p>
                        <p className="ap__empty-text">Adjust your filters or add a new user.</p>
                      </div>
                    </td></tr>
                  )
                  : filtered.map((u, idx) => (
                      <motion.tr key={u.id} variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: idx * 0.03 }}>
                        <td style={{ color: "var(--color-text-secondary)", fontSize: "0.78rem" }}>#{u.id}</td>
                        <td>
                          <div className="ap__avatar-cell">
                            <div className={`ap__avatar ap__avatar--${u.role}`}>{getInitials(u.name)}</div>
                            <div>
                              <p className="ap__user-name">{u.name}</p>
                              <p className="ap__user-sub">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>{u.department || "—"}</td>
                        <td>
                          <select
                            className="ap__role-select"
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            disabled={activeAction === `role-${u.id}`}
                          >
                            <option value="student">Student</option>
                            <option value="faculty">Faculty</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td>
                          <button
                            className={`ap__status-btn ap__status-btn--${u.is_active ? "active" : "inactive"}`}
                            onClick={() => handleStatusToggle(u.id, u.is_active)}
                            disabled={activeAction === `status-${u.id}`}
                          >
                            {u.is_active ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td>
                          <button
                            className="ap__btn ap__btn--danger"
                            style={{ padding: "0.3rem 0.75rem", fontSize: "0.78rem" }}
                            onClick={() => handleDelete(u.id)}
                            disabled={activeAction === `delete-${u.id}`}
                          >
                            Delete
                          </button>
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

export default AdminUserAccess;
