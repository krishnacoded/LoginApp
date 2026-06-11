import type { DocumentType } from './common.types';

export interface Document {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  uploadedBy?: string;
  uploadedByEmail?: string;
  documentType: DocumentType | 'contract' | 'tax' | 'performance';
  documentName: string;
  fileName: string;
  filePath?: string;
  fileSize: number;
  mimeType: string;
  notes?: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DocumentFilters {
  page?: number;
  limit?: number;
  employeeId?: string;
  documentType?: Document['documentType'];
  verified?: boolean;
  search?: string;
}

export interface UploadDocumentInput {
  files: File[];
  documentType: Document['documentType'];
  documentName: string;
  notes?: string;
  expiryDate?: string;
}

export interface VerifyDocumentInput {
  isVerified: boolean;
  verificationNotes?: string;
}

export interface DocumentMetric {
  label: string;
  value: number;
  delta?: number;
  tone: 'lime' | 'emerald' | 'amber' | 'red';
}
