import { apiFetch } from "./api";
import type { Product, Category } from "../types";

function transformProduct(raw: Record<string, unknown>): Product {
  const discount =
    raw.discountPercentOff != null && raw.discountEndDate != null
      ? {
          percentOff: raw.discountPercentOff as number,
          endDate: raw.discountEndDate as string,
        }
      : (raw.discount as Product["discount"]) ?? undefined;

  return {
    id: raw.id as string,
    name: raw.name as string,
    description: raw.description as string,
    price: raw.price as number,
    image: raw.image as string,
    category: raw.category as string,
    stock: raw.stock as number,
    featured: (raw.featured as boolean) ?? false,
    singlePurchase: (raw.singlePurchase as boolean) ?? false,
    isActive: (raw.isActive as boolean) ?? true,
    deletedAt: raw.deletedAt as string | undefined,
    discount,
  };
}

export const productService = {
  getProducts: async (params?: {
    category?: string;
    featured?: boolean;
    search?: string;
  }): Promise<Product[]> => {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.featured) query.set("featured", "true");
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    const data = await apiFetch<Record<string, unknown>[]>(
      `/products${qs ? `?${qs}` : ""}`,
    );
    return data.map(transformProduct);
  },

  getInactiveProducts: async (): Promise<Product[]> => {
    const data = await apiFetch<Record<string, unknown>[]>(
      "/products/inactive",
    );
    return data.map(transformProduct);
  },

  getProductById: async (id: string): Promise<Product | undefined> => {
    try {
      const data = await apiFetch<Record<string, unknown>>(`/products/${id}`);
      return transformProduct(data);
    } catch {
      return undefined;
    }
  },

  addProduct: async (product: Omit<Product, "id">): Promise<Product> => {
    const { discount, ...rest } = product;
    const data = await apiFetch<{ product: Record<string, unknown> }>(
      "/products",
      {
        method: "POST",
        body: JSON.stringify({
          ...rest,
          ...(discount
            ? {
                discountPercentOff: discount.percentOff,
                discountEndDate: discount.endDate,
              }
            : {}),
        }),
      },
    );
    return transformProduct(data.product);
  },

  updateProduct: async (
    id: string,
    updates: Partial<Product>,
  ): Promise<Product> => {
    const { discount, ...rest } = updates;
    const body: Record<string, unknown> = { ...rest };
    if (Object.prototype.hasOwnProperty.call(updates, "discount")) {
      body.discountPercentOff = discount?.percentOff ?? null;
      body.discountEndDate = discount?.endDate ?? null;
    }
    const data = await apiFetch<{ product: Record<string, unknown> }>(
      `/products/${id}`,
      { method: "PUT", body: JSON.stringify(body) },
    );
    return transformProduct(data.product);
  },

  deleteProduct: async (id: string): Promise<boolean> => {
    await apiFetch(`/products/${id}`, { method: "DELETE" });
    return true;
  },

  // Categories
  getCategories: () => apiFetch<Category[]>("/products/categories/all"),

  addCategory: async (name: string): Promise<Category> => {
    const data = await apiFetch<{ category: Category }>(
      "/products/categories",
      { method: "POST", body: JSON.stringify({ name }) },
    );
    return data.category;
  },

  updateCategory: async (id: string, name: string): Promise<Category> => {
    const data = await apiFetch<{ category: Category }>(
      `/products/categories/${id}`,
      { method: "PUT", body: JSON.stringify({ name }) },
    );
    return data.category;
  },

  deleteCategory: async (id: string): Promise<boolean> => {
    await apiFetch(`/products/categories/${id}`, { method: "DELETE" });
    return true;
  },

  // Discounts
  addDiscount: async (
    id: string,
    percentOff: number,
    durationDays: number,
  ): Promise<Product> => {
    const data = await apiFetch<{ product: Record<string, unknown> }>(
      `/products/${id}/discount`,
      {
        method: "POST",
        body: JSON.stringify({ percentOff, durationDays }),
      },
    );
    return transformProduct(data.product);
  },

  removeDiscount: async (id: string): Promise<Product> => {
    const data = await apiFetch<{ product: Record<string, unknown> }>(
      `/products/${id}/discount`,
      { method: "DELETE" },
    );
    return transformProduct(data.product);
  },
};
