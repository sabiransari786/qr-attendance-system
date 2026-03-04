import { useMemo, useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, User, Mail, Hash, Phone, Building2, BookOpen, Users, Lock, ShieldCheck, UserPlus, ArrowRight } from 'lucide-react';
import { registerStudent } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import Toast from "../components/Toast";
import { DEPARTMENTS, SEMESTERS, SECTIONS } from "../config/formOptions";
import "../styles/auth.css";
import {
  fadeInUp,
  staggerContainer,
  buttonHover,
  buttonTap,
} from "../animations/animationConfig";

/**
 * Signup Component
 *
 * FR7: Student Registration
 * FR8: Duplicate Registration Prevention
 */

function Signup() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);

  const [formValues, setFormValues] = useState({
    fullName: "",
    email: "",
    rollNumber: "",
    contactNumber: "",
    department: "",
    semester: "",
    section: "",
    password: "",
    confirmPassword: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptCookies, setAcceptCookies] = useState(false);

  const isFormIncomplete = useMemo(() => {
    return (
      !formValues.fullName.trim() ||
      !formValues.email.trim() ||
      !formValues.rollNumber.trim() ||
      !formValues.contactNumber.trim() ||
      !formValues.department ||
      !formValues.semester ||
      !formValues.password.trim() ||
      !formValues.confirmPassword.trim()
    );
  }, [formValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleTogglePassword = () => setShowPassword(!showPassword);
  const handleToggleConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  // Password strength calculator
  const passwordStrength = useMemo(() => {
    const pw = formValues.password;
    if (!pw) return { score: 0, label: "", color: "transparent" };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 2) return { score: 1, label: "Weak", color: "#ef4444" };
    if (score <= 4) return { score: 2, label: "Medium", color: "#f59e0b" };
    return { score: 3, label: "Strong", color: "#22c55e" };
  }, [formValues.password]);

  const filledCount = [
    formValues.fullName, formValues.email, formValues.rollNumber,
    formValues.contactNumber, formValues.department, formValues.semester,
    formValues.password, formValues.confirmPassword
  ].filter(v => v.trim?.() || v).length;
  const progress = (filledCount / 8) * 100;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (isFormIncomplete) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    if (!acceptTerms) {
      setErrorMessage("Please accept the Terms & Conditions to continue.");
      return;
    }

    if (!acceptCookies) {
      setErrorMessage("Please accept the Cookie Policy to continue.");
      return;
    }

    if (formValues.password !== formValues.confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter your password.");
      return;
    }

    if (formValues.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (!/^\d{10}$/.test(formValues.contactNumber.trim())) {
      setErrorMessage("Please enter a valid 10-digit contact number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formValues.fullName.trim(),
        email: formValues.email.trim(),
        student_id: formValues.rollNumber.trim(),
        contact_number: formValues.contactNumber.trim(),
        department: formValues.department || undefined,
        semester: formValues.semester || undefined,
        section: formValues.section || undefined,
        password: formValues.password,
        role: "student",
      };

      await registerStudent(payload);

      // Show success toast
      setShowSuccessToast(true);

      // Reset form
      setFormValues({
        fullName: "",
        email: "",
        rollNumber: "",
        contactNumber: "",
        department: "",
        semester: "",
        section: "",
        password: "",
        confirmPassword: "",
      });

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      // Handle backend errors (e.g., duplicate entry)
      const errorMsg = error.data?.message || error.message;
      setErrorMessage(errorMsg || "Registration failed. Please try again.");
      authContext?.setAuthError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="signup__container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Background Objects */}
      <div className="auth__objects" aria-hidden="true">
        <span className="auth__object auth__object--sphere" />
        <span className="auth__object auth__object--ring" />
        <span className="auth__object auth__object--cube" />
      </div>

      {/* Floating Particles */}
      <div className="auth__particles" aria-hidden="true">
        {[...Array(6)].map((_, i) => (
          <span key={i} className={`auth__particle auth__particle--${i + 1}`} />
        ))}
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <Toast
          message="Account created successfully! Redirecting to login..."
          type="success"
          duration={2000}
          onClose={() => setShowSuccessToast(false)}
        />
      )}

      <motion.section
        className="signup__card signup__box"
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        aria-labelledby="signup-title"
      >
        {/* Animated border glow */}
        <div className="auth__card-glow" aria-hidden="true" />

        {/* Card Header with Brand Icon */}
        <motion.header
          className="signup__header"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 id="signup-title" className="signup__title" variants={fadeInUp}>
            Create Account
          </motion.h1>
          <motion.div className="auth__title-accent" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }} />
          <motion.p className="signup__subtitle" variants={fadeInUp}>
            Register as a student to access the QR-Based Attendance System
          </motion.p>
        </motion.header>

        {/* Progress Bar */}
        <motion.div
          className="auth__progress-bar"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <div className="auth__progress-track">
            <motion.div
              className="auth__progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <span className="auth__progress-label">{filledCount}/8 fields completed</span>
        </motion.div>

        {/* Registration Form */}
        <motion.form className="signup__form" onSubmit={handleSubmit} noValidate>

          {/* Section: Personal Info */}
          <div className="auth__form-section">
            <span className="auth__form-section-label">Personal Information</span>

            {/* Full Name Field */}
            <motion.div className={`signup__form-group auth__input-group ${focusedField === 'fullName' ? 'auth__input-group--focused' : ''} ${formValues.fullName ? 'auth__input-group--filled' : ''}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.4 }}>
              <label className="signup__label" htmlFor="fullName">Full Name</label>
              <div className="auth__input-wrapper">
                <span className="auth__input-icon"><User size={18} /></span>
                <motion.input
                  id="fullName" name="fullName" type="text"
                  className="signup__input auth__input--with-icon"
                  placeholder="Enter your full name"
                  value={formValues.fullName} onChange={handleChange}
                  onFocus={() => setFocusedField('fullName')} onBlur={() => setFocusedField(null)}
                  autoComplete="name" disabled={isSubmitting} required
                />
              </div>
            </motion.div>

            {/* Email Field */}
            <motion.div className={`signup__form-group auth__input-group ${focusedField === 'email' ? 'auth__input-group--focused' : ''} ${formValues.email ? 'auth__input-group--filled' : ''}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19, duration: 0.4 }}>
              <label className="signup__label" htmlFor="email">Email Address</label>
              <div className="auth__input-wrapper">
                <span className="auth__input-icon"><Mail size={18} /></span>
                <motion.input
                  id="email" name="email" type="email"
                  className="signup__input auth__input--with-icon"
                  placeholder="Enter your email"
                  value={formValues.email} onChange={handleChange}
                  onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                  autoComplete="email" disabled={isSubmitting} required
                />
              </div>
            </motion.div>

            {/* Roll Number & Contact Row */}
            <motion.div className="auth__form-row" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26, duration: 0.4 }}>
              <div className={`signup__form-group auth__input-group ${focusedField === 'rollNumber' ? 'auth__input-group--focused' : ''} ${formValues.rollNumber ? 'auth__input-group--filled' : ''}`}>
                <label className="signup__label" htmlFor="rollNumber">Roll Number</label>
                <div className="auth__input-wrapper">
                  <span className="auth__input-icon"><Hash size={18} /></span>
                  <motion.input
                    id="rollNumber" name="rollNumber" type="text"
                    className="signup__input auth__input--with-icon"
                    placeholder="Student ID"
                    value={formValues.rollNumber} onChange={handleChange}
                    onFocus={() => setFocusedField('rollNumber')} onBlur={() => setFocusedField(null)}
                    autoComplete="off" disabled={isSubmitting} required
                  />
                </div>
              </div>
              <div className={`signup__form-group auth__input-group ${focusedField === 'contactNumber' ? 'auth__input-group--focused' : ''} ${formValues.contactNumber ? 'auth__input-group--filled' : ''}`}>
                <label className="signup__label" htmlFor="contactNumber">Contact Number</label>
                <div className="auth__input-wrapper">
                  <span className="auth__input-icon"><Phone size={18} /></span>
                  <motion.input
                    id="contactNumber" name="contactNumber" type="tel"
                    className="signup__input auth__input--with-icon"
                    placeholder="10-digit number"
                    value={formValues.contactNumber} onChange={handleChange}
                    onFocus={() => setFocusedField('contactNumber')} onBlur={() => setFocusedField(null)}
                    autoComplete="tel" disabled={isSubmitting} required
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Section: Academic Info */}
          <div className="auth__form-section">
            <span className="auth__form-section-label">Academic Details</span>

            {/* Department */}
            <motion.div className={`signup__form-group auth__input-group ${focusedField === 'department' ? 'auth__input-group--focused' : ''} ${formValues.department ? 'auth__input-group--filled' : ''}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.33, duration: 0.4 }}>
              <label className="signup__label" htmlFor="department">Department</label>
              <div className="auth__input-wrapper">
                <span className="auth__input-icon"><Building2 size={18} /></span>
                <select
                  id="department" name="department"
                  className="signup__input auth__input--with-icon auth__select"
                  value={formValues.department} onChange={handleChange}
                  onFocus={() => setFocusedField('department')} onBlur={() => setFocusedField(null)}
                  disabled={isSubmitting}
                >
                  <option value="">-- Select Department --</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </motion.div>

            {/* Semester */}
            <motion.div className={`signup__form-group auth__input-group ${focusedField === 'semester' ? 'auth__input-group--focused' : ''} ${formValues.semester ? 'auth__input-group--filled' : ''}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36, duration: 0.4 }}>
              <label className="signup__label" htmlFor="semester">Semester</label>
              <div className="auth__input-wrapper">
                <span className="auth__input-icon"><BookOpen size={18} /></span>
                <select
                  id="semester" name="semester"
                  className="signup__input auth__input--with-icon auth__select"
                  value={formValues.semester} onChange={handleChange}
                  onFocus={() => setFocusedField('semester')} onBlur={() => setFocusedField(null)}
                  disabled={isSubmitting}
                >
                  <option value="">-- Semester --</option>
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </motion.div>
          </div>

          {/* Section: Security */}
          <div className="auth__form-section">
            <span className="auth__form-section-label">Security</span>

            {/* Password Field */}
            <motion.div className={`signup__form-group auth__input-group ${focusedField === 'password' ? 'auth__input-group--focused' : ''} ${formValues.password ? 'auth__input-group--filled' : ''}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }}>
              <label className="signup__label" htmlFor="password">Password</label>
              <div className="auth__input-wrapper signup__password-wrapper">
                <span className="auth__input-icon"><Lock size={18} /></span>
                <motion.input
                  id="password" name="password"
                  type={showPassword ? "text" : "password"}
                  className="signup__input auth__input--with-icon"
                  placeholder="Min. 6 characters"
                  value={formValues.password} onChange={handleChange}
                  onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
                  autoComplete="new-password" disabled={isSubmitting} required
                />
                <motion.button
                  type="button" className="signup__password-toggle"
                  onClick={handleTogglePassword}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex="-1"
                  whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </motion.button>
              </div>
              {/* Password Strength Meter */}
              {formValues.password && (
                <div style={{ marginTop: "0.5rem" }}>
                  <div style={{ display: "flex", gap: "4px", marginBottom: "0.3rem" }}>
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        style={{
                          flex: 1,
                          height: "4px",
                          borderRadius: "4px",
                          background: passwordStrength.score >= level ? passwordStrength.color : "rgba(148,163,184,0.2)",
                          transition: "background 0.3s ease",
                        }}
                      />
                    ))}
                  </div>
                  <p style={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: passwordStrength.color,
                    letterSpacing: "0.03em",
                    margin: 0,
                  }}>
                    {passwordStrength.label}
                    {passwordStrength.score === 1 && " — Add uppercase, numbers & special characters"}
                    {passwordStrength.score === 2 && " — Try adding special characters (!@#$)"}
                    {passwordStrength.score === 3 && " — Your password is secure"}
                  </p>
                </div>
              )}
            </motion.div>
            <motion.div className={`signup__form-group auth__input-group ${focusedField === 'confirmPassword' ? 'auth__input-group--focused' : ''} ${formValues.confirmPassword ? 'auth__input-group--filled' : ''}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.47, duration: 0.4 }}>
              <label className="signup__label" htmlFor="confirmPassword">Confirm Password</label>
              <div className="auth__input-wrapper signup__password-wrapper">
                <span className="auth__input-icon"><ShieldCheck size={18} /></span>
                <motion.input
                  id="confirmPassword" name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className="signup__input auth__input--with-icon"
                  placeholder="Re-enter your password"
                  value={formValues.confirmPassword} onChange={handleChange}
                  onFocus={() => setFocusedField('confirmPassword')} onBlur={() => setFocusedField(null)}
                  autoComplete="new-password" disabled={isSubmitting} required
                />
                <motion.button
                  type="button" className="signup__password-toggle"
                  onClick={handleToggleConfirmPassword}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  tabIndex="-1"
                  whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                >
                  {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                className="auth__message auth__message--error"
                role="alert"
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="auth__message-icon">!</span>
                <p>{errorMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Terms & Cookies Checkboxes */}
          <motion.div
            className="signup__agreements"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.50, duration: 0.4 }}
          >
            <label className="signup__checkbox-label">
              <input
                type="checkbox"
                className="signup__checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                disabled={isSubmitting}
              />
              <span className="signup__checkbox-custom" />
              <span className="signup__checkbox-text">
                I agree to the <Link to="/terms" target="_blank" rel="noopener noreferrer" className="signup__checkbox-link">Terms & Conditions</Link> and <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="signup__checkbox-link">Privacy Policy</Link>
              </span>
            </label>
            <label className="signup__checkbox-label">
              <input
                type="checkbox"
                className="signup__checkbox"
                checked={acceptCookies}
                onChange={(e) => setAcceptCookies(e.target.checked)}
                disabled={isSubmitting}
              />
              <span className="signup__checkbox-custom" />
              <span className="signup__checkbox-text">
                I accept the use of <Link to="/cookies" target="_blank" rel="noopener noreferrer" className="signup__checkbox-link">Cookies</Link> for a better experience
              </span>
            </label>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            className="signup__buttons"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.52, duration: 0.4 }}
          >
            <motion.button
              className="signup__button signup__button--primary auth__button--enhanced"
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              whileHover={!isSubmitting ? { y: -1, boxShadow: '0 8px 32px rgba(49, 156, 181, 0.3)' } : {}}
              whileTap={!isSubmitting ? { y: -1, scale: 0.98 } : {}}
            >
              <span className="auth__button-content">
                {isSubmitting ? (
                  <>
                    <span className="auth__spinner auth__spinner--small" />
                    Registering...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Create Account
                    <ArrowRight size={16} className="auth__button-arrow" />
                  </>
                )}
              </span>
              {!isSubmitting && <span className="auth__button-shimmer" />}
            </motion.button>
          </motion.div>
        </motion.form>

        {/* Already have an account link */}
        <motion.div 
          className="signup__footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.58, duration: 0.4 }}
        >
          <p className="signup__footer-text">
            Already have an account?{" "}
            <Link to="/login" className="signup__link">
              Sign in here <ArrowRight size={14} style={{ verticalAlign: 'middle', marginLeft: '2px' }} />
            </Link>
          </p>
        </motion.div>
      </motion.section>
    </motion.div>
  );
}

export default Signup;

