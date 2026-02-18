import { useSpring, animated, config } from 'react-spring';
import { useState } from 'react';

// Counter animation with spring
export const useSpringCounter = (from = 0, to = 100, duration = 1000) => {
  const [isVisible, setIsVisible] = useState(false);

  const spring = useSpring({
    number: isVisible ? to : from,
    from: { number: from },
    config: { ...config.molasses, duration },
  });

  return [spring.number, setIsVisible];
};

// Fade in animation
export const useSpringFadeIn = (delay = 0) => {
  return useSpring({
    from: { opacity: 0, transform: 'translate3d(0,40px,0)' },
    to: { opacity: 1, transform: 'translate3d(0,0px,0)' },
    delay,
    config: config.gentle,
  });
};

// Slide in from left
export const useSpringSlideIn = (delay = 0) => {
  return useSpring({
    from: { opacity: 0, transform: 'translate3d(-40px,0,0)' },
    to: { opacity: 1, transform: 'translate3d(0,0,0)' },
    delay,
    config: config.gentle,
  });
};

// Bounce animation
export const useSpringBounce = () => {
  return useSpring({
    from: { scale: 1 },
    to: async (next) => {
      while (true) {
        await next({ scale: 1.1 });
        await next({ scale: 1 });
      }
    },
    config: config.wobbly,
  });
};

// Custom toggle animation
export const useSpringToggle = () => {
  const [isOpen, setOpen] = useState(false);

  const spring = useSpring({
    height: isOpen ? 'auto' : '0px',
    opacity: isOpen ? 1 : 0,
    config: config.smooth,
  });

  return [spring, isOpen, setOpen];
};
