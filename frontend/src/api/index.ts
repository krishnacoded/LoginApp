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

  async sendManual(body: { userId: string; type: string; title: string; message: string; actionUrl?: string }) {
    const { data } = await api.post('/notifications', body);
    return data.data;
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

// ==============================
// Attendance Service
// ==============================
export const attendanceService = {
  async clockIn(body?: any) {
    const { data } = await api.post('/attendance/clock-in', body || {});
    return data.data;
  },

  async clockOut(body?: any) {
    const { data } = await api.post('/attendance/clock-out', body || {});
    return data.data;
  },

  async getTodayStatus() {
    const { data } = await api.get('/attendance/today');
    return data.data;
  },

  async getMyLogs(params?: Record<string, any>) {
    const { data } = await api.get('/attendance/my-logs', { params: cleanParams(params) });
    return data;
  },

  async getTeamLogs(params?: Record<string, any>) {
    const { data } = await api.get('/attendance/team-logs', { params: cleanParams(params) });
    return data;
  },

  async getAllLogs(params?: Record<string, any>) {
    const { data } = await api.get('/attendance/all-logs', { params: cleanParams(params) });
    return data;
  },

  async getSettings() {
    const { data } = await api.get('/attendance/settings');
    return data.data;
  },

  async updateSettings(settingsData: any) {
    const { data } = await api.put('/attendance/settings', settingsData);
    return data.data;
  },

  async getStats(date?: string) {
    const { data } = await api.get('/attendance/stats', { params: { date } });
    return data.data;
  },

  async getMonthlyStats(employeeId?: string, year?: number, month?: number) {
    const url = employeeId ? `/attendance/monthly/${employeeId}` : '/attendance/monthly';
    const { data } = await api.get(url, { params: { year, month } });
    return data.data;
  },

  async startBreak(breakType: string) {
    const { data } = await api.post('/attendance/break/start', { breakType });
    return data.data;
  },

  async endBreak() {
    const { data } = await api.post('/attendance/break/end');
    return data.data;
  },

  async getHolidays() {
    const { data } = await api.get('/attendance/holidays');
    return data.data;
  },
};

export const shiftService = {
  async getAll() {
    const { data } = await api.get('/shifts');
    return data.data;
  },
  async create(shiftData: any) {
    const { data } = await api.post('/shifts', shiftData);
    return data.data;
  },
  async update(id: string, shiftData: any) {
    const { data } = await api.put(`/shifts/${id}`, shiftData);
    return data.data;
  },
  async delete(id: string) {
    const { data } = await api.delete(`/shifts/${id}`);
    return data.data;
  },
  async assign(assignData: any) {
    const { data } = await api.post('/shifts/assign', assignData);
    return data.data;
  },
  async bulkAssign(assignData: any) {
    const { data } = await api.post('/shifts/bulk-assign', assignData);
    return data.data;
  },
};

export const regularizationService = {
  async apply(reqData: any) {
    const { data } = await api.post('/regularizations', reqData);
    return data.data;
  },
  async getMy() {
    const { data } = await api.get('/regularizations/my');
    return data.data;
  },
  async getTeam() {
    const { data } = await api.get('/regularizations/team');
    return data.data;
  },
  async getAll() {
    const { data } = await api.get('/regularizations/all');
    return data.data;
  },
  async review(id: string, reviewData: any) {
    const { data } = await api.post(`/regularizations/${id}/review`, reviewData);
    return data.data;
  },
};

// ==============================
// Asset Service
// ==============================
export const assetService = {
  async getMyAssets() {
    const { data } = await api.get('/assets/my');
    return data.data;
  },

  async getAll(params?: Record<string, any>) {
    const { data } = await api.get('/assets', { params: cleanParams(params) });
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get(`/assets/${id}`);
    return data.data;
  },

  async create(assetData: any) {
    const { data } = await api.post('/assets', assetData);
    return data.data;
  },

  async allocate(id: string, employeeId: string, notes?: string) {
    const { data } = await api.post(`/assets/${id}/allocate`, { employeeId, notes });
    return data.data;
  },

  async returnAsset(id: string, notes?: string) {
    const { data } = await api.post(`/assets/${id}/return`, { notes });
    return data.data;
  },

  async updateStatus(id: string, status: string, notes?: string) {
    const { data } = await api.put(`/assets/${id}/status`, { status, notes });
    return data.data;
  },

  async getAssetRequests() {
    const { data } = await api.get('/assets/requests');
    return data.data;
  },

  async createAssetRequest(requestData: { assetType: string; reason: string }) {
    const { data } = await api.post('/assets/requests', requestData);
    return data.data;
  },

  async approveAssetRequest(id: string, comment?: string, assetId?: string) {
    const { data } = await api.post(`/assets/requests/${id}/approve`, { comment, assetId });
    return data.data;
  },

  async rejectAssetRequest(id: string, comment?: string) {
    const { data } = await api.post(`/assets/requests/${id}/reject`, { comment });
    return data.data;
  },
};

// ==============================
// Report Service
// ==============================
export const reportService = {
  async download(reportType: 'leaves' | 'attendance' | 'assets', params: Record<string, any>, format: 'csv' | 'xlsx' | 'pdf', filename: string) {
    const { data } = await api.get(`/reports/${reportType}`, {
      params: cleanParams({ ...params, format }),
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};

// ==============================
// Verification Service
// ==============================
export const verificationService = {
  async submitRequest(type: 'skill' | 'certification' | 'education' | 'license', data: any) {
    const { data: responseData } = await api.post('/verifications/request', { type, data });
    return responseData.data;
  },

  async getPending() {
    const { data } = await api.get('/verifications/pending');
    return data.data;
  },

  async actionRequest(type: string, id: string, action: 'approve' | 'reject', comment?: string) {
    const { data } = await api.post(`/verifications/${type}/${id}/action`, { action, comment });
    return data.data;
  },
};
