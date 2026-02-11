import "../styles/home.css";

function Home() {
  return (
    <div className="home">
      <div className="home__objects" aria-hidden="true">
        <span className="home__object home__object--sphere" />
        <span className="home__object home__object--torus" />
        <span className="home__object home__object--diamond" />
        <span className="home__object home__object--chip" />
      </div>
      {/* Introduction / Hero Section */}
      <section className="home__hero">
        <div className="home__hero-inner">
          <div className="home__hero-content">
            <span className="home__hero-badge">QR Attendance Platform</span>
            <h2 className="home__hero-title">Attendance, But Make It Effortless</h2>
            <p className="home__hero-description">
              A secure and efficient solution for managing student attendance in academic institutions.
              This system streamlines attendance tracking through QR code scanning, reducing manual errors
              and providing centralized record management for colleges and schools.
            </p>
            <div className="home__hero-actions">
              <button className="home__hero-action home__hero-action--primary">Start a Demo</button>
              <button className="home__hero-action home__hero-action--ghost">View Features</button>
            </div>
            <div className="home__hero-metrics">
              <div>
                <span className="home__hero-metric">99.9%</span>
                <span className="home__hero-metric-label">Accuracy</span>
              </div>
              <div>
                <span className="home__hero-metric">45s</span>
                <span className="home__hero-metric-label">Avg. Check-in</span>
              </div>
              <div>
                <span className="home__hero-metric">15+</span>
                <span className="home__hero-metric-label">Institutions</span>
              </div>
            </div>
          </div>

          <div className="home__hero-visual" aria-hidden="true">
            <div className="home__orb home__orb--one" />
            <div className="home__orb home__orb--two" />
            <div className="home__orb home__orb--three" />
            <div className="home__float-card">
              <div className="home__float-card-header">
                <span className="home__float-chip">Live Session</span>
                <span className="home__float-time">08:30 AM</span>
              </div>
              <div className="home__float-title">BCA - Data Structures</div>
              <div className="home__float-subtitle">Room C-204 · QR Active</div>
              <div className="home__float-bar">
                <span className="home__float-bar-fill" />
              </div>
              <div className="home__float-row">
                <span>Present</span>
                <strong>54/60</strong>
              </div>
            </div>
          </div>
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
          <div className="attendee-card">
            <div className="attendee-card-inner">
              <div className="attendee-card-front">
                <div style={{ 
                  fontSize: '4rem', 
                  marginBottom: '1rem',
                  opacity: 0.9
                }}>
                  📱
                </div>
                <span className="home__feature-badge">Core Feature</span>
                <h3 className="home__feature-title" style={{marginTop: '1rem'}}>QR-Based Attendance</h3>
              </div>
              <div className="attendee-card-back">
                <p className="home__feature-description">
                  Instructors generate unique QR codes for each class session. Students scan to instantly mark attendance.
                </p>
                <div className="home__feature-highlights" style={{marginTop: '20px'}}>
                  <span className="home__feature-tag">⚡ Real-time</span>
                  <span className="home__feature-tag">✓ Automated</span>
                  <span className="home__feature-tag">📊 Accurate</span>
                </div>
                <a href="#" className="home__feature-link" style={{marginTop: '20px'}}>
                  Learn more →
                </a>
              </div>
            </div>
          </div>

          <div className="attendee-card">
            <div className="attendee-card-inner">
              <div className="attendee-card-front">
                <div style={{ 
                  fontSize: '4rem', 
                  marginBottom: '1rem',
                  opacity: 0.9
                }}>
                  🔐
                </div>
                <span className="home__feature-badge home__feature-badge--security">Security</span>
                <h3 className="home__feature-title" style={{marginTop: '1rem'}}>Role-Based Access</h3>
              </div>
              <div className="attendee-card-back">
                <p className="home__feature-description">
                  Different access levels for administrators, faculty, and students with dedicated functionality.
                </p>
                <div className="home__feature-highlights" style={{marginTop: '20px'}}>
                  <span className="home__feature-tag">🔒 Secure</span>
                  <span className="home__feature-tag">👥 Multi-role</span>
                  <span className="home__feature-tag">🎯 Customized</span>
                </div>
                <a href="#" className="home__feature-link" style={{marginTop: '20px'}}>
                  Learn more →
                </a>
              </div>
            </div>
          </div>

          <div className="attendee-card">
            <div className="attendee-card-inner">
              <div className="attendee-card-front">
                <div style={{ 
                  fontSize: '4rem', 
                  marginBottom: '1rem',
                  opacity: 0.9
                }}>
                  ☁️
                </div>
                <span className="home__feature-badge home__feature-badge--cloud">Cloud</span>
                <h3 className="home__feature-title" style={{marginTop: '1rem'}}>Centralized Data</h3>
              </div>
              <div className="attendee-card-back">
                <p className="home__feature-description">
                  All attendance records stored securely in a centralized database for easy reporting and auditing.
                </p>
                <div className="home__feature-highlights" style={{marginTop: '20px'}}>
                  <span className="home__feature-tag">💾 Reliable</span>
                  <span className="home__feature-tag">📈 Scalable</span>
                  <span className="home__feature-tag">🔄 Sync</span>
                </div>
                <a href="#" className="home__feature-link" style={{marginTop: '20px'}}>
                  Learn more →
                </a>
              </div>
            </div>
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
    </div>
  );
}

export default Home;

