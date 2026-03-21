import { apiFetch } from "./api";
import type { Product } from "../types";

export interface CartItemResponse {
  productId: string;
  quantity: number;
  product: Product;
}

export const cartService = {
  getCart: () => apiFetch<CartItemResponse[]>("/cart"),

  addItem: (productId: string, quantity = 1) =>
    apiFetch<CartItemResponse>("/cart", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    }),

  updateQuantity: (productId: string, quantity: number) =>
    apiFetch<{ success: boolean }>(`/cart/${productId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    }),

  removeItem: (productId: string) =>
    apiFetch<{ success: boolean }>(`/cart/${productId}`, {
      method: "DELETE",
    }),

  clearCart: () =>
    apiFetch<{ success: boolean }>("/cart", {
      method: "DELETE",
    }),
};
