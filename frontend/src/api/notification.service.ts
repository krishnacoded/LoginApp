import api from './api';
import type { Notification, NotificationSummary } from '../types/notification.types';

export const notificationService = {
  async getAll(params?: { page?: number; limit?: number; unreadOnly?: boolean }): Promise<NotificationSummary> {
    const { data } = await api.get('/notifications', { params });
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

  async latest(limit = 6): Promise<Notification[]> {
    const data = await this.getAll({ limit });
    return data.notifications;
  },
};

export default notificationService;
