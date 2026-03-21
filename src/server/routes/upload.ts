import { Router } from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

router.use(requireAuth);

// POST / - Upload base64 image, save to disk, return URL
router.post("/", async (req, res) => {
  try {
    const { image, folder = "general" } = req.body;

    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "Campo 'image' (base64) e obrigatorio" });
    }

    // Parse base64 data URL: data:image/png;base64,iVBOR...
    const match = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) {
      // Not base64 - might be a regular URL, just return it as-is
      return res.json({ url: image });
    }

    const ext = match[1] === "jpeg" ? "jpg" : match[1];
    const buffer = Buffer.from(match[2], "base64");

    // Create subfolder (products, profiles, etc.)
    const subDir = path.join(UPLOAD_DIR, folder);
    if (!fs.existsSync(subDir)) {
      fs.mkdirSync(subDir, { recursive: true });
    }

    // Generate unique filename
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
    const filePath = path.join(subDir, filename);

    fs.writeFileSync(filePath, buffer);

    const url = `/uploads/${folder}/${filename}`;
    return res.json({ url });
  } catch (error) {
    console.error("[UPLOAD] Error:", error);
    return res.status(500).json({ error: "Erro ao fazer upload" });
  }
});

export default router;
