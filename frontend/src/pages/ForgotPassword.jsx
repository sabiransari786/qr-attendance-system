import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../utils/constants";
import "../styles/auth.css";

/**
 * ForgotPassword Component with OTP Verification
 *
 * Purpose:
 * - Allow users to reset their password
 * - 3-step process: Email → OTP Verification → Password Reset
 * - Send OTP to email, verify it, then reset password
 */

function ForgotPassword() {
  const navigate = useNavigate();

  // Form states
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Flow control
  const [step, setStep] = useState("email"); // "email" → "otp" → "password"
  
  // UI states
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  /**
   * Step 1: Send OTP to email
   */
  const handleSendOTP = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/otp/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || "Failed to send OTP. Please try again.");
        return;
      }

      setMessage(data.message || "OTP sent to your email successfully!");
      setStep("otp");
      setResendTimer(60); // 60 second resend timer

      // Countdown timer
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Error sending OTP:", error);
      setErrorMessage("Failed to send OTP. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle OTP resend
   */
  const handleResendOTP = async () => {
    setErrorMessage("");
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/otp/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || "Failed to resend OTP.");
        return;
      }

      setMessage("OTP resent to your email!");
      setResendTimer(60);

      // Countdown timer
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Error resending OTP:", error);
      setErrorMessage("Failed to resend OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Step 2: Verify OTP
   */
  const handleVerifyOTP = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setMessage("");

    if (!otp.trim()) {
      setErrorMessage("Please enter the OTP.");
      return;
    }

    if (otp.length !== 6 || isNaN(otp)) {
      setErrorMessage("OTP must be 6 digits.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/otp/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || "Failed to verify OTP. Please try again.");
        return;
      }

      setMessage("OTP verified successfully!");
      setStep("password");
      setOtp(""); // Clear OTP field
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setErrorMessage("Failed to verify OTP. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Step 3: Reset password after OTP verification
   */
  const handleResetPassword = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setMessage("");

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/otp/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email.trim(),
          newPassword: newPassword,
          confirmPassword: confirmPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || "Failed to reset password.");
        return;
      }

      setMessage("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("Error resetting password:", error);
      setErrorMessage("Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Go back to email step
   */
  const handleBackToEmail = () => {
    setStep("email");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage("");
    setErrorMessage("");
    setResendTimer(0);
  };

  return (
    <div className="login__container">
      <div className="auth__objects" aria-hidden="true">
        <span className="auth__object auth__object--sphere" />
        <span className="auth__object auth__object--ring" />
        <span className="auth__object auth__object--cube" />
      </div>

      <section className="login__card" aria-labelledby="forgot-password-title">
        {/* Card Header */}
        <header className="login__header">
          <h1 id="forgot-password-title" className="login__title">
            Reset Password
          </h1>
          <p className="login__subtitle">
            {step === "email"
              ? "Enter your email to receive an OTP code"
              : step === "otp"
              ? "Enter the 6-digit OTP sent to your email"
              : "Create a new password for your account"}
          </p>
        </header>

        {/* Step 1: Email */}
        {step === "email" && (
          <form className="login__form" onSubmit={handleSendOTP} noValidate>
            <div className="login__form-group">
              <label className="login__label" htmlFor="reset-email">
                Email Address
              </label>
              <input
                id="reset-email"
                name="email"
                type="email"
                className="login__input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {errorMessage && (
              <p className="login__message login__message--error" role="alert">
                {errorMessage}
              </p>
            )}

            {message && (
              <p className="login__message login__message--success" role="status">
                {message}
              </p>
            )}

            {isLoading && (
              <p className="login__message login__message--loading" role="status">
                Sending OTP... Please wait.
              </p>
            )}

            <button
              className="login__button"
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === "otp" && (
          <form className="login__form" onSubmit={handleVerifyOTP} noValidate>
            <div className="login__form-group">
              <label className="login__label" htmlFor="otp">
                Enter OTP Code
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                className="login__input"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength="6"
                disabled={isLoading}
                autoComplete="off"
                required
              />
              <p className="login__helper-text">
                Check your email for the 6-digit code
              </p>
            </div>

            {errorMessage && (
              <p className="login__message login__message--error" role="alert">
                {errorMessage}
              </p>
            )}

            {message && (
              <p className="login__message login__message--success" role="status">
                {message}
              </p>
            )}

            {isLoading && (
              <p className="login__message login__message--loading" role="status">
                Verifying OTP... Please wait.
              </p>
            )}

            <button
              className="login__button"
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </button>

            {resendTimer > 0 ? (
              <p className="login__helper-text">
                Resend OTP in {resendTimer}s
              </p>
            ) : (
              <button
                className="login__button login__button--secondary"
                type="button"
                onClick={handleResendOTP}
                disabled={isLoading}
              >
                Resend OTP
              </button>
            )}
          </form>
        )}

        {/* Step 3: Password Reset */}
        {step === "password" && (
          <form className="login__form" onSubmit={handleResetPassword} noValidate>
            <div className="login__form-group">
              <label className="login__label" htmlFor="new-password">
                New Password
              </label>
              <div className="login__password-wrapper">
                <input
                  id="new-password"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  className="login__input"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className="login__password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex="-1"
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="login__form-group">
              <label className="login__label" htmlFor="confirm-password">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                className="login__input"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {errorMessage && (
              <p className="login__message login__message--error" role="alert">
                {errorMessage}
              </p>
            )}

            {message && (
              <p className="login__message login__message--success" role="status">
                {message}
              </p>
            )}

            {isLoading && (
              <p className="login__message login__message--loading" role="status">
                Resetting password... Please wait.
              </p>
            )}

            <button
              className="login__button"
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              className="login__button login__button--secondary"
              type="button"
              onClick={handleBackToEmail}
              disabled={isLoading}
            >
              Back to Email
            </button>
          </form>
        )}

        {/* Helper Links */}
        <div className="login__links">
          <p className="login__link-text">
            Remember your password?{" "}
            <Link to="/login" className="login__link">
              Login
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default ForgotPassword;
