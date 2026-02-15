import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "../utils/constants";
import "../styles/dashboard.css";
import "../styles/enhanced-dashboard.css";

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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
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
        const overallPercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

        // Today's attendance
        const today = new Date().toISOString().split('T')[0];
        const todayRecords = records.filter(r => r.date?.startsWith(today));
        
        setTodayStatus({
          marked: todayRecords.length,
          status: todayRecords.length > 0 ? todayRecords[0].status : 'pending'
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

        // Upcoming sessions (mock data)
        setUpcomingSessions([
          { id: 1, subject: 'Data Structures', time: '10:00 AM', room: 'Lab 301', faculty: 'Dr. Smith' },
          { id: 2, subject: 'Web Development', time: '2:00 PM', room: 'Room 205', faculty: 'Prof. Johnson' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setAttendanceStats({
        overall: 0, present: 0, late: 0, absent: 0, total: 0, subjects: []
      });
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
  const handleViewProfile = () => navigate("/student-profile");
  const handleLogout = () => {
    authContext?.logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          minHeight: '60vh', fontSize: '1.2rem', color: 'var(--color-text-secondary)'
        }}>
          ⏳ Loading your dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard__objects" aria-hidden="true">
        <span className="dashboard__object dashboard__object--sphere" />
        <span className="dashboard__object dashboard__object--torus" />
        <span className="dashboard__object dashboard__object--diamond" />
      </div>

      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">🎓 Student Dashboard</h1>
          <p className="dashboard__subtitle">
            Welcome back, <strong>{user?.name}</strong>! {formatDate(currentTime)} • {formatTime(currentTime)}
          </p>
        </div>
        <div className="dashboard__buttons">
          <button
            className="dashboard__button dashboard__button--primary"
            onClick={handleViewProfile}
          >
            👤 My Profile
          </button>
          <button
            className="dashboard__button dashboard__button--secondary"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard__content">
        {/* Quick Action Cards */}
        <section className="dashboard__grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {/* Today's Status Card */}
          <section className="dashboard__card" style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📅</div>
            <h2 className="dashboard__card-title" style={{ color: 'white' }}>Today's Status</h2>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '1rem 0' }}>
              {todayStatus?.marked || 0}
            </div>
            <p className="dashboard__card-text" style={{ color: 'rgba(255,255,255,0.9)' }}>
              {todayStatus?.status === 'present' ? '✓ Attendance Marked' : 
               todayStatus?.status === 'late' ? '⏰ Marked Late' : 
               '⏳ Not Marked Yet'}
            </p>
          </section>

          {/* Overall Attendance Card */}
          <section className="dashboard__card" style={{ 
            background: `linear-gradient(135deg, ${getAttendanceColor(attendanceStats?.overall || 0)} 0%, ${getAttendanceColor(attendanceStats?.overall || 0)}dd 100%)`,
            color: 'white'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📊</div>
            <h2 className="dashboard__card-title" style={{ color: 'white' }}>Overall Attendance</h2>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '1rem 0' }}>
              {attendanceStats?.overall || 0}%
            </div>
            <p className="dashboard__card-text" style={{ color: 'rgba(255,255,255,0.9)' }}>
              {attendanceStats?.present || 0}/{attendanceStats?.total || 0} Classes • {getAttendanceStatus(attendanceStats?.overall || 0)}
            </p>
          </section>

          {/* Scan QR Card */}
          <section 
            className="dashboard__card dashboard__card--clickable"
            onClick={handleScanQR}
            style={{ cursor: 'pointer', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📷</div>
            <h2 className="dashboard__card-title" style={{ color: 'white' }}>Scan QR Code</h2>
            <p className="dashboard__card-text" style={{ color: 'rgba(255,255,255,0.9)', marginTop: '1rem' }}>
              Mark your attendance by scanning QR code
            </p>
            <button className="dashboard__card-action" style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.2)', border: '1px solid white' }}>
              Start Scanning →
            </button>
          </section>

          {/* View History Card */}
          <section 
            className="dashboard__card dashboard__card--clickable"
            onClick={handleViewHistory}
            style={{ cursor: 'pointer', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📜</div>
            <h2 className="dashboard__card-title" style={{ color: 'white' }}>Attendance History</h2>
            <p className="dashboard__card-text" style={{ color: 'rgba(255,255,255,0.9)', marginTop: '1rem' }}>
              View complete attendance records
            </p>
            <button className="dashboard__card-action" style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.2)', border: '1px solid white' }}>
              View History →
            </button>
          </section>
        </section>

        {/* Statistics Row */}
        <section className="dashboard__grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: '2rem' }}>
          <div className="dashboard__card" style={{ background: '#10b981', color: 'white', padding: '1.5rem' }}>
            <div style={{ fontSize: '2rem' }}>✅</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{attendanceStats?.present || 0}</div>
            <div style={{ opacity: 0.9 }}>Present</div>
          </div>
          <div className="dashboard__card" style={{ background: '#f59e0b', color: 'white', padding: '1.5rem' }}>
            <div style={{ fontSize: '2rem' }}>⏰</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{attendanceStats?.late || 0}</div>
            <div style={{ opacity: 0.9 }}>Late</div>
          </div>
          <div className="dashboard__card" style={{ background: '#ef4444', color: 'white', padding: '1.5rem' }}>
            <div style={{ fontSize: '2rem' }}>❌</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{attendanceStats?.absent || 0}</div>
            <div style={{ opacity: 0.9 }}>Absent</div>
          </div>
          <div className="dashboard__card" style={{ background: '#6366f1', color: 'white', padding: '1.5rem' }}>
            <div style={{ fontSize: '2rem' }}>📚</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{attendanceStats?.subjects?.length || 0}</div>
            <div style={{ opacity: 0.9 }}>Subjects</div>
          </div>
        </section>

        {/* Notifications & Upcoming Sessions */}
        <section className="dashboard__grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', marginTop: '2rem' }}>
          {/* Notifications Card */}
          <section className="dashboard__card">
            <h2 className="dashboard__card-title">🔔 Notifications</h2>
            <div style={{ marginTop: '1rem' }}>
              {notifications.length > 0 ? (
                notifications.map(notif => (
                  <div key={notif.id} style={{
                    padding: '0.75rem',
                    background: notif.type === 'warning' ? '#fef3c7' : '#d1fae5',
                    borderRadius: '8px',
                    marginBottom: '0.75rem',
                    borderLeft: `4px solid ${notif.type === 'warning' ? '#f59e0b' : '#10b981'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{notif.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{notif.title}</div>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>{notif.message}</div>
                        <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>{notif.time}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                  No new notifications
                </p>
              )}
            </div>
          </section>

          {/* Upcoming Sessions Card */}
          <section className="dashboard__card">
            <h2 className="dashboard__card-title">📅 Upcoming Sessions</h2>
            <div style={{ marginTop: '1rem' }}>
              {upcomingSessions.length > 0 ? (
                upcomingSessions.map(session => (
                  <div key={session.id} style={{
                    padding: '1rem',
                    background: '#f3f4f6',
                    borderRadius: '8px',
                    marginBottom: '0.75rem',
                    borderLeft: '4px solid #667eea'
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#667eea' }}>
                      {session.subject}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      🕒 {session.time} • 📍 {session.room}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      👨‍🏫 {session.faculty}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                  No upcoming sessions today
                </p>
              )}
            </div>
          </section>
        </section>

        {/* Subject-wise Attendance */}
        <section className="dashboard__card" style={{ marginTop: '2rem' }}>
          <h2 className="dashboard__card-title">📚 Subject-wise Attendance</h2>
          <div className="dashboard__grid" style={{ 
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '1rem',
            marginTop: '1rem'
          }}>
            {attendanceStats?.subjects && attendanceStats.subjects.length > 0 ? (
              attendanceStats.subjects.map((subject, idx) => (
                <div key={idx} style={{
                  padding: '1rem',
                  background: subject.percentage < 75 ? '#fee2e2' : '#d1fae5',
                  borderRadius: '8px',
                  border: `2px solid ${subject.percentage < 75 ? '#ef4444' : '#10b981'}`
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{subject.name}</div>
                  <div style={{ 
                    fontSize: '2rem', 
                    fontWeight: 'bold',
                    color: subject.percentage < 75 ? '#ef4444' : '#10b981',
                    marginBottom: '0.5rem'
                  }}>
                    {subject.percentage}%
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>
                    {subject.present}/{subject.total} Classes Present
                  </div>
                  {subject.percentage < 75 && (
                    <div style={{ 
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      background: '#fef3c7',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      color: '#92400e'
                    }}>
                      ⚠️ Below minimum required
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#666', padding: '2rem' }}>
                No subject data available
              </p>
            )}
          </div>
        </section>

        {/* Quick Tips */}
        <section className="dashboard__card" style={{ marginTop: '2rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <h2 className="dashboard__card-title" style={{ color: 'white' }}>💡 Quick Tips</h2>
          <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
            <li>Maintain at least 75% attendance in each subject</li>
            <li>Scan QR code within the class time</li>
            <li>Check your attendance regularly</li>
            <li>Contact faculty if any discrepancy found</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

export default StudentDashboardEnhanced;
