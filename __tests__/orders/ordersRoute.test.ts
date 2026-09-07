/**
 * Tests: /api/admin/orders route
 * يتحقق من:
 * - GET يمرر query params للـ backend
 * - GET يمرر الـ cookies
 * - GET يرجع response الـ backend كما هو
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

const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeRequest(url: string, headers: Record<string, string> = {}) {
  const fullUrl = new URL(url, "http://localhost:3000");
  return {
    url: fullUrl.toString(),
    nextUrl: fullUrl,
    method: "GET",
    headers: { get: (k: string) => headers[k] ?? null },
    json: async () => ({}),
  };
}

const FAKE_RESPONSE = {
  orders: [
    {
      _id: "aaa111",
      orderId: "ORD-001",
      customer: "أحمد",
      whatsapp: "0501234567",
      nationalId: "1234567890",
      status: "pending",
      total: 1500,
      downPayment: 300,
      installmentType: "installment",
      months: 6,
      monthlyPayment: 200,
      createdAt: "2024-01-01T00:00:00.000Z",
      items: [],
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
  totalPages: 1,
};

beforeEach(() => {
  mockFetch.mockReset();
  jest.resetModules();
});

describe("GET /api/admin/orders", () => {
  it("يمرر query params للـ backend", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => FAKE_RESPONSE,
    });

    const { GET } = require("../../app/api/admin/orders/route");
    const req = makeRequest(
      "/api/admin/orders?page=2&limit=20&status=pending&search=أحمد",
      { cookie: "admin_token=tok123" }
    );
    await GET(req);

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("page=2");
    expect(calledUrl).toContain("status=pending");
    expect(calledUrl).toContain("search=");
  });

  it("يمرر الـ cookie للـ backend", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => FAKE_RESPONSE,
    });

    const { GET } = require("../../app/api/admin/orders/route");
    const req = makeRequest("/api/admin/orders", { cookie: "admin_token=tok123" });
    await GET(req);

    const calledInit = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = calledInit.headers as Record<string, string>;
    expect(headers.cookie).toBe("admin_token=tok123");
  });

  it("يرجع البيانات من الـ backend", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => FAKE_RESPONSE,
    });

    const { GET } = require("../../app/api/admin/orders/route");
    const req = makeRequest("/api/admin/orders");
    const res = await GET(req);

    expect(res._data).toEqual(FAKE_RESPONSE);
    expect(res._status).toBe(200);
  });

  it("يرجع 401 إذا رفض الـ backend", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: "غير مصرح" }),
    });

    const { GET } = require("../../app/api/admin/orders/route");
    const req = makeRequest("/api/admin/orders");
    const res = await GET(req);

    expect(res._status).toBe(401);
  });

  it("يمرر sortField وsortDir للـ backend", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => FAKE_RESPONSE,
    });

    const { GET } = require("../../app/api/admin/orders/route");
    const req = makeRequest("/api/admin/orders?sortField=total&sortDir=asc");
    await GET(req);

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("sortField=total");
    expect(calledUrl).toContain("sortDir=asc");
  });

  it("يمرر dateFrom وdateTo للـ backend", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => FAKE_RESPONSE,
    });

    const { GET } = require("../../app/api/admin/orders/route");
    const req = makeRequest("/api/admin/orders?dateFrom=2024-01-01&dateTo=2024-12-31");
    await GET(req);

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("dateFrom=2024-01-01");
    expect(calledUrl).toContain("dateTo=2024-12-31");
  });
});
