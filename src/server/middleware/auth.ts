import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      currentUser?: {
        id: string;
        email: string;
        name: string | null;
        role: string;
        feedzEmployeeId: number | null;
        profilePicture: string | null;
      };
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      return res.status(401).json({ error: "Nao autenticado" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        feedzEmployeeId: true,
        profilePicture: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    req.currentUser = user;
    next();
  } catch (error) {
    console.error("[AUTH] Middleware error:", error);
    return res.status(500).json({ error: "Erro de autenticação" });
  }
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      return res.status(401).json({ error: "Nao autenticado" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        feedzEmployeeId: true,
        profilePicture: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    req.currentUser = user;
    next();
  } catch (error) {
    console.error("[AUTH] Admin middleware error:", error);
    return res.status(500).json({ error: "Erro de autenticação" });
  }
}
