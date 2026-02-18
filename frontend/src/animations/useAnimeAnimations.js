import { useEffect, useRef } from 'react';
import anime from 'animejs';

/**
 * Custom hook for Anime.js timeline animations
 * Creates orchestrated sequences of animations
 */
export const useAnimeTimeline = (callback, dependencies = []) => {
  const timelineRef = useRef(null);

  useEffect(() => {
    if (callback) {
      timelineRef.current = anime.timeline();
      callback(timelineRef.current);
    }
    return () => {
      if (timelineRef.current) {
        timelineRef.current.pause();
      }
    };
  }, dependencies);

  return timelineRef.current;
};

/**
 * Animate element properties with Anime.js
 * Smooth transitions for numbers, colors, and spatial values
 */
export const useAnimeCounter = (value, duration = 1000, easing = 'easeOutQuad') => {
  const elementRef = useRef(null);

  useEffect(() => {
    if (elementRef.current && !isNaN(value)) {
      anime({
        targets: elementRef.current,
        innerHTML: value,
        round: 1,
        duration: duration,
        easing: easing,
        update: function (anim) {
          if (elementRef.current) {
            elementRef.current.textContent = Math.round(anim.progress * value);
          }
        }
      });
    }
  }, [value, duration, easing]);

  return elementRef;
};

/**
 * Animate element entrance with stagger effect
 * Perfect for list items and card grids
 */
export const useAnimeStagger = (selector, options = {}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const {
      duration = 800,
      delay = 100,
      easing = 'easeOutQuad',
      opacity = [0, 1],
      translateY = [20, 0],
      ...restOptions
    } = options;

    if (containerRef.current) {
      anime.set(selector || `${containerRef.current.className} > *`, {
        opacity: opacity[0],
        translateY: translateY[0]
      });

      anime({
        targets: selector || `${containerRef.current.className} > *`,
        opacity: opacity[1],
        translateY: translateY[1],
        duration: duration,
        delay: anime.stagger(delay),
        easing: easing,
        ...restOptions
      });
    }
  }, [selector, options]);

  return containerRef;
};

/**
 * Animate properties with loop capability
 * Great for pulsing, rotating, and repeating animations
 */
export const useAnimeLoop = (selector, options = {}) => {
  const animationRef = useRef(null);

  useEffect(() => {
    const {
      duration = 2000,
      easing = 'easeInOutQuad',
      loop = true,
      ...restOptions
    } = options;

    if (typeof selector === 'string' || selector instanceof HTMLElement) {
      animationRef.current = anime({
        targets: selector,
        duration: duration,
        easing: easing,
        loop: loop,
        ...restOptions
      });
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.pause();
      }
    };
  }, [selector, options]);

  return animationRef.current;
};

/**
 * Delay and orchestrate multiple animations
 * Pause/play control
 */
export const useAnimeSequence = (animations = [], autoPlay = true) => {
  const sequenceRef = useRef(null);

  useEffect(() => {
    const timeline = anime.timeline({
      autoplay: autoPlay
    });

    animations.forEach((anim, index) => {
      if (index === 0) {
        timeline.add(anim, 0);
      } else {
        timeline.add(anim, anim.offset || 0);
      }
    });

    sequenceRef.current = timeline;

    return () => {
      if (sequenceRef.current) {
        sequenceRef.current.pause();
      }
    };
  }, [animations, autoPlay]);

  return sequenceRef.current;
};
