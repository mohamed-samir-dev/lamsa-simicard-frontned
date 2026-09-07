/**
 * Tests: Regression — التأكد أن التغييرات لم تكسر شيئاً آخر
 * يتحقق من:
 * - /api/company لا يزال يستدعي /company/public
 * - /api/admin/verify لا يزال يمرر الـ cookie
 * - forwardCookies تعمل بشكل صحيح
 * - STATUS map في types.ts تحتوي على كل الحالات
 * - Order type يحتوي على الحقول المطلوبة
 */

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      _data: data,
      _status: init?.status ?? 200,
    }),
  },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeReq(url: string, cookie = "") {
  const fullUrl = new URL(url, "http://localhost:3000");
  return {
    url: fullUrl.toString(),
    nextUrl: fullUrl,
    method: "GET",
    headers: { get: (k: string) => (k === "cookie" ? cookie : null) },
    json: async () => ({}),
    formData: async () => new FormData(),
  };
}

beforeEach(() => {
  mockFetch.mockReset();
  jest.resetModules();
});

// ── /api/company لا يزال يعمل ────────────────────────────────────────────────

describe("Regression: GET /api/company", () => {
  it("لا يزال يستدعي /company/public", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ nameAr: "شركة" }),
    });

    const { GET } = require("../../app/api/company/route");
    await GET();

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/company/public");
    expect(url).not.toMatch(/\/api\/admin\/company$/);
  });
});

// ── /api/admin/verify لا يزال يعمل ──────────────────────────────────────────

describe("Regression: GET /api/admin/verify", () => {
  it("يمرر الـ cookie للـ backend", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ valid: true }),
    });

    const { GET } = require("../../app/api/admin/verify/route");
    const req = makeReq("/api/admin/verify", "admin_token=tok123");
    await GET(req);

    const headers = (mockFetch.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers.cookie).toBe("admin_token=tok123");
  });

  it("يرجع 401 إذا لم يكن هناك token", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ valid: false }),
    });

    const { GET } = require("../../app/api/admin/verify/route");
    const req = makeReq("/api/admin/verify");
    const res = await GET(req);

    expect(res._status).toBe(401);
  });
});

// ── forwardCookies تعمل بشكل صحيح ───────────────────────────────────────────

describe("Regression: forwardCookies utility", () => {
  it("تضيف cookie وorigin للـ headers", () => {
    jest.resetModules();
    const { forwardCookies } = require("../../app/api/admin/_lib");
    const req = makeReq("/api/admin/orders", "admin_token=abc");
    const result = forwardCookies(req, { method: "GET" });
    const headers = result.headers as Record<string, string>;
    expect(headers.cookie).toBe("admin_token=abc");
    expect(headers.origin).toBeDefined();
  });

  it("لا تُضيف content-type عند FormData", () => {
    jest.resetModules();
    const { forwardCookies } = require("../../app/api/admin/_lib");
    const req = makeReq("/api/admin/orders", "admin_token=abc");
    const formData = new FormData();
    const result = forwardCookies(req, {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data" },
      body: formData,
    });
    const headers = result.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBeUndefined();
    expect(headers["content-type"]).toBeUndefined();
  });
});

// ── STATUS map و Order type ──────────────────────────────────────────────────

describe("Regression: types.ts", () => {
  it("STATUS map تحتوي على pending وconfirmed وcancelled", () => {
    jest.resetModules();
    const { STATUS } = require("../../app/admin/orders/[id]/types");
    expect(STATUS.pending).toBeDefined();
    expect(STATUS.confirmed).toBeDefined();
    expect(STATUS.cancelled).toBeDefined();
  });

  it("كل حالة تحتوي على label وcls", () => {
    jest.resetModules();
    const { STATUS } = require("../../app/admin/orders/[id]/types");
    ["pending", "confirmed", "cancelled"].forEach((s) => {
      expect(STATUS[s].label).toBeTruthy();
      expect(STATUS[s].cls).toBeTruthy();
    });
  });
});

// ── orders route لا يزال يمرر الـ cookies ───────────────────────────────────

describe("Regression: GET /api/admin/orders — cookies", () => {
  it("يمرر الـ cookie بعد التغييرات", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ orders: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
    });

    const { GET } = require("../../app/api/admin/orders/route");
    const req = makeReq("/api/admin/orders", "admin_token=regression_test");
    await GET(req);

    const headers = (mockFetch.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers.cookie).toBe("admin_token=regression_test");
  });
});

// ── orders/[id] route لا يزال يعمل ──────────────────────────────────────────

describe("Regression: /api/admin/orders/[id] — لا يزال يعمل", () => {
  it("GET يستدعي /api/checkout/:id", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ _id: "aaa", orderId: "ORD-1" }),
    });

    const { GET } = require("../../app/api/admin/orders/[id]/route");
    const req = makeReq("/api/admin/orders/aaa");
    await GET(req, { params: Promise.resolve({ id: "aaa" }) });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/api/checkout/aaa");
  });

  it("PUT financials يستدعي /financials", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ _id: "aaa" }),
    });

    const req = {
      url: "http://localhost:3000/api/admin/orders/aaa",
      nextUrl: new URL("http://localhost:3000/api/admin/orders/aaa"),
      method: "PUT",
      headers: { get: () => null },
      json: async () => ({ financials: true, total: 2000, downPayment: 500, months: 6, monthlyPayment: 250 }),
    };

    const { PUT } = require("../../app/api/admin/orders/[id]/route");
    await PUT(req, { params: Promise.resolve({ id: "aaa" }) });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/financials");
  });
});
