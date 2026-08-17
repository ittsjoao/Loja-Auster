import { randomUUID } from "node:crypto";
import type { Readable } from "node:stream";
import { Client } from "minio";

/**
 * Imagens de produtos e perfis no MinIO (S3-compativel). Substitui a gravacao
 * em disco, que exigia volume montado no container.
 *
 * O bucket nunca e publico e a leitura **passa pela aplicacao** (rota
 * /api/images). Nao se usa presigned URL de proposito: o MinIO fica so na rede
 * interna, e uma URL assinada teria que ser valida para o navegador do usuario
 * - ou seja, exigiria expor o MinIO num host publico e assinar contra ele.
 */

const S3_BUCKET = process.env.S3_BUCKET || "lojauster";

export const MAX_UPLOAD_BYTES = Number(
  process.env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024,
);

const client = new Client({
  endPoint: process.env.S3_ENDPOINT || "minio",
  port: Number(process.env.S3_PORT || 9000),
  useSSL: process.env.S3_USE_SSL === "true",
  accessKey: process.env.S3_ACCESS_KEY || "",
  secretKey: process.env.S3_SECRET_KEY || "",
});

let bucketReady: Promise<void> | undefined;

function ensureBucket(): Promise<void> {
  bucketReady ??= (async () => {
    if (!(await client.bucketExists(S3_BUCKET))) {
      await client.makeBucket(S3_BUCKET);
    }
  })().catch((error) => {
    // Nao memoiza a falha: a proxima tentativa deve poder reconectar.
    bucketReady = undefined;
    throw error;
  });

  return bucketReady;
}

/** Chave sem barras extras nem acentos, agrupada por pasta e ano. */
function buildStorageKey(folder: string, ext: string): string {
  const safeFolder =
    folder
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 40) || "general";

  return `${safeFolder}/${new Date().getUTCFullYear()}/${randomUUID()}.${ext}`;
}

export async function saveImage(file: {
  folder: string;
  ext: string;
  mimeType: string;
  body: Buffer;
}): Promise<string> {
  await ensureBucket();

  const storageKey = buildStorageKey(file.folder, file.ext);
  await client.putObject(S3_BUCKET, storageKey, file.body, file.body.length, {
    "Content-Type": file.mimeType,
  });

  return storageKey;
}

/** Stream do objeto, para a rota de imagem repassar ao navegador. */
export async function readImage(
  storageKey: string,
): Promise<{ stream: Readable; contentType: string; size: number }> {
  const stat = await client.statObject(S3_BUCKET, storageKey);

  return {
    stream: await client.getObject(S3_BUCKET, storageKey),
    contentType: stat.metaData?.["content-type"] || "application/octet-stream",
    size: stat.size,
  };
}
