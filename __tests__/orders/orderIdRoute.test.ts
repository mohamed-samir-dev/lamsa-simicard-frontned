/**
 * Tests: /api/admin/orders/[id] route
 * يتحقق من:
 * - GET يمرر الـ cookie
 * - PUT status يستدعي /status endpoint
 * - PUT financials يستدعي /financials endpoint
 * - DELETE يستدعي DELETE على الـ backend
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

function makeReq(
  url: string,
  method = "GET",
  body?: object,
  cookie = "admin_token=tok"
) {
  return {
    url,
    nextUrl: new URL(url, "http://localhost:3000"),
    method,
    headers: { get: (k: string) => (k === "cookie" ? cookie : null) },
    json: async () => body ?? {},
    text: async () => JSON.stringify(body ?? {}),
  };
}

const FAKE_ORDER = {
  _id: "aaa111",
  orderId: "ORD-001",
  customer: "أحمد",
  status: "pending",
  total: 1500,
};

beforeEach(() => {
  mockFetch.mockReset();
  jest.resetModules();
});

describe("GET /api/admin/orders/[id]", () => {
  it("يمرر الـ cookie للـ backend", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(FAKE_ORDER),
    });

    const { GET } = require("../../app/api/admin/orders/[id]/route");
    const req = makeReq("/api/admin/orders/aaa111");
    await GET(req, { params: Promise.resolve({ id: "aaa111" }) });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/api/checkout/aaa111");
    const headers = (mockFetch.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers.cookie).toBe("admin_token=tok");
  });

  it("يرجع 404 إذا لم يوجد الطلب", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => JSON.stringify({ error: "not found" }),
    });

    const { GET } = require("../../app/api/admin/orders/[id]/route");
    const req = makeReq("/api/admin/orders/notexist");
    const res = await GET(req, { params: Promise.resolve({ id: "notexist" }) });

    expect(res._status).toBe(404);
  });
});

describe("PUT /api/admin/orders/[id] — status", () => {
  it("يستدعي /status endpoint عند إرسال status", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ...FAKE_ORDER, status: "confirmed" }),
    });

    const { PUT } = require("../../app/api/admin/orders/[id]/route");
    const req = makeReq("/api/admin/orders/aaa111", "PUT", { status: "confirmed" });
    await PUT(req, { params: Promise.resolve({ id: "aaa111" }) });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/api/checkout/aaa111/status");
  });

  it("يمرر الـ cookie مع PUT status", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ...FAKE_ORDER, status: "confirmed" }),
    });

    const { PUT } = require("../../app/api/admin/orders/[id]/route");
    const req = makeReq("/api/admin/orders/aaa111", "PUT", { status: "confirmed" });
    await PUT(req, { params: Promise.resolve({ id: "aaa111" }) });

    const headers = (mockFetch.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers.cookie).toBe("admin_token=tok");
  });
});

describe("PUT /api/admin/orders/[id] — financials", () => {
  it("يستدعي /financials endpoint عند إرسال financials:true", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(FAKE_ORDER),
    });

    const { PUT } = require("../../app/api/admin/orders/[id]/route");
    const req = makeReq("/api/admin/orders/aaa111", "PUT", {
      financials: true,
      total: 2000,
      downPayment: 500,
      months: 6,
      monthlyPayment: 250,
    });
    await PUT(req, { params: Promise.resolve({ id: "aaa111" }) });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/api/checkout/aaa111/financials");
  });
});

describe("DELETE /api/admin/orders/[id]", () => {
  it("يستدعي DELETE على الـ backend", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true }),
    });

    const { DELETE } = require("../../app/api/admin/orders/[id]/route");
    const req = makeReq("/api/admin/orders/aaa111", "DELETE");
    await DELETE(req, { params: Promise.resolve({ id: "aaa111" }) });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    const calledMethod = (mockFetch.mock.calls[0][1] as RequestInit & { method: string }).method;
    expect(calledUrl).toContain("/api/checkout/aaa111");
    expect(calledMethod).toBe("DELETE");
  });

  it("يمرر الـ cookie مع DELETE", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true }),
    });

    const { DELETE } = require("../../app/api/admin/orders/[id]/route");
    const req = makeReq("/api/admin/orders/aaa111", "DELETE");
    await DELETE(req, { params: Promise.resolve({ id: "aaa111" }) });

    const headers = (mockFetch.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers.cookie).toBe("admin_token=tok");
  });
});
