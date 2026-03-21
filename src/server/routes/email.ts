import { Router } from "express";
import * as emailService from "../services/email.js";

const router = Router();

// POST /purchase
router.post("/purchase", async (req, res) => {
  try {
    const { transactionId, items, totalAmount, userName, userEmail, userId } = req.body;
    if (!transactionId || !items || !totalAmount || !userName) {
      return res.status(400).json({ error: "transactionId, items, totalAmount e userName sao obrigatorios" });
    }
    await emailService.sendPurchaseNotification({
      userName,
      userEmail: userEmail || "Nao informado",
      userId: userId || "N/A",
      transactionId,
      items,
      totalAmount,
    });
    return res.json({ success: true });
  } catch (error) {
    console.error("[EMAIL] Purchase notification error:", error);
    return res.status(500).json({ error: "Erro ao enviar e-mail" });
  }
});

// POST /confirm
router.post("/confirm", async (req, res) => {
  try {
    const { to, transactionId, user, items } = req.body;
    if (!to || !transactionId) {
      return res.status(400).json({ error: "to e transactionId sao obrigatorios" });
    }
    await emailService.sendConfirmation(to, user || "", transactionId, items || []);
    return res.json({ success: true });
  } catch (error) {
    console.error("[EMAIL] Confirmation error:", error);
    return res.status(500).json({ error: "Erro ao enviar e-mail" });
  }
});

// POST /cancel
router.post("/cancel", async (req, res) => {
  try {
    const { to, transactionId, reason, user } = req.body;
    if (!to || !transactionId || !reason || !user) {
      return res.status(400).json({ error: "to, transactionId, reason e user sao obrigatorios" });
    }
    await emailService.sendCancelNotification(to, user, transactionId, reason);
    return res.json({ success: true });
  } catch (error) {
    console.error("[EMAIL] Cancel notification error:", error);
    return res.status(500).json({ error: "Erro ao enviar e-mail" });
  }
});

// POST /ready-for-pickup (FIX: was nested inside /cancel in original)
router.post("/ready-for-pickup", async (req, res) => {
  try {
    const { to, userName, transactionId, items } = req.body;
    if (!to || !userName || !transactionId || !items) {
      return res.status(400).json({ error: "to, userName, transactionId e items sao obrigatorios" });
    }
    await emailService.sendReadyForPickupNotification(to, userName, transactionId, items);
    return res.json({ success: true });
  } catch (error) {
    console.error("[EMAIL] Ready for pickup error:", error);
    return res.status(500).json({ error: "Erro ao enviar e-mail" });
  }
});

// POST /delivery
router.post("/delivery", async (req, res) => {
  try {
    const { to, userName, transactionId, items, receivedBy } = req.body;
    if (!to || !userName || !transactionId || !receivedBy) {
      return res.status(400).json({ error: "to, userName, transactionId e receivedBy sao obrigatorios" });
    }
    await emailService.sendDeliveryConfirmation(to, userName, transactionId, items || [], receivedBy);
    return res.json({ success: true });
  } catch (error) {
    console.error("[EMAIL] Delivery confirmation error:", error);
    return res.status(500).json({ error: "Erro ao enviar e-mail" });
  }
});

export default router;
