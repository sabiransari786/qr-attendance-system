import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Cookie } from 'lucide-react';
import '../styles/legal.css';

function CookiePolicy() {
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
          <Cookie size={32} className="legal__icon" />
          <h1 className="legal__title">Cookie Policy</h1>
          <p className="legal__updated">Last updated: March 1, 2026</p>
        </div>

        <div className="legal__content">
          <section className="legal__section">
            <h2>1. What Are Cookies?</h2>
            <p>
              Cookies are small text files placed on your device when you visit a website. They are widely used to make websites work efficiently and to provide information to the site owners.
            </p>
          </section>

          <section className="legal__section">
            <h2>2. How We Use Cookies</h2>
            <p>The QR Attendance Tracking System uses cookies and similar technologies for the following purposes:</p>
            
            <h3>Essential Cookies</h3>
            <p>These cookies are necessary for the Platform to function properly. They include:</p>
            <ul>
              <li><strong>Authentication tokens:</strong> To keep you securely logged in during your session</li>
              <li><strong>Session data:</strong> To maintain your session state and preferences</li>
              <li><strong>Security tokens:</strong> To prevent cross-site request forgery (CSRF) attacks</li>
            </ul>

            <h3>Functional Cookies</h3>
            <p>These cookies enhance your experience:</p>
            <ul>
              <li><strong>Theme preference:</strong> Remembering your dark/light mode choice</li>
              <li><strong>Language settings:</strong> Storing your preferred language</li>
              <li><strong>UI state:</strong> Remembering sidebar collapse state and other UI preferences</li>
            </ul>

            <h3>Analytics Cookies</h3>
            <p>These help us understand how users interact with the Platform:</p>
            <ul>
              <li><strong>Page views:</strong> Which pages are visited most frequently</li>
              <li><strong>Feature usage:</strong> Which features are used and how often</li>
              <li><strong>Performance data:</strong> Page load times and error rates</li>
            </ul>
          </section>

          <section className="legal__section">
            <h2>3. Session Storage</h2>
            <p>
              In addition to cookies, we use browser Session Storage to store authentication data temporarily. This data is automatically cleared when you close your browser tab, providing an additional layer of security.
            </p>
          </section>

          <section className="legal__section">
            <h2>4. Third-Party Cookies</h2>
            <p>
              We may use third-party services that set their own cookies, such as analytics providers. These cookies are governed by the respective third party's cookie policy.
            </p>
          </section>

          <section className="legal__section">
            <h2>5. Managing Cookies</h2>
            <p>You can control cookies through your browser settings:</p>
            <ul>
              <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
              <li><strong>Firefox:</strong> Settings → Privacy &amp; Security → Cookies</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
              <li><strong>Edge:</strong> Settings → Cookies and Site Permissions</li>
            </ul>
            <p>
              Please note that disabling essential cookies may prevent you from using certain features of the Platform, including logging in and marking attendance.
            </p>
          </section>

          <section className="legal__section">
            <h2>6. Cookie Duration</h2>
            <div className="legal__table-wrapper">
              <table className="legal__table">
                <thead>
                  <tr>
                    <th>Cookie Type</th>
                    <th>Duration</th>
                    <th>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Session Cookie</td>
                    <td>Browser session</td>
                    <td>Authentication &amp; security</td>
                  </tr>
                  <tr>
                    <td>Theme Preference</td>
                    <td>1 year</td>
                    <td>Remember dark/light mode</td>
                  </tr>
                  <tr>
                    <td>Analytics</td>
                    <td>30 days</td>
                    <td>Usage statistics</td>
                  </tr>
                  <tr>
                    <td>Cookie Consent</td>
                    <td>1 year</td>
                    <td>Remember your cookie choice</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="legal__section">
            <h2>7. Updates to This Policy</h2>
            <p>
              We may update this Cookie Policy as our use of cookies evolves. Any changes will be posted on this page with an updated revision date.
            </p>
          </section>

          <section className="legal__section">
            <h2>8. Contact Us</h2>
            <p>
              If you have questions about our use of cookies, email us at <a href="mailto:qrattendancemanagement@gmail.com" className="legal__link">qrattendancemanagement@gmail.com</a>.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
}

export default CookiePolicy;
