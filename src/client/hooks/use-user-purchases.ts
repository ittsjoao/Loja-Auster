import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { redemptionService } from "@/services/redemption";

export function useUserPurchases() {
  const [purchasedProductIds, setPurchasedProductIds] = useState<string[]>([]);
  const { user } = useAuth();

  const refresh = useCallback(async () => {
    if (!user) {
      setPurchasedProductIds([]);
      return;
    }
    try {
      const ids = await redemptionService.getUserPurchases();
      setPurchasedProductIds(ids);
    } catch (err) {
      console.error("Error fetching user purchases:", err);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const hasPurchased = useCallback(
    (productId: string) => purchasedProductIds.includes(productId),
    [purchasedProductIds],
  );

  return { purchasedProductIds, hasPurchased, refresh };
}
