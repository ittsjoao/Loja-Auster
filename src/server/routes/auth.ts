import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { getFeedzEmployee } from "../services/feedz.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// POST /login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha sao obrigatorios" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        profilePicture: true,
        feedzEmployeeId: true,
      },
    });

    if (!user || !user.password) {
      return res.status(401).json({ error: "Credenciais invalidas" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Credenciais invalidas" });
    }

    const { password: _, ...userWithoutPassword } = user;
    return res.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error("[AUTH] Login error:", error);
    return res.status(500).json({ error: "Erro ao fazer login" });
  }
});

// POST /register
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, profilePicture } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha sao obrigatorios" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email ja esta em uso" });
    }

    const feedzEmployee = await getFeedzEmployee(email);
    if (!feedzEmployee) {
      return res.status(400).json({
        error: "Email nao encontrado no sistema Feedz ou colaborador inativo",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || feedzEmployee.name,
        role: "user",
        profilePicture: profilePicture || undefined,
        feedzEmployeeId: feedzEmployee.employeeId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profilePicture: true,
        feedzEmployeeId: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ success: true, user });
  } catch (error) {
    console.error("[AUTH] Register error:", error);
    return res.status(500).json({ error: "Erro ao registrar usuário" });
  }
});

// POST /logout
router.post("/logout", (_req, res) => {
  return res.json({ success: true });
});

// GET /me
router.get("/me", requireAuth, (req, res) => {
  return res.json({ success: true, user: req.currentUser });
});

// --- Admin User Management ---

// GET /users
router.get("/users", async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profilePicture: true,
        feedzEmployeeId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(users);
  } catch (error) {
    console.error("[AUTH] Get users error:", error);
    return res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

// POST /users
router.post("/users", async (req, res) => {
  try {
    const { email, password, role, name, profilePicture } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha sao obrigatorios" });
    }

    const feedzEmployee = await getFeedzEmployee(email);
    if (!feedzEmployee) {
      return res.status(400).json({
        error: "Email nao encontrado no sistema Feedz ou colaborador inativo",
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email ja esta em uso" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        profilePicture: profilePicture || null,
        role: role === "admin" ? "admin" : "user",
        feedzEmployeeId: feedzEmployee.employeeId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profilePicture: true,
        feedzEmployeeId: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ success: true, user });
  } catch (error) {
    console.error("[AUTH] Create user error:", error);
    return res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

// PUT /users/:id
router.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updates,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profilePicture: true,
        feedzEmployeeId: true,
      },
    });

    return res.json({ success: true, user });
  } catch (error) {
    console.error("[AUTH] Update user error:", error);
    return res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
});

// DELETE /users/:id
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting the protected admin user
    const user = await prisma.user.findUnique({ where: { id } });
    if (user?.email === "ti@austercontabil.com.br") {
      return res
        .status(403)
        .json({ error: "Este usuário nao pode ser removido" });
    }

    await prisma.user.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error) {
    console.error("[AUTH] Delete user error:", error);
    return res.status(500).json({ error: "Erro ao deletar usuário" });
  }
});

export default router;
