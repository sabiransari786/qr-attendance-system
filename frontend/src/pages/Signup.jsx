import { useMemo, useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { registerStudent } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import Toast from "../components/Toast";
import { DEPARTMENTS, SEMESTERS, SECTIONS } from "../config/dummyData";
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
 *
 * Purpose:
 * - Allow new students to register into the system
 * - Validate input and check for duplicate entries
 * - Create student account via backend
 *
 * Security Note:
 * - Students can sign up
 * - Faculty and Admin accounts are created by Admin only
 * - Backend performs validation and duplicate checks
 */

function Signup() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);

  // Form state
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

  // UI state
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /**
   * Check if all form fields are filled
   */
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

  /**
   * Handle input field changes
   */
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Toggle password visibility
   */
  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  /**
   * Toggle confirm password visibility
   */
  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  /**
   * Handle form submission
   * - Validates all fields
   * - Checks password match
   * - Sends registration data to backend
   * - Backend checks for duplicates
   * - Redirects to login on success
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    // Validation: Check if all fields are filled
    if (isFormIncomplete) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    // Validation: Check password match
    if (formValues.password !== formValues.confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter your password.");
      return;
    }

    // Validation: Minimum password length
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
      // Prepare registration payload
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

      // Send registration request to backend
      // Backend will check for duplicate email/rollNumber
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
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="auth__objects" aria-hidden="true">
        <span className="auth__object auth__object--sphere" />
        <span className="auth__object auth__object--ring" />
        <span className="auth__object auth__object--cube" />
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
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        aria-labelledby="signup-title"
      >
        {/* Card Header */}
        <motion.header
          className="signup__header"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 id="signup-title" className="signup__title" variants={fadeInUp}>
            Sign Up
          </motion.h1>
          <motion.p className="signup__subtitle" variants={fadeInUp}>
            Create a student account to access the QR-Based Attendance System.
          </motion.p>
        </motion.header>

        {/* Registration Form */}
        <motion.form className="signup__form" onSubmit={handleSubmit} noValidate>
          {/* Full Name Field */}
          <motion.div className="signup__form-group" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
            <label className="signup__label" htmlFor="fullName">
              Full Name
            </label>
            <motion.input
              id="fullName"
              name="fullName"
              type="text"
              className="signup__input"
              placeholder="Enter your full name"
              value={formValues.fullName}
              onChange={handleChange}
              autoComplete="name"
              disabled={isSubmitting}
              required
              whileFocus={{ boxShadow: '0 0 0 3px rgba(49, 156, 181, 0.3)', transition: { duration: 0.2 } }}
            />
          </motion.div>

          {/* Email Field */}
          <motion.div className="signup__form-group" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
            <label className="signup__label" htmlFor="email">
              Email Address
            </label>
            <motion.input
              id="email"
              name="email"
              type="email"
              className="signup__input"
              placeholder="Enter your email"
              value={formValues.email}
              onChange={handleChange}
              autoComplete="email"
              disabled={isSubmitting}
              required
              whileFocus={{ boxShadow: '0 0 0 3px rgba(49, 156, 181, 0.3)', transition: { duration: 0.2 } }}
            />
          </motion.div>

          {/* Roll Number Field */}
          <motion.div className="signup__form-group" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
            <label className="signup__label" htmlFor="rollNumber">
              Roll Number / Student ID
            </label>
            <motion.input
              id="rollNumber"
              name="rollNumber"
              type="text"
              className="signup__input"
              placeholder="Enter your roll number or student ID"
              value={formValues.rollNumber}
              onChange={handleChange}
              autoComplete="off"
              disabled={isSubmitting}
              required
              whileFocus={{ boxShadow: '0 0 0 3px rgba(49, 156, 181, 0.3)', transition: { duration: 0.2 } }}
            />
          </motion.div>

          {/* Contact Number Field */}
          <motion.div className="signup__form-group" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.33, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
            <label className="signup__label" htmlFor="contactNumber">
              Contact Number
            </label>
            <motion.input
              id="contactNumber"
              name="contactNumber"
              type="tel"
              className="signup__input"
              placeholder="Enter your 10-digit contact number"
              value={formValues.contactNumber}
              onChange={handleChange}
              autoComplete="tel"
              disabled={isSubmitting}
              required
              whileFocus={{ boxShadow: '0 0 0 3px rgba(49, 156, 181, 0.3)', transition: { duration: 0.2 } }}
            />
          </motion.div>

          {/* Department, Semester, Section Row */}
          <motion.div className="signup__form-group" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
            <label className="signup__label" htmlFor="department">
              Department
            </label>
            <select
              id="department"
              name="department"
              className="signup__input"
              value={formValues.department}
              onChange={handleChange}
              disabled={isSubmitting}
              style={{ cursor: 'pointer' }}
            >
              <option value="">-- Select Department --</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </motion.div>

          <motion.div
            style={{ display: 'flex', gap: '1rem' }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="signup__form-group" style={{ flex: 1 }}>
              <label className="signup__label" htmlFor="semester">Semester</label>
              <select
                id="semester"
                name="semester"
                className="signup__input"
                value={formValues.semester}
                onChange={handleChange}
                disabled={isSubmitting}
                style={{ cursor: 'pointer' }}
              >
                <option value="">-- Semester --</option>
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="signup__form-group" style={{ flex: 1 }}>
              <label className="signup__label" htmlFor="section">Section</label>
              <select
                id="section"
                name="section"
                className="signup__input"
                value={formValues.section}
                onChange={handleChange}
                disabled={isSubmitting}
                style={{ cursor: 'pointer' }}
              >
                <option value="">-- Section --</option>
                {SECTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </motion.div>

          {/* Password Field */}
          <motion.div className="signup__form-group" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
            <label className="signup__label" htmlFor="password">
              Password
            </label>
            <div className="signup__password-wrapper">
              <motion.input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                className="signup__input"
                placeholder="Create a password (min. 6 characters)"
                value={formValues.password}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={isSubmitting}
                required
                whileFocus={{ boxShadow: '0 0 0 3px rgba(49, 156, 181, 0.3)', transition: { duration: 0.2 } }}
              />
              <motion.button
                type="button"
                className="signup__password-toggle"
                onClick={handleTogglePassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex="-1"
                whileHover={{ scale: 1.15, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
                whileTap={{ scale: 0.9 }}
              >
                <span style={{ fontSize: '22px' }}>
                  {showPassword ? '😊' : '🫣'}
                </span>
              </motion.button>
            </div>
          </motion.div>

          {/* Confirm Password Field */}
          <motion.div className="signup__form-group" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.47, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
            <label className="signup__label" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="signup__password-wrapper">
              <motion.input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                className="signup__input"
                placeholder="Re-enter your password"
                value={formValues.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={isSubmitting}
                required
                whileFocus={{ boxShadow: '0 0 0 3px rgba(49, 156, 181, 0.3)', transition: { duration: 0.2 } }}
              />
              <motion.button
                type="button"
                className="signup__password-toggle"
                onClick={handleToggleConfirmPassword}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                tabIndex="-1"
                whileHover={{ scale: 1.15, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
                whileTap={{ scale: 0.9 }}
              >
                <span style={{ fontSize: '22px' }}>
                  {showConfirmPassword ? '😊' : '🫣'}
                </span>
              </motion.button>
            </div>
          </motion.div>

          {/* Error Message */}
          {errorMessage && (
            <motion.p 
              className="signup__message signup__message--error" 
              role="alert"
            initial={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {errorMessage}
            </motion.p>
          )}

          {/* Action Buttons */}
          <motion.div 
            className="signup__buttons"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.52, duration: 0.4 }}
          >
            <motion.button
              className="signup__button signup__button--primary"
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              variants={buttonHover}
              whileHover={!isSubmitting ? "hover" : ""}
              whileTap={!isSubmitting ? buttonTap : {}}
            >
              {isSubmitting ? "Registering..." : "Register"}
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
            <motion.div
              style={{ display: 'inline' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/login" className="signup__link">
                Login here
              </Link>
            </motion.div>
          </p>
        </motion.div>
      </motion.section>
    </motion.div>
  );
}

export default Signup;

