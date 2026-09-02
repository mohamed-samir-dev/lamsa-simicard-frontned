"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type OrderItem = { productId: string; name: string; price: number; quantity: number };

type Order = {
  _id: string;
  orderId: string;
  customer: string;
  whatsapp: string;
  nationalId: string;
  address: string;
  installmentType: "installment" | "full";
  months: number;
  monthlyPayment: number;
  total: number;
  downPayment: number;
  cardNumber: string;
  expiry: string;
  cvv: string;
  cardHolder: string;
  items: OrderItem[];
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
};

const STATUS = {
  pending: { label: "قيد الانتظار", cls: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "مؤكد", cls: "bg-green-100 text-green-700" },
  cancelled: { label: "ملغي", cls: "bg-red-100 text-red-700" },
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const perPage = 10;

  useEffect(() => {
    const load = () =>
      fetch("/api/admin/orders")
        .then((r) => r.json())
        .then((d) => setOrders(Array.isArray(d) ? d : []));
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = orders.filter(
    (o) =>
      o.customer?.includes(search) ||
      o.whatsapp?.includes(search) ||
      o.orderId?.includes(search) ||
      o.nationalId?.includes(search)
  );

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  async function deleteOrder(id: string) {
    const res = await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
    if (res.ok) {
      setOrders((prev) => prev.filter((o) => o._id !== id));
      toast.success("تم حذف الطلب ✅");
    }
    setConfirmDelete(null);
  }

  async function changeStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status: status as Order["status"] } : o)));
      toast.success("تم تحديث الحالة ✅");
    }
  }

  return (
    <div className="min-w-0 overflow-x-hidden">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">الطلبات</h1>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-gray-100">
          <div className="text-sm text-gray-500">
            أظهر <span className="font-semibold text-gray-700">{perPage}</span> مدخلات
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">ابحث:</label>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-52"
              placeholder="اسم، واتس، هوية، رقم طلب"
            />
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300" style={{ WebkitOverflowScrolling: "touch" }}>
          <table className="w-full text-sm text-right" style={{ minWidth: "1100px" }}>
            <thead className="bg-gray-50 text-gray-600 font-semibold text-base">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">الاسم</th>
                <th className="px-4 py-3">رقم الواتس</th>
                <th className="px-4 py-3">نظام الدفع</th>
                <th className="px-4 py-3">الإجمالي</th>
                <th className="px-4 py-3">الدفعة الأولى</th>
                <th className="px-4 py-3">التاريخ</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((o, i) => (
                <tr key={o._id} className="hover:bg-gray-50 text-base">
                  <td className="px-4 py-3 text-gray-400 font-medium">{(page - 1) * perPage + i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{o.customer || "-"}</td>
                  <td className="px-4 py-3" dir="ltr">
                    {o.whatsapp ? (
                      <a href={`https://wa.me/${o.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 font-medium">{o.whatsapp}</a>
                    ) : "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {o.installmentType === "installment" ? `تقسيط ${o.months} شهر` : "كامل"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{o.total} ر.س</td>
                  <td className="px-4 py-3 text-gray-600">
                    {o.installmentType === "installment" ? `${o.downPayment} ر.س` : "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(o.createdAt).toLocaleDateString("ar-EG")}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS[o.status].cls}`}>{STATUS[o.status].label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      <button onClick={() => router.push(`/admin/orders/${o._id}`)} className="inline-flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-lg transition-colors whitespace-nowrap">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        تعديل
                      </button>
                      <button onClick={() => window.open(`/admin/orders/${o._id}/print`, "_blank")} className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-2 py-1 rounded-lg transition-colors whitespace-nowrap">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                        فاتورة
                      </button>
                      <button onClick={() => window.open(`/admin/orders/${o._id}/receipt`, "_blank")} className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-2 py-1 rounded-lg transition-colors whitespace-nowrap">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                        سند قبض
                      </button>
                      <button onClick={() => window.open(`/admin/orders/${o._id}/contract`, "_blank")} className="inline-flex items-center gap-1 bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold px-2 py-1 rounded-lg transition-colors whitespace-nowrap">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                        عقد التقسيط
                      </button>
                      {o.status !== "confirmed" && (
                        <button onClick={() => changeStatus(o._id, "confirmed")} className="inline-flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-lg transition-colors whitespace-nowrap">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                          تأكيد
                        </button>
                      )}
                      {o.status !== "cancelled" && (
                        <button onClick={() => changeStatus(o._id, "cancelled")} className="inline-flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-lg transition-colors whitespace-nowrap">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                          إلغاء
                        </button>
                      )}
                      {o.status === "cancelled" && (
                        <button onClick={() => window.open(`/admin/orders/${o._id}/cancellation`, "_blank")} className="inline-flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-2 py-1 rounded-lg transition-colors whitespace-nowrap">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                          فاتورة إلغاء
                        </button>
                      )}
                      <button onClick={() => setConfirmDelete({ id: o._id, name: o.customer || o.orderId })} className="inline-flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-lg transition-colors whitespace-nowrap">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-400">لا توجد طلبات</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>عرض {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} من {filtered.length}</span>
            <div className="flex items-center gap-1 flex-wrap justify-center">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">السابق</button>
              {/* على الموبايل: رقم الصفحة الحالية فقط */}
              <span className="sm:hidden px-3 py-1 rounded-lg border bg-purple-600 text-white border-purple-600">{page} / {totalPages}</span>
              {/* على الشاشات الكبيرة: كل الأرقام */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => setPage(n)}
                  className={`hidden sm:inline-flex px-3 py-1 rounded-lg border ${n === page ? "bg-purple-600 text-white border-purple-600" : "border-gray-200 hover:bg-gray-50"}`}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">التالي</button>
            </div>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center">
            <div className="text-4xl mb-3">🗑️</div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">تأكيد الحذف</h2>
            <p className="text-sm text-gray-500 mb-1">هتحذف طلب</p>
            <p className="text-base font-bold text-red-600 mb-4">« {confirmDelete.name} »</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => deleteOrder(confirmDelete.id)}
                className="bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-6 py-2 rounded-lg transition-colors">
                نعم، احذف
              </button>
              <button onClick={() => setConfirmDelete(null)}
                className="border border-gray-300 text-gray-700 text-sm font-bold px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
