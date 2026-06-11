import api from './api';
import type { DashboardOverview, EmployeeAnalytics, SkillAnalytics } from '../types/dashboard.types';

export const dashboardService = {
  async getOverview(): Promise<DashboardOverview> {
    const { data } = await api.get('/dashboard/overview');
    return data.data;
  },

  async getEmployeeAnalytics(): Promise<EmployeeAnalytics> {
    const { data } = await api.get('/dashboard/employee-analytics');
    return data.data;
  },

  async getSkillAnalytics(): Promise<SkillAnalytics> {
    const { data } = await api.get('/dashboard/skill-analytics');
    return data.data;
  },
};

export default dashboardService;
