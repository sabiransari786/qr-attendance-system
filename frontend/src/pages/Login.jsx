import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/api";
import { ROLE_ROUTES } from "../utils/constants";
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
 * Does NOT:
 * - Decide user role itself
 * - Access database directly
 * - Handle attendance logic
 */

function Login() {
  const navigate = useNavigate();

  // Form state
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });

  // UI state
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
   * Handle form submission
   * - Validates form
   * - Sends credentials to backend
   * - Receives role and token
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
      // Send login request to backend
      const response = await login({
        email: formValues.email.trim(),
        password: formValues.password,
      });

      // Extract token and role from response
      const token = response?.data?.token;
      const user = response?.data?.user;
      const role = user?.role;
      const redirectPath = ROLE_ROUTES[role];

      // Store authentication data in localStorage
      if (token) {
        localStorage.setItem("authToken", token);
        localStorage.setItem("token", token);
      }
      
      if (user) {
        localStorage.setItem("userId", user.id);
        localStorage.setItem("userName", user.name);
        localStorage.setItem("userEmail", user.email);
        localStorage.setItem("userRole", user.role);
        if (user.student_id) {
          localStorage.setItem("studentId", user.student_id);
        }
        if (user.teacher_id) {
          localStorage.setItem("teacherId", user.teacher_id);
        }
      }

      // Check if role-based redirect path exists
      if (!redirectPath) {
        setErrorMessage("Unable to determine user role from server response.");
        return;
      }

      // Redirect to role-specific dashboard
      navigate(redirectPath);
    } catch (error) {
      setErrorMessage(error.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login__container">
      <section className="login__card" aria-labelledby="login-title">
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
              required
            />
          </div>

          {/* Password Field */}
          <div className="login__form-group">
            <label className="login__label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="login__input"
              placeholder="Enter your password"
              value={formValues.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
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
      </section>
    </div>
  );
}

export default Login;

