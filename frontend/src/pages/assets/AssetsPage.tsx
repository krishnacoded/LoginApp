import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Laptop, Mouse, Monitor, CreditCard, Shield, Plus, Calendar, Search, Filter, History, UserPlus, Undo2, Ban, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { assetService, employeeService } from '../../api'
import { useAuth } from '../../store/auth.store'
import PageHeader from '../../components/common/PageHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import Pagination from '../../components/common/Pagination'
import { cn, formatDate } from '../../utils'

export default function AssetsPage() {
  const { user, hasRole } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'my' | 'requests' | 'manage'>('my')

  // Search/Filters for HR/Admin
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)

  // Modals state
  const [showCreate, setShowCreate] = useState(false)
  const [showAllocate, setShowAllocate] = useState(false)
  const [showReturn, setShowReturn] = useState(false)
  const [showStatusUpdate, setShowStatusUpdate] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null)

  // Asset Requests state
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestType, setRequestType] = useState('laptop')
  const [requestReason, setRequestReason] = useState('')
  const [selectedRequestForAction, setSelectedRequestForAction] = useState<any | null>(null)
  const [showActionModal, setShowActionModal] = useState<'approve' | 'reject' | null>(null)
  const [actionComment, setActionComment] = useState('')
  const [allocAssetId, setAllocAssetId] = useState('')

  // Form states
  const [newName, setNewName] = useState('')
  const [newSerial, setNewSerial] = useState('')
  const [newType, setNewType] = useState('laptop')
  
  const [allocEmployeeId, setAllocEmployeeId] = useState('')
  const [allocNotes, setAllocNotes] = useState('')
  
  const [returnNotes, setReturnNotes] = useState('')
  const [updateStatusVal, setUpdateStatusVal] = useState('damaged')
  const [updateStatusNotes, setUpdateStatusNotes] = useState('')

  // Queries
  const { data: myAssets, isLoading: loadingMy } = useQuery({
    queryKey: ['assets-my'],
    queryFn: () => assetService.getMyAssets(),
  })

  const { data: allAssetsData, isLoading: loadingAll } = useQuery({
    queryKey: ['assets-all', page, search, statusFilter, typeFilter],
    queryFn: () => assetService.getAll({ page, limit: 10, search, status: statusFilter, assetType: typeFilter }),
    enabled: hasRole(['admin', 'hr']) && activeTab === 'manage',
  })

  const { data: employees } = useQuery({
    queryKey: ['employees-list-all'],
    queryFn: async () => {
      const data = await employeeService.getAll({ limit: 100 })
      return data?.data || []
    },
    enabled: hasRole(['admin', 'hr']) && showAllocate,
  })

  const { data: assetDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['assets-detail', selectedAsset?.id],
    queryFn: () => assetService.getById(selectedAsset.id),
    enabled: !!selectedAsset && showHistory,
  })

  // Requests Queries
  const { data: requestsData, isLoading: loadingRequests } = useQuery({
    queryKey: ['asset-requests-list'],
    queryFn: () => assetService.getAssetRequests(),
    enabled: activeTab === 'requests',
  })

  const { data: availableAssets } = useQuery({
    queryKey: ['assets-available-list'],
    queryFn: async () => {
      const res = await assetService.getAll({ status: 'available', limit: 100 })
      return res?.data || []
    },
    enabled: hasRole(['admin', 'hr']) && showActionModal === 'approve' && selectedRequestForAction?.status === 'Pending HR Approval',
  })

  // Requests Mutations
  const createRequestMutation = useMutation({
    mutationFn: (data: any) => assetService.createAssetRequest(data),
    onSuccess: () => {
      toast.success('Asset request submitted successfully!')
      queryClient.invalidateQueries({ queryKey: ['asset-requests-list'] })
      setShowRequestModal(false)
      setRequestReason('')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to submit request'),
  })

  const actionRequestMutation = useMutation({
    mutationFn: (data: { id: string; action: 'approve' | 'reject'; comment?: string; assetId?: string }) =>
      data.action === 'approve'
        ? assetService.approveAssetRequest(data.id, data.comment, data.assetId)
        : assetService.rejectAssetRequest(data.id, data.comment),
    onSuccess: (_, variables) => {
      toast.success(`Asset request ${variables.action}d successfully!`)
      queryClient.invalidateQueries({ queryKey: ['asset-requests-list'] })
      queryClient.invalidateQueries({ queryKey: ['assets-all'] })
      queryClient.invalidateQueries({ queryKey: ['assets-my'] })
      setShowActionModal(null)
      setSelectedRequestForAction(null)
      setActionComment('')
      setAllocAssetId('')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Action failed'),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => assetService.create(data),
    onSuccess: () => {
      toast.success('Asset created successfully!')
      queryClient.invalidateQueries({ queryKey: ['assets-all'] })
      setShowCreate(false)
      setNewName('')
      setNewSerial('')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create asset'),
  })

  const allocateMutation = useMutation({
    mutationFn: (data: any) => assetService.allocate(selectedAsset.id, data.employeeId, data.notes),
    onSuccess: () => {
      toast.success('Asset allocated successfully!')
      queryClient.invalidateQueries({ queryKey: ['assets-all'] })
      setShowAllocate(false)
      setAllocEmployeeId('')
      setAllocNotes('')
      setSelectedAsset(null)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to allocate asset'),
  })

  const returnMutation = useMutation({
    mutationFn: (data: any) => assetService.returnAsset(selectedAsset.id, data.notes),
    onSuccess: () => {
      toast.success('Asset returned to stock!')
      queryClient.invalidateQueries({ queryKey: ['assets-all'] })
      setShowReturn(false)
      setReturnNotes('')
      setSelectedAsset(null)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to return asset'),
  })

  const updateStatusMutation = useMutation({
    mutationFn: (data: any) => assetService.updateStatus(selectedAsset.id, data.status, data.notes),
    onSuccess: () => {
      toast.success(`Asset status updated successfully!`)
      queryClient.invalidateQueries({ queryKey: ['assets-all'] })
      setShowStatusUpdate(false)
      setUpdateStatusNotes('')
      setSelectedAsset(null)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update status'),
  })

  // Icons Helper
  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'laptop': return <Laptop size={18} className="text-indigo-400" />
      case 'mouse': return <Mouse size={18} className="text-sky-400" />
      case 'monitor': return <Monitor size={18} className="text-emerald-400" />
      case 'id_card': return <CreditCard size={18} className="text-purple-400" />
      case 'access_card': return <Shield size={18} className="text-pink-400" />
      default: return <Laptop size={18} className="text-white/40" />
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
      case 'allocated': return 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
      case 'returned': return 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
      case 'damaged': return 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
      case 'lost': return 'bg-red-500/15 text-red-400 border border-red-500/30'
      default: return 'bg-white/5 text-white/40'
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <PageHeader
        title="Asset Directory"
        subtitle="Manage and track company assets and equipment"
        actions={
          activeTab === 'requests' ? (
            <button onClick={() => setShowRequestModal(true)} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Request Asset
            </button>
          ) : hasRole(['admin', 'hr']) && activeTab === 'manage' ? (
            <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Add New Asset
            </button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-white/5 pb-px gap-4">
        <button
          onClick={() => setActiveTab('my')}
          className={cn('pb-3 text-sm font-semibold border-b-2 transition-all duration-200', activeTab === 'my' ? 'border-sun text-sun' : 'border-transparent text-white/35 hover:text-white/60')}
        >
          My Allocated Assets
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={cn('pb-3 text-sm font-semibold border-b-2 transition-all duration-200', activeTab === 'requests' ? 'border-sun text-sun' : 'border-transparent text-white/35 hover:text-white/60')}
        >
          Asset Requests
        </button>
        {hasRole(['admin', 'hr']) && (
          <button
            onClick={() => setActiveTab('manage')}
            className={cn('pb-3 text-sm font-semibold border-b-2 transition-all duration-200', activeTab === 'manage' ? 'border-sun text-sun' : 'border-transparent text-white/35 hover:text-white/60')}
          >
            Manage Assets (HR/Admin)
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'my' && (
          <motion.div
            key="my"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {loadingMy ? (
              <div className="col-span-full"><LoadingSpinner /></div>
            ) : !myAssets || myAssets.length === 0 ? (
              <div className="col-span-full"><EmptyState icon={Laptop} title="No assets assigned" description="You do not currently have any equipment assigned to you" /></div>
            ) : (
              myAssets.map((alloc: any) => (
                <div key={alloc.id} className="glass-card p-5 rounded-2xl flex flex-col justify-between border border-white/5 hover:border-white/10 transition duration-200">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-white/5 flex-shrink-0">
                      {getAssetIcon(alloc.asset_type)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-white/80 truncate">{alloc.asset_name}</h4>
                      <p className="text-xs text-white/35 mt-1 font-mono">S/N: {alloc.serial_number}</p>
                      <p className="text-[11px] text-white/20 uppercase font-semibold mt-1 tracking-wider">{alloc.asset_type}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 flex flex-col gap-1.5 text-xs text-white/40">
                    <p>Allocated On: <span className="text-white/60">{formatDate(alloc.allocated_at)}</span></p>
                    {alloc.notes && <p className="italic">Note: "{alloc.notes}"</p>}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'requests' && (
          <motion.div
            key="requests"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="glass-card rounded-2xl overflow-hidden">
              {loadingRequests ? (
                <div className="p-10"><LoadingSpinner /></div>
              ) : !requestsData || requestsData.length === 0 ? (
                <div className="p-10">
                  <EmptyState icon={Laptop} title="No asset requests" description="No asset requests have been submitted yet" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/[0.02] text-xs text-white/35 uppercase">
                      <tr>
                        <th className="p-4">Requested Item</th>
                        {hasRole(['admin', 'hr', 'manager']) && <th className="p-4">Employee</th>}
                        <th className="p-4">Reason</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Timeline / Comments</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {requestsData.map((req: any) => {
                        const canApprove = (
                          (req.status === 'Pending Manager Approval' && (hasRole(['admin', 'hr']) || (user?.employeeId || user?.employee_id) === req.employee_manager_id)) ||
                          (req.status === 'Pending HR Approval' && hasRole(['admin', 'hr']))
                        );

                        return (
                          <tr key={req.id} className="hover:bg-white/[0.01] transition">
                            <td className="p-4 flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-white/5 flex-shrink-0">{getAssetIcon(req.asset_type)}</div>
                              <div>
                                <div className="font-semibold text-white/80 capitalize">{req.asset_type.replace('_', ' ')}</div>
                                <div className="text-[10px] text-white/30">{formatDate(req.created_at || req.createdAt)}</div>
                              </div>
                            </td>
                            {hasRole(['admin', 'hr', 'manager']) && (
                              <td className="p-4 text-xs">
                                <span className="font-medium text-white/70">{req.employee_first_name} {req.employee_last_name}</span>
                                <span className="text-[10px] text-white/30 block font-mono">{req.employee_code}</span>
                              </td>
                            )}
                            <td className="p-4 text-xs text-white/60 max-w-xs truncate font-medium" title={req.reason}>
                              {req.reason || '--'}
                            </td>
                            <td className="p-4">
                              <span className={cn(
                                'text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border',
                                req.status === 'Approved' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                                req.status === 'Rejected' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                                'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              )}>
                                {req.status}
                              </span>
                            </td>
                            <td className="p-4 text-xs space-y-1">
                              {req.manager_comment && (
                                <p className="text-[11px] text-white/40">
                                  <span className="font-semibold text-white/60">Manager:</span> "{req.manager_comment}"
                                </p>
                              )}
                              {req.hr_comment && (
                                <p className="text-[11px] text-white/40">
                                  <span className="font-semibold text-white/60">HR:</span> "{req.hr_comment}"
                                </p>
                              )}
                              {req.allocated_asset_serial && (
                                <p className="text-[10px] text-emerald-400 font-mono">
                                  Linked: {req.allocated_asset_name} ({req.allocated_asset_serial})
                                </p>
                              )}
                              {!req.manager_comment && !req.hr_comment && !req.allocated_asset_serial && (
                                <span className="text-white/20">--</span>
                              )}
                            </td>
                            <td className="p-4">
                              {canApprove ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => { setSelectedRequestForAction(req); setShowActionModal('approve') }}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => { setSelectedRequestForAction(req); setShowActionModal('reject') }}
                                    className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-white/25">No actions</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'manage' && (
          <motion.div
            key="manage"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
              <div className="flex-1 min-w-[200px] relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  placeholder="Search assets name or S/N..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  className="bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs w-full text-white/70 focus:outline-none focus:border-sun"
                />
              </div>

              <div className="w-[180px]">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs w-full text-white/70 focus:outline-none focus:border-sun"
                >
                  <option value="">All Statuses</option>
                  <option value="available">Available</option>
                  <option value="allocated">Allocated</option>
                  <option value="damaged">Damaged</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              <div className="w-[180px]">
                <select
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs w-full text-white/70 focus:outline-none focus:border-sun"
                >
                  <option value="">All Types</option>
                  <option value="laptop">Laptop</option>
                  <option value="mouse">Mouse</option>
                  <option value="monitor">Monitor</option>
                  <option value="id_card">ID Card</option>
                  <option value="access_card">Access Card</option>
                  <option value="software_license">Software License</option>
                </select>
              </div>
            </div>

            {/* Asset Table */}
            <div className="glass-card rounded-2xl overflow-hidden">
              {loadingAll ? (
                <div className="p-10"><LoadingSpinner /></div>
              ) : !allAssetsData?.data || allAssetsData.data.length === 0 ? (
                <div className="p-10"><EmptyState icon={Laptop} title="No assets found" description="Create a new asset or change filters" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/[0.02] text-xs text-white/35 uppercase">
                      <tr>
                        <th className="p-4">Asset Detail</th>
                        <th className="p-4">Serial Number</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Assigned To</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {allAssetsData.data.map((asset: any) => (
                        <tr key={asset.id} className="hover:bg-white/[0.01] transition">
                          <td className="p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/5 flex-shrink-0">{getAssetIcon(asset.asset_type)}</div>
                            <div>
                              <div className="font-semibold text-white/80">{asset.name}</div>
                              <div className="text-[10px] text-white/30 uppercase tracking-wider">{asset.asset_type.replace('_', ' ')}</div>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-xs text-white/60">{asset.serial_number}</td>
                          <td className="p-4">
                            <span className={cn('text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full', getStatusStyle(asset.status))}>
                              {asset.status}
                            </span>
                          </td>
                          <td className="p-4 text-xs">
                            {asset.allocated_to_name ? (
                              <div>
                                <span className="font-medium text-white/70">{asset.allocated_to_name}</span>
                                <span className="text-[10px] text-white/30 block">{asset.allocated_to_code}</span>
                              </div>
                            ) : (
                              <span className="text-white/25">--</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              {asset.status === 'available' ? (
                                <button
                                  onClick={() => { setSelectedAsset(asset); setShowAllocate(true) }}
                                  className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 flex items-center gap-1 text-xs px-2"
                                  title="Assign Asset"
                                >
                                  <UserPlus size={12} /> Assign
                                </button>
                              ) : asset.status === 'allocated' ? (
                                <button
                                  onClick={() => { setSelectedAsset(asset); setShowReturn(true) }}
                                  className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 text-xs px-2"
                                  title="Mark Returned"
                                >
                                  <Undo2 size={12} /> Return
                                </button>
                              ) : null}

                              <button
                                onClick={() => { setSelectedAsset(asset); setShowStatusUpdate(true) }}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 flex items-center gap-1 text-xs px-2"
                                title="Change Status"
                              >
                                <Ban size={12} /> Status
                              </button>

                              <button
                                onClick={() => { setSelectedAsset(asset); setShowHistory(true) }}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 flex items-center gap-1 text-xs px-2"
                                title="View History"
                              >
                                <History size={12} /> History
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {allAssetsData?.pagination && (
                <div className="p-3 border-t border-white/5">
                  <Pagination pagination={allAssetsData.pagination} onPageChange={setPage} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showCreate && (
          <div className="modal-backdrop">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="modal-content max-w-md">
              <h3 className="text-lg font-semibold text-white/80 mb-4">Add New Asset to Master Registry</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  createMutation.mutate({ name: newName, serialNumber: newSerial, assetType: newType })
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs text-white/40 mb-1">Asset Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 w-full text-white/80 focus:outline-none focus:border-sun"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1">Serial Number (S/N)</label>
                  <input
                    type="text"
                    value={newSerial}
                    onChange={(e) => setNewSerial(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 w-full text-white/80 focus:outline-none focus:border-sun"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1">Asset Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 w-full text-white/80 focus:outline-none focus:border-sun"
                  >
                    <option value="laptop">Laptop</option>
                    <option value="mouse">Mouse</option>
                    <option value="monitor">Monitor</option>
                    <option value="id_card">ID Card</option>
                    <option value="access_card">Access Card</option>
                    <option value="software_license">Software License</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={createMutation.isPending} className="btn-primary">Add Asset</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ALLOCATE MODAL */}
      <AnimatePresence>
        {showAllocate && (
          <div className="modal-backdrop">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="modal-content max-w-md">
              <h3 className="text-lg font-semibold text-white/80 mb-2">Allocate Asset</h3>
              <p className="text-xs text-white/40 mb-4">Assigning: <span className="font-semibold text-white/70">{selectedAsset?.name} (S/N: {selectedAsset?.serial_number})</span></p>
              
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  allocateMutation.mutate({ employeeId: allocEmployeeId, notes: allocNotes })
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs text-white/40 mb-1">Select Employee</label>
                  <select
                    value={allocEmployeeId}
                    onChange={(e) => setAllocEmployeeId(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 w-full text-white/80 focus:outline-none focus:border-sun"
                    required
                  >
                    <option value="">Choose Employee...</option>
                    {employees?.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.employee_code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1">Allocation Notes</label>
                  <textarea
                    value={allocNotes}
                    onChange={(e) => setAllocNotes(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 w-full text-white/80 focus:outline-none focus:border-sun min-h-[80px]"
                    placeholder="e.g. Assigned laptop on first day"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button type="button" onClick={() => { setShowAllocate(false); setSelectedAsset(null) }} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={allocateMutation.isPending} className="btn-primary">Allocate</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RETURN MODAL */}
      <AnimatePresence>
        {showReturn && (
          <div className="modal-backdrop">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="modal-content max-w-md">
              <h3 className="text-lg font-semibold text-white/80 mb-2">Process Asset Return</h3>
              <p className="text-xs text-white/40 mb-4">Returning: <span className="font-semibold text-white/70">{selectedAsset?.name}</span> (currently allocated to <span className="text-indigo-400">{selectedAsset?.allocated_to_name}</span>)</p>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  returnMutation.mutate({ notes: returnNotes })
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs text-white/40 mb-1">Return Notes</label>
                  <textarea
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 w-full text-white/80 focus:outline-none focus:border-sun min-h-[80px]"
                    placeholder="e.g. Device returned in good working condition."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button type="button" onClick={() => { setShowReturn(false); setSelectedAsset(null) }} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={returnMutation.isPending} className="btn-primary bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/10">Mark Returned</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STATUS UPDATE MODAL */}
      <AnimatePresence>
        {showStatusUpdate && (
          <div className="modal-backdrop">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="modal-content max-w-md">
              <h3 className="text-lg font-semibold text-white/80 mb-2">Update Asset Status</h3>
              <p className="text-xs text-white/40 mb-4">Asset: <span className="font-semibold text-white/70">{selectedAsset?.name} (S/N: {selectedAsset?.serial_number})</span></p>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  updateStatusMutation.mutate({ status: updateStatusVal, notes: updateStatusNotes })
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs text-white/40 mb-1">Select New Status</label>
                  <select
                    value={updateStatusVal}
                    onChange={(e) => setUpdateStatusVal(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 w-full text-white/80 focus:outline-none focus:border-sun"
                  >
                    <option value="available">Available (In Stock)</option>
                    <option value="damaged">Damaged</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1">Status Notes / Explanation</label>
                  <textarea
                    value={updateStatusNotes}
                    onChange={(e) => setUpdateStatusNotes(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 w-full text-white/80 focus:outline-none focus:border-sun min-h-[80px]"
                    placeholder="Provide details about damage, lost circumstances, or recovery..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button type="button" onClick={() => { setShowStatusUpdate(false); setSelectedAsset(null) }} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={updateStatusMutation.isPending} className="btn-primary">Update Status</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HISTORY MODAL */}
      <AnimatePresence>
        {showHistory && (
          <div className="modal-backdrop">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="modal-content max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white/80">Asset Lifecycle History</h3>
                <button onClick={() => { setShowHistory(false); setSelectedAsset(null) }} className="text-white/40 hover:text-white/70 text-xs">Close</button>
              </div>
              <p className="text-xs text-sun mb-4">{selectedAsset?.name} · S/N: {selectedAsset?.serial_number}</p>

              {loadingDetail ? (
                <LoadingSpinner />
              ) : !assetDetail?.history || assetDetail.history.length === 0 ? (
                <p className="text-sm text-white/30 text-center py-6">No historical records logged for this asset</p>
              ) : (
                <div className="max-h-[350px] overflow-y-auto pr-2 space-y-3 font-sans">
                  {assetDetail.history.map((hist: any, i: number) => (
                    <div key={hist.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex gap-3 text-xs leading-relaxed">
                      <div className="flex flex-col items-center">
                        <div className={cn('p-1 rounded-full text-white', 
                          hist.action === 'allocate' ? 'bg-indigo-600' : 
                          hist.action === 'return' ? 'bg-emerald-600' : 'bg-white/10'
                        )}>
                          {hist.action === 'allocate' ? <UserPlus size={10} /> : <Undo2 size={10} />}
                        </div>
                        {i < assetDetail.history.length - 1 && <div className="w-px h-full bg-white/10 mt-1" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between font-semibold text-white/80">
                          <span className="capitalize">{hist.action.replace('_', ' ')}</span>
                          <span className="text-[10px] text-white/20 font-normal">{formatDate(hist.created_at)}</span>
                        </div>
                        <p className="text-white/50 mt-1">{hist.notes}</p>
                        <div className="text-[10px] text-white/30 mt-1.5 flex justify-between">
                          <span>By: {hist.performed_by_email}</span>
                          {hist.employee_name && <span>Target: {hist.employee_name} ({hist.employee_code})</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REQUEST ASSET MODAL */}
      <AnimatePresence>
        {showRequestModal && (
          <div className="modal-backdrop">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="modal-content max-w-md">
              <h3 className="text-lg font-semibold text-white/80 mb-4">Request Equipment / Asset</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  createRequestMutation.mutate({ assetType: requestType, reason: requestReason })
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs text-white/40 mb-1">Asset Type</label>
                  <select
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 w-full text-white/80 focus:outline-none focus:border-sun"
                  >
                    <option value="laptop">Laptop</option>
                    <option value="mouse">Mouse</option>
                    <option value="monitor">Monitor</option>
                    <option value="id_card">ID Card</option>
                    <option value="access_card">Access Card</option>
                    <option value="software_license">Software License</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1">Reason for Request</label>
                  <textarea
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 w-full text-white/80 focus:outline-none focus:border-sun min-h-[80px]"
                    placeholder="Describe why you need this asset..."
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button type="button" onClick={() => setShowRequestModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={createRequestMutation.isPending} className="btn-primary">Submit Request</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REQUEST ACTION MODAL (APPROVE/REJECT) */}
      <AnimatePresence>
        {showActionModal && selectedRequestForAction && (
          <div className="modal-backdrop">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="modal-content max-w-md">
              <h3 className="text-lg font-semibold text-white/80 mb-2">
                {showActionModal === 'approve' ? 'Approve' : 'Reject'} Asset Request
              </h3>
              <p className="text-xs text-white/40 mb-4">
                Employee: <span className="font-semibold text-white/70">{selectedRequestForAction.employee_first_name} {selectedRequestForAction.employee_last_name}</span> · Item: <span className="capitalize text-sun font-semibold">{selectedRequestForAction.asset_type.replace('_', ' ')}</span>
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  actionRequestMutation.mutate({
                    id: selectedRequestForAction.id,
                    action: showActionModal,
                    comment: actionComment,
                    assetId: allocAssetId || undefined
                  })
                }}
                className="space-y-4"
              >
                {showActionModal === 'approve' && selectedRequestForAction.status === 'Pending HR Approval' && (
                  <div>
                    <label className="block text-xs text-white/40 mb-1">Allocate Physical Asset *</label>
                    <select
                      value={allocAssetId}
                      onChange={(e) => setAllocAssetId(e.target.value)}
                      className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 w-full text-white/80 focus:outline-none focus:border-sun"
                      required
                    >
                      <option value="">Select an available asset...</option>
                      {availableAssets?.map((asset: any) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.name} (S/N: {asset.serial_number})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-white/40 mb-1">Comments / Notes</label>
                  <textarea
                    value={actionComment}
                    onChange={(e) => setActionComment(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 w-full text-white/80 focus:outline-none focus:border-sun min-h-[80px]"
                    placeholder="Enter any feedback or justification..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button type="button" onClick={() => { setShowActionModal(null); setSelectedRequestForAction(null); setActionComment(''); setAllocAssetId('') }} className="btn-secondary">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionRequestMutation.isPending}
                    className={cn(
                      "btn-primary",
                      showActionModal === 'reject' && "bg-red-600 hover:bg-red-500 shadow-red-500/10"
                    )}
                  >
                    {showActionModal === 'approve' ? 'Approve' : 'Reject'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
