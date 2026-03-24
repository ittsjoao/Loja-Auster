import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useCart } from "@/contexts/CartContext";
import {
  hasValidDiscount,
  getDiscountedPrice,
  getDiscountTimeRemaining,
} from "@/utils/discount";
import { formatMoney } from "@/utils/format";
import type { Product } from "@/types";

interface Props {
  product: Product;
  alreadyPurchased?: boolean;
}

export function ProductCard({ product, alreadyPurchased }: Props) {
  const { addToCart } = useCart();
  const discounted = hasValidDiscount(product);
  const finalPrice = getDiscountedPrice(product);
  const timeLeft = product.discount?.endDate
    ? getDiscountTimeRemaining(product.discount.endDate)
    : null;
  const outOfStock = product.stock <= 0;

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full">
      {/* Badges */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 items-end">
        {product.featured && (
          <Badge className="bg-default-blue hover:bg-default-blue text-white font-bold text-xs">
            Destaque
          </Badge>
        )}
        {discounted && (
          <Badge className="bg-orange hover:bg-orange text-white font-bold text-xs">
            -{product.discount!.percentOff}%
          </Badge>
        )}
      </div>

      {/* Out of stock overlay */}
      {outOfStock && (
        <div className="absolute inset-0 z-10 bg-black/50 flex items-center justify-center rounded-lg">
          <span className="text-white font-bold text-lg">Esgotado</span>
        </div>
      )}

      {/* Image */}
      <Link to={`/product/${product.id}`}>
        <AspectRatio ratio={4 / 3}>
          <img
            src={product.image}
            alt={product.name}
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
          />
        </AspectRatio>
      </Link>

      <CardContent className="p-4 flex-1 flex flex-col">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-semibold line-clamp-1 group-hover:text-default-blue transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {product.description}
        </p>

        {/* Price */}
        <div className="mt-auto pt-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-default-blue">
            {formatMoney(finalPrice)}
          </span>
          {discounted && (
            <span className="text-sm text-muted-foreground line-through">
              {formatMoney(product.price)}
            </span>
          )}
        </div>

        {/* Discount timer */}
        {discounted && timeLeft && (
          <p className="text-xs text-teal mt-1 font-medium">{timeLeft}</p>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          onClick={() => addToCart(product)}
          disabled={outOfStock || (product.singlePurchase && alreadyPurchased)}
          className="w-full bg-gradient-to-r from-default-blue to-dark-blue hover:from-default-blue/90 hover:to-dark-blue/90"
          size="sm"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {product.singlePurchase && alreadyPurchased
            ? "Você já possui este item"
            : "Adicionar"}
        </Button>
      </CardFooter>
    </Card>
  );
}
