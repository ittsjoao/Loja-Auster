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

/**
 * O construtor do minio aceita SO host puro: "minio:9000" ou
 * "http://minio:9000" viram InvalidEndpointError. Como isso rodava no import,
 * um S3_ENDPOINT digitado como URL derrubava o servidor inteiro no boot - por
 * isso o endpoint e normalizado aqui e o cliente e criado sob demanda.
 */
function parseEndpoint(raw: string) {
  const url = new URL(/^https?:\/\//.test(raw) ? raw : `http://${raw}`);
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : undefined,
    ssl: url.protocol === "https:",
  };
}

let client: Client | undefined;

function getClient(): Client {
  if (client) return client;

  const endpoint = parseEndpoint(process.env.S3_ENDPOINT || "minio");
  const useSSL = process.env.S3_USE_SSL
    ? process.env.S3_USE_SSL === "true"
    : endpoint.ssl;
  const port =
    Number(process.env.S3_PORT) || endpoint.port || (useSSL ? 443 : 9000);

  console.log(
    `[S3] ${useSSL ? "https" : "http"}://${endpoint.host}:${port} bucket=${S3_BUCKET}`,
  );

  client = new Client({
    endPoint: endpoint.host,
    port,
    useSSL,
    accessKey: process.env.S3_ACCESS_KEY || "",
    secretKey: process.env.S3_SECRET_KEY || "",
  });

  return client;
}

let bucketReady: Promise<void> | undefined;

function ensureBucket(): Promise<void> {
  bucketReady ??= (async () => {
    if (!(await getClient().bucketExists(S3_BUCKET))) {
      await getClient().makeBucket(S3_BUCKET);
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
  await getClient().putObject(S3_BUCKET, storageKey, file.body, file.body.length, {
    "Content-Type": file.mimeType,
  });

  return storageKey;
}

/** Stream do objeto, para a rota de imagem repassar ao navegador. */
export async function readImage(
  storageKey: string,
): Promise<{ stream: Readable; contentType: string; size: number }> {
  const stat = await getClient().statObject(S3_BUCKET, storageKey);

  return {
    stream: await getClient().getObject(S3_BUCKET, storageKey),
    contentType: stat.metaData?.["content-type"] || "application/octet-stream",
    size: stat.size,
  };
}
