import api from './api';
import type { CreateDepartmentInput, Department, DepartmentAnalytics } from '../types/department.types';
import type { FilterParams, PaginatedResponse } from '../types/common.types';

export const departmentService = {
  async getAll(params?: FilterParams): Promise<PaginatedResponse<Department>> {
    const { data } = await api.get('/departments', { params });
    return data;
  },

  async getById(id: string): Promise<Department> {
    const { data } = await api.get(`/departments/${id}`);
    return data.data;
  },

  async create(payload: CreateDepartmentInput): Promise<Department> {
    const { data } = await api.post('/departments', payload);
    return data.data;
  },

  async update(id: string, payload: Partial<CreateDepartmentInput>): Promise<Department> {
    const { data } = await api.put(`/departments/${id}`, payload);
    return data.data;
  },

  async delete(id: string) {
    const { data } = await api.delete(`/departments/${id}`);
    return data;
  },

  async getAnalytics(): Promise<DepartmentAnalytics> {
    const { data } = await api.get('/departments/analytics');
    return data.data;
  },
};

export default departmentService;
