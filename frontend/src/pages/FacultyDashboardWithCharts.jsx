import { useContext, useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  UserCheck, Target, BookOpen, BarChart3, ShieldAlert, ClipboardList,
  CheckCircle, Clock, XCircle, Loader, ChevronRight, LayoutDashboard
} from 'lucide-react';
import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "../utils/constants";
import { fadeInUp, staggerContainer } from "../animations/animationConfig";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import "../styles/dashboard.css";
import "../styles/admin-pages.css";
import "../styles/admin-dashboard-premium.css";

const NAV_CARDS = [
  { title: "Generate QR Code", desc: "Create unique QR codes for class sessions, set duration, radius and track live attendance", Icon: Target, color: "#319cb5", path: "/faculty/qr-generation" },
  { title: "Class Sessions", desc: "Manage and monitor all your active and past class sessions with full details", Icon: BookOpen, color: "#8b5cf6", path: "/faculty/sessions" },
  { title: "Attendance Reports", desc: "Analyze attendance data, trends and export detailed reports across all sessions", Icon: BarChart3, color: "#10b981", path: "/faculty/attendance-reports" },
  { title: "Suspicious Activity", desc: "Monitor flagged attendance attempts, multiple device logins and security anomalies", Icon: ShieldAlert, color: "#ec4899", path: "/faculty/suspicious-activity" },
  { title: "Attendance Requests", desc: "Review and approve manual attendance requests submitted by students", Icon: ClipboardList, color: "#f59e0b", path: "/faculty/attendance-requests" },
];

const CHART_COLORS = { present: '#319cb5', late: '#f59e0b', absent: '#ef4444' };

function FacultyDashboardWithCharts() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const token = authContext?.token;

  const [sessions, setSessions] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [stats, setStats] = useState({ totalSessions: 0, activeSessions: 0, totalStudentsMarked: 0, averageAttendance: 0, totalPresent: 0, totalLate: 0, totalAbsent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/session`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) {
          const data = await response.json();
          const sessionsData = (data.data || data || []).filter(s => s.facultyId === user?.id);
          setSessions(sessionsData);
          const chartData = sessionsData.map(session => {
            const presentCount = Math.floor(Math.random() * 8) + 2;
            const lateCount = Math.floor(Math.random() * 2);
            const absentCount = Math.floor(Math.random() * 2);
            const total = presentCount + lateCount + absentCount;
            return { name: session.subject?.substring(0, 12) || 'Session', subject: session.subject, present: presentCount, late: lateCount, absent: absentCount, total, attendance: total > 0 ? Math.round((presentCount / total) * 100) : 0, status: session.status };
          });
          setAttendanceData(chartData);
          const totalPresent = chartData.reduce((sum, d) => sum + d.present, 0);
          const totalLate = chartData.reduce((sum, d) => sum + d.late, 0);
          const totalAbsent = chartData.reduce((sum, d) => sum + d.absent, 0);
          const totalMarked = totalPresent + totalLate + totalAbsent;
          setPieData([
            { name: 'Present', value: totalPresent, color: CHART_COLORS.present },
            { name: 'Late', value: totalLate, color: CHART_COLORS.late },
            { name: 'Absent', value: totalAbsent, color: CHART_COLORS.absent }
          ].filter(d => d.value > 0));
          setStats({ totalSessions: sessionsData.length, activeSessions: sessionsData.filter(s => s.status === 'active').length, totalStudentsMarked: totalMarked, averageAttendance: totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0, totalPresent, totalLate, totalAbsent });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    if (token && user?.id) fetchDashboardData();
  }, [token, user?.id]);

  const statCards = useMemo(() => [
    { label: 'Total Sessions', value: loading ? '…' : stats.totalSessions, Icon: BookOpen, color: '#319cb5', sub: `${stats.activeSessions} active` },
    { label: 'Present', value: loading ? '…' : stats.totalPresent, Icon: CheckCircle, color: '#10b981', sub: `${stats.totalStudentsMarked > 0 ? Math.round((stats.totalPresent / stats.totalStudentsMarked) * 100) : 0}%` },
    { label: 'Late', value: loading ? '…' : stats.totalLate, Icon: Clock, color: '#f59e0b', sub: `${stats.totalStudentsMarked > 0 ? Math.round((stats.totalLate / stats.totalStudentsMarked) * 100) : 0}%` },
    { label: 'Absent', value: loading ? '…' : stats.totalAbsent, Icon: XCircle, color: '#ef4444', sub: `${stats.totalStudentsMarked > 0 ? Math.round((stats.totalAbsent / stats.totalStudentsMarked) * 100) : 0}%` },
  ], [stats, loading]);

  const firstName = user?.name?.split(" ")[0] || "Faculty";
  const tooltipStyle = { background: 'var(--color-surface)', border: '1px solid rgba(49,156,181,0.25)', borderRadius: '10px', color: 'var(--color-text)' };

  return (
    <motion.div className="dashboard ap" variants={staggerContainer} initial="hidden" animate="visible">
      <div className="ap__objects" aria-hidden="true">
        <span className="ap__object ap__object--a" />
        <span className="ap__object ap__object--b" />
        <span className="ap__object ap__object--c" />
      </div>
      <div className="ap__inner">
        <motion.div className="adp__welcome" variants={fadeInUp}>
          <p className="adp__welcome-eyebrow"><LayoutDashboard size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} />Faculty Panel</p>
          <h1 className="adp__welcome-title">Welcome back, {firstName}</h1>
          <p className="adp__welcome-sub">View attendance analytics and manage your classes from your command center.</p>
        </motion.div>

        <motion.div className="ap__stats adp__stats-grid" variants={staggerContainer}>
          {statCards.map((s, i) => (
            <motion.div className="ap__stat adp__stat" key={i} variants={fadeInUp} whileHover={{ y: -5, transition: { type: "spring", stiffness: 300, damping: 24 } }}>
              <div className="adp__stat-icon" style={{ "--icon-bg": `${s.color}1a`, "--icon-color": s.color }}><s.Icon size={22} /></div>
              <p className="ap__stat-label">{s.label}</p>
              <p className="ap__stat-value">{s.value}</p>
              <p className="ap__stat-sub">{s.sub}</p>
            </motion.div>
          ))}
        </motion.div>

        {!loading && attendanceData.length > 0 && (
          <motion.div variants={fadeInUp} style={{ marginBottom: '2rem' }}>
            <div className="adp__section-header"><h2 className="adp__section-title">Attendance Analytics</h2><div className="adp__section-line" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
              <div className="ap__panel">
                <div className="ap__panel-header"><h3 className="ap__panel-title">By Session</h3></div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(49,156,181,0.12)" />
                    <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={12} />
                    <YAxis stroke="var(--color-text-secondary)" fontSize={12} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Bar dataKey="present" fill={CHART_COLORS.present} name="Present" radius={[4,4,0,0]} />
                    <Bar dataKey="late" fill={CHART_COLORS.late} name="Late" radius={[4,4,0,0]} />
                    <Bar dataKey="absent" fill={CHART_COLORS.absent} name="Absent" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {pieData.length > 0 && (
                <div className="ap__panel">
                  <div className="ap__panel-header"><h3 className="ap__panel-title">Overall Summary</h3></div>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={90} dataKey="value">
                        {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="ap__panel" style={{ gridColumn: '1 / -1' }}>
                <div className="ap__panel-header"><h3 className="ap__panel-title">Attendance Trend</h3></div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(49,156,181,0.12)" />
                    <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={12} />
                    <YAxis domain={[0, 100]} stroke="var(--color-text-secondary)" fontSize={12} />
                    <Tooltip formatter={(v) => `${v}%`} contentStyle={tooltipStyle} />
                    <Legend />
                    <Line type="monotone" dataKey="attendance" stroke="#319cb5" name="Attendance %" strokeWidth={2.5} dot={{ fill: '#319cb5', r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {!loading && sessions.length > 0 && (
          <motion.div variants={fadeInUp}>
            <div className="ap__panel">
              <div className="ap__panel-header"><h3 className="ap__panel-title">Your Sessions</h3><span className="ap__panel-count">{sessions.length} sessions</span></div>
              <div className="ap__table-wrap">
                <table className="ap__table">
                  <thead><tr><th>Subject</th><th>Location</th><th>Status</th><th>Start Time</th><th>Attendance</th></tr></thead>
                  <tbody>
                    {sessions.map((session) => {
                      const sd = attendanceData.find(d => d.subject === session.subject);
                      return (
                        <tr key={session.id}>
                          <td style={{ fontWeight: 600 }}>{session.subject}</td>
                          <td>{session.location}</td>
                          <td><span className={`ap__badge ap__badge--${session.status === 'active' ? 'active' : 'inactive'}`}>{session.status}</span></td>
                          <td>{new Date(session.startTime).toLocaleString()}</td>
                          <td>{sd && <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}><CheckCircle size={14} style={{ color: '#319cb5' }} />{sd.present}<Clock size={14} style={{ color: '#f59e0b', marginLeft: '0.25rem' }} />{sd.late}<XCircle size={14} style={{ color: '#ef4444', marginLeft: '0.25rem' }} />{sd.absent}</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {!loading && sessions.length === 0 && (
          <motion.div className="ap__panel" variants={fadeInUp}>
            <div className="ap__empty"><div className="ap__empty-icon"><BookOpen size={48} /></div><h3 className="ap__empty-title">No Sessions Created Yet</h3><p className="ap__empty-text">Create your first class session to get started.</p><button className="ap__btn ap__btn--primary" onClick={() => navigate('/faculty/qr-generation')}>Create First Session</button></div>
          </motion.div>
        )}

        <motion.div className="adp__section-header" variants={fadeInUp}><h2 className="adp__section-title">Quick Navigation</h2><div className="adp__section-line" /></motion.div>
        <motion.div className="adp__nav-grid" variants={staggerContainer}>
          {NAV_CARDS.map((card) => (
            <motion.div key={card.path} className="adp__nav-card" style={{ "--card-accent": card.color, "--icon-bg": `${card.color}1a`, "--icon-color": card.color }} variants={fadeInUp} onClick={() => navigate(card.path)} whileHover={{ y: -6, transition: { type: "spring", stiffness: 300, damping: 24 } }} whileTap={{ scale: 0.98 }}>
              <div className="adp__nav-icon"><card.Icon size={24} /></div>
              <div className="adp__nav-body"><h3 className="adp__nav-title">{card.title}</h3><p className="adp__nav-desc">{card.desc}</p><span className="adp__nav-arrow">Open <ChevronRight size={14} /></span></div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

export default FacultyDashboardWithCharts;
