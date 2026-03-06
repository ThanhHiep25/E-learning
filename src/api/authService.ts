import { apiClient, type ApiResponse } from "./api-client";

export interface AuthData {
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
    phone?: string;
    role: "student" | "teacher" | "admin";
    avatar?: string;
    isEmailVerified?: boolean;
  };
  token: string;
}

export interface RegisterData {
  user: any;
  verificationCode: string;
}

export const authService = {
  login: async (credentials: {
    email?: string;
    username?: string;
    password: string;
  }): Promise<ApiResponse<AuthData>> => {
    return apiClient.post<AuthData>("/api/auth/login", credentials);
  },

  register: async (userData: any): Promise<ApiResponse<RegisterData>> => {
    return apiClient.post<RegisterData>("/api/auth/register", userData);
  },

  getCurrentUser: async (): Promise<ApiResponse<any>> => {
    return apiClient.get<any>("/api/auth/me");
  },

  verifyEmail: async (token: string): Promise<ApiResponse<any>> => {
    return apiClient.get<any>(`/api/auth/verify-email/${token}`);
  },

  verifyEmailCode: async (code: string): Promise<ApiResponse<any>> => {
    return apiClient.post<any>("/api/auth/verify-email-code", { token: code });
  },

  resendVerification: async (email: string): Promise<ApiResponse<any>> => {
    return apiClient.post<any>("/api/auth/resend-verification-email", {
      email,
    });
  },

  forgotPassword: async (email: string): Promise<ApiResponse<any>> => {
    return apiClient.post<any>("/api/auth/forgot-password", { email });
  },

  resetPassword: async (data: {
    token: string;
    password: string;
    confirmPassword: string;
  }): Promise<ApiResponse<any>> => {
    return apiClient.post<any>("/api/auth/reset-password", data);
  },
};
