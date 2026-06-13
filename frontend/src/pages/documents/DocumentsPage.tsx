import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, FileCheck2, FileText, Filter, Search, ShieldCheck, Upload, AlertTriangle, X, Loader2, Send, Check } from 'lucide-react';
import { toast } from 'sonner';
import { documentService } from '../../api/document.service';
import { notificationService, employeeService } from '../../api';
import { formatDate, formatFileSize, getStatusLabel, cn } from '../../utils';
import type { Document } from '../../types/document.types';
import { useAuth } from '../../store/auth.store';
import FileUpload from '../../components/common/FileUpload';
import { AnimatePresence, motion } from 'framer-motion';

const typeLabels: Record<string, string> = {
  resume: 'Resume',
  id_proof: 'ID Proof',
  certificate: 'Certificate',
  contract: 'Contract',
  tax: 'Tax',
  performance: 'Performance',
  policy: 'Company Policy',
  other: 'Other',
};

export default function DocumentsPage() {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'my' | 'policies'>('my');
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>('all');
  
  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [verifyingDoc, setVerifyingDoc] = useState<any | null>(null);

  // Upload destination (HR only)
  const [uploadDestination, setUploadDestination] = useState<'employee' | 'company'>('employee');

  // Form states for upload
  const [uploadEmployeeId, setUploadEmployeeId] = useState('');
  const [uploadDocType, setUploadDocType] = useState('other');
  const [uploadDocName, setUploadDocName] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadExpiry, setUploadExpiry] = useState('');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);

  // Form states for upload request
  const [requestEmployeeId, setRequestEmployeeId] = useState('');
  const [requestDocName, setRequestDocName] = useState('');
  const [requestMessage, setRequestMessage] = useState('');

  // Check query parameters for automatic upload request triggers
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('requestUpload') === 'true') {
      const docName = params.get('docName') || '';
      const docType = params.get('docType') || 'other';
      setUploadDocName(docName);
      setUploadDocType(docType);
      setShowUploadModal(true);
      // clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Set default employee ID if not manager/HR/admin
  const isAdminOrHROrManager = hasRole(['admin', 'hr', 'manager']);
  useEffect(() => {
    if (!isAdminOrHROrManager && user) {
      const empId = user.employeeId || user.employee_id || '';
      setUploadEmployeeId(empId);
    }
  }, [user, isAdminOrHROrManager]);

  // Queries
  const { data: employeesData } = useQuery({
    queryKey: ['employees-list-docs'],
    queryFn: () => employeeService.getAll({ limit: 150 }),
    enabled: isAdminOrHROrManager,
  });
  const employeeList = employeesData?.data || [];

  // Query documents
  const { data, isLoading } = useQuery({
    queryKey: ['documents', search, type, activeTab],
    queryFn: () =>
      documentService.getAll({
        search: search || undefined,
        documentType: activeTab === 'policies' ? 'policy' : (type === 'all' ? undefined : (type as any)),
        limit: 100,
      }),
    retry: false,
  });
  const documents = data?.data || [];

  // Mutations
  const uploadMutation = useMutation({
    mutationFn: async () => {
      const empId = uploadDestination === 'company' ? 'company' : (isAdminOrHROrManager ? uploadEmployeeId : (user?.employeeId || user?.employee_id));
      if (!empId) {
        throw new Error('Please select an employee');
      }
      return documentService.upload(empId, {
        files: uploadFiles,
        documentType: (uploadDestination === 'company' ? 'policy' : uploadDocType) as any,
        documentName: uploadDocName,
        notes: uploadNotes,
        expiryDate: uploadExpiry || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Document uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setShowUploadModal(false);
      setUploadFiles([]);
      setUploadDocName('');
      setUploadNotes('');
      setUploadExpiry('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to upload document');
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (data: { id: string; isVerified: boolean }) =>
      documentService.verify(data.id, { isVerified: data.isVerified, verificationNotes: 'Verified' }),
    onSuccess: () => {
      toast.success('Document verification state updated');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setVerifyingDoc(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update verification');
    },
  });

  const requestMutation = useMutation({
    mutationFn: async () => {
      const selectedEmp = employeeList.find((e: any) => e.id === requestEmployeeId);
      if (!selectedEmp || !selectedEmp.user_id) {
        throw new Error('Selected employee has no user record linked');
      }
      return notificationService.sendManual({
        userId: selectedEmp.user_id,
        type: 'document_request',
        title: 'Document Upload Requested',
        message: requestMessage || `HR has requested you to upload: ${requestDocName}. Click to upload.`,
        actionUrl: `/documents?requestUpload=true&docName=${encodeURIComponent(requestDocName)}`,
      });
    },
    onSuccess: () => {
      toast.success('Document upload request sent successfully!');
      setShowRequestModal(false);
      setRequestEmployeeId('');
      setRequestDocName('');
      setRequestMessage('');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to send request');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (doc: any) => documentService.delete(doc.employeeId || 'company', doc.id),
    onSuccess: () => {
      toast.success('Document deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete document');
    },
  });

  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = [doc.documentName, doc.fileName, doc.employeeName, doc.employeeCode]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [documents, search]);

  const verifiedCount = documents.filter((doc) => doc.isVerified).length;
  const expiringCount = documents.filter((doc) => {
    if (!doc.expiryDate) return false;
    const days = (new Date(doc.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 30;
  }).length;

  return (
    <div className="min-h-full p-4 text-white md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold text-sun/80">Document Center</p>
          <h1 className="mt-1 text-2xl font-bold">Document & Resource Vault</h1>
          <p className="mt-1 text-xs text-white/35 font-medium">Manage verification workflows, personal files, and company policies.</p>
        </div>
        <div className="flex gap-2">
          {isAdminOrHROrManager && (
            <button onClick={() => setShowRequestModal(true)} className="btn-secondary flex items-center gap-2 h-9 text-xs">
              <Send size={13} />
              Request Upload
            </button>
          )}
          <button onClick={() => setShowUploadModal(true)} className="btn-primary flex items-center gap-2 h-9 text-xs">
            <Upload size={13} />
            Upload Document
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Metric icon={FileText} label="Total Files" value={documents.length} detail="In selected repository" />
        <Metric icon={ShieldCheck} label="Verified Documents" value={verifiedCount} detail="Ready for audits" tone="sky" />
        <Metric icon={AlertTriangle} label="Expiring Soon" value={expiringCount} detail="Due within 30 days" tone="amber" />
      </div>

      {/* Resource Center Layout */}
      <div className="space-y-4">
        {/* Tab Headers */}
        <div className="flex border-b border-white/5 pb-px gap-4">
          <button
            onClick={() => { setActiveTab('my'); setType('all'); }}
            className={cn(
              'pb-3 text-sm font-semibold border-b-2 transition-all duration-200',
              activeTab === 'my' ? 'border-sun text-sun' : 'border-transparent text-white/35 hover:text-white/60'
            )}
          >
            My Documents (Personal Vault)
          </button>
          <button
            onClick={() => { setActiveTab('policies'); setType('all'); }}
            className={cn(
              'pb-3 text-sm font-semibold border-b-2 transition-all duration-200',
              activeTab === 'policies' ? 'border-sun text-sun' : 'border-transparent text-white/35 hover:text-white/60'
            )}
          >
            Company Policies & Resources
          </button>
        </div>

        {/* Filters and List */}
        <section className="glass-card rounded-2xl border border-white/5">
          <div className="flex flex-col gap-3 border-b border-white/5 p-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/28" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="input-field pl-9 text-xs py-2"
                placeholder={activeTab === 'policies' ? "Search company policies..." : "Search documents, employees, or files..."}
              />
            </div>
            {activeTab !== 'policies' && (
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-white/34" />
                <select value={type} onChange={(event) => setType(event.target.value)} className="input-field py-1.5 text-xs w-40">
                  <option value="all">All Document Types</option>
                  {Object.entries(typeLabels).filter(([k]) => k !== 'policy').map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* List Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-10 text-center"><Loader2 className="animate-spin inline-block text-sun mr-2" size={20} /> Loading records...</div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-xs text-white/30 font-medium">No files found.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-xs text-white/35 uppercase">
                    <th className="p-4">Document</th>
                    {activeTab !== 'policies' && isAdminOrHROrManager && <th className="p-4">Employee</th>}
                    <th className="p-4">Category</th>
                    <th className="p-4">Size</th>
                    <th className="p-4">Expiry</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((doc) => (
                    <tr key={doc.id} className="hover:bg-white/[0.01] transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-lg bg-white/5 text-sun flex-shrink-0">
                            <FileText size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-white/80">{doc.documentName}</p>
                            <p className="truncate text-[10px] text-white/30 font-mono mt-0.5">{doc.fileName}</p>
                          </div>
                        </div>
                      </td>
                      {activeTab !== 'policies' && isAdminOrHROrManager && (
                        <td className="p-4 text-xs text-white/60">
                          <p className="font-medium">{doc.employeeName || 'Company Resource'}</p>
                          <p className="text-[10px] text-white/30">{doc.employeeCode}</p>
                        </td>
                      )}
                      <td className="p-4 text-xs text-white/50">{typeLabels[doc.documentType] || getStatusLabel(doc.documentType)}</td>
                      <td className="p-4 text-xs text-white/40">{formatFileSize(doc.fileSize || 0)}</td>
                      <td className="p-4 text-xs text-white/40">{doc.expiryDate ? formatDate(doc.expiryDate) : 'No Expiry'}</td>
                      <td className="p-4">
                        <span className={cn(
                          'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border',
                          doc.isVerified 
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' 
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                        )}>
                          {doc.isVerified ? 'Verified' : 'Pending Verification'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          {isAdminOrHROrManager && !doc.isVerified && (
                            <button
                              onClick={() => verifyMutation.mutate({ id: doc.id, isVerified: true })}
                              disabled={verifyMutation.isPending}
                              className="p-1 rounded bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/25 text-emerald-400 text-[10px] font-bold"
                              title="Verify File"
                            >
                              <Check size={11} />
                            </button>
                          )}
                          <a
                            href={documentService.downloadUrl(doc.employeeId || 'company', doc.id)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 border border-white/10 flex items-center justify-center"
                            title="Download File"
                          >
                            <Download size={12} />
                          </a>
                          {hasRole(['admin', 'hr']) && (
                            <button
                              onClick={() => { if (confirm('Delete this document?')) deleteMutation.mutate(doc) }}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 flex items-center justify-center"
                              title="Delete"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {/* UPLOAD MODAL */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="modal-backdrop">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="modal-content max-w-md">
              <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-white/90">Upload Document</h3>
                  <p className="text-xs text-white/35">Upload personal vault files or company policies.</p>
                </div>
                <button onClick={() => setShowUploadModal(false)} className="p-1.5 rounded-lg hover:bg-white/5 transition"><X size={16} className="text-white/40" /></button>
              </div>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                {/* Upload Destination selector (HR only) */}
                {hasRole(['admin', 'hr']) && (
                  <div>
                    <label className="block text-xs font-semibold text-white/40 mb-1.5">Destination Category</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setUploadDestination('employee')}
                        className={cn("px-3 py-2 text-xs font-bold rounded-xl border transition", uploadDestination === 'employee' ? 'border-sun text-sun bg-sun/5' : 'border-white/5 text-white/50 hover:bg-white/5')}
                      >
                        Employee Profile File
                      </button>
                      <button
                        onClick={() => setUploadDestination('company')}
                        className={cn("px-3 py-2 text-xs font-bold rounded-xl border transition", uploadDestination === 'company' ? 'border-sun text-sun bg-sun/5' : 'border-white/5 text-white/50 hover:bg-white/5')}
                      >
                        Company Policy / Resource
                      </button>
                    </div>
                  </div>
                )}

                {/* Specific Employee Selector */}
                {isAdminOrHROrManager && uploadDestination === 'employee' && (
                  <div>
                    <label className="block text-xs font-semibold text-white/40 mb-1.5 font-medium">Select target Employee *</label>
                    <select
                      value={uploadEmployeeId}
                      onChange={(e) => setUploadEmployeeId(e.target.value)}
                      className="input-field text-sm"
                    >
                      <option value="">Select Employee...</option>
                      {employeeList.map((emp: any) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name} ({emp.employee_code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {uploadDestination === 'employee' && (
                    <div>
                      <label className="block text-xs font-semibold text-white/40 mb-1.5">Document Type *</label>
                      <select
                        value={uploadDocType}
                        onChange={(e) => setUploadDocType(e.target.value)}
                        className="input-field text-sm"
                      >
                        {Object.entries(typeLabels).filter(([k]) => k !== 'policy').map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className={uploadDestination === 'company' ? 'col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-white/40 mb-1.5">Expiry Date</label>
                    <input
                      type="date"
                      value={uploadExpiry}
                      onChange={(e) => setUploadExpiry(e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/40 mb-1.5">Document Name / Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Health Insurance Declaration"
                    value={uploadDocName}
                    onChange={(e) => setUploadDocName(e.target.value)}
                    className="input-field text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/40 mb-1.5">Notes / Description</label>
                  <textarea
                    placeholder="Add brief details about verification or file context..."
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    className="input-field text-sm h-16 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/40 mb-1.5">Select File *</label>
                  <FileUpload
                    onFilesSelected={setUploadFiles}
                    files={uploadFiles}
                    onRemove={(i) => setUploadFiles((f) => f.filter((_, idx) => idx !== i))}
                    accept={{
                      'image/*': ['.jpg', '.png', '.webp'],
                      'application/pdf': ['.pdf'],
                      'application/msword': ['.doc', '.docx'],
                      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-4">
                <button type="button" onClick={() => setShowUploadModal(false)} className="btn-secondary">Cancel</button>
                <button
                  onClick={() => uploadMutation.mutate()}
                  disabled={uploadMutation.isPending || uploadFiles.length === 0 || (uploadDestination === 'employee' && !uploadEmployeeId)}
                  className="btn-primary"
                >
                  {uploadMutation.isPending ? <Loader2 size={13} className="animate-spin inline mr-1" /> : null}
                  Upload
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REQUEST UPLOAD MODAL */}
      <AnimatePresence>
        {showRequestModal && (
          <div className="modal-backdrop">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="modal-content max-w-md">
              <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-white/90">Request Document Upload</h3>
                  <p className="text-xs text-white/35">Send a task notification asking an employee to upload a document.</p>
                </div>
                <button onClick={() => setShowRequestModal(false)} className="p-1.5 rounded-lg hover:bg-white/5 transition"><X size={16} className="text-white/40" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/40 mb-1.5">Target Employee *</label>
                  <select
                    value={requestEmployeeId}
                    onChange={(e) => setRequestEmployeeId(e.target.value)}
                    className="input-field text-sm"
                  >
                    <option value="">Select Employee...</option>
                    {employeeList.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} ({emp.employee_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/40 mb-1.5">Document Needed *</label>
                  <input
                    type="text"
                    placeholder="e.g. Voided Check / Degree Certificate"
                    value={requestDocName}
                    onChange={(e) => setRequestDocName(e.target.value)}
                    className="input-field text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/40 mb-1.5">Custom Message / Reason</label>
                  <textarea
                    placeholder="Provide details about why this is required..."
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    className="input-field text-sm h-20 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-4">
                <button type="button" onClick={() => setShowRequestModal(false)} className="btn-secondary">Cancel</button>
                <button
                  onClick={() => requestMutation.mutate()}
                  disabled={requestMutation.isPending || !requestEmployeeId || !requestDocName}
                  className="btn-primary"
                >
                  {requestMutation.isPending ? <Loader2 size={13} className="animate-spin inline mr-1" /> : null}
                  Send Request
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Metric({ icon: Icon, label, value, detail, tone = 'gold' }: any) {
  const toneClass = 
    tone === 'amber' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 
    tone === 'sky' ? 'text-sky-400 bg-sky-500/10 border-sky-500/20' : 
    'text-sun bg-amber-500/10 border-amber-500/20';
  
  return (
    <div className="glass-card rounded-2xl p-5 border border-white/5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-white/35 font-medium">{label}</p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          <p className="mt-1 text-[11px] text-white/30">{detail}</p>
        </div>
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${toneClass}`}>
          <Icon size={16} />
        </div>
      </div>
    </div>
  );
}
