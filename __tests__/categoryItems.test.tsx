/**
 * Tests: /admin/category-items page + related API routes
 *
 * يغطي:
 * - تحميل الصفحة بنجاح (3 طلبات متوازية)
 * - دمج max مع settings في طلب واحد
 * - عرض الجدول بالبيانات الصحيحة
 * - حالة loading وحالة error
 * - حفظ الـ max
 * - رفع الصورة (upload image)
 * - memory leak: revokeObjectURL
 * - Next.js API routes: settings, settings/max, public, image
 * - التأثير على صفحات أخرى: sub-categories/public تُستخدم في الـ storefront
 */

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      _data: data,
      _status: init?.status ?? 200,
      json: async () => data,
      status: init?.status ?? 200,
    }),
  },
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/admin/category-items",
}));

// Mock apiFetch مباشرة بدل global.fetch للـ component tests
const mockApiFetch = jest.fn();
jest.mock("../../app/lib/api", () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

// global.fetch للـ API route tests
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock URL.createObjectURL / revokeObjectURL
const mockCreateObjectURL = jest.fn(() => "blob:mock-url");
const mockRevokeObjectURL = jest.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import React from "react";
import toast from "react-hot-toast";
import CategoryItemsPage from "../../app/admin/category-items/page";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockSubCats = [
  { category: "شرائح STC", name: "شرائح STC", count: 5 },
  { category: "شرائح زين", name: "شرائح زين", count: 3 },
];

const mockSettings = {
  settings: [
    { category: "شرائح STC", subCategory: "شرائح STC", showInHome: true, order: 1 },
    { category: "شرائح زين", subCategory: "شرائح زين", showInHome: true, order: 2 },
    { category: "مخفي", subCategory: "مخفي", showInHome: false, order: 3 },
  ],
  max: 4,
};

const mockPublicCats = [
  { name: "شرائح STC", count: 5, image: "https://cdn.example.com/stc.jpg" },
  { name: "شرائح زين", count: 3, image: "https://cdn.example.com/zain.jpg" },
];

function setupSuccessMocks() {
  mockApiFetch
    .mockResolvedValueOnce({ ok: true, json: async () => mockSubCats })
    .mockResolvedValueOnce({ ok: true, json: async () => mockSettings })
    .mockResolvedValueOnce({ ok: true, json: async () => mockPublicCats });
}

function makeRequest(
  url: string,
  options: { method?: string; body?: string | FormData; headers?: Record<string, string> } = {}
) {
  return {
    url,
    nextUrl: new URL(url, "http://localhost:3000"),
    method: options.method ?? "GET",
    headers: { get: (k: string) => (options.headers ?? {})[k] ?? null },
    json: async () => JSON.parse((options.body as string) ?? "{}"),
    formData: async () => options.body as FormData,
  };
}

// ─── Page Component Tests ─────────────────────────────────────────────────────

describe("CategoryItemsPage — تحميل البيانات", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
    (toast.error as jest.Mock).mockReset();
    (toast.success as jest.Mock).mockReset();
  });

  it("يعرض حالة loading أثناء جلب البيانات", () => {
    mockApiFetch.mockImplementation(() => new Promise(() => {}));
    render(<CategoryItemsPage />);
    expect(screen.getByText("جاري التحميل...")).toBeInTheDocument();
  });

  it("يعرض البيانات بعد نجاح التحميل", async () => {
    setupSuccessMocks();
    render(<CategoryItemsPage />);

    await waitFor(() => {
      expect(screen.getAllByText("شرائح STC").length).toBeGreaterThan(0);
      expect(screen.getAllByText("شرائح زين").length).toBeGreaterThan(0);
    });
    expect(screen.queryByText("جاري التحميل...")).not.toBeInTheDocument();
  });

  it("يعرض رسالة خطأ عند فشل التحميل", async () => {
    mockApiFetch.mockRejectedValue(new Error("Network Error"));
    render(<CategoryItemsPage />);

    await waitFor(() => {
      expect(screen.getByText("فشل تحميل البيانات")).toBeInTheDocument();
    });
    expect(toast.error).toHaveBeenCalledWith("فشل تحميل البيانات، حاول مجدداً");
  });

  it("يعرض رسالة عند عدم وجود تصنيفات مفعّلة", async () => {
    mockApiFetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ settings: [], max: 4 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(<CategoryItemsPage />);

    await waitFor(() => {
      expect(screen.getByText("لا توجد تصنيفات معروضة في الرئيسية")).toBeInTheDocument();
    });
  });

  it("يُرسل 3 طلبات فقط (وليس 4 بعد دمج max مع settings)", async () => {
    setupSuccessMocks();
    render(<CategoryItemsPage />);
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalledTimes(3));
  });

  it("يقرأ الـ max من settings response مباشرة", async () => {
    mockApiFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockSubCats })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ settings: mockSettings.settings, max: 7 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => mockPublicCats });

    render(<CategoryItemsPage />);

    await waitFor(() => {
      const input = screen.getByRole("spinbutton") as HTMLInputElement;
      expect(input.value).toBe("7");
    });
  });

  it("يتعامل مع settings بدون max (backward compat)", async () => {
    mockApiFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockSubCats })
      .mockResolvedValueOnce({ ok: true, json: async () => mockSettings.settings }) // array قديم
      .mockResolvedValueOnce({ ok: true, json: async () => mockPublicCats });

    render(<CategoryItemsPage />);

    await waitFor(() => {
      const input = screen.getByRole("spinbutton") as HTMLInputElement;
      expect(input.value).toBe("4"); // default
    });
  });

  it("يعرض فقط التصنيفات التي showInHome=true", async () => {
    setupSuccessMocks();
    render(<CategoryItemsPage />);

    await waitFor(() => {
      expect(screen.getAllByText("شرائح STC").length).toBeGreaterThan(0);
      expect(screen.getAllByText("شرائح زين").length).toBeGreaterThan(0);
      // "مخفي" showInHome=false لا يجب أن يظهر في الجدول
      expect(screen.queryByText("مخفي")).not.toBeInTheDocument();
    });
  });
});

// ─── Max Control Tests ────────────────────────────────────────────────────────

describe("CategoryItemsPage — حفظ الـ max", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
    (toast.error as jest.Mock).mockReset();
    (toast.success as jest.Mock).mockReset();
  });

  it("يحفظ الـ max عند الضغط على حفظ", async () => {
    setupSuccessMocks();
    mockApiFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ max: 6 }) });

    render(<CategoryItemsPage />);
    await waitFor(() => expect(screen.queryByText("جاري التحميل...")).not.toBeInTheDocument());

    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "6" } });

    await act(async () => { fireEvent.click(screen.getByText("حفظ")); });

    expect(mockApiFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/admin/sub-categories/settings/max"),
      expect.objectContaining({ method: "PATCH" })
    );
    expect(toast.success).toHaveBeenCalledWith("تم تحديث الحد إلى 6 ✅");
  });

  it("يُظهر خطأ عند فشل حفظ الـ max", async () => {
    setupSuccessMocks();
    mockApiFetch.mockResolvedValueOnce({ ok: false });

    render(<CategoryItemsPage />);
    await waitFor(() => expect(screen.queryByText("جاري التحميل...")).not.toBeInTheDocument());

    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "6" } });

    await act(async () => { fireEvent.click(screen.getByText("حفظ")); });
    expect(toast.error).toHaveBeenCalledWith("حدث خطأ");
  });

  it("يُصحح القيمة إلى 1 عند إدخال 0", async () => {
    setupSuccessMocks();
    render(<CategoryItemsPage />);
    await waitFor(() => expect(screen.queryByText("جاري التحميل...")).not.toBeInTheDocument());

    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "0" } });
    expect(input.value).toBe("1");
  });

  it("زر الحفظ معطّل عندما maxInput === max", async () => {
    setupSuccessMocks();
    render(<CategoryItemsPage />);
    await waitFor(() => expect(screen.queryByText("جاري التحميل...")).not.toBeInTheDocument());

    expect(screen.getByText("حفظ")).toBeDisabled();
  });

  it("زر الحفظ يصبح مفعّلاً عند تغيير القيمة", async () => {
    setupSuccessMocks();
    render(<CategoryItemsPage />);
    await waitFor(() => expect(screen.queryByText("جاري التحميل...")).not.toBeInTheDocument());

    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "8" } });
    expect(screen.getByText("حفظ")).not.toBeDisabled();
  });
});

// ─── Image Upload Tests ───────────────────────────────────────────────────────

describe("CategoryItemsPage — رفع الصورة", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
    mockCreateObjectURL.mockReset();
    mockRevokeObjectURL.mockReset();
    mockCreateObjectURL.mockReturnValue("blob:mock-url");
    (toast.error as jest.Mock).mockReset();
    (toast.success as jest.Mock).mockReset();
  });

  it("يعرض select التصنيفات بعد التحميل", async () => {
    setupSuccessMocks();
    render(<CategoryItemsPage />);
    await waitFor(() => expect(screen.queryByText("جاري التحميل...")).not.toBeInTheDocument());

    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThan(0);
  });

  it("يُنشئ object URL عند اختيار ملف", async () => {
    setupSuccessMocks();
    render(<CategoryItemsPage />);
    await waitFor(() => expect(screen.queryByText("جاري التحميل...")).not.toBeInTheDocument());

    const select = screen.getAllByRole("combobox")[0];
    fireEvent.change(select, { target: { value: "شرائح STC" } });

    const fileInput = document.querySelector("input[type='file']") as HTMLInputElement;
    const file = new File(["img"], "test.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(mockCreateObjectURL).toHaveBeenCalledWith(file);
  });

  it("يُلغي object URL القديم عند اختيار ملف جديد", async () => {
    setupSuccessMocks();
    render(<CategoryItemsPage />);
    await waitFor(() => expect(screen.queryByText("جاري التحميل...")).not.toBeInTheDocument());

    const select = screen.getAllByRole("combobox")[0];
    fireEvent.change(select, { target: { value: "شرائح STC" } });

    const fileInput = document.querySelector("input[type='file']") as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(["img1"], "t1.jpg", { type: "image/jpeg" })] } });
    fireEvent.change(fileInput, { target: { files: [new File(["img2"], "t2.jpg", { type: "image/jpeg" })] } });

    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("يرفع الصورة بنجاح ويُحدِّث الـ state", async () => {
    setupSuccessMocks();
    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: "https://cdn.example.com/new.jpg" }),
    });

    render(<CategoryItemsPage />);
    await waitFor(() => expect(screen.queryByText("جاري التحميل...")).not.toBeInTheDocument());

    const select = screen.getAllByRole("combobox")[0];
    fireEvent.change(select, { target: { value: "شرائح STC" } });

    const fileInput = document.querySelector("input[type='file']") as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(["img"], "t.jpg", { type: "image/jpeg" })] } });

    await act(async () => { fireEvent.click(screen.getByText("رفع الصورة")); });

    expect(toast.success).toHaveBeenCalledWith("تم رفع الصورة بنجاح ✅");
    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });

  it("يُظهر خطأ عند فشل رفع الصورة", async () => {
    setupSuccessMocks();
    mockApiFetch.mockResolvedValueOnce({ ok: false });

    render(<CategoryItemsPage />);
    await waitFor(() => expect(screen.queryByText("جاري التحميل...")).not.toBeInTheDocument());

    const select = screen.getAllByRole("combobox")[0];
    fireEvent.change(select, { target: { value: "شرائح STC" } });

    const fileInput = document.querySelector("input[type='file']") as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(["img"], "t.jpg", { type: "image/jpeg" })] } });

    await act(async () => { fireEvent.click(screen.getByText("رفع الصورة")); });
    expect(toast.error).toHaveBeenCalledWith("حدث خطأ أثناء الرفع");
  });

  it("زر رفع الصورة معطّل قبل اختيار ملف", async () => {
    setupSuccessMocks();
    render(<CategoryItemsPage />);
    await waitFor(() => expect(screen.queryByText("جاري التحميل...")).not.toBeInTheDocument());

    const select = screen.getAllByRole("combobox")[0];
    fireEvent.change(select, { target: { value: "شرائح STC" } });

    expect(screen.getByText("رفع الصورة")).toBeDisabled();
  });
});

// ─── Next.js API Routes Tests ─────────────────────────────────────────────────

describe("GET /api/admin/sub-categories/settings — يُرجع settings + max معاً", () => {
  beforeEach(() => { mockFetch.mockReset(); jest.resetModules(); });

  it("يمرر الـ cookies ويُرجع البيانات", async () => {
    const fakeData = { settings: mockSettings.settings, max: 4 };
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => fakeData });

    const { GET } = require("../../app/api/admin/sub-categories/settings/route");
    const req = makeRequest("/api/admin/sub-categories/settings", {
      headers: { cookie: "admin_token=abc123" },
    });
    const res = await GET(req);

    expect(res._data).toEqual(fakeData);
    const calledInit = mockFetch.mock.calls[0][1] as RequestInit;
    expect((calledInit.headers as Record<string, string>).cookie).toBe("admin_token=abc123");
  });

  it("يُرجع status الباك إند عند الخطأ", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ error: "غير مصرح" }) });
    const { GET } = require("../../app/api/admin/sub-categories/settings/route");
    const res = await GET(makeRequest("/api/admin/sub-categories/settings"));
    expect(res._status).toBe(401);
  });
});

describe("GET /api/admin/sub-categories/settings/max", () => {
  beforeEach(() => { mockFetch.mockReset(); jest.resetModules(); });

  it("يُرجع الـ max من الباك إند", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ max: 6 }) });
    const { GET } = require("../../app/api/admin/sub-categories/settings/max/route");
    const res = await GET(makeRequest("/api/admin/sub-categories/settings/max"));
    expect(res._data).toEqual({ max: 6 });
  });

  it("PATCH يمرر الـ body والـ cookies", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ max: 8 }) });
    const { PATCH } = require("../../app/api/admin/sub-categories/settings/max/route");
    const req = makeRequest("/api/admin/sub-categories/settings/max", {
      method: "PATCH",
      body: JSON.stringify({ max: 8 }),
      headers: { cookie: "admin_token=abc123" },
    });
    const res = await PATCH(req);
    expect(res._data).toEqual({ max: 8 });
    const calledInit = mockFetch.mock.calls[0][1] as RequestInit;
    expect((calledInit as { method: string }).method).toBe("PATCH");
  });
});

describe("GET /api/admin/sub-categories/public", () => {
  beforeEach(() => { mockFetch.mockReset(); jest.resetModules(); });

  it("يُرجع التصنيفات العامة بدون auth", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockPublicCats });
    const { GET } = require("../../app/api/admin/sub-categories/public/route");
    const res = await GET();
    expect(res._data).toEqual(mockPublicCats);
    const calledInit = mockFetch.mock.calls[0][1] as RequestInit;
    expect(calledInit).toEqual({ cache: "no-store" });
  });
});

describe("POST /api/admin/sub-categories/settings/image", () => {
  beforeEach(() => { mockFetch.mockReset(); jest.resetModules(); });

  it("يمرر الـ FormData والـ cookies للباك إند", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ url: "https://cdn.example.com/img.jpg" }),
    });

    const { POST } = require("../../app/api/admin/sub-categories/settings/image/route");
    const fd = new FormData();
    fd.append("category", "شرائح STC");
    fd.append("image", new Blob(["img"]), "test.jpg");

    const req = makeRequest("/api/admin/sub-categories/settings/image", {
      method: "POST",
      body: fd,
      headers: { cookie: "admin_token=abc123" },
    });
    const res = await POST(req);

    expect(res._data).toEqual({ url: "https://cdn.example.com/img.jpg" });
    const [calledUrl, calledInit] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toContain("/sub-categories/settings/image");
    expect((calledInit as { method: string }).method).toBe("POST");
    expect((calledInit.headers as Record<string, string>).cookie).toBe("admin_token=abc123");
  });
});

// ─── التأثير على صفحات أخرى ───────────────────────────────────────────────────

describe("التأثير على الـ storefront — sub-categories/public", () => {
  beforeEach(() => { mockFetch.mockReset(); jest.resetModules(); });

  it("الـ public endpoint لا يتطلب auth ويُستخدم في الـ storefront", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockPublicCats });
    const { GET } = require("../../app/api/admin/sub-categories/public/route");
    await GET();

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/sub-categories/public");
    const calledInit = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = calledInit.headers as Record<string, string> | undefined;
    expect(headers?.cookie).toBeUndefined();
  });

  it("تغيير صورة التصنيف يؤثر على الـ storefront عبر public endpoint", async () => {
    const updatedCats = [
      { name: "شرائح STC", count: 5, image: "https://cdn.example.com/new-stc.jpg" },
    ];
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => updatedCats });
    const { GET } = require("../../app/api/admin/sub-categories/public/route");
    const res = await GET();
    expect(res._data[0].image).toBe("https://cdn.example.com/new-stc.jpg");
  });
});

describe("التأثير على sub-categories page — settings route", () => {
  beforeEach(() => { mockFetch.mockReset(); jest.resetModules(); });

  it("settings route يُرجع settings + max معاً", async () => {
    const fakeData = { settings: mockSettings.settings, max: 4 };
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => fakeData });
    const { GET } = require("../../app/api/admin/sub-categories/settings/route");
    const res = await GET(makeRequest("/api/admin/sub-categories/settings", {
      headers: { cookie: "admin_token=abc123" },
    }));

    expect(res._data.settings).toBeDefined();
    expect(res._data.max).toBe(4);
    if (Array.isArray(res._data.settings)) {
      res._data.settings.forEach((s: { category: string }) => {
        expect(s.category).not.toBe("__config__");
        expect(s.category).not.toBe("__brand__");
      });
    }
  });
});
