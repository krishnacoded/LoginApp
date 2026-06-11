import api from './api';
import type { Document, DocumentFilters, UploadDocumentInput, VerifyDocumentInput } from '../types/document.types';
import type { PaginatedResponse } from '../types/common.types';

export const documentService = {
  async getAll(params?: DocumentFilters): Promise<PaginatedResponse<Document>> {
    const { data } = await api.get('/documents', { params });
    return data;
  },

  async getEmployeeDocuments(employeeId: string): Promise<Document[]> {
    const { data } = await api.get(`/employees/${employeeId}/documents`);
    return data.data;
  },

  async upload(employeeId: string, input: UploadDocumentInput): Promise<Document[]> {
    const formData = new FormData();
    input.files.forEach((file) => formData.append('document', file));
    formData.append('documentType', input.documentType);
    formData.append('documentName', input.documentName);
    if (input.notes) formData.append('notes', input.notes);
    if (input.expiryDate) formData.append('expiryDate', input.expiryDate);

    const { data } = await api.post(`/employees/${employeeId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  async verify(id: string, input: VerifyDocumentInput): Promise<Document> {
    const { data } = await api.patch(`/documents/${id}/verify`, input);
    return data.data;
  },

  async delete(employeeId: string, documentId: string) {
    const { data } = await api.delete(`/employees/${employeeId}/documents/${documentId}`);
    return data;
  },

  downloadUrl(employeeId: string, documentId: string) {
    return `/api/v1/employees/${employeeId}/documents/${documentId}/download`;
  },
};

export default documentService;
