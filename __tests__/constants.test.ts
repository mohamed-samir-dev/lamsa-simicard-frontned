/**
 * Tests: admin/company/constants
 * يتحقق من:
 * - toFullUrl تُكمل الـrelative URLs
 * - toFullUrl لا تُغيِّر الـabsolute URLs
 * - withCacheBust تُضيف timestamp
 * - withCacheBust تُزيل الـquery القديم
 * - defaultData يحتوي على كل الـfields المطلوبة
 * - fields و imageFields تحتوي على الـkeys الصحيحة
 */

// نحتاج mock لـprocess.env قبل import
const ORIGINAL_ENV = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV };
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe("toFullUrl", () => {
  it("تُرجع URL كما هو إذا كان يبدأ بـhttp://", () => {
    const { toFullUrl } = require("../../app/admin/company/constants");
    expect(toFullUrl("http://example.com/logo.png")).toBe("http://example.com/logo.png");
  });

  it("تُرجع URL كما هو إذا كان يبدأ بـhttps://", () => {
    const { toFullUrl } = require("../../app/admin/company/constants");
    expect(toFullUrl("https://cdn.cloudinary.com/logo.png")).toBe("https://cdn.cloudinary.com/logo.png");
  });

  it("تُضيف الـAPI base URL للـrelative paths", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://backend.railway.app";
    const { toFullUrl } = require("../../app/admin/company/constants");
    expect(toFullUrl("/uploads/logo.png")).toBe("https://backend.railway.app/uploads/logo.png");
  });

  it("تُرجع string فارغ إذا كان الـinput فارغاً", () => {
    const { toFullUrl } = require("../../app/admin/company/constants");
    expect(toFullUrl("")).toBe("");
  });

  it("تُرجع undefined/falsy كما هو", () => {
    const { toFullUrl } = require("../../app/admin/company/constants");
    expect(toFullUrl(undefined as unknown as string)).toBeFalsy();
  });
});

describe("withCacheBust", () => {
  it("تُضيف query parameter ?t= مع timestamp", () => {
    const { withCacheBust } = require("../../app/admin/company/constants");
    const result = withCacheBust("https://cdn.example.com/logo.png");
    expect(result).toMatch(/\?t=\d+$/);
    expect(result).toContain("https://cdn.example.com/logo.png");
  });

  it("تُزيل الـquery القديم وتُضيف timestamp جديد", () => {
    const { withCacheBust } = require("../../app/admin/company/constants");
    const result = withCacheBust("https://cdn.example.com/logo.png?t=1234567890");
    expect(result).toMatch(/\?t=\d+$/);
    expect(result).not.toContain("t=1234567890");
  });

  it("تُرجع string فارغ إذا كان الـinput فارغاً", () => {
    const { withCacheBust } = require("../../app/admin/company/constants");
    expect(withCacheBust("")).toBe("");
  });

  it("الـtimestamp يكون رقماً صحيحاً", () => {
    const before = Date.now();
    const { withCacheBust } = require("../../app/admin/company/constants");
    const result = withCacheBust("https://cdn.example.com/logo.png");
    const after = Date.now();
    const ts = parseInt(result.split("?t=")[1]);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});

describe("defaultData", () => {
  it("يحتوي على كل الـtext fields المطلوبة", () => {
    const { defaultData } = require("../../app/admin/company/constants");
    const requiredTextFields = [
      "nameAr", "nameEn", "addressAr", "addressEn",
      "phone", "whatsapp", "website", "email",
      "currencyAr", "currencyEn", "taxNumber",
      "shippingCompany", "paymentMethod", "details",
    ];
    for (const field of requiredTextFields) {
      expect(defaultData).toHaveProperty(field);
      expect(defaultData[field]).toBe("");
    }
  });

  it("يحتوي على كل الـimage fields المطلوبة", () => {
    const { defaultData } = require("../../app/admin/company/constants");
    const imageFields = ["logo", "header", "footer", "stamp", "cancelStamp"];
    for (const field of imageFields) {
      expect(defaultData).toHaveProperty(field);
      expect(defaultData[field]).toBe("");
    }
  });

  it("كل القيم الافتراضية strings فارغة", () => {
    const { defaultData } = require("../../app/admin/company/constants");
    for (const [, value] of Object.entries(defaultData)) {
      expect(typeof value).toBe("string");
      expect(value).toBe("");
    }
  });
});

describe("fields config", () => {
  it("كل field له key و label", () => {
    const { fields } = require("../../app/admin/company/constants");
    for (const field of fields) {
      expect(field).toHaveProperty("key");
      expect(field).toHaveProperty("label");
      expect(typeof field.key).toBe("string");
      expect(typeof field.label).toBe("string");
      expect(field.key.length).toBeGreaterThan(0);
      expect(field.label.length).toBeGreaterThan(0);
    }
  });

  it("لا يوجد keys مكررة في fields", () => {
    const { fields } = require("../../app/admin/company/constants");
    const keys = fields.map((f: { key: string }) => f.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });
});

describe("imageFields config", () => {
  it("يحتوي على الـ5 image fields الصحيحة", () => {
    const { imageFields } = require("../../app/admin/company/constants");
    const expectedKeys = ["logo", "header", "footer", "stamp", "cancelStamp"];
    const actualKeys = imageFields.map((f: { key: string }) => f.key);
    expect(actualKeys).toEqual(expectedKeys);
  });

  it("كل image field له key و label", () => {
    const { imageFields } = require("../../app/admin/company/constants");
    for (const field of imageFields) {
      expect(field).toHaveProperty("key");
      expect(field).toHaveProperty("label");
    }
  });
});
