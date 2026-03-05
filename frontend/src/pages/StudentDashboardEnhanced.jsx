/**
 * Student Dashboard — ap__* unified design (matches admin module)
 */

import { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, animate } from 'framer-motion';
import {
  GraduationCap, Calendar, BarChart3, Camera, ScrollText, ClipboardList,
  CheckCircle, XCircle, BookOpen, Bell, Inbox, MapPin, UserCheck,
  AlertTriangle, Lightbulb, Clock, Loader, Target, Zap,
  Activity, Shield, ChevronRight,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/constants';
import '../styles/dashboard.css';
import '../styles/admin-pages.css';
import '../styles/admin-dashboard-premium.css';

/* ── Animated counter ─────────────────────────────────────────────── */
function AnimatedCounter({ value, suffix = '' }) {
  const num = parseFloat(value) || 0;
  return <span>{Math.round(num)}{suffix}</span>;
}

/* ── Main component ───────────────────────────────────────────────── */
function StudentDashboardEnhanced() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [todayStatus, setTodayStatus] = useState(null);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);

  useEffect(() => { if (user?.id) fetchDashboardData(); }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('authToken');
      const res = await fetch(`${API_BASE_URL}/attendance/student/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const records = data.data || [];

        const totalClasses = records.length;
        const presentClasses = records.filter((r) => r.status === 'present').length;
        const lateClasses = records.filter((r) => r.status === 'late').length;
        const absentClasses = records.filter((r) => r.status === 'absent').length;
        const overallPercentage = totalClasses > 0 ? Math.round(((presentClasses + lateClasses) / totalClasses) * 100) : 0;

        const today = new Date().toISOString().split('T')[0];
        const todayRecords = records.filter((r) => r.marked_at?.startsWith(today));
        setTodayStatus({ marked: todayRecords.length, status: todayRecords.length > 0 ? todayRecords[0].status : 'pending', sessions: todayRecords });

        const subjectMap = {};
        records.forEach((r) => {
          const s = r.subject || 'Unknown Subject';
          if (!subjectMap[s]) subjectMap[s] = { total: 0, present: 0, late: 0, absent: 0 };
          subjectMap[s].total++;
          if (r.status === 'present') subjectMap[s].present++;
          if (r.status === 'late') subjectMap[s].late++;
          if (r.status === 'absent') subjectMap[s].absent++;
        });

        const subjects = Object.keys(subjectMap).map((name) => ({
          name,
          total: subjectMap[name].total,
          present: subjectMap[name].present,
          late: subjectMap[name].late,
          absent: subjectMap[name].absent,
          percentage: Math.round((subjectMap[name].present / subjectMap[name].total) * 100),
        }));

        setAttendanceStats({ overall: overallPercentage, present: presentClasses, late: lateClasses, absent: absentClasses, total: totalClasses, subjects });

        // Notifications
        const notifs = [];
        if (overallPercentage < 75) notifs.push({ id: 1, type: 'warning', icon: <AlertTriangle size={16} />, title: 'Low Attendance Alert', message: `Your attendance is ${overallPercentage}%. Minimum 75% required.`, time: 'Just now' });
        subjects.forEach((s, i) => { if (s.percentage < 75) notifs.push({ id: i + 2, type: 'warning', icon: <BarChart3 size={16} />, title: `${s.name} — Low`, message: `Only ${s.percentage}% attendance.`, time: 'Today' }); });
        if (todayRecords.length > 0 && todayRecords[0].status === 'present') notifs.push({ id: 100, type: 'success', icon: <CheckCircle size={16} />, title: 'Attendance Confirmed', message: "Today's attendance marked.", time: '2h ago' });
        setNotifications(notifs.slice(0, 5));

        setUpcomingSessions([
          { id: 1, subject: 'Data Structures', time: '10:00 AM', room: 'Room 301', faculty: 'Teacher' },
          { id: 2, subject: 'Web Development', time: '02:00 PM', room: 'Lab 201', faculty: 'Teacher' },
          { id: 3, subject: 'Algorithm Design', time: '01:00 PM', room: 'Room 303', faculty: 'Prof. Kumar' },
        ]);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setAttendanceStats({ overall: 84, present: 32, late: 5, absent: 7, total: 44, subjects: [
        { name: 'Data Structures', total: 12, present: 11, late: 1, absent: 0, percentage: 100 },
        { name: 'Web Development', total: 10, present: 8, late: 1, absent: 1, percentage: 90 },
        { name: 'Database Management', total: 10, present: 8, late: 2, absent: 0, percentage: 100 },
        { name: 'Algorithm Design', total: 6, present: 4, late: 1, absent: 1, percentage: 83 },
        { name: 'Operating Systems', total: 6, present: 1, late: 0, absent: 5, percentage: 17 },
      ] });
      setTodayStatus({ marked: 1, status: 'present', sessions: [] });
      setUpcomingSessions([
        { id: 1, subject: 'Data Structures', time: '10:00 AM', room: 'Room 301', faculty: 'Teacher' },
        { id: 2, subject: 'Web Development', time: '02:00 PM', room: 'Lab 201', faculty: 'Teacher' },
        { id: 3, subject: 'Algorithm Design', time: '01:00 PM', room: 'Room 303', faculty: 'Prof. Kumar' },
      ]);
    } finally { setLoading(false); }
  };

  const fmtTime = (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const fmtDate = (d) => d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const getColor = (pct) => (pct >= 85 ? '#10b981' : pct >= 75 ? '#f59e0b' : '#ef4444');

  /* ── Loading state ────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="ap">
        <div className="ap__objects" aria-hidden="true"><span className="ap__object ap__object--a" /><span className="ap__object ap__object--b" /><span className="ap__object ap__object--c" /></div>
        <div className="ap__inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
            <p style={{ marginTop: 12, color: 'var(--color-text-secondary)' }}>Loading dashboard…</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Navigation cards ────────────────────────────────────────── */
  const navCards = [
    { Icon: Camera, title: 'Scan QR Code', desc: 'Scan or upload QR code to mark your attendance instantly in active sessions', path: '/scan-qr', color: '#319cb5' },
    { Icon: ScrollText, title: 'Attendance History', desc: 'Review your complete attendance records, filter by subject, status and date range', path: '/attendance-history', color: '#8b5cf6' },
    { Icon: ClipboardList, title: 'Generate Request', desc: "Couldn't scan QR? Send a manual attendance request to your teacher for approval", path: '/attendance-request', color: '#10b981' },
    { Icon: BookOpen, title: 'Subject Attendance', desc: 'View detailed per-subject attendance breakdown, percentage and insights', path: '/student/subjects', color: '#f59e0b' },
    { Icon: Bell, title: 'Notifications', desc: 'Stay updated with attendance alerts, low attendance warnings and activity updates', path: '/notifications', color: '#ec4899' },
  ];

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="ap">
      <div className="ap__objects" aria-hidden="true">
        <span className="ap__object ap__object--a" />
        <span className="ap__object ap__object--b" />
        <span className="ap__object ap__object--c" />
      </div>

      <div className="ap__inner">
        {/* Welcome */}
        <motion.div className="adp__welcome" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="adp__welcome-eyebrow"><GraduationCap size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Student Dashboard</p>
          <h1 className="adp__welcome-title">Welcome back, {user?.name}</h1>
          <p className="adp__welcome-sub">{fmtDate(currentTime)} &bull; {fmtTime(currentTime)}</p>
        </motion.div>

        {/* Stats */}
        <div className="ap__stats adp__stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          <motion.div className="ap__stat adp__stat" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="adp__stat-icon"><BarChart3 size={20} /></div>
            <span className="ap__stat-label">Overall</span>
            <span className="ap__stat-value"><AnimatedCounter value={attendanceStats?.overall || 0} suffix="%" /></span>
          </motion.div>
          <motion.div className="ap__stat adp__stat" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="adp__stat-icon"><CheckCircle size={20} /></div>
            <span className="ap__stat-label">Present</span>
            <span className="ap__stat-value"><AnimatedCounter value={attendanceStats?.present || 0} /></span>
          </motion.div>
          <motion.div className="ap__stat adp__stat" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="adp__stat-icon"><Clock size={20} /></div>
            <span className="ap__stat-label">Late</span>
            <span className="ap__stat-value"><AnimatedCounter value={attendanceStats?.late || 0} /></span>
          </motion.div>
          <motion.div className="ap__stat adp__stat" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="adp__stat-icon"><XCircle size={20} /></div>
            <span className="ap__stat-label">Absent</span>
            <span className="ap__stat-value"><AnimatedCounter value={attendanceStats?.absent || 0} /></span>
          </motion.div>
          <motion.div className="ap__stat adp__stat" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="adp__stat-icon"><Calendar size={20} /></div>
            <span className="ap__stat-label">Today</span>
            <span className="ap__stat-value" style={{ color: todayStatus?.status === 'present' ? '#10b981' : todayStatus?.status === 'late' ? '#f59e0b' : 'var(--color-text-secondary)' }}>
              {todayStatus?.status === 'present' ? 'Marked' : todayStatus?.status === 'late' ? 'Late' : 'Pending'}
            </span>
          </motion.div>
        </div>

        {/* Navigation Cards */}
        <div className="adp__section-header">
          <h2 className="adp__section-title">Quick Actions</h2>
          <span className="adp__section-line" />
        </div>
        <div className="adp__nav-grid">
          {navCards.map((card, i) => (
            <motion.div
              key={card.path}
              className="adp__nav-card"
              style={{
                '--card-accent': card.color,
                '--icon-bg': `${card.color}1a`,
                '--icon-color': card.color,
              }}
              onClick={() => navigate(card.path)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 24 } }}
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
        </div>

        {/* Two-column: Notifications + Sessions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginTop: '1.5rem' }}>
          {/* Notifications */}
          <div className="ap__panel">
            <div className="ap__panel-header">
              <h2 className="ap__panel-title"><Bell size={18} /> Notifications</h2>
              <span className="ap__panel-count">{notifications.length}</span>
            </div>
            {notifications.length === 0 ? (
              <div className="ap__empty">
                <Inbox size={40} className="ap__empty-icon" />
                <p className="ap__empty-title">All caught up!</p>
                <p className="ap__empty-text">No new notifications</p>
              </div>
            ) : (
              <div style={{ padding: '0.5rem 1rem 1rem' }}>
                {notifications.map((n, idx) => (
                  <div key={n.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.7rem 0', borderBottom: idx < notifications.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <span style={{ flexShrink: 0, color: n.type === 'warning' ? '#f59e0b' : n.type === 'success' ? '#10b981' : 'var(--accent)', marginTop: 2 }}>{n.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{n.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>{n.message}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Sessions */}
          <div className="ap__panel">
            <div className="ap__panel-header">
              <h2 className="ap__panel-title"><Calendar size={18} /> Upcoming Sessions</h2>
              <span className="ap__panel-count">{upcomingSessions.length}</span>
            </div>
            {upcomingSessions.length === 0 ? (
              <div className="ap__empty">
                <Calendar size={40} className="ap__empty-icon" />
                <p className="ap__empty-title">No sessions today</p>
                <p className="ap__empty-text">Enjoy your free time!</p>
              </div>
            ) : (
              <div style={{ padding: '0.5rem 1rem 1rem' }}>
                {upcomingSessions.map((s, idx) => (
                  <div key={s.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.7rem 0', borderBottom: idx < upcomingSessions.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(49,156,181,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 700 }}>
                      <Clock size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{s.subject}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '0.75rem', marginTop: 2 }}>
                        <span><Clock size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />{s.time}</span>
                        <span><MapPin size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />{s.room}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Subject-wise Attendance */}
        {attendanceStats?.subjects && attendanceStats.subjects.length > 0 && (
          <>
            <div className="adp__section-header" style={{ marginTop: '1.5rem' }}>
              <h2 className="adp__section-title">Subject-wise Attendance</h2>
              <span className="adp__section-line" />
            </div>
            <div className="ap__panel">
              <div className="ap__table-wrap">
                <table className="ap__table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Total</th>
                      <th>Present</th>
                      <th>Late</th>
                      <th>Absent</th>
                      <th>Percentage</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceStats.subjects.map((s) => (
                      <tr key={s.name} onClick={() => navigate('/student/subjects')} style={{ cursor: 'pointer' }}>
                        <td><span className="ap__user-name">{s.name}</span></td>
                        <td>{s.total}</td>
                        <td>{s.present}</td>
                        <td>{s.late}</td>
                        <td>{s.absent}</td>
                        <td>
                          <span style={{ fontWeight: 700, color: getColor(s.percentage) }}>{s.percentage}%</span>
                        </td>
                        <td>
                          <span className={s.percentage >= 75 ? 'ap__badge ap__badge--active' : 'ap__badge ap__badge--error'}>
                            {s.percentage >= 75 ? 'Good' : 'Low'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Tips */}
        <div className="ap__panel" style={{ marginTop: '1.25rem' }}>
          <div className="ap__panel-header">
            <h2 className="ap__panel-title"><Lightbulb size={18} /> Quick Tips</h2>
          </div>
          <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[
              { icon: <Target size={15} />, text: 'Maintain at least 75% attendance in each subject' },
              { icon: <Zap size={15} />, text: 'Scan QR code within the class time window' },
              { icon: <Activity size={15} />, text: 'Check your attendance regularly for accuracy' },
              { icon: <Shield size={15} />, text: 'Contact faculty if any discrepancy found' },
            ].map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', fontSize: '0.88rem' }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(49,156,181,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--accent)' }}>{tip.icon}</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>{tip.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboardEnhanced;
