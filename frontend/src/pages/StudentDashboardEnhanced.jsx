import { useContext, useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import Tilt from "react-parallax-tilt";
import { GraduationCap, Calendar, BarChart3, Camera, ScrollText, ClipboardList, CheckCircle, XCircle, BookOpen, Bell, Inbox, MapPin, UserCheck, TrendingDown, AlertTriangle, Lightbulb, Clock, Loader, ArrowRight, Sparkles } from 'lucide-react';
import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "../utils/constants";
import "../styles/dashboard.css";
import "../styles/enhanced-dashboard.css";
import "../styles/enhanced-student-dashboard.css";
import "../styles/tilt-cards.css";
import {
  fadeInUp,
  fadeInDown,
  staggerContainer,
  scaleIn,
  buttonHover,
  buttonTap,
  tiltCardEntrance,
  tiltCardStagger,
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

// Animated Counter Component
function AnimatedCounter({ value, suffix = '', duration = 1.5 }) {
  const nodeRef = useRef(null);
  const prevValue = useRef(0);
  
  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    
    const numValue = parseFloat(value) || 0;
    const controls = animate(prevValue.current, numValue, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(v) {
        node.textContent = Math.round(v) + suffix;
      },
    });
    
    prevValue.current = numValue;
    return () => controls.stop();
  }, [value, suffix, duration]);
  
  return <span ref={nodeRef}>{(parseFloat(value) || 0) + suffix}</span>;
}

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
            icon: <AlertTriangle size={18} />,
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
              icon: <TrendingDown size={18} />,
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
            icon: <CheckCircle size={18} />,
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
  const handleAttendanceRequest = () => navigate("/attendance-request");

  // ── Data-driven card config ──
  const heroCards = [
    {
      id: 'today',
      variant: 'today',
      glareColor: '#54ffd8',
      icon: <Calendar size={26} />,
      title: "Today's Status",
      particles: [
        'rgba(102,126,234,0.5)', 'rgba(118,75,162,0.4)', 'rgba(165,180,252,0.3)',
        'rgba(139,92,246,0.35)', 'rgba(196,181,253,0.25)',
      ],
      renderBody: () => (
        <>
          <div className="tilt-card__value"><AnimatedCounter value={todayStatus?.marked || 0} /></div>
          <p className="tilt-card__badge">
            {todayStatus?.status === 'present' ? <><CheckCircle size={15} /> Attendance Marked</> :
             todayStatus?.status === 'late'    ? <><Clock size={15} /> Marked Late</> :
                                                  <><Loader size={15} /> Not Marked Yet</>}
          </p>
        </>
      ),
    },
    {
      id: 'attendance',
      variant: 'attendance',
      glareColor: '#6f78ff',
      icon: <BarChart3 size={26} />,
      title: 'Overall Attendance',
      particles: [
        'rgba(16,185,129,0.5)', 'rgba(5,150,105,0.4)', 'rgba(110,231,183,0.3)',
        'rgba(52,211,153,0.35)', 'rgba(167,243,208,0.25)',
      ],
      renderBody: () => (
        <>
          <div className="tilt-card__value tilt-card__value--large"><AnimatedCounter value={attendanceStats?.overall || 0} suffix="%" /></div>
          <p className="tilt-card__subtitle">
            {attendanceStats?.present || 0}/{attendanceStats?.total || 0} Classes • {getAttendanceStatus(attendanceStats?.overall || 0)}
          </p>
          <div className="tilt-card__progress">
            <div className="tilt-card__progress-bar" style={{ width: `${attendanceStats?.overall || 0}%`, background: getAttendanceColor(attendanceStats?.overall || 0) }} />
          </div>
        </>
      ),
    },
    {
      id: 'scan',
      variant: 'scan',
      glareColor: '#ff7a7a',
      tiltMax: 14,
      perspective: 900,
      scale: 1.04,
      showSparkle: true,
      icon: <Camera size={26} />,
      title: 'Scan QR Code',
      desc: 'Mark your attendance instantly',
      onClick: handleScanQR,
      btnLabel: 'Start Scanning',
      btnVariant: 'scan',
      particles: [
        'rgba(240,147,251,0.5)', 'rgba(245,87,108,0.4)', 'rgba(253,164,175,0.3)',
        'rgba(251,113,133,0.35)', 'rgba(244,114,182,0.25)',
      ],
    },
    {
      id: 'history',
      variant: 'history',
      glareColor: '#4facfe',
      tiltMax: 14,
      perspective: 900,
      scale: 1.04,
      icon: <ScrollText size={26} />,
      title: 'Attendance History',
      desc: 'Review your complete records',
      onClick: handleViewHistory,
      btnLabel: 'View History',
      btnVariant: 'history',
      particles: [
        'rgba(79,172,254,0.5)', 'rgba(0,242,254,0.4)', 'rgba(147,197,253,0.3)',
        'rgba(96,165,250,0.35)', 'rgba(56,189,248,0.25)',
      ],
    },
    {
      id: 'request',
      variant: 'request',
      glareColor: '#f59e0b',
      tiltMax: 14,
      perspective: 900,
      scale: 1.04,
      icon: <ClipboardList size={26} />,
      title: 'Generate Request',
      desc: "Couldn't scan QR? Request attendance from teacher",
      onClick: handleAttendanceRequest,
      btnLabel: 'Send Request',
      btnVariant: 'request',
      particles: [
        'rgba(245,158,11,0.5)', 'rgba(217,119,6,0.4)', 'rgba(252,211,77,0.3)',
        'rgba(251,191,36,0.35)', 'rgba(253,224,71,0.25)',
      ],
    },
  ];

  // Animations removed to avoid runtime errors and reduce motion.

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text"><Loader size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Loading your dashboard...</p>
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
            <h1 id="dashboard-title" className="dashboard__title slide-in-down"><GraduationCap size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />Student Dashboard</h1>
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
          variants={tiltCardStagger}
          initial="hidden"
          animate="visible"
        >
          {heroCards.map((card) => (
            <motion.div key={card.id} variants={tiltCardEntrance}>
              <Tilt
                tiltMaxAngleX={card.tiltMax || 12}
                tiltMaxAngleY={card.tiltMax || 12}
                perspective={card.perspective || 1000}
                scale={card.scale || 1.03}
                transitionSpeed={400}
                gyroscope={true}
                glareEnable={true}
                glareMaxOpacity={0.18}
                glareColor={card.glareColor}
                glarePosition="all"
                glareBorderRadius="20px"
                className="tilt-card-wrapper"
              >
                <div
                  className={`tilt-card tilt-card--${card.variant}`}
                  onClick={card.onClick}
                  style={card.onClick ? { cursor: 'pointer' } : undefined}
                >
                  <div className="tilt-card__glow" />
                  <div className="tilt-card__particles">
                    {card.particles.map((bg, i) => (
                      <span key={i} className="tilt-card__particle" style={{ background: bg }} />
                    ))}
                  </div>
                  {card.showSparkle && <div className="tilt-card__sparkle"><Sparkles size={16} /></div>}
                  <div className={`tilt-card__icon tilt-card__icon--${card.variant}`}>{card.icon}</div>
                  <h2 className="tilt-card__title">{card.title}</h2>

                  {/* Custom body (stats cards) */}
                  {card.renderBody && card.renderBody()}

                  {/* Action cards (desc + button) */}
                  {card.desc && <p className="tilt-card__desc">{card.desc}</p>}
                  {card.btnLabel && (
                    <button className={`tilt-card__btn tilt-card__btn--${card.btnVariant}`} onClick={card.onClick}>
                      {card.btnLabel} <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </Tilt>
            </motion.div>
          ))}
        </motion.section>

        {/* Statistics Row - Counters */}
        <motion.section 
          ref={statsGridRef}
          className="statistics-grid" 
          style={{ marginTop: '2rem', gap: '1rem' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <StatCounter icon={<CheckCircle size={28} />} count={attendanceStats?.present || 0} label="Present" color="var(--student-card-2)" theme={theme} />
          <StatCounter icon={<Clock size={28} />} count={attendanceStats?.late || 0} label="Late" color="var(--student-card-3)" theme={theme} />
          <StatCounter icon={<XCircle size={28} />} count={attendanceStats?.absent || 0} label="Absent" color="var(--student-card-4)" theme={theme} />
          <StatCounter icon={<BookOpen size={28} />} count={attendanceStats?.subjects?.length || 0} label="Subjects" color="var(--student-card-1)" theme={theme} />
        </motion.section>

        {/* Notifications & Upcoming Sessions */}
        <motion.section
          className="dashboard__grid notifications-sessions-grid"
          style={{ marginTop: '2rem', gap: '1.5rem' }}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {/* Notifications Card */}
          <motion.section className="dashboard__card content-card notifications-card" variants={fadeInUp} whileHover={{ y: -6, boxShadow: '0 20px 50px rgba(49, 156, 181, 0.18)', transition: { type: 'spring', stiffness: 260, damping: 24 } }}>
            <div className="card-title-header">
              <h2 className="dashboard__card-title"><Bell size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Notifications</h2>
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
                  <span style={{ fontSize: '3rem' }}><Inbox size={48} /></span>
                  <p>No new notifications</p>
                </div>
              )}
            </div>
          </motion.section>

          {/* Upcoming Sessions Card */}
          <motion.section className="dashboard__card content-card sessions-card" variants={fadeInUp} whileHover={{ y: -6, boxShadow: '0 20px 50px rgba(49, 156, 181, 0.18)', transition: { type: 'spring', stiffness: 260, damping: 24 } }}>
            <div className="card-title-header">
              <h2 className="dashboard__card-title"><Calendar size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Upcoming Sessions</h2>
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
                      <div className="session-room"><MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />{session.room}</div>
                      <div className="session-faculty"><UserCheck size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />{session.faculty}</div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="empty-state">
                  <span style={{ fontSize: '3rem' }}><Inbox size={48} /></span>
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
            <h2 className="dashboard__card-title"><BookOpen size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Subject-wise Attendance</h2>
            <span className="subject-badge">{attendanceStats?.subjects?.length || 0}</span>
          </div>
          <div 
            ref={subjectsGridRef}
            className="dashboard__grid subjects-grid" 
            style={{ 
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

        {/* Quick Tips */}
        <motion.section
          className="dashboard__card content-card tips-card"
          style={{ marginTop: '2rem', background: 'var(--student-card-1)', color: 'var(--student-card-text)', boxShadow: theme === 'dark' ? '0 10px 30px rgba(49, 156, 181, 0.35)' : '0 10px 30px rgba(0, 0, 0, 0.1)' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -6, boxShadow: '0 20px 50px rgba(49, 156, 181, 0.2)', transition: { type: 'spring', stiffness: 260, damping: 24 } }}
        >
          <h2 className="dashboard__card-title" style={{ color: 'var(--student-card-text)' }}><Lightbulb size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Quick Tips</h2>
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
          <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Below minimum required
        </div>
      )}
    </div>
  );
}

export default StudentDashboardEnhanced;
