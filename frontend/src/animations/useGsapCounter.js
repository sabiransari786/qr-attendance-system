import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * useGsapCounter
 * Animates a DOM element's text from 0 → target using GSAP.
 *
 * Usage:
 *   const ref = useGsapCounter(value, { suffix: "%", duration: 1.2 });
 *   <span ref={ref} />
 */
export function useGsapCounter(target, { suffix = "", prefix = "", duration = 1.0, decimals = 0, delay = 0 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || target == null) return;
    const obj = { val: 0 };
    const tween = gsap.to(obj, {
      val: Number(target) || 0,
      duration,
      delay,
      ease: "power2.out",
      onUpdate: () => {
        if (ref.current) {
          ref.current.textContent = `${prefix}${obj.val.toFixed(decimals)}${suffix}`;
        }
      },
    });
    return () => tween.kill();
  }, [target]);

  return ref;
}

/**
 * useGsapStagger
 * Animates a list of children with a GSAP stagger effect.
 *
 * Usage:
 *   const containerRef = useGsapStagger();
 *   <ul ref={containerRef}> ... </ul>
 */
export function useGsapStagger({ from = { opacity: 0, y: 30 }, to = { opacity: 1, y: 0 }, stagger = 0.08, duration = 0.55, delay = 0.1 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const children = ref.current.children;
    if (!children.length) return;

    gsap.set(children, from);
    const tween = gsap.to(children, {
      ...to,
      duration,
      delay,
      stagger,
      ease: "power2.out",
    });
    return () => tween.kill();
  }, []);

  return ref;
}
