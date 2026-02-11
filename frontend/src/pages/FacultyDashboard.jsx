import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/dashboard.css";

function FacultyDashboard() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const token = authContext?.token;

  // State for dashboard data
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    activeSessions: 0,
    totalAttendance: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch sessions data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5001/api/session', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const sessionsData = data.data || data || [];
          setSessions(sessionsData);
          
          // Calculate stats
          const activeSessions = sessionsData.filter(s => s.status === 'active').length;
          setStats({
            totalSessions: sessionsData.length,
            activeSessions: activeSessions,
            totalAttendance: sessionsData.length * 5 // Placeholder
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const handleGenerateQR = () => {
    navigate("/faculty/qr-generation");
  };

  const handleViewSessions = () => {
    navigate("/faculty/sessions");
  };

  const handleViewReports = () => {
    navigate("/faculty/attendance-reports");
  };

  return (
    <div className="dashboard">
      <div className="dashboard__objects" aria-hidden="true">
        <span className="dashboard__object dashboard__object--sphere" />
        <span className="dashboard__object dashboard__object--torus" />
        <span className="dashboard__object dashboard__object--diamond" />
      </div>
      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">👨‍🏫 Faculty Dashboard</h1>
          <p className="dashboard__subtitle">
            Welcome back, <strong>{user?.name}</strong>! Manage classes, generate QR codes, and track attendance.
          </p>
        </div>
      </header>

      <main className="dashboard__grid" aria-label="Faculty overview">
        {/* Generate QR Code Card */}
        <section 
          className="dashboard__card dashboard__card--clickable" 
          onClick={handleGenerateQR}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => e.key === 'Enter' && handleGenerateQR()}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ 
            fontSize: '2.5rem', 
            marginBottom: '1rem',
            opacity: 0.9
          }}>
            🎯
          </div>
          <h2 className="dashboard__card-title">Generate QR Code</h2>
          <p className="dashboard__card-text">
            Create unique QR codes for your class sessions to track attendance efficiently.
          </p>
          <button className="dashboard__card-action" style={{ marginTop: 'auto' }}>
            Generate QR Code →
          </button>
        </section>

        {/* Class Sessions Card */}
        <section 
          className="dashboard__card dashboard__card--clickable"
          onClick={handleViewSessions}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => e.key === 'Enter' && handleViewSessions()}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ 
            fontSize: '2.5rem', 
            marginBottom: '1rem',
            opacity: 0.9
          }}>
            📚
          </div>
          <h2 className="dashboard__card-title">Class Sessions</h2>
          {loading ? (
            <p className="dashboard__card-text" style={{ color: 'var(--color-text-secondary)' }}>
              ⏳ Loading sessions...
            </p>
          ) : (
            <>
              <p className="dashboard__card-text">
                <strong style={{ color: 'var(--primary-accent)', fontSize: '1.1em' }}>
                  {stats.activeSessions}
                </strong>
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  {' '}active sessions • {' '}
                </span>
                <strong style={{ color: 'var(--primary-accent)', fontSize: '1.1em' }}>
                  {stats.totalSessions}
                </strong>
                <span style={{ color: 'var(--color-text-secondary)' }}>{' '}total</span>
              </p>
              {sessions.length > 0 && (
                <div style={{ marginTop: '0.8rem', fontSize: '0.9em', color: 'var(--color-text-secondary)' }}>
                  Latest: <strong>{sessions[0]?.subject}</strong>
                </div>
              )}
            </>
          )}
          <button className="dashboard__card-action" style={{ marginTop: 'auto' }}>
            View Sessions →
          </button>
        </section>

        {/* Attendance Reports Card */}
        <section 
          className="dashboard__card dashboard__card--clickable"
          onClick={handleViewReports}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => e.key === 'Enter' && handleViewReports()}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ 
            fontSize: '2.5rem', 
            marginBottom: '1rem',
            opacity: 0.9
          }}>
            📊
          </div>
          <h2 className="dashboard__card-title">Attendance Reports</h2>
          {loading ? (
            <p className="dashboard__card-text" style={{ color: 'var(--color-text-secondary)' }}>
              ⏳ Loading reports...
            </p>
          ) : (
            <p className="dashboard__card-text">
              Analyze attendance data across{' '}
              <strong style={{ color: 'var(--primary-accent)' }}>
                {stats.totalSessions}
              </strong>
              {' '}sessions
            </p>
          )}
          <button className="dashboard__card-action" style={{ marginTop: 'auto' }}>
            View Reports →
          </button>
        </section>
      </main>
    </div>
  );
}

export default FacultyDashboard;
