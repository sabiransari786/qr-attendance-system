import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { logout } from "../services/api";
import "../styles/dashboard.css";

function FacultyDashboard() {
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

  const handleViewProfile = () => {
    navigate("/faculty-profile");
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
