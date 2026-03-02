import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import '../styles/legal.css';

function TermsAndConditions() {
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
          <FileText size={32} className="legal__icon" />
          <h1 className="legal__title">Terms &amp; Conditions</h1>
          <p className="legal__updated">Last updated: March 1, 2026</p>
        </div>

        <div className="legal__content">
          <section className="legal__section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using the QR Attendance Tracking System ("the Platform"), you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use the Platform.
            </p>
          </section>

          <section className="legal__section">
            <h2>2. Description of Service</h2>
            <p>
              The QR Attendance Tracking System is a web-based platform designed for academic institutions to manage and track student attendance using QR code technology. The Platform provides features including but not limited to:
            </p>
            <ul>
              <li>QR code-based attendance marking</li>
              <li>Real-time attendance tracking and reports</li>
              <li>Student and faculty dashboard management</li>
              <li>Session management and scheduling</li>
              <li>Attendance history and analytics</li>
            </ul>
          </section>

          <section className="legal__section">
            <h2>3. User Accounts</h2>
            <p>
              To use certain features of the Platform, you must register for an account. You agree to provide accurate, current, and complete information during registration and to keep your account information updated.
            </p>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account.
            </p>
          </section>

          <section className="legal__section">
            <h2>4. User Responsibilities</h2>
            <ul>
              <li>You must only mark attendance for yourself and not on behalf of others.</li>
              <li>You must not share QR codes or authentication credentials with other users.</li>
              <li>You must not attempt to manipulate or falsify attendance records.</li>
              <li>You must not use automated tools to interact with the Platform.</li>
              <li>You must comply with your institution's attendance policies.</li>
            </ul>
          </section>

          <section className="legal__section">
            <h2>5. Academic Integrity</h2>
            <p>
              The Platform includes mechanisms to detect suspicious activity such as proxy attendance, location spoofing, and device manipulation. Any violation of academic integrity policies may result in account suspension and referral to institutional authorities.
            </p>
          </section>

          <section className="legal__section">
            <h2>6. Data Collection &amp; Usage</h2>
            <p>
              We collect and process personal data as described in our <Link to="/privacy" className="legal__link">Privacy Policy</Link>. By using the Platform, you consent to such collection and processing.
            </p>
          </section>

          <section className="legal__section">
            <h2>7. Intellectual Property</h2>
            <p>
              All content, features, and functionality of the Platform, including but not limited to text, graphics, logos, and software, are the exclusive property of the QR Attendance team and are protected by intellectual property laws.
            </p>
          </section>

          <section className="legal__section">
            <h2>8. Limitation of Liability</h2>
            <p>
              The Platform is provided "as is" without any warranties. We shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use the Platform, including but not limited to loss of data or inaccurate attendance records.
            </p>
          </section>

          <section className="legal__section">
            <h2>9. Modifications</h2>
            <p>
              We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. Continued use of the Platform after changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section className="legal__section">
            <h2>10. Termination</h2>
            <p>
              We may suspend or terminate your access to the Platform at any time, with or without cause, and with or without notice. Upon termination, your right to use the Platform will immediately cease.
            </p>
          </section>

          <section className="legal__section">
            <h2>11. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at <a href="mailto:qrattendancemanagement@gmail.com" className="legal__link">qrattendancemanagement@gmail.com</a>.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
}

export default TermsAndConditions;
