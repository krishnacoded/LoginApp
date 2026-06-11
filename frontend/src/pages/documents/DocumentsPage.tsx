import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, FileCheck2, FileText, Filter, Search, ShieldCheck, Upload, AlertTriangle, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { documentService } from '../../api/document.service';
import { formatDate, formatFileSize, getStatusLabel } from '../../utils';
import type { Document } from '../../types/document.types';
import { useAuth } from '../../store/auth.store';
import { employeeService } from '../../api';
import FileUpload from '../../components/common/FileUpload';
import { AnimatePresence, motion } from 'framer-motion';

const fallbackDocuments: Document[] = [
  {
    id: 'demo-1',
    employeeId: 'demo',
    employeeName: 'Nathan Donovan',
    employeeCode: 'EMP-1024',
    documentType: 'contract',
    documentName: 'Employment Agreement',
    fileName: 'employment-agreement.pdf',
    fileSize: 248000,
    mimeType: 'application/pdf',
    isVerified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    employeeId: 'demo',
    employeeName: 'Kara Morton',
    employeeCode: 'EMP-0931',
    documentType: 'certificate',
    documentName: 'Compliance Certificate',
    fileName: 'compliance-certificate.pdf',
    fileSize: 126000,
    mimeType: 'application/pdf',
    isVerified: false,
    expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 24).toISOString(),
    createdAt: new Date().toISOString(),
  },
];

const typeLabels: Record<string, string> = {
  resume: 'Resume',
  id_proof: 'ID Proof',
  certificate: 'Certificate',
  contract: 'Contract',
  tax: 'Tax',
  performance: 'Performance',
  other: 'Other',
};

export default function DocumentsPage() {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // States for upload form
  const [uploadEmployeeId, setUploadEmployeeId] = useState('');
  const [uploadDocType, setUploadDocType] = useState('other');
  const [uploadDocName, setUploadDocName] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadExpiry, setUploadExpiry] = useState('');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);

  // Query employees if admin/hr/manager
  const isAdminOrHROrManager = hasRole(['admin', 'hr', 'manager']);
  const { data: employeesData } = useQuery({
    queryKey: ['employees-list-docs'],
    queryFn: () => employeeService.getAll({ limit: 100 }),
    enabled: isAdminOrHROrManager,
  });

  const employeeList = employeesData?.data || [];

  // Set default employee ID if not admin/hr/manager
  React.useEffect(() => {
    if (!isAdminOrHROrManager && user) {
      const empId = user.employeeId || user.employee_id || '';
      setUploadEmployeeId(empId);
    }
  }, [user, isAdminOrHROrManager]);

  const { data, isLoading } = useQuery({
    queryKey: ['documents', search, type],
    queryFn: () =>
      documentService.getAll({
        search: search || undefined,
        documentType: type === 'all' ? undefined : (type as any),
        limit: 50,
      }),
    retry: false,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const empId = isAdminOrHROrManager ? uploadEmployeeId : (user?.employeeId || user?.employee_id);
      if (!empId) {
        throw new Error('Please select an employee');
      }
      return documentService.upload(empId, {
        files: uploadFiles,
        documentType: uploadDocType as any,
        documentName: uploadDocName,
        notes: uploadNotes,
        expiryDate: uploadExpiry || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Document uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setShowUploadModal(false);
      // reset states
      setUploadFiles([]);
      setUploadDocName('');
      setUploadNotes('');
      setUploadExpiry('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to upload document');
    },
  });

  const documents = data?.data?.length ? data.data : fallbackDocuments;
  const filtered = useMemo(
    () =>
      documents.filter((doc) => {
        const matchesSearch = [doc.documentName, doc.fileName, doc.employeeName, doc.employeeCode]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesType = type === 'all' || doc.documentType === type;
        return matchesSearch && matchesType;
      }),
    [documents, search, type],
  );

  const verifiedCount = documents.filter((doc) => doc.isVerified).length;
  const expiringCount = documents.filter((doc) => {
    if (!doc.expiryDate) return false;
    const days = (new Date(doc.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 30;
  }).length;

  return (
    <div className="min-h-full p-4 text-white md:p-5">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold text-lime-300/80">Document Vault</p>
          <h1 className="mt-1 text-2xl font-semibold">Employee document control</h1>
          <p className="mt-1 text-sm text-white/38 font-medium">Centralized files, verification state, and expiry visibility.</p>
        </div>
        <button onClick={() => setShowUploadModal(true)} className="btn-primary h-9">
          <Upload size={15} />
          Upload document
        </button>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Metric icon={FileText} label="Total files" value={documents.length} detail="Across all employee records" />
        <Metric icon={ShieldCheck} label="Verified" value={verifiedCount} detail="Ready for audits" />
        <Metric icon={AlertTriangle} label="Expiring soon" value={expiringCount} detail="Due within 30 days" tone="amber" />
      </div>

      <section className="glass-card rounded-lg">
        <div className="flex flex-col gap-3 border-b border-white/6 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/28" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="input-field pl-9"
              placeholder="Search documents, employees, or file names"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-white/34" />
            <select value={type} onChange={(event) => setType(event.target.value)} className="input-field w-44">
              <option value="all">All types</option>
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-white/6 text-left text-xs text-white/36">
                <th className="px-4 py-3 font-semibold">Document</th>
                <th className="px-4 py-3 font-semibold">Employee</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Size</th>
                <th className="px-4 py-3 font-semibold">Expiry</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <tr key={index} className="border-b border-white/5">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="loading-pulse h-10 rounded-md" />
                      </td>
                    </tr>
                  ))
                : filtered.map((doc) => (
                    <tr key={doc.id} className="border-b border-white/5 transition hover:bg-white/[0.025]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-lime-300/12 text-lime-300">
                            <FileCheck2 size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white/84">{doc.documentName}</p>
                            <p className="truncate text-xs text-white/32">{doc.fileName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/68">
                        <p>{doc.employeeName || 'Unassigned'}</p>
                        <p className="text-xs text-white/30">{doc.employeeCode}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/64">{typeLabels[doc.documentType] || getStatusLabel(doc.documentType)}</td>
                      <td className="px-4 py-3 text-sm text-white/54">{formatFileSize(doc.fileSize || 0)}</td>
                      <td className="px-4 py-3 text-sm text-white/54">{doc.expiryDate ? formatDate(doc.expiryDate) : 'No expiry'}</td>
                      <td className="px-4 py-3">
                        <span className={doc.isVerified ? 'badge-active' : 'badge-pending'}>{doc.isVerified ? 'Verified' : 'Review'}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={documentService.downloadUrl(doc.employeeId, doc.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/42 transition hover:bg-lime-300/10 hover:text-lime-300"
                        >
                          <Download size={15} />
                        </a>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </section>

      <AnimatePresence>
        {showUploadModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowUploadModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div
                className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
                style={{ background: 'rgba(8,12,26,0.99)', border: '1px solid rgba(255,255,255,0.08)' }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 flex-shrink-0">
                  <div>
                    <h2 className="font-semibold text-white/90">Upload Document</h2>
                    <p className="text-xs text-white/35 mt-0.5">Attach files to employee profiles</p>
                  </div>
                  <button onClick={() => setShowUploadModal(false)} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <X size={18} className="text-white/40" />
                  </button>
                </div>

                {/* Form */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                  {isAdminOrHROrManager ? (
                    <div>
                      <label className="block text-xs font-medium text-white/50 mb-1.5">Employee *</label>
                      <select
                        value={uploadEmployeeId}
                        onChange={(e) => setUploadEmployeeId(e.target.value)}
                        className="input-field text-sm"
                      >
                        <option value="">Select Employee</option>
                        {employeeList.map((emp: any) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName} ({emp.employeeCode})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-white/50 mb-1.5">Document Type *</label>
                      <select
                        value={uploadDocType}
                        onChange={(e) => setUploadDocType(e.target.value)}
                        className="input-field text-sm"
                      >
                        {Object.entries(typeLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/50 mb-1.5">Expiry Date</label>
                      <input
                        type="date"
                        value={uploadExpiry}
                        onChange={(e) => setUploadExpiry(e.target.value)}
                        className="input-field text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Document Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Tax Declaration Form"
                      value={uploadDocName}
                      onChange={(e) => setUploadDocName(e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Notes</label>
                    <textarea
                      placeholder="Add any verification notes or comments..."
                      value={uploadNotes}
                      onChange={(e) => setUploadNotes(e.target.value)}
                      className="input-field text-sm h-20 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Select File *</label>
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

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 flex-shrink-0">
                  <button onClick={() => setShowUploadModal(false)} className="btn-secondary text-sm">
                    Cancel
                  </button>
                  <button
                    onClick={() => uploadMutation.mutate()}
                    disabled={uploadMutation.isPending || uploadFiles.length === 0 || (isAdminOrHROrManager ? !uploadEmployeeId : false)}
                    className="btn-primary text-sm"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <Loader2 size={15} className="animate-spin" /> Uploading...
                      </>
                    ) : (
                      'Upload File'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Metric({ icon: Icon, label, value, detail, tone = 'lime' }: any) {
  const toneClass = tone === 'amber' ? 'text-amber-300 bg-amber-300/12' : 'text-lime-300 bg-lime-300/12';
  return (
    <div className="glass-card rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-white/38">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
          <p className="mt-1 text-xs text-white/30">{detail}</p>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-md ${toneClass}`}>
          <Icon size={17} />
        </div>
      </div>
    </div>
  );
}
