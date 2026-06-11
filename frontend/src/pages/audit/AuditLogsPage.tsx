import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Search, ChevronDown, ChevronUp, Globe, Laptop } from 'lucide-react';
import { auditService } from '../../api';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import Avatar from '../../components/Avatar/Avatar';
import { formatRelativeDate, cn, debounce } from '../../utils';

const ENTITY_COLORS: Record<string, string> = {
  employee: '#a3ff29',
  department: '#307FE2',
  skill: '#21d978',
  leave: '#FFE264',
  auth: '#F2A900',
  document: '#94a3b8',
};

// Formatted table comparing old and new values in the audit log
function ChangesDiff({ oldValues, newValues }: { oldValues: any; newValues: any }) {
  if (!oldValues && !newValues) return null;

  // Parse if string
  const oldValObj = typeof oldValues === 'string' ? JSON.parse(oldValues) : oldValues;
  const newValObj = typeof newValues === 'string' ? JSON.parse(newValues) : newValues;

  const allKeys = Array.from(
    new Set([...Object.keys(oldValObj || {}), ...Object.keys(newValObj || {})])
  ).filter((key) => key !== 'password_hash' && key !== 'password'); // Exclude passwords

  if (allKeys.length === 0) return <p className="text-xs text-white/30 italic">No field differences recorded</p>;

  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-white/5 bg-[#001133]/40 p-3">
      <p className="text-xs font-semibold text-white/50 mb-2">Detailed Changes</p>
      <table className="w-full text-xs text-left border-collapse">
        <thead>
          <tr className="border-b border-white/10 text-white/35 text-[10px] uppercase tracking-wider">
            <th className="py-1.5 pr-4 font-semibold">Field</th>
            <th className="py-1.5 pr-4 font-semibold">Old Value</th>
            <th className="py-1.5 font-semibold">New Value</th>
          </tr>
        </thead>
        <tbody>
          {allKeys.map((key) => {
            const oldVal = oldValObj?.[key];
            const newVal = newValObj?.[key];

            const oldStr = typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal ?? '');
            const newStr = typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal ?? '');

            // Only display fields that actually changed
            if (oldStr === newStr) return null;

            return (
              <tr key={key} className="border-b border-white/5 last:border-0 hover:bg-white/[0.01]">
                <td className="py-2 pr-4 font-mono font-medium text-white/60">{key}</td>
                <td className="py-2 pr-4 text-red-400 line-through max-w-[240px] truncate" title={oldStr}>
                  {oldStr || <span className="italic text-white/20">empty</span>}
                </td>
                <td className="py-2 text-lime-300 max-w-[240px] truncate" title={newStr}>
                  {newStr || <span className="italic text-white/20">empty</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});

  const doSearch = useCallback(
    debounce((val: string) => setDebouncedSearch(val), 350),
    []
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    doSearch(e.target.value);
    setPage(1);
  };

  const toggleExpand = (id: string) => {
    setExpandedLogs((p) => ({ ...p, [id]: !p[id] }));
  };

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', entityType, debouncedSearch, page],
    queryFn: () =>
      auditService.getAll({
        entityType: entityType || undefined,
        action: debouncedSearch || undefined,
        page,
        limit: 15,
      }),
  });

  const logs = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] text-white">
      <PageHeader title="Audit Logs" subtitle="Complete system activity and security trails" />

      {/* Filter and Search controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {['', 'employee', 'department', 'skill', 'leave', 'auth', 'document'].map((type) => (
            <button
              key={type}
              onClick={() => {
                setEntityType(type);
                setPage(1);
              }}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize border',
                entityType === type ? 'text-white' : 'text-white/35 border-white/6 bg-white/2 hover:text-white/60 hover:bg-white/4'
              )}
              style={
                entityType === type
                  ? {
                      background: `${ENTITY_COLORS[type] || 'linear-gradient(135deg, #a3ff29, #21d978)'}20`,
                      borderColor: `${ENTITY_COLORS[type] || '#a3ff29'}40`,
                      color: ENTITY_COLORS[type] || '#a3ff29',
                    }
                  : {}
              }
            >
              {type || 'All'}
            </button>
          ))}
        </div>

        <div className="relative w-full max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            value={search}
            onChange={handleSearch}
            placeholder="Search by action (e.g. LOGIN, CREATE...)"
            className="input-field pl-9 text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner fullPage />
      ) : logs.length === 0 ? (
        <EmptyState icon={Shield} title="No audit logs" description="System activity will appear here" />
      ) : (
        <div className="space-y-3">
          {logs.map((log: any, i: number) => {
            const isExpanded = !!expandedLogs[log.id];
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className={cn(
                  'glass-card rounded-2xl border border-white/5 transition-all overflow-hidden',
                  isExpanded ? 'bg-white/[0.03] border-white/10 shadow-lg' : 'hover:bg-white/2 hover:border-white/8'
                )}
              >
                {/* Header view */}
                <div
                  className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer select-none"
                  onClick={() => toggleExpand(log.id)}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <Avatar
                      firstName={log.userName?.split(' ')[0] || log.employeeName?.split(' ')[0]}
                      lastName={log.userName?.split(' ')[1] || log.employeeName?.split(' ')[1]}
                      email={log.userEmail}
                      src={log.profilePictureUrl}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-sm font-semibold text-white/80">{log.userName || log.userEmail || 'System'}</span>
                        <span
                          className="text-[10px] px-2.5 py-0.5 rounded-full capitalize font-semibold border"
                          style={{
                            background: `${ENTITY_COLORS[log.entity_type] || '#a3ff29'}12`,
                            borderColor: `${ENTITY_COLORS[log.entity_type] || '#a3ff29'}32`,
                            color: ENTITY_COLORS[log.entity_type] || '#a3ff29',
                          }}
                        >
                          {log.entity_type}
                        </span>
                      </div>
                      <p className="text-xs text-white/45 mt-1 font-mono uppercase tracking-wider font-semibold">
                        {log.action.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-[11px] text-white/30 hidden sm:inline-block">{formatRelativeDate(log.created_at)}</span>
                    <button className="text-white/40 hover:text-white transition-colors">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-5 pb-5 pt-1 border-t border-white/5 text-sm"
                    >
                      <div className="space-y-4">
                        {/* Device and IP Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-black/25 p-3.5 rounded-xl border border-white/5">
                          <div className="flex items-center gap-2.5 text-xs text-white/50">
                            <Globe size={13} className="text-lime-300/60 flex-shrink-0" />
                            <span className="font-medium">IP Address:</span>
                            <span className="font-mono text-white/70">{log.ip_address || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-xs text-white/50 min-w-0">
                            <Laptop size={13} className="text-lime-300/60 flex-shrink-0" />
                            <span className="font-medium">User Agent:</span>
                            <span className="truncate text-white/70" title={log.user_agent}>
                              {log.user_agent || 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* Resource details */}
                        <div className="text-xs text-white/40 flex items-center gap-2 flex-wrap">
                          <span>Target Resource ID:</span>
                          <span className="font-mono text-lime-200/80 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                            {log.entity_id || 'N/A'}
                          </span>
                          {log.employee_id && (
                            <>
                              <span className="mx-1.5 text-white/10">|</span>
                              <span>Target Employee ID:</span>
                              <span className="font-mono text-lime-200/80 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                {log.employee_id}
                              </span>
                            </>
                          )}
                          <span className="mx-1.5 text-white/10">|</span>
                          <span className="sm:hidden">Logged: {formatRelativeDate(log.created_at)}</span>
                        </div>

                        {/* Differences / values changed */}
                        <ChangesDiff oldValues={log.old_values} newValues={log.new_values} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}
    </div>
  );
}