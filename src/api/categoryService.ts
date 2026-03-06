import { apiClient } from "./api-client";

export interface BECategory {
  id: number;
  name: string;
  menuSection: string;
  createdAt?: string;
  updatedAt?: string;
}

export const categoryService = {
  // 1. API Công khai (Public / Teacher)
  getCategories: async () =>
    apiClient.get<{ categories: BECategory[] }>("/api/categories"),

  // 2. API Quản trị (Admin Only)
  // 2.1 Lấy danh sách danh mục (Admin view)
  getAdminCategories: async () =>
    apiClient.get<{ categories: BECategory[] }>("/api/admin/categories"),

  // 2.2 Thêm danh mục mới
  createCategory: async (data: { name: string; menuSection: string }) =>
    apiClient.post<{ category: BECategory }>("/api/admin/categories", data),

  // 2.3 Cập nhật danh mục
  updateCategory: async (
    id: number,
    data: { name: string; menuSection: string },
  ) =>
    apiClient.put<{ category: BECategory }>(
      `/api/admin/categories/${id}`,
      data,
    ),

  // 2.4 Xóa danh mục
  deleteCategory: async (id: number) =>
    apiClient.delete<{ message: string }>(`/api/admin/categories/${id}`),
};
