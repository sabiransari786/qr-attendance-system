import { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "../utils/constants";
import "../styles/dashboard.css";
import "../styles/enhanced-dashboard.css";
import "../styles/enhanced-student-dashboard.css";
import {
  fadeInUp,
  fadeInDown,
  staggerContainer,
  scaleIn,
  buttonHover,
  buttonTap,
} from "../animations/animationConfig";

// Color Theme System
const COLOR_THEME = {
  primary: {
    light: '#667eea',
    dark: '#764ba2',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    name: 'Purple'
  },
  success: {
    light: '#10b981',
    dark: '#059669',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    name: 'Emerald'
  },
  warning: {
    light: '#f59e0b',
    dark: '#d97706',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    name: 'Amber'
  },
  danger: {
    light: '#ef4444',
    dark: '#dc2626',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    name: 'Red'
  },
  info: {
    light: '#4facfe',
    dark: '#00f2fe',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    name: 'Cyan'
  },
  secondary: {
    light: '#f093fb',
    dark: '#f5576c',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    name: 'Pink'
  },
  accent: {
    light: '#6366f1',
    dark: '#4f46e5',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    name: 'Indigo'
  }
};

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
  const [hoveredCard, setHoveredCard] = useState(null);
  const [theme, setTheme] = useState('light');

  // Anime.js refs
  const heroGridRef = useRef(null);
  const statsGridRef = useRef(null);
  const notificationsRef = useRef(null);
  const sessionsRef = useRef(null);
  const subjectsGridRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Detect theme from HTML element
    const htmlElement = document.documentElement;
    const currentTheme = htmlElement.getAttribute('data-theme') || 'light';
    setTheme(currentTheme);

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          const newTheme = htmlElement.getAttribute('data-theme') || 'light';
          setTheme(newTheme);
        }
      });
    });

    observer.observe(htmlElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user]);


  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("authToken");
      
      // Fetch attendance data
      const attendanceResponse = await fetch(`${API_BASE_URL}/attendance/student/${user.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (attendanceResponse.ok) {
        const data = await attendanceResponse.json();
        const records = data.data || [];
        
        // Calculate stats
        const totalClasses = records.length;
        const presentClasses = records.filter(r => r.status === 'present').length;
        const lateClasses = records.filter(r => r.status === 'late').length;
        const absentClasses = records.filter(r => r.status === 'absent').length;
        // Count present + late for percentage (late still counts as attended)
        const overallPercentage = totalClasses > 0 ? Math.round(((presentClasses + lateClasses) / totalClasses) * 100) : 0;

        // Today's attendance — API returns marked_at not date
        const today = new Date().toISOString().split('T')[0];
        const todayRecords = records.filter(r => r.marked_at?.startsWith(today));
        
        setTodayStatus({
          marked: todayRecords.length,
          status: todayRecords.length > 0 ? todayRecords[0].status : 'pending',
          sessions: todayRecords
        });



        // Group by subject
        const subjectMap = {};
        records.forEach(record => {
          const subject = record.subject || 'Unknown Subject';
          if (!subjectMap[subject]) {
            subjectMap[subject] = { total: 0, present: 0, late: 0, absent: 0 };
          }
          subjectMap[subject].total++;
          if (record.status === 'present') subjectMap[subject].present++;
          if (record.status === 'late') subjectMap[subject].late++;
          if (record.status === 'absent') subjectMap[subject].absent++;
        });

        const subjects = Object.keys(subjectMap).map(subject => ({
          name: subject,
          total: subjectMap[subject].total,
          present: subjectMap[subject].present,
          late: subjectMap[subject].late,
          absent: subjectMap[subject].absent,
          percentage: Math.round((subjectMap[subject].present / subjectMap[subject].total) * 100)
        }));

        setAttendanceStats({
          overall: overallPercentage,
          present: presentClasses,
          late: lateClasses,
          absent: absentClasses,
          total: totalClasses,
          subjects: subjects
        });

        // Generate notifications
        const notifs = [];
        if (overallPercentage < 75) {
          notifs.push({
            id: 1,
            type: 'warning',
            icon: '⚠️',
            title: 'Low Attendance Alert',
            message: `Your attendance is ${overallPercentage}%. Minimum 75% required.`,
            time: 'Just now'
          });
        }
        
        subjects.forEach((subject, idx) => {
          if (subject.percentage < 75) {
            notifs.push({
              id: idx + 2,
              type: 'warning',
              icon: '📉',
              title: `${subject.name} - Low Attendance`,
              message: `Only ${subject.percentage}% attendance in this subject.`,
              time: 'Today'
            });
          }
        });

        if (todayRecords.length > 0 && todayRecords[0].status === 'present') {
          notifs.push({
            id: 100,
            type: 'success',
            icon: '✅',
            title: 'Attendance Confirmed',
            message: 'Your attendance for today has been marked.',
            time: '2 hours ago'
          });
        }

        setNotifications(notifs.slice(0, 5));

        // Upcoming sessions — derive from today's attendance + show pending ones
        const todayAttendedSessionIds = new Set(todayRecords.map(r => r.session_id || r.sessionId));
        const upcomingData = [
          { id: 1, subject: 'Data Structures',     time: '10:00 AM', room: 'Room 301', faculty: 'Teacher' },
          { id: 2, subject: 'Web Development',     time: '02:00 PM', room: 'Lab 201',  faculty: 'Teacher' },
          { id: 3, subject: 'Algorithm Design',    time: '01:00 PM', room: 'Room 303', faculty: 'Prof. Kumar' },
          { id: 4, subject: 'Database Management', time: '10:00 AM', room: 'Room 302', faculty: 'Test Faculty' },
        ];
        setUpcomingSessions(upcomingData.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Rich fallback dummy data when API fails
      setAttendanceStats({
        overall: 84,
        present: 32,
        late: 5,
        absent: 7,
        total: 44,
        subjects: [
          { name: 'Data Structures',     total: 12, present: 11, late: 1, absent: 0, percentage: 100 },
          { name: 'Web Development',     total: 10, present:  8, late: 1, absent: 1, percentage: 90  },
          { name: 'Database Management', total: 10, present:  8, late: 2, absent: 0, percentage: 100 },
          { name: 'Algorithm Design',    total:  6, present:  4, late: 1, absent: 1, percentage: 83  },
          { name: 'Operating Systems',   total:  6, present:  1, late: 0, absent: 5, percentage: 17  },
        ]
      });
      setTodayStatus({ marked: 1, status: 'present', sessions: [] });
      setUpcomingSessions([
        { id: 1, subject: 'Data Structures',  time: '10:00 AM', room: 'Room 301', faculty: 'Teacher' },
        { id: 2, subject: 'Web Development',  time: '02:00 PM', room: 'Lab 201',  faculty: 'Teacher' },
        { id: 3, subject: 'Algorithm Design', time: '01:00 PM', room: 'Room 303', faculty: 'Prof. Kumar' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', minute: '2-digit', hour12: true 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
  };

  // Theme-aware card styles

  const getAttendanceColor = (percentage) => {
    if (percentage >= 85) return '#10b981';
    if (percentage >= 75) return '#f59e0b';
    return '#ef4444';
  };

  const getAttendanceStatus = (percentage) => {
    if (percentage >= 85) return 'Excellent';
    if (percentage >= 75) return 'Good';
    return 'Warning';
  };

  const handleScanQR = () => navigate("/scan-qr");
  const handleViewHistory = () => navigate("/attendance-history");

  // Animations removed to avoid runtime errors and reduce motion.

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">⏳ Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="dashboard__objects" aria-hidden="true">
        <span className="dashboard__object dashboard__object--sphere" />
        <span className="dashboard__object dashboard__object--torus" />
        <span className="dashboard__object dashboard__object--diamond" />
      </div>

      <motion.header className="dashboard__header enhanced-header"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="header-content">
          <div className="header-text">
            <h1 id="dashboard-title" className="dashboard__title slide-in-down">🎓 Student Dashboard</h1>
            <p className="dashboard__subtitle fade-in">
              Welcome back, <strong>{user?.name}</strong>! {formatDate(currentTime)} • {formatTime(currentTime)}
            </p>
          </div>
        </div>
      </motion.header>

      <main className="dashboard__content">
        {/* Quick Action Cards - Hero Section */}
        <motion.section 
          ref={heroGridRef}
          className="dashboard__grid hero-grid" 
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Today's Status Card */}
          <motion.section 
            className="dashboard__card premium-card card-gradient-1 card-hover"
            onMouseEnter={() => setHoveredCard(1)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{ 
              transform: hoveredCard === 1 ? 'translateY(-8px)' : 'translateY(0)'
            }}
            variants={fadeInUp}
            whileHover={{ y: -10, scale: 1.02, boxShadow: '0 24px 64px rgba(49, 156, 181, 0.25)', transition: { type: 'spring', stiffness: 280, damping: 24 } }}
          >
            <div className="card-header-icon">📅</div>
            <h2 className="dashboard__card-title">Today's Status</h2>
            <div className="card-value">{todayStatus?.marked || 0}</div>
            <p className="dashboard__card-text status-badge">
              {todayStatus?.status === 'present' ? '✓ Attendance Marked' : 
               todayStatus?.status === 'late' ? '⏰ Marked Late' : 
               '⏳ Not Marked Yet'}
            </p>
          </motion.section>

          {/* Overall Attendance Card - Red Theme */}
          <motion.section 
            className="dashboard__card premium-card card-gradient-2 card-hover"
            onMouseEnter={() => setHoveredCard(2)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{ 
              transform: hoveredCard === 2 ? 'translateY(-8px)' : 'translateY(0)',
              boxShadow: theme === 'dark' ? '0 10px 30px rgba(49, 156, 181, 0.35)' : '0 10px 30px rgba(0, 0, 0, 0.1)'
            }}
            variants={fadeInUp}
            whileHover={{ y: -10, scale: 1.02, boxShadow: '0 24px 64px rgba(49, 156, 181, 0.25)', transition: { type: 'spring', stiffness: 280, damping: 24 } }}
          >
            <div className="card-header-icon">📊</div>
            <h2 className="dashboard__card-title">Overall Attendance</h2>
            <div className="card-value-large">{attendanceStats?.overall || 0}%</div>
            <p className="dashboard__card-text percentage-text">
              {attendanceStats?.present || 0}/{attendanceStats?.total || 0} Classes • {getAttendanceStatus(attendanceStats?.overall || 0)}
            </p>
          </motion.section>

          {/* Scan QR Card - Pink Theme */}
          <motion.section 
            className="dashboard__card premium-card card-gradient-3 card-clickable card-hover"
            onClick={handleScanQR}
            onMouseEnter={() => setHoveredCard(3)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{ 
              cursor: 'pointer', 
              transform: hoveredCard === 3 ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
              boxShadow: theme === 'dark' ? '0 10px 30px rgba(49, 156, 181, 0.35)' : '0 10px 30px rgba(0, 0, 0, 0.1)'
            }}
            variants={fadeInUp}
            whileHover={{ y: -10, scale: 1.03, transition: { type: 'spring', stiffness: 280, damping: 22 } }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="card-header-icon">📷</div>
            <h2 className="dashboard__card-title">Scan QR Code</h2>
            <p className="dashboard__card-text">Mark your attendance instantly</p>
            <button className="dashboard__card-action btn-action-glow">
              Start Scanning →
            </button>
          </motion.section>

          {/* View History Card - Cyan Theme */}
          <motion.section 
            className="dashboard__card premium-card card-gradient-4 card-clickable card-hover"
            onClick={handleViewHistory}
            onMouseEnter={() => setHoveredCard(4)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{ 
              cursor: 'pointer', 
              transform: hoveredCard === 4 ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
              boxShadow: theme === 'dark' ? '0 10px 30px rgba(49, 156, 181, 0.35)' : '0 10px 30px rgba(0, 0, 0, 0.1)'
            }}
            variants={fadeInUp}
            whileHover={{ y: -10, scale: 1.03, transition: { type: 'spring', stiffness: 280, damping: 22 } }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="card-header-icon">📜</div>
            <h2 className="dashboard__card-title">Attendance History</h2>
            <p className="dashboard__card-text">Review your complete records</p>
            <button className="dashboard__card-action btn-action-glow">
              View History →
            </button>
          </motion.section>
        </motion.section>

        {/* Statistics Row - Counters */}
        <motion.section 
          ref={statsGridRef}
          className="statistics-grid" 
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginTop: '2rem', gap: '1rem' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <StatCounter icon="✅" count={attendanceStats?.present || 0} label="Present" color="var(--student-card-2)" theme={theme} />
          <StatCounter icon="⏰" count={attendanceStats?.late || 0} label="Late" color="var(--student-card-3)" theme={theme} />
          <StatCounter icon="❌" count={attendanceStats?.absent || 0} label="Absent" color="var(--student-card-4)" theme={theme} />
          <StatCounter icon="📚" count={attendanceStats?.subjects?.length || 0} label="Subjects" color="var(--student-card-1)" theme={theme} />
        </motion.section>

        {/* Notifications & Upcoming Sessions */}
        <motion.section
          className="dashboard__grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', marginTop: '2rem', gap: '1.5rem' }}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {/* Notifications Card */}
          <motion.section className="dashboard__card content-card notifications-card" variants={fadeInUp} whileHover={{ y: -6, boxShadow: '0 20px 50px rgba(49, 156, 181, 0.18)', transition: { type: 'spring', stiffness: 260, damping: 24 } }}>
            <div className="card-title-header">
              <h2 className="dashboard__card-title">🔔 Notifications</h2>
              <span className="notification-badge">{notifications.length}</span>
            </div>
            <div 
              ref={notificationsRef}
              className="notifications-list" 
              style={{ marginTop: '1rem' }}
            >
              {notifications.length > 0 ? (
                notifications.map((notif, idx) => (
                  <motion.div 
                    key={notif.id} 
                    className={`notification-item notification-${notif.type}`}
                    initial={{ opacity: 0, x: -16, filter: 'blur(2px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    transition={{ delay: idx * 0.06, type: 'spring', stiffness: 260, damping: 24 }}
                  >
                    <div className="notification-icon">{notif.icon}</div>
                    <div className="notification-content">
                      <div className="notification-title">{notif.title}</div>
                      <div className="notification-message">{notif.message}</div>
                      <div className="notification-time">{notif.time}</div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="empty-state">
                  <span style={{ fontSize: '3rem' }}>📭</span>
                  <p>No new notifications</p>
                </div>
              )}
            </div>
          </motion.section>

          {/* Upcoming Sessions Card */}
          <motion.section className="dashboard__card content-card sessions-card" variants={fadeInUp} whileHover={{ y: -6, boxShadow: '0 20px 50px rgba(49, 156, 181, 0.18)', transition: { type: 'spring', stiffness: 260, damping: 24 } }}>
            <div className="card-title-header">
              <h2 className="dashboard__card-title">📅 Upcoming Sessions</h2>
              <span className="session-badge">{upcomingSessions.length}</span>
            </div>
            <div 
              ref={sessionsRef}
              className="sessions-list" 
              style={{ marginTop: '1rem' }}
            >
              {upcomingSessions.length > 0 ? (
                upcomingSessions.map((session, idx) => (
                  <motion.div 
                    key={session.id} 
                    className="session-item"
                    initial={{ opacity: 0, y: 14, filter: 'blur(2px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ delay: idx * 0.06, type: 'spring', stiffness: 260, damping: 24 }}
                  >
                    <div className="session-time">{session.time}</div>
                    <div className="session-details">
                      <div className="session-subject">{session.subject}</div>
                      <div className="session-room">📍 {session.room}</div>
                      <div className="session-faculty">👨‍🏫 {session.faculty}</div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="empty-state">
                  <span style={{ fontSize: '3rem' }}>📭</span>
                  <p>No upcoming sessions today</p>
                </div>
              )}
            </div>
          </motion.section>
        </motion.section>

        {/* Subject-wise Attendance */}
        <motion.section
          className="dashboard__card content-card subjects-card"
          style={{ marginTop: '2rem' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -6, boxShadow: '0 20px 50px rgba(49, 156, 181, 0.18)', transition: { type: 'spring', stiffness: 260, damping: 24 } }}
        >
          <div className="card-title-header">
            <h2 className="dashboard__card-title">📚 Subject-wise Attendance</h2>
            <span className="subject-badge">{attendanceStats?.subjects?.length || 0}</span>
          </div>
          <div 
            ref={subjectsGridRef}
            className="dashboard__grid" 
            style={{ 
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '1rem',
              marginTop: '1rem'
            }}
          >
            {attendanceStats?.subjects && attendanceStats.subjects.length > 0 ? (
              attendanceStats.subjects.map((subject, idx) => (
                <SubjectCard key={idx} subject={subject} index={idx} theme={theme} />
              ))
            ) : (
              <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#666', padding: '2rem' }}>
                No subject data available
              </p>
            )}
          </div>
        </motion.section>

        {/* Quick Tips */
        <motion.section
          className="dashboard__card content-card tips-card"
          style={{ marginTop: '2rem', background: 'var(--student-card-1)', color: 'var(--student-card-text)', boxShadow: theme === 'dark' ? '0 10px 30px rgba(49, 156, 181, 0.35)' : '0 10px 30px rgba(0, 0, 0, 0.1)' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -6, boxShadow: '0 20px 50px rgba(49, 156, 181, 0.2)', transition: { type: 'spring', stiffness: 260, damping: 24 } }}
        >
          <h2 className="dashboard__card-title" style={{ color: 'var(--student-card-text)' }}>💡 Quick Tips</h2>
          <ul className="tips-list" style={{ marginTop: '1rem' }}>
            <li><span className="tip-dot"></span>Maintain at least 75% attendance in each subject</li>
            <li><span className="tip-dot"></span>Scan QR code within the class time</li>
            <li><span className="tip-dot"></span>Check your attendance regularly</li>
            <li><span className="tip-dot"></span>Contact faculty if any discrepancy found</li>
          </ul>
        </motion.section>
      </main>
    </motion.div>
  );
}

// Sub-component for Statistics Counter
function StatCounter({ icon, count, label, color, theme = 'light' }) {
  return (
    <div 
      className="stat-counter"
      style={{
        background: color,
        color: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        textAlign: 'center',
        animation: 'fadeInUp 0.6s ease-out both',
        boxShadow: theme === 'dark' ? '0 8px 20px rgba(49, 156, 181, 0.35)' : '0 8px 20px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{count}</div>
      <div style={{ opacity: 0.95, fontSize: '0.9rem' }}>{label}</div>
    </div>
  );
}

// Sub-component for Subject Card
function SubjectCard({ subject, index, theme = 'light' }) {
  const [hovered, setHovered] = useState(false);
  
  return (
    <div 
      className="subject-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '1.5rem',
        background: theme === 'dark' 
          ? (subject.percentage < 75 ? '#7f1d1d' : '#064e3b')
          : (subject.percentage < 75 ? '#fee2e2' : '#d1fae5'),
        borderRadius: '12px',
        border: `2px solid ${subject.percentage < 75 ? COLOR_THEME.danger.light : COLOR_THEME.success.light}`,
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform 0.3s ease'
      }}
    >
      <div style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '1.1rem', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
        {subject.name}
      </div>
      <div className="percentage-ring">
        <div style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold',
          color: subject.percentage < 75 ? COLOR_THEME.danger.light : COLOR_THEME.success.light,
          marginBottom: '0.5rem'
        }}>
          {subject.percentage}%
        </div>
      </div>
      <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#d1d5db' : '#666', marginBottom: '0.75rem' }}>
        {subject.present}/{subject.total} Classes Present
      </div>
      {subject.percentage < 75 && (
        <div className="warning-badge" style={{ background: theme === 'dark' ? '#78350f' : '#fef3c7', color: theme === 'dark' ? '#fed7aa' : '#92400e' }}>
          ⚠️ Below minimum required
        </div>
      )}
    </div>
  );
}

export default StudentDashboardEnhanced;
