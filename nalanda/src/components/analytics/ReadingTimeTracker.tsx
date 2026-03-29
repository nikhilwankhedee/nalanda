'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';

interface ReadingTimeTrackerProps {
  postId: string;
}

export default function ReadingTimeTracker({ postId }: ReadingTimeTrackerProps) {
  const startTime = useRef<number>(Date.now());
  const hasTrackedComplete = useRef<boolean>(false);

  useEffect(() => {
    // Track post open event
    trackEvent('post_open', { postId });

    const handleBeforeUnload = () => {
      if (hasTrackedComplete.current) return;

      const readingTimeSeconds = Math.round((Date.now() - startTime.current) / 1000);
      
      // Only track if user spent at least 5 seconds on the page
      if (readingTimeSeconds >= 5) {
        hasTrackedComplete.current = true;
        // Use sendBeacon for reliable delivery on page unload
        const visitorId = localStorage.getItem('nalanda_visitor_id');
        if (visitorId) {
          navigator.sendBeacon(
            '/api/analytics/track',
            JSON.stringify({
              visitorId,
              event: 'post_complete',
              postId,
              value: readingTimeSeconds,
            })
          );
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [postId]);

  return null;
}
