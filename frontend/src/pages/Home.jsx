import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Smartphone, Zap, Check, BarChart3, KeyRound, Lock, Users, Target, Cloud, HardDrive, TrendingUp, RefreshCw, UserCheck, CheckCircle, Star, ArrowLeft } from 'lucide-react';
import "../styles/home.css";
import {
  fadeInUp,
  fadeInDown,
  staggerContainer,
  buttonHover,
  buttonTap,
  scaleIn,
} from '../animations/animationConfig';

function Home() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const isAuthenticated = authContext?.isAuthenticated || false;
  const userRole = authContext?.user?.role;

  const getDashboardPath = () => {
    if (userRole === 'student') return '/student-dashboard';
    if (userRole === 'faculty') return '/faculty-dashboard';
    if (userRole === 'admin') return '/admin-dashboard';
    return '/';
  };

  const scrollToFeatures = () => {
    document.getElementById('features-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <motion.div className="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
      <div className="home__objects" aria-hidden="true">
        <span className="home__object home__object--sphere" />
        <span className="home__object home__object--torus" />
        <span className="home__object home__object--diamond" />
        <span className="home__object home__object--chip" />
      </div>
      
      {/* Introduction / Hero Section */}
      <section className="home__hero">
        <div className="home__hero-inner">
          <motion.div className="home__hero-content"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.span className="home__hero-badge" variants={fadeInDown}>
              QR Attendance Platform
            </motion.span>
            <motion.h2 className="home__hero-title" variants={fadeInUp}>
              Simple for Students,<br />
              <span className="home__hero-title-highlight">Powerful for Institutions.</span>
            </motion.h2>
            <motion.p className="home__hero-description" variants={fadeInUp}>
              A secure and efficient solution for managing student attendance in academic institutions.
              This system streamlines attendance tracking through QR code scanning, reducing manual errors
              and providing centralized record management for colleges and schools.
            </motion.p>
            <motion.div className="home__hero-actions" variants={fadeInUp}>
              {isAuthenticated && userRole ? (
                <motion.button
                  className="home__hero-action home__hero-action--primary home__hero-action--dashboard"
                  variants={buttonHover}
                  whileHover="hover"
                  whileTap={buttonTap}
                  onClick={() => navigate(getDashboardPath())}
                >
                  <ArrowLeft size={18} />
                  Go to Dashboard
                </motion.button>
              ) : (
                <motion.button
                  className="home__hero-action home__hero-action--primary"
                  variants={buttonHover}
                  whileHover="hover"
                  whileTap={buttonTap}
                  onClick={() => navigate('/login')}
                >
                  Start a Demo
                </motion.button>
              )}
              <motion.button
                className="home__hero-action home__hero-action--ghost"
                variants={buttonHover}
                whileHover="hover"
                whileTap={buttonTap}
                onClick={scrollToFeatures}
              >
                View Features
              </motion.button>
            </motion.div>
            <motion.div className="home__hero-metrics" variants={fadeInUp}>
              <motion.div variants={scaleIn}>
                <span className="home__hero-metric">99.9%</span>
                <span className="home__hero-metric-label">Accuracy</span>
              </motion.div>
              <motion.div variants={scaleIn}>
                <span className="home__hero-metric">45s</span>
                <span className="home__hero-metric-label">Avg. Check-in</span>
              </motion.div>
              <motion.div variants={scaleIn}>
                <span className="home__hero-metric">15+</span>
                <span className="home__hero-metric-label">Institutions</span>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div 
            className="home__hero-visual"
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 160, damping: 22, delay: 0.25 }}
            aria-hidden="true"
          >
            <div className="home__orb home__orb--one" />
            <div className="home__orb home__orb--two" />
            <div className="home__orb home__orb--three" />
            <motion.div
              className="home__float-card"
              whileHover={{ y: -10, scale: 1.02, boxShadow: '0 24px 64px rgba(49, 156, 181, 0.28)', transition: { type: 'spring', stiffness: 300, damping: 24 } }}
            >
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
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="home__features" aria-labelledby="features-heading">
        <motion.div className="home__features-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 id="features-heading" className="home__features-title">
            Key Features
          </h2>
        </motion.div>

        <motion.div
          className="home__features-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerContainer}
        >
          <motion.div className="attendee-card" variants={fadeInUp}>
            <div className="attendee-card-inner">
              <div className="attendee-card-front">
                <div style={{ 
                  fontSize: '4rem', 
                  marginBottom: '1rem',
                  opacity: 0.9
                }}>
                  <Smartphone size={56} />
                </div>
                <span className="home__feature-badge">Core Feature</span>
                <h3 className="home__feature-title" style={{marginTop: '1rem'}}>QR-Based Attendance</h3>
              </div>
              <div className="attendee-card-back">
                <p className="home__feature-description">
                  Instructors generate unique QR codes for each class session. Students scan to instantly mark attendance.
                </p>
                <div className="home__feature-highlights" style={{marginTop: '20px'}}>
                  <span className="home__feature-tag"><Zap size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />Real-time</span>
                  <span className="home__feature-tag"><Check size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />Automated</span>
                  <span className="home__feature-tag"><BarChart3 size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />Accurate</span>
                </div>
                <a href="#" className="home__feature-link" style={{marginTop: '20px'}}>
                  Learn more →
                </a>
              </div>
            </div>
          </motion.div>

          <motion.div className="attendee-card" variants={fadeInUp}>
            <div className="attendee-card-inner">
              <div className="attendee-card-front">
                <div style={{ 
                  fontSize: '4rem', 
                  marginBottom: '1rem',
                  opacity: 0.9
                }}>
                  <KeyRound size={56} />
                </div>
                <span className="home__feature-badge home__feature-badge--security">Security</span>
                <h3 className="home__feature-title" style={{marginTop: '1rem'}}>Role-Based Access</h3>
              </div>
              <div className="attendee-card-back">
                <p className="home__feature-description">
                  Different access levels for administrators, faculty, and students with dedicated functionality.
                </p>
                <div className="home__feature-highlights" style={{marginTop: '20px'}}>
                  <span className="home__feature-tag"><Lock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />Secure</span>
                  <span className="home__feature-tag"><Users size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />Multi-role</span>
                  <span className="home__feature-tag"><Target size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />Customized</span>
                </div>
                <a href="#" className="home__feature-link" style={{marginTop: '20px'}}>
                  Learn more →
                </a>
              </div>
            </div>
          </motion.div>

          <motion.div className="attendee-card" variants={fadeInUp}>
            <div className="attendee-card-inner">
              <div className="attendee-card-front">
                <div style={{ 
                  fontSize: '4rem', 
                  marginBottom: '1rem',
                  opacity: 0.9
                }}>
                  <Cloud size={56} />
                </div>
                <span className="home__feature-badge home__feature-badge--cloud">Cloud</span>
                <h3 className="home__feature-title" style={{marginTop: '1rem'}}>Centralized Data</h3>
              </div>
              <div className="attendee-card-back">
                <p className="home__feature-description">
                  All attendance records stored securely in a centralized database for easy reporting and auditing.
                </p>
                <div className="home__feature-highlights" style={{marginTop: '20px'}}>
                  <span className="home__feature-tag"><HardDrive size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />Reliable</span>
                  <span className="home__feature-tag"><TrendingUp size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />Scalable</span>
                  <span className="home__feature-tag"><RefreshCw size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />Sync</span>
                </div>
                <a href="#" className="home__feature-link" style={{marginTop: '20px'}}>
                  Learn more →
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Statistics Section */}
      <motion.section
        className="home__stats"
        aria-labelledby="stats-heading"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="home__stats-header"
          initial={{ y: 30, opacity: 0, filter: 'blur(4px)' }}
          whileInView={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 id="stats-heading" className="home__stats-title">System Impact</h2>
          <p className="home__stats-subtitle">Real-world metrics from institutions using our system</p>
        </motion.div>
        
        <motion.div
          className="home__stats-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerContainer}
        >
          <motion.div className="home__stat-card" variants={scaleIn}>
            <div className="home__stat-number">15+</div>
            <div className="home__stat-label">Institutions</div>
            <p className="home__stat-description">Trusted by colleges and schools</p>
          </motion.div>

          <motion.div className="home__stat-card" variants={scaleIn}>
            <div className="home__stat-number">5,000+</div>
            <div className="home__stat-label">Students</div>
            <p className="home__stat-description">Daily active users</p>
          </motion.div>

          <motion.div className="home__stat-card" variants={scaleIn}>
            <div className="home__stat-number">99.9%</div>
            <div className="home__stat-label">Accuracy</div>
            <p className="home__stat-description">Attendance tracking precision</p>
          </motion.div>

          <motion.div className="home__stat-card" variants={scaleIn}>
            <div className="home__stat-number">45sec</div>
            <div className="home__stat-label">Avg. Time</div>
            <p className="home__stat-description">To mark attendance</p>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section
        className="home__workflow"
        aria-labelledby="workflow-heading"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="home__workflow-header"
          initial={{ y: 30, opacity: 0, filter: 'blur(4px)' }}
          whileInView={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 id="workflow-heading" className="home__workflow-title">How It Works</h2>
          <p className="home__workflow-subtitle">Simple 3-step process</p>
        </motion.div>

        <motion.div
          className="home__workflow-container"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerContainer}
        >
          <motion.div className="home__workflow-step" variants={fadeInUp}>
            <div className="home__workflow-number">1</div>
            <div className="home__workflow-icon"><UserCheck size={32} /></div>
            <h3 className="home__workflow-step-title">Faculty Generates QR</h3>
            <p className="home__workflow-description">Instructors create unique QR codes for each class session with a single click</p>
          </motion.div>

          <div className="home__workflow-arrow">→</div>

          <motion.div className="home__workflow-step" variants={fadeInUp}>
            <div className="home__workflow-number">2</div>
            <div className="home__workflow-icon"><Smartphone size={32} /></div>
            <h3 className="home__workflow-step-title">Students Scan Code</h3>
            <p className="home__workflow-description">Students use mobile devices to scan the QR code during class</p>
          </motion.div>

          <div className="home__workflow-arrow">→</div>

          <motion.div className="home__workflow-step" variants={fadeInUp}>
            <div className="home__workflow-number">3</div>
            <div className="home__workflow-icon"><CheckCircle size={32} /></div>
            <h3 className="home__workflow-step-title">Record Attendance</h3>
            <p className="home__workflow-description">System instantly logs attendance with timestamp and marks it in the database</p>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section
        className="home__testimonials"
        aria-labelledby="testimonials-heading"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="home__testimonials-header"
          initial={{ y: 30, opacity: 0, filter: 'blur(4px)' }}
          whileInView={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 id="testimonials-heading" className="home__testimonials-title">What Users Say</h2>
          <p className="home__testimonials-subtitle">Feedback from institutions using our system</p>
        </motion.div>

        <motion.div
          className="home__testimonials-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerContainer}
        >
          <motion.div className="home__testimonial-card" variants={fadeInUp}>
            <div className="home__testimonial-stars" style={{ display: 'flex', gap: '0.15rem' }}>{[...Array(5)].map((_, i) => <Star key={i} size={18} fill="#f59e0b" color="#f59e0b" />)}</div>
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
          </motion.div>

          <motion.div className="home__testimonial-card" variants={fadeInUp}>
            <div className="home__testimonial-stars" style={{ display: 'flex', gap: '0.15rem' }}>{[...Array(5)].map((_, i) => <Star key={i} size={18} fill="#f59e0b" color="#f59e0b" />)}</div>
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
          </motion.div>

          <motion.div className="home__testimonial-card" variants={fadeInUp}>
            <div className="home__testimonial-stars" style={{ display: 'flex', gap: '0.15rem' }}>{[...Array(5)].map((_, i) => <Star key={i} size={18} fill="#f59e0b" color="#f59e0b" />)}</div>
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
          </motion.div>
        </motion.div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="home__cta"
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ type: 'spring', stiffness: 160, damping: 22 }}
      >
        <motion.div className="home__cta-content">
          <h2 className="home__cta-title">Ready to Transform Your Attendance System?</h2>
          <p className="home__cta-description">
            Join institutions worldwide that have streamlined their attendance tracking with our revolutionary QR-based system.
          </p>
          <motion.div className="home__cta-buttons">
            <motion.button
              className="home__cta-button home__cta-button--primary"
              variants={buttonHover}
              whileHover="hover"
              whileTap={buttonTap}
              onClick={() => navigate(isAuthenticated && userRole ? getDashboardPath() : '/signup')}
            >
              {isAuthenticated && userRole ? '← Back to Dashboard' : 'Get Started Now →'}
            </motion.button>
            <motion.button
              className="home__cta-button home__cta-button--secondary"
              variants={buttonHover}
              whileHover="hover"
              whileTap={buttonTap}
              onClick={scrollToFeatures}
            >
              Learn More
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.section>
    </motion.div>
  );
}

export default Home;


