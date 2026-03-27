interface ProgressBarData {
  label: string;
  value: number;
  maxValue: number;
  color?: string;
}

interface ProgressChartProps {
  data: ProgressBarData[];
  title?: string;
}

const DEFAULT_COLORS = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-purple-500',
];

export function ProgressChart({ data, title }: ProgressChartProps) {
  if (data.length === 0) {
    return <p className="text-gray-500 text-sm">No data yet</p>;
  }

  return (
    <div>
      {title && <h4 className="text-sm font-medium text-gray-700 mb-3">{title}</h4>}
      <div className="space-y-3">
        {data.map((item, i) => {
          const pct = item.maxValue > 0 ? Math.round((item.value / item.maxValue) * 100) : 0;
          const barColor = item.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
          return (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700 font-medium">{item.label}</span>
                <span className="text-gray-500">{pct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
