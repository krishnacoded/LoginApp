import api from './api';
import type { ApplyLeaveInput, LeaveBalance, LeaveRequest, LeaveStats, LeaveType } from '../types/leave.types';
import type { FilterParams, PaginatedResponse } from '../types/common.types';

export const leaveService = {
  async getAll(params?: FilterParams): Promise<PaginatedResponse<LeaveRequest>> {
    const { data } = await api.get('/leaves', { params });
    return data;
  },

  async getById(id: string): Promise<LeaveRequest> {
    const { data } = await api.get(`/leaves/${id}`);
    return data.data;
  },

  async apply(input: ApplyLeaveInput): Promise<LeaveRequest> {
    const hasAttachment = !!input.attachment;
    const payload = hasAttachment ? new FormData() : input;

    if (payload instanceof FormData) {
      Object.entries(input).forEach(([key, value]) => {
        if (value !== undefined && value !== null) payload.append(key, value as string | Blob);
      });
    }

    const { data } = await api.post('/leaves', payload, {
      headers: hasAttachment ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return data.data;
  },

  async approve(id: string, comment?: string): Promise<LeaveRequest> {
    const { data } = await api.post(`/leaves/${id}/approve`, { comment });
    return data.data;
  },

  async reject(id: string, comment: string): Promise<LeaveRequest> {
    const { data } = await api.post(`/leaves/${id}/reject`, { comment });
    return data.data;
  },

  async cancel(id: string, reason?: string) {
    const { data } = await api.post(`/leaves/${id}/cancel`, { reason });
    return data;
  },

  async getMyBalance(year?: number): Promise<LeaveBalance[]> {
    const { data } = await api.get('/leaves/my-balance', { params: { year } });
    return data.data;
  },

  async getBalance(employeeId: string, year?: number): Promise<LeaveBalance[]> {
    const { data } = await api.get(`/leaves/balance/${employeeId}`, { params: { year } });
    return data.data;
  },

  async getTypes(): Promise<LeaveType[]> {
    const { data } = await api.get('/leaves/types');
    return data.data;
  },

  async getStats(): Promise<LeaveStats> {
    const { data } = await api.get('/leaves/stats');
    return data.data;
  },
};

export default leaveService;
