'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_URL } from './api';

const AUTH_PATH = `${API_URL}/api/auth`;

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  details?: string;
  settings?: Record<string, any>;
}

interface RegisterParams {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  verifyEmail: (params: { email: string; code: string }) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  verifyResetCode: (params: { email: string; code: string }) => Promise<{ resetToken: string }>;
  resetPassword: (params: { email: string; password: string; resetToken: string }) => Promise<void>;
  updateProfile: (name: string, details?: string, settings?: any) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  requestPasswordChangeOtp: () => Promise<void>;
  verifyPasswordChange: (params: { oldPassword: string; newPassword: string; code: string }) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: read token from localStorage and verify it
  useEffect(() => {
    const stored = localStorage.getItem('rf_token');
    if (!stored) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    fetch(`${AUTH_PATH}/me`, {
      headers: { Authorization: `Bearer ${stored}` },
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async response => {
        if (response.status === 401 || response.status === 403) {
          if (localStorage.getItem('rf_token') === stored) localStorage.removeItem('rf_token');
          return;
        }
        if (!response.ok || controller.signal.aborted) return;
        const data = await response.json();
        if (!controller.signal.aborted && data?.id && localStorage.getItem('rf_token') === stored) {
          setUser(data);
          setToken(stored);
        }
      })
      .catch(() => {
        // Keep the existing token when the service is temporarily unavailable.
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const login = async (email: string, password: string) => {
    let response: Response;
    try {
      response = await fetch(`${AUTH_PATH}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
    } catch {
      throw new Error('Could not connect to ResearchFlow. Try signing in again.');
    }

    const data = await response.json().catch(() => null);
    if (response.status >= 500 || !data) {
      throw new Error('Sign-in is temporarily unavailable. Try again in a moment.');
    }
    if (!response.ok) throw new Error(data.error || 'Could not sign in.');
    if (typeof data.token !== 'string' || !data.user?.id) {
      throw new Error('Sign-in returned an unexpected response. Try again in a moment.');
    }
    localStorage.setItem('rf_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async ({ name, email, password }: RegisterParams) => {
    const res = await fetch(`${AUTH_PATH}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
  };

  const verifyEmail = async ({ email, code }: { email: string; code: string }) => {
    const res = await fetch(`${AUTH_PATH}/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Verification failed');
    localStorage.setItem('rf_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const resendVerification = async (email: string) => {
    const res = await fetch(`${AUTH_PATH}/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Resend failed');
  };

  const forgotPassword = async (email: string) => {
    const res = await fetch(`${AUTH_PATH}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Forgot password request failed');
  };

  const verifyResetCode = async ({ email, code }: { email: string; code: string }) => {
    const res = await fetch(`${AUTH_PATH}/verify-reset-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Verification of reset code failed');
    return { resetToken: data.resetToken };
  };

  const resetPassword = async ({ email, password, resetToken }: { email: string; password: string; resetToken: string }) => {
    const res = await fetch(`${AUTH_PATH}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, resetToken }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Reset password failed');
  };

  const logout = () => {
    localStorage.removeItem('rf_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (name: string, details?: string, settings?: any) => {
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${AUTH_PATH}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, details, settings }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile');
    setUser(data.user);
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    if (!token) throw new Error('Not authenticated');
    const formData = new FormData();
    formData.append('avatar', file);

    const res = await fetch(`${AUTH_PATH}/profile/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to upload avatar');
    setUser(data.user);
    return data.avatarUrl;
  };

  const requestPasswordChangeOtp = async () => {
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${AUTH_PATH}/change-password/request`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to request password change OTP');
  };

  const verifyPasswordChange = async ({ oldPassword, newPassword, code }: { oldPassword: string; newPassword: string; code: string }) => {
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${AUTH_PATH}/change-password/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ oldPassword, newPassword, code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to verify password change');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        forgotPassword,
        verifyEmail,
        resendVerification,
        verifyResetCode,
        resetPassword,
        updateProfile,
        uploadAvatar,
        requestPasswordChangeOtp,
        verifyPasswordChange,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
