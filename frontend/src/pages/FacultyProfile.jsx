import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import { fadeInUp, staggerContainer } from "../animations/animationConfig";
import "../styles/profile.css";

/**
 * TeacherProfile Component
 * Displays teacher/faculty profile information
 */
function TeacherProfile() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  const handleBack = () => {
    navigate("/faculty-dashboard");
  };

  return (
    <motion.div
      className="profile-container"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="profile__objects" aria-hidden="true">
        <span className="profile__object profile__object--sphere" />
        <span className="profile__object profile__object--ring" />
        <span className="profile__object profile__object--cube" />
      </div>
      <button className="profile__back-btn" onClick={handleBack}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back
      </button>

      <div className="profile__card">
        <div className="profile__header">
          <div className="profile__avatar">
            <span>{user?.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="profile__header-info">
            <h1 className="profile__name">{user?.name}</h1>
            <p className="profile__role">Faculty Member</p>
          </div>
        </div>

        <div className="profile__content">
          <section className="profile__section">
            <h2 className="profile__section-title">Basic Information</h2>
            <div className="profile__field">
              <label className="profile__label">Full Name</label>
              <p className="profile__value">{user?.name}</p>
            </div>

            <div className="profile__field">
              <label className="profile__label">Email Address</label>
              <p className="profile__value">{user?.email}</p>
            </div>

            <div className="profile__field">
              <label className="profile__label">Role</label>
              <p className="profile__value profile__badge">Faculty</p>
            </div>
          </section>

          <section className="profile__section">
            <h2 className="profile__section-title">Account Status</h2>
            <div className="profile__field">
              <label className="profile__label">Status</label>
              <p className="profile__value">
                <span className="profile__status-badge profile__status-badge--active">Active</span>
              </p>
            </div>

            <div className="profile__field">
              <label className="profile__label">Member Since</label>
              <p className="profile__value">February 2026</p>
            </div>
          </section>

          <section className="profile__section">
            <h2 className="profile__section-title">Security</h2>
            <div className="profile__field">
              <label className="profile__label">Password</label>
              <p className="profile__value" style={{ opacity: 0.7 }}>••••••••</p>
            </div>
            <button
              onClick={() => navigate("/forgot-password")}
              style={{
                marginTop: "0.75rem",
                padding: "0.6rem 1.4rem",
                borderRadius: "8px",
                border: "1px solid rgba(99,102,241,0.5)",
                background: "rgba(99,102,241,0.12)",
                color: "inherit",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 600,
                letterSpacing: "0.01em",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.25)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.12)")}
            >
              🔑 Change Password via OTP
            </button>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.78rem", opacity: 0.55, lineHeight: 1.4 }}>
              An OTP will be sent to your registered email to verify your identity before resetting.
            </p>
          </section>

          <section className="profile__section">
            <h2 className="profile__section-title">Statistics</h2>
            <div className="profile__stats">
              <div className="profile__stat">
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.9 }}>📚</div>
                <p className="profile__stat-value">0</p>
                <p className="profile__stat-label">Sessions Created</p>
              </div>
              <div className="profile__stat">
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.9 }}>👥</div>
                <p className="profile__stat-value">0</p>
                <p className="profile__stat-label">Students Managed</p>
              </div>
              <div className="profile__stat">
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.9 }}>✓</div>
                <p className="profile__stat-value">0</p>
                <p className="profile__stat-label">Attendance Records</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
}

export default TeacherProfile;
