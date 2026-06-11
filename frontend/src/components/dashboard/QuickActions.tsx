import { CalendarPlus, FileUp, UserPlus, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const actions = [
  { label: 'Add employee', to: '/employees', icon: UserPlus },
  { label: 'Request leave', to: '/leaves', icon: CalendarPlus },
  { label: 'Upload document', to: '/documents', icon: FileUp },
  { label: 'Map skills', to: '/skills', icon: Zap },
];

export default function QuickActions() {
  return (
    <section className="glass-card rounded-lg p-4">
      <h2 className="mb-4 text-sm font-semibold text-white/88">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <Link
            key={action.label}
            to={action.to}
            className="group rounded-md border border-white/7 bg-white/[0.025] p-3 transition hover:border-lime-300/24 hover:bg-lime-300/8"
          >
            <action.icon size={18} className="text-lime-300" />
            <p className="mt-3 text-xs font-semibold text-white/74 group-hover:text-white">{action.label}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
