import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, LifeBuoy, Mail, MessageCircle, HelpCircle, Clock, BookOpen } from "lucide-react";
import "../styles/legal.css";

function Support() {
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
          <LifeBuoy size={32} className="legal__icon" />
          <h1 className="legal__title">Support</h1>
          <p className="legal__updated">Need help? We're here for you.</p>
        </div>

        <div className="legal__content">
          <section className="legal__section">
            <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <HelpCircle size={20} style={{ color: "var(--color-primary, #319cb5)" }} />
              Common Issues & Solutions
            </h2>

            <div style={{ marginBottom: "1.25rem" }}>
              <p style={{ fontWeight: 600, marginBottom: "0.3rem" }}>I can't log in to my account</p>
              <p style={{ opacity: 0.85 }}>
                Make sure you're using the correct email and password. If you forgot your password, use the "Forgot Password" link on the login page. If your account hasn't been pre-approved by admin, you won't be able to register.
              </p>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <p style={{ fontWeight: 600, marginBottom: "0.3rem" }}>QR code scan failed</p>
              <p style={{ opacity: 0.85 }}>
                Ensure your camera has permission to access the browser. The QR code may have expired — ask your faculty to regenerate it. Also check that you're in the same department and semester as the session.
              </p>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <p style={{ fontWeight: 600, marginBottom: "0.3rem" }}>My attendance didn't get marked</p>
              <p style={{ opacity: 0.85 }}>
                If you scanned the QR but attendance wasn't recorded, you may have been outside the allowed location radius, or the QR expired before the server processed your request. You can submit a manual attendance request from your dashboard.
              </p>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <p style={{ fontWeight: 600, marginBottom: "0.3rem" }}>I see "Branch mismatch" or "Semester mismatch" error</p>
              <p style={{ opacity: 0.85 }}>
                This means the session belongs to a different department or semester than yours. You can only attend sessions that match your enrolled branch and current semester. Contact admin if your details are incorrect.
              </p>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <p style={{ fontWeight: 600, marginBottom: "0.3rem" }}>Profile shows wrong department or semester</p>
              <p style={{ opacity: 0.85 }}>
                Department and semester are managed by the admin. Contact your admin to update these details in the approval system.
              </p>
            </div>
          </section>

          <section className="legal__section">
            <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <BookOpen size={20} style={{ color: "var(--color-primary, #319cb5)" }} />
              Guides
            </h2>
            <p>
              Check out our detailed guide to learn how to use the system:
            </p>
            <ul>
              <li>
                <Link to="/student-guide" style={{ color: "var(--color-primary, #319cb5)", fontWeight: 600 }}>Student Guide</Link> — Step-by-step instructions for students on registration, QR scanning, attendance history, and more.
              </li>
            </ul>
          </section>

          <section className="legal__section">
            <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Mail size={20} style={{ color: "var(--color-primary, #319cb5)" }} />
              Contact Us
            </h2>
            <p>If the above solutions don't resolve your issue, you can reach out through these channels:</p>
            <ul>
              <li><strong>Email:</strong> <a href="mailto:qrattendancemanagement@gmail.com" style={{ color: 'var(--color-primary, #319cb5)' }}>qrattendancemanagement@gmail.com</a></li>
              <li><strong>Admin Office:</strong> Contact your institution's IT department or system administrator directly.</li>
              <li><strong>Faculty:</strong> For attendance-related queries, reach out to your class faculty.</li>
            </ul>
          </section>

          <section className="legal__section">
            <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Clock size={20} style={{ color: "var(--color-primary, #319cb5)" }} />
              Response Time
            </h2>
            <p>
              We aim to respond to all support queries within 24–48 hours during working days. For urgent issues (e.g., locked accounts), please contact the admin directly.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
}

export default Support;
