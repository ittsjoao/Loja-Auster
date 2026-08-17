import { Router } from "express";
import { readImage } from "../lib/storage.js";

const router = Router();

/**
 * Serve a imagem do bucket. Sem autenticacao de proposito: quem consome e a tag
 * <img> do navegador, que nao manda header de sessao - e imagem de produto e
 * foto de perfil nao sao conteudo restrito. O que a rota garante e que o MinIO
 * nao precisa ser alcancavel de fora da rede interna.
 */
router.get("/*", async (req, res) => {
  // req.path e relativo ao mount (/api/images), ou seja: a propria chave.
  const storageKey = decodeURIComponent(req.path.replace(/^\/+/, ""));

  if (!storageKey || storageKey.includes("..")) {
    return res.status(400).json({ error: "Chave invalida" });
  }

  try {
    const { stream, contentType, size } = await readImage(storageKey);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", String(size));
    // A chave tem uuid e nunca e reescrita, entao pode cachear pra sempre.
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    stream.on("error", (error) => {
      console.error("[IMAGES] Stream error:", error);
      res.destroy();
    });
    stream.pipe(res);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "NotFound" || code === "NoSuchKey") {
      return res.status(404).json({ error: "Imagem nao encontrada" });
    }
    console.error("[IMAGES] Error:", error);
    return res.status(500).json({ error: "Erro ao buscar imagem" });
  }
});

export default router;
