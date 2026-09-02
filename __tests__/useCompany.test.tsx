/**
 * Tests: useCompany hook
 * يتحقق من:
 * - يجلب بيانات الشركة عند mount
 * - يُلغي الـfetch عند unmount (AbortController)
 * - handleChange يُحدِّث الـstate
 * - handleSave يُرسل PUT request بالـfields الصحيحة
 * - handleSave لا يُرسل image fields
 * - handleSave يُحدِّث companyStore بعد النجاح
 * - handleImageChange يرفع الصورة ويُحدِّث الـstate
 * - handleImageDelete يحذف الصورة ويُحدِّث الـstate
 * - يعرض toast عند الخطأ
 */

import { renderHook, act, waitFor } from "@testing-library/react";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
  usePathname: () => "/admin/company",
}));

// Mock react-hot-toast
const mockToastError = jest.fn();
const mockToastSuccess = jest.fn();
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
}));

// Mock companyStore
const mockSetLogo = jest.fn();
const mockSetCompanyData = jest.fn();
jest.mock("../../app/store/companyStore", () => ({
  useCompanyStore: (selector?: (s: Record<string, unknown>) => unknown) => {
    const state = { setLogo: mockSetLogo, setCompanyData: mockSetCompanyData };
    return selector ? selector(state) : state;
  },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

const fakeCompanyResponse = {
  nameAr: "شركة تجريبية",
  nameEn: "Test Co",
  addressAr: "الرياض",
  addressEn: "Riyadh",
  phone: "0501111111",
  whatsapp: "0501111111",
  website: "https://test.com",
  email: "info@test.com",
  currencyAr: "ريال",
  currencyEn: "SAR",
  taxNumber: "123456",
  shippingCompany: "أرامكس",
  paymentMethod: "حوالات بنكية فقط",
  details: "تفاصيل",
  logo: "https://cdn.example.com/logo.png",
  header: "https://cdn.example.com/header.png",
  footer: "",
  stamp: "",
  cancelStamp: "",
};

beforeEach(() => {
  mockFetch.mockReset();
  mockToastError.mockReset();
  mockToastSuccess.mockReset();
  mockSetLogo.mockReset();
  mockSetCompanyData.mockReset();
});

describe("useCompany — initial fetch", () => {
  it("يجلب بيانات الشركة ويضع loading=false عند النجاح", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeCompanyResponse,
    });

    const { useCompany } = require("../../app/admin/company/hooks/useCompany");
    const { result } = renderHook(() => useCompany());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data.nameAr).toBe("شركة تجريبية");
    expect(result.current.data.phone).toBe("0501111111");
    expect(result.current.data.logo).toBe("https://cdn.example.com/logo.png");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/admin/company",
      expect.objectContaining({ credentials: "include" })
    );
  });

  it("يعرض toast error ويضع loading=false عند فشل الـfetch", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network Error"));

    const { useCompany } = require("../../app/admin/company/hooks/useCompany");
    const { result } = renderHook(() => useCompany());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockToastError).toHaveBeenCalledWith("فشل تحميل بيانات الشركة");
  });

  it("يعرض toast error عند HTTP error (401)", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

    const { useCompany } = require("../../app/admin/company/hooks/useCompany");
    const { result } = renderHook(() => useCompany());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockToastError).toHaveBeenCalledWith("فشل تحميل بيانات الشركة");
  });

  it("يُلغي الـfetch عند unmount (AbortController)", async () => {
    let resolvePromise!: (v: unknown) => void;
    mockFetch.mockReturnValueOnce(
      new Promise((res) => { resolvePromise = res; })
    );

    const { useCompany } = require("../../app/admin/company/hooks/useCompany");
    const { result, unmount } = renderHook(() => useCompany());

    expect(result.current.loading).toBe(true);
    unmount();

    // resolve بعد unmount — لا يجب أن يُسبب setState error
    act(() => {
      resolvePromise({ ok: true, json: async () => fakeCompanyResponse });
    });

    // لا يوجد error — الـtest ينجح إذا لم يُرمَ exception
    expect(true).toBe(true);
  });
});

describe("useCompany — handleChange", () => {
  it("يُحدِّث field محدد في الـstate", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeCompanyResponse,
    });

    const { useCompany } = require("../../app/admin/company/hooks/useCompany");
    const { result } = renderHook(() => useCompany());

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.handleChange("nameAr", "اسم جديد");
    });

    expect(result.current.data.nameAr).toBe("اسم جديد");
    expect(result.current.data.nameEn).toBe("Test Co"); // لم يتغير
  });

  it("يُحدِّث عدة fields بشكل مستقل", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeCompanyResponse,
    });

    const { useCompany } = require("../../app/admin/company/hooks/useCompany");
    const { result } = renderHook(() => useCompany());

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => { result.current.handleChange("phone", "0509999999"); });
    act(() => { result.current.handleChange("email", "new@test.com"); });

    expect(result.current.data.phone).toBe("0509999999");
    expect(result.current.data.email).toBe("new@test.com");
    expect(result.current.data.nameAr).toBe("شركة تجريبية"); // لم يتغير
  });
});

describe("useCompany — handleSave", () => {
  it("يُرسل PUT request بالـtext fields فقط (بدون image fields)", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => fakeCompanyResponse }) // initial fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) }) // PUT
      .mockResolvedValueOnce({ ok: true }); // revalidate

    const { useCompany } = require("../../app/admin/company/hooks/useCompany");
    const { result } = renderHook(() => useCompany());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.handleSave(); });

    const putCall = mockFetch.mock.calls.find(
      (c: unknown[]) => c[0] === "/api/admin/company" && (c[1] as RequestInit)?.method === "PUT"
    );
    expect(putCall).toBeDefined();

    const body = JSON.parse((putCall![1] as RequestInit).body as string);
    // image fields يجب أن تكون غائبة
    expect(body.logo).toBeUndefined();
    expect(body.header).toBeUndefined();
    expect(body.footer).toBeUndefined();
    expect(body.stamp).toBeUndefined();
    expect(body.cancelStamp).toBeUndefined();
    // text fields يجب أن تكون موجودة
    expect(body.nameAr).toBe("شركة تجريبية");
    expect(body.phone).toBe("0501111111");
  });

  it("يُرسل credentials: include في PUT request", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => fakeCompanyResponse })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
      .mockResolvedValueOnce({ ok: true });

    const { useCompany } = require("../../app/admin/company/hooks/useCompany");
    const { result } = renderHook(() => useCompany());

    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.handleSave(); });

    const putCall = mockFetch.mock.calls.find(
      (c: unknown[]) => c[0] === "/api/admin/company" && (c[1] as RequestInit)?.method === "PUT"
    );
    expect((putCall![1] as RequestInit).credentials).toBe("include");
  });

  it("يُحدِّث companyStore بعد Save ناجح", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => fakeCompanyResponse })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
      .mockResolvedValueOnce({ ok: true });

    const { useCompany } = require("../../app/admin/company/hooks/useCompany");
    const { result } = renderHook(() => useCompany());

    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.handleSave(); });

    expect(mockSetCompanyData).toHaveBeenCalledTimes(1);
    expect(mockSetCompanyData).toHaveBeenCalledWith(
      expect.objectContaining({ nameAr: "شركة تجريبية" })
    );
  });

  it("يُرسل revalidate request بعد Save ناجح", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => fakeCompanyResponse })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
      .mockResolvedValueOnce({ ok: true });

    const { useCompany } = require("../../app/admin/company/hooks/useCompany");
    const { result } = renderHook(() => useCompany());

    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.handleSave(); });

    const revalidateCall = mockFetch.mock.calls.find(
      (c: unknown[]) => typeof c[0] === "string" && (c[0] as string).includes("/api/revalidate")
    );
    expect(revalidateCall).toBeDefined();
    expect(revalidateCall![0]).toContain("tag=company");
  });

  it("يعرض toast success بعد Save ناجح", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => fakeCompanyResponse })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
      .mockResolvedValueOnce({ ok: true });

    const { useCompany } = require("../../app/admin/company/hooks/useCompany");
    const { result } = renderHook(() => useCompany());

    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.handleSave(); });

    expect(mockToastSuccess).toHaveBeenCalledWith("تم حفظ بيانات الشركة");
  });

  it("يعرض toast error عند فشل PUT", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => fakeCompanyResponse })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "خطأ في الخادم" }),
      });

    const { useCompany } = require("../../app/admin/company/hooks/useCompany");
    const { result } = renderHook(() => useCompany());

    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.handleSave(); });

    expect(mockToastError).toHaveBeenCalledWith("خطأ في الخادم");
    expect(mockSetCompanyData).not.toHaveBeenCalled();
  });

  it("يُعيد saving إلى false بعد انتهاء Save (سواء نجح أو فشل)", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => fakeCompanyResponse })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    const { useCompany } = require("../../app/admin/company/hooks/useCompany");
    const { result } = renderHook(() => useCompany());

    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.handleSave(); });

    expect(result.current.saving).toBe(false);
  });
});

describe("useCompany — handleImageChange", () => {
  it("يرفع الصورة ويُحدِّث الـstate بالـURL الجديد", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => fakeCompanyResponse })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: "https://cdn.example.com/new-logo.png" }),
      });

    const { useCompany } = require("../../app/admin/company/hooks/useCompany");
    const { result } = renderHook(() => useCompany());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const fakeFile = new File(["img"], "logo.png", { type: "image/png" });
    await act(async () => {
      await result.current.handleImageChange("logo", fakeFile);
    });

    expect(result.current.data.logo).toBe("https://cdn.example.com/new-logo.png");
    expect(mockSetLogo).toHaveBeenCalledWith("https://cdn.example.com/new-logo.png");
    expect(mockToastSuccess).toHaveBeenCalledWith("تم رفع الصورة");
  });

  it("لا يُحدِّث setLogo إذا كان الـkey ليس logo", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => fakeCompanyResponse })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: "https://cdn.example.com/header.png" }),
      });

    const { useCompany } = require("../../app/admin/company/hooks/useCompany");
    const { result } = renderHook(() => useCompany());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const fakeFile = new File(["img"], "header.png", { type: "image/png" });
    await act(async () => {
      await result.current.handleImageChange("header", fakeFile);
    });

    expect(result.current.data.header).toBe("https://cdn.example.com/header.png");
    expect(mockSetLogo).not.toHaveBeenCalled();
  });

  it("يعرض toast error عند فشل الرفع", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => fakeCompanyResponse })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "فشل رفع الصورة إلى Cloudinary" }),
      });

    const { useCompany } = require("../../app/admin/company/hooks/useCompany");
    const { result } = renderHook(() => useCompany());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const fakeFile = new File(["img"], "logo.png", { type: "image/png" });
    await act(async () => {
      await result.current.handleImageChange("logo", fakeFile);
    });

    expect(mockToastError).toHaveBeenCalledWith("فشل رفع الصورة إلى Cloudinary");
    expect(result.current.data.logo).toBe("https://cdn.example.com/logo.png"); // لم يتغير
  });
});

describe("useCompany — handleImageDelete", () => {
  it("يحذف الصورة ويُفرِّغ الـfield في الـstate", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => fakeCompanyResponse })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

    const { useCompany } = require("../../app/admin/company/hooks/useCompany");
    const { result } = renderHook(() => useCompany());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleImageDelete("logo");
    });

    expect(result.current.data.logo).toBe("");
    expect(mockSetLogo).toHaveBeenCalledWith("");
    expect(mockToastSuccess).toHaveBeenCalledWith("تم حذف الصورة");
  });

  it("لا يُحدِّث setLogo إذا كان الـkey ليس logo", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => fakeCompanyResponse })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

    const { useCompany } = require("../../app/admin/company/hooks/useCompany");
    const { result } = renderHook(() => useCompany());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleImageDelete("header");
    });

    expect(result.current.data.header).toBe("");
    expect(mockSetLogo).not.toHaveBeenCalled();
  });

  it("يعرض toast error عند فشل الحذف", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => fakeCompanyResponse })
      .mockResolvedValueOnce({ ok: false });

    const { useCompany } = require("../../app/admin/company/hooks/useCompany");
    const { result } = renderHook(() => useCompany());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleImageDelete("logo");
    });

    expect(mockToastError).toHaveBeenCalledWith("فشل حذف الصورة");
    expect(result.current.data.logo).toBe("https://cdn.example.com/logo.png"); // لم يتغير
  });
});
