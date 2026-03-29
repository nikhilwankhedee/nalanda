'use client';

import { useState } from 'react';
import { trackEvent } from '@/lib/analytics';

interface FollowButtonProps {
  conceptId: string;
  isFollowing: boolean;
}

export default function FollowButton({ conceptId, isFollowing: initialIsFollowing }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/concepts/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conceptId }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.following);
        
        // Track follow/unfollow event
        if (data.following) {
          trackEvent('concept_follow', { conceptId });
        } else {
          trackEvent('concept_unfollow', { conceptId });
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        isFollowing
          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          : 'bg-primary-600 text-white hover:bg-primary-700'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}
