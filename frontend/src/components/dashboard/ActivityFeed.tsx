import { Activity, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatRelativeDate } from '../../utils';

interface ActivityItem {
  action: string;
  entity_type?: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
  employee_name?: string;
}

interface ActivityFeedProps {
  items?: ActivityItem[];
}

export default function ActivityFeed({ items = [] }: ActivityFeedProps) {
  const feed = items.length
    ? items
    : [
        { action: 'synced employee records', entity_type: 'system', created_at: new Date().toISOString(), user_name: 'PeopleFlow' },
        { action: 'approved leave workflow', entity_type: 'leave', created_at: new Date().toISOString(), user_name: 'Ops Desk' },
        { action: 'updated document policy', entity_type: 'document', created_at: new Date().toISOString(), user_name: 'Compliance' },
      ];

  return (
    <section className="glass-card rounded-lg p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white/88">Activity Feed</h2>
          <p className="mt-1 text-xs text-white/34">Live operational events</p>
        </div>
        <Activity size={17} className="text-primary" />
      </div>

      <div className="space-y-3">
        {feed.map((item, index) => (
          <motion.div
            key={`${item.action}-${index}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
            className="flex gap-3"
          >
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
              <Clock size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-white/64">
                <span className="font-semibold text-white/84">{item.user_name || item.employee_name || item.user_email || 'System'}</span>{' '}
                {item.action.replace(/_/g, ' ').toLowerCase()}
              </p>
              <p className="mt-0.5 text-[11px] text-white/28">{formatRelativeDate(item.created_at)}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
