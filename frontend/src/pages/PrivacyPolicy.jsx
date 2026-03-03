import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import '../styles/legal.css';

function PrivacyPolicy() {
  return (
    <motion.div
      className="legal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="legal__container">
        <Link to="/signup" className="legal__back">
          <ArrowLeft size={18} />
          Back to Signup
        </Link>

        <div className="legal__header">
          <Shield size={32} className="legal__icon" />
          <h1 className="legal__title">Privacy Policy</h1>
          <p className="legal__updated">Last updated: March 1, 2026</p>
        </div>

        <div className="legal__content">
          <section className="legal__section">
            <h2>1. Information We Collect</h2>
            <p>We collect the following types of information when you use the QR Attendance Tracking System:</p>
            <h3>Personal Information</h3>
            <ul>
              <li>Full name, email address, and contact number</li>
              <li>Roll number and academic details (department, semester)</li>
              <li>Profile photo (optional)</li>
              <li>Account credentials (password is stored encrypted)</li>
            </ul>
            <h3>Usage Information</h3>
            <ul>
              <li>Attendance records and timestamps</li>
              <li>Session participation data</li>
              <li>Device information and browser type</li>
              <li>IP address and approximate location during QR scan</li>
            </ul>
          </section>

          <section className="legal__section">
            <h2>2. How We Use Your Information</h2>
            <p>Your information is used to:</p>
            <ul>
              <li>Manage your account and provide Platform services</li>
              <li>Record and verify attendance through QR code scanning</li>
              <li>Generate attendance reports and analytics</li>
              <li>Detect and prevent fraudulent attendance activities</li>
              <li>Send important notifications about sessions and attendance</li>
              <li>Improve Platform performance and user experience</li>
            </ul>
          </section>

          <section className="legal__section">
            <h2>3. Data Storage &amp; Security</h2>
            <p>
              We implement industry-standard security measures to protect your personal data, including encrypted password storage, secure API communication (HTTPS), JWT-based authentication tokens, and session-based access control.
            </p>
            <p>
              Your data is stored in a secure database and is accessible only to authorized personnel and the systems that require it to function.
            </p>
          </section>

          <section className="legal__section">
            <h2>4. Data Sharing</h2>
            <p>We do not sell your personal data. Your information may be shared with:</p>
            <ul>
              <li><strong>Your institution:</strong> Faculty and administrators can view attendance records relevant to their courses and departments.</li>
              <li><strong>Service providers:</strong> Third-party services used for hosting, email, and analytics, bound by confidentiality agreements.</li>
              <li><strong>Legal authorities:</strong> When required by law or to protect the rights and safety of users.</li>
            </ul>
          </section>

          <section className="legal__section">
            <h2>5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Withdraw consent for data processing</li>
              <li>Export your attendance data in a portable format</li>
            </ul>
          </section>

          <section className="legal__section">
            <h2>6. Data Retention</h2>
            <p>
              We retain your personal data for as long as your account is active or as needed to provide services. Attendance records may be retained for the duration required by your academic institution's policies. Upon account deletion, personal data will be removed within 30 days.
            </p>
          </section>

          <section className="legal__section">
            <h2>7. Children's Privacy</h2>
            <p>
              The Platform is intended for use by students aged 16 and above. We do not knowingly collect personal information from children under 16. If we become aware of such collection, we will promptly delete the data.
            </p>
          </section>

          <section className="legal__section">
            <h2>8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify users of significant changes through the Platform or via email. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section className="legal__section">
            <h2>9. Contact Us</h2>
            <p>
              For privacy-related inquiries, contact us at <a href="mailto:qrattendancemanagement@gmail.com" className="legal__link">qrattendancemanagement@gmail.com</a>.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
}

export default PrivacyPolicy;
