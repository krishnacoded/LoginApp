import api from './api';

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  entityType?: string;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export const auditService = {
  async getAll(params?: AuditLogFilters) {
    const { data } = await api.get('/audit-logs', { params });
    return data;
  },

  async getEntityLogs(entityType: string, entityId: string) {
    const { data } = await api.get(`/audit-logs/${entityType}/${entityId}`);
    return data.data;
  },
};

export default auditService;
