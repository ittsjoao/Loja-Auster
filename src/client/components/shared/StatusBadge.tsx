import { Badge } from "@/components/ui/badge";
import type { TransactionStatus } from "@/types";

const STATUS_CONFIG: Record<
  TransactionStatus,
  { label: string; className: string }
> = {
  pendente: {
    label: "Pendente",
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  },
  preparando: {
    label: "Preparando",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  },
  aguardando_coleta: {
    label: "Aguardando Coleta",
    className: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  },
  entregue: {
    label: "Entregue",
    className: "bg-green-100 text-green-800 hover:bg-green-100",
  },
  cancelado: {
    label: "Cancelado",
    className: "bg-red-100 text-red-800 hover:bg-red-100",
  },
};

export function StatusBadge({ status }: { status: TransactionStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pendente;
  return <Badge className={config.className}>{config.label}</Badge>;
}
