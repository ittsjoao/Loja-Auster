import { useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { getDiscountedPrice } from "@/utils/discount";
import { formatMoney } from "@/utils/format";

export function CartPreview() {
  const { items, totalItems, totalPrice } = useCart();
  const navigate = useNavigate();

  return (
    <HoverCard openDelay={200} closeDelay={300}>
      <HoverCardTrigger asChild>
        <button
          onClick={() => navigate("/cart")}
          className="relative p-2 text-white/80 hover:text-white transition-colors"
        >
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-default-blue text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </HoverCardTrigger>

      <HoverCardContent className="w-80" align="end">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Carrinho vazio
          </p>
        ) : (
          <>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {items.slice(0, 4).map((item) => (
                <div key={item.product.id} className="flex items-center gap-3">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="h-10 w-10 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity}x {formatMoney(getDiscountedPrice(item.product))}
                    </p>
                  </div>
                </div>
              ))}
              {items.length > 4 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{items.length - 4} item(ns)
                </p>
              )}
            </div>

            <Separator className="my-3" />

            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Total</span>
              <span className="text-sm font-bold">
                {formatMoney(totalPrice)}
              </span>
            </div>

            <Button
              onClick={() => navigate("/cart")}
              className="w-full bg-gradient-to-r from-default-blue to-dark-blue hover:from-default-blue/90 hover:to-dark-blue/90"
              size="sm"
            >
              Ver carrinho
            </Button>
          </>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
