import { Router } from "express";
import { saveImage, MAX_UPLOAD_BYTES } from "../lib/storage.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

// POST / - Recebe imagem base64, grava no bucket MinIO e devolve a URL da rota
// que serve a imagem (/api/images/<chave>). O bucket nao e publico.
router.post("/", async (req, res) => {
  try {
    const { image, folder = "general" } = req.body;

    if (!image || typeof image !== "string") {
      return res
        .status(400)
        .json({ error: "Campo 'image' (base64) e obrigatorio" });
    }

    // data:image/png;base64,iVBOR...
    const match = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) {
      // Nao e base64 - provavelmente ja e uma URL, devolve como esta
      return res.json({ url: image });
    }

    const mimeSubtype = match[1];
    const ext = mimeSubtype === "jpeg" ? "jpg" : mimeSubtype;
    const buffer = Buffer.from(match[2], "base64");

    if (buffer.length > MAX_UPLOAD_BYTES) {
      return res.status(413).json({
        error: `Imagem muito grande (max ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB)`,
      });
    }

    const storageKey = await saveImage({
      folder: String(folder),
      ext,
      mimeType: `image/${mimeSubtype}`,
      body: buffer,
    });

    return res.json({ url: `/api/images/${storageKey}` });
  } catch (error) {
    console.error("[UPLOAD] Error:", error);
    return res.status(500).json({ error: "Erro ao fazer upload" });
  }
});

export default router;
