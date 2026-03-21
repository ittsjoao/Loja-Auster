import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR });
}

export function formatDateShort(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
}
