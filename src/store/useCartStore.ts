import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Course } from "../config/mock-data";

interface CartState {
  items: Course[];
  addItem: (course: Course) => void;
  removeItem: (courseId: string) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (course) => {
        const { items } = get();
        const isExist = items.find((item) => item.id === course.id);
        if (!isExist) {
          set({ items: [...items, course] });
        }
      },
      removeItem: (courseId) => {
        set({ items: get().items.filter((item) => item.id !== courseId) });
      },
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.length,
      totalPrice: () => {
        return get().items.reduce((total, item) => {
          // Remove currency symbol and dots to calculate
          const priceStr = item.price.replace(/[.đ]/g, "");
          const price = parseInt(priceStr);
          return total + (isNaN(price) ? 0 : price);
        }, 0);
      },
    }),
    {
      name: "cart-storage",
    },
  ),
);
