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
        <section className="dashboard__card dashboard__card--clickable">
          <div style={{ 
            fontSize: '2.5rem', 
            marginBottom: '1rem',
            opacity: 0.9
          }}>
            📅
          </div>
          <h2 className="dashboard__card-title">Today's Attendance</h2>
          <p className="dashboard__card-text">
            No attendance recorded yet. Check back later for today's sessions.
          </p>
          <button className="dashboard__card-action" style={{ marginTop: 'auto' }}>
            View Details →
          </button>
        </section>

        {/* Attendance History Card */}
        <section className="dashboard__card dashboard__card--clickable">
          <div style={{ 
            fontSize: '2.5rem', 
            marginBottom: '1rem',
            opacity: 0.9
          }}>
            📊
          </div>
          <h2 className="dashboard__card-title">Attendance History</h2>
          <p className="dashboard__card-text">
            View your attendance records across all subjects and track your attendance percentage.
          </p>
          <button className="dashboard__card-action" style={{ marginTop: 'auto' }}>
            View History →
          </button>
        </section>

        {/* Scan QR Card */}
        <section className="dashboard__card dashboard__card--disabled">
          <div style={{ 
            fontSize: '2.5rem', 
            marginBottom: '1rem',
            opacity: 0.5
          }}>
            📱
          </div>
          <h2 className="dashboard__card-title">Scan QR Code</h2>
          <p className="dashboard__card-text">
            QR code scanning will be enabled for active class sessions. A dedicated interface will be provided.
          </p>
          <button className="dashboard__card-action" style={{ marginTop: 'auto', opacity: 0.5 }}>
            Coming Soon →
          </button>
        </section>
      </main>
    </div>
  );
}

export default StudentDashboard;
