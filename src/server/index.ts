import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import redemptionRoutes from "./routes/redemption.js";
import emailRoutes from "./routes/email.js";
import cartRoutes from "./routes/cart.js";
import uploadRoutes from "./routes/upload.js";
import { getCoinsBalance } from "./services/feedz.js";

const app = express();
const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/redemption", redemptionRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/upload", uploadRoutes);

// Serve uploaded files as static assets
const uploadDir = path.resolve(process.env.UPLOAD_DIR || "./uploads");
app.use("/uploads", express.static(uploadDir));

// Feedz coin balance proxy
app.get("/api/coins/:id", async (req, res) => {
  try {
    const balance = await getCoinsBalance(Number(req.params.id));
    if (balance === null) return res.status(500).json({ error: "Erro ao buscar saldo" });
    res.json({ balance });
  } catch (error) {
    console.error("[COINS] Balance error:", error);
    res.status(500).json({ error: "Erro ao buscar saldo" });
  }
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Production: serve frontend
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "../../dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ error: "Rota nao encontrada" });
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  app.use((_req, res) => res.status(404).json({ error: "Rota nao encontrada" }));
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
});

export default app;
