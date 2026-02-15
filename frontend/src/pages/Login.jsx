import { useMemo, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/api";
import { ROLE_ROUTES, API_BASE_URL } from "../utils/constants";
import { AuthContext } from "../context/AuthContext";
import LoginSuccessModal from "../components/LoginSuccessModal";
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
      // Debug: Log current window location and expected API URL
      console.log("🌐 Window location:", window.location.href);
      console.log("🌐 Hostname:", window.location.hostname);
      console.log("🔗 Using API_BASE_URL:", API_BASE_URL);
      console.log("🔗 Login endpoint:", `${API_BASE_URL}/auth/login`);
      
      // Send login request to backend
      console.log("Attempting login with:", { email: formValues.email.trim(), password: "***" });
      const response = await login({
        email: formValues.email.trim(),
        password: formValues.password,
      });

      console.log("Login response:", response);

      // Extract token and user data from response
      // Handle both backend format (response.data) and mock API format (response)
      const token = response?.data?.token || response?.token;
      const userData = response?.data?.user || response?.user;

      console.log("Extracted token:", token);
      console.log("Extracted userData:", userData);

      if (!token || !userData) {
        setErrorMessage("Invalid response from server. Please try again.");
        return;
      }

      // Update authentication context
      authContext.login(userData, token);

      // Show success modal
      setSuccessUserName(userData.name);
      setShowSuccessModal(true);
      console.log("Modal shown, will redirect in 3000ms");

      // Determine dashboard route based on role
      const dashboardPath = ROLE_ROUTES[userData.role] || "/";

      // Redirect after modal closes (give extra time for animation)
      setTimeout(() => {
        console.log("Redirecting to:", dashboardPath);
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
    <div className="login__container">
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

      <section className="login__card login__box" aria-labelledby="login-title">
        {/* Card Header */}
        <header className="login__header">
          <h1 id="login-title" className="login__title">Login</h1>
          <p className="login__subtitle">
            Sign in with your institution credentials to access the QR-Based Attendance System.
          </p>
        </header>

        {/* Login Form */}
        <form className="login__form" onSubmit={handleSubmit} noValidate>
          {/* Email Field */}
          <div className="login__form-group">
            <label className="login__label" htmlFor="email">
              Email Address
            </label>
            <input
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
            />
          </div>

          {/* Password Field */}
          <div className="login__form-group">
            <div className="login__password-header">
              <label className="login__label" htmlFor="password">
                Password
              </label>
              <Link to="/forgot-password" className="login__forgot-password">
                Forgot Password?
              </Link>
            </div>
            <div className="login__password-wrapper">
              <input
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
              />
              <button
                type="button"
                className="login__password-toggle"
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

          {/* Error Message */}
          {errorMessage && (
            <p className="login__message login__message--error" role="alert">
              {errorMessage}
            </p>
          )}

          {/* Loading Message */}
          {isLoading && (
            <p className="login__message login__message--loading" role="status">
              Authenticating... Please wait.
            </p>
          )}

          {/* Submit Button */}
          <button
            className="login__button"
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Helper Links */}
        <div className="login__links">
          <p className="login__link-text">
            New student?{" "}
            <Link to="/signup" className="login__link">
              Sign up
            </Link>
          </p>
        </div>
        
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
      </section>
    </div>
  );
}

export default Login;

