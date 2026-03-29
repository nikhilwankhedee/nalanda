'use client';

import { useEffect, useState } from 'react';

interface Visitor {
  visitorId: string;
  country: string | null;
  page: string;
}

interface LiveVisitorsWidgetProps {
  initialCount: number;
  initialVisitors: Visitor[];
}

export default function LiveVisitorsWidget({
  initialCount,
  initialVisitors,
}: LiveVisitorsWidgetProps) {
  const [count, setCount] = useState(initialCount);
  const [visitors, setVisitors] = useState<Visitor[]>(initialVisitors);

  useEffect(() => {
    const fetchLiveVisitors = async () => {
      try {
        const res = await fetch('/api/analytics/track?type=live');
        const data = await res.json();
        setCount(data.count);
        setVisitors(data.visitors || []);
      } catch (error) {
        console.error('Error fetching live visitors:', error);
      }
    };

    // Poll every 10 seconds
    const interval = setInterval(fetchLiveVisitors, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Live Visitors</h3>
        <span className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-2xl font-bold text-green-600">{count}</span>
        </span>
      </div>
      <div className="space-y-2">
        {visitors.slice(0, 5).map((visitor) => (
          <div
            key={visitor.visitorId}
            className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded"
          >
            <span className="text-gray-600 truncate flex-1">{visitor.page}</span>
            <span className="text-gray-400 ml-2">
              {visitor.country || 'Unknown'}
            </span>
          </div>
        ))}
        {visitors.length === 0 && (
          <p className="text-center text-gray-500 py-4">No active visitors</p>
        )}
      </div>
    </div>
  );
}
