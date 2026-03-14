import { useEffect, useRef } from 'react';

export default function useScrollReveal({ threshold = 0.1, rootMargin = '0px' } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed');
          // Once revealed, stop observing this specific element to save CPU
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    
    // Clean up the observer completely when the component unmounts
    return () => observer.disconnect();
  }, [threshold, rootMargin]); // Now safely reacts to prop changes

  return ref;
}