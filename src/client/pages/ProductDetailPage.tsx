import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useCart } from "@/contexts/CartContext";
import { useUserPurchases } from "@/hooks/use-user-purchases";
import { productService } from "@/services/products";
import {
  hasValidDiscount,
  getDiscountedPrice,
  getDiscountTimeRemaining,
} from "@/utils/discount";
import { formatMoney } from "@/utils/format";
import type { Product } from "@/types";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { hasPurchased } = useUserPurchases();

  useEffect(() => {
    if (!id) return;
    productService
      .getProductById(id)
      .then((p) => setProduct(p || null))
      .catch(() => setProduct(null))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-10">
            <Skeleton className="h-96 rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-48" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Produto nao encontrado</h2>
          <Button asChild>
            <Link to="/products">Ver produtos</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const discounted = hasValidDiscount(product);
  const finalPrice = getDiscountedPrice(product);
  const timeLeft = product.discount?.endDate
    ? getDiscountTimeRemaining(product.discount.endDate)
    : null;
  const outOfStock = product.stock <= 0;
  const isSinglePurchaseBlocked =
    product.singlePurchase && hasPurchased(product.id);

  const handleAdd = () => {
    const qty = product.singlePurchase ? 1 : quantity;
    for (let i = 0; i < qty; i++) {
      addToCart(product);
    }
    setQuantity(1);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/products">Produtos</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Image */}
          <div className="rounded-xl overflow-hidden border">
            <AspectRatio ratio={4 / 3}>
              <img
                src={product.image}
                alt={product.name}
                className="object-cover w-full h-full"
              />
            </AspectRatio>
          </div>

          {/* Info */}
          <div>
            <Badge
              variant="outline"
              className="text-teal border-teal capitalize mb-3"
            >
              {product.category}
            </Badge>

            <h1 className="text-3xl font-bold">{product.name}</h1>

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-default-blue">
                {formatMoney(finalPrice)}
              </span>
              {discounted && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatMoney(product.price)}
                </span>
              )}
            </div>

            {discounted && (
              <div className="mt-2 flex items-center gap-2">
                <Badge className="bg-orange hover:bg-orange text-white">
                  -{product.discount!.percentOff}% OFF
                </Badge>
                {timeLeft && (
                  <span className="text-sm text-teal font-medium">
                    {timeLeft}
                  </span>
                )}
              </div>
            )}

            <Separator className="my-6" />

            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>

            <Separator className="my-6" />

            {/* Stock */}
            <p className="text-sm mb-4">
              {outOfStock ? (
                <span className="text-default-red font-medium">
                  Produto esgotado
                </span>
              ) : (
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {product.stock}
                  </span>{" "}
                  em estoque
                </span>
              )}
            </p>

            {/* Quantity + Add to cart */}
            <div className="flex items-center gap-4">
              {!product.singlePurchase && (
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={outOfStock}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setQuantity(Math.min(product.stock, quantity + 1))
                    }
                    disabled={outOfStock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <Button
                onClick={handleAdd}
                disabled={outOfStock || isSinglePurchaseBlocked}
                className="flex-1 bg-gradient-to-r from-default-blue to-dark-blue hover:from-default-blue/90 hover:to-dark-blue/90"
                size="lg"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {isSinglePurchaseBlocked
                  ? "Você já possui este item"
                  : "Adicionar ao carrinho"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
