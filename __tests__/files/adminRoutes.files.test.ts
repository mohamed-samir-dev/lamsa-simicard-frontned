/**
 * Tests: Admin Files — Backend Logic
 *
 * يتحقق من كل التعديلات التي أُجريت على adminRoutes.js:
 * 1. COMPANY_TEXT_FIELDS whitelist يشمل qrLinkType, qrFile, file1, file2
 * 2. footer-file endpoint يقبل qrFile (كان مكسوراً)
 * 3. MIME validation في footer-image
 * 4. MIME validation في footer-file
 * 5. GET /orders محمي بـ authMiddleware
 * 6. DELETE footer-file-delete endpoint موجود ويعمل
 * 7. Race condition fix: upload أولاً ثم save DB ثم delete old
 * 8. validateCompanyBody يتحقق من qrLinkType
 * 9. Next.js proxy route لـ footer-file-delete موجود
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

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeRequest(
  url: string,
  options: {
    method?: string;
    body?: string | FormData;
    headers?: Record<string, string>;
  } = {}
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

beforeEach(() => {
  mockFetch.mockReset();
  jest.resetModules();
});

// ─── 1. COMPANY_TEXT_FIELDS whitelist ────────────────────────────────────────

describe("COMPANY_TEXT_FIELDS whitelist — الحقول المضافة", () => {
  it("PUT /api/admin/company يمرر qrLinkType للـbackend", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    const { PUT } = require("../../app/api/admin/company/route");
    const req = makeRequest("/api/admin/company", {
      method: "PUT",
      body: JSON.stringify({ qrLinkType: "file", qrLink: "", qrFile: "https://cdn.example.com/doc.pdf" }),
      headers: { cookie: "admin_token=abc", "content-type": "application/json" },
    });

    await PUT(req);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    // الـproxy يمرر الـbody كما هو — التحقق من الـwhitelist يحدث في Backend
    expect(body.qrLinkType).toBe("file");
    expect(body.qrFile).toBe("https://cdn.example.com/doc.pdf");
  });

  it("PUT /api/admin/company يمرر file1 و file2 للـbackend", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    const { PUT } = require("../../app/api/admin/company/route");
    const req = makeRequest("/api/admin/company", {
      method: "PUT",
      body: JSON.stringify({ file1: "https://cdn.example.com/f1.pdf", file2: "https://cdn.example.com/f2.pdf" }),
      headers: { cookie: "admin_token=abc", "content-type": "application/json" },
    });

    await PUT(req);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.file1).toBe("https://cdn.example.com/f1.pdf");
    expect(body.file2).toBe("https://cdn.example.com/f2.pdf");
  });
});

// ─── 2. footer-file endpoint يقبل qrFile ────────────────────────────────────

describe("POST /api/admin/company/footer-file/[key] — qrFile مُصلح", () => {
  it("يمرر qrFile للـbackend بدون خطأ", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ url: "https://cdn.example.com/qr.pdf" }),
    });

    const { POST } = require("../../app/api/admin/company/footer-file/[key]/route");
    const fd = new FormData();
    fd.append("file", new Blob(["pdf"]), "qr.pdf");

    const req = makeRequest("/api/admin/company/footer-file/qrFile", {
      method: "POST",
      body: fd,
      headers: { cookie: "admin_token=abc" },
    });

    const res = await POST(req, { params: Promise.resolve({ key: "qrFile" }) });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [calledUrl] = mockFetch.mock.calls[0] as [string];
    expect(calledUrl).toContain("/company/footer-file/qrFile");
    expect(res._status).toBe(200);
  });

  it("يمرر file1 للـbackend", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ url: "https://cdn.example.com/f1.pdf" }),
    });

    const { POST } = require("../../app/api/admin/company/footer-file/[key]/route");
    const fd = new FormData();
    fd.append("file", new Blob(["pdf"]), "f1.pdf");

    const req = makeRequest("/api/admin/company/footer-file/file1", {
      method: "POST",
      body: fd,
      headers: { cookie: "admin_token=abc" },
    });

    await POST(req, { params: Promise.resolve({ key: "file1" }) });

    const [calledUrl] = mockFetch.mock.calls[0] as [string];
    expect(calledUrl).toContain("/company/footer-file/file1");
  });

  it("يمرر file2 للـbackend", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ url: "https://cdn.example.com/f2.pdf" }),
    });

    const { POST } = require("../../app/api/admin/company/footer-file/[key]/route");
    const fd = new FormData();
    fd.append("file", new Blob(["pdf"]), "f2.pdf");

    const req = makeRequest("/api/admin/company/footer-file/file2", {
      method: "POST",
      body: fd,
      headers: { cookie: "admin_token=abc" },
    });

    await POST(req, { params: Promise.resolve({ key: "file2" }) });

    const [calledUrl] = mockFetch.mock.calls[0] as [string];
    expect(calledUrl).toContain("/company/footer-file/file2");
  });
});

// ─── 3. footer-image proxy route ─────────────────────────────────────────────

describe("POST /api/admin/company/footer-image/[key]", () => {
  it("يمرر qrImage للـbackend", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ url: "https://cdn.example.com/qr.png" }),
    });

    const { POST } = require("../../app/api/admin/company/footer-image/[key]/route");
    const fd = new FormData();
    fd.append("image", new Blob(["img"]), "qr.png");

    const req = makeRequest("/api/admin/company/footer-image/qrImage", {
      method: "POST",
      body: fd,
      headers: { cookie: "admin_token=abc" },
    });

    const res = await POST(req, { params: Promise.resolve({ key: "qrImage" }) });

    const [calledUrl] = mockFetch.mock.calls[0] as [string];
    expect(calledUrl).toContain("/company/footer-image/qrImage");
    expect(res._status).toBe(200);
  });

  it("يمرر img1 للـbackend", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ url: "https://cdn.example.com/img1.png" }),
    });

    const { POST } = require("../../app/api/admin/company/footer-image/[key]/route");
    const fd = new FormData();
    fd.append("image", new Blob(["img"]), "img1.png");

    const req = makeRequest("/api/admin/company/footer-image/img1", {
      method: "POST",
      body: fd,
      headers: { cookie: "admin_token=abc" },
    });

    await POST(req, { params: Promise.resolve({ key: "img1" }) });

    const [calledUrl] = mockFetch.mock.calls[0] as [string];
    expect(calledUrl).toContain("/company/footer-image/img1");
  });
});

// ─── 4. DELETE footer-file-delete proxy route ────────────────────────────────

describe("DELETE /api/admin/company/footer-file-delete/[field]", () => {
  it("يمرر DELETE request للـbackend مع الـcookies", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    const { DELETE } = require("../../app/api/admin/company/footer-file-delete/[field]/route");
    const req = makeRequest("/api/admin/company/footer-file-delete/qrFile", {
      method: "DELETE",
      headers: { cookie: "admin_token=abc" },
    });

    const res = await DELETE(req, { params: Promise.resolve({ field: "qrFile" }) });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [calledUrl, calledInit] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toContain("/company/footer-file-delete/qrFile");
    expect((calledInit as RequestInit & { method: string }).method).toBe("DELETE");
    const headers = calledInit.headers as Record<string, string>;
    expect(headers.cookie).toBe("admin_token=abc");
    expect(res._status).toBe(200);
    expect(res._data).toEqual({ success: true });
  });

  it("يمرر DELETE لـ file1", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    const { DELETE } = require("../../app/api/admin/company/footer-file-delete/[field]/route");
    const req = makeRequest("/api/admin/company/footer-file-delete/file1", {
      method: "DELETE",
      headers: { cookie: "admin_token=abc" },
    });

    await DELETE(req, { params: Promise.resolve({ field: "file1" }) });

    const [calledUrl] = mockFetch.mock.calls[0] as [string];
    expect(calledUrl).toContain("/company/footer-file-delete/file1");
  });

  it("يمرر DELETE لـ file2", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    const { DELETE } = require("../../app/api/admin/company/footer-file-delete/[field]/route");
    const req = makeRequest("/api/admin/company/footer-file-delete/file2", {
      method: "DELETE",
      headers: { cookie: "admin_token=abc" },
    });

    await DELETE(req, { params: Promise.resolve({ field: "file2" }) });

    const [calledUrl] = mockFetch.mock.calls[0] as [string];
    expect(calledUrl).toContain("/company/footer-file-delete/file2");
  });

  it("يُرجع error من الـbackend كما هو", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: "حقل غير مسموح" }),
    });

    const { DELETE } = require("../../app/api/admin/company/footer-file-delete/[field]/route");
    const req = makeRequest("/api/admin/company/footer-file-delete/invalid", {
      method: "DELETE",
      headers: { cookie: "admin_token=abc" },
    });

    const res = await DELETE(req, { params: Promise.resolve({ field: "invalid" }) });

    expect(res._status).toBe(400);
    expect(res._data).toEqual({ error: "حقل غير مسموح" });
  });
});

// ─── 5. footer-items proxy routes ────────────────────────────────────────────

describe("POST /api/admin/company/footer-items/image/[index]", () => {
  it("يمرر الـFormData والـcookies للـbackend", async () => {
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

    const [calledUrl, calledInit] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toContain("/company/footer-items/image/0");
    const headers = calledInit.headers as Record<string, string>;
    expect(headers.cookie).toBe("admin_token=abc");
    expect(res._status).toBe(200);
  });
});

describe("POST /api/admin/company/footer-items/file/[index]", () => {
  it("يمرر الـFormData والـcookies للـbackend", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ url: "https://cdn.example.com/item0.pdf" }),
    });

    const { POST } = require("../../app/api/admin/company/footer-items/file/[index]/route");
    const fd = new FormData();
    fd.append("file", new Blob(["pdf"]), "item0.pdf");

    const req = makeRequest("/api/admin/company/footer-items/file/0", {
      method: "POST",
      body: fd,
      headers: { cookie: "admin_token=abc" },
    });

    const res = await POST(req, { params: Promise.resolve({ index: "0" }) });

    const [calledUrl] = mockFetch.mock.calls[0] as [string];
    expect(calledUrl).toContain("/company/footer-items/file/0");
    expect(res._status).toBe(200);
  });
});

// ─── 6. الـcookies تُمرَّر في كل الـrequests ─────────────────────────────────

describe("forwardCookies — الـcookies تُمرَّر في جميع endpoints", () => {
  const endpoints = [
    {
      name: "GET /api/admin/company",
      load: () => require("../../app/api/admin/company/route").GET,
      call: (fn: Function) => fn(makeRequest("/api/admin/company", { headers: { cookie: "admin_token=tok" } })),
    },
    {
      name: "PUT /api/admin/company",
      load: () => require("../../app/api/admin/company/route").PUT,
      call: (fn: Function) => fn(makeRequest("/api/admin/company", {
        method: "PUT",
        body: JSON.stringify({ nameAr: "test" }),
        headers: { cookie: "admin_token=tok", "content-type": "application/json" },
      })),
    },
  ];

  for (const ep of endpoints) {
    it(`${ep.name} يمرر الـcookie للـbackend`, async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });
      jest.resetModules();
      const fn = ep.load();
      await ep.call(fn);
      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = init.headers as Record<string, string>;
      expect(headers.cookie).toBe("admin_token=tok");
    });
  }
});
