import { motion } from "framer-motion";
import "../styles/auth.css";
import {
  fadeInUp,
  fadeInDown,
  staggerContainer,
} from "../animations/animationConfig";

function NotFound() {
  return (
    <motion.div
      className="auth"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="auth__objects" aria-hidden="true">
        <span className="auth__orb auth__orb--one" />
        <span className="auth__orb auth__orb--two" />
        <span className="auth__orb auth__orb--three" />
      </div>
      <motion.div
        className="auth__card"
        initial={{ opacity: 0, scale: 0.9, y: 30, filter: 'blur(6px)' }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ type: 'spring', stiffness: 180, damping: 22, delay: 0.08 }}
      >
        <motion.h1 className="auth__title" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}>
          Page not found
        </motion.h1>
        <motion.p className="auth__subtitle" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}>
          The page you are looking for does not exist or may have been moved.
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

export default NotFound;

