import { Bell, CircleDot, Phone, Video } from 'lucide-react';

const contacts = [
  { name: 'Daniel Craig', role: 'People Ops', accent: '#fbbf24' },
  { name: 'Kara Morton', role: 'Talent Lead', accent: '#f472b6' },
  { name: 'Nathan Donovan', role: 'Workforce Admin', accent: '#a3ff29', active: true },
  { name: 'Elisabeth Mayne', role: 'Compliance', accent: '#60a5fa' },
];

export default function DashboardSidebar() {
  return (
    <aside className="space-y-4">
      <section className="glass-card rounded-lg p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white/88">Notifications</h2>
          <Bell size={16} className="text-lime-300" />
        </div>
        <div className="space-y-3">
          {['New users registered.', 'Leave approvals queued.', 'Documents awaiting review.'].map((message) => (
            <div key={message} className="flex gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-lime-300" />
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
              className={contact.active ? 'flex items-center gap-3 rounded-md bg-lime-300 px-2.5 py-2 text-[#07100c]' : 'flex items-center gap-3 rounded-md px-2.5 py-2 text-white/62 hover:bg-white/5'}
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
        <div className="mt-4 flex items-center gap-2 rounded-md border border-lime-300/10 bg-lime-300/6 px-3 py-2 text-xs text-lime-200">
          <CircleDot size={12} className="animate-pulse" />
          Support desk online
        </div>
      </section>
    </aside>
  );
}
