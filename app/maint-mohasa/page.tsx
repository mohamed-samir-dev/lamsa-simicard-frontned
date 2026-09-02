"use client";

import { useState, useEffect } from "react";

export default function MaintenanceControl() {
  const [authed, setAuthed] = useState(false);
  const [maintenance, setMaintenance] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/maintenance/status", { credentials: "include" }).then(async (r) => {
      if (r.ok) {
        const d = await r.json();
        setMaintenance(d.maintenance);
        setAuthed(true);
      }
    });
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginErr("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success) {
      // grant bypass cookie
      await fetch("/api/maintenance/bypass", { method: "POST", credentials: "include" });
      const s = await fetch("/api/maintenance/status", { credentials: "include" });
      if (s.ok) {
        const d = await s.json();
        setMaintenance(d.maintenance);
      }
      setAuthed(true);
    } else {
      setLoginErr(data.error || "بيانات غير صحيحة");
    }
    setLoginLoading(false);
  };

  const toggle = async () => {
    setToggleLoading(true);
    setMsg("");
    const res = await fetch("/api/maintenance/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !maintenance }),
      credentials: "include",
    });
    const data = await res.json();
    if (data.success) {
      setMaintenance(data.maintenance);
      setMsg(data.maintenance ? "✅ وضع الصيانة مفعّل" : "✅ الموقع شغّال الآن");
    } else {
      setMsg("❌ " + (data.error || "حدث خطأ"));
    }
    setToggleLoading(false);
  };

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-slate-900 text-white px-4">
      <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl">
        <h1 className="text-2xl font-bold mb-2">التحكم في الصيانة</h1>
        <p className="text-slate-400 text-sm mb-6">صفحة سرية للأدمن فقط</p>

        {!authed ? (
          <form onSubmit={login} className="space-y-3 text-right">
            <input
              type="email"
              placeholder="البريد الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-500"
            />
            <input
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-500"
            />
            {loginErr && <p className="text-red-400 text-sm">{loginErr}</p>}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all"
            >
              {loginLoading ? "جاري..." : "دخول"}
            </button>
          </form>
        ) : (
          <>
            <div className="mb-6">
              <span className="text-sm text-slate-400">الحالة الحالية:</span>
              <div className="mt-2">
                {maintenance === null ? (
                  <span className="text-slate-500">جاري التحميل...</span>
                ) : maintenance ? (
                  <span className="bg-red-500/20 text-red-400 px-4 py-1 rounded-full text-sm font-medium">
                    🔴 الموقع تحت الصيانة
                  </span>
                ) : (
                  <span className="bg-green-500/20 text-green-400 px-4 py-1 rounded-full text-sm font-medium">
                    🟢 الموقع شغّال
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={toggle}
              disabled={toggleLoading || maintenance === null}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                maintenance ? "bg-green-600 hover:bg-green-500" : "bg-red-600 hover:bg-red-500"
              } disabled:opacity-50`}
            >
              {toggleLoading ? "جاري..." : maintenance ? "تشغيل الموقع" : "تفعيل الصيانة"}
            </button>

            {msg && <p className="mt-4 text-sm text-slate-300">{msg}</p>}

            <p className="mt-6 text-xs text-slate-500">
              أنت تتصفح الموقع بشكل طبيعي حتى لو الصيانة مفعّلة
            </p>
          </>
        )}
      </div>
    </div>
  );
}
