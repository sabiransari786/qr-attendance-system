import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "../utils/constants";
import { fadeInUp, fadeInDown, staggerContainer, buttonHover, buttonTap } from "../animations/animationConfig";
import "../styles/dashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  
  // State for students view
  const [showStudents, setShowStudents] = useState(false);
  const [students, setStudents] = useState([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // State for user management view
  const [showUsers, setShowUsers] = useState(false);
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [activeUserAction, setActiveUserAction] = useState(null);
  const [useMockUsers, setUseMockUsers] = useState(false);

  // State for activity logs view
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logSearch, setLogSearch] = useState("");
  const [logRoleFilter, setLogRoleFilter] = useState("all");
  const [logActionFilter, setLogActionFilter] = useState("all");
  const [logStatusFilter, setLogStatusFilter] = useState("all");
  const [logStartDate, setLogStartDate] = useState("");
  const [logEndDate, setLogEndDate] = useState("");
  const [logPage, setLogPage] = useState(1);
  const [logPagination, setLogPagination] = useState({ total: 0, page: 1, pages: 1, limit: 50 });

  const isMockMode = import.meta.env.VITE_USE_MOCK_API === "true";

  // Fetch students data
  const fetchStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/students`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authContext?.token}`
        }
      });
      
      const data = await response.json();
      if (data.success && data.data) {
        setStudents(data.data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      // Fallback: show mock data
      setStudents([
        { id: 2, name: 'Student', email: 'student@demo.com', student_id: 'STU-0001' },
        { id: 7, name: 'Rahul Singh', email: 'rahul@demo.com', student_id: 'STU-0002' },
        { id: 8, name: 'Priya Verma', email: 'priya@demo.com', student_id: 'STU-0003' },
        { id: 9, name: 'Amit Patel', email: 'amit@demo.com', student_id: 'STU-0004' },
        { id: 10, name: 'Neha Gupta', email: 'neha@demo.com', student_id: 'STU-0005' }
      ]);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (showStudents && students.length === 0) {
      fetchStudents();
    }
  }, [showStudents]);

  useEffect(() => {
    if (showUsers && users.length === 0) {
      fetchUsers();
    }
  }, [showUsers]);

  useEffect(() => {
    if (showLogs) {
      fetchLogs();
    }
  }, [showLogs, logPage]);

  const getMockUsers = () => ([
    { id: 1, name: 'Admin User', email: 'admin@attendance.com', role: 'admin', is_active: true, department: 'Administration' },
    { id: 2, name: 'Student One', email: 'student@attendance.com', role: 'student', is_active: true, department: 'Computer Science' },
    { id: 3, name: 'Faculty User', email: 'faculty@attendance.com', role: 'faculty', is_active: true, department: 'Electrical' },
    { id: 4, name: 'Riya Sharma', email: 'riya@demo.com', role: 'student', is_active: false, department: 'Mechanical' },
    { id: 5, name: 'Arjun Verma', email: 'arjun@demo.com', role: 'student', is_active: true, department: 'Civil' }
  ]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    setUseMockUsers(false);

    if (isMockMode) {
      setUsers(getMockUsers());
      setUseMockUsers(true);
      setIsLoadingUsers(false);
      return;
    }

    try {
      const params = new URLSearchParams();
      if (userSearch.trim()) {
        params.append('search', userSearch.trim());
      }
      if (userRoleFilter !== 'all') {
        params.append('role', userRoleFilter);
      }
      if (userStatusFilter !== 'all') {
        params.append('status', userStatusFilter);
      }

      const response = await fetch(`${API_BASE_URL}/auth/admin/users?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authContext?.token}`
        }
      });

      const data = await response.json();
      if (data.success && data.data) {
        setUsers(data.data);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers(getMockUsers());
      setUseMockUsers(true);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchLogs = async (pageValue = logPage) => {
    setIsLoadingLogs(true);

    try {
      const params = new URLSearchParams();

      params.append('page', String(pageValue));
      params.append('limit', String(logPagination.limit || 50));

      if (logSearch.trim()) {
        params.append('search', logSearch.trim());
      }
      if (logRoleFilter !== 'all') {
        params.append('role', logRoleFilter);
      }
      if (logActionFilter !== 'all') {
        params.append('action', logActionFilter);
      }
      if (logStatusFilter !== 'all') {
        params.append('status', logStatusFilter);
      }
      if (logStartDate) {
        params.append('startDate', logStartDate);
      }
      if (logEndDate) {
        params.append('endDate', logEndDate);
      }

      const response = await fetch(`${API_BASE_URL}/auth/admin/logs?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authContext?.token}`
        }
      });

      const data = await response.json();
      if (data.success && data.data) {
        setLogs(data.data.logs || []);
        setLogPagination(data.data.pagination || { total: 0, page: 1, pages: 1, limit: 50 });
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      setLogs([]);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleLogFilterApply = () => {
    if (logPage === 1) {
      fetchLogs(1);
    } else {
      setLogPage(1);
    }
  };

  const getLogStatusClass = (statusCode) => {
    if (statusCode >= 500) {
      return 'admin-dashboard__log-status admin-dashboard__log-status--error';
    }
    if (statusCode >= 400) {
      return 'admin-dashboard__log-status admin-dashboard__log-status--warn';
    }
    return 'admin-dashboard__log-status admin-dashboard__log-status--ok';
  };

  const handleRoleChange = async (userId, role) => {
    setActiveUserAction(`role-${userId}`);
    try {
      if (!isMockMode && !useMockUsers) {
        const response = await fetch(`${API_BASE_URL}/auth/admin/users/${userId}/role`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authContext?.token}`
          },
          body: JSON.stringify({ role })
        });
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to update role');
        }
      }

      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    } catch (error) {
      console.error('Error updating role:', error);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      setUseMockUsers(true);
    } finally {
      setActiveUserAction(null);
    }
  };

  const handleStatusToggle = async (userId, isActive) => {
    setActiveUserAction(`status-${userId}`);
    try {
      if (!isMockMode && !useMockUsers) {
        const response = await fetch(`${API_BASE_URL}/auth/admin/users/${userId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authContext?.token}`
          },
          body: JSON.stringify({ is_active: !isActive })
        });
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to update status');
        }
      }

      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: !isActive } : u)));
    } catch (error) {
      console.error('Error updating status:', error);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: !isActive } : u)));
      setUseMockUsers(true);
    } finally {
      setActiveUserAction(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    const confirmed = window.confirm('Are you sure you want to delete this user?');
    if (!confirmed) {
      return;
    }
    setActiveUserAction(`delete-${userId}`);

    try {
      if (!isMockMode && !useMockUsers) {
        const response = await fetch(`${API_BASE_URL}/auth/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authContext?.token}`
          }
        });
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to delete user');
        }
      }

      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setUseMockUsers(true);
    } finally {
      setActiveUserAction(null);
    }
  };

  const totalStudents = isLoadingStudents ? "..." : students.length;
  const totalUsers = isLoadingUsers ? "..." : users.length;
  const activeUsers = isLoadingUsers
    ? "..."
    : users.filter((u) => u.is_active).length;
  const stats = [
    {
      label: "Total Students",
      value: totalStudents,
      note: showStudents ? "Loaded" : "Tap View Students"
    },
    {
      label: "Total Users",
      value: totalUsers,
      note: showUsers ? "Loaded" : "Tap Manage Users"
    },
    {
      label: "Active Users",
      value: activeUsers,
      note: "Includes faculty & students"
    }
  ];

  const filteredUsers = users.filter((u) => {
    const matchesSearch = userSearch
      ? `${u.name} ${u.email} ${u.department || ''}`.toLowerCase().includes(userSearch.toLowerCase())
      : true;
    const matchesRole = userRoleFilter === 'all' ? true : u.role === userRoleFilter;
    const matchesStatus = userStatusFilter === 'all'
      ? true
      : userStatusFilter === 'active'
        ? u.is_active
        : !u.is_active;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <motion.div
      className="dashboard"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="dashboard__objects" aria-hidden="true">
        <span className="dashboard__object dashboard__object--sphere" />
        <span className="dashboard__object dashboard__object--torus" />
        <span className="dashboard__object dashboard__object--diamond" />
      </div>
      <motion.header
        className="dashboard__header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <h1 className="dashboard__title">Admin Dashboard</h1>
          <p className="dashboard__subtitle">
            Welcome, {user?.name}! Oversee platform access, departments, and system-level reporting.
          </p>
        </div>
      </motion.header>

      <main className="admin-dashboard" aria-label="Admin overview">
        <motion.section
          className="admin-dashboard__stats"
          aria-label="Admin highlights"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="admin-dashboard__stat"
              variants={fadeInUp}
              whileHover={{ y: -6, scale: 1.03, transition: { type: 'spring', stiffness: 300, damping: 24 } }}
            >
              <p className="admin-dashboard__stat-label">{stat.label}</p>
              <div className="admin-dashboard__stat-value">{stat.value}</div>
              <span className="admin-dashboard__stat-note">{stat.note}</span>
            </motion.div>
          ))}
        </motion.section>

        <section className="admin-dashboard__actions" aria-label="Admin quick actions">
          <button type="button" className="admin-dashboard__action" onClick={() => navigate('/admin/students')}>
            View Students
          </button>
          <button type="button" className="admin-dashboard__action" onClick={() => navigate('/admin/users')}>
            Manage Users
          </button>
          <button type="button" className="admin-dashboard__action" onClick={() => navigate('/admin/approvals')}>
            Approve Users
          </button>
          <button type="button" className="admin-dashboard__action" onClick={() => navigate('/admin/activity-logs')}>
            Activity Logs
          </button>
          <button type="button" className="admin-dashboard__action" onClick={() => navigate('/admin/departments')}>
            Departments
          </button>
          <button type="button" className="admin-dashboard__action" onClick={() => navigate('/admin/reports')}>
            Reports
          </button>
          <button type="button" className="admin-dashboard__action" onClick={() => navigate('/admin/teachers')}>
            Manage Teachers
          </button>
        </section>

        <motion.section
          className="admin-dashboard__cards"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.article
            className="dashboard__card dashboard__card--clickable admin-dashboard__card"
            onClick={() => navigate('/admin/students')}
            variants={fadeInUp}
            whileHover={{ y: -8, scale: 1.02, boxShadow: '0 20px 50px rgba(49,156,181,0.22)', transition: { type: 'spring', stiffness: 280, damping: 22 } }}
            whileTap={{ scale: 0.97 }}
          >
            <h2 className="dashboard__card-title">Student Directory</h2>
            <p className="dashboard__card-text">
              Review every registered student and manage their access status.
            </p>
            <span className="dashboard__card-action">View students</span>
          </motion.article>

          <motion.article
            className="dashboard__card dashboard__card--clickable admin-dashboard__card"
            onClick={() => navigate('/admin/users')}
            variants={fadeInUp}
            whileHover={{ y: -8, scale: 1.02, boxShadow: '0 20px 50px rgba(49,156,181,0.22)', transition: { type: 'spring', stiffness: 280, damping: 22 } }}
            whileTap={{ scale: 0.97 }}
          >
            <h2 className="dashboard__card-title">User Access</h2>
            <p className="dashboard__card-text">
              Control roles, permissions, and account status in one place.
            </p>
            <span className="dashboard__card-action">Manage users</span>
          </motion.article>

          <motion.article
            className="dashboard__card dashboard__card--clickable admin-dashboard__card"
            onClick={() => {
              navigate('/admin/approvals');
            }}
            variants={fadeInUp}
            whileHover={{ y: -8, scale: 1.02, boxShadow: '0 20px 50px rgba(49,156,181,0.22)', transition: { type: 'spring', stiffness: 280, damping: 22 } }}
            whileTap={{ scale: 0.97 }}
          >
            <h2 className="dashboard__card-title">User Approvals</h2>
            <p className="dashboard__card-text">
              Pre-approve users before they register. Verify email, phone, and role.
            </p>
            <span className="dashboard__card-action">Manage approvals</span>
          </motion.article>

          <motion.article
            className="dashboard__card dashboard__card--clickable admin-dashboard__card"
            onClick={() => navigate('/admin/departments')}
            variants={fadeInUp}
            whileHover={{ y: -8, scale: 1.02, boxShadow: '0 20px 50px rgba(49,156,181,0.22)', transition: { type: 'spring', stiffness: 280, damping: 22 } }}
            whileTap={{ scale: 0.97 }}
          >
            <h2 className="dashboard__card-title">Departments & Courses</h2>
            <p className="dashboard__card-text">
              Configure departments, courses, and timetable assignments.
            </p>
            <span className="dashboard__card-action">View departments</span>
          </motion.article>

          <motion.article
            className="dashboard__card dashboard__card--clickable admin-dashboard__card"
            onClick={() => navigate('/admin/reports')}
            variants={fadeInUp}
            whileHover={{ y: -8, scale: 1.02, boxShadow: '0 20px 50px rgba(49,156,181,0.22)', transition: { type: 'spring', stiffness: 280, damping: 22 } }}
            whileTap={{ scale: 0.97 }}
          >
            <h2 className="dashboard__card-title">System Reports</h2>
            <p className="dashboard__card-text">
              Track attendance trends, health metrics, and audit logs.
            </p>
            <span className="dashboard__card-action">View reports</span>
          </motion.article>

          <motion.article
            className="dashboard__card dashboard__card--clickable admin-dashboard__card"
            onClick={() => navigate('/admin/activity-logs')}
            variants={fadeInUp}
            whileHover={{ y: -8, scale: 1.02, boxShadow: '0 20px 50px rgba(49,156,181,0.22)', transition: { type: 'spring', stiffness: 280, damping: 22 } }}
            whileTap={{ scale: 0.97 }}
          >
            <h2 className="dashboard__card-title">Activity Logs</h2>
            <p className="dashboard__card-text">
              Monitor authentication, attendance, and admin actions in real time.
            </p>
            <span className="dashboard__card-action">View activity</span>
          </motion.article>

          <motion.article
            className="dashboard__card dashboard__card--clickable admin-dashboard__card"
            onClick={() => navigate('/admin/teachers')}
            variants={fadeInUp}
            whileHover={{ y: -8, scale: 1.02, boxShadow: '0 20px 50px rgba(111,120,255,0.25)', transition: { type: 'spring', stiffness: 280, damping: 22 } }}
            whileTap={{ scale: 0.97 }}
          >
            <h2 className="dashboard__card-title">👨‍🏫 Teacher Management</h2>
            <p className="dashboard__card-text">
              Create Teacher IDs, activate or deactivate accounts. Only pre-registered teachers can sign up and log in.
            </p>
            <span className="dashboard__card-action">Manage teachers</span>
          </motion.article>
        </motion.section>

        {showStudents && (
          <section className="admin-dashboard__students" aria-label="Student list">
            <div className="admin-dashboard__students-head">
              <div>
                <p className="admin-dashboard__students-eyebrow">Student Directory</p>
                <h3 className="admin-dashboard__students-title">
                  Student List ({isLoadingStudents ? "Loading..." : students.length})
                </h3>
              </div>
              <button
                type="button"
                className="admin-dashboard__students-close"
                onClick={() => setShowStudents(false)}
              >
                Close
              </button>
            </div>

            {isLoadingStudents ? (
              <p className="admin-dashboard__students-state">Loading student data...</p>
            ) : students.length > 0 ? (
              <div className="admin-dashboard__table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Roll Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td>#{student.id}</td>
                        <td>{student.name}</td>
                        <td className="admin-dashboard__table-email">{student.email}</td>
                        <td className="admin-dashboard__table-id">{student.student_id || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="admin-dashboard__students-state">No students found.</p>
            )}
          </section>
        )}

        {showUsers && (
          <section className="admin-dashboard__users" aria-label="User management">
            <div className="admin-dashboard__users-head">
              <div>
                <p className="admin-dashboard__users-eyebrow">User Access</p>
                <h3 className="admin-dashboard__users-title">
                  Manage Users ({isLoadingUsers ? "Loading..." : filteredUsers.length})
                </h3>
                {useMockUsers && (
                  <span className="admin-dashboard__users-note">Mock mode enabled for phone testing.</span>
                )}
              </div>
              <button
                type="button"
                className="admin-dashboard__users-refresh"
                onClick={fetchUsers}
                disabled={isLoadingUsers}
              >
                Refresh
              </button>
            </div>

            <div className="admin-dashboard__filters">
              <input
                type="text"
                placeholder="Search by name, email, department"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                className="admin-dashboard__search"
              />
              <select
                className="admin-dashboard__select"
                value={userRoleFilter}
                onChange={(event) => setUserRoleFilter(event.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </select>
              <select
                className="admin-dashboard__select"
                value={userStatusFilter}
                onChange={(event) => setUserStatusFilter(event.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                type="button"
                className="admin-dashboard__filter-btn"
                onClick={fetchUsers}
              >
                Apply
              </button>
            </div>

            {isLoadingUsers ? (
              <p className="admin-dashboard__users-state">Loading users...</p>
            ) : filteredUsers.length > 0 ? (
              <div className="admin-dashboard__table admin-dashboard__table--users">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td>#{u.id}</td>
                        <td>{u.name}</td>
                        <td className="admin-dashboard__table-email">{u.email}</td>
                        <td>{u.department || "-"}</td>
                        <td>
                          <select
                            className="admin-dashboard__select admin-dashboard__select--inline"
                            value={u.role}
                            onChange={(event) => handleRoleChange(u.id, event.target.value)}
                            disabled={activeUserAction === `role-${u.id}`}
                          >
                            <option value="student">Student</option>
                            <option value="faculty">Faculty</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`admin-dashboard__status ${u.is_active ? "admin-dashboard__status--active" : "admin-dashboard__status--inactive"}`}
                            onClick={() => handleStatusToggle(u.id, u.is_active)}
                            disabled={activeUserAction === `status-${u.id}`}
                          >
                            {u.is_active ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="admin-dashboard__delete"
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={activeUserAction === `delete-${u.id}`}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="admin-dashboard__users-state">No users found.</p>
            )}
          </section>
        )}

        {showLogs && (
          <section className="admin-dashboard__logs" aria-label="Activity logs">
            <div className="admin-dashboard__logs-head">
              <div>
                <p className="admin-dashboard__logs-eyebrow">System Audit</p>
                <h3 className="admin-dashboard__logs-title">
                  Activity Logs ({isLoadingLogs ? "Loading..." : logPagination.total})
                </h3>
              </div>
              <button
                type="button"
                className="admin-dashboard__logs-refresh"
                onClick={fetchLogs}
                disabled={isLoadingLogs}
              >
                Refresh
              </button>
            </div>

            <div className="admin-dashboard__filters">
              <input
                type="text"
                placeholder="Search by user, action, or path"
                value={logSearch}
                onChange={(event) => setLogSearch(event.target.value)}
                className="admin-dashboard__search"
              />
              <select
                className="admin-dashboard__select"
                value={logRoleFilter}
                onChange={(event) => setLogRoleFilter(event.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </select>
              <select
                className="admin-dashboard__select"
                value={logActionFilter}
                onChange={(event) => setLogActionFilter(event.target.value)}
              >
                <option value="all">All Actions</option>
                <option value="AUTH_LOGIN">AUTH_LOGIN</option>
                <option value="AUTH_LOGOUT">AUTH_LOGOUT</option>
                <option value="ATTENDANCE_MARK">ATTENDANCE_MARK</option>
                <option value="SESSION_CREATE">SESSION_CREATE</option>
                <option value="SESSION_CLOSE">SESSION_CLOSE</option>
                <option value="ADMIN_USER_ROLE_UPDATE">ADMIN_USER_ROLE_UPDATE</option>
                <option value="ADMIN_USER_STATUS_UPDATE">ADMIN_USER_STATUS_UPDATE</option>
                <option value="ADMIN_USER_DELETE">ADMIN_USER_DELETE</option>
              </select>
              <select
                className="admin-dashboard__select"
                value={logStatusFilter}
                onChange={(event) => setLogStatusFilter(event.target.value)}
              >
                <option value="all">All Status</option>
                <option value="200">200 OK</option>
                <option value="201">201 Created</option>
                <option value="400">400 Bad Request</option>
                <option value="401">401 Unauthorized</option>
                <option value="403">403 Forbidden</option>
                <option value="404">404 Not Found</option>
                <option value="500">500 Error</option>
              </select>
              <input
                type="date"
                value={logStartDate}
                onChange={(event) => setLogStartDate(event.target.value)}
                className="admin-dashboard__search"
              />
              <input
                type="date"
                value={logEndDate}
                onChange={(event) => setLogEndDate(event.target.value)}
                className="admin-dashboard__search"
              />
              <button
                type="button"
                className="admin-dashboard__filter-btn"
                onClick={handleLogFilterApply}
              >
                Apply
              </button>
            </div>

            {isLoadingLogs ? (
              <p className="admin-dashboard__users-state">Loading logs...</p>
            ) : logs.length > 0 ? (
              <div className="admin-dashboard__table admin-dashboard__table--logs">
                <table>
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
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td className="admin-dashboard__log-time">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td>
                          <div className="admin-dashboard__log-user">
                            <span>{log.user_name || 'System'}</span>
                            <span className="admin-dashboard__log-meta">{log.user_email || 'anonymous'}</span>
                          </div>
                        </td>
                        <td>{log.user_role || '-'}</td>
                        <td>{log.action}</td>
                        <td>
                          <span className={getLogStatusClass(log.status_code)}>{log.status_code}</span>
                        </td>
                        <td className="admin-dashboard__log-path">{log.path}</td>
                        <td className="admin-dashboard__log-meta">{log.ip_address || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="admin-dashboard__users-state">No activity logs found.</p>
            )}

            <div className="admin-dashboard__pagination">
              <button
                type="button"
                className="admin-dashboard__pagination-btn"
                onClick={() => setLogPage((prev) => Math.max(prev - 1, 1))}
                disabled={logPagination.page <= 1}
              >
                Previous
              </button>
              <span className="admin-dashboard__pagination-info">
                Page {logPagination.page} of {logPagination.pages}
              </span>
              <button
                type="button"
                className="admin-dashboard__pagination-btn"
                onClick={() => setLogPage((prev) => Math.min(prev + 1, logPagination.pages))}
                disabled={logPagination.page >= logPagination.pages}
              >
                Next
              </button>
            </div>
          </section>
        )}
      </main>
    </motion.div>
  );
}

export default AdminDashboard;
