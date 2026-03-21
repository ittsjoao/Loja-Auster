import { z } from "zod";
import { TRANSACTION_STATUSES } from "../types";

export const redeemSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1, "Pelo menos um item e obrigatorio"),
});

export const cancelSchema = z.object({
  transactionId: z.string().min(1, "ID da transação é obrigatório"),
  reason: z
    .string()
    .min(1, "Motivo é obrigatório")
    .max(500, "Maximo 500 caracteres"),
});

export const statusUpdateSchema = z.object({
  status: z.enum(TRANSACTION_STATUSES),
});

export type RedeemInput = z.infer<typeof redeemSchema>;
export type CancelInput = z.infer<typeof cancelSchema>;
export type StatusUpdateInput = z.infer<typeof statusUpdateSchema>;
