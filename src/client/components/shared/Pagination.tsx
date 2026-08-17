import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PaginationState {
  page: number;
  totalPages: number;
  total: number;
  from: number;
  to: number;
  setPage: (page: number) => void;
}

/**
 * Paginacao client-side: as listas ja vem inteiras da API.
 * ponytail: se algum dia passar de alguns milhares de linhas, trocar por
 * take/skip na API e devolver o total no payload.
 *
 * @param resetKey volta para a pagina 1 quando muda (filtros, aba, etc).
 */
export function usePagination<T>(
  items: T[],
  pageSize = 10,
  resetKey?: unknown,
): PaginationState & { pageItems: T[] } {
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [resetKey]);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * pageSize;

  return {
    page: current,
    totalPages,
    total,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, total),
    setPage,
    pageItems: items.slice(start, start + pageSize),
  };
}

export function Pagination({
  page,
  totalPages,
  total,
  from,
  to,
  setPage,
}: PaginationState) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 text-sm">
      <p className="text-muted-foreground">
        Mostrando {from}-{to} de {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>
        <span className="text-muted-foreground whitespace-nowrap">
          Pagina {page} de {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
        >
          Proxima
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
