import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { logout } from "../services/api";
import "../styles/dashboard.css";

function AdminDashboard() {
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
          <h1 className="dashboard__title">Admin Dashboard</h1>
          <p className="dashboard__subtitle">
            Welcome, {user?.name}! Oversee platform access, departments, and system-level reporting.
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

      <main className="dashboard__grid" aria-label="Admin overview">
        <section className="dashboard__card">
          <h2 className="dashboard__card-title">Manage Users</h2>
          <p className="dashboard__card-text">User provisioning and roles will be managed here.</p>
        </section>

        <section className="dashboard__card">
          <h2 className="dashboard__card-title">Manage Departments/Courses</h2>
          <p className="dashboard__card-text">Department and course data will be configured here.</p>
        </section>

        <section className="dashboard__card">
          <h2 className="dashboard__card-title">System Reports</h2>
          <p className="dashboard__card-text">System health and analytics dashboards will appear here.</p>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
