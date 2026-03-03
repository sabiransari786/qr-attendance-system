import { useContext, useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, UserCheck, Shield, Building2, BarChart3, ClipboardList,
  GraduationCap, Activity, UserPlus,
  ChevronRight, LayoutDashboard
} from 'lucide-react';
import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "../utils/constants";
import { fadeInUp, staggerContainer } from "../animations/animationConfig";
import "../styles/dashboard.css";
import "../styles/admin-pages.css";
import "../styles/admin-dashboard-premium.css";

/* ═══════════════════════════════════════════════════════════════════════════
   Navigation Cards Configuration
   ═══════════════════════════════════════════════════════════════════════════ */
const NAV_CARDS = [
  {
    title: "Student Directory",
    desc: "Review every registered student, manage access and promote semesters",
    Icon: GraduationCap,
    color: "#319cb5",
    path: "/admin/students",
  },
  {
    title: "User Access",
    desc: "Control roles, permissions, and account status across the platform",
    Icon: Shield,
    color: "#8b5cf6",
    path: "/admin/users",
  },
  {
    title: "User Approvals",
    desc: "Pre-approve users before registration — verify email, phone & role",
    Icon: UserPlus,
    color: "#10b981",
    path: "/admin/approvals",
  },
  {
    title: "Departments & Courses",
    desc: "Configure departments, courses, faculty and timetable assignments",
    Icon: Building2,
    color: "#f59e0b",
    path: "/admin/departments",
  },
  {
    title: "System Reports",
    desc: "Track attendance trends, health metrics and audit logs",
    Icon: BarChart3,
    color: "#ec4899",
    path: "/admin/reports",
  },
  {
    title: "Activity Logs",
    desc: "Monitor authentication, attendance and admin actions in real time",
    Icon: ClipboardList,
    color: "#6366f1",
    path: "/admin/activity-logs",
  },
  {
    title: "Teacher Management",
    desc: "Create teacher IDs, activate/deactivate accounts and manage faculty",
    Icon: UserCheck,
    color: "#0ea5e9",
    path: "/admin/teachers",
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   AdminDashboard Component
   ═══════════════════════════════════════════════════════════════════════════ */
function AdminDashboard() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  const isMockMode = import.meta.env.VITE_USE_MOCK_API === "true";

  /* ── Auto-fetch overview data on mount ──────────────────────────────── */
  useEffect(() => {
    fetchStudents();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/students`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authContext?.token}`,
        },
      });
      const data = await response.json();
      if (data.success && data.data) setStudents(data.data);
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([
        { id: 2, name: "Student", email: "student@demo.com", student_id: "STU-0001", is_active: true },
        { id: 7, name: "Rahul Singh", email: "rahul@demo.com", student_id: "STU-0002", is_active: true },
        { id: 8, name: "Priya Verma", email: "priya@demo.com", student_id: "STU-0003", is_active: true },
        { id: 9, name: "Amit Patel", email: "amit@demo.com", student_id: "STU-0004", is_active: true },
        { id: 10, name: "Neha Gupta", email: "neha@demo.com", student_id: "STU-0005", is_active: true },
      ]);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const getMockUsers = () => [
    { id: 1, name: "Admin User", email: "admin@attendance.com", role: "admin", is_active: true, department: "Administration" },
    { id: 2, name: "Student One", email: "student@attendance.com", role: "student", is_active: true, department: "Computer Science" },
    { id: 3, name: "Faculty User", email: "faculty@attendance.com", role: "faculty", is_active: true, department: "Electrical" },
    { id: 4, name: "Riya Sharma", email: "riya@demo.com", role: "student", is_active: false, department: "Mechanical" },
    { id: 5, name: "Arjun Verma", email: "arjun@demo.com", role: "student", is_active: true, department: "Civil" },
  ];

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    if (isMockMode) {
      setUsers(getMockUsers());
      setIsLoadingUsers(false);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/auth/admin/users`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authContext?.token}`,
        },
      });
      const data = await response.json();
      if (data.success && data.data) setUsers(data.data);
      else setUsers([]);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers(getMockUsers());
    } finally {
      setIsLoadingUsers(false);
    }
  };

  /* ── Derived Stats ─────────────────────────────────────────────────────── */
  const stats = useMemo(
    () => [
      {
        label: "Total Students",
        value: isLoadingStudents ? "…" : students.length,
        Icon: GraduationCap,
        color: "#319cb5",
        sub: "Registered",
      },
      {
        label: "Total Users",
        value: isLoadingUsers ? "…" : users.length,
        Icon: Users,
        color: "#8b5cf6",
        sub: "All roles",
      },
      {
        label: "Active Users",
        value: isLoadingUsers ? "…" : users.filter((u) => u.is_active).length,
        Icon: Activity,
        color: "#10b981",
        sub: "Online",
      },
      {
        label: "Faculty",
        value: isLoadingUsers ? "…" : users.filter((u) => u.role === "faculty").length,
        Icon: UserCheck,
        color: "#f59e0b",
        sub: "Teaching",
      },
    ],
    [students, users, isLoadingStudents, isLoadingUsers]
  );

  const firstName = user?.name?.split(" ")[0] || "Admin";

  /* ══════════════════════════════ RENDER ════════════════════════════════ */
  return (
    <motion.div
      className="dashboard ap"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Floating background orbs */}
      <div className="ap__objects" aria-hidden="true">
        <span className="ap__object ap__object--a" />
        <span className="ap__object ap__object--b" />
        <span className="ap__object ap__object--c" />
      </div>

      <div className="ap__inner">
        {/* ── Welcome Header ─────────────────────────────────────────── */}
        <motion.div className="adp__welcome" variants={fadeInUp}>
          <p className="adp__welcome-eyebrow">
            <LayoutDashboard
              size={14}
              style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }}
            />
            Admin Panel
          </p>
          <h1 className="adp__welcome-title">Welcome back, {firstName}</h1>
          <p className="adp__welcome-sub">
            Oversee platform access, departments, and system-level reporting from
            your central command center.
          </p>
        </motion.div>

        {/* ── Stat Cards ─────────────────────────────────────────────── */}
        <motion.div className="ap__stats adp__stats-grid" variants={staggerContainer}>
          {stats.map((s, i) => (
            <motion.div
              className="ap__stat adp__stat"
              key={i}
              variants={fadeInUp}
              whileHover={{
                y: -5,
                transition: { type: "spring", stiffness: 300, damping: 24 },
              }}
            >
              <div
                className="adp__stat-icon"
                style={{
                  "--icon-bg": `${s.color}1a`,
                  "--icon-color": s.color,
                }}
              >
                <s.Icon size={22} />
              </div>
              <p className="ap__stat-label">{s.label}</p>
              <p className="ap__stat-value">{s.value}</p>
              <p className="ap__stat-sub">{s.sub}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Section Heading ────────────────────────────────────────── */}
        <motion.div className="adp__section-header" variants={fadeInUp}>
          <h2 className="adp__section-title">Quick Navigation</h2>
          <div className="adp__section-line" />
        </motion.div>

        {/* ── Navigation Cards ───────────────────────────────────────── */}
        <motion.div className="adp__nav-grid" variants={staggerContainer}>
          {NAV_CARDS.map((card) => (
            <motion.div
              key={card.path}
              className="adp__nav-card"
              style={{
                "--card-accent": card.color,
                "--icon-bg": `${card.color}1a`,
                "--icon-color": card.color,
              }}
              variants={fadeInUp}
              onClick={() => navigate(card.path)}
              whileHover={{
                y: -6,
                transition: { type: "spring", stiffness: 300, damping: 24 },
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="adp__nav-icon">
                <card.Icon size={24} />
              </div>
              <div className="adp__nav-body">
                <h3 className="adp__nav-title">{card.title}</h3>
                <p className="adp__nav-desc">{card.desc}</p>
                <span className="adp__nav-arrow">
                  Open <ChevronRight size={14} />
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>


      </div>
    </motion.div>
  );
}

export default AdminDashboard;
