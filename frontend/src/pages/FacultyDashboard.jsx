import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { logout } from "../services/api";
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

  const handleLogout = async () => {
    try {
      const token = authContext?.token;
      if (token) {
        await logout(token);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      authContext?.logout();
      navigate("/login");
    }
  };

  const handleViewProfile = () => {
    navigate("/faculty-profile");
  };

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
      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">Faculty Dashboard</h1>
          <p className="dashboard__subtitle">
            Welcome, {user?.name}! Manage classes, generate sessions, and monitor attendance reports.
          </p>
        </div>
        <div className="dashboard__buttons">
          <button
            className="dashboard__button dashboard__button--primary"
            type="button"
            onClick={handleViewProfile}
          >
            My Profile
          </button>
          <button
            className="dashboard__button dashboard__button--secondary"
            type="button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard__grid" aria-label="Faculty overview">
        <section 
          className="dashboard__card dashboard__card--clickable" 
          onClick={handleGenerateQR}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => e.key === 'Enter' && handleGenerateQR()}
        >
          <h2 className="dashboard__card-title">🎯 Generate QR Code</h2>
          <p className="dashboard__card-text">Create QR codes for attendance marking with location and time settings.</p>
          <button className="dashboard__card-action">Open QR Generator →</button>
        </section>

        <section 
          className="dashboard__card dashboard__card--clickable"
          onClick={handleViewSessions}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => e.key === 'Enter' && handleViewSessions()}
        >
          <h2 className="dashboard__card-title">📚 Class Sessions</h2>
          {loading ? (
            <p className="dashboard__card-text">Loading sessions...</p>
          ) : (
            <>
              <p className="dashboard__card-text">
                <strong>{stats.activeSessions}</strong> active sessions • <strong>{stats.totalSessions}</strong> total
              </p>
              {sessions.length > 0 && (
                <div style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
                  Latest: {sessions[0]?.subject}
                </div>
              )}
            </>
          )}
          <button className="dashboard__card-action">View Sessions →</button>
        </section>

        <section 
          className="dashboard__card dashboard__card--clickable"
          onClick={handleViewReports}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => e.key === 'Enter' && handleViewReports()}
        >
          <h2 className="dashboard__card-title">📊 Attendance Reports</h2>
          {loading ? (
            <p className="dashboard__card-text">Loading reports...</p>
          ) : (
            <p className="dashboard__card-text">
              Track attendance across <strong>{stats.totalSessions}</strong> sessions
            </p>
          )}
          <button className="dashboard__card-action">View Reports →</button>
        </section>
      </main>
    </div>
  );
}

export default FacultyDashboard;
