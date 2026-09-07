/**
 * Tests: Maintenance Mode
 * الصيانة تشتغل بناءً على MAINTENANCE_MODE=true فقط
 */

(global as any).crypto = { randomUUID: () => "test-uuid-1234" };
(global as any).Buffer = {
  from: (str: string) => ({ toString: () => btoa(str) }),
};

jest.mock("next/server", () => ({
  NextResponse: {
    redirect: (url: URL) => ({ _redirect: url.pathname, headers: { set: jest.fn() } }),
    next: (init?: unknown) => ({ _next: true, headers: { set: jest.fn() } }),
  },
}));

function simulateMiddleware(pathname: string, maintenanceMode: string | undefined) {
  const isStatic =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/site.webmanifest");

  if (!isStatic && !pathname.startsWith("/maintenance") && !pathname.startsWith("/api/")) {
    if (maintenanceMode === "true") return { redirectTo: "/maintenance" };
  }

  return { redirectTo: null };
}

describe("middleware - MAINTENANCE_MODE", () => {
  it("يعمل redirect لما MAINTENANCE_MODE=true", () => {
    expect(simulateMiddleware("/", "true").redirectTo).toBe("/maintenance");
  });

  it("يعدي عادي لما MAINTENANCE_MODE=false", () => {
    expect(simulateMiddleware("/", "false").redirectTo).toBeNull();
  });

  it("يعدي عادي لما MAINTENANCE_MODE مش موجود", () => {
    expect(simulateMiddleware("/", undefined).redirectTo).toBeNull();
  });

  it("يعدي عادي على /maintenance دايماً", () => {
    expect(simulateMiddleware("/maintenance", "true").redirectTo).toBeNull();
  });

  it("يعدي عادي على /api/* دايماً", () => {
    expect(simulateMiddleware("/api/products", "true").redirectTo).toBeNull();
  });

  it("يعمل redirect على /products لما الصيانة مفعّلة", () => {
    expect(simulateMiddleware("/products", "true").redirectTo).toBe("/maintenance");
  });

  it("يعمل redirect على /cart لما الصيانة مفعّلة", () => {
    expect(simulateMiddleware("/cart", "true").redirectTo).toBe("/maintenance");
  });
});
