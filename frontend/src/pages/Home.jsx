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
            <h3 className="home__feature-title">QR-Based Attendance Marking</h3>
            <p className="home__feature-description">
              Instructors generate unique QR codes for each class session. Students scan the code
              to instantly mark their attendance with precise timestamps.
            </p>
          </div>

          <div className="home__feature-card">
            <h3 className="home__feature-title">Role-Based Access</h3>
            <p className="home__feature-description">
              Different access levels for administrators, faculty, and students. Each role has
              dedicated functionality and views tailored to their needs.
            </p>
          </div>

          <div className="home__feature-card">
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
            <h3 className="home__about-card-title">System Overview</h3>
            <p className="home__about-card-text">
              Our QR-Based Attendance System is a comprehensive solution designed to modernize 
              attendance tracking in educational institutions. It replaces traditional manual 
              roll calls with an automated, accurate, and efficient process using QR code technology.
            </p>
          </div>

          <div className="home__about-card">
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
            <h3 className="home__about-card-title">Security & Privacy</h3>
            <p className="home__about-card-text">
              All data is encrypted and stored securely on centralized servers. Role-based access 
              control ensures that only authorized personnel can view sensitive information. The system 
              complies with data protection standards and institutional policies.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
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

