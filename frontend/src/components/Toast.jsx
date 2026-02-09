import { useEffect } from "react";
import "../styles/toast.css";

/**
 * Toast Component
 * Displays animated success/error messages
 */
function Toast({ message, type = "success", duration = 3000, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`toast toast--${type}`}>
      <div className="toast__content">
        {type === "success" && (
          <svg
            className="toast__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        )}
        {type === "error" && (
          <svg
            className="toast__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        )}
        <span className="toast__message">{message}</span>
      </div>
      <div className="toast__progress"></div>
    </div>
  );
}

export default Toast;
