import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Nome e obrigatorio"),
  description: z.string().min(1, "Descricao e obrigatoria"),
  price: z.number().min(0, "Preco deve ser positivo"),
  image: z.string().min(1, "Imagem e obrigatoria"),
  category: z.string().min(1, "Categoria e obrigatoria"),
  stock: z.number().int().min(0, "Estoque deve ser positivo"),
  featured: z.boolean().default(false),
  singlePurchase: z.boolean().default(false),
});

export const discountSchema = z.object({
  percentOff: z.number().min(1, "Minimo 1%").max(100, "Maximo 100%"),
  durationDays: z.number().min(1, "Minimo 1 dia"),
});

export type ProductInput = z.infer<typeof productSchema>;
export type DiscountInput = z.infer<typeof discountSchema>;
