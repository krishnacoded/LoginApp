export type NotificationType =
  | 'leave_approved'
  | 'leave_rejected'
  | 'leave_applied'
  | 'new_employee'
  | 'document_uploaded'
  | 'department_updated'
  | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationSummary {
  notifications: Notification[];
  unreadCount: number;
  total?: number;
}

export interface NotificationPreference {
  channel: 'email' | 'in_app' | 'slack';
  enabled: boolean;
  digestFrequency?: 'instant' | 'daily' | 'weekly';
}
