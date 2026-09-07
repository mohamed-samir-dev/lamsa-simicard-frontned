/**
 * Tests: Regression — التأكد أن التعديلات لم تكسر شيئاً آخر
 *
 * يتحقق من:
 * 1. GET /api/admin/company لا يزال يعمل
 * 2. PUT /api/admin/company لا يزال يمرر text fields الأصلية
 * 3. /api/admin/company/upload/[key] لا يزال يعمل (غير متأثر)
 * 4. /api/admin/company/image/[key] DELETE لا يزال يعمل (غير متأثر)
 * 5. /api/company (public) لا يزال يستدعي /public endpoint
 * 6. companyStore لا يزال يعمل بعد التعديلات
 * 7. footer-image يقبل qrImage, img1, img2 (لم يتغير)
 * 8. footer-items/image و footer-items/file لا يزالان يعملان
 */

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

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeRequest(
  url: string,
  options: {
    method?: string;
    body?: string | FormData;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {}
) {
  const fullUrl = new URL(url, "http://localhost:3000");
  if (options.searchParams) {
    for (const [k, v] of Object.entries(options.searchParams)) {
      fullUrl.searchParams.set(k, v);
    }
  }
  return {
    url: fullUrl.toString(),
    nextUrl: fullUrl,
    method: options.method ?? "GET",
    headers: { get: (k: string) => (options.headers ?? {})[k] ?? null },
    json: async () => JSON.parse((options.body as string) ?? "{}"),
    formData: async () => options.body as FormData,
  };
}

beforeEach(() => {
  mockFetch.mockReset();
  jest.resetModules();
});

// ─── 1. GET /api/admin/company لا يزال يعمل ──────────────────────────────────

describe("Regression — GET /api/admin/company", () => {
  it("يُرجع بيانات الشركة الكاملة", async () => {
    const fakeData = { nameAr: "شركة", qrLink: "", qrLinkType: "link", qrFile: "", footerItems: [] };
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => fakeData });

    const { GET } = require("../../app/api/admin/company/route");
    const req = makeRequest("/api/admin/company", { headers: { cookie: "admin_token=abc" } });
    const res = await GET(req);

    expect(res._status).toBe(200);
    expect(res._data).toEqual(fakeData);
  });

  it("يُرجع status الـbackend عند الخطأ", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ error: "غير مصرح" }) });

    const { GET } = require("../../app/api/admin/company/route");
    const req = makeRequest("/api/admin/company");
    const res = await GET(req);

    expect(res._status).toBe(401);
  });
});

// ─── 2. PUT /api/admin/company — text fields الأصلية لا تزال تعمل ─────────────

describe("Regression — PUT /api/admin/company text fields", () => {
  const originalFields = [
    "nameAr", "nameEn", "addressAr", "addressEn",
    "phone", "whatsapp", "website", "email",
    "currencyAr", "currencyEn", "taxNumber",
    "shippingCompany", "paymentMethod", "details",
    "qrLink", "link1", "link1Type", "link2", "link2Type",
  ];

  it("يمرر جميع الـtext fields الأصلية للـbackend", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ success: true }) });

    const payload: Record<string, string> = {};
    for (const f of originalFields) payload[f] = `value_${f}`;

    const { PUT } = require("../../app/api/admin/company/route");
    const req = makeRequest("/api/admin/company", {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: { cookie: "admin_token=abc", "content-type": "application/json" },
    });

    await PUT(req);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    for (const f of originalFields) {
      expect(body[f]).toBe(`value_${f}`);
    }
  });

  it("يُرجع success: true عند نجاح الحفظ", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ success: true }) });

    const { PUT } = require("../../app/api/admin/company/route");
    const req = makeRequest("/api/admin/company", {
      method: "PUT",
      body: JSON.stringify({ nameAr: "شركة" }),
      headers: { cookie: "admin_token=abc", "content-type": "application/json" },
    });

    const res = await PUT(req);
    expect(res._data).toEqual({ success: true });
  });
});

// ─── 3. /api/admin/company/upload/[key] لا يزال يعمل ────────────────────────

describe("Regression — POST /api/admin/company/upload/[key]", () => {
  const imageKeys = ["logo", "header", "footer", "stamp", "cancelStamp"];

  for (const key of imageKeys) {
    it(`يمرر ${key} للـbackend`, async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ url: `https://cdn.example.com/${key}.png` }),
      });

      const { POST } = require("../../app/api/admin/company/upload/[key]/route");
      const fd = new FormData();
      fd.append("image", new Blob(["img"]), `${key}.png`);

      const req = makeRequest(`/api/admin/company/upload/${key}`, {
        method: "POST",
        body: fd,
        headers: { cookie: "admin_token=abc" },
      });

      const res = await POST(req, { params: Promise.resolve({ key }) });

      const [calledUrl] = mockFetch.mock.calls[0] as [string];
      expect(calledUrl).toContain(`/company/upload/${key}`);
      expect(res._status).toBe(200);
    });
  }
});

// ─── 4. /api/admin/company/image/[key] DELETE لا يزال يعمل ──────────────────

describe("Regression — DELETE /api/admin/company/image/[key]", () => {
  it("يمرر DELETE request للـbackend", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ success: true }),
    });

    const { DELETE } = require("../../app/api/admin/company/image/[key]/route");
    const req = makeRequest("/api/admin/company/image/logo", {
      method: "DELETE",
      headers: { cookie: "admin_token=abc" },
    });

    const res = await DELETE(req, { params: Promise.resolve({ key: "logo" }) });

    const [calledUrl, calledInit] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toContain("/company/image/logo");
    expect((calledInit as RequestInit & { method: string }).method).toBe("DELETE");
    expect(res._status).toBe(200);
  });
});

// ─── 5. /api/company (public) لا يزال يستدعي /public ────────────────────────

describe("Regression — GET /api/company (public endpoint)", () => {
  it("يستدعي /company/public وليس /company", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ nameAr: "شركة", logo: "" }),
    });

    const { GET } = require("../../app/api/company/route");
    await GET();

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/company/public");
    expect(calledUrl).not.toMatch(/\/api\/admin\/company$/);
  });
});

// ─── 6. companyStore لا يزال يعمل ────────────────────────────────────────────

describe("Regression — companyStore", () => {
  let storeModule: typeof import("../../app/store/companyStore");

  beforeEach(() => {
    jest.resetModules();
    mockFetch.mockReset();
    storeModule = require("../../app/store/companyStore");
  });

  it("fetchCompany تجلب البيانات وتضع fetched=true", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        logo: "https://cdn.example.com/logo.png",
        nameAr: "شركة",
        nameEn: "Company",
        phone: "0501234567",
        whatsapp: "0501234567",
        email: "test@test.com",
        website: "https://test.com",
        details: "تفاصيل",
      }),
    });

    await storeModule.useCompanyStore.getState().fetchCompany();

    const state = storeModule.useCompanyStore.getState();
    expect(state.fetched).toBe(true);
    expect(state.nameAr).toBe("شركة");
    expect(state.logo).toBe("https://cdn.example.com/logo.png");
  });

  it("fetchCompany لا تُعيد الـfetch إذا fetched=true", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ logo: "", nameAr: "شركة", nameEn: "", phone: "", whatsapp: "", email: "", website: "", details: "" }),
    });

    const store = storeModule.useCompanyStore.getState();
    await store.fetchCompany();
    await store.fetchCompany();
    await store.fetchCompany();

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

// ─── 7. footer-image يقبل qrImage, img1, img2 ────────────────────────────────

describe("Regression — footer-image keys", () => {
  const imageKeys = ["qrImage", "img1", "img2"];

  for (const key of imageKeys) {
    it(`يمرر ${key} للـbackend`, async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ url: `https://cdn.example.com/${key}.png` }),
      });

      const { POST } = require("../../app/api/admin/company/footer-image/[key]/route");
      const fd = new FormData();
      fd.append("image", new Blob(["img"]), `${key}.png`);

      const req = makeRequest(`/api/admin/company/footer-image/${key}`, {
        method: "POST",
        body: fd,
        headers: { cookie: "admin_token=abc" },
      });

      const res = await POST(req, { params: Promise.resolve({ key }) });

      const [calledUrl] = mockFetch.mock.calls[0] as [string];
      expect(calledUrl).toContain(`/company/footer-image/${key}`);
      expect(res._status).toBe(200);
    });
  }
});

// ─── 8. footer-items/image و footer-items/file لا يزالان يعملان ──────────────

describe("Regression — footer-items routes", () => {
  it("footer-items/image/0 يمرر للـbackend", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ url: "https://cdn.example.com/item0.png" }),
    });

    const { POST } = require("../../app/api/admin/company/footer-items/image/[index]/route");
    const fd = new FormData();
    fd.append("image", new Blob(["img"]), "item0.png");

    const req = makeRequest("/api/admin/company/footer-items/image/0", {
      method: "POST",
      body: fd,
      headers: { cookie: "admin_token=abc" },
    });

    const res = await POST(req, { params: Promise.resolve({ index: "0" }) });
    expect(res._status).toBe(200);
  });

  it("footer-items/file/1 يمرر للـbackend", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ url: "https://cdn.example.com/item1.pdf" }),
    });

    const { POST } = require("../../app/api/admin/company/footer-items/file/[index]/route");
    const fd = new FormData();
    fd.append("file", new Blob(["pdf"]), "item1.pdf");

    const req = makeRequest("/api/admin/company/footer-items/file/1", {
      method: "POST",
      body: fd,
      headers: { cookie: "admin_token=abc" },
    });

    const res = await POST(req, { params: Promise.resolve({ index: "1" }) });
    expect(res._status).toBe(200);
  });
});

// ─── 9. الـ_lib.ts forwardCookies لا يزال يعمل ───────────────────────────────

describe("Regression — _lib.ts forwardCookies", () => {
  it("يُضيف cookie و origin للـheaders", () => {
    jest.resetModules();
    const { forwardCookies } = require("../../app/api/admin/_lib");

    const req = makeRequest("/api/admin/company", {
      headers: { cookie: "admin_token=abc123" },
    });

    const result = forwardCookies(req, {
      headers: { "Content-Type": "application/json" },
    });

    const headers = result.headers as Record<string, string>;
    expect(headers.cookie).toBe("admin_token=abc123");
    expect(headers.origin).toBeDefined();
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("يحذف Content-Type عند FormData", () => {
    jest.resetModules();
    const { forwardCookies } = require("../../app/api/admin/_lib");

    const req = makeRequest("/api/admin/company", {
      headers: { cookie: "admin_token=abc" },
    });

    const fd = new FormData();
    const result = forwardCookies(req, {
      body: fd,
      headers: { "Content-Type": "multipart/form-data" },
    });

    const headers = result.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBeUndefined();
    expect(headers["content-type"]).toBeUndefined();
  });

  it("getBackend يُرجع BACKEND_URL من env إذا كان موجوداً", () => {
    jest.resetModules();
    process.env.BACKEND_URL = "https://custom-backend.com";
    const { getBackend } = require("../../app/api/admin/_lib");
    expect(getBackend()).toBe("https://custom-backend.com");
    delete process.env.BACKEND_URL;
  });
});
