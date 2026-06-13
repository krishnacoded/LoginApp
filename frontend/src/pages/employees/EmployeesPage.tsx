import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Filter, LayoutGrid, LayoutList, MoreHorizontal,
  User, Mail, Building2, Calendar, Edit, Trash2, RefreshCw, Eye
} from 'lucide-react';
import { employeeService, departmentService } from '../../api';
import { useAuth } from '../../store/auth.store';
import { cn, getInitials, getStatusColor, getStatusLabel, formatDate, generateAvatarColor, debounce } from '../../utils';
import { toast } from 'sonner';
import EmployeeFormModal from '../../components/employees/EmployeeFormModal';
import EmployeeTable from '../../components/employees/EmployeeTable'
import ErrorState from '../../components/common/ErrorState';

const EMPLOYMENT_STATUSES = ['active', 'on_leave', 'terminated', 'inactive'];
const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'intern'];

export default function EmployeesPage() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({ department: '', status: '', employmentType: '' });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState<any>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('add') === 'true' && hasRole(['admin', 'hr'])) {
      setShowCreateModal(true);
      navigate('/employees', { replace: true });
    }
  }, [hasRole, navigate]);

  const doSearch = useCallback(
    debounce((val: string) => setDebouncedSearch(val), 350),
    []
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    doSearch(e.target.value);
    setPage(1);
  };

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['employees', debouncedSearch, filters, page],
    queryFn: () => employeeService.getAll({
      search: debouncedSearch,
      department: filters.department,
      status: filters.status,
      employmentType: filters.employmentType,
      page,
      limit: 12,
    }),
  });

  const { data: departments } = useQuery({
    queryKey: ['departments-all'],
    queryFn: () => departmentService.getAll({ limit: 100 }),
    select: (d) => d.data,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee deleted successfully');
    },
    onError: () => toast.error('Failed to delete employee'),
  });

  const employees = data?.data || [];
  const pagination = data?.pagination;
  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete employee ${name}? This can be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="text-sm text-white/30 mt-0.5">
            {pagination?.total ? `${pagination.total} total employees` : 'Manage your workforce'}
          </p>
        </div>

        {hasRole(['admin', 'hr']) && (
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            <Plus size={16} />
            Add Employee
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            value={search}
            onChange={handleSearch}
            placeholder="Search by name, code, designation..."
            className="input-field pl-9"
          />
          {isFetching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-lime-400/30 border-t-lime-400 rounded-full animate-spin" />
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn('btn-secondary flex items-center gap-2', showFilters && 'border-lime-400/50 text-lime-300')}
          >
            <Filter size={15} />
            Filters
            {Object.values(filters).some(Boolean) && (
              <span className="w-2 h-2 rounded-full bg-lime-400" />
            )}
          </button>

          {/* View toggle */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={() => setViewMode('table')}
              className={cn('p-2 transition-colors', viewMode === 'table' ? 'bg-lime-400/20 text-lime-300' : 'hover:bg-white/5 text-white/40')}
            >
              <LayoutList size={15} />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={cn('p-2 transition-colors', viewMode === 'card' ? 'bg-lime-400/20 text-lime-300' : 'hover:bg-white/5 text-white/40')}
            >
              <LayoutGrid size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-xl p-4 overflow-hidden"
          >
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[160px]">
                <label className="text-xs text-white/40 mb-1.5 block font-medium">Department</label>
                <select
                  value={filters.department}
                  onChange={(e) => { setFilters(f => ({ ...f, department: e.target.value })); setPage(1); }}
                  className="input-field text-sm"
                >
                  <option value="">All Departments</option>
                  {departments?.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[160px]">
                <label className="text-xs text-white/40 mb-1.5 block font-medium">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
                  className="input-field text-sm"
                >
                  <option value="">All Statuses</option>
                  {EMPLOYMENT_STATUSES.map(s => (
                    <option key={s} value={s}>{getStatusLabel(s)}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[160px]">
                <label className="text-xs text-white/40 mb-1.5 block font-medium">Employment Type</label>
                <select
                  value={filters.employmentType}
                  onChange={(e) => { setFilters(f => ({ ...f, employmentType: e.target.value })); setPage(1); }}
                  className="input-field text-sm"
                >
                  <option value="">All Types</option>
                  {EMPLOYMENT_TYPES.map(t => (
                    <option key={t} value={t}>{getStatusLabel(t)}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => { setFilters({ department: '', status: '', employmentType: '' }); setPage(1); }}
                  className="btn-secondary text-sm"
                >
                  <RefreshCw size={13} />
                  Reset
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {isError ? (
        <div className="glass-card rounded-2xl">
          <ErrorState
            title="Employees could not load"
            message="Check your connection and try again. The rest of the app will stay available."
            onRetry={() => refetch()}
          />
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="loading-pulse h-28 rounded-2xl" />
          ))}
        </div>
      ) : employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 glass-card rounded-2xl">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(79,70,229,0.1)' }}>
            <Users size={28} className="text-lime-300/50" />
          </div>
          <h3 className="text-lg font-semibold text-white/50 mb-2">No employees found</h3>
          <p className="text-sm text-white/25">
            {search || Object.values(filters).some(Boolean) ? 'Try different filters' : 'Add your first employee to get started'}
          </p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {employees.map((emp: any, i: number) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              index={i}
              canEdit={hasRole(['admin', 'hr'])}
              onView={() => navigate(`/employees/${emp.id}`)}
              onEdit={() => setEditEmployee(emp)}
              onDelete={() => handleDelete(emp.id, `${emp.firstName} ${emp.lastName}`)}
            />
          ))}
        </div>
      ) : (
        <EmployeeTable
          employees={employees}
          canEdit={hasRole(['admin', 'hr'])}
          onView={(id) => navigate(`/employees/${id}`)}
          onEdit={(emp) => setEditEmployee(emp)}
          onDelete={(emp) => handleDelete(emp.id, `${emp.firstName} ${emp.lastName}`)}
        />
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={!pagination.hasPrevPage}
            className="btn-secondary text-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-sm font-medium transition-all',
                    page === p
                      ? 'text-[#001133]'
                      : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                  )}
                  style={page === p ? { background: 'linear-gradient(135deg, #FFE264, #F2A900)' } : {}}
                >
                  {p}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!pagination.hasNextPage}
            className="btn-secondary text-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {(showCreateModal || editEmployee) && (
          <EmployeeFormModal
            employee={editEmployee}
            onClose={() => { setShowCreateModal(false); setEditEmployee(null); }}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['employees'] });
              setShowCreateModal(false);
              setEditEmployee(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EmployeeCard({ employee: emp, index, canEdit, onView, onEdit, onDelete }: any) {
  const [menuOpen, setMenuOpen] = useState(false);
  const avatarGrad = generateAvatarColor(`${emp.firstName}${emp.lastName}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card-hover rounded-2xl p-5 relative cursor-pointer group"
      onClick={onView}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white overflow-hidden bg-gradient-to-br', avatarGrad)}>
            {emp.profilePictureUrl ? (
              <img src={emp.profilePictureUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              getInitials(emp.firstName, emp.lastName)
            )}
          </div>
          <div>
            <p className="font-semibold text-white/85 text-sm">
              {emp.firstName} {emp.lastName}
            </p>
            <p className="text-xs text-white/35">{emp.employeeCode}</p>
          </div>
        </div>

        {canEdit && (
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal size={15} className="text-white/40" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  className="absolute right-0 top-8 w-40 rounded-xl overflow-hidden z-10 shadow-2xl"
                  style={{ background: 'rgba(10,15,30,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <button onClick={() => { onView(); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors">
                    <Eye size={14} /> View Profile
                  </button>
                  <button onClick={() => { onEdit(); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors">
                    <Edit size={14} /> Edit
                  </button>
                  <button onClick={() => { onDelete(); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 size={14} /> Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        {emp.designation && (
          <div className="flex items-center gap-2 text-xs text-white/40">
            <User size={11} />
            <span className="truncate">{emp.designation}</span>
          </div>
        )}
        {emp.departmentName && (
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Building2 size={11} />
            <span className="truncate">{emp.departmentName}</span>
          </div>
        )}
        {emp.joiningDate && (
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Calendar size={11} />
            <span>Joined {formatDate(emp.joiningDate)}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className={getStatusColor(emp.employmentStatus)}>
          {getStatusLabel(emp.employmentStatus)}
        </span>
        {emp.skills && emp.skills.filter(Boolean).length > 0 && (
          <div className="flex gap-1">
            {emp.skills.filter(Boolean).slice(0, 2).map((skill: string, i: number) => (
              <span key={i} className="badge badge-info text-xs">{skill}</span>
            ))}
            {emp.skills.filter(Boolean).length > 2 && (
              <span className="text-xs text-white/25">+{emp.skills.filter(Boolean).length - 2}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Users({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
