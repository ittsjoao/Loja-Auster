import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import type { Product } from "../types";
import { getDiscountedPrice } from "../utils/discount";
import { cartService } from "../services/cart";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load cart from API when user logs in
  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    cartService
      .getCart()
      .then((cartItems) => {
        setItems(
          cartItems.map((ci) => ({
            product: ci.product,
            quantity: ci.quantity,
          })),
        );
      })
      .catch((err) => {
        console.error("Error loading cart:", err);
      })
      .finally(() => setIsLoading(false));
  }, [user]);

  const addToCart = useCallback(
    (product: Product) => {
      if (!user) return;

      // Single-purchase: prevent adding if already in cart
      if (product.singlePurchase) {
        const alreadyInCart = items.some(
          (item) => item.product.id === product.id,
        );
        if (alreadyInCart) {
          toast({
            title: "Item de compra única",
            description: "Este produto já está no seu carrinho",
            variant: "destructive",
          });
          return;
        }
      }

      // Optimistic update
      setItems((prev) => {
        const idx = prev.findIndex((item) => item.product.id === product.id);
        if (idx >= 0) {
          if (product.singlePurchase) return prev;
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            quantity: updated[idx].quantity + 1,
          };
          return updated;
        }
        return [...prev, { product, quantity: 1 }];
      });

      toast({
        title: "Adicionado ao carrinho",
        description: `${product.name} adicionado ao carrinho`,
      });

      // Sync with server
      cartService.addItem(product.id).catch((err) => {
        console.error("Error adding to cart:", err);
        cartService.getCart().then((cartItems) => {
          setItems(
            cartItems.map((ci) => ({
              product: ci.product,
              quantity: ci.quantity,
            })),
          );
        });
      });
    },
    [user, items, toast],
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      if (!user) return;

      const item = items.find((i) => i.product.id === productId);
      if (item) {
        toast({
          title: "Removido do carrinho",
          description: `${item.product.name} removido do carrinho`,
        });
      }

      // Optimistic update
      setItems((prev) => prev.filter((i) => i.product.id !== productId));

      // Sync with server
      cartService.removeItem(productId).catch((err) => {
        console.error("Error removing from cart:", err);
        cartService.getCart().then((cartItems) => {
          setItems(
            cartItems.map((ci) => ({
              product: ci.product,
              quantity: ci.quantity,
            })),
          );
        });
      });
    },
    [user, items, toast],
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (!user) return;

      if (quantity <= 0) {
        removeFromCart(productId);
        return;
      }

      // Optimistic update
      setItems((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item,
        ),
      );

      // Sync with server
      cartService.updateQuantity(productId, quantity).catch((err) => {
        console.error("Error updating cart:", err);
        cartService.getCart().then((cartItems) => {
          setItems(
            cartItems.map((ci) => ({
              product: ci.product,
              quantity: ci.quantity,
            })),
          );
        });
      });
    },
    [user, removeFromCart],
  );

  const clearCart = useCallback(() => {
    if (!user) return;

    setItems([]);
    toast({
      title: "Carrinho limpo",
      description: "Todos os itens foram removidos do carrinho",
    });

    cartService.clearCart().catch((err) => {
      console.error("Error clearing cart:", err);
    });
  }, [user, toast]);

  const totalItems = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  );

  const totalPrice = useMemo(
    () =>
      items.reduce((total, item) => {
        const unitPrice = getDiscountedPrice(item.product);
        return total + unitPrice * item.quantity;
      }, 0),
    [items],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
