import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Building2,
  Zap,
  Calendar,
  Bell,
  FileText,
  Search,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  BarChart3,
  BadgeCheck,
  Shield,
  Command,
  CircleDot,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '../api';
import { cn, getInitials } from '../utils';
import NotificationPanel from '../components/notifications/NotificationPanel';
import CommandPalette from '../components/common/CommandPalette';
import Logo from '../components/common/Logo';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Overview', roles: ['admin', 'hr', 'manager', 'employee'] },
  { path: '/employees', icon: Users, label: 'Employees', roles: ['admin', 'hr', 'manager'] },
  { path: '/departments', icon: Building2, label: 'Departments', roles: ['admin', 'hr', 'manager'] },
  { path: '/skills', icon: Zap, label: 'Skills', roles: ['admin', 'hr', 'manager', 'employee'] },
  { path: '/leaves', icon: Calendar, label: 'Leave desk', roles: ['admin', 'hr', 'manager', 'employee'] },
  { path: '/leaves/approvals', icon: BadgeCheck, label: 'Approvals', roles: ['admin', 'hr', 'manager'] },
  { path: '/documents', icon: FileText, label: 'Documents', roles: ['admin', 'hr', 'manager', 'employee'] },
  { path: '/analytics', icon: BarChart3, label: 'Analytics', roles: ['admin', 'hr'] },
  { path: '/audit-logs', icon: Shield, label: 'Audit logs', roles: ['admin', 'hr'] },
  { path: '/settings', icon: Settings, label: 'Settings', roles: ['admin', 'hr', 'manager', 'employee'] },
];

export default function AppLayout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getAll({ limit: 1 }),
  });
  const unreadCount = notifData?.unreadCount || 0;

  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return { category: 'Dashboards', page: 'Overview' };
    if (path.startsWith('/employees/')) return { category: 'People', page: 'Employee Profile' };
    if (path.startsWith('/employees')) return { category: 'People', page: 'Employees' };
    if (path.startsWith('/departments/')) return { category: 'Organization', page: 'Department Details' };
    if (path.startsWith('/departments')) return { category: 'Organization', page: 'Departments' };
    if (path.startsWith('/skills')) return { category: 'Directory', page: 'Skills' };
    if (path.startsWith('/leaves/approvals')) return { category: 'Operations', page: 'Approvals' };
    if (path.startsWith('/leaves')) return { category: 'Operations', page: 'Leave Desk' };
    if (path.startsWith('/documents')) return { category: 'Files', page: 'Documents' };
    if (path.startsWith('/analytics')) return { category: 'Analytics', page: 'Reports' };
    if (path.startsWith('/audit-logs')) return { category: 'Security', page: 'Audit Logs' };
    if (path.startsWith('/settings')) return { category: 'Settings', page: 'Preferences' };
    if (path.startsWith('/notifications')) return { category: 'Notifications', page: 'Inbox' };
    return { category: 'App', page: 'Home' };
  };
  const { category, page } = getBreadcrumbs();

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const visibleNav = navItems.filter((item) => item.roles.some((role) => hasRole(role)));

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className={cn('mb-1 flex items-center px-4 py-5', collapsed ? 'justify-center' : 'gap-3')}>
        {collapsed ? (
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FFE264] to-[#F2A900] shadow-[0_0_24px_rgba(242,169,0,0.22)]">
            <Users size={18} className="text-[#001133]" />
          </div>
        ) : (
          <Logo size="sm" />
        )}
      </div>

      {!collapsed && (
        <div className="px-4 pb-3">
          <button
            onClick={() => setCmdOpen(true)}
            className="flex w-full items-center gap-2 rounded-md border border-white/5 bg-black/25 px-3 py-2 text-left text-xs text-white/35 transition hover:border-sun/20 hover:text-white/70"
          >
            <Search size={13} />
            <span className="flex-1 truncate">Search...</span>
            <kbd className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/30">K</kbd>
          </button>
        </div>
      )}

      <nav className="flex-1 space-y-1 px-3 min-h-0 sidebar-nav">
        {visibleNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn('sidebar-item', isActive && 'active', collapsed && 'justify-center px-2')}
            onClick={() => setMobileOpen(false)}
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={18} className="flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/5 p-3">
        {!collapsed && (
          <div className="mb-3 rounded-lg border border-sun/10 bg-sun/[0.06] px-3 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-accent">
              <CircleDot size={12} className="animate-pulse" />
              HR systems live
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-white/35">All people records synced.</p>
          </div>
        )}

        <div
          className={cn(
            'flex cursor-pointer items-center gap-3 rounded-md px-2 py-2.5 transition-all duration-200 hover:bg-white/5',
            collapsed && 'justify-center px-0',
          )}
          onClick={() => navigate('/settings')}
        >
          <div className="avatar h-8 w-8 flex-shrink-0 bg-gradient-to-br from-[#FFE264] to-[#F2A900] text-xs">
            {user?.profilePictureUrl || user?.profile_picture_url ? (
              <img src={user.profilePictureUrl || user.profile_picture_url} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              getInitials(user?.firstName || user?.first_name, user?.lastName || user?.last_name, user?.email)
            )}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="min-w-0 flex-1 overflow-hidden"
              >
                <p className="truncate text-sm font-medium text-white/90">
                  {user?.firstName || user?.first_name ? `${user.firstName || user.first_name} ${user.lastName || user.last_name}` : user?.email}
                </p>
                <p className="truncate text-xs capitalize text-white/35">{user?.role}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-1 px-1">
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-white/40 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_50%_-14%,rgba(48,127,226,0.18),transparent_30rem),radial-gradient(circle_at_88%_10%,rgba(242,169,0,0.10),transparent_24rem),linear-gradient(180deg,#00205B_0,#001133_5.25rem,#000b1d_5.25rem,#00050e_100%)] p-3 md:p-5">
      <div className="flex h-[calc(100vh-1.5rem)] overflow-hidden rounded-lg border border-white/10 bg-[#00050e] shadow-[0_30px_90px_rgba(0,0,0,0.6)] md:h-[calc(100vh-2.5rem)]">
        <motion.aside
          animate={{ width: collapsed ? 64 : 240 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="relative z-20 hidden flex-shrink-0 flex-col md:flex"
          style={{
            background: 'linear-gradient(180deg, rgba(10,13,12,0.98) 0%, rgba(8,10,9,0.98) 100%)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <SidebarContent />

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-7 z-30 flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
            style={{
              background: 'linear-gradient(135deg, #a3ff29, #21d978)',
              boxShadow: '0 0 16px rgba(163,255,41,0.36)',
            }}
          >
            {collapsed ? <ChevronRight size={12} className="text-[#07100c]" /> : <ChevronLeft size={12} className="text-[#07100c]" />}
          </button>
        </motion.aside>

        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/60 md:hidden"
                onClick={() => setMobileOpen(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed bottom-0 left-0 top-0 z-50 w-64 md:hidden"
                style={{
                  background: '#0a0d0c',
                  borderRight: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <SidebarContent />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className="flex flex-1 flex-col overflow-hidden">
          <header
            className="flex h-14 flex-shrink-0 items-center gap-4 bg-[#0c100f]/90 px-4 md:px-5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <button onClick={() => setMobileOpen(true)} className="rounded-md p-2 transition-colors hover:bg-white/5 md:hidden">
              <Menu size={20} className="text-white/60" />
            </button>

            <div className="hidden items-center gap-2 text-xs text-white/35 md:flex">
              <Command size={14} />
              <span>{category}</span>
              <span>/</span>
              <span className="text-white/75">{page}</span>
            </div>

            <button
              onClick={() => setCmdOpen(true)}
              className="flex flex-1 items-center gap-2 rounded-md border border-white/5 bg-black/20 px-3 py-2 text-left text-sm text-white/35 md:hidden"
            >
              <Search size={15} />
              <span>Search anything...</span>
            </button>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-white/5"
              >
                <Bell size={17} className="text-white/60" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-sun" />
                )}
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="avatar h-8 w-8 cursor-pointer text-xs transition-all hover:ring-2 hover:ring-sun/50"
              >
                {user?.profilePictureUrl || user?.profile_picture_url ? (
                  <img src={user.profilePictureUrl || user.profile_picture_url} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  getInitials(user?.firstName || user?.first_name, user?.lastName || user?.last_name, user?.email)
                )}
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-[#00050e]">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="h-full">
              <Outlet />
            </motion.div>
          </main>
        </div>

        <AnimatePresence>{notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}</AnimatePresence>
        <AnimatePresence>{cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} />}</AnimatePresence>
      </div>
    </div>
  );
}
