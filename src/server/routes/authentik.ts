import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { getFeedzEmployee } from "../services/feedz.js";
import {
  isAuthentikEnabled,
  buildLoginRedirect,
  exchangeCallback,
} from "../services/authentik.js";

const router = Router();

const COOKIE_OPTS = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 10 * 60 * 1000, // 10 minutes
  path: "/api/auth/authentik",
};

// Where to send the browser after the flow. Uses the redirect URI's origin.
function frontendBase(): string {
  return new URL(process.env.AUTHENTIK_REDIRECT_URI as string).origin;
}

// GET /login — start the OIDC flow
router.get("/login", async (_req, res) => {
  if (!isAuthentikEnabled()) {
    return res.status(404).json({ error: "Authentik nao esta habilitado" });
  }
  try {
    const { url, codeVerifier, state, nonce } = await buildLoginRedirect();
    res.cookie("ak_verifier", codeVerifier, COOKIE_OPTS);
    res.cookie("ak_state", state, COOKIE_OPTS);
    res.cookie("ak_nonce", nonce, COOKIE_OPTS);
    return res.redirect(url);
  } catch (error) {
    console.error("[AUTHENTIK] Login start error:", error);
    return res.redirect(`${frontendBase()}/login?authError=authentik`);
  }
});

// GET /callback — finish the OIDC flow
router.get("/callback", async (req, res) => {
  if (!isAuthentikEnabled()) {
    return res.status(404).json({ error: "Authentik nao esta habilitado" });
  }
  const base = frontendBase();

  const codeVerifier = req.cookies?.ak_verifier as string | undefined;
  const state = req.cookies?.ak_state as string | undefined;
  const nonce = req.cookies?.ak_nonce as string | undefined;

  // Clear transient cookies regardless of outcome
  res.clearCookie("ak_verifier", { path: COOKIE_OPTS.path });
  res.clearCookie("ak_state", { path: COOKIE_OPTS.path });
  res.clearCookie("ak_nonce", { path: COOKIE_OPTS.path });

  if (!codeVerifier || !state || !nonce) {
    return res.redirect(`${base}/login?authError=session`);
  }

  try {
    const currentUrl = new URL(req.originalUrl, base);
    const { email, name, sub } = await exchangeCallback(currentUrl, {
      codeVerifier,
      state,
      nonce,
    });

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Email didn't match — the subject may already be linked to an account
      // whose email changed in the IdP. Match by the stable Authentik sub and
      // reconcile the email onto that record.
      const linked = await prisma.user.findUnique({
        where: { authentikSub: sub },
      });
      if (linked) {
        user =
          linked.email === email
            ? linked
            : await prisma.user.update({
                where: { id: linked.id },
                data: { email },
              });
      }
    }

    if (user) {
      // Link the Authentik subject on first SSO login
      if (!user.authentikSub) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { authentikSub: sub },
        });
      }
    } else {
      // Auto-provision, gated by Feedz "Ativo"
      const feedzEmployee = await getFeedzEmployee(email);
      if (!feedzEmployee) {
        return res.redirect(`${base}/login?authError=feedz`);
      }
      user = await prisma.user.create({
        data: {
          email,
          password: null,
          name: name || feedzEmployee.name,
          role: "user",
          feedzEmployeeId: feedzEmployee.employeeId,
          authentikSub: sub,
        },
      });
    }

    return res.redirect(`${base}/auth/callback?uid=${encodeURIComponent(user.id)}`);
  } catch (error) {
    console.error("[AUTHENTIK] Callback error:", error);
    return res.redirect(`${base}/login?authError=authentik`);
  }
});

export default router;
