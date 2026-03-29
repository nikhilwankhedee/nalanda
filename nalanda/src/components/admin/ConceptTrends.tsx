interface ConceptTrendsProps {
  concepts: Array<{
    conceptId: string | null;
    _count: { conceptId: number };
    concept?: {
      id: string;
      name: string;
      slug: string;
    } | null;
  }>;
  title?: string;
}

export default function ConceptTrends({ concepts, title = 'Trending Concepts' }: ConceptTrendsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {concepts.map((item, index) => (
          <div
            key={item.conceptId}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-sm font-medium">
                {index + 1}
              </span>
              <span className="text-sm text-gray-900">
                {item.concept?.name || 'Unknown Concept'}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-600">
              {item._count.conceptId} {item._count.conceptId === 1 ? 'view' : 'views'}
            </span>
          </div>
        ))}
        {concepts.length === 0 && (
          <p className="text-center text-gray-500 py-8">No concept activity yet</p>
        )}
      </div>
    </div>
  );
}
