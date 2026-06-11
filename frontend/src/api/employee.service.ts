import api from './api';
import type { CreateEmployeeInput, Employee } from '../types/employee.types';
import type { FilterParams, PaginatedResponse } from '../types/common.types';
import { toCamelCase } from '../utils';

export const employeeService = {
  async getAll(params?: FilterParams): Promise<PaginatedResponse<Employee>> {
    const sanitizedParams = { ...params };
    if (sanitizedParams) {
      Object.keys(sanitizedParams).forEach((key) => {
        if (sanitizedParams[key as keyof FilterParams] === '') {
          delete sanitizedParams[key as keyof FilterParams];
        }
      });
    }
    const { data } = await api.get('/employees', { params: sanitizedParams });
    return {
      ...data,
      data: toCamelCase<Employee[]>(data.data || []),
      pagination: toCamelCase(data.pagination),
    };
  },

  async getById(id: string): Promise<Employee> {
    const { data } = await api.get(`/employees/${id}`);
    return toCamelCase<Employee>(data.data);
  },

  async create(payload: CreateEmployeeInput): Promise<Employee> {
    const { data } = await api.post('/employees', payload);
    return toCamelCase<Employee>(data.data);
  },

  async update(id: string, payload: Partial<CreateEmployeeInput>): Promise<Employee> {
    const { data } = await api.put(`/employees/${id}`, payload);
    return toCamelCase<Employee>(data.data);
  },

  async delete(id: string) {
    const { data } = await api.delete(`/employees/${id}`);
    return data;
  },

  async restore(id: string): Promise<Employee> {
    const { data } = await api.post(`/employees/${id}/restore`);
    return toCamelCase<Employee>(data.data);
  },

  async uploadProfilePicture(id: string, file: File) {
    const formData = new FormData();
    formData.append('profile_picture', file);
    const { data } = await api.post(`/employees/${id}/profile-picture`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  async getDirectReports(id: string): Promise<Employee[]> {
    const { data } = await api.get(`/employees/${id}/direct-reports`);
    return toCamelCase<Employee[]>(data.data || []);
  },
};

export default employeeService;
