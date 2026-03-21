import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { productService } from "@/services/products";
import { formatMoney } from "@/utils/format";
import type { Product } from "@/types";

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (open && products.length === 0) {
      productService.getProducts().then(setProducts).catch(console.error);
    }
  }, [open]);

  const handleSelect = (productId: string) => {
    setOpen(false);
    navigate(`/product/${productId}`);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 text-sm transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Buscar...</span>
        <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border border-white/20 bg-white/10 px-1.5 font-mono text-[10px] text-white/40">
          Ctrl K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar produtos..." />
        <CommandList>
          <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
          <CommandGroup heading="Produtos">
            {products.map((p) => (
              <CommandItem
                key={p.id}
                value={p.name}
                onSelect={() => handleSelect(p.id)}
                className="cursor-pointer"
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-8 w-8 rounded object-cover mr-3"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.category}</p>
                </div>
                <span className="text-sm font-semibold text-default-blue">
                  {formatMoney(p.price)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
