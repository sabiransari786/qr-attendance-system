import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

function FacultyDashboard() {
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">Faculty Dashboard</h1>
          <p className="dashboard__subtitle">
            Manage classes, generate sessions, and monitor attendance reports.
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

      <main className="dashboard__grid" aria-label="Faculty overview">
        <section className="dashboard__card dashboard__card--disabled">
          <h2 className="dashboard__card-title">Generate QR</h2>
          <p className="dashboard__card-text">Coming soon. QR generation will be available here.</p>
        </section>

        <section className="dashboard__card">
          <h2 className="dashboard__card-title">Class Sessions</h2>
          <p className="dashboard__card-text">Your scheduled and past sessions will appear here.</p>
        </section>

        <section className="dashboard__card">
          <h2 className="dashboard__card-title">Attendance Reports</h2>
          <p className="dashboard__card-text">Reports and exports will be accessible here.</p>
        </section>
      </main>
    </div>
  );
}

export default FacultyDashboard;
