import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// GET / - List active products
router.get("/", async (req, res) => {
  try {
    const { category, featured, search } = req.query;

    const where: Record<string, unknown> = {
      isActive: true,
      deletedAt: null,
    };

    if (category) where.category = (category as string).toLowerCase().trim();
    if (featured === "true") where.featured = true;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Transform discount fields for frontend
    const transformed = products.map((p) => ({
      ...p,
      discount:
        p.discountPercentOff && p.discountEndDate && new Date(p.discountEndDate) > new Date()
          ? { percentOff: p.discountPercentOff, endDate: p.discountEndDate.toISOString() }
          : undefined,
    }));

    return res.json(transformed);
  } catch (error) {
    console.error("[PRODUCTS] Get products error:", error);
    return res.status(500).json({ error: "Erro ao buscar produtos" });
  }
});

// GET /inactive
router.get("/inactive", async (_req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { OR: [{ isActive: false }, { deletedAt: { not: null } }] },
      orderBy: { updatedAt: "desc" },
    });
    return res.json(products);
  } catch (error) {
    console.error("[PRODUCTS] Get inactive error:", error);
    return res.status(500).json({ error: "Erro ao buscar produtos inativos" });
  }
});

// GET /categories/all
router.get("/categories/all", async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    return res.json(categories);
  } catch (error) {
    console.error("[PRODUCTS] Get categories error:", error);
    return res.status(500).json({ error: "Erro ao buscar categorias" });
  }
});

// GET /:id
router.get("/:id", async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: "Produto nao encontrado" });

    const transformed = {
      ...product,
      discount:
        product.discountPercentOff && product.discountEndDate && new Date(product.discountEndDate) > new Date()
          ? { percentOff: product.discountPercentOff, endDate: product.discountEndDate.toISOString() }
          : undefined,
    };

    return res.json(transformed);
  } catch (error) {
    console.error("[PRODUCTS] Get product error:", error);
    return res.status(500).json({ error: "Erro ao buscar produto" });
  }
});

// POST / - Create product
router.post("/", async (req, res) => {
  try {
    const { name, description, price, image, category, stock = 0, featured = false, discountPercentOff, discountEndDate } = req.body;

    if (!name || !description || price === undefined || !image || !category) {
      return res.status(400).json({ error: "Campos obrigatorios: name, description, price, image, category" });
    }

    if (typeof price !== "number" || price < 0) {
      return res.status(400).json({ error: "Preco invalido" });
    }

    // Ensure category exists
    const normalizedCategory = category.toLowerCase().trim();
    await prisma.category.upsert({
      where: { name: normalizedCategory },
      update: {},
      create: { name: normalizedCategory },
    });

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: Math.round(price),
        image,
        category: normalizedCategory,
        stock: Math.max(0, Math.round(stock)),
        featured,
        ...(discountPercentOff && discountEndDate
          ? {
              discountPercentOff: Math.round(discountPercentOff),
              discountEndDate: new Date(discountEndDate),
            }
          : {}),
      },
    });

    return res.status(201).json({ success: true, product });
  } catch (error) {
    console.error("[PRODUCTS] Create product error:", error);
    return res.status(500).json({ error: "Erro ao criar produto" });
  }
});

// PUT /:id - Update product
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Handle discount fields
    if (updates.discountPercentOff !== undefined) {
      updates.discountPercentOff = updates.discountPercentOff
        ? Math.round(updates.discountPercentOff)
        : null;
    }
    if (updates.discountEndDate !== undefined) {
      updates.discountEndDate = updates.discountEndDate
        ? new Date(updates.discountEndDate)
        : null;
    }

    // Normalize category if provided
    if (updates.category) {
      updates.category = updates.category.toLowerCase().trim();
      await prisma.category.upsert({
        where: { name: updates.category },
        update: {},
        create: { name: updates.category },
      });
    }

    // Round numeric fields
    if (updates.price !== undefined) updates.price = Math.round(Number(updates.price));
    if (updates.stock !== undefined) updates.stock = Math.max(0, Math.round(Number(updates.stock)));

    // Auto-reactivate product when stock > 0
    if (updates.stock !== undefined && updates.stock > 0) {
      updates.isActive = true;
      updates.deletedAt = null;
    }

    const product = await prisma.product.update({
      where: { id },
      data: updates,
    });

    return res.json({ success: true, product });
  } catch (error) {
    console.error("[PRODUCTS] Update product error:", error);
    return res.status(500).json({ error: "Erro ao atualizar produto" });
  }
});

// DELETE /:id - Soft delete
router.delete("/:id", async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        isActive: false,
        deletedAt: new Date(),
        stock: 0,
        discountEndDate: null,
        discountPercentOff: null,
        featured: false,
      },
    });
    return res.json({ success: true, product });
  } catch (error) {
    console.error("[PRODUCTS] Delete product error:", error);
    return res.status(500).json({ error: "Erro ao deletar produto" });
  }
});

// POST /:id/discount
router.post("/:id/discount", async (req, res) => {
  try {
    const { percentOff, durationDays } = req.body;

    if (!percentOff || !durationDays) {
      return res.status(400).json({ error: "percentOff e durationDays sao obrigatorios" });
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        discountPercentOff: Math.round(percentOff),
        discountEndDate: endDate,
      },
    });

    return res.json({ success: true, product });
  } catch (error) {
    console.error("[PRODUCTS] Add discount error:", error);
    return res.status(500).json({ error: "Erro ao adicionar desconto" });
  }
});

// DELETE /:id/discount
router.delete("/:id/discount", async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { discountPercentOff: null, discountEndDate: null },
    });
    return res.json({ success: true, product });
  } catch (error) {
    console.error("[PRODUCTS] Remove discount error:", error);
    return res.status(500).json({ error: "Erro ao remover desconto" });
  }
});

// POST /categories
router.post("/categories", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Nome e obrigatorio" });

    const normalizedName = name.toLowerCase().trim();
    const existing = await prisma.category.findUnique({ where: { name: normalizedName } });
    if (existing) return res.status(400).json({ error: "Categoria ja existe" });

    const category = await prisma.category.create({ data: { name: normalizedName } });
    return res.status(201).json({ success: true, category });
  } catch (error) {
    console.error("[PRODUCTS] Create category error:", error);
    return res.status(500).json({ error: "Erro ao criar categoria" });
  }
});

// PUT /categories/:id
router.put("/categories/:id", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Nome e obrigatorio" });

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name: name.toLowerCase().trim() },
    });
    return res.json({ success: true, category });
  } catch (error) {
    console.error("[PRODUCTS] Update category error:", error);
    return res.status(500).json({ error: "Erro ao atualizar categoria" });
  }
});

// DELETE /categories/:id
router.delete("/categories/:id", async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (error) {
    console.error("[PRODUCTS] Delete category error:", error);
    return res.status(500).json({ error: "Erro ao deletar categoria" });
  }
});

export default router;
