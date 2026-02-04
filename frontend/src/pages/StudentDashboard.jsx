import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

function StudentDashboard() {
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">Student Dashboard</h1>
          <p className="dashboard__subtitle">
            Welcome! Track your attendance and stay updated with class sessions.
          </p>
        </div>
        <button
          className="dashboard__button dashboard__button--secondary"
          type="button"
          onClick={() => navigate("/login")}
        >
          Logout
        </button>
      </header>

      <main className="dashboard__grid" aria-label="Student overview">
        <section className="dashboard__card">
          <h2 className="dashboard__card-title">Today’s Attendance</h2>
          <p className="dashboard__card-text">No attendance recorded yet.</p>
        </section>

        <section className="dashboard__card">
          <h2 className="dashboard__card-title">Attendance History</h2>
          <p className="dashboard__card-text">Your recent attendance logs will appear here.</p>
        </section>

        <section className="dashboard__card dashboard__card--disabled">
          <h2 className="dashboard__card-title">Scan QR</h2>
          <p className="dashboard__card-text">Coming soon. QR scanning will be enabled for sessions.</p>
        </section>
      </main>
    </div>
  );
}

export default StudentDashboard;
