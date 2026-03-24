import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, Minus, Plus, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { redemptionService } from "@/services/redemption";
import { hasValidDiscount, getDiscountedPrice } from "@/utils/discount";
import { formatMoney } from "@/utils/format";
import { useToast } from "@/hooks/use-toast";
import { refreshCoins } from "@/components/layout/Navbar";

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice } =
    useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const totalSavings = items.reduce((savings, item) => {
    if (hasValidDiscount(item.product)) {
      const original = item.product.price * item.quantity;
      const discounted = getDiscountedPrice(item.product) * item.quantity;
      return savings + (original - discounted);
    }
    return savings;
  }, 0);

  const handleCheckout = async () => {
    setShowConfirm(false);
    if (!user) {
      navigate("/login");
      return;
    }

    setIsCheckingOut(true);
    try {
      const redemptionItems = items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const response = await redemptionService.redeem(redemptionItems);

      if (response.success) {
        toast({
          title: "Compra realizada com sucesso!",
          description: `${redemptionItems.length} item(ns) resgatado(s).`,
        });

        // Send HR email (fire-and-forget)
        const API_URL = import.meta.env.VITE_API_URL || "/api";
        fetch(`${API_URL}/email/purchase`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionId: "N/A",
            items: items.map((item) => ({
              name: item.product.name,
              quantity: item.quantity,
              price: getDiscountedPrice(item.product),
            })),
            totalAmount: totalPrice,
            userName: user.name || "Cliente",
            userEmail: user.email,
            userId: user.id,
          }),
        }).catch(console.error);

        clearCart();
        refreshCoins();
        setTimeout(() => navigate("/orders"), 1500);
      }
    } catch (error) {
      toast({
        title: "Erro ao processar compra",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
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
              <BreadcrumbPage>Carrinho</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="text-3xl font-bold mb-8">Carrinho</h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ShoppingCart className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-6">O carrinho esta vazio</p>
            <Button
              asChild
              className="bg-gradient-to-r from-default-blue to-dark-blue"
            >
              <Link to="/products">Explorar produtos</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const discounted = hasValidDiscount(item.product);
                const unitPrice = getDiscountedPrice(item.product);

                return (
                  <Card key={item.product.id}>
                    <CardContent className="p-4 flex gap-4">
                      <Link to={`/product/${item.product.id}`}>
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold truncate">
                              {item.product.name}
                            </h3>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-sm font-medium text-default-blue">
                                {formatMoney(unitPrice)}
                              </span>
                              {discounted && (
                                <span className="text-xs text-muted-foreground line-through">
                                  {formatMoney(item.product.price)}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="font-bold">
                            {formatMoney(unitPrice * item.quantity)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center mt-3">
                          {item.product.singlePurchase ? (
                            <span className="text-xs text-muted-foreground px-2">
                              Compra unica (qtd: 1)
                            </span>
                          ) : (
                            <div className="flex items-center border rounded-lg">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={isCheckingOut}
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.quantity - 1,
                                  )
                                }
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm font-semibold">
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={isCheckingOut}
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.quantity + 1,
                                  )
                                }
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-default-red hover:text-default-red"
                            disabled={isCheckingOut}
                            onClick={() => removeFromCart(item.product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Summary */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Resumo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Itens</span>
                    <span>{items.reduce((t, i) => t + i.quantity, 0)}</span>
                  </div>
                  {totalSavings > 0 && (
                    <div className="flex justify-between text-sm text-default-green">
                      <span>Economia</span>
                      <span className="font-semibold">
                        -{formatMoney(totalSavings)}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatMoney(totalPrice)}</span>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-default-blue to-dark-blue hover:from-default-blue/90 hover:to-dark-blue/90 mt-4"
                    onClick={() =>
                      user ? setShowConfirm(true) : navigate("/login")
                    }
                    disabled={isCheckingOut}
                  >
                    {isCheckingOut ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      "Concluir compra"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={clearCart}
                    disabled={isCheckingOut}
                  >
                    Limpar carrinho
                  </Button>
                  <Button variant="ghost" className="w-full" asChild>
                    <Link to="/products">Continuar comprando</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar compra</AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a resgatar{" "}
                {items.reduce((t, i) => t + i.quantity, 0)} item(ns) por{" "}
                {formatMoney(totalPrice)}. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleCheckout}>
                Confirmar compra
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
