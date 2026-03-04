import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { API_BASE_URL } from "../utils/constants";
import "../styles/auth.css";
import {
  fadeInUp,
  fadeInDown,
  staggerContainer,
  buttonHover,
  buttonTap,
} from "../animations/animationConfig";

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
    <motion.div
      className="login__container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="auth__objects" aria-hidden="true">
        <span className="auth__object auth__object--sphere" />
        <span className="auth__object auth__object--ring" />
        <span className="auth__object auth__object--cube" />
      </div>

      <motion.section
        className="login__card"
        aria-labelledby="forgot-password-title"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Card Header */}
        <motion.header
          className="login__header"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 id="forgot-password-title" className="login__title" variants={fadeInDown}>
            Reset Password
          </motion.h1>
          <motion.p className="login__subtitle" variants={fadeInUp}>
            {step === "email"
              ? "Enter your email to receive an OTP code"
              : step === "otp"
              ? "Enter the 6-digit OTP sent to your email"
              : "Create a new password for your account"}
          </motion.p>
        </motion.header>

        {/* Step 1: Email */}
        {step === "email" && (
          <motion.form
            className="login__form"
            onSubmit={handleSendOTP}
            noValidate
            initial={{ opacity: 0, y: 30, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(2px)' }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          >
            <motion.div className="login__form-group" variants={fadeInUp}>
              <motion.label className="login__label" htmlFor="reset-email" variants={fadeInUp}>
                Email Address
              </motion.label>
              <motion.input
                id="reset-email"
                name="email"
                type="email"
                className="login__input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                whileFocus={{ boxShadow: "0 0 0 3px rgba(49, 156, 181, 0.3)", transition: { duration: 0.2 } }}
              />
            </motion.div>

            {errorMessage && (
              <motion.p
                className="login__message login__message--error"
                role="alert"
                initial={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                {errorMessage}
              </motion.p>
            )}

            {message && (
              <motion.p
                className="login__message login__message--success"
                role="status"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                {message}
              </motion.p>
            )}

            {isLoading && (
              <motion.p
                className="login__message login__message--loading"
                role="status"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Sending OTP... Please wait.
              </motion.p>
            )}

            <motion.button
              className="login__button"
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              variants={buttonHover}
              whileHover={!isLoading ? "hover" : {}}
              whileTap={!isLoading ? buttonTap : {}}
            >
              {isLoading ? "Sending..." : "Send OTP"}
            </motion.button>
          </motion.form>
        )}

        {/* Step 2: OTP Verification */}
        {step === "otp" && (
          <motion.form
            className="login__form"
            onSubmit={handleVerifyOTP}
            noValidate
            initial={{ opacity: 0, y: 30, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(2px)' }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          >
            <motion.div className="login__form-group" variants={fadeInUp}>
              <motion.label className="login__label" htmlFor="otp" variants={fadeInUp}>
                Enter OTP Code
              </motion.label>
              <motion.input
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
                whileFocus={{ boxShadow: "0 0 0 3px rgba(49, 156, 181, 0.3)", transition: { duration: 0.2 } }}
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.3em' }}
              />
              <motion.p className="login__helper-text" variants={fadeInUp}>
                Check your email for the 6-digit code
              </motion.p>
            </motion.div>

            {errorMessage && (
              <motion.p className="login__message login__message--error" role="alert" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                {errorMessage}
              </motion.p>
            )}

            {message && (
              <motion.p className="login__message login__message--success" role="status" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                {message}
              </motion.p>
            )}

            {isLoading && (
              <motion.p className="login__message login__message--loading" role="status" animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.5, repeat: Infinity }}>
                Verifying OTP... Please wait.
              </motion.p>
            )}

            <motion.button
              className="login__button"
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              variants={buttonHover}
              whileHover={!isLoading ? "hover" : {}}
              whileTap={!isLoading ? buttonTap : {}}
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </motion.button>

            {resendTimer > 0 ? (
              <motion.p className="login__helper-text" variants={fadeInUp}>
                Resend OTP in {resendTimer}s
              </motion.p>
            ) : (
              <motion.button
                className="login__button login__button--secondary"
                type="button"
                onClick={handleResendOTP}
                disabled={isLoading}
                variants={buttonHover}
                whileHover={!isLoading ? "hover" : {}}
                whileTap={!isLoading ? buttonTap : {}}
              >
                Resend OTP
              </motion.button>
            )}
          </motion.form>
        )}

        {/* Step 3: Password Reset */}
        {step === "password" && (
          <motion.form
            className="login__form"
            onSubmit={handleResetPassword}
            noValidate
            initial={{ opacity: 0, y: 30, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(2px)' }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          >
            <motion.div className="login__form-group" variants={fadeInUp}>
              <motion.label className="login__label" htmlFor="new-password" variants={fadeInUp}>
                New Password
              </motion.label>
              <div className="login__password-wrapper">
                <motion.input
                  id="new-password"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  className="login__input"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  whileFocus={{ boxShadow: "0 0 0 3px rgba(49, 156, 181, 0.3)" }}
                />
                <motion.button
                  type="button"
                  className="login__password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex="-1"
                  whileHover={{ scale: 1.15, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
                  whileTap={{ scale: 0.9 }}
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
                </motion.button>
              </div>
            </motion.div>

            <motion.div className="login__form-group" variants={fadeInUp}>
              <motion.label className="login__label" htmlFor="confirm-password" variants={fadeInUp}>
                Confirm Password
              </motion.label>
              <motion.input
                id="confirm-password"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                className="login__input"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
                whileFocus={{ boxShadow: "0 0 0 3px rgba(49, 156, 181, 0.3)" }}
              />
            </motion.div>

            {errorMessage && (
              <motion.p className="login__message login__message--error" role="alert" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                {errorMessage}
              </motion.p>
            )}

            {message && (
              <motion.p className="login__message login__message--success" role="status" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                {message}
              </motion.p>
            )}

            {isLoading && (
              <motion.p className="login__message login__message--loading" role="status" animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.5, repeat: Infinity }}>
                Resetting password... Please wait.
              </motion.p>
            )}

            <motion.button
              className="login__button"
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              variants={buttonHover}
              whileHover={!isLoading ? "hover" : {}}
              whileTap={!isLoading ? buttonTap : {}}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </motion.button>

            <motion.button
              className="login__button login__button--secondary"
              type="button"
              onClick={handleBackToEmail}
              disabled={isLoading}
              variants={buttonHover}
              whileHover={!isLoading ? "hover" : {}}
              whileTap={!isLoading ? buttonTap : {}}
            >
              Back to Email
            </motion.button>
          </motion.form>
        )}

        {/* Helper Links */}
        <motion.div className="login__links" variants={fadeInUp} initial="hidden" animate="visible">
          <motion.p className="login__link-text" variants={fadeInUp}>
            Remember your password?{" "}
            <motion.div style={{ display: "inline" }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/login" className="login__link">
                Login
              </Link>
            </motion.div>
          </motion.p>
        </motion.div>
      </motion.section>
    </motion.div>
  );
}

export default ForgotPassword;
