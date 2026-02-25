import { useMemo, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from 'framer-motion';
import { login } from "../services/api";
import { ROLE_ROUTES, API_BASE_URL } from "../utils/constants";
import { AuthContext } from "../context/AuthContext";
import LoginSuccessModal from "../components/LoginSuccessModal";
import { fadeInUp, fadeInDown, staggerContainer, buttonHover, buttonTap } from '../animations/animationConfig';
import "../styles/auth.css";

/**
 * Login Component
 *
 * FR1: Secure User Login
 * FR2: User Authentication
 * FR3: Role-Based Access Control
 *
 * Purpose:
 * - Authenticate users with email and password
 * - Receive user role from backend
 * - Redirect to role-specific dashboard
 *
 * Supports:
 * - Students (student role)
 * - Faculty (faculty role)
 * - Admins (admin role)
 */

function Login() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);

  // Form state
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });

  // UI state
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successUserName, setSuccessUserName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Check if form is complete
  const isFormIncomplete = useMemo(() => {
    return !formValues.email.trim() || !formValues.password.trim();
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
   * Handle form submission
   * - Validates form
   * - Sends credentials to backend
   * - Receives role and token
   * - Stores auth context
   * - Redirects based on role
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    // Validation
    if (isFormIncomplete) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await login({
        email: formValues.email.trim(),
        password: formValues.password,
      });

      // Extract token and user data from response
      const token = response?.data?.token || response?.token;
      const userData = response?.data?.user || response?.user;

      if (!token || !userData) {
        setErrorMessage("Invalid response from server. Please try again.");
        return;
      }

      // Update authentication context
      authContext.login(userData, token);

      // Show success modal
      setSuccessUserName(userData.name);
      setShowSuccessModal(true);

      // Determine dashboard route based on role
      const dashboardPath = ROLE_ROUTES[userData.role] || "/";

      // Redirect after modal closes
      setTimeout(() => {
        navigate(dashboardPath);
      }, 3000);
    } catch (error) {
      console.error("Login error:", error);
      const errorMsg = error.data?.message || error.message || "Login failed. Please try again.";
      console.error("Error message:", errorMsg);
      setErrorMessage(errorMsg);
      authContext.setAuthError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div className="login__container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
      <div className="auth__objects" aria-hidden="true">
        <span className="auth__object auth__object--sphere" />
        <span className="auth__object auth__object--ring" />
        <span className="auth__object auth__object--cube" />
      </div>
      {/* Success Modal */}
      {showSuccessModal && (
        <LoginSuccessModal
          userName={successUserName}
          onComplete={() => setShowSuccessModal(false)}
        />
      )}

      <motion.section
        className="login__card login__box"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        aria-labelledby="login-title"
      >
        {/* Card Header */}
        <motion.header className="login__header" variants={staggerContainer} initial="hidden" animate="visible">
          <motion.h1 id="login-title" className="login__title" variants={fadeInUp}>
            Login
          </motion.h1>
          <motion.p className="login__subtitle" variants={fadeInUp}>
            Sign in with your institution credentials to access the QR-Based Attendance System.
          </motion.p>
        </motion.header>

        {/* Login Form */}
        <motion.form className="login__form" onSubmit={handleSubmit} noValidate>
          {/* Email Field */}
          <motion.div className="login__form-group" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
            <label className="login__label" htmlFor="email">
              Email Address
            </label>
            <motion.input
              id="email"
              name="email"
              type="email"
              className="login__input"
              placeholder="Enter your email"
              value={formValues.email}
              onChange={handleChange}
              autoComplete="email"
              disabled={isLoading}
              required
              whileFocus={{ boxShadow: '0 0 0 3px rgba(49, 156, 181, 0.3)', transition: { duration: 0.2 } }}
            />
          </motion.div>

          {/* Password Field */}
          <motion.div className="login__form-group" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, duration: 0.4 }}>
            <div className="login__password-header">
              <label className="login__label" htmlFor="password">
                Password
              </label>
              <Link to="/forgot-password" className="login__forgot-password">
                Forgot Password?
              </Link>
            </div>
            <div className="login__password-wrapper">
              <motion.input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                className="login__input"
                placeholder="Enter your password"
                value={formValues.password}
                onChange={handleChange}
                autoComplete="current-password"
                disabled={isLoading}
                required
                whileFocus={{ boxShadow: '0 0 0 3px rgba(49, 156, 181, 0.3)', transition: { duration: 0.2 } }}
              />
              <motion.button
                type="button"
                className="login__password-toggle"
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

          {/* Error Message */}
          {errorMessage && (
            <motion.p
              className="login__message login__message--error"
              role="alert"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {errorMessage}
            </motion.p>
          )}

          {/* Loading Message */}
          {isLoading && (
            <motion.p
              className="login__message login__message--loading"
              role="status"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: [0, 1], y: 0 }}
              transition={{ duration: 0.3 }}
            >
              Authenticating... Please wait.
            </motion.p>
          )}

          {/* Submit Button */}
          <motion.button
            className="login__button"
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
            variants={buttonHover}
            whileHover={!isLoading ? "hover" : ""}
            whileTap={!isLoading ? buttonTap : {}}
          >
            {isLoading ? "Logging in..." : "Login"}
          </motion.button>
        </motion.form>

        {/* Helper Links */}
        <motion.div className="login__links" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.4 }}>
          <p className="login__link-text">
            New student?{" "}
            <Link to="/signup" className="login__link">
              Sign up
            </Link>
          </p>
        </motion.div>
        
        {/* Debug Info - Only show on network access */}
        {window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && (
          <div style={{
            marginTop: '20px',
            padding: '10px',
            background: '#f0f0f0',
            borderRadius: '4px',
            fontSize: '12px',
            textAlign: 'center',
            color: '#666'
          }}>
            📡 Backend: {API_BASE_URL}
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}

export default Login;

