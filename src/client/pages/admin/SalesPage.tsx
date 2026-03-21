import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useAuth } from "@/contexts/AuthContext";
import { redemptionService } from "@/services/redemption";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { CoinTransaction } from "@/types";
import {
  Clock,
  Package,
  CheckCircle,
  RefreshCw,
  ShoppingBag,
  AlertCircle,
  Filter,
  XCircle,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatMoney } from "@/utils/format";
import { refreshCoins } from "@/components/layout/Navbar";

const API_URL = import.meta.env.VITE_API_URL || "/api";

// Custom date picker component
function CustomDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (date: string) => void;
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 2 }, (_, i) => String(currentYear - i));
  const months = [
    { value: "01", label: "Janeiro" },
    { value: "02", label: "Fevereiro" },
    { value: "03", label: "Marco" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Maio" },
    { value: "06", label: "Junho" },
    { value: "07", label: "Julho" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ];

  const parts = value.split("-");
  const [year, setYear] = useState(parts[0] || "");
  const [month, setMonth] = useState(parts[1] || "");
  const [day, setDay] = useState(parts[2] || "");

  const getDaysInMonth = (y: string, m: string) => {
    if (!y || !m) return 31;
    return new Date(parseInt(y), parseInt(m), 0).getDate();
  };

  const daysInMonth = getDaysInMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );

  const updateDate = (y: string, m: string, d: string) => {
    if (y && m && d) onChange(`${y}-${m}-${d}`);
    else if (y && m) onChange(`${y}-${m}`);
    else if (y) onChange(y);
    else onChange("");
  };

  const handleClear = () => {
    setYear("");
    setMonth("");
    setDay("");
    onChange("");
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <Select
          value={year}
          onValueChange={(v) => {
            setYear(v);
            updateDate(v, month, day);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={month}
          onValueChange={(v) => {
            setMonth(v);
            updateDate(year, v, day);
          }}
          disabled={!year}
        >
          <SelectTrigger>
            <SelectValue placeholder="Mes" />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={day}
          onValueChange={(v) => {
            setDay(v);
            updateDate(year, month, v);
          }}
          disabled={!month}
        >
          <SelectTrigger>
            <SelectValue placeholder="Dia" />
          </SelectTrigger>
          <SelectContent>
            {days.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(year || month || day) && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">
            {year && !month && !day && `Filtrando por: ${year}`}
            {year &&
              month &&
              !day &&
              `Filtrando por: ${months.find((m) => m.value === month)?.label}/${year}`}
            {year && month && day && `Filtrando por: ${day}/${month}/${year}`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-6 text-xs px-2"
          >
            Limpar
          </Button>
        </div>
      )}
    </div>
  );
}

// Cancel order modal
function CancelOrderModal({
  transaction,
  onCancel,
}: {
  transaction: CoinTransaction;
  onCancel: (id: string, reason: string) => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await onCancel(transaction.id, reason.trim());
      setIsOpen(false);
      setReason("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <XCircle className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Cancelar Pedido
          </DialogTitle>
          <DialogDescription>
            Informe o motivo do cancelamento para o cliente #
            {transaction.user?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Motivo do Cancelamento *
            </label>
            <Textarea
              placeholder="Ex: Produto em falta, problema no estoque..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {reason.length}/500 caracteres
            </p>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Atenção</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Esta ação irá estornar{" "}
                  {formatMoney(Math.abs(transaction.totalAmount))} para o
                  cliente.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={loading}
          >
            Voltar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason.trim() || loading}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" />
            )}
            Cancelar Pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Ready for pickup confirmation modal
function ReadyForPickupModal({
  transaction,
  onConfirm,
}: {
  transaction: CoinTransaction;
  onConfirm: (id: string) => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(transaction.id);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-green-600 border-green-200 hover:bg-green-50"
        >
          <Package className="h-4 w-4 mr-1" />
          Pronto p/ Coleta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            Confirmar Pronto para Coleta
          </DialogTitle>
          <DialogDescription>
            O cliente sera notificado por e-mail para retirar o pedido.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm">
              <strong>Cliente:</strong> {transaction.user?.name}
            </p>
            <p className="text-sm">
              <strong>Email:</strong> {transaction.user?.email}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Itens:</p>
            {transaction.items?.map((item, i) => (
              <p key={i} className="text-sm text-muted-foreground">
                - {item.productName || item.product?.name} ({item.quantity}x)
              </p>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Package className="h-4 w-4 mr-2" />
            )}
            Confirmar e Notificar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Delivery confirmation modal
function DeliveryModal({
  transaction,
  onConfirm,
}: {
  transaction: CoinTransaction;
  onConfirm: (id: string, receivedBy: string) => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [receivedBy, setReceivedBy] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!receivedBy.trim()) return;
    setLoading(true);
    try {
      await onConfirm(transaction.id, receivedBy.trim());
      setIsOpen(false);
      setReceivedBy("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Entregar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            Confirmar Entrega
          </DialogTitle>
          <DialogDescription>
            Informe o nome de quem recebeu o pedido. O cliente sera notificado
            por e-mail.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm">
              <strong>Cliente:</strong> {transaction.user?.name}
            </p>
            <p className="text-sm">
              <strong>Pedido:</strong> #{transaction.id.slice(-8).toUpperCase()}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Nome de quem recebeu *
            </label>
            <Input
              placeholder="Ex: Joao Silva"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!receivedBy.trim() || loading}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Confirmar Entrega
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Order details modal
function OrderDetailsModal({ transaction }: { transaction: CoinTransaction }) {
  return (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          Detalhes da Compra
        </DialogTitle>
        <DialogDescription>
          Informações completas sobre esta transação
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">
              ID da Transação
            </label>
            <p className="text-sm font-mono bg-gray-100 p-2 rounded">
              {transaction.id}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Status</label>
            <div className="mt-1">
              <StatusBadge status={transaction.status} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">
              Data da Compra
            </label>
            <p className="text-sm">
              {format(
                new Date(transaction.updatedAt),
                "dd/MM/yyyy 'as' HH:mm",
                {
                  locale: ptBR,
                },
              )}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">
              Valor Total
            </label>
            <p className="text-lg font-bold text-green-600">
              {formatMoney(Math.abs(transaction.totalAmount))}
            </p>
          </div>
        </div>

        <Separator />

        {transaction.user && (
          <>
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Informacoes do Cliente
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Nome
                  </label>
                  <p className="text-sm">{transaction.user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Email
                  </label>
                  <p className="text-sm">{transaction.user.email}</p>
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-3">
            Produtos ({transaction.items?.length || 0} itens)
          </h3>
          <div className="space-y-3">
            {transaction.items?.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-3 border rounded-lg"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={item.productImage || item.product?.image}
                    alt={item.productName || item.product?.name}
                  />
                  <AvatarFallback>
                    <Package className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">
                    {item.productName || item.product?.name}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <span>Qtd: {item.quantity}</span>
                    <span>Unit: {formatMoney(item.unitPrice)}</span>
                    <span className="font-medium">
                      Total: {formatMoney(item.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-4">Sem produtos</p>
            )}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-semibold mb-3">Descricao</h3>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm">{transaction.description}</p>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

export default function SalesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [filters, setFilters] = useState({
    userName: "",
    userEmail: "",
    productName: "",
    buyDate: "",
  });

  useEffect(() => {
    if (user?.role === "admin") loadTransactions();
  }, [user]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      setTransactions(await redemptionService.getAllTransactions());
    } catch {
      toast({
        title: "Erro",
        description: "Falha ao carregar vendas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filtered = transactions.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;

    if (filters.buyDate) {
      const txDate = new Date(t.createdAt);
      const parts = filters.buyDate.split("-");
      if (
        parts.length === 3 &&
        format(txDate, "yyyy-MM-dd") !== filters.buyDate
      )
        return false;
      if (parts.length === 2 && format(txDate, "yyyy-MM") !== filters.buyDate)
        return false;
      if (parts.length === 1 && format(txDate, "yyyy") !== filters.buyDate)
        return false;
    }

    if (
      filters.userName &&
      !t.user?.name?.toLowerCase().includes(filters.userName.toLowerCase())
    )
      return false;
    if (
      filters.userEmail &&
      !t.user?.email?.toLowerCase().includes(filters.userEmail.toLowerCase())
    )
      return false;
    if (
      filters.productName &&
      !t.items?.some((i) =>
        (i.productName || i.product?.name)
          ?.toLowerCase()
          .includes(filters.productName.toLowerCase()),
      )
    )
      return false;
    return true;
  });

  const statusCounts = transactions.reduce(
    (acc, t) => ({ ...acc, [t.status]: (acc[t.status] || 0) + 1 }),
    {} as Record<string, number>,
  );

  const handleUpdateStatus = async (id: string, status: string) => {
    if (
      status === "cancelado" ||
      status === "aguardando_coleta" ||
      status === "entregue"
    )
      return;

    try {
      await redemptionService.updateStatus(id, status);

      if (status === "preparando") {
        const tx = transactions.find((t) => t.id === id);
        if (tx?.user?.email) {
          fetch(`${API_URL}/email/confirm`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: tx.user.email,
              transactionId: id,
              user: tx.user.name,
              items:
                tx.items?.map((item) => ({
                  name: item.productName || item.product?.name || "Produto",
                  quantity: item.quantity,
                })) || [],
            }),
          }).catch((err) => console.error("Falha ao enviar email:", err));
        }
        toast({
          title: "Preparando!",
          description: "Cliente notificado por e-mail.",
        });
      } else {
        toast({ title: "Sucesso", description: "Status atualizado!" });
      }

      loadTransactions();
    } catch {
      toast({
        title: "Erro",
        description: "Falha ao atualizar status",
        variant: "destructive",
      });
    }
  };

  const handleReadyForPickup = async (id: string) => {
    try {
      await redemptionService.updateStatus(id, "aguardando_coleta");
      const tx = transactions.find((t) => t.id === id);
      if (tx?.user?.email) {
        fetch(`${API_URL}/email/ready-for-pickup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: tx.user.email,
            userName: tx.user.name,
            transactionId: id,
            items:
              tx.items?.map((item) => ({
                name: item.product?.name || "Produto",
                quantity: item.quantity,
              })) || [],
          }),
        }).catch((err) => console.error("Falha ao enviar email:", err));
      }
      toast({
        title: "Pronto para coleta!",
        description: "Cliente notificado por e-mail.",
      });
      loadTransactions();
    } catch {
      toast({
        title: "Erro",
        description: "Falha ao atualizar status",
        variant: "destructive",
      });
    }
  };

  const handleDelivery = async (id: string, receivedBy: string) => {
    try {
      await redemptionService.updateStatus(id, "entregue");
      const tx = transactions.find((t) => t.id === id);
      if (tx?.user?.email) {
        fetch(`${API_URL}/email/delivery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: tx.user.email,
            userName: tx.user.name,
            transactionId: id,
            items:
              tx.items?.map((item) => ({
                name: item.product?.name || "Produto",
                quantity: item.quantity,
              })) || [],
            receivedBy,
          }),
        }).catch((err) => console.error("Falha ao enviar email:", err));
      }
      toast({
        title: "Entrega confirmada!",
        description: `Recebido por ${receivedBy}.`,
      });
      loadTransactions();
    } catch {
      toast({
        title: "Erro",
        description: "Falha ao atualizar status",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async (id: string, reason: string) => {
    await redemptionService.cancelWithReason(id, reason);

    const tx = transactions.find((t) => t.id === id);
    if (tx?.user?.email && tx?.user?.name) {
      fetch(`${API_URL}/email/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: tx.user.email,
          transactionId: id,
          reason,
          user: tx.user.name,
        }),
      }).catch((err) => console.error("Falha ao disparar email:", err));
    }

    toast({ title: "Pedido cancelado", description: "Cliente notificado." });
    refreshCoins();
    loadTransactions();
  };

  if (user?.role !== "admin") {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Acesso Restrito</h2>
              <p className="text-gray-600">
                Apenas administradores podem acessar esta pagina.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

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
              <BreadcrumbPage>Vendas</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Administração de Vendas</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie todas as vendas da loja
            </p>
          </div>
          <Button onClick={loadTransactions} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          {[
            { title: "Total Vendas", value: transactions.length },
            { title: "Pendentes", value: statusCounts.pendente || 0 },
            { title: "Preparando", value: statusCounts.preparando || 0 },
            { title: "Entregues", value: statusCounts.entregue || 0 },
          ].map((stat, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFilters({
                    userName: "",
                    userEmail: "",
                    productName: "",
                    buyDate: "",
                  })
                }
              >
                Limpar Filtros
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Nome do Cliente
                </label>
                <Input
                  placeholder="Buscar..."
                  value={filters.userName}
                  onChange={(e) =>
                    setFilters({ ...filters, userName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Email do Cliente
                </label>
                <Input
                  placeholder="Buscar..."
                  value={filters.userEmail}
                  onChange={(e) =>
                    setFilters({ ...filters, userEmail: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Produto
                </label>
                <Input
                  placeholder="Buscar..."
                  value={filters.productName}
                  onChange={(e) =>
                    setFilters({ ...filters, productName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Data da Compra
                </label>
                <CustomDatePicker
                  value={filters.buyDate}
                  onChange={(date) => setFilters({ ...filters, buyDate: date })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions table */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="w-full flex overflow-x-auto justify-start">
            <TabsTrigger value="all">Todos ({transactions.length})</TabsTrigger>
            <TabsTrigger value="pendente">
              Pendentes ({statusCounts.pendente || 0})
            </TabsTrigger>
            <TabsTrigger value="preparando">
              Preparando ({statusCounts.preparando || 0})
            </TabsTrigger>
            <TabsTrigger value="aguardando_coleta">
              Aguardando ({statusCounts.aguardando_coleta || 0})
            </TabsTrigger>
            <TabsTrigger value="entregue">
              Entregues ({statusCounts.entregue || 0})
            </TabsTrigger>
            <TabsTrigger value="cancelado">
              Cancelados ({statusCounts.cancelado || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Vendas ({filtered.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3 p-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma venda encontrada</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produtos</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={
                                    t.items?.[0]?.productImage ||
                                    t.items?.[0]?.product?.image
                                  }
                                />
                                <AvatarFallback>
                                  <Package className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {t.items?.[0]?.productName ||
                                    t.items?.[0]?.product?.name ||
                                    "Produtos"}
                                  {(t.items?.length || 0) > 1 && (
                                    <span className="text-xs text-gray-500 ml-1">
                                      +{t.items!.length - 1} itens
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-500">
                                  #{t.id.slice(0, 8)}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">
                              {t.user?.name || "N/A"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {t.user?.email || "N/A"}
                            </p>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatMoney(Math.abs(t.totalAmount))}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={t.status} />
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">
                              {format(new Date(t.createdAt), "dd/MM/yyyy", {
                                locale: ptBR,
                              })}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(t.createdAt), "HH:mm")}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4 mr-1" />
                                    Detalhes
                                  </Button>
                                </DialogTrigger>
                                <OrderDetailsModal transaction={t} />
                              </Dialog>

                              {t.status !== "cancelado" &&
                                t.status !== "entregue" && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <CancelOrderModal
                                      transaction={t}
                                      onCancel={handleCancel}
                                    />
                                    {t.status === "pendente" && (
                                      <Select
                                        value={t.status}
                                        onValueChange={(s) =>
                                          handleUpdateStatus(t.id, s)
                                        }
                                      >
                                        <SelectTrigger className="w-[140px]">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pendente">
                                            Pendente
                                          </SelectItem>
                                          <SelectItem value="preparando">
                                            Preparando
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    )}
                                    {t.status === "preparando" && (
                                      <ReadyForPickupModal
                                        transaction={t}
                                        onConfirm={handleReadyForPickup}
                                      />
                                    )}
                                    {t.status === "aguardando_coleta" && (
                                      <DeliveryModal
                                        transaction={t}
                                        onConfirm={handleDelivery}
                                      />
                                    )}
                                  </div>
                                )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
