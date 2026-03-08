import { apiRequest, tokenStorage } from "./api";

type BackendRole = "student" | "teacher" | "admin";

export type FrontendRole = "STUDENT" | "TEACHER" | "ADMIN";

export type BackendUser = {
  id: string | number;
  name: string;
  username?: string;
  email: string;
  phone?: string;
  role: BackendRole;
  avatar?: string;
  isEmailVerified?: boolean;
  createdAt?: string;
};

export type FrontendUser = {
  id: string;
  fullName: string;
  username?: string;
  email: string;
  role: FrontendRole;
  avatar: string;
  phone?: string;
  joinDate?: string;
  enrolledCourses: string[];
};

export type UpdateMeInput = {
  name?: string;
  phone?: string;
  avatar?: string;
};

export type UploadAvatarResponse = {
  uploaded: {
    url: string;
    publicId?: string;
    bytes?: number;
    format?: string;
  };
  user: BackendUser;
};

function roleToFrontend(role: BackendRole): FrontendRole {
  if (role === "teacher") return "TEACHER";
  if (role === "admin") return "ADMIN";
  return "STUDENT";
}

export function mapBackendUserToFrontend(user: BackendUser): FrontendUser {
  return {
    id: String(user.id),
    fullName: user.name,
    username: user.username,
    email: user.email,
    role: roleToFrontend(user.role),
    avatar:
      user.avatar ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email)}`,
    phone: user.phone,
    joinDate: user.createdAt,
    enrolledCourses: [],
  };
}

export const authService = {
  async login(params: {
    email?: string;
    username?: string;
    password: string;
  }): Promise<{ user: FrontendUser; token: string }> {
    const data = await apiRequest<{
      user: BackendUser;
      token: string;
    }>("auth/login", {
      method: "POST",
      body: JSON.stringify(params),
      auth: false,
    });

    tokenStorage.set(data.token);

    return {
      token: data.token,
      user: mapBackendUserToFrontend(data.user),
    };
  },

  async register(params: {
    name: string;
    username: string;
    email: string;
    phone?: string;
    password: string;
    role?: BackendRole;
  }): Promise<{
    user: FrontendUser;
    token?: string;
    verificationCode?: string;
  }> {
    const data = await apiRequest<{
      user: BackendUser;
      token?: string;
      verificationCode?: string;
    }>("auth/register", {
      method: "POST",
      body: JSON.stringify(params),
      auth: false,
    });

    if (data.token) {
      tokenStorage.set(data.token);
    }

    return {
      user: mapBackendUserToFrontend(data.user),
      token: data.token,
      verificationCode: data.verificationCode,
    };
  },

  async verifyEmailCode(
    token: string,
  ): Promise<{ user: FrontendUser; token?: string }> {
    const data = await apiRequest<{ user: BackendUser; token?: string }>(
      "auth/verify-email-code",
      {
        method: "POST",
        body: JSON.stringify({ token }),
        auth: false,
      },
    );

    if (data.token) {
      tokenStorage.set(data.token);
    }

    return {
      user: mapBackendUserToFrontend(data.user),
      token: data.token,
    };
  },

  async me(): Promise<FrontendUser> {
    const data = await apiRequest<BackendUser>("auth/me", {
      method: "GET",
    });

    return mapBackendUserToFrontend(data);
  },

  async uploadAvatar(
    file: File,
  ): Promise<{ uploadedUrl: string; user: FrontendUser }> {
    const form = new FormData();
    form.append("file", file);

    const data = await apiRequest<UploadAvatarResponse>("auth/me/avatar", {
      method: "POST",
      body: form,
    });

    return {
      uploadedUrl: data.uploaded?.url,
      user: mapBackendUserToFrontend(data.user),
    };
  },

  async updateMe(input: UpdateMeInput): Promise<FrontendUser> {
    const data = await apiRequest<BackendUser>("auth/me", {
      method: "PUT",
      body: JSON.stringify(input),
    });

    return mapBackendUserToFrontend(data);
  },

  async forgotPassword(email: string): Promise<void> {
    await apiRequest<unknown>("auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
      auth: false,
    });
  },

  async resetPassword(input: {
    token: string;
    password: string;
    confirmPassword: string;
  }): Promise<void> {
    await apiRequest<unknown>("auth/reset-password", {
      method: "POST",
      body: JSON.stringify(input),
      auth: false,
    });
  },

  logout() {
    tokenStorage.clear();
  },
};
