import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/unauthorized.css";
import {
  fadeInUp,
  fadeInDown,
  staggerContainer,
  buttonHover,
  buttonTap,
} from "../animations/animationConfig";

/**
 * Unauthorized Component
 *
 * Purpose:
 * - Inform user that access is denied
 * - Guide user to a valid page based on authentication status
 * - Support role-based access control
 *
 * Security Note:
 * - Display-only page
 * - No backend interaction
 * - No state management
 */

function Unauthorized() {
  const navigate = useNavigate();

  /**
   * Check if user is authenticated by looking for auth token
   */
  const isAuthenticated = !!sessionStorage.getItem("authToken");

  /**
   * Handle redirect based on authentication status
   * - If authenticated: Go to home/dashboard
   * - If not authenticated: Go to login
   */
  const handleRedirect = () => {
    if (isAuthenticated) {
      navigate("/");
    } else {
      navigate("/login");
    }
  };

  return (
    <motion.div
      className="unauthorized__container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="unauthorized__objects" aria-hidden="true">
        <span className="unauthorized__object unauthorized__object--sphere" />
        <span className="unauthorized__object unauthorized__object--ring" />
        <span className="unauthorized__object unauthorized__object--cube" />
      </div>
      {/* Start of card */}
      <motion.section
        className="unauthorized__card"
        aria-labelledby="unauthorized-title"
        initial={{ opacity: 0, scale: 0.9, y: 30, filter: 'blur(6px)' }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ type: 'spring', stiffness: 180, damping: 22, delay: 0.08 }}
      >
        {/* Message Section */}
        <motion.header className="unauthorized__header" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <motion.h1 id="unauthorized-title" className="unauthorized__title" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}>
            Access Denied
          </motion.h1>
          <motion.p className="unauthorized__message" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.3 }}>
            You do not have permission to access this page.
          </motion.p>
          <motion.p className="unauthorized__description" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.38 }}>
            If you believe this is an error, please contact your administrator or sign in with a different account.
          </motion.p>
        </motion.header>

        {/* Action Button */}
        <motion.footer className="unauthorized__footer" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.45 }}>
          <motion.button
            className="unauthorized__button"
            type="button"
            onClick={handleRedirect}
            aria-label={
              isAuthenticated
                ? "Go to home page"
                : "Go to login page"
            }
            variants={buttonHover}
            whileHover="hover"
            whileTap={buttonTap}
          >
            {isAuthenticated ? "Go to Dashboard" : "Go to Login"}
          </motion.button>
        </motion.footer>
      </motion.section>
    </motion.div>
  );
}

export default Unauthorized;
