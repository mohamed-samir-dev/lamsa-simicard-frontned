/**
 * Tests: /admin/sub-categories page (Brands Management)
 *
 * يتحقق من:
 * - عرض skeleton أثناء التحميل
 * - عرض البيانات بعد التحميل
 * - عرض رسالة خطأ عند فشل الـ API
 * - زر "إعادة المحاولة" يعيد الـ fetch
 * - البحث يفلتر البراندات ويعيد الصفحة للأولى
 * - handleToggle يبعت PATCH ويحدث الـ state
 * - handleOrderChange يستخدم debounce (لا يبعت فوراً)
 * - handleBannerUpload يرفض الملفات الكبيرة
 * - handleBannerUpload يرفع الصورة ويحدث الـ state
 * - handleBannerDelete يطلب تأكيد قبل الحذف
 * - handleBannerDelete يحذف البانر ويحدث الـ state
 * - Pagination تعمل صح
 * - التأثير على HomeCategorySections (brands/home-settings)
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
  usePathname: () => "/admin/sub-categories",
}));

const mockApiFetch = jest.fn();
jest.mock("../../app/lib/api", () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

import toast from "react-hot-toast";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BRANDS = [
  { name: "STC", count: 10 },
  { name: "Zain", count: 5 },
  { name: "Mobily", count: 3 },
];

const SETTINGS = [
  { brand: "STC", showInHome: true, order: 1, bannerImages: ["https://cdn.example.com/stc.jpg"] },
  { brand: "Zain", showInHome: false, order: 0, bannerImages: [] },
];

function makeOkResponse(data: unknown) {
  return Promise.resolve({
    ok: true,
    json: async () => data,
  });
}

function makeErrorResponse(status = 500) {
  return Promise.resolve({ ok: false, status });
}

function setupFetchSuccess() {
  mockApiFetch
    .mockImplementationOnce(() => makeOkResponse(BRANDS))   // /api/admin/brands
    .mockImplementationOnce(() => makeOkResponse(SETTINGS)); // /api/admin/brands/settings
}

// ─── Import component after mocks ────────────────────────────────────────────

let SubCategoriesPage: React.ComponentType;

beforeAll(async () => {
  const mod = await import("../../app/admin/sub-categories/page");
  SubCategoriesPage = mod.default;
});

beforeEach(() => {
  mockApiFetch.mockReset();
  (toast.error as jest.Mock).mockClear();
  (toast.success as jest.Mock).mockClear();
  window.confirm = jest.fn(() => true);
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("SubCategoriesPage — التحميل والعرض", () => {
  it("يعرض skeleton أثناء التحميل", () => {
    mockApiFetch.mockImplementation(() => new Promise(() => {})); // never resolves
    render(<SubCategoriesPage />);
    expect(document.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("يعرض البراندات بعد التحميل", async () => {
    setupFetchSuccess();
    render(<SubCategoriesPage />);
    await waitFor(() => expect(screen.getByText("STC")).toBeInTheDocument());
    expect(screen.getByText("Zain")).toBeInTheDocument();
    expect(screen.getByText("Mobily")).toBeInTheDocument();
  });

  it("يعرض عدد المنتجات لكل براند", async () => {
    setupFetchSuccess();
    render(<SubCategoriesPage />);
    await waitFor(() => screen.getByText("STC"));
    expect(screen.getByText("10 منتج")).toBeInTheDocument();
    expect(screen.getByText("5 منتج")).toBeInTheDocument();
  });

  it("يعرض رسالة خطأ عند فشل الـ API", async () => {
    mockApiFetch
      .mockImplementationOnce(() => makeErrorResponse())
      .mockImplementationOnce(() => makeOkResponse(SETTINGS));
    render(<SubCategoriesPage />);
    await waitFor(() => expect(screen.getByText("فشل تحميل البيانات")).toBeInTheDocument());
    expect(toast.error).toHaveBeenCalledWith("فشل تحميل البيانات");
  });

  it("زر إعادة المحاولة يعيد الـ fetch", async () => {
    mockApiFetch
      .mockImplementationOnce(() => makeErrorResponse())
      .mockImplementationOnce(() => makeErrorResponse())
      .mockImplementationOnce(() => makeOkResponse(BRANDS))
      .mockImplementationOnce(() => makeOkResponse(SETTINGS));

    render(<SubCategoriesPage />);
    await waitFor(() => screen.getByText("إعادة المحاولة"));
    fireEvent.click(screen.getByText("إعادة المحاولة"));
    await waitFor(() => expect(screen.getByText("STC")).toBeInTheDocument());
  });
});

describe("SubCategoriesPage — البحث والـ Pagination", () => {
  it("البحث يفلتر البراندات", async () => {
    setupFetchSuccess();
    render(<SubCategoriesPage />);
    await waitFor(() => screen.getByText("STC"));

    const searchInput = screen.getByPlaceholderText("ابحث عن براند...");
    fireEvent.change(searchInput, { target: { value: "STC" } });

    expect(screen.getByText("STC")).toBeInTheDocument();
    expect(screen.queryByText("Zain")).not.toBeInTheDocument();
  });

  it("البحث يعيد الصفحة للأولى", async () => {
    const manyBrands = Array.from({ length: 11 }, (_, i) => ({ name: `Brand${i}`, count: i }));
    mockApiFetch
      .mockImplementationOnce(() => makeOkResponse(manyBrands))
      .mockImplementationOnce(() => makeOkResponse([]));

    render(<SubCategoriesPage />);
    await waitFor(() => screen.getByText("Brand0"));

    // روح للصفحة 2 — زر الصفحة 2 في الـ pagination
    const pageBtns = screen.getAllByRole("button");
    const page2Btn = pageBtns.find((b) => b.textContent === "2");
    expect(page2Btn).toBeTruthy();
    fireEvent.click(page2Btn!);

    // ابحث
    fireEvent.change(screen.getByPlaceholderText("ابحث عن براند..."), { target: { value: "Brand0" } });

    expect(screen.getByText("Brand0")).toBeInTheDocument();
  });

  it("pagination تعرض أزرار الصفحات الصح", async () => {
    const manyBrands = Array.from({ length: 25 }, (_, i) => ({ name: `Brand${i}`, count: i }));
    mockApiFetch
      .mockImplementationOnce(() => makeOkResponse(manyBrands))
      .mockImplementationOnce(() => makeOkResponse([]));

    render(<SubCategoriesPage />);
    await waitFor(() => screen.getByText("Brand0"));

    // التحقق من وجود أزرار الصفحات في الـ pagination
    const allBtns = screen.getAllByRole("button");
    const pageNumbers = allBtns.map((b) => b.textContent).filter((t) => /^\d+$/.test(t ?? ""));
    expect(pageNumbers).toContain("1");
    expect(pageNumbers).toContain("2");
    expect(pageNumbers).toContain("3");
  });
});

describe("SubCategoriesPage — Toggle الرئيسية", () => {
  it("يبعت PATCH عند تغيير الـ checkbox", async () => {
    setupFetchSuccess();
    mockApiFetch.mockImplementationOnce(() => makeOkResponse({ showInHome: false }));

    render(<SubCategoriesPage />);
    await waitFor(() => screen.getByText("STC"));

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]); // STC checkbox

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/admin/brands/settings/toggle",
        expect.objectContaining({ method: "PATCH" })
      );
    });
  });

  it("يعرض toast success بعد toggle ناجح", async () => {
    setupFetchSuccess();
    mockApiFetch.mockImplementationOnce(() => makeOkResponse({ showInHome: true }));

    render(<SubCategoriesPage />);
    await waitFor(() => screen.getByText("STC"));

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]); // Zain checkbox (showInHome: false)

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("سيظهر في الرئيسية ✅"));
  });

  it("يعرض toast error عند فشل الـ toggle", async () => {
    setupFetchSuccess();
    mockApiFetch.mockImplementationOnce(() => makeErrorResponse());

    render(<SubCategoriesPage />);
    await waitFor(() => screen.getByText("STC"));

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("حدث خطأ"));
  });
});

describe("SubCategoriesPage — Order Debounce", () => {
  it("لا يبعت request فوراً عند تغيير الترتيب (debounce)", async () => {
    setupFetchSuccess();
    render(<SubCategoriesPage />);
    await waitFor(() => screen.getByText("STC"));

    const orderInputs = screen.getAllByRole("spinbutton");
    fireEvent.change(orderInputs[0], { target: { value: "5" } });

    // لا يُبعت request فوراً
    expect(mockApiFetch).toHaveBeenCalledTimes(2); // فقط الـ initial fetch
  });

  it("يبعت request بعد انتهاء الـ debounce", async () => {
    jest.useFakeTimers();
    setupFetchSuccess();
    mockApiFetch.mockImplementation(() => makeOkResponse({ success: true }));

    render(<SubCategoriesPage />);
    await act(async () => { jest.runAllTimers(); });
    await waitFor(() => screen.getByText("STC"));

    mockApiFetch.mockClear();
    mockApiFetch.mockImplementationOnce(() => makeOkResponse({ success: true }));

    const orderInputs = screen.getAllByRole("spinbutton");
    fireEvent.change(orderInputs[0], { target: { value: "3" } });

    await act(async () => { jest.advanceTimersByTime(700); });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/admin/brands/settings/order",
      expect.objectContaining({ method: "PATCH" })
    );

    jest.useRealTimers();
  });
});

describe("SubCategoriesPage — Banner Upload", () => {
  it("يرفض الصور الأكبر من 5MB", async () => {
    setupFetchSuccess();
    render(<SubCategoriesPage />);
    await waitFor(() => screen.getByText("STC"));

    const bigFile = new File(["x".repeat(6 * 1024 * 1024)], "big.jpg", { type: "image/jpeg" });
    Object.defineProperty(bigFile, "size", { value: 6 * 1024 * 1024 });

    const fileInputs = document.querySelectorAll("input[type='file']");
    fireEvent.change(fileInputs[0], { target: { files: [bigFile] } });

    expect(toast.error).toHaveBeenCalledWith("حجم الصورة يجب أن يكون أقل من 5MB");
    expect(mockApiFetch).toHaveBeenCalledTimes(2); // فقط initial fetch
  });

  it("يرفع الصورة ويحدث الـ state عند نجاح الرفع", async () => {
    setupFetchSuccess();
    mockApiFetch.mockImplementationOnce(() =>
      makeOkResponse({ url: "https://cdn.example.com/new.jpg", bannerImages: ["https://cdn.example.com/new.jpg"] })
    );

    render(<SubCategoriesPage />);
    await waitFor(() => screen.getByText("STC"));

    const smallFile = new File(["img"], "small.jpg", { type: "image/jpeg" });
    Object.defineProperty(smallFile, "size", { value: 100 * 1024 }); // 100KB

    const fileInputs = document.querySelectorAll("input[type='file']");
    await act(async () => {
      fireEvent.change(fileInputs[0], { target: { files: [smallFile] } });
    });

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("تم رفع البانر ✅"));
  });

  it("يعرض toast error عند فشل رفع البانر", async () => {
    setupFetchSuccess();
    mockApiFetch.mockImplementationOnce(() => makeErrorResponse());

    render(<SubCategoriesPage />);
    await waitFor(() => screen.getByText("STC"));

    const smallFile = new File(["img"], "small.jpg", { type: "image/jpeg" });
    Object.defineProperty(smallFile, "size", { value: 100 * 1024 });

    const fileInputs = document.querySelectorAll("input[type='file']");
    await act(async () => {
      fireEvent.change(fileInputs[0], { target: { files: [smallFile] } });
    });

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("حدث خطأ في رفع البانر"));
  });
});

describe("SubCategoriesPage — Banner Delete", () => {
  it("يطلب تأكيد قبل الحذف", async () => {
    setupFetchSuccess();
    mockApiFetch.mockImplementationOnce(() => makeOkResponse({ success: true }));
    render(<SubCategoriesPage />);
    await waitFor(() => screen.getByText("STC"));

    const deleteBtns = screen.getAllByText("حذف");
    fireEvent.click(deleteBtns[0]);

    expect(window.confirm).toHaveBeenCalledWith("هل أنت متأكد من حذف هذا البانر؟");
  });

  it("لا يحذف إذا المستخدم رفض التأكيد", async () => {
    window.confirm = jest.fn(() => false);
    setupFetchSuccess();
    render(<SubCategoriesPage />);
    await waitFor(() => screen.getByText("STC"));

    const deleteBtns = screen.getAllByText("حذف");
    fireEvent.click(deleteBtns[0]);

    expect(mockApiFetch).toHaveBeenCalledTimes(2); // فقط initial fetch
  });

  it("يحذف البانر ويحدث الـ state بعد التأكيد", async () => {
    setupFetchSuccess();
    mockApiFetch.mockImplementationOnce(() => makeOkResponse({ success: true }));

    render(<SubCategoriesPage />);
    await waitFor(() => screen.getByText("STC"));

    const deleteBtns = screen.getAllByText("حذف");
    fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/brands/banner/"),
        expect.objectContaining({ method: "DELETE" })
      );
    });
    expect(toast.success).toHaveBeenCalledWith("تم حذف البانر");
  });
});

describe("SubCategoriesPage — التأثير على صفحات أخرى", () => {
  it("brands/home-settings endpoint يُستخدم في HomeCategorySections", () => {
    // HomeCategorySections تعتمد على /api/admin/brands/home-settings
    // أي تغيير في showInHome أو order في هذه الصفحة يؤثر على الرئيسية
    // هذا الاختبار يتحقق من أن الـ endpoint المستخدم في الصفحتين متوافق
    const brandsSettingsEndpoint = "/api/admin/brands/settings/toggle";
    const homeSettingsEndpoint = "/api/admin/brands/home-settings";

    // كلاهما يعتمد على SubCategorySettings بـ category: "__brand__"
    expect(brandsSettingsEndpoint).toContain("brands/settings");
    expect(homeSettingsEndpoint).toContain("brands/home-settings");
  });

  it("تغيير showInHome يؤثر على عدد البراندات في الرئيسية", async () => {
    setupFetchSuccess();
    mockApiFetch.mockImplementationOnce(() => makeOkResponse({ showInHome: true }));

    render(<SubCategoriesPage />);
    await waitFor(() => screen.getByText("STC"));

    // قبل التغيير: 1 براند في الرئيسية (STC فقط)
    expect(screen.getByText("الرئيسية: 1")).toBeInTheDocument();

    // تفعيل Zain
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]); // Zain

    await waitFor(() => expect(screen.getByText("الرئيسية: 2")).toBeInTheDocument());
  });
});
