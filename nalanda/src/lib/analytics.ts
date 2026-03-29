'use client';

import { useEffect, useState, useCallback } from 'react';

const VISITOR_ID_KEY = 'nalanda_visitor_id';

function generateVisitorId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = generateVisitorId();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
}

export function useVisitorId(): string {
  const [visitorId, setVisitorId] = useState<string>('');

  useEffect(() => {
    setVisitorId(getOrCreateVisitorId());
  }, []);

  return visitorId;
}

export function getVisitorId(): string {
  return getOrCreateVisitorId();
}

export async function trackEvent(
  event: string,
  options?: {
    page?: string;
    postId?: string;
    conceptId?: string;
    value?: number;
  }
) {
  const visitorId = getVisitorId();
  if (!visitorId) return;

  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId,
        event,
        ...options,
      }),
    });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

export function useAnalytics() {
  const visitorId = useVisitorId();

  const track = useCallback(
    async (
      event: string,
      options?: {
        page?: string;
        postId?: string;
        conceptId?: string;
        value?: number;
      }
    ) => {
      if (!visitorId) return;

      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitorId,
            event,
            ...options,
          }),
        });
      } catch (error) {
        console.error('Failed to track event:', error);
      }
    },
    [visitorId]
  );

  return { visitorId, track };
}
