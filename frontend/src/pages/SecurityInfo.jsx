import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Eye, RefreshCw, MapPin, Fingerprint } from "lucide-react";
import "../styles/legal.css";

function SecurityInfo() {
  return (
    <motion.div
      className="legal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="legal__container">
        <Link to="/" className="legal__back">
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        <div className="legal__header">
          <Shield size={32} className="legal__icon" />
          <h1 className="legal__title">Security</h1>
          <p className="legal__updated">How we keep your data and attendance records safe.</p>
        </div>

        <div className="legal__content">
          <section className="legal__section">
            <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Lock size={20} style={{ color: "var(--color-primary, #319cb5)" }} />
              Authentication & Access Control
            </h2>
            <p>
              Every user must authenticate with email and password before accessing any feature. Passwords are hashed using industry-standard bcrypt with salt rounds, ensuring they are never stored in plain text.
            </p>
            <ul>
              <li>JWT-based authentication with token expiry for secure session management.</li>
              <li>Role-based access control — students, faculty, and admins each have restricted access to only their respective features.</li>
              <li>Admin-only endpoints are protected with an additional authorization layer.</li>
              <li>Pre-approval system: only users approved by admin can register, preventing unauthorized sign-ups.</li>
            </ul>
          </section>

          <section className="legal__section">
            <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <RefreshCw size={20} style={{ color: "var(--color-primary, #319cb5)" }} />
              QR Code Security
            </h2>
            <p>
              QR codes are the backbone of our attendance system and are protected with multiple security layers:
            </p>
            <ul>
              <li><strong>Time-limited:</strong> Each QR code expires after a configurable duration (1–5 minutes or custom), preventing reuse.</li>
              <li><strong>Auto-refresh:</strong> QR codes rotate periodically so screenshots become invalid.</li>
              <li><strong>One-time scan:</strong> Each student can only mark attendance once per session per day — duplicates are blocked.</li>
              <li><strong>Server-generated:</strong> QR tokens are generated on the server, never on the client, preventing forgery.</li>
            </ul>
          </section>

          <section className="legal__section">
            <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <MapPin size={20} style={{ color: "var(--color-primary, #319cb5)" }} />
              Location Verification
            </h2>
            <p>
              To prevent proxy attendance, the system uses geolocation verification:
            </p>
            <ul>
              <li>Faculty sets their location and an allowed radius when generating the QR code.</li>
              <li>Students must be within the specified radius to successfully mark attendance.</li>
              <li>GPS coordinates are validated server-side to prevent location spoofing.</li>
            </ul>
          </section>

          <section className="legal__section">
            <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Fingerprint size={20} style={{ color: "var(--color-primary, #319cb5)" }} />
              Anti-Fraud Measures
            </h2>
            <ul>
              <li><strong>Branch & Semester Check:</strong> Students can only mark attendance for sessions in their own department and current semester.</li>
              <li><strong>Suspicious Activity Detection:</strong> Faculty can view flagged suspicious scans (e.g., rapid repeated attempts).</li>
              <li><strong>Activity Logging:</strong> All admin operations are logged with timestamps for full audit trails.</li>
              <li><strong>Manual Request Review:</strong> Missed attendance requests require faculty approval — no automatic grants.</li>
            </ul>
          </section>

          <section className="legal__section">
            <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Eye size={20} style={{ color: "var(--color-primary, #319cb5)" }} />
              Data Privacy
            </h2>
            <ul>
              <li>Passwords are never exposed in API responses.</li>
              <li>QR tokens are not returned to the frontend — only expiry times.</li>
              <li>Personal data is only accessible to authorized roles (admin, own profile).</li>
              <li>Profile photos are stored securely with access restricted to authenticated users.</li>
            </ul>
            <p>
              For full details, see our <Link to="/privacy" style={{ color: "var(--color-primary, #319cb5)" }}>Privacy Policy</Link>.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
}

export default SecurityInfo;
