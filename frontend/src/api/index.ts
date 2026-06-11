import api from './api';

const cleanParams = (params?: Record<string, any>) => {
  if (!params) return params;
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

// ==============================
// Employee Service
// ==============================
export const employeeService = {
  async getAll(params?: Record<string, any>) {
    const { data } = await api.get('/employees', { params: cleanParams(params) });
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get(`/employees/${id}`);
    return data.data;
  },

  async create(employeeData: any) {
    const { data } = await api.post('/employees', employeeData);
    return data.data;
  },

  async update(id: string, employeeData: any) {
    const { data } = await api.put(`/employees/${id}`, employeeData);
    return data.data;
  },

  async delete(id: string) {
    const { data } = await api.delete(`/employees/${id}`);
    return data;
  },

  async restore(id: string) {
    const { data } = await api.post(`/employees/${id}/restore`);
    return data.data;
  },

  async uploadProfilePicture(id: string, file: File) {
    const formData = new FormData();
    formData.append('profile_picture', file);
    const { data } = await api.post(`/employees/${id}/profile-picture`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  async getDirectReports(id: string) {
    const { data } = await api.get(`/employees/${id}/direct-reports`);
    return data.data;
  },

  async getStats() {
    const { data } = await api.get('/employees/stats');
    return data.data;
  },

  async uploadDocuments(employeeId: string, files: FormData) {
    const { data } = await api.post(`/employees/${employeeId}/documents`, files, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  async getDocuments(employeeId: string) {
    const { data } = await api.get(`/employees/${employeeId}/documents`);
    return data.data;
  },

  async deleteDocument(employeeId: string, docId: string) {
    const { data } = await api.delete(`/employees/${employeeId}/documents/${docId}`);
    return data;
  },
};

// ==============================
// Department Service
// ==============================
export const departmentService = {
  async getAll(params?: Record<string, any>) {
    const { data } = await api.get('/departments', { params: cleanParams(params) });
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get(`/departments/${id}`);
    return data.data;
  },

  async create(deptData: any) {
    const { data } = await api.post('/departments', deptData);
    return data.data;
  },

  async update(id: string, deptData: any) {
    const { data } = await api.put(`/departments/${id}`, deptData);
    return data.data;
  },

  async delete(id: string) {
    const { data } = await api.delete(`/departments/${id}`);
    return data;
  },

  async getAnalytics() {
    const { data } = await api.get('/departments/analytics');
    return data.data;
  },
};

// ==============================
// Skills Service
// ==============================
export const skillService = {
  async getAll(params?: Record<string, any>) {
    const { data } = await api.get('/skills', { params: cleanParams(params) });
    return data.data;
  },

  async getById(id: string) {
    const { data } = await api.get(`/skills/${id}`);
    return data.data;
  },

  async create(skillData: any) {
    const { data } = await api.post('/skills', skillData);
    return data.data;
  },

  async update(id: string, skillData: any) {
    const { data } = await api.put(`/skills/${id}`, skillData);
    return data.data;
  },

  async delete(id: string) {
    const { data } = await api.delete(`/skills/${id}`);
    return data;
  },

  async getCategories() {
    const { data } = await api.get('/skills/categories');
    return data.data;
  },

  async createCategory(catData: any) {
    const { data } = await api.post('/skills/categories', catData);
    return data.data;
  },

  async getStats() {
    const { data } = await api.get('/skills/stats');
    return data.data;
  },
};

// ==============================
// Leave Service
// ==============================
export const leaveService = {
  async getAll(params?: Record<string, any>) {
    const { data } = await api.get('/leaves', { params: cleanParams(params) });
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get(`/leaves/${id}`);
    return data.data;
  },

  async apply(leaveData: FormData | any) {
    const isFormData = leaveData instanceof FormData;
    const { data } = await api.post('/leaves', leaveData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return data.data;
  },

  async approve(id: string, comment?: string) {
    const { data } = await api.post(`/leaves/${id}/approve`, { comment });
    return data.data;
  },

  async reject(id: string, comment: string) {
    const { data } = await api.post(`/leaves/${id}/reject`, { comment });
    return data.data;
  },

  async cancel(id: string, reason?: string) {
    const { data } = await api.post(`/leaves/${id}/cancel`, { reason });
    return data;
  },

  async getMyBalance(year?: number) {
    const { data } = await api.get('/leaves/my-balance', { params: { year } });
    return data.data;
  },

  async getBalance(employeeId: string, year?: number) {
    const { data } = await api.get(`/leaves/balance/${employeeId}`, { params: { year } });
    return data.data;
  },

  async getTypes() {
    const { data } = await api.get('/leaves/types');
    return data.data;
  },

  async getStats() {
    const { data } = await api.get('/leaves/stats');
    return data.data;
  },
};

// ==============================
// Dashboard Service
// ==============================
export const dashboardService = {
  async getOverview() {
    const { data } = await api.get('/dashboard/overview');
    return data.data;
  },

  async getEmployeeAnalytics() {
    const { data } = await api.get('/dashboard/employee-analytics');
    return data.data;
  },

  async getSkillAnalytics() {
    const { data } = await api.get('/dashboard/skill-analytics');
    return data.data;
  },
};

// ==============================
// Notification Service
// ==============================
export const notificationService = {
  async getAll(params?: Record<string, any>) {
    const { data } = await api.get('/notifications', { params: cleanParams(params) });
    return data.data;
  },

  async markRead(id: string) {
    const { data } = await api.post(`/notifications/${id}/read`);
    return data;
  },

  async markAllRead() {
    const { data } = await api.post('/notifications/read-all');
    return data;
  },

  async delete(id: string) {
    const { data } = await api.delete(`/notifications/${id}`);
    return data;
  },
};

// ==============================
// Search Service
// ==============================
export const searchService = {
  async search(q: string) {
    const { data } = await api.get('/search', { params: { q } });
    return data.data;
  },
};

// ==============================
// Audit Log Service
// ==============================
export const auditService = {
  async getAll(params?: Record<string, any>) {
    const { data } = await api.get('/audit-logs', { params: cleanParams(params) });
    return data;
  },

  async getEntityLogs(entityType: string, entityId: string) {
    const { data } = await api.get(`/audit-logs/${entityType}/${entityId}`);
    return data.data;
  },
};