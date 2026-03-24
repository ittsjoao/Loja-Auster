import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { getCoinsBalance, debitCoins, creditCoins } from "../services/feedz.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const VALID_STATUSES = [
  "pendente",
  "preparando",
  "aguardando_coleta",
  "entregue",
  "cancelado",
];

// POST /redeem
router.post("/redeem", requireAuth, async (req, res) => {
  try {
    const user = req.currentUser!;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: "Itens do pedido sao obrigatorios" });
    }

    if (!user.feedzEmployeeId) {
      return res.status(400).json({ error: "Usuário não vinculado ao Feedz" });
    }

    // Validate products and calculate total
    const productIds = items.map(
      (item: { productId: string }) => item.productId,
    );
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const transactionItems: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }> = [];
    let totalCost = 0;

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return res
          .status(404)
          .json({ error: `Produto ${item.productId} nao encontrado` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: `Estoque insuficiente para ${product.name}`,
          available: product.stock,
          requested: item.quantity,
        });
      }

      let unitPrice = product.price;
      if (
        product.discountPercentOff &&
        product.discountEndDate &&
        new Date() < product.discountEndDate
      ) {
        unitPrice = Math.round(
          product.price * (1 - product.discountPercentOff / 100),
        );
      }

      const itemTotal = Math.round(unitPrice * item.quantity);
      totalCost += itemTotal;

      transactionItems.push({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        unitPrice,
        totalPrice: itemTotal,
      });
    }

    // Single-purchase validation
    const singlePurchaseProducts = products.filter((p) => p.singlePurchase);
    if (singlePurchaseProducts.length > 0) {
      const singlePurchaseIds = singlePurchaseProducts.map((p) => p.id);

      for (const item of items) {
        if (singlePurchaseIds.includes(item.productId) && item.quantity > 1) {
          const product = productMap.get(item.productId)!;
          return res.status(400).json({
            error: `"${product.name}" e de compra unica. Quantidade maxima: 1`,
          });
        }
      }

      const existingPurchases = await prisma.transactionItem.findMany({
        where: {
          productId: { in: singlePurchaseIds },
          transaction: {
            userId: user.id,
            status: { not: "cancelado" },
            type: 1,
          },
        },
        select: { productId: true },
        distinct: ["productId"],
      });

      if (existingPurchases.length > 0) {
        const alreadyOwned = existingPurchases.map((ep) => ep.productId);
        const blockedNames = alreadyOwned
          .map((id) => productMap.get(id)?.name)
          .filter(Boolean);
        return res.status(400).json({
          error: `Voce ja possui: ${blockedNames.join(", ")}. Itens de compra unica so podem ser adquiridos uma vez.`,
          blockedProductIds: alreadyOwned,
        });
      }
    }

    // Check balance
    const currentBalance = await getCoinsBalance(user.feedzEmployeeId);
    if (currentBalance === null || currentBalance < totalCost) {
      return res.status(400).json({
        error: "Saldo insuficiente",
        balance: currentBalance,
        required: totalCost,
      });
    }

    // Debit coins
    const description = `Compra realizada: ${transactionItems.map((i) => `${i.productName} (${i.quantity}x)`).join(", ")}`;
    const debitSuccess = await debitCoins(
      user.feedzEmployeeId,
      totalCost,
      description,
    );
    if (!debitSuccess) {
      return res.status(500).json({ error: "Erro ao debitar moedas no Feedz" });
    }

    // Create transaction
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.coinTransaction.create({
        data: {
          userId: user.id,
          feedzEmployeeId: user.feedzEmployeeId!,
          totalAmount: -totalCost,
          type: 1,
          description,
          status: "pendente",
        },
      });

      for (const item of transactionItems) {
        const prod = productMap.get(item.productId)!;
        await tx.transactionItem.create({
          data: {
            transactionId: transaction.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            productName: prod.name,
            productImage: prod.image,
            productUnitPrice: prod.price,
          },
        });
        const updatedProd = await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
        // Remove discount and featured when out of stock
        if (updatedProd.stock <= 0) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              discountPercentOff: null,
              discountEndDate: null,
              featured: false,
            },
          });
        }
      }

      return transaction;
    });

    res.json({
      success: true,
      message: "Resgate realizado com sucesso!",
      transaction: {
        id: result.id,
        totalCost,
        items: transactionItems,
        newBalance: currentBalance - totalCost,
      },
    });
  } catch (error) {
    console.error("[REDEEM] Error:", error);
    res.status(500).json({ error: "Erro ao processar resgate" });
  }
});

// POST /credit
router.post("/credit", async (req, res) => {
  try {
    const { transactionId } = req.body;
    if (!transactionId)
      return res.status(400).json({ error: "ID da transação é obrigatório" });

    const original = await prisma.coinTransaction.findUnique({
      where: { id: transactionId },
      include: {
        user: { select: { id: true, feedzEmployeeId: true, name: true } },
        items: { include: { product: { select: { id: true, name: true } } } },
      },
    });

    if (!original)
      return res.status(404).json({ error: "Transação nao encontrada" });
    if (original.status === "cancelado")
      return res.status(400).json({ error: "Transação ja foi cancelada" });
    if (!original.user?.feedzEmployeeId)
      return res.status(400).json({ error: "Usuário nao vinculado ao Feedz" });

    const amountToCredit = Math.abs(original.totalAmount);
    const creditSuccess = await creditCoins(
      original.user.feedzEmployeeId,
      amountToCredit,
      `Estorno: ${original.description}`,
    );
    if (!creditSuccess)
      return res
        .status(500)
        .json({ error: "Erro ao creditar moedas no Feedz" });

    await prisma.$transaction(async (tx) => {
      for (const item of original.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      await tx.coinTransaction.update({
        where: { id: transactionId },
        data: { status: "cancelado" },
      });
      await tx.coinTransaction.create({
        data: {
          userId: original.userId,
          feedzEmployeeId: original.feedzEmployeeId,
          totalAmount: amountToCredit,
          type: 2,
          description: `Estorno: ${original.description}`,
          status: "entregue",
        },
      });
    });

    res.json({ success: true, message: "Estorno realizado com sucesso!" });
  } catch (error) {
    console.error("[CREDIT] Error:", error);
    res.status(500).json({ error: "Erro ao processar estorno" });
  }
});

// GET /user-purchases - Get product IDs the user has active (non-cancelled) purchases for
router.get("/user-purchases", requireAuth, async (req, res) => {
  try {
    const userId = req.currentUser!.id;

    const purchasedItems = await prisma.transactionItem.findMany({
      where: {
        transaction: {
          userId,
          status: { not: "cancelado" },
          type: 1,
        },
      },
      select: { productId: true },
      distinct: ["productId"],
    });

    const productIds = purchasedItems.map((item) => item.productId);
    res.json({ success: true, productIds });
  } catch (error) {
    console.error("[USER-PURCHASES] Error:", error);
    res.status(500).json({ error: "Erro ao buscar compras do usuario" });
  }
});

// PUT /:id - Update status
router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ error: "Status invalido", validStatuses: VALID_STATUSES });
    }

    const existing = await prisma.coinTransaction.findUnique({
      where: { id: req.params.id },
    });
    if (!existing)
      return res.status(404).json({ error: "Transação nao encontrada" });

    const transaction = await prisma.coinTransaction.update({
      where: { id: req.params.id },
      data: { status },
    });

    res.json({ success: true, message: "Status atualizado!", transaction });
  } catch (error) {
    console.error("[STATUS] Error:", error);
    res.status(500).json({ error: "Erro ao atualizar status" });
  }
});

// GET /history
router.get("/history", requireAuth, async (req, res) => {
  try {
    const transactions = await prisma.coinTransaction.findMany({
      where: { userId: req.currentUser!.id, totalAmount: { lt: 0 } },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, image: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const enriched = transactions.map((t) => ({
      ...t,
      totalItems: t.items.length,
      products: t.items.map((item) => ({
        id: item.product.id,
        name: item.productName || item.product.name,
        image: item.productImage || item.product.image,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
    }));

    res.json({ success: true, transactions: enriched });
  } catch (error) {
    console.error("[HISTORY] Error:", error);
    res.status(500).json({ error: "Erro ao buscar historico" });
  }
});

// GET /all
router.get("/all", async (req, res) => {
  try {
    const { userId, status, startDate, endDate } = req.query;
    const where: Record<string, unknown> = { totalAmount: { lt: 0 } };

    if (userId) where.userId = userId as string;
    if (status) where.status = status as string;
    if (startDate || endDate) {
      const createdAt: Record<string, Date> = {};
      if (startDate) createdAt.gte = new Date(startDate as string);
      if (endDate) createdAt.lte = new Date(endDate as string);
      where.createdAt = createdAt;
    }

    const transactions = await prisma.coinTransaction.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, image: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    res.json({ success: true, transactions, total: transactions.length });
  } catch (error) {
    console.error("[ALL] Error:", error);
    res.status(500).json({ error: "Erro ao buscar transacoes" });
  }
});

// GET /stats
router.get("/stats", async (_req, res) => {
  try {
    const stats = await prisma.coinTransaction.aggregate({
      where: { totalAmount: { lt: 0 } },
      _sum: { totalAmount: true },
      _count: true,
    });

    const byStatus = await prisma.coinTransaction.groupBy({
      by: ["status"],
      where: { totalAmount: { lt: 0 } },
      _count: true,
    });

    const totalRedeemed = Math.abs(stats._sum.totalAmount || 0);
    const totalTransactions = stats._count;

    res.json({
      success: true,
      stats: {
        totalRedeemed,
        totalTransactions,
        averagePerTransaction:
          totalTransactions > 0 ? totalRedeemed / totalTransactions : 0,
        byStatus: byStatus.reduce(
          (acc, item) => {
            acc[item.status] = item._count;
            return acc;
          },
          {} as Record<string, number>,
        ),
      },
    });
  } catch (error) {
    console.error("[STATS] Error:", error);
    res.status(500).json({ error: "Erro ao buscar estatisticas" });
  }
});

// POST /cancel-with-reason
router.post("/cancel-with-reason", async (req, res) => {
  try {
    const { transactionId, reason } = req.body;

    if (!transactionId)
      return res.status(400).json({ error: "ID da transação é obrigatório" });
    if (!reason?.trim())
      return res
        .status(400)
        .json({ error: "Motivo do cancelamento é obrigatório" });
    if (reason.trim().length > 500)
      return res
        .status(400)
        .json({ error: "Motivo muito longo (max 500 caracteres)" });

    const original = await prisma.coinTransaction.findUnique({
      where: { id: transactionId },
      include: {
        user: {
          select: { id: true, feedzEmployeeId: true, name: true, email: true },
        },
        items: { include: { product: { select: { id: true, name: true } } } },
      },
    });

    if (!original)
      return res.status(404).json({ error: "Transação não encontrada" });
    if (original.status === "cancelado")
      return res.status(400).json({ error: "Transação já foi cancelada" });
    if (original.status === "entregue")
      return res
        .status(400)
        .json({ error: "Não é possível cancelar pedido já entregue" });
    if (!original.user?.feedzEmployeeId)
      return res.status(400).json({ error: "Usuário não vinculado ao Feedz" });

    const amountToCredit = Math.abs(original.totalAmount);
    const creditDescription = `Estorno - Cancelamento: ${reason.trim()}`;

    const creditSuccess = await creditCoins(
      original.user.feedzEmployeeId,
      amountToCredit,
      creditDescription,
    );
    if (!creditSuccess)
      return res
        .status(500)
        .json({ error: "Erro ao creditar moedas no Feedz" });

    await prisma.$transaction(async (tx) => {
      for (const item of original.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      await tx.coinTransaction.update({
        where: { id: transactionId },
        data: {
          status: "cancelado",
          description: `${original.description} | CANCELADO: ${reason.trim()}`,
        },
      });
      await tx.coinTransaction.create({
        data: {
          userId: original.userId,
          feedzEmployeeId: original.feedzEmployeeId,
          totalAmount: amountToCredit,
          type: 2,
          description: creditDescription,
          status: "entregue",
        },
      });
    });

    res.json({
      success: true,
      message: "Pedido cancelado com sucesso!",
      data: {
        transactionId,
        cancelReason: reason.trim(),
        amountRefunded: amountToCredit,
        customerName: original.user.name,
        customerEmail: original.user.email,
        itemsRestored: original.items.map((item) => ({
          productName: item.product.name,
          quantity: item.quantity,
        })),
      },
    });
  } catch (error) {
    console.error("[CANCEL] Error:", error);
    res.status(500).json({ error: "Erro interno ao cancelar pedido" });
  }
});

export default router;
