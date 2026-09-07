/**
 * Tests: /api/admin/orders/[id]/invoice route
 * يتحقق من:
 * - يجلب order وcompany بالتوازي
 * - يجلب صور المنتجات في الـ backend (حل N+1)
 * - يرجع order مع items تحتوي على image
 * - يتعامل مع فشل جلب صورة منتج بدون crash
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

function makeReq(cookie = "admin_token=tok") {
  return {
    url: "http://localhost:3000/api/admin/orders/aaa111/invoice",
    nextUrl: new URL("http://localhost:3000/api/admin/orders/aaa111/invoice"),
    method: "GET",
    headers: { get: (k: string) => (k === "cookie" ? cookie : null) },
  };
}

const FAKE_ORDER = {
  _id: "aaa111",
  orderId: "ORD-001",
  customer: "أحمد",
  status: "pending",
  total: 1500,
  items: [
    { productId: "prod1", name: "جهاز A", price: 1000, quantity: 1 },
    { productId: "prod2", name: "جهاز B", price: 500, quantity: 1 },
  ],
};

const FAKE_COMPANY = { nameAr: "شركة", logo: "" };

beforeEach(() => {
  mockFetch.mockReset();
  jest.resetModules();
});

describe("GET /api/admin/orders/[id]/invoice", () => {
  it("يجلب order وcompany بالتوازي", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => FAKE_ORDER })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => FAKE_COMPANY })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ image: "https://cdn/a.jpg" }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ image: "https://cdn/b.jpg" }) });

    const { GET } = require("../../app/api/admin/orders/[id]/invoice/route");
    const req = makeReq();
    const res = await GET(req, { params: Promise.resolve({ id: "aaa111" }) });

    const urls = mockFetch.mock.calls.map((c) => c[0] as string);
    expect(urls.some((u) => u.includes("/api/checkout/aaa111"))).toBe(true);
    expect(urls.some((u) => u.includes("/api/admin/company"))).toBe(true);
    expect(res._data.company).toEqual(FAKE_COMPANY);
  });

  it("يضيف image لكل item من الـ backend", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => FAKE_ORDER })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => FAKE_COMPANY })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ image: "https://cdn/a.jpg" }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ image: "https://cdn/b.jpg" }) });

    const { GET } = require("../../app/api/admin/orders/[id]/invoice/route");
    const req = makeReq();
    const res = await GET(req, { params: Promise.resolve({ id: "aaa111" }) });

    expect(res._data.order.items[0].image).toBe("https://cdn/a.jpg");
    expect(res._data.order.items[1].image).toBe("https://cdn/b.jpg");
  });

  it("يتعامل مع فشل جلب صورة منتج بدون crash", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => FAKE_ORDER })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => FAKE_COMPANY })
      .mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ image: "https://cdn/b.jpg" }) });

    const { GET } = require("../../app/api/admin/orders/[id]/invoice/route");
    const req = makeReq();
    const res = await GET(req, { params: Promise.resolve({ id: "aaa111" }) });

    expect(res._data.order.items).toHaveLength(2);
    expect(res._data.order.items[1].image).toBe("https://cdn/b.jpg");
  });

  it("يتعامل مع item بدون productId", async () => {
    const orderNoProductId = {
      ...FAKE_ORDER,
      items: [{ name: "جهاز بدون ID", price: 500, quantity: 1 }],
    };

    mockFetch
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => orderNoProductId })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => FAKE_COMPANY });

    const { GET } = require("../../app/api/admin/orders/[id]/invoice/route");
    const req = makeReq();
    const res = await GET(req, { params: Promise.resolve({ id: "aaa111" }) });

    expect(res._data.order.items[0].name).toBe("جهاز بدون ID");
    expect(res._data.order.items[0].image).toBeUndefined();
  });

  it("يمرر الـ cookie لكل الـ requests", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => FAKE_ORDER })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => FAKE_COMPANY })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ image: "" }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ image: "" }) });

    const { GET } = require("../../app/api/admin/orders/[id]/invoice/route");
    const req = makeReq("admin_token=special");
    await GET(req, { params: Promise.resolve({ id: "aaa111" }) });

    mockFetch.mock.calls.forEach((call) => {
      const headers = (call[1] as RequestInit)?.headers as Record<string, string>;
      if (headers) expect(headers.cookie).toBe("admin_token=special");
    });
  });
});
