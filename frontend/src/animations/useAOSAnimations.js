import { useEffect, useRef } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

/**
 * Initialize AOS (Animate On Scroll) library
 * Perfect for scroll-reveal effects on dashboard cards
 */
export const useAOSInit = (options = {}) => {
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out-cubic',
      once: false,
      mirror: true,
      offset: 100,
      ...options
    });

    return () => {
      // Cleanup AOS on unmount
      AOS.refreshHard();
    };
  }, [options]);
};

/**
 * Refresh AOS animations when content dynamically changes
 * Use when adding new DOM elements
 */
export const useAOSRefresh = (dependencies = []) => {
  useEffect(() => {
    AOS.refreshHard();
  }, dependencies);
};

/**
 * Animate scroll position smoothly to element
 * Great for jumping to sections
 */
export const useScrollToElement = (elementRef, offset = 0) => {
  const scrollToElement = () => {
    if (elementRef.current) {
      const top = elementRef.current.offsetTop - offset;
      window.scrollTo({
        top,
        behavior: 'smooth'
      });
    }
  };

  return scrollToElement;
};

/**
 * Detect when element enters/leaves viewport
 * Manual scroll animation control
 */
export const useIntersectionObserver = (elementRef, options = {}) => {
  const [isVisible, setIsVisible] = require('react').useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, {
      threshold: 0.1,
      ...options
    });

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [elementRef, options]);

  return isVisible;
};
