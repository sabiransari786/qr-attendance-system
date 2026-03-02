// ─── Smooth Spring Config ────────────────────────────────────────────────────
const spring = { type: 'spring', stiffness: 260, damping: 22 };
const smoothSpring = { type: 'spring', stiffness: 180, damping: 24 };
const gentleSpring = { type: 'spring', stiffness: 120, damping: 20 };
const snappy = { type: 'spring', stiffness: 380, damping: 30 };

// smooth cubic-bezier curves
const easeSmooth = [0.25, 0.46, 0.45, 0.94];
const easeOutExpo = [0.16, 1, 0.3, 1];
const easeInOutQuart = [0.77, 0, 0.175, 1];

// ─── Fade Variants (no blur — blur causes "page reload" flicker) ─────────────
export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: easeOutExpo },
  },
};

export const fadeInDown = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: easeOutExpo },
  },
};

export const fadeInLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: easeOutExpo },
  },
};

export const fadeInRight = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: easeOutExpo },
  },
};

// ─── Scale Variants ───────────────────────────────────────────────────────────
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: smoothSpring,
  },
};

export const scaleInFast = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: snappy,
  },
};

export const popIn = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { ...spring, duration: 0.4 },
  },
};

// ─── Stagger Containers ───────────────────────────────────────────────────────
export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const staggerFast = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

export const staggerSlow = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

// ─── Slide Variants ───────────────────────────────────────────────────────────
export const slideInLeft = {
  hidden: { x: -80, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { ...smoothSpring },
  },
};

export const slideInRight = {
  hidden: { x: 80, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { ...smoothSpring },
  },
};

export const rotateIn = {
  hidden: { rotate: -8, opacity: 0, scale: 0.95 },
  visible: {
    rotate: 0,
    opacity: 1,
    scale: 1,
    transition: { ...spring },
  },
};

// ─── Interactive States ───────────────────────────────────────────────────────
export const buttonHover = {
  hover: {
    scale: 1.06,
    y: -2,
    boxShadow: '0 14px 40px rgba(49, 156, 181, 0.35)',
    transition: snappy,
  },
};

export const buttonTap = {
  scale: 0.95,
  y: 0,
  boxShadow: '0 4px 12px rgba(49, 156, 181, 0.2)',
  transition: { duration: 0.1 },
};

export const cardHover = {
  y: -8,
  scale: 1.02,
  boxShadow: '0 24px 64px rgba(49, 156, 181, 0.2)',
  transition: smoothSpring,
};

export const subtleHover = {
  y: -4,
  boxShadow: '0 12px 32px rgba(49, 156, 181, 0.15)',
  transition: smoothSpring,
};

// ─── Page Transitions ─────────────────────────────────────────────────────────
export const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOutExpo } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.25, ease: easeInOutQuart } },
};

export const pageSlide = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0, transition: { ...smoothSpring } },
  exit: { opacity: 0, x: -30, transition: { duration: 0.2 } },
};

// ─── Pulse / Loop ─────────────────────────────────────────────────────────────
export const pulseAnimation = {
  scale: [1, 1.04, 1],
  transition: {
    duration: 2.4,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

export const floatAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 3.5,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

// ─── List Item ────────────────────────────────────────────────────────────────
export const listItem = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { ...spring },
  },
};

// ─── Overlay / Modal ──────────────────────────────────────────────────────────
export const overlayVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit:   { opacity: 0, transition: { duration: 0.2 } },
};

export const modalVariant = {
  hidden: { opacity: 0, scale: 0.88, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: smoothSpring },
  exit:   { opacity: 0, scale: 0.92, y: 12, transition: { duration: 0.2 } },
};

// ─── Tilt Card Entrance ─────────────────────────────────────────────────────
export const tiltCardEntrance = {
  hidden: { 
    opacity: 0, 
    y: 40, 
    scale: 0.9,
    filter: 'blur(8px)',
    rotateX: 8,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    rotateX: 0,
    transition: { 
      duration: 0.6, 
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export const tiltCardStagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};
