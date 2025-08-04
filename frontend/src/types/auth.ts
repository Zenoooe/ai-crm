export interface User {
  _id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    company?: string;
    position?: string;
  };
  settings: {
    aiPrompts: Record<string, string>;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    theme: 'light' | 'dark';
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company?: string;
  position?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  company?: string;
  position?: string;
  avatar?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ConfirmResetPasswordRequest {
  token: string;
  newPassword: string;
}