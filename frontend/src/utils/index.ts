import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistance, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function toCamelKey(key: string): string {
  return key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

export function toCamelCase<T = any>(value: any): T {
  if (Array.isArray(value)) {
    return value.map((item) => toCamelCase(item)) as T;
  }

  if (
    value === null ||
    typeof value !== 'object' ||
    value instanceof Date ||
    value instanceof File
  ) {
    return value;
  }

  return Object.entries(value).reduce<Record<string, any>>((acc, [key, entry]) => {
    acc[toCamelKey(key)] = toCamelCase(entry);
    return acc;
  }, {}) as T;
}

export function formatDate(date: string | Date | null, fmt = 'MMM dd, yyyy'): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, fmt);
  } catch {
    return '—';
  }
}

export function formatRelativeDate(date: string | Date | null): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDistance(d, new Date(), { addSuffix: true });
  } catch {
    return '—';
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function getInitials(firstName?: string, lastName?: string, email?: string): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return 'U';
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    active: 'badge-active',
    inactive: 'badge-inactive',
    pending: 'badge-pending',
    approved: 'badge-active',
    rejected: 'badge-inactive',
    cancelled: 'badge-inactive',
    manager_approved: 'badge-info',
    terminated: 'badge-inactive',
    on_leave: 'badge-pending',
  };
  return map[status] || 'badge-info';
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    manager_approved: 'Manager Approved',
    terminated: 'Terminated',
    on_leave: 'On Leave',
    full_time: 'Full Time',
    part_time: 'Part Time',
    contract: 'Contract',
    intern: 'Intern',
  };
  return map[status] || status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('word')) return '📝';
  return '📎';
}

export function getProficiencyLabel(level: number): string {
  const map: Record<number, string> = {
    1: 'Beginner',
    2: 'Elementary',
    3: 'Intermediate',
    4: 'Advanced',
    5: 'Expert',
  };
  return map[level] || 'Unknown';
}

export function truncate(str: string, max = 50): string {
  if (!str) return '';
  return str.length > max ? `${str.substring(0, max)}...` : str;
}

export function generateAvatarColor(name: string): string {
  const colors = [
    'from-emerald-400 to-lime-500',
    'from-lime-400 to-emerald-500',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-sky-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
