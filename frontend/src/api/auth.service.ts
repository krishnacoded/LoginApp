import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  permissions: string[];

  employee_id?: string;
  employeeId?: string;
  employee_code?: string;
  employeeCode?: string;

  first_name?: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;

  profile_picture_url?: string;
  profilePictureUrl?: string;
  designation?: string;

  department_id?: string;
  departmentId?: string;
  department_name?: string;
  departmentName?: string;
}

export const authService = {
  async login(credentials: LoginCredentials) {
    const response = await api.post(
      '/auth/login',
      credentials
    );

    const {
      accessToken,
      refreshToken,
      user,
    } = response.data.data;

    localStorage.setItem(
      'accessToken',
      accessToken
    );

    localStorage.setItem(
      'refreshToken',
      refreshToken
    );

    localStorage.setItem(
      'user',
      JSON.stringify(user)
    );

    return {
      accessToken,
      refreshToken,
      user,
    };
  },

  async register(
    userData: RegisterData
  ) {
    const response = await api.post(
      '/auth/register',
      userData
    );

    return response.data.data;
  },

  async verifyEmail(token: string) {
    const response = await api.get(
      '/auth/verify-email',
      { params: { token } }
    );

    return response.data;
  },

  async logout() {
    const refreshToken =
      localStorage.getItem(
        'refreshToken'
      );

    try {
      await api.post('/auth/logout', {
        refreshToken,
      });
    } catch {}

    localStorage.removeItem(
      'accessToken'
    );

    localStorage.removeItem(
      'refreshToken'
    );

    localStorage.removeItem('user');
  },

  async getMe(): Promise<User> {
    const response = await api.get(
      '/auth/me'
    );

    return response.data.data;
  },

  async changePassword(
    currentPassword: string,
    newPassword: string
  ) {
    const response = await api.post(
      '/auth/change-password',
      {
        currentPassword,
        newPassword,
      }
    );

    return response.data;
  },

  getStoredUser(): User | null {
    const user =
      localStorage.getItem('user');

    return user
      ? JSON.parse(user)
      : null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem(
      'accessToken'
    );
  },
};
