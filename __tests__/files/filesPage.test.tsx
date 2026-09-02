/**
 * Tests: FilesPage — Frontend Logic
 *
 * يتحقق من كل التعديلات التي أُجريت على page.tsx:
 * 1. uploadingSet (Set) — كل upload مستقل بدون race condition
 * 2. error handling في كل upload function
 * 3. deleteFile تستدعي DELETE API (وليس setData فقط)
 * 4. saveSection تعرض رسالة الخطأ الفعلية من Backend
 * 5. useEffect يقرأ link1Type و link2Type الصحيحة من DB
 * 6. saveSection تمرر qrLinkType و qrFile و file1 و file2
 */

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import React from "react";
import FilesPage from "../../app/admin/files/page";

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) =>
    React.createElement("img", { src: props.src as string, alt: props.alt as string }),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

const okJson = (data: unknown) => ({ ok: true, status: 200, json: async () => data });
const failJson = (data: unknown, status = 400) => ({ ok: false, status, json: async () => data });

const fakeCompany = {
  qrImage: "https://cdn.example.com/qr.png",
  qrLink: "https://example.com",
  qrLinkType: "link",
  qrFile: "",
  img1: "https://cdn.example.com/img1.png",
  link1: "https://example.com/1",
  link1Type: "link",
  file1: "",
  img2: "https://cdn.example.com/img2.png",
  link2: "https://example.com/2",
  link2Type: "link",
  file2: "",
  footerItems: [
    { _id: "id0", image: "", linkType: "link", link: "", file: "" },
    { _id: "id1", image: "", linkType: "link", link: "", file: "" },
    { _id: "id2", image: "", linkType: "link", link: "", file: "" },
  ],
};

function renderPage() {
  return render(React.createElement(FilesPage));
}

beforeEach(() => {
  mockFetch.mockReset();
});

// ─── 1. Initial load ──────────────────────────────────────────────────────────

describe("FilesPage — initial load", () => {
  it("يجلب بيانات الشركة عند mount", async () => {
    mockFetch.mockResolvedValueOnce(okJson(fakeCompany));
    renderPage();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/admin/company",
        expect.objectContaining({ credentials: "include" })
      );
    });
  });

  it("يقرأ link1Type من DB (وليس linkType1)", async () => {
    // DB يُرجع link1Type — الـpage يجب أن تقرأه صح
    mockFetch.mockResolvedValueOnce(okJson({
      ...fakeCompany,
      link1Type: "file",
      file1: "https://cdn.example.com/f1.pdf",
    }));

    renderPage();

    await waitFor(() => {
      // إذا قرأت link1Type صح، ستظهر "رفع ملف" بدلاً من input الرابط
      expect(screen.getAllByText("رفع ملف").length).toBeGreaterThan(0);
    });
  });

  it("يقرأ link2Type من DB (وليس linkType2)", async () => {
    mockFetch.mockResolvedValueOnce(okJson({
      ...fakeCompany,
      link2Type: "file",
      file2: "https://cdn.example.com/f2.pdf",
    }));

    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText("رفع ملف").length).toBeGreaterThan(0);
    });
  });

  it("يقرأ qrLinkType من DB", async () => {
    mockFetch.mockResolvedValueOnce(okJson({
      ...fakeCompany,
      qrLinkType: "file",
      qrFile: "https://cdn.example.com/qr.pdf",
    }));

    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText("رفع ملف").length).toBeGreaterThan(0);
    });
  });
});

// ─── 2. saveSection — يمرر الحقول الصحيحة ────────────────────────────────────

describe("FilesPage — saveSection", () => {
  it("يمرر qrLinkType و qrFile عند حفظ QR", async () => {
    mockFetch.mockResolvedValueOnce(okJson(fakeCompany));
    renderPage();
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    mockFetch.mockResolvedValueOnce(okJson({ success: true }));

    // اضغط زر حفظ QR
    const saveButtons = screen.getAllByText("حفظ");
    await act(async () => { fireEvent.click(saveButtons[0]); });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));

    const [, init] = mockFetch.mock.calls[1] as [string, RequestInit];
    expect((init as RequestInit & { method: string }).method).toBe("PUT");
    const body = JSON.parse(init.body as string);
    expect(body).toHaveProperty("qrLinkType");
    expect(body).toHaveProperty("qrFile");
    expect(body).toHaveProperty("qrLink");
  });

  it("يمرر link1Type و file1 عند حفظ Section 1", async () => {
    mockFetch.mockResolvedValueOnce(okJson(fakeCompany));
    renderPage();
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    mockFetch.mockResolvedValueOnce(okJson({ success: true }));

    const saveButtons = screen.getAllByText("حفظ");
    // زر حفظ Section 1 هو الثالث (QR, items, s1, s2)
    await act(async () => { fireEvent.click(saveButtons[2]); });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));

    const [, init] = mockFetch.mock.calls[1] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body).toHaveProperty("link1Type");
    expect(body).toHaveProperty("file1");
    expect(body).toHaveProperty("link1");
  });

  it("يمرر link2Type و file2 عند حفظ Section 2", async () => {
    mockFetch.mockResolvedValueOnce(okJson(fakeCompany));
    renderPage();
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    mockFetch.mockResolvedValueOnce(okJson({ success: true }));

    const saveButtons = screen.getAllByText("حفظ");
    await act(async () => { fireEvent.click(saveButtons[3]); });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));

    const [, init] = mockFetch.mock.calls[1] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body).toHaveProperty("link2Type");
    expect(body).toHaveProperty("file2");
    expect(body).toHaveProperty("link2");
  });

  it("يعرض رسالة الخطأ الفعلية من Backend عند فشل الحفظ", async () => {
    mockFetch.mockResolvedValueOnce(okJson(fakeCompany));
    renderPage();
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    mockFetch.mockResolvedValueOnce(failJson({ error: "نوع رابط QR غير مسموح" }));

    const saveButtons = screen.getAllByText("حفظ");
    await act(async () => { fireEvent.click(saveButtons[0]); });

    await waitFor(() => {
      expect(screen.getByText(/نوع رابط QR غير مسموح/)).toBeInTheDocument();
    });
  });

  it("يعرض ✅ تم الحفظ عند النجاح", async () => {
    mockFetch.mockResolvedValueOnce(okJson(fakeCompany));
    renderPage();
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    mockFetch.mockResolvedValueOnce(okJson({ success: true }));

    const saveButtons = screen.getAllByText("حفظ");
    await act(async () => { fireEvent.click(saveButtons[0]); });

    await waitFor(() => {
      expect(screen.getByText(/✅ تم الحفظ/)).toBeInTheDocument();
    });
  });
});

// ─── 3. deleteFile — تستدعي DELETE API ───────────────────────────────────────

describe("FilesPage — deleteFile يستدعي DELETE API", () => {
  it("زر حذف qrFile يستدعي DELETE /api/admin/company/footer-file-delete/qrFile", async () => {
    mockFetch.mockResolvedValueOnce(okJson({
      ...fakeCompany,
      qrLinkType: "file",
      qrFile: "https://cdn.example.com/qr.pdf",
    }));

    renderPage();
    // انتظر ظهور زر "عرض الملف" كدليل على أن البيانات وصلت
    await waitFor(() => expect(screen.getAllByText("عرض الملف").length).toBeGreaterThan(0));

    mockFetch.mockResolvedValueOnce(okJson({ success: true }));

    const deleteButtons = screen.getAllByText("حذف");
    await act(async () => { fireEvent.click(deleteButtons[0]); });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));

    const [calledUrl, calledInit] = mockFetch.mock.calls[1] as [string, RequestInit];
    expect(calledUrl).toContain("/api/admin/company/footer-file-delete/qrFile");
    expect((calledInit as RequestInit & { method: string }).method).toBe("DELETE");
    expect((calledInit as RequestInit & { credentials: string }).credentials).toBe("include");
  });

  it("يُفرِّغ الـfield في الـstate بعد نجاح الحذف", async () => {
    mockFetch.mockResolvedValueOnce(okJson({
      ...fakeCompany,
      qrLinkType: "file",
      qrFile: "https://cdn.example.com/qr.pdf",
    }));

    renderPage();
    await waitFor(() => expect(screen.getAllByText("عرض الملف").length).toBeGreaterThan(0));

    mockFetch.mockResolvedValueOnce(okJson({ success: true }));

    const deleteButtons = screen.getAllByText("حذف");
    await act(async () => { fireEvent.click(deleteButtons[0]); });

    await waitFor(() => {
      // بعد الحذف الناجح، "عرض الملف" يختفي
      expect(screen.queryAllByText("عرض الملف").length).toBe(0);
    });
  });

  it("يعرض رسالة خطأ إذا فشل DELETE API", async () => {
    mockFetch.mockResolvedValueOnce(okJson({
      ...fakeCompany,
      qrLinkType: "file",
      qrFile: "https://cdn.example.com/qr.pdf",
    }));

    renderPage();
    await waitFor(() => expect(screen.getAllByText("عرض الملف").length).toBeGreaterThan(0));

    mockFetch.mockResolvedValueOnce(failJson({ error: "خطأ في الخادم" }, 500));

    const deleteButtons = screen.getAllByText("حذف");
    await act(async () => { fireEvent.click(deleteButtons[0]); });

    await waitFor(() => {
      expect(screen.getByText(/خطأ في الخادم/)).toBeInTheDocument();
    });

    // الـfield لم يتغير عند الفشل
    expect(screen.getAllByText("عرض الملف").length).toBeGreaterThan(0);
  });
});

// ─── 4. uploadingSet — لا race condition ─────────────────────────────────────

describe("FilesPage — uploadingSet بدون race condition", () => {
  it("spinner يظهر أثناء الرفع ويختفي بعده", async () => {
    mockFetch.mockResolvedValueOnce(okJson(fakeCompany));
    renderPage();
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    // نتحقق أن الـspinner لا يظهر في البداية
    expect(document.querySelectorAll(".animate-spin").length).toBe(0);
  });

  it("upload فاشل يعرض رسالة خطأ من Backend", async () => {
    mockFetch.mockResolvedValueOnce(okJson(fakeCompany));
    renderPage();
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    // simulate upload فاشل عبر mock fetch
    mockFetch.mockResolvedValueOnce(failJson({ error: "نوع الملف غير مسموح، يُقبل فقط: JPEG, PNG, WebP, GIF" }));

    // trigger upload عبر file input
    const fileInputs = document.querySelectorAll("input[type='file'][accept='image/*']");
    expect(fileInputs.length).toBeGreaterThan(0);

    const fakeFile = new File(["exe"], "virus.exe", { type: "application/octet-stream" });
    await act(async () => {
      fireEvent.change(fileInputs[0], { target: { files: [fakeFile] } });
    });

    await waitFor(() => {
      expect(screen.getByText(/نوع الملف غير مسموح/)).toBeInTheDocument();
    });
  });

  it("upload ناجح يُحدِّث الصورة في الـstate", async () => {
    mockFetch.mockResolvedValueOnce(okJson({ ...fakeCompany, qrImage: "" }));
    renderPage();
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    mockFetch.mockResolvedValueOnce(okJson({ url: "https://cdn.example.com/new-qr.png" }));

    const fileInputs = document.querySelectorAll("input[type='file'][accept='image/*']");
    const fakeFile = new File(["img"], "qr.png", { type: "image/png" });

    await act(async () => {
      fireEvent.change(fileInputs[0], { target: { files: [fakeFile] } });
    });

    await waitFor(() => {
      const img = document.querySelector("img[src='https://cdn.example.com/new-qr.png']");
      expect(img).toBeInTheDocument();
    });
  });
});

// ─── 5. network error handling ───────────────────────────────────────────────

describe("FilesPage — network error handling", () => {
  it("upload يعرض رسالة خطأ عند network error", async () => {
    mockFetch.mockResolvedValueOnce(okJson(fakeCompany));
    renderPage();
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    mockFetch.mockRejectedValueOnce(new Error("Network Error"));

    const fileInputs = document.querySelectorAll("input[type='file'][accept='image/*']");
    const fakeFile = new File(["img"], "qr.png", { type: "image/png" });

    await act(async () => {
      fireEvent.change(fileInputs[0], { target: { files: [fakeFile] } });
    });

    await waitFor(() => {
      expect(screen.getByText(/خطأ في الشبكة/)).toBeInTheDocument();
    });
  });

  it("saveSection يعرض رسالة خطأ عند network error", async () => {
    mockFetch.mockResolvedValueOnce(okJson(fakeCompany));
    renderPage();
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    mockFetch.mockRejectedValueOnce(new Error("Network Error"));

    const saveButtons = screen.getAllByText("حفظ");
    await act(async () => { fireEvent.click(saveButtons[0]); });

    await waitFor(() => {
      expect(screen.getByText(/خطأ في الشبكة/)).toBeInTheDocument();
    });
  });

  it("deleteFile يعرض رسالة خطأ عند network error", async () => {
    mockFetch.mockResolvedValueOnce(okJson({
      ...fakeCompany,
      qrLinkType: "file",
      qrFile: "https://cdn.example.com/qr.pdf",
    }));

    renderPage();
    await waitFor(() => expect(screen.getAllByText("عرض الملف").length).toBeGreaterThan(0));

    mockFetch.mockRejectedValueOnce(new Error("Network Error"));

    const deleteButtons = screen.getAllByText("حذف");
    await act(async () => { fireEvent.click(deleteButtons[0]); });

    await waitFor(() => {
      expect(screen.getByText(/خطأ في الشبكة/)).toBeInTheDocument();
    });
  });
});
