import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// All cart routes require authentication
router.use(requireAuth);

// GET / - Get user's cart
router.get("/", async (req, res) => {
  try {
    const items = await prisma.cartItem.findMany({
      where: { userId: req.currentUser!.id },
      include: {
        product: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Filter out inactive/deleted products and transform
    const validItems = items
      .filter((item) => item.product.isActive && !item.product.deletedAt)
      .map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        product: {
          ...item.product,
          discount:
            item.product.discountPercentOff &&
            item.product.discountEndDate &&
            new Date(item.product.discountEndDate) > new Date()
              ? {
                  percentOff: item.product.discountPercentOff,
                  endDate: item.product.discountEndDate.toISOString(),
                }
              : undefined,
        },
      }));

    // Clean up cart items for removed/inactive products
    const invalidIds = items
      .filter((item) => !item.product.isActive || item.product.deletedAt)
      .map((item) => item.id);

    if (invalidIds.length > 0) {
      await prisma.cartItem.deleteMany({
        where: { id: { in: invalidIds } },
      });
    }

    return res.json(validItems);
  } catch (error) {
    console.error("[CART] Get cart error:", error);
    return res.status(500).json({ error: "Erro ao buscar carrinho" });
  }
});

// POST / - Add item to cart (or increment quantity)
router.post("/", async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "productId e obrigatorio" });
    }

    // Verify product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product || !product.isActive || product.deletedAt) {
      return res
        .status(404)
        .json({ error: "Produto nao encontrado ou indisponivel" });
    }

    // Single-purchase validation
    if (product.singlePurchase) {
      const existingCartItem = await prisma.cartItem.findUnique({
        where: {
          userId_productId: {
            userId: req.currentUser!.id,
            productId,
          },
        },
      });
      if (existingCartItem) {
        return res.status(400).json({
          error: "Este produto é de compra única e já está no seu carrinho",
        });
      }

      const existingPurchase = await prisma.transactionItem.findFirst({
        where: {
          productId,
          transaction: {
            userId: req.currentUser!.id,
            status: { not: "cancelado" },
            type: 1,
          },
        },
      });
      if (existingPurchase) {
        return res.status(400).json({
          error:
            "Voce ja possui este item. Itens de compra unica so podem ser adquiridos uma vez.",
        });
      }
    }

    const finalQuantity = product.singlePurchase ? 1 : quantity;

    const item = await prisma.cartItem.upsert({
      where: {
        userId_productId: {
          userId: req.currentUser!.id,
          productId,
        },
      },
      update: {
        quantity: product.singlePurchase ? 1 : { increment: finalQuantity },
      },
      create: {
        userId: req.currentUser!.id,
        productId,
        quantity: finalQuantity,
      },
      include: { product: true },
    });

    return res.json({
      productId: item.productId,
      quantity: item.quantity,
      product: {
        ...item.product,
        discount:
          item.product.discountPercentOff &&
          item.product.discountEndDate &&
          new Date(item.product.discountEndDate) > new Date()
            ? {
                percentOff: item.product.discountPercentOff,
                endDate: item.product.discountEndDate.toISOString(),
              }
            : undefined,
      },
    });
  } catch (error) {
    console.error("[CART] Add item error:", error);
    return res.status(500).json({ error: "Erro ao adicionar ao carrinho" });
  }
});

// PUT /:productId - Update quantity
router.put("/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (typeof quantity !== "number" || quantity < 0) {
      return res.status(400).json({ error: "Quantidade invalida" });
    }

    if (quantity === 0) {
      await prisma.cartItem.deleteMany({
        where: { userId: req.currentUser!.id, productId },
      });
      return res.json({ success: true, removed: true });
    }

    // Single-purchase: prevent quantity change
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (product?.singlePurchase && quantity > 1) {
      return res.status(400).json({
        error: "Itens de compra unica tem quantidade fixa em 1",
      });
    }

    const item = await prisma.cartItem.update({
      where: {
        userId_productId: {
          userId: req.currentUser!.id,
          productId,
        },
      },
      data: { quantity },
    });

    return res.json({ success: true, item });
  } catch (error) {
    console.error("[CART] Update item error:", error);
    return res.status(500).json({ error: "Erro ao atualizar carrinho" });
  }
});

// DELETE /:productId - Remove item
router.delete("/:productId", async (req, res) => {
  try {
    await prisma.cartItem.deleteMany({
      where: {
        userId: req.currentUser!.id,
        productId: req.params.productId,
      },
    });
    return res.json({ success: true });
  } catch (error) {
    console.error("[CART] Remove item error:", error);
    return res.status(500).json({ error: "Erro ao remover do carrinho" });
  }
});

// DELETE / - Clear cart
router.delete("/", async (req, res) => {
  try {
    await prisma.cartItem.deleteMany({
      where: { userId: req.currentUser!.id },
    });
    return res.json({ success: true });
  } catch (error) {
    console.error("[CART] Clear cart error:", error);
    return res.status(500).json({ error: "Erro ao limpar carrinho" });
  }
});

export default router;
