import * as client from "openid-client";

const ISSUER = process.env.AUTHENTIK_ISSUER_URL;
const CLIENT_ID = process.env.AUTHENTIK_CLIENT_ID;
const CLIENT_SECRET = process.env.AUTHENTIK_CLIENT_SECRET;
const REDIRECT_URI = process.env.AUTHENTIK_REDIRECT_URI;

export function isAuthentikEnabled(): boolean {
  return Boolean(ISSUER && CLIENT_ID && CLIENT_SECRET && REDIRECT_URI);
}

let configPromise: Promise<client.Configuration> | null = null;

async function getConfig(): Promise<client.Configuration> {
  if (!isAuthentikEnabled()) {
    throw new Error("Authentik nao esta configurado");
  }
  if (!configPromise) {
    configPromise = client.discovery(
      new URL(ISSUER as string),
      CLIENT_ID as string,
      CLIENT_SECRET as string,
    );
  }
  return configPromise;
}

export async function buildLoginRedirect(): Promise<{
  url: string;
  codeVerifier: string;
  state: string;
  nonce: string;
}> {
  const config = await getConfig();

  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  const state = client.randomState();
  const nonce = client.randomNonce();

  const url = client
    .buildAuthorizationUrl(config, {
      redirect_uri: REDIRECT_URI as string,
      scope: "openid email profile",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state,
      nonce,
    })
    .href;

  return { url, codeVerifier, state, nonce };
}

export async function exchangeCallback(
  currentUrl: URL,
  checks: { codeVerifier: string; state: string; nonce: string },
): Promise<{ email: string; name?: string; sub: string }> {
  const config = await getConfig();

  const tokens = await client.authorizationCodeGrant(config, currentUrl, {
    pkceCodeVerifier: checks.codeVerifier,
    expectedState: checks.state,
    expectedNonce: checks.nonce,
    idTokenExpected: true,
  });

  const claims = tokens.claims();
  if (!claims || typeof claims.email !== "string" || !claims.email) {
    throw new Error("Authentik nao retornou um email valido");
  }

  return {
    email: claims.email,
    name: typeof claims.name === "string" ? claims.name : undefined,
    sub: claims.sub,
  };
}
