import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtps.uhserver.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const HR_EMAIL = process.env.HR_EMAIL || "rh@austercontabil.com.br";

const transporter =
  SMTP_USER && SMTP_PASS
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })
    : null;

function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function buildHtml(headerColor: string, title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
    .card { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: ${headerColor}; padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { margin: 6px 0 0; color: rgba(255,255,255,0.8); font-size: 13px; }
    .body { padding: 24px; }
    .greeting { font-size: 16px; color: #1e293b; margin: 0 0 16px; }
    .text { font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 12px; }
    .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; color: #334155; }
    .info-label { font-weight: 600; color: #1e293b; }
    .highlight-box { border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center; }
    .highlight-box.green { background: #ecfdf5; border: 1px solid #a7f3d0; }
    .highlight-box.blue { background: #eff6ff; border: 1px solid #bfdbfe; }
    .highlight-box.red { background: #fef2f2; border: 1px solid #fecaca; }
    .highlight-box h2 { margin: 0; font-size: 18px; }
    .highlight-box p { margin: 6px 0 0; font-size: 13px; color: #64748b; }
    .item-list { margin: 12px 0; }
    .item { display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155; }
    .item:last-child { border-bottom: none; }
    .total-row { display: flex; justify-content: space-between; padding: 12px; background: #f8fafc; border-radius: 8px; margin-top: 12px; font-size: 16px; font-weight: 700; color: #1e293b; }
    .footer { padding: 20px 24px; border-top: 1px solid #f1f5f9; text-align: center; }
    .footer p { margin: 0; font-size: 12px; color: #94a3b8; }
    .code { background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-family: monospace; font-size: 13px; color: #334155; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>${title}</h1>
        <p>Loja Auster - Recompensas para Colaboradores</p>
      </div>
      <div class="body">
        ${body}
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Auster Contabilidade. Todos os direitos reservados.</p>
        <p style="margin-top: 4px;">Este e-mail foi enviado automaticamente pela Loja Auster.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function sendHtml(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  if (!transporter) {
    console.warn("[EMAIL] SMTP not configured, skipping email to:", to);
    return;
  }
  await transporter.sendMail({
    from: `Loja Auster <${SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

// ─── 1. Nova Compra (cliente + RH) ─────────────────────────────────────────

export interface PurchaseEmailData {
  userName: string;
  userEmail: string;
  userId: string;
  transactionId: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
}

export async function sendPurchaseNotification(
  data: PurchaseEmailData,
): Promise<void> {
  const itemsHtml = data.items
    .map(
      (item) =>
        `<div class="item"><span>${item.name} (${item.quantity}x)</span><span>${formatMoney(item.quantity * item.price)}</span></div>`,
    )
    .join("");

  const body = `
    <p class="greeting">Ola, <strong>${data.userName}</strong>!</p>
    <p class="text">Recebemos sua compra na Loja Auster. Confira os detalhes abaixo:</p>

    <div class="info-box">
      <div class="info-row"><span class="info-label">Pedido</span><span class="code">${data.transactionId.slice(-8).toUpperCase()}</span></div>
      <div class="info-row"><span class="info-label">Data</span><span>${new Date().toLocaleString("pt-BR")}</span></div>
      <div class="info-row"><span class="info-label">Cliente</span><span>${data.userName}</span></div>
    </div>

    <div class="item-list">${itemsHtml}</div>
    <div class="total-row"><span>Total</span><span>${formatMoney(data.totalAmount)}</span></div>

    <p class="text" style="margin-top: 20px;">Seu pedido sera analisado e em breve voce recebera uma atualização sobre o andamento.</p>
  `;

  const subject = `Loja Auster - Nova Compra - ${formatMoney(data.totalAmount)}`;
  const html = buildHtml("#1d4ed8", "Nova Compra Realizada", body);
  await sendHtml(data.userEmail, subject, html);
  await sendHtml(HR_EMAIL, subject, html);
}

// ─── 2. Confirmacao / Preparando ────────────────────────────────────────────

export async function sendConfirmation(
  to: string,
  userName: string,
  transactionId: string,
  items: Array<{ name: string; quantity: number }>,
): Promise<void> {
  const itemsHtml = items
    .map(
      (item) =>
        `<div class="item"><span>${item.name}</span><span>${item.quantity}x</span></div>`,
    )
    .join("");

  const body = `
    <p class="greeting">Ola, <strong>${userName}</strong>!</p>

    <div class="highlight-box blue">
      <h2 style="color: #1d4ed8;">Pedido Confirmado!</h2>
      <p>Estamos preparando seus produtos</p>
    </div>

    <p class="text">Recebemos seu pedido e confirmamos! Estamos preparando seus produtos com todo o cuidado e assim que estiverem prontos para retirada, enviaremos um novo e-mail.</p>
    <p class="text"><strong>Fique de olho na sua caixa de entrada!</strong></p>

    <div class="info-box">
      <div class="info-row"><span class="info-label">Pedido</span><span class="code">${transactionId.slice(-8).toUpperCase()}</span></div>
    </div>

    ${items.length > 0 ? `<div class="item-list">${itemsHtml}</div>` : ""}
  `;

  const html = buildHtml(
    "#1d4ed8",
    "Pedido Confirmado - Estamos Preparando!",
    body,
  );
  await sendHtml(
    to,
    `Loja Auster - Pedido Confirmado - #${transactionId.slice(-8).toUpperCase()}`,
    html,
  );
}

// ─── 3. Pronto para Coleta ──────────────────────────────────────────────────

export async function sendReadyForPickupNotification(
  to: string,
  userName: string,
  transactionId: string,
  items: Array<{ name: string; quantity: number }>,
): Promise<void> {
  const itemsHtml = items
    .map(
      (item) =>
        `<div class="item"><span>${item.name}</span><span>${item.quantity}x</span></div>`,
    )
    .join("");

  const body = `
    <p class="greeting">Ola, <strong>${userName}</strong>!</p>

    <div class="highlight-box green">
      <h2 style="color: #059669;">Pronto para Retirada!</h2>
      <p>Seus produtos estao esperando por voce</p>
    </div>

    <p class="text">Temos uma otima noticia! Seu pedido esta pronto para ser retirado. Dirija-se ao setor de <strong>Recursos Humanos</strong> para fazer a coleta.</p>

    <div class="info-box">
      <div class="info-row"><span class="info-label">Pedido</span><span class="code">${transactionId.slice(-8).toUpperCase()}</span></div>
    </div>

    <div class="item-list">${itemsHtml}</div>

    <div class="highlight-box blue">
      <h2 style="color: #1d4ed8; font-size: 15px;">Como retirar?</h2>
      <p style="text-align: left; margin-top: 8px;">
        Apresente este e-mail ou o codigo do pedido ao RH para retirar seus produtos.
      </p>
    </div>
  `;

  const html = buildHtml("#059669", "Pedido Pronto para Retirada!", body);
  await sendHtml(
    to,
    `Loja Auster - Pronto para Retirada - #${transactionId.slice(-8).toUpperCase()}`,
    html,
  );
}

// ─── 4. Entrega Confirmada (NOVO) ───────────────────────────────────────────

export async function sendDeliveryConfirmation(
  to: string,
  userName: string,
  transactionId: string,
  items: Array<{ name: string; quantity: number }>,
  receivedBy: string,
): Promise<void> {
  const itemsHtml = items
    .map(
      (item) =>
        `<div class="item"><span>${item.name}</span><span>${item.quantity}x</span></div>`,
    )
    .join("");

  const body = `
    <p class="greeting">Ola, <strong>${userName}</strong>!</p>

    <div class="highlight-box green">
      <h2 style="color: #059669;">Pedido Entregue!</h2>
      <p>Tudo certo com a sua entrega</p>
    </div>

    <p class="text">Informamos que seu pedido foi entregue com sucesso! Confira os detalhes abaixo:</p>

    <div class="info-box">
      <div class="info-row"><span class="info-label">Pedido</span><span class="code">${transactionId.slice(-8).toUpperCase()}</span></div>
      <div class="info-row"><span class="info-label">Recebido por</span><span><strong>${receivedBy}</strong></span></div>
      <div class="info-row"><span class="info-label">Data da entrega</span><span>${new Date().toLocaleString("pt-BR")}</span></div>
    </div>

    ${items.length > 0 ? `<div class="item-list">${itemsHtml}</div>` : ""}

    <p class="text" style="margin-top: 16px;">Obrigado por comprar na Loja Auster! Esperamos que aproveite seus produtos.</p>
    <p class="text">Caso tenha alguma duvida sobre a entrega, entre em contato com o RH.</p>
  `;

  const html = buildHtml("#059669", "Pedido Entregue com Sucesso!", body);
  await sendHtml(
    to,
    `Loja Auster - Pedido Entregue - #${transactionId.slice(-8).toUpperCase()}`,
    html,
  );
}

// ─── 5. Cancelamento ────────────────────────────────────────────────────────

export async function sendCancelNotification(
  to: string,
  userName: string,
  transactionId: string,
  reason: string,
): Promise<void> {
  const body = `
    <p class="greeting">Ola, <strong>${userName}</strong>.</p>

    <div class="highlight-box red">
      <h2 style="color: #dc2626;">Pedido Cancelado</h2>
      <p>Seu pedido foi cancelado</p>
    </div>

    <p class="text">Infelizmente, seu pedido precisou ser cancelado. Veja os detalhes:</p>

    <div class="info-box">
      <div class="info-row"><span class="info-label">Pedido</span><span class="code">${transactionId.slice(-8).toUpperCase()}</span></div>
    </div>

    <div class="info-box" style="border-color: #fecaca; background: #fef2f2;">
      <p style="margin: 0; font-size: 14px; color: #991b1b;"><strong>Motivo do cancelamento:</strong></p>
      <p style="margin: 8px 0 0; font-size: 14px; color: #334155;">${reason}</p>
    </div>

    <p class="text" style="color: #059669;"><strong>Suas moedas foram estornadas automaticamente.</strong></p>
    <p class="text">Caso tenha duvidas, entre em contato com o setor de Recursos Humanos.</p>
  `;

  const html = buildHtml("#dc2626", "Pedido Cancelado", body);
  await sendHtml(
    to,
    `Loja Auster - Pedido Cancelado - #${transactionId.slice(-8).toUpperCase()}`,
    html,
  );
}
