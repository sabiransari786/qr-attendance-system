import { useEffect } from "react";
import "../styles/login-modal.css";

/**
 * LoginSuccessModal Component
 * Displays animated success message after login
 */
function LoginSuccessModal({ userName, onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);
    return () => {
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div className="login-modal__overlay">
      <div className="login-modal__content">
        <div className="login-modal__checkmark">
          <svg viewBox="0 0 50 50" fill="none" stroke="currentColor" strokeWidth="3">
            <circle cx="25" cy="25" r="24"></circle>
            <polyline points="15 25 22 32 35 19"></polyline>
          </svg>
        </div>

        <h2 className="login-modal__title">Login Successful!</h2>
        
        <p className="login-modal__message">
          Welcome back, <span className="login-modal__name">{userName}</span>!
        </p>

        <p className="login-modal__subtitle">
          Redirecting to your dashboard...
        </p>

        <div className="login-modal__progress">
          <div className="login-modal__progress-bar"></div>
        </div>
      </div>
    </div>
  );
}

export default LoginSuccessModal;
