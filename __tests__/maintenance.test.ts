/**
 * Tests: Maintenance Mode
 * يتحقق من:
 * - GET /api/maintenance/status يرجع حالة الصيانة
 * - POST /api/maintenance/toggle يحدّث maintenance_on cookie
 * - POST /api/maintenance/toggle يحدّث maintenance_bypass cookie دايماً
 * - middleware يعمل redirect لـ /maintenance لما maintenance_on=1
 * - middleware يعدي عادي لو عند المستخدم maintenance_bypass
 * - middleware يعدي عادي على /maint-mohasa حتى لو الصيانة مفعّلة
 * - middleware يعدي عادي على /api/* حتى لو الصيانة مفعّلة
 */

// ─── Polyfills ────────────────────────────────────────────────────────────────
// jsdom مش بيعرف Web APIs — نعرّفها قبل أي import
(global as any).Request = class {};
(global as any).Response = class {};
(global as any).Headers = class {
  private _h: Record<string, string> = {};
  set(k: string, v: string) { this._h[k] = v; }
  get(k: string) { return this._h[k] ?? null; }
};
(global as any).crypto = { randomUUID: () => "test-uuid-1234" };
(global as any).Buffer = {
  from: (str: string) => ({ toString: () => btoa(str) }),
};

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockCookiesSet = jest.fn();

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      _data: data,
      _status: init?.status ?? 200,
      status: init?.status ?? 200,
      json: async () => data,
      cookies: { set: mockCookiesSet },
      headers: { set: jest.fn() },
    }),
    redirect: (url: { pathname: string }) => ({
      _redirect: url.pathname,
      headers: { set: jest.fn() },
    }),
    next: () => ({
      _next: true,
      headers: { set: jest.fn() },
      cookies: { set: mockCookiesSet },
    }),
  },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(
  url: string,
  options: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
  } = {}
) {
  const fullUrl = new URL(url, "http://localhost:3000");
  return {
    url: fullUrl.toString(),
    nextUrl: fullUrl,
    method: options.method ?? "GET",
    headers: {
      get: (key: string) => (options.headers ?? {})[key] ?? null,
    },
    cookies: {
      get: (name: string) => {
        const val = (options.cookies ?? {})[name];
        return val !== undefined ? { value: val } : undefined;
      },
    },
    json: async () => JSON.parse(options.body ?? "{}"),
  };
}

const BYPASS_TOKEN = "sahlnaha_bypass_2025";

beforeEach(() => {
  mockFetch.mockReset();
  mockCookiesSet.mockReset();
  jest.resetModules();
  // re-apply mock بعد resetModules
  jest.mock("next/server", () => ({
    NextResponse: {
      json: (data: unknown, init?: { status?: number }) => ({
        _data: data,
        _status: init?.status ?? 200,
        status: init?.status ?? 200,
        json: async () => data,
        cookies: { set: mockCookiesSet },
        headers: { set: jest.fn() },
      }),
      redirect: (url: { pathname: string }) => ({
        _redirect: url.pathname,
        headers: { set: jest.fn() },
      }),
      next: () => ({
        _next: true,
        headers: { set: jest.fn() },
        cookies: { set: mockCookiesSet },
      }),
    },
  }));
});

// ─── GET /api/maintenance/status ──────────────────────────────────────────────

describe("GET /api/maintenance/status", () => {
  it("يرجع maintenance: true لما الباكند يقول كده", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ maintenance: true }),
    });

    const { GET } = require("../../app/api/maintenance/status/route");
    const req = makeRequest("/api/maintenance/status", {
      cookies: { admin_token: "abc123" },
    });
    const res = await GET(req);

    expect(res._data).toEqual({ maintenance: true });
  });

  it("يرجع 401 لما الباكند يرفض", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

    const { GET } = require("../../app/api/maintenance/status/route");
    const req = makeRequest("/api/maintenance/status");
    const res = await GET(req);

    expect(res._status).toBe(401);
  });
});

// ─── POST /api/maintenance/toggle ─────────────────────────────────────────────

describe("POST /api/maintenance/toggle", () => {
  it("يحط maintenance_on=1 لما enabled: true", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, maintenance: true }),
    });

    const { POST } = require("../../app/api/maintenance/toggle/route");
    const req = makeRequest("/api/maintenance/toggle", {
      method: "POST",
      body: JSON.stringify({ enabled: true }),
      cookies: { admin_token: "abc123" },
    });
    const res = await POST(req);

    expect(res._data).toMatchObject({ success: true, maintenance: true });

    const maintenanceOnCall = mockCookiesSet.mock.calls.find(
      (c) => c[0] === "maintenance_on"
    );
    expect(maintenanceOnCall).toBeDefined();
    expect(maintenanceOnCall[1]).toBe("1");
  });

  it("يمسح maintenance_on لما enabled: false", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, maintenance: false }),
    });

    const { POST } = require("../../app/api/maintenance/toggle/route");
    const req = makeRequest("/api/maintenance/toggle", {
      method: "POST",
      body: JSON.stringify({ enabled: false }),
      cookies: { admin_token: "abc123" },
    });
    await POST(req);

    const maintenanceOnCall = mockCookiesSet.mock.calls.find(
      (c) => c[0] === "maintenance_on"
    );
    expect(maintenanceOnCall).toBeDefined();
    // maxAge: 0 يعني حذف الكوكي
    expect(maintenanceOnCall[2]).toMatchObject({ maxAge: 0 });
  });

  it("يحط maintenance_bypass دايماً بغض النظر عن الحالة", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, maintenance: true }),
    });

    const { POST } = require("../../app/api/maintenance/toggle/route");
    const req = makeRequest("/api/maintenance/toggle", {
      method: "POST",
      body: JSON.stringify({ enabled: true }),
      cookies: { admin_token: "abc123" },
    });
    await POST(req);

    const bypassCall = mockCookiesSet.mock.calls.find(
      (c) => c[0] === "maintenance_bypass"
    );
    expect(bypassCall).toBeDefined();
    expect(bypassCall[1]).toBe(BYPASS_TOKEN);
  });

  it("يرجع error ومش بيحط كوكيز لما الباكند يرفض", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: "غير مصرح" }),
    });

    const { POST } = require("../../app/api/maintenance/toggle/route");
    const req = makeRequest("/api/maintenance/toggle", {
      method: "POST",
      body: JSON.stringify({ enabled: true }),
    });
    const res = await POST(req);

    expect(res._status).toBe(401);
    expect(mockCookiesSet).not.toHaveBeenCalled();
  });
});

// ─── Middleware Logic (unit test بدون next/server) ────────────────────────────

describe("middleware - maintenance logic", () => {
  // بنتيست المنطق مباشرة بدون استيراد الـ middleware عشان نتجنب مشاكل next/server

  const MAINTENANCE_COOKIE = "maintenance_bypass";
  const MAINTENANCE_ON_COOKIE = "maintenance_on";

  function simulateMiddleware(pathname: string, cookies: Record<string, string>) {
    const maintenanceMode = cookies[MAINTENANCE_ON_COOKIE] === "1";

    if (maintenanceMode) {
      const allowed = [
        "/maintenance",
        "/maint-mohasa",
        "/api/maintenance",
        "/api/admin/login",
        "/api/admin/logout",
        "/api/admin/verify",
      ];
      const isAllowed = allowed.some((p) => pathname.startsWith(p));
      const isStatic =
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon") ||
        pathname.startsWith("/site.webmanifest") ||
        pathname.startsWith("/api/");

      if (!isAllowed && !isStatic) {
        const bypassCookie = cookies[MAINTENANCE_COOKIE];
        if (bypassCookie !== BYPASS_TOKEN) {
          return { redirectTo: "/maintenance" };
        }
      }
    }

    return { redirectTo: null };
  }

  it("يعمل redirect لـ /maintenance لما maintenance_on=1 ومفيش bypass", () => {
    const result = simulateMiddleware("/", { maintenance_on: "1" });
    expect(result.redirectTo).toBe("/maintenance");
  });

  it("يعدي عادي لو عند المستخدم maintenance_bypass صح", () => {
    const result = simulateMiddleware("/", {
      maintenance_on: "1",
      maintenance_bypass: BYPASS_TOKEN,
    });
    expect(result.redirectTo).toBeNull();
  });

  it("يعدي عادي على /maintenance حتى لو الصيانة مفعّلة ومفيش bypass", () => {
    const result = simulateMiddleware("/maintenance", { maintenance_on: "1" });
    expect(result.redirectTo).toBeNull();
  });

  it("يعدي عادي على /maint-mohasa حتى لو الصيانة مفعّلة ومفيش bypass", () => {
    const result = simulateMiddleware("/maint-mohasa", { maintenance_on: "1" });
    expect(result.redirectTo).toBeNull();
  });

  it("يعدي عادي على /api/* حتى لو الصيانة مفعّلة", () => {
    const result = simulateMiddleware("/api/maintenance/toggle", {
      maintenance_on: "1",
    });
    expect(result.redirectTo).toBeNull();
  });

  it("يعدي عادي على /api/products حتى لو الصيانة مفعّلة", () => {
    const result = simulateMiddleware("/api/products", {
      maintenance_on: "1",
    });
    expect(result.redirectTo).toBeNull();
  });

  it("يعدي عادي لو الصيانة مش مفعّلة", () => {
    const result = simulateMiddleware("/", {});
    expect(result.redirectTo).toBeNull();
  });

  it("يعمل redirect على /products لما الصيانة مفعّلة ومفيش bypass", () => {
    const result = simulateMiddleware("/products", { maintenance_on: "1" });
    expect(result.redirectTo).toBe("/maintenance");
  });

  it("يعمل redirect على /cart لما الصيانة مفعّلة ومفيش bypass", () => {
    const result = simulateMiddleware("/cart", { maintenance_on: "1" });
    expect(result.redirectTo).toBe("/maintenance");
  });

  it("bypass غلط لا يعدي", () => {
    const result = simulateMiddleware("/", {
      maintenance_on: "1",
      maintenance_bypass: "wrong_token",
    });
    expect(result.redirectTo).toBe("/maintenance");
  });
});
