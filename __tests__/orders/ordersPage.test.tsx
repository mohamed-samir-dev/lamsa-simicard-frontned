/**
 * Tests: /admin/orders page — UI + Buttons
 * يتحقق من:
 * - الصفحة تعرض skeleton أثناء التحميل
 * - الصفحة تعرض الطلبات بعد التحميل
 * - زر تعديل يفتح صفحة التفاصيل
 * - زر تأكيد يستدعي PUT بالـ status الصحيح
 * - زر إلغاء يستدعي PUT بالـ status الصحيح
 * - زر حذف يفتح modal التأكيد
 * - modal الحذف: زر "نعم احذف" يستدعي DELETE
 * - modal الحذف: زر "إلغاء" يغلق الـ modal
 * - search input يُرسل query للـ API بعد debounce
 * - filter الحالة يُرسل status للـ API
 * - زر مسح الفلاتر يظهر عند وجود فلتر ويعمل
 * - عرض رسالة خطأ عند فشل الـ API
 * - عرض "لا توجد طلبات" عند قائمة فارغة
 * - أزرار الـ pagination تعمل
 * - زر تحديث يعيد جلب البيانات
 * - أزرار الطباعة تفتح نافذة جديدة
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act, within } from "@testing-library/react";

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush, back: jest.fn() }),
  useParams: () => ({ id: "aaa111" }),
  usePathname: () => "/admin/orders",
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
  Toaster: () => null,
}));

jest.mock("lucide-react", () => {
  const icon = (name: string) =>
    function MockIcon() {
      return React.createElement("span", { "data-testid": `icon-${name}` });
    };
  return {
    Eye: icon("eye"), Printer: icon("printer"), CreditCard: icon("credit-card"),
    FileText: icon("file-text"), CheckCircle: icon("check-circle"), XCircle: icon("x-circle"),
    FileX: icon("file-x"), Trash2: icon("trash2"), ChevronLeft: icon("chevron-left"),
    ChevronRight: icon("chevron-right"), Search: icon("search"), RefreshCw: icon("refresh-cw"),
  };
});

const mockRouterPush = jest.fn();
const mockFetch = jest.fn();
global.fetch = mockFetch;
window.open = jest.fn();

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeOrder(overrides = {}) {
  return {
    _id: "aaa111",
    orderId: "ORD-001",
    customer: "أحمد محمد",
    whatsapp: "0501234567",
    nationalId: "1234567890",
    address: "الرياض",
    installmentType: "installment",
    months: 6,
    monthlyPayment: 200,
    total: 1500,
    downPayment: 300,
    cardNumber: "4111111111111111",
    expiry: "12/26",
    cvv: "123",
    cardHolder: "Ahmed",
    items: [{ productId: "p1", name: "جهاز A", price: 1000, quantity: 1 }],
    status: "pending",
    createdAt: "2024-01-15T10:00:00.000Z",
    ...overrides,
  };
}

function makeResponse(orders = [makeOrder()], extra = {}) {
  return {
    orders,
    total: orders.length,
    page: 1,
    limit: 20,
    totalPages: 1,
    ...extra,
  };
}

function mockSuccess(data: object) {
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => data,
  });
}

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockFetch.mockReset();
  mockRouterPush.mockReset();
  (window.open as jest.Mock).mockReset();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// ── Import component بعد الـ mocks ───────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-var-requires
const OrdersPage = () => require("../../app/admin/orders/page").default;

// ── Tests ────────────────────────────────────────────────────────────────────

describe("OrdersPage — التحميل الأولي", () => {
  it("يعرض skeleton أثناء التحميل", async () => {
    mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
    const Page = OrdersPage();
    render(React.createElement(Page));
    expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("يعرض الطلبات بعد التحميل", async () => {
    mockSuccess(makeResponse());
    const Page = OrdersPage();
    await act(async () => { render(React.createElement(Page)); });
    await waitFor(() => expect(screen.getByText("أحمد محمد")).toBeInTheDocument());
  });

  it("يعرض رسالة لا توجد طلبات عند قائمة فارغة", async () => {
    mockSuccess(makeResponse([]));
    const Page = OrdersPage();
    await act(async () => { render(React.createElement(Page)); });
    await waitFor(() => expect(screen.getByText("لا توجد طلبات")).toBeInTheDocument());
  });

  it("يعرض رسالة خطأ عند فشل الـ API", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    const Page = OrdersPage();
    await act(async () => { render(React.createElement(Page)); });
    await waitFor(() =>
      expect(screen.getByText(/تعذّر تحميل الطلبات/)).toBeInTheDocument()
    );
  });

  it("يعرض عدد الطلبات في العنوان", async () => {
    mockSuccess(makeResponse([makeOrder()], { total: 42 }));
    const Page = OrdersPage();
    await act(async () => { render(React.createElement(Page)); });
    await waitFor(() => expect(screen.getByText(/42/)).toBeInTheDocument());
  });
});

describe("OrdersPage — الأزرار", () => {
  async function renderWithOrder(orderOverrides = {}) {
    mockSuccess(makeResponse([makeOrder(orderOverrides)]));
    const Page = OrdersPage();
    await act(async () => { render(React.createElement(Page)); });
    await waitFor(() => screen.getByText("أحمد محمد"));
  }

  it("زر تعديل يفتح صفحة التفاصيل", async () => {
    await renderWithOrder();
    fireEvent.click(screen.getByText("تعديل"));
    expect(mockRouterPush).toHaveBeenCalledWith("/admin/orders/aaa111");
  });

  it("زر فاتورة يفتح نافذة print", async () => {
    await renderWithOrder();
    fireEvent.click(screen.getByText("فاتورة"));
    expect(window.open).toHaveBeenCalledWith("/admin/orders/aaa111/print", "_blank");
  });

  it("زر سند قبض يفتح نافذة receipt", async () => {
    await renderWithOrder();
    fireEvent.click(screen.getByText("سند قبض"));
    expect(window.open).toHaveBeenCalledWith("/admin/orders/aaa111/receipt", "_blank");
  });

  it("زر عقد التقسيط يفتح نافذة contract", async () => {
    await renderWithOrder();
    fireEvent.click(screen.getByText("عقد التقسيط"));
    expect(window.open).toHaveBeenCalledWith("/admin/orders/aaa111/contract", "_blank");
  });

  it("زر تأكيد يستدعي PUT بـ status confirmed", async () => {
    await renderWithOrder({ status: "pending" });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ...makeOrder(), status: "confirmed" }),
    });
    fireEvent.click(screen.getByText("تأكيد"));
    await waitFor(() => {
      const calls = mockFetch.mock.calls;
      const putCall = calls.find(
        (c) => c[1]?.method === "PUT" && (c[1]?.body as string)?.includes("confirmed")
      );
      expect(putCall).toBeDefined();
    });
  });

  it("زر تأكيد لا يظهر إذا كان الطلب مؤكداً", async () => {
    await renderWithOrder({ status: "confirmed" });
    expect(screen.queryByText("تأكيد")).not.toBeInTheDocument();
  });

  it("زر إلغاء يستدعي PUT بـ status cancelled", async () => {
    await renderWithOrder({ status: "pending" });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ...makeOrder(), status: "cancelled" }),
    });
    fireEvent.click(screen.getByText("إلغاء"));
    await waitFor(() => {
      const calls = mockFetch.mock.calls;
      const putCall = calls.find(
        (c) => c[1]?.method === "PUT" && (c[1]?.body as string)?.includes("cancelled")
      );
      expect(putCall).toBeDefined();
    });
  });

  it("زر إلغاء لا يظهر إذا كان الطلب ملغياً", async () => {
    await renderWithOrder({ status: "cancelled" });
    expect(screen.queryByText("إلغاء")).not.toBeInTheDocument();
  });

  it("زر فاتورة إلغاء يظهر فقط للطلبات الملغية", async () => {
    await renderWithOrder({ status: "cancelled" });
    expect(screen.getByText("فاتورة إلغاء")).toBeInTheDocument();
    fireEvent.click(screen.getByText("فاتورة إلغاء"));
    expect(window.open).toHaveBeenCalledWith("/admin/orders/aaa111/cancellation", "_blank");
  });

  it("زر فاتورة إلغاء لا يظهر للطلبات غير الملغية", async () => {
    await renderWithOrder({ status: "pending" });
    expect(screen.queryByText("فاتورة إلغاء")).not.toBeInTheDocument();
  });

  it("زر تأكيد يُعطَّل أثناء الـ loading", async () => {
    await renderWithOrder({ status: "pending" });
    mockFetch.mockReturnValueOnce(new Promise(() => {}));
    const btn = screen.getByText("تأكيد");
    fireEvent.click(btn);
    expect(btn.closest("button")).toBeDisabled();
  });
});

describe("OrdersPage — modal الحذف", () => {
  async function renderWithOrder() {
    mockSuccess(makeResponse());
    const Page = OrdersPage();
    await act(async () => { render(React.createElement(Page)); });
    await waitFor(() => screen.getByText("أحمد محمد"));
  }

  it("زر حذف يفتح modal التأكيد", async () => {
    await renderWithOrder();
    fireEvent.click(screen.getByText("حذف"));
    expect(screen.getByText("تأكيد الحذف")).toBeInTheDocument();
    expect(screen.getByText(/أحمد محمد/)).toBeInTheDocument();
  });

  it("زر إلغاء في الـ modal يغلقه", async () => {
    await renderWithOrder();
    fireEvent.click(screen.getByText("حذف"));
    expect(screen.getByText("تأكيد الحذف")).toBeInTheDocument();
    const modal = screen.getByText("تأكيد الحذف").closest("div")!.parentElement!;
    fireEvent.click(within(modal).getByText("إلغاء"));
    await waitFor(() =>
      expect(screen.queryByText("تأكيد الحذف")).not.toBeInTheDocument()
    );
  });

  it("زر نعم احذف يستدعي DELETE ويزيل الطلب", async () => {
    await renderWithOrder();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    fireEvent.click(screen.getByText("حذف"));
    fireEvent.click(screen.getByText("نعم، احذف"));
    await waitFor(() => {
      const deleteCalls = mockFetch.mock.calls.filter(
        (c) => c[1]?.method === "DELETE"
      );
      expect(deleteCalls.length).toBeGreaterThan(0);
    });
    await waitFor(() =>
      expect(screen.queryByText("أحمد محمد")).not.toBeInTheDocument()
    );
  });

  it("زر نعم احذف يُعطَّل أثناء الـ loading", async () => {
    await renderWithOrder();
    mockFetch.mockReturnValueOnce(new Promise(() => {}));
    fireEvent.click(screen.getByText("حذف"));
    const confirmBtn = screen.getByText("نعم، احذف");
    fireEvent.click(confirmBtn);
    expect(confirmBtn.closest("button")).toBeDisabled();
  });
});

describe("OrdersPage — Search وFilters", () => {
  it("search input يُرسل query للـ API بعد debounce", async () => {
    mockSuccess(makeResponse());
    const Page = OrdersPage();
    await act(async () => { render(React.createElement(Page)); });
    await waitFor(() => screen.getByPlaceholderText(/اسم/));

    mockFetch.mockReset();
    mockSuccess(makeResponse([]));

    const input = screen.getByPlaceholderText(/اسم/);
    await userEvent.type(input, "أحمد");

    // قبل debounce لا يُرسل request
    expect(mockFetch).not.toHaveBeenCalled();

    // بعد debounce 400ms
    act(() => { jest.advanceTimersByTime(400); });
    await waitFor(() => {
      const url = mockFetch.mock.calls[0]?.[0] as string;
      expect(url).toContain("search=");
    });
  });

  it("filter الحالة يُرسل status للـ API فوراً", async () => {
    mockSuccess(makeResponse());
    const Page = OrdersPage();
    await act(async () => { render(React.createElement(Page)); });
    await waitFor(() => screen.getByText("أحمد محمد"));

    mockFetch.mockReset();
    mockSuccess(makeResponse([]));

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "pending" } });

    await waitFor(() => {
      const url = mockFetch.mock.calls[0]?.[0] as string;
      expect(url).toContain("status=pending");
    });
  });

  it("زر مسح الفلاتر يظهر عند وجود فلتر", async () => {
    mockSuccess(makeResponse());
    const Page = OrdersPage();
    await act(async () => { render(React.createElement(Page)); });
    await waitFor(() => screen.getByText("أحمد محمد"));

    expect(screen.queryByText("مسح الفلاتر")).not.toBeInTheDocument();

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "pending" } });

    await waitFor(() =>
      expect(screen.getByText("مسح الفلاتر")).toBeInTheDocument()
    );
  });

  it("زر مسح الفلاتر يعيد ضبط كل الفلاتر", async () => {
    mockSuccess(makeResponse());
    const Page = OrdersPage();
    await act(async () => { render(React.createElement(Page)); });
    await waitFor(() => screen.getByText("أحمد محمد"));

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "pending" } });
    await waitFor(() => screen.getByText("مسح الفلاتر"));

    mockFetch.mockReset();
    mockSuccess(makeResponse());
    fireEvent.click(screen.getByText("مسح الفلاتر"));

    await waitFor(() => {
      const url = mockFetch.mock.calls[0]?.[0] as string;
      expect(url).not.toContain("status=");
    });
    expect(screen.queryByText("مسح الفلاتر")).not.toBeInTheDocument();
  });
});

describe("OrdersPage — Pagination", () => {
  it("يعرض pagination عند وجود أكثر من صفحة", async () => {
    mockSuccess(makeResponse([makeOrder()], { total: 50, totalPages: 3 }));
    const Page = OrdersPage();
    await act(async () => { render(React.createElement(Page)); });
    await waitFor(() => screen.getByText("أحمد محمد"));
    expect(screen.getByText("السابق") || screen.getByTestId("icon-chevron-right")).toBeTruthy();
  });

  it("لا يعرض pagination عند صفحة واحدة", async () => {
    mockSuccess(makeResponse([makeOrder()], { total: 5, totalPages: 1 }));
    const Page = OrdersPage();
    await act(async () => { render(React.createElement(Page)); });
    await waitFor(() => screen.getByText("أحمد محمد"));
    expect(screen.queryByTestId("icon-chevron-right")).not.toBeInTheDocument();
  });
});

describe("OrdersPage — زر تحديث", () => {
  it("زر تحديث يعيد جلب البيانات", async () => {
    mockSuccess(makeResponse());
    const Page = OrdersPage();
    await act(async () => { render(React.createElement(Page)); });
    await waitFor(() => screen.getByText("أحمد محمد"));

    const callsBefore = mockFetch.mock.calls.length;
    mockSuccess(makeResponse());
    fireEvent.click(screen.getByText("تحديث"));

    await waitFor(() =>
      expect(mockFetch.mock.calls.length).toBeGreaterThan(callsBefore)
    );
  });
});

describe("OrdersPage — Sorting", () => {
  it("الضغط على عمود الاسم يُرسل sortField=customer", async () => {
    mockSuccess(makeResponse());
    const Page = OrdersPage();
    await act(async () => { render(React.createElement(Page)); });
    await waitFor(() => screen.getByText("أحمد محمد"));

    mockFetch.mockReset();
    mockSuccess(makeResponse());
    fireEvent.click(screen.getByText(/الاسم/));

    await waitFor(() => {
      const url = mockFetch.mock.calls[0]?.[0] as string;
      expect(url).toContain("sortField=customer");
    });
  });

  it("الضغط على عمود الإجمالي يُرسل sortField=total", async () => {
    mockSuccess(makeResponse());
    const Page = OrdersPage();
    await act(async () => { render(React.createElement(Page)); });
    await waitFor(() => screen.getByText("أحمد محمد"));

    mockFetch.mockReset();
    mockSuccess(makeResponse());
    fireEvent.click(screen.getByText(/الإجمالي/));

    await waitFor(() => {
      const url = mockFetch.mock.calls[0]?.[0] as string;
      expect(url).toContain("sortField=total");
    });
  });
});
