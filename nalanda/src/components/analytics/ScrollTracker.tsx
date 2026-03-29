'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

const SCROLL_THRESHOLDS = [25, 50, 75, 100];

export default function ScrollTracker() {
  const pathname = usePathname();
  const trackedThresholds = useRef<Set<number>>(new Set());

  useEffect(() => {
    // Reset tracked thresholds on route change
    trackedThresholds.current = new Set();

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;

      // Check which thresholds have been reached
      for (const threshold of SCROLL_THRESHOLDS) {
        if (scrollPercent >= threshold && !trackedThresholds.current.has(threshold)) {
          trackedThresholds.current.add(threshold);
          trackEvent(`scroll_${threshold}`, {
            page: pathname,
            value: scrollPercent,
          });
        }
      }
    };

    // Throttle scroll events
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  return null;
}
