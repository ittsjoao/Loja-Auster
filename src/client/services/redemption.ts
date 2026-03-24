import { apiFetch } from "./api";
import type { CoinTransaction, RedemptionStats } from "../types";

export const redemptionService = {
  redeem: (items: Array<{ productId: string; quantity: number }>) =>
    apiFetch<{ success: boolean; transaction: unknown }>("/redemption/redeem", {
      method: "POST",
      body: JSON.stringify({ items }),
    }),

  credit: (transactionId: string) =>
    apiFetch("/redemption/credit", {
      method: "POST",
      body: JSON.stringify({ transactionId }),
    }),

  cancelWithReason: (transactionId: string, reason: string) =>
    apiFetch("/redemption/cancel-with-reason", {
      method: "POST",
      body: JSON.stringify({ transactionId, reason: reason.trim() }),
    }),

  updateStatus: (transactionId: string, status: string) =>
    apiFetch(`/redemption/${transactionId}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  getUserHistory: async (): Promise<CoinTransaction[]> => {
    const data = await apiFetch<{ transactions: CoinTransaction[] }>(
      "/redemption/history",
    );
    return data.transactions || [];
  },

  getAllTransactions: async (): Promise<CoinTransaction[]> => {
    const data = await apiFetch<{ transactions: CoinTransaction[] }>(
      "/redemption/all",
    );
    return data.transactions || [];
  },

  getUserPurchases: async (): Promise<string[]> => {
    const data = await apiFetch<{ productIds: string[] }>(
      "/redemption/user-purchases",
    );
    return data.productIds || [];
  },

  getStats: async (): Promise<RedemptionStats> => {
    const data = await apiFetch<{ stats: RedemptionStats }>(
      "/redemption/stats",
    );
    return data.stats;
  },
};
