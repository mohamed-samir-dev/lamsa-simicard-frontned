/**
 * Tests: Next.js API Routes
 * يتحقق من:
 * - /api/company يستدعي /api/admin/company/public (وليس /api/admin/company)
 * - /api/admin/company GET يمرر الـcookies للـbackend
 * - /api/admin/company PUT يمرر الـbody والـcookies
 * - /api/admin/company/upload/[key] POST يمرر الـFormData
 * - /api/admin/company/image/[key] DELETE يمرر الـcookies
 * - /api/revalidate POST يستدعي revalidateTag
 */

// Mock next/server
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

// Mock next/cache
const mockRevalidateTag = jest.fn();
jest.mock("next/cache", () => ({
  revalidateTag: (tag: string) => mockRevalidateTag(tag),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

// Helper: بناء NextRequest وهمي
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
    headers: {
      get: (key: string) => (options.headers ?? {})[key] ?? null,
    },
    json: async () => JSON.parse(options.body as string ?? "{}"),
    formData: async () => options.body as FormData,
  };
}

beforeEach(() => {
  mockFetch.mockReset();
  mockRevalidateTag.mockReset();
  jest.resetModules();
});

// ─── /api/company ───────────────────────────────────────────────────────────

describe("GET /api/company", () => {
  it("يستدعي /api/admin/company/public وليس /api/admin/company", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ nameAr: "شركة", logo: "" }),
    });

    const { GET } = require("../../app/api/company/route");
    await GET();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/company/public");
    expect(calledUrl).not.toMatch(/\/api\/admin\/company$/);
  });

  it("يُرجع البيانات من الـbackend", async () => {
    const fakeData = { nameAr: "شركة", logo: "https://cdn.example.com/logo.png" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => fakeData,
    });

    const { GET } = require("../../app/api/company/route");
    const res = await GET();

    expect(res._data).toEqual(fakeData);
    expect(res._status).toBe(200);
  });
});

// ─── /api/admin/company ──────────────────────────────────────────────────────

describe("GET /api/admin/company", () => {
  it("يمرر الـcookies للـbackend", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ nameAr: "شركة" }),
    });

    const { GET } = require("../../app/api/admin/company/route");
    const req = makeRequest("/api/admin/company", {
      headers: { cookie: "admin_token=abc123" },
    });

    await GET(req);

    const calledInit = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = calledInit.headers as Record<string, string>;
    expect(headers.cookie).toBe("admin_token=abc123");
  });

  it("يُرجع error عند backend unavailable", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });

    const { GET } = require("../../app/api/admin/company/route");
    const req = makeRequest("/api/admin/company");
    const res = await GET(req);

    expect(res._status).toBe(503);
  });
});

describe("PUT /api/admin/company", () => {
  it("يمرر الـbody والـcookies للـbackend", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    const { PUT } = require("../../app/api/admin/company/route");
    const payload = { nameAr: "شركة جديدة", phone: "0501234567" };
    const req = makeRequest("/api/admin/company", {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: { cookie: "admin_token=abc123", "content-type": "application/json" },
    });

    await PUT(req);

    const [calledUrl, calledInit] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toContain("/api/admin/company");
    expect((calledInit as RequestInit & { method: string }).method).toBe("PUT");
    const headers = calledInit.headers as Record<string, string>;
    expect(headers.cookie).toBe("admin_token=abc123");
  });
});

// ─── /api/admin/company/upload/[key] ────────────────────────────────────────

describe("POST /api/admin/company/upload/[key]", () => {
  it("يمرر الـFormData والـcookies للـbackend", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ url: "https://cdn.example.com/logo.png" }),
    });

    const { POST } = require("../../app/api/admin/company/upload/[key]/route");
    const formData = new FormData();
    formData.append("image", new Blob(["img"]), "logo.png");

    const req = makeRequest("/api/admin/company/upload/logo", {
      method: "POST",
      body: formData,
      headers: { cookie: "admin_token=abc123" },
    });

    await POST(req, { params: Promise.resolve({ key: "logo" }) });

    const [calledUrl, calledInit] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toContain("/company/upload/logo");
    expect((calledInit as RequestInit & { method: string }).method).toBe("POST");
    const headers = calledInit.headers as Record<string, string>;
    expect(headers.cookie).toBe("admin_token=abc123");
  });
});

// ─── /api/admin/company/image/[key] ─────────────────────────────────────────

describe("DELETE /api/admin/company/image/[key]", () => {
  it("يمرر الـcookies للـbackend ويستدعي DELETE", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ success: true }),
    });

    const { DELETE } = require("../../app/api/admin/company/image/[key]/route");
    const req = makeRequest("/api/admin/company/image/logo", {
      method: "DELETE",
      headers: { cookie: "admin_token=abc123" },
    });

    await DELETE(req, { params: Promise.resolve({ key: "logo" }) });

    const [calledUrl, calledInit] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toContain("/company/image/logo");
    expect((calledInit as RequestInit & { method: string }).method).toBe("DELETE");
    const headers = calledInit.headers as Record<string, string>;
    expect(headers.cookie).toBe("admin_token=abc123");
  });
});

// ─── /api/revalidate ─────────────────────────────────────────────────────────

describe("POST /api/revalidate", () => {
  it("يستدعي revalidateTag بالـtag الصحيح", async () => {
    const { POST } = require("../../app/api/revalidate/route");
    const req = makeRequest("/api/revalidate", {
      method: "POST",
      searchParams: { tag: "company" },
    });

    const res = await POST(req);

    expect(mockRevalidateTag).toHaveBeenCalledWith("company");
    expect(res._data).toEqual({ revalidated: true });
  });

  it("لا يستدعي revalidateTag إذا لم يكن هناك tag", async () => {
    const { POST } = require("../../app/api/revalidate/route");
    const req = makeRequest("/api/revalidate", { method: "POST" });

    await POST(req);

    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });
});
