const BASE_URL = import.meta.env.VITE_BASE_URL;

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

const getHeaders = () => {
  const user = JSON.parse(localStorage.getItem("elearning_user") || "{}");
  const token = user.token || "";
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

export const apiClient = {
  get: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "GET",
        headers: getHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error("API GET ERROR", error);
      return { success: false, message: "Lỗi kết nối máy chủ" };
    }
  },

  post: async <T>(endpoint: string, body: any): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      return await response.json();
    } catch (error) {
      console.error("API POST ERROR", error);
      return { success: false, message: "Lỗi kết nối máy chủ" };
    }
  },

  put: async <T>(endpoint: string, body: any): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      return await response.json();
    } catch (error) {
      console.error("API PUT ERROR", error);
      return { success: false, message: "Lỗi kết nối máy chủ" };
    }
  },

  delete: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error("API DELETE ERROR", error);
      return { success: false, message: "Lỗi kết nối máy chủ" };
    }
  },

  patch: async <T>(endpoint: string, body: any): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      return await response.json();
    } catch (error) {
      console.error("API PATCH ERROR", error);
      return { success: false, message: "Lỗi kết nối máy chủ" };
    }
  },
};
