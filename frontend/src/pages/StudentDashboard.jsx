import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { logout } from "../services/api";
import "../styles/dashboard.css";

function StudentDashboard() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

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

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">👨‍🎓 Student Dashboard</h1>
          <p className="dashboard__subtitle">
            Welcome back, <strong>{user?.name}</strong>! Track your attendance and view your academic records.
          </p>
        </div>
        <button
          className="dashboard__button dashboard__button--secondary"
          type="button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      <main className="dashboard__grid" aria-label="Student overview">
        {/* Today's Attendance Card */}
        <section 
          className="dashboard__card dashboard__card--clickable"
          onClick={() => navigate("/attendance-history")}
          role="button"
          tabIndex={0}
        >
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: '1.5rem',
            opacity: 0.9
          }}>
            📅
          </div>
          <h2 className="dashboard__card-title">Today's Attendance</h2>
          <p className="dashboard__card-text">
            No attendance recorded yet. Check back later for today's sessions.
          </p>
          <div style={{
            marginTop: 'auto',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(49, 156, 181, 0.2)'
          }}>
            <button 
              className="dashboard__card-action"
              onClick={() => navigate("/attendance-history")}
            >
              View Details →
            </button>
          </div>
        </section>

        {/* Attendance History Card */}
        <section 
          className="dashboard__card dashboard__card--clickable"
          onClick={() => navigate("/attendance-history")}
          role="button"
          tabIndex={0}
        >
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: '1.5rem',
            opacity: 0.9
          }}>
            📊
          </div>
          <h2 className="dashboard__card-title">Attendance History</h2>
          <p className="dashboard__card-text">
            View your complete attendance records across all subjects and track your overall attendance percentage.
          </p>
          <div style={{
            marginTop: 'auto',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(49, 156, 181, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{
                fontSize: '0.9rem',
                color: 'var(--color-text-secondary)'
              }}>
                Class attendance records
              </span>
              <button 
                className="dashboard__card-action"
                onClick={() => navigate("/attendance-history")}
              >
                View →
              </button>
            </div>
          </div>
        </section>

        {/* Scan QR Card */}
        <section className="dashboard__card dashboard__card--disabled">
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: '1.5rem',
            opacity: 0.5
          }}>
            📱
          </div>
          <h2 className="dashboard__card-title" style={{ opacity: 0.7 }}>Scan QR Code</h2>
          <p className="dashboard__card-text" style={{ opacity: 0.7 }}>
            QR code scanning will be enabled for active class sessions. A dedicated interface will be provided.
          </p>
          <div style={{
            marginTop: 'auto',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(49, 156, 181, 0.1)'
          }}>
            <button 
              className="dashboard__card-action" 
              disabled
              style={{ opacity: 0.4, cursor: 'not-allowed' }}
            >
              Coming Soon →
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default StudentDashboard;
