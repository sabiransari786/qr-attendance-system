import "../styles/home.css";

function Home() {
  return (
    <div className="home">
      {/* Introduction / Hero Section */}
      <section className="home__hero">
        <div className="home__hero-content">
          <h2 className="home__hero-title">Welcome to QR-Based Attendance System</h2>
          <p className="home__hero-description">
            A secure and efficient solution for managing student attendance in academic institutions.
            This system streamlines attendance tracking through QR code scanning, reducing manual errors
            and providing centralized record management for colleges and schools.
          </p>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="home__features" aria-labelledby="features-heading">
        <div className="home__features-header">
          <h2 id="features-heading" className="home__features-title">
            Key Features
          </h2>
        </div>

        <div className="home__features-grid">
          <div className="home__feature-card">
            <div style={{ 
              fontSize: '3rem', 
              marginBottom: '1.5rem',
              opacity: 0.85
            }}>
              📱
            </div>
            <h3 className="home__feature-title">QR-Based Attendance Marking</h3>
            <p className="home__feature-description">
              Instructors generate unique QR codes for each class session. Students scan the code
              to instantly mark their attendance with precise timestamps.
            </p>
          </div>

          <div className="home__feature-card">
            <div style={{ 
              fontSize: '3rem', 
              marginBottom: '1.5rem',
              opacity: 0.85
            }}>
              🔐
            </div>
            <h3 className="home__feature-title">Role-Based Access</h3>
            <p className="home__feature-description">
              Different access levels for administrators, faculty, and students. Each role has
              dedicated functionality and views tailored to their needs.
            </p>
          </div>

          <div className="home__feature-card">
            <div style={{ 
              fontSize: '3rem', 
              marginBottom: '1.5rem',
              opacity: 0.85
            }}>
              ☁️
            </div>
            <h3 className="home__feature-title">Secure and Centralized System</h3>
            <p className="home__feature-description">
              All attendance records are stored securely in a centralized database, enabling easy
              reporting, auditing, and long-term academic history maintenance.
            </p>
          </div>
        </div>
      </section>

      {/* About System Section */}
      <section className="home__about" aria-labelledby="about-heading">
        <div className="home__about-header">
          <h2 id="about-heading" className="home__about-title">About Our System</h2>
        </div>
        
        <div className="home__about-grid">
          <div className="home__about-card">
            <div style={{ 
              fontSize: '2.5rem', 
              marginBottom: '1.2rem',
              opacity: 0.9
            }}>
              🎯
            </div>
            <h3 className="home__about-card-title">System Overview</h3>
            <p className="home__about-card-text">
              Our QR-Based Attendance System is a comprehensive solution designed to modernize 
              attendance tracking in educational institutions. It replaces traditional manual 
              roll calls with an automated, accurate, and efficient process using QR code technology.
            </p>
          </div>

          <div className="home__about-card">
            <div style={{ 
              fontSize: '2.5rem', 
              marginBottom: '1.2rem',
              opacity: 0.9
            }}>
              ✨
            </div>
            <h3 className="home__about-card-title">Key Benefits</h3>
            <p className="home__about-card-text">
              • Reduces attendance marking time from minutes to seconds<br/>
              • Minimizes fraudulent attendance entries<br/>
              • Provides real-time attendance insights<br/>
              • Generates comprehensive reports and analytics<br/>
              • Improves institutional transparency
            </p>
          </div>

          <div className="home__about-card">
            <div style={{ 
              fontSize: '2.5rem', 
              marginBottom: '1.2rem',
              opacity: 0.9
            }}>
              🛡️
            </div>
            <h3 className="home__about-card-title">Security & Privacy</h3>
            <p className="home__about-card-text">
              All data is encrypted and stored securely on centralized servers. Role-based access 
              control ensures that only authorized personnel can view sensitive information. The system 
              complies with data protection standards and institutional policies.
            </p>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="home__stats" aria-labelledby="stats-heading">
        <div className="home__stats-header">
          <h2 id="stats-heading" className="home__stats-title">System Impact</h2>
          <p className="home__stats-subtitle">Real-world metrics from institutions using our system</p>
        </div>
        
        <div className="home__stats-grid">
          <div className="home__stat-card">
            <div className="home__stat-number">15+</div>
            <div className="home__stat-label">Institutions</div>
            <p className="home__stat-description">Trusted by colleges and schools</p>
          </div>

          <div className="home__stat-card">
            <div className="home__stat-number">5,000+</div>
            <div className="home__stat-label">Students</div>
            <p className="home__stat-description">Daily active users</p>
          </div>

          <div className="home__stat-card">
            <div className="home__stat-number">99.9%</div>
            <div className="home__stat-label">Accuracy</div>
            <p className="home__stat-description">Attendance tracking precision</p>
          </div>

          <div className="home__stat-card">
            <div className="home__stat-number">45sec</div>
            <div className="home__stat-label">Avg. Time</div>
            <p className="home__stat-description">To mark attendance</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="home__workflow" aria-labelledby="workflow-heading">
        <div className="home__workflow-header">
          <h2 id="workflow-heading" className="home__workflow-title">How It Works</h2>
          <p className="home__workflow-subtitle">Simple 3-step process</p>
        </div>

        <div className="home__workflow-container">
          <div className="home__workflow-step">
            <div className="home__workflow-number">1</div>
            <div className="home__workflow-icon">👨‍🏫</div>
            <h3 className="home__workflow-step-title">Faculty Generates QR</h3>
            <p className="home__workflow-description">Instructors create unique QR codes for each class session with a single click</p>
          </div>

          <div className="home__workflow-arrow">→</div>

          <div className="home__workflow-step">
            <div className="home__workflow-number">2</div>
            <div className="home__workflow-icon">📱</div>
            <h3 className="home__workflow-step-title">Students Scan Code</h3>
            <p className="home__workflow-description">Students use mobile devices to scan the QR code during class</p>
          </div>

          <div className="home__workflow-arrow">→</div>

          <div className="home__workflow-step">
            <div className="home__workflow-number">3</div>
            <div className="home__workflow-icon">✅</div>
            <h3 className="home__workflow-step-title">Record Attendance</h3>
            <p className="home__workflow-description">System instantly logs attendance with timestamp and marks it in the database</p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="home__testimonials" aria-labelledby="testimonials-heading">
        <div className="home__testimonials-header">
          <h2 id="testimonials-heading" className="home__testimonials-title">What Users Say</h2>
          <p className="home__testimonials-subtitle">Feedback from institutions using our system</p>
        </div>

        <div className="home__testimonials-grid">
          <div className="home__testimonial-card">
            <div className="home__testimonial-stars">⭐⭐⭐⭐⭐</div>
            <p className="home__testimonial-text">
              "This system has revolutionized our attendance tracking. It's accurate, fast, and students love using it. Management has become so much easier!"
            </p>
            <div className="home__testimonial-author">
              <div className="home__author-avatar">DR</div>
              <div className="home__author-info">
                <p className="home__author-name">Dr. Ramesh Kumar</p>
                <p className="home__author-role">Dean, Tech Institute</p>
              </div>
            </div>
          </div>

          <div className="home__testimonial-card">
            <div className="home__testimonial-stars">⭐⭐⭐⭐⭐</div>
            <p className="home__testimonial-text">
              "As a faculty member, I appreciate the simplicity. No more manual roll calls, no disputes about attendance. Takes less than a minute!"
            </p>
            <div className="home__testimonial-author">
              <div className="home__author-avatar">PM</div>
              <div className="home__author-info">
                <p className="home__author-name">Prof. Meera Sharma</p>
                <p className="home__author-role">Computer Science Faculty</p>
              </div>
            </div>
          </div>

          <div className="home__testimonial-card">
            <div className="home__testimonial-stars">⭐⭐⭐⭐⭐</div>
            <p className="home__testimonial-text">
              "Transparent and efficient! I can see my attendance records in real-time. The system is very reliable and never fails."
            </p>
            <div className="home__testimonial-author">
              <div className="home__author-avatar">AJ</div>
              <div className="home__author-info">
                <p className="home__author-name">Arjun Joshi</p>
                <p className="home__author-role">Student, 4th Year</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="home__cta">
        <div className="home__cta-content">
          <h2 className="home__cta-title">Ready to Transform Your Attendance System?</h2>
          <p className="home__cta-description">
            Join institutions worldwide that have streamlined their attendance tracking with our revolutionary QR-based system.
          </p>
          <div className="home__cta-buttons">
            <button className="home__cta-button home__cta-button--primary">
              Get Started Now →
            </button>
            <button className="home__cta-button home__cta-button--secondary">
              Learn More
            </button>
          </div>
        </div>
      </section>
      <footer className="home__footer">
        <div className="home__footer-content">
          <div className="home__footer-item">
            <b><p className="home__footer-text">College Name: Academic Institution</p></b>
          </div>
          <div className="home__footer-item">
            <p className="home__footer-text">QR-Based Attendance Tracking System</p>
          </div>
          <div className="home__footer-item">
            <p className="home__footer-text">Year: 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;

