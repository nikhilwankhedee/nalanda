interface CountryChartProps {
  countries: Array<{
    country: string | null;
    _count: { country: number };
  }>;
}

export default function CountryChart({ countries }: CountryChartProps) {
  const maxCount = Math.max(...countries.map((c) => c._count.country), 1);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Visitors by Country</h3>
      <div className="space-y-3">
        {countries.map((item) => {
          const count = item._count.country;
          const percentage = (count / maxCount) * 100;
          return (
            <div key={item.country} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-24 truncate">
                {item.country || 'Unknown'}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-4">
                <div
                  className="bg-primary-600 h-4 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-900 w-12 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
