import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "../utils/constants";
import "../styles/dashboard.css";

function StudentDashboard() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchAttendanceData();
  }, [user]);

  const fetchAttendanceData = async () => {
    if (!user?.id) return;
    
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch(`${API_BASE_URL}/attendance/student/${user.id}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const records = data.data || [];
        
        // Calculate overall stats
        const totalClasses = records.length;
        const presentClasses = records.filter(r => r.status === 'present').length;
        const overallPercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

        // Group by subject and calculate subject-wise stats
        const subjectMap = {};
        records.forEach(record => {
          const subject = record.subject || 'Unknown Subject';
          if (!subjectMap[subject]) {
            subjectMap[subject] = { total: 0, present: 0 };
          }
          subjectMap[subject].total++;
          if (record.status === 'present') {
            subjectMap[subject].present++;
          }
        });

        const subjects = Object.keys(subjectMap).map(subject => ({
          name: subject,
          total: subjectMap[subject].total,
          present: subjectMap[subject].present,
          percentage: Math.round((subjectMap[subject].present / subjectMap[subject].total) * 100)
        }));

        setAttendanceStats({
          overall: overallPercentage,
          present: presentClasses,
          total: totalClasses,
          subjects: subjects
        });
      } else {
        // Set default empty stats if API fails
        setAttendanceStats({
          overall: 0,
          present: 0,
          total: 0,
          subjects: []
        });
      }
    } catch (error) {
      setAttendanceStats({
        overall: 0,
        present: 0,
        total: 0,
        subjects: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 85) return '#10b981';
    if (percentage >= 75) return '#f59e0b';
    return '#ef4444';
  };

  const getAttendanceStatus = (percentage) => {
    if (percentage >= 85) return 'Excellent';
    if (percentage >= 75) return 'Good';
    return 'Low';
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          fontSize: '1.2rem',
          color: 'var(--color-text-secondary)'
        }}>
          Loading your dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard dashboard--student">
      <div className="dashboard__objects" aria-hidden="true">
        <span className="dashboard__object dashboard__object--sphere" />
        <span className="dashboard__object dashboard__object--torus" />
        <span className="dashboard__object dashboard__object--diamond" />
      </div>
      
      <header className="dashboard__header student-dashboard__header">
        <div className="student-dashboard__intro">
          <p className="student-dashboard__eyebrow">Student Dashboard</p>
          <h1 className="dashboard__title student-dashboard__title">
            Welcome, {user?.name}
          </h1>
          <p className="dashboard__subtitle student-dashboard__subtitle">
            Your attendance snapshot and shortcuts in one place.
          </p>
        </div>
        <div className="student-dashboard__time">
          <div className="student-dashboard__time-value">{formatTime(currentTime)}</div>
          <div className="student-dashboard__time-date">{formatDate(currentTime)}</div>
        </div>
      </header>

      {/* Overall Stats Banner */}
      <section className="student-dashboard__stats">
        <div className="student-dashboard__stats-grid">
          <div className="student-dashboard__stat">
            <div
              className="student-dashboard__stat-value"
              style={{ color: getAttendanceColor(attendanceStats.overall) }}
            >
              {attendanceStats.overall}%
            </div>
            <div className="student-dashboard__stat-label">Overall Attendance</div>
            <div
              className="student-dashboard__stat-pill"
              style={{
                color: getAttendanceColor(attendanceStats.overall),
                backgroundColor: `${getAttendanceColor(attendanceStats.overall)}20`
              }}
            >
              {getAttendanceStatus(attendanceStats.overall)}
            </div>
          </div>

          <div className="student-dashboard__stat">
            <div className="student-dashboard__stat-value student-dashboard__stat-value--primary">
              {attendanceStats.present}
            </div>
            <div className="student-dashboard__stat-label">Classes Attended</div>
          </div>

          <div className="student-dashboard__stat">
            <div className="student-dashboard__stat-value student-dashboard__stat-value--primary">
              {attendanceStats.total}
            </div>
            <div className="student-dashboard__stat-label">Total Classes</div>
          </div>
        </div>
      </section>

      <main className="dashboard__grid" aria-label="Student overview">
        {/* Scan QR - Primary Action */}
        <section
          className="dashboard__card student-dashboard__hero"
          onClick={() => navigate("/scan-qr")}
        >
          <div className="student-dashboard__hero-glow" aria-hidden="true"></div>
          <div className="student-dashboard__hero-content">
            <div className="student-dashboard__hero-text">
              <div className="student-dashboard__hero-icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 4h4v4H3z"></path>
                  <path d="M17 4h4v4h-4z"></path>
                  <path d="M3 17h4v4H3z"></path>
                  <path d="M17 17h4v4h-4z"></path>
                  <path d="M8 8v8M16 8v8M8 16h8"></path>
                </svg>
              </div>
              <p className="student-dashboard__hero-kicker">Instant attendance</p>
              <h2 className="dashboard__card-title student-dashboard__hero-title">Scan QR Code</h2>
              <p className="dashboard__card-text student-dashboard__hero-text-desc">
                Mark attendance by scanning the QR code shared by your faculty.
              </p>
              <div className="student-dashboard__hero-meta">
                <span className="student-dashboard__hero-meta-item">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.5 8.5H8.5v3h-1v-3H4.5v-1h3v-3h1v3h3.5v1z"></path></svg>
                  Secure check-in
                </span>
                <span className="student-dashboard__hero-meta-item">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 14A6 6 0 118 2a6 6 0 010 12zM8 1A7 7 0 100 8a7 7 0 008-7zm0 11a4 4 0 110-8 4 4 0 010 8z"></path></svg>
                  Auto sync
                </span>
              </div>
              <div className="student-dashboard__hero-badge">⚡ Fast check-in</div>
            </div>
            <button
              className="student-dashboard__hero-button"
              onClick={(e) => {
                e.stopPropagation();
                navigate("/scan-qr");
              }}
            >
              <span className="student-dashboard__hero-button-icon">📱</span>
              <span>Open Scanner</span>
            </button>
          </div>
        </section>

        {/* Subject-wise Attendance Card */}
        <section className="dashboard__card student-dashboard__card student-dashboard__subjects">
          <div className="student-dashboard__card-head">
            <h2 className="dashboard__card-title">Subject-wise Attendance</h2>
            <button
              className="student-dashboard__link"
              onClick={() => navigate("/attendance-history")}
            >
              View All
            </button>
          </div>
          {attendanceStats && attendanceStats.subjects && attendanceStats.subjects.length > 0 ? (
            <div className="student-dashboard__subject-list">
              {attendanceStats.subjects.map((subject, index) => (
                <button
                  key={index}
                  className="student-dashboard__subject"
                  type="button"
                  onClick={() => navigate("/attendance-history")}
                >
                  <div className="student-dashboard__subject-top">
                    <h3 className="student-dashboard__subject-name">{subject.name}</h3>
                    <div
                      className="student-dashboard__subject-value"
                      style={{ color: getAttendanceColor(subject.percentage) }}
                    >
                      {subject.percentage}%
                    </div>
                  </div>
                  <div className="student-dashboard__subject-progress">
                    <div className="student-dashboard__subject-track">
                      <div
                        className="student-dashboard__subject-fill"
                        style={{
                          width: `${subject.percentage}%`,
                          background: `linear-gradient(90deg, ${getAttendanceColor(
                            subject.percentage
                          )}, var(--color-primary))`
                        }}
                      />
                    </div>
                    <span className="student-dashboard__subject-meta">
                      {subject.present}/{subject.total} classes
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="student-dashboard__empty">
              <p className="student-dashboard__empty-title">No attendance records yet</p>
              <p className="student-dashboard__empty-subtitle">
                Start attending classes to see subject-wise statistics.
              </p>
            </div>
          )}
        </section>

        {/* Today's Schedule Card */}
        <section className="dashboard__card student-dashboard__card student-dashboard__sessions">
          <h2 className="dashboard__card-title">Today's Sessions</h2>
          <div className="student-dashboard__empty">
            <p className="student-dashboard__empty-title">No sessions scheduled for today</p>
            <p className="student-dashboard__empty-subtitle">
              Check back later or contact your faculty for updates.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default StudentDashboard;
