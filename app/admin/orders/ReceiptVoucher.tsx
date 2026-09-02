"use client";

function toArabicWords(n: number): string {
  const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة",
    "عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر",
    "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
  const tens = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  const hundreds = ["", "مائة", "مئتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];
  if (n === 0) return "صفر";
  if (n < 0) return "سالب " + toArabicWords(-n);
  let result = "";
  if (n >= 1000) {
    const t = Math.floor(n / 1000);
    result += (t === 1 ? "ألف" : t === 2 ? "ألفان" : t <= 10 ? toArabicWords(t) + " آلاف" : toArabicWords(t) + " ألف") + " ";
    n %= 1000;
    if (n > 0) result += "و";
  }
  if (n >= 100) { result += hundreds[Math.floor(n / 100)] + " "; n %= 100; if (n > 0) result += "و"; }
  if (n >= 20) { result += tens[Math.floor(n / 10)] + " "; n %= 10; if (n > 0) result += "و"; }
  if (n > 0) result += ones[n] + " ";
  return result.trim();
}

const PRINT_STYLE = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Arial, sans-serif; background: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; direction: rtl; }
.cheque { width: 680px; border: 2px solid #1a1a1a; border-radius: 8px; overflow: hidden; }
.cheque-header { background: #1a1a1a; color: #fff; display: flex; justify-content: space-between; align-items: center; padding: 10px 18px; }
.cheque-header .title { font-size: 18px; font-weight: 900; letter-spacing: 1px; }
.cheque-header .no { font-size: 12px; opacity: .75; }
.cheque-body { padding: 18px 20px; }
.field-row { display: flex; align-items: stretch; border: 1px solid #d1d5db; border-radius: 6px; margin-bottom: 10px; overflow: hidden; }
.field-label { background: #f3f4f6; font-weight: 700; font-size: 12px; color: #374151; padding: 8px 12px; white-space: nowrap; display: flex; align-items: center; border-left: 1px solid #d1d5db; min-width: 130px; }
.field-value { padding: 8px 12px; font-size: 13px; color: #111; flex: 1; display: flex; align-items: center; }
.field-value.amount { font-size: 16px; font-weight: 900; color: #1a1a1a; }
.field-value.words { font-weight: 700; color: #1a1a1a; background: #fffbeb; }
.amount-badge { background: #1a1a1a; color: #fff; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-right: 8px; }
.cheque-footer { border-top: 2px dashed #d1d5db; margin: 6px 0 0; padding: 14px 20px 18px; display: flex; justify-content: space-between; }
.sign-box { text-align: center; }
.sign-line { width: 140px; border-top: 1px solid #1a1a1a; padding-top: 6px; font-size: 11px; color: #6b7280; margin-top: 36px; }
@media print { body { padding: 0; min-height: unset; } }
`;

export async function printReceiptVoucher(orderId: string) {
  const res = await fetch(`/api/admin/orders/${orderId}/invoice`);
  const data = await res.json();
  const { order, company } = data;

  const currency = company.currencyAr || "ريال";
  const amount = order.installmentType === "installment" ? order.downPayment : order.total;
  const productNames = order.items.map((i: { name: string }) => i.name).join("، ");
  const amountWords = toArabicWords(amount) + " فقط لا غير";
  const aboutText = `قيمة ${order.installmentType === "installment" ? "دفعة من " : ""}ثمن جهاز/أجهزة: ${productNames}`;

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"/><title>سند قبض - ${order.orderId}</title>
<style>${PRINT_STYLE}</style></head>
<body>
  <div class="cheque">
    <div class="cheque-header">
      <span class="title">سند قبض</span>
      <span class="no">No. #${order.orderId}</span>
    </div>
    <div class="cheque-body">
      <div class="field-row">
        <span class="field-label">المبلغ</span>
        <span class="field-value amount">${amount.toLocaleString("ar-SA")} <span class="amount-badge">${currency}</span></span>
      </div>
      <div class="field-row">
        <span class="field-label">استلمت من السيد</span>
        <span class="field-value">${order.customer}</span>
      </div>
      <div class="field-row">
        <span class="field-label">رقم الجوال</span>
        <span class="field-value">${order.whatsapp}</span>
      </div>
      <div class="field-row">
        <span class="field-label">العنوان</span>
        <span class="field-value">${order.address}</span>
      </div>
      <div class="field-row">
        <span class="field-label">وذلك عن</span>
        <span class="field-value">${aboutText}</span>
      </div>
      <div class="field-row">
        <span class="field-label">المبلغ بالحروف</span>
        <span class="field-value words">${amountWords} ${currency}</span>
      </div>
    </div>
    <div class="cheque-footer">
      <div class="sign-box"><div class="sign-line">الختم</div></div>
      <div class="sign-box"><div class="sign-line">توقيع المستلم</div></div>
    </div>
  </div>
</body></html>`;

  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  if (isMobile) {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `سند-قبض-${order.orderId}.html`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const win = window.open("", "_blank", "width=760,height=620");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 600);
}
