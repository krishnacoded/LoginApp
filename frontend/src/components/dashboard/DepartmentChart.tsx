import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { Building2 } from 'lucide-react';

const COLORS = ['#307FE2', '#00205B', '#F2A900', '#003087', '#FFE264', '#60a5fa'];

interface DepartmentPoint {
  id?: string;
  name: string;
  count?: number;
  employee_count?: number;
}

export default function DepartmentChart({ data = [] }: { data?: DepartmentPoint[] }) {
  const points = data.length
    ? data.map((item) => ({ ...item, count: Number(item.count ?? item.employee_count ?? 0) }))
    : [
        { name: 'Engineering', count: 42 },
        { name: 'Operations', count: 28 },
        { name: 'Sales', count: 18 },
        { name: 'Finance', count: 11 },
      ];

  return (
    <section className="glass-card rounded-lg p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white/88">Department Mix</h2>
          <p className="mt-1 text-xs text-white/34">Headcount by function</p>
        </div>
        <Building2 size={17} className="text-amber-400" />
      </div>

      <div className="grid grid-cols-[128px_1fr] items-center gap-4">
      <div className="h-[132px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={points} dataKey="count" innerRadius={38} outerRadius={58} paddingAngle={3}>
              {points.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: 'var(--glass-card-bg)', border: '1px solid var(--border-layout-inner)', borderRadius: 8, color: 'var(--text-color-base)' }} itemStyle={{ color: 'var(--text-color-base)' }} labelStyle={{ color: 'var(--text-color-base)' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
        <div className="space-y-2">
          {points.slice(0, 5).map((point, index) => (
            <div key={point.name} className="flex items-center justify-between gap-3 text-xs">
              <span className="flex min-w-0 items-center gap-2 text-white/58">
                <span className="h-2 w-2 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                <span className="truncate">{point.name}</span>
              </span>
              <span className="font-semibold text-white">{point.count}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
