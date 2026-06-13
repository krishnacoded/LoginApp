import { Bell, CircleDot, Phone, Video } from 'lucide-react';

const contacts = [
  { name: 'Daniel Craig', role: 'People Ops', accent: '#fbbf24' },
  { name: 'Kara Morton', role: 'Talent Lead', accent: '#f472b6' },
  { name: 'Nathan Donovan', role: 'Workforce Admin', accent: '#F2A900', active: true },
  { name: 'Elisabeth Mayne', role: 'Compliance', accent: '#60a5fa' },
];

export default function DashboardSidebar() {
  return (
    <aside className="space-y-4">
      <section className="glass-card rounded-lg p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white/88">Notifications</h2>
          <Bell size={16} className="text-amber-400" />
        </div>
        <div className="space-y-3">
          {['New users registered.', 'Leave approvals queued.', 'Documents awaiting review.'].map((message) => (
            <div key={message} className="flex gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-amber-400" />
              <div>
                <p className="text-xs font-medium text-white/72">{message}</p>
                <p className="mt-0.5 text-[11px] text-white/28">Just now</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card rounded-lg p-4">
        <h2 className="mb-4 text-sm font-semibold text-white/88">Manager Contacts</h2>
        <div className="space-y-2">
          {contacts.map((contact) => (
            <div
              key={contact.name}
              className={contact.active ? 'flex items-center gap-3 rounded-md bg-amber-400 px-2.5 py-2 text-[#001133]' : 'flex items-center gap-3 rounded-md px-2.5 py-2 text-white/62 hover:bg-white/5'}
            >
              <span className="h-7 w-7 rounded-full" style={{ background: contact.accent }} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{contact.name}</p>
                <p className={contact.active ? 'text-[11px] text-black/55' : 'text-[11px] text-white/30'}>{contact.role}</p>
              </div>
              {contact.active ? <Phone size={14} /> : <Video size={14} />}
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-md border border-amber-400/10 bg-amber-400/5 px-3 py-2 text-xs text-amber-300">
          <CircleDot size={12} className="animate-pulse" />
          Support desk online
        </div>
      </section>
    </aside>
  );
}
