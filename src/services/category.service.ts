import { apiRequest } from "./api";

export type BackendCategory = {
  id: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export const categoryService = {
  async listCategories(): Promise<BackendCategory[]> {
    const res = await apiRequest<{ categories: BackendCategory[] }>(
      "categories",
      { method: "GET", auth: false }
    );
    return res.categories || [];
  },
};
