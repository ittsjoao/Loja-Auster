import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { redemptionService } from "@/services/redemption";
import { formatMoney, formatDate } from "@/utils/format";
import { RefreshCw, Package, ShoppingBag, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CoinTransaction, TransactionStatus } from "@/types";

export default function OrdersPage() {
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const load = () => {
    setIsLoading(true);
    redemptionService
      .getUserHistory()
      .then(setTransactions)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered =
    statusFilter === "all"
      ? transactions
      : transactions.filter((t) => t.status === statusFilter);

  const statusCounts = transactions.reduce(
    (acc, t) => ({ ...acc, [t.status]: (acc[t.status] || 0) + 1 }),
    {} as Record<string, number>,
  );

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
              <BreadcrumbPage>Meus Pedidos</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Meus Pedidos</h1>
            <p className="text-muted-foreground mt-1">
              Acompanhe o status dos seus resgates
            </p>
          </div>
          <Button variant="outline" onClick={load} disabled={isLoading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
        </div>

        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="mb-6 w-full flex overflow-x-auto justify-start">
            <TabsTrigger value="all">Todos ({transactions.length})</TabsTrigger>
            <TabsTrigger value="pendente">
              Pendentes ({statusCounts.pendente || 0})
            </TabsTrigger>
            <TabsTrigger value="preparando">
              Preparando ({statusCounts.preparando || 0})
            </TabsTrigger>
            <TabsTrigger value="aguardando_coleta">
              Coleta ({statusCounts.aguardando_coleta || 0})
            </TabsTrigger>
            <TabsTrigger value="entregue">
              Entregues ({statusCounts.entregue || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter}>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-lg" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum pedido encontrado
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((tx) => (
                  <Card key={tx.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={
                              tx.items?.[0]?.productImage ||
                              tx.items?.[0]?.product?.image
                            }
                          />
                          <AvatarFallback>
                            <Package className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold truncate">
                                {tx.products?.[0]?.name ||
                                  tx.items?.[0]?.productName ||
                                  tx.items?.[0]?.product?.name ||
                                  "Pedido"}
                                {(tx.items?.length || 0) > 1 && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    +{tx.items!.length - 1} itens
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                #{tx.id.slice(0, 8)} ·{" "}
                                {formatDistanceToNow(new Date(tx.createdAt), {
                                  addSuffix: true,
                                  locale: ptBR,
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <StatusBadge status={tx.status} />
                              <span className="font-bold text-sm">
                                {formatMoney(Math.abs(tx.totalAmount))}
                              </span>
                            </div>
                          </div>
                        </div>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <ShoppingBag className="h-5 w-5" />
                                Detalhes do Pedido
                              </DialogTitle>
                              <DialogDescription>
                                #{tx.id.slice(0, 8)}
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                              <div className="flex justify-between">
                                <StatusBadge status={tx.status} />
                                <span className="font-bold">
                                  {formatMoney(Math.abs(tx.totalAmount))}
                                </span>
                              </div>

                              <Separator />

                              <div className="space-y-3">
                                {tx.items?.map((item, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center gap-3"
                                  >
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage
                                        src={
                                          item.productImage ||
                                          item.product?.image
                                        }
                                      />
                                      <AvatarFallback>
                                        <Package className="h-4 w-4" />
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">
                                        {item.productName || item.product?.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {item.quantity}x{" "}
                                        {formatMoney(item.unitPrice)}
                                      </p>
                                    </div>
                                    <span className="text-sm font-medium">
                                      {formatMoney(item.totalPrice)}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              <Separator />

                              {/* Status timeline */}
                              <div className="space-y-2">
                                {(
                                  [
                                    "pendente",
                                    "preparando",
                                    "aguardando_coleta",
                                    "entregue",
                                  ] as TransactionStatus[]
                                ).map((step) => {
                                  const statusOrder = [
                                    "pendente",
                                    "preparando",
                                    "aguardando_coleta",
                                    "entregue",
                                  ];
                                  const currentIdx = statusOrder.indexOf(
                                    tx.status,
                                  );
                                  const stepIdx = statusOrder.indexOf(step);
                                  const isActive =
                                    stepIdx <= currentIdx &&
                                    tx.status !== "cancelado";
                                  const labels: Record<string, string> = {
                                    pendente: "Pedido recebido",
                                    preparando: "Em preparação",
                                    aguardando_coleta: "Aguardando retirada",
                                    entregue: "Entregue",
                                  };

                                  return (
                                    <div
                                      key={step}
                                      className="flex items-center gap-3"
                                    >
                                      <div
                                        className={`w-2.5 h-2.5 rounded-full ${
                                          isActive
                                            ? "bg-default-blue"
                                            : "bg-gray-200"
                                        }`}
                                      />
                                      <span
                                        className={`text-sm ${
                                          isActive
                                            ? "text-foreground font-medium"
                                            : "text-muted-foreground"
                                        }`}
                                      >
                                        {labels[step]}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>

                              <p className="text-xs text-muted-foreground">
                                {formatDate(tx.createdAt)}
                              </p>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
