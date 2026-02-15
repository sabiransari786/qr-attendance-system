import { useMemo, useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerStudent } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import Toast from "../components/Toast";
import "../styles/auth.css";

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
    <div className="signup__container">
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

      <section className="signup__card signup__box" aria-labelledby="signup-title">
        {/* Card Header */}
        <header className="signup__header">
          <h1 id="signup-title" className="signup__title">Sign Up</h1>
          <p className="signup__subtitle">
            Create a student account to access the QR-Based Attendance System.
          </p>
        </header>

        {/* Registration Form */}
        <form className="signup__form" onSubmit={handleSubmit} noValidate>
          {/* Full Name Field */}
          <div className="signup__form-group">
            <label className="signup__label" htmlFor="fullName">
              Full Name
            </label>
            <input
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
            />
          </div>

          {/* Email Field */}
          <div className="signup__form-group">
            <label className="signup__label" htmlFor="email">
              Email Address
            </label>
            <input
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
            />
          </div>

          {/* Roll Number Field */}
          <div className="signup__form-group">
            <label className="signup__label" htmlFor="rollNumber">
              Roll Number / Student ID
            </label>
            <input
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
            />
          </div>

          {/* Contact Number Field */}
          <div className="signup__form-group">
            <label className="signup__label" htmlFor="contactNumber">
              Contact Number
            </label>
            <input
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
            />
          </div>

          {/* Password Field */}
          <div className="signup__form-group">
            <label className="signup__label" htmlFor="password">
              Password
            </label>
            <div className="signup__password-wrapper">
              <input
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
              />
              <button
                type="button"
                className="signup__password-toggle"
                onClick={handleTogglePassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex="-1"
              >
                <span style={{ fontSize: '22px' }}>
                  {showPassword ? '😊' : '🫣'}
                </span>
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="signup__form-group">
            <label className="signup__label" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="signup__password-wrapper">
              <input
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
              />
              <button
                type="button"
                className="signup__password-toggle"
                onClick={handleToggleConfirmPassword}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                tabIndex="-1"
              >
                <span style={{ fontSize: '22px' }}>
                  {showConfirmPassword ? '😊' : '🫣'}
                </span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <p className="signup__message signup__message--error" role="alert">
              {errorMessage}
            </p>
          )}

          {/* Action Buttons */}
          <div className="signup__buttons">
            <button
              className="signup__button signup__button--primary"
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? "Registering..." : "Register"}
            </button>
          </div>
        </form>

        {/* Already have an account link */}
        <div className="signup__footer">
          <p className="signup__footer-text">
            Already have an account?{" "}
            <Link to="/login" className="signup__link">
              Login here
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default Signup;

