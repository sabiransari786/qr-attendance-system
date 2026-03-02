import { useMemo, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Radio, Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
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
 */

function Login() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);

  const [formValues, setFormValues] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successUserName, setSuccessUserName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const isFormIncomplete = useMemo(() => {
    return !formValues.email.trim() || !formValues.password.trim();
  }, [formValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleTogglePassword = () => setShowPassword(!showPassword);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

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

      const token = response?.data?.token || response?.token;
      const userData = response?.data?.user || response?.user;

      if (!token || !userData) {
        setErrorMessage("Invalid response from server. Please try again.");
        return;
      }

      authContext.login(userData, token);
      setSuccessUserName(userData.name);
      setShowSuccessModal(true);

      const dashboardPath = ROLE_ROUTES[userData.role] || "/";
      setTimeout(() => navigate(dashboardPath), 3000);
    } catch (error) {
      console.error("Login error:", error);
      const errorMsg = error.data?.message || error.message || "Login failed. Please try again.";
      setErrorMessage(errorMsg);
      authContext.setAuthError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div className="login__container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
      {/* Animated Background Objects */}
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

      {/* Success Modal */}
      {showSuccessModal && (
        <LoginSuccessModal
          userName={successUserName}
          onComplete={() => setShowSuccessModal(false)}
        />
      )}

      <motion.section
        className="login__card login__box"
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        aria-labelledby="login-title"
      >
        {/* Animated border glow */}
        <div className="auth__card-glow" aria-hidden="true" />

        {/* Card Header */}
        <motion.header className="login__header" variants={staggerContainer} initial="hidden" animate="visible">
          <motion.h1 id="login-title" className="login__title" variants={fadeInUp}>
            Welcome Back
          </motion.h1>
          <motion.div className="auth__title-accent" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }} />
          <motion.p className="login__subtitle" variants={fadeInUp}>
            Sign in to access the QR-Based Attendance System
          </motion.p>
        </motion.header>

        {/* Login Form */}
        <motion.form className="login__form" onSubmit={handleSubmit} noValidate>
          {/* Email Field */}
          <motion.div
            className={`login__form-group auth__input-group ${focusedField === 'email' ? 'auth__input-group--focused' : ''} ${formValues.email ? 'auth__input-group--filled' : ''}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <label className="login__label" htmlFor="email">
              Email Address
            </label>
            <div className="auth__input-wrapper">
              <span className="auth__input-icon">
                <Mail size={18} />
              </span>
              <motion.input
                id="email"
                name="email"
                type="email"
                className="login__input auth__input--with-icon"
                placeholder="Enter your email"
                value={formValues.email}
                onChange={handleChange}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                autoComplete="email"
                disabled={isLoading}
                required
              />
            </div>
          </motion.div>

          {/* Password Field */}
          <motion.div
            className={`login__form-group auth__input-group ${focusedField === 'password' ? 'auth__input-group--focused' : ''} ${formValues.password ? 'auth__input-group--filled' : ''}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.4 }}
          >
            <div className="login__password-header">
              <label className="login__label" htmlFor="password">
                Password
              </label>
              <Link to="/forgot-password" className="login__forgot-password">
                Forgot Password?
              </Link>
            </div>
            <div className="auth__input-wrapper login__password-wrapper">
              <span className="auth__input-icon">
                <Lock size={18} />
              </span>
              <motion.input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                className="login__input auth__input--with-icon"
                placeholder="Enter your password"
                value={formValues.password}
                onChange={handleChange}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                autoComplete="current-password"
                disabled={isLoading}
                required
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
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </motion.button>
            </div>
          </motion.div>

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

          {/* Loading Message */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                className="auth__message auth__message--loading"
                role="status"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <span className="auth__spinner" />
                <p>Authenticating... Please wait.</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <motion.button
            className="login__button auth__button--enhanced"
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
            whileHover={!isLoading ? { y: -1, boxShadow: '0 8px 32px rgba(49, 156, 181, 0.3)' } : {}}
            whileTap={!isLoading ? { y: -1, scale: 0.98 } : {}}
          >
            <span className="auth__button-content">
              {isLoading ? (
                <>
                  <span className="auth__spinner auth__spinner--small" />
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </span>
            {!isLoading && <span className="auth__button-shimmer" />}
          </motion.button>
        </motion.form>

        {/* Helper Links */}
        <motion.div className="login__links" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.4 }}>
          <p className="login__link-text">
            New student?{" "}
            <Link to="/signup" className="login__link">
              Create an account <ArrowRight size={14} style={{ verticalAlign: 'middle', marginLeft: '2px' }} />
            </Link>
          </p>
        </motion.div>
        
        {/* Network Debug Info */}
        {window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && (
          <div style={{
            marginTop: '20px', padding: '10px', background: 'rgba(49, 156, 181, 0.08)',
            borderRadius: '8px', fontSize: '12px', textAlign: 'center', color: 'var(--text-muted)',
            border: '1px solid rgba(49, 156, 181, 0.15)'
          }}>
            <Radio size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Backend: {API_BASE_URL}
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}

export default Login;

