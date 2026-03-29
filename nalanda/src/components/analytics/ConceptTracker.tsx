'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

interface ConceptTrackerProps {
  conceptId: string;
}

export default function ConceptTracker({ conceptId }: ConceptTrackerProps) {
  useEffect(() => {
    // Track concept view event
    trackEvent('concept_view', { conceptId });
  }, [conceptId]);

  return null;
}
