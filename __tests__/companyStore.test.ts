/**
 * Tests: companyStore (Zustand)
 * يتحقق من:
 * - fetchCompany تجلب البيانات وتضع fetched=true
 * - fetchCompany لا تُعيد الـfetch إذا fetched=true (الـguard)
 * - setLogo تُحدِّث logo فقط
 * - setCompanyData تُحدِّث fields جزئية بدون مسح الباقي
 * - resetFetched تُعيد fetched إلى false
 * - fetchCompany تتعامل مع network error بدون crash
 */

// نحتاج نعمل reset للـstore بين كل test
let storeModule: typeof import("../../app/store/companyStore");

const mockFetch = jest.fn();
global.fetch = mockFetch;

// helper: بيانات شركة وهمية
const fakeCompany = {
  logo: "https://cdn.example.com/logo.png",
  nameAr: "شركة الاختبار",
  nameEn: "Test Company",
  phone: "0501234567",
  whatsapp: "0501234567",
  email: "test@example.com",
  website: "https://example.com",
  details: "تفاصيل الشركة",
};

beforeEach(() => {
  jest.resetModules();
  mockFetch.mockReset();
  // إعادة تحميل الـmodule لإعادة تهيئة الـstore من الصفر
  storeModule = require("../../app/store/companyStore");
});

describe("companyStore — fetchCompany", () => {
  it("تجلب البيانات وتضع fetched=true عند نجاح الـfetch", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeCompany,
    });

    const store = storeModule.useCompanyStore.getState();
    await store.fetchCompany();

    const state = storeModule.useCompanyStore.getState();
    expect(state.fetched).toBe(true);
    expect(state.nameAr).toBe("شركة الاختبار");
    expect(state.nameEn).toBe("Test Company");
    expect(state.phone).toBe("0501234567");
    expect(state.email).toBe("test@example.com");
    expect(state.logo).toBe("https://cdn.example.com/logo.png");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith("/api/company");
  });

  it("لا تُعيد الـfetch إذا fetched=true بالفعل", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeCompany,
    });

    const store = storeModule.useCompanyStore.getState();
    await store.fetchCompany();
    await store.fetchCompany(); // مرة ثانية
    await store.fetchCompany(); // مرة ثالثة

    expect(mockFetch).toHaveBeenCalledTimes(1); // fetch واحدة فقط
  });

  it("تُكمل logo الـURL إذا كان relative path", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...fakeCompany, logo: "/uploads/logo.png" }),
    });

    const store = storeModule.useCompanyStore.getState();
    await store.fetchCompany();

    const state = storeModule.useCompanyStore.getState();
    expect(state.logo).toContain("/uploads/logo.png");
    expect(state.logo).not.toBe("/uploads/logo.png"); // يجب أن يكون absolute
  });

  it("تُبقي logo فارغاً إذا لم يكن موجوداً في الـresponse", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...fakeCompany, logo: "" }),
    });

    const store = storeModule.useCompanyStore.getState();
    await store.fetchCompany();

    const state = storeModule.useCompanyStore.getState();
    expect(state.logo).toBe("");
  });

  it("لا تُغيِّر الـstate ولا تـcrash عند network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network Error"));

    const store = storeModule.useCompanyStore.getState();
    await expect(store.fetchCompany()).resolves.not.toThrow();

    const state = storeModule.useCompanyStore.getState();
    expect(state.fetched).toBe(false);
    expect(state.nameAr).toBe("");
  });

  it("لا تُغيِّر الـstate إذا كان الـresponse غير ok", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    const store = storeModule.useCompanyStore.getState();
    await store.fetchCompany();

    const state = storeModule.useCompanyStore.getState();
    expect(state.fetched).toBe(false);
    expect(state.nameAr).toBe("");
  });
});

describe("companyStore — setLogo", () => {
  it("تُحدِّث logo فقط بدون مسح باقي الـfields", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeCompany,
    });

    const store = storeModule.useCompanyStore.getState();
    await store.fetchCompany();

    storeModule.useCompanyStore.getState().setLogo("https://new-logo.com/logo.png");

    const state = storeModule.useCompanyStore.getState();
    expect(state.logo).toBe("https://new-logo.com/logo.png");
    expect(state.nameAr).toBe("شركة الاختبار"); // لم يتغير
    expect(state.fetched).toBe(true); // لم يتغير
  });

  it("تقبل string فارغ لمسح الـlogo", () => {
    storeModule.useCompanyStore.getState().setLogo("");
    expect(storeModule.useCompanyStore.getState().logo).toBe("");
  });
});

describe("companyStore — setCompanyData", () => {
  it("تُحدِّث fields محددة فقط بدون مسح الباقي", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeCompany,
    });

    const store = storeModule.useCompanyStore.getState();
    await store.fetchCompany();

    storeModule.useCompanyStore.getState().setCompanyData({
      nameAr: "اسم جديد",
      phone: "0509999999",
    });

    const state = storeModule.useCompanyStore.getState();
    expect(state.nameAr).toBe("اسم جديد");
    expect(state.phone).toBe("0509999999");
    expect(state.nameEn).toBe("Test Company"); // لم يتغير
    expect(state.email).toBe("test@example.com"); // لم يتغير
    expect(state.logo).toBe("https://cdn.example.com/logo.png"); // لم يتغير
    expect(state.fetched).toBe(true); // لم يتغير
  });

  it("تقبل object فارغ بدون تغيير أي شيء", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeCompany,
    });

    const store = storeModule.useCompanyStore.getState();
    await store.fetchCompany();

    const before = { ...storeModule.useCompanyStore.getState() };
    storeModule.useCompanyStore.getState().setCompanyData({});
    const after = storeModule.useCompanyStore.getState();

    expect(after.nameAr).toBe(before.nameAr);
    expect(after.logo).toBe(before.logo);
  });
});

describe("companyStore — resetFetched", () => {
  it("تُعيد fetched إلى false وتسمح بإعادة الـfetch", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => fakeCompany })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...fakeCompany, nameAr: "اسم محدَّث" }) });

    const store = storeModule.useCompanyStore.getState();
    await store.fetchCompany();
    expect(storeModule.useCompanyStore.getState().fetched).toBe(true);

    storeModule.useCompanyStore.getState().resetFetched();
    expect(storeModule.useCompanyStore.getState().fetched).toBe(false);

    await storeModule.useCompanyStore.getState().fetchCompany();
    expect(mockFetch).toHaveBeenCalledTimes(2); // fetch مرة ثانية
    expect(storeModule.useCompanyStore.getState().nameAr).toBe("اسم محدَّث");
  });
});
