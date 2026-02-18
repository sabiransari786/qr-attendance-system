import { useEffect, useRef } from 'react';

/**
 * Custom hook for Lottie animations control
 * Pause, play, speed control, and loop settings
 */
export const useLottieControls = (animationData, options = {}) => {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);

  const {
    loop = true,
    autoplay = true,
    speed = 1,
    size = { width: 300, height: 300},
    ...restOptions
  } = options;

  useEffect(() => {
    // Dynamic import to avoid SSR issues
    import('lottie-web').then((lottie) => {
      if (containerRef.current && animationData) {
        instanceRef.current = lottie.default.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop: loop,
          autoplay: autoplay,
          animationData: animationData,
          ...restOptions
        });

        instanceRef.current.setSpeed(speed);
      }
    });

    return () => {
      if (instanceRef.current) {
        instanceRef.current.destroy();
      }
    };
  }, [animationData, loop, autoplay, speed, restOptions]);

  const controls = {
    play: () => instanceRef.current?.play(),
    pause: () => instanceRef.current?.pause(),
    stop: () => instanceRef.current?.stop(),
    setSpeed: (newSpeed) => instanceRef.current?.setSpeed(newSpeed),
    setDirection: (direction) => instanceRef.current?.setDirection(direction),
    goToFrame: (frame) => instanceRef.current?.goToFrame(frame),
    playSegments: (segments) => instanceRef.current?.playSegments(segments)
  };

  return { containerRef, controls, instance: instanceRef.current };
};

/**
 * Lottie component with built-in controls
 * Perfect for loading states, success screens, empty states
 */
export const useLottieAnimation = (name = 'loading') => {
  const animations = {
    loading: { /* can be imported from JSON */ },
    success: { /* can be imported from JSON */ },
    error: { /* can be imported from JSON */ },
    empty: { /* can be imported from JSON */ }
  };

  return animations[name] || animations.loading;
};
