import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Hook for GSAP scroll trigger animations
export const useScrollAnimation = (selector, options = {}) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    const elements = ref.current.querySelectorAll(selector);
    if (!elements.length) return;

    elements.forEach((el, index) => {
      gsap.fromTo(
        el,
        {
          opacity: 0,
          y: options.yOffset || 50,
          ...options.from,
        },
        {
          opacity: 1,
          y: 0,
          duration: options.duration || 0.6,
          delay: options.stagger ? index * (options.stagger || 0.1) : 0,
          scrollTrigger: {
            trigger: el,
            start: options.start || 'top bottom-=100',
            end: options.end || 'top center',
            markers: false,
            ...options.scrollTrigger,
          },
          ...options.to,
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [selector, options]);

  return ref;
};

// GSAP timeline animation
export const useGSAPTimeline = (callback, dependencies = []) => {
  useEffect(() => {
    const timeline = gsap.timeline();
    callback(timeline);
    return () => {
      timeline.kill();
    };
  }, dependencies);
};
