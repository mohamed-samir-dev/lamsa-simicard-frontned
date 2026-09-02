/**
 * Tests: admin/main-categories — شامل ومتكامل
 *
 * يغطي:
 * 1. useMainCategories hook — fetch, add, edit, delete, search, validation
 * 2. CategoriesTable component — render, search, loading skeleton, empty state
 * 3. AddModal component — render, submit, validation, close
 * 4. EditModal component — render, submit, warning, close
 * 5. DeleteModal component — render, confirm, cancel
 * 6. API proxy routes — extra, POST, rename, remove
 * 7. page.tsx — تكامل كامل
 */

// ─── Mocks ───────────────────────────────────────────────────────────────────

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

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: (msg: string) => mockToastSuccess(msg),
    error: (msg: string) => mockToastError(msg),
  },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

// ─── Imports ─────────────────────────────────────────────────────────────────

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderHook } from "@testing-library/react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeNextRequest(
  url: string,
  options: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
  } = {}
) {
  return {
    url: `http://localhost:3000${url}`,
    nextUrl: new URL(`http://localhost:3000${url}`),
    method: options.method ?? "GET",
    headers: { get: (k: string) => (options.headers ?? {})[k] ?? null },
    json: async () => JSON.parse(options.body ?? "{}"),
  };
}

const fakeCategories = [
  { name: "شرائح STC", count: 5 },
  { name: "شرائح زين", count: 3 },
  { name: "شرائح موبايلي", count: 0 },
];

function mockFetchOk(data: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => data,
  });
}

function mockFetchFail(status = 400, error = "خطأ") {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({ error }),
  });
}

beforeEach(() => {
  mockFetch.mockReset();
  mockToastSuccess.mockReset();
  mockToastError.mockReset();
});

// ═════════════════════════════════════════════════════════════════════════════
// 1. useMainCategories — Hook Tests
// ═════════════════════════════════════════════════════════════════════════════

import { useMainCategories } from "../app/admin/main-categories/hooks/useMainCategories";
import CategoriesTable from "../app/admin/main-categories/components/CategoriesTable";
import AddModal from "../app/admin/main-categories/components/AddModal";
import EditModal from "../app/admin/main-categories/components/EditModal";
import DeleteModal from "../app/admin/main-categories/components/DeleteModal";
import MainCategoriesPage from "../app/admin/main-categories/page";

describe("useMainCategories — fetchCategories", () => {
  it("تجلب التصنيفات عند mount وتضعها في categories", async () => {
    mockFetchOk(fakeCategories);
    const { result } = renderHook(() => useMainCategories());

    await waitFor(() => expect(result.current.categories).toHaveLength(3));
    expect(mockFetch).toHaveBeenCalledWith("/api/admin/main-categories/extra", { credentials: "include" });
    expect(result.current.categories[0].name).toBe("شرائح STC");
  });

  it("تضع fetchLoading=true أثناء الجلب ثم false بعده", async () => {
    let resolveFetch!: (v: unknown) => void;
    mockFetch.mockReturnValueOnce(
      new Promise((res) => { resolveFetch = res; })
    );
    const { result } = renderHook(() => useMainCategories());

    expect(result.current.fetchLoading).toBe(true);

    await act(async () => {
      resolveFetch({ ok: true, json: async () => fakeCategories });
    });

    await waitFor(() => expect(result.current.fetchLoading).toBe(false));
  });

  it("تعرض toast error وتضع categories=[] عند network failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network Error"));
    const { result } = renderHook(() => useMainCategories());

    await waitFor(() => expect(result.current.fetchLoading).toBe(false));
    expect(result.current.categories).toHaveLength(0);
    expect(mockToastError).toHaveBeenCalledWith("فشل تحميل التصنيفات");
  });
  it("تضع categories=[] عند response غير ok", async () => {
    mockFetchFail(500);
    const { result } = renderHook(() => useMainCategories());

    await waitFor(() => expect(result.current.fetchLoading).toBe(false));
    expect(result.current.categories).toHaveLength(0);
  });
});

describe("useMainCategories — search / filtered", () => {
  it("filtered يرجع كل التصنيفات لما search فارغ", async () => {
    mockFetchOk(fakeCategories);
    const { result } = renderHook(() => useMainCategories());

    await waitFor(() => expect(result.current.categories).toHaveLength(3));
    expect(result.current.filtered).toHaveLength(3);
  });

  it("filtered يفلتر بالاسم الصحيح", async () => {
    mockFetchOk(fakeCategories);
    const { result } = renderHook(() => useMainCategories());

    await waitFor(() => expect(result.current.categories).toHaveLength(3));

    act(() => { result.current.setSearch("STC"); });
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].name).toBe("شرائح STC");
  });

  it("filtered يرجع [] لو البحث مش موجود", async () => {
    mockFetchOk(fakeCategories);
    const { result } = renderHook(() => useMainCategories());

    await waitFor(() => expect(result.current.categories).toHaveLength(3));
    act(() => { result.current.setSearch("xxxxx"); });
    expect(result.current.filtered).toHaveLength(0);
  });
});

describe("useMainCategories — handleAdd", () => {
  it("ترسل POST وتعرض toast success وتعمل re-fetch", async () => {
    mockFetchOk(fakeCategories);
    const { result } = renderHook(() => useMainCategories());
    await waitFor(() => expect(result.current.fetchLoading).toBe(false));

    mockFetchOk({ name: "تصنيف جديد", count: 0 });
    mockFetchOk([...fakeCategories, { name: "تصنيف جديد", count: 0 }]);

    act(() => { result.current.setName("تصنيف جديد"); });

    await act(async () => {
      await result.current.handleAdd({ preventDefault: jest.fn() } as unknown as React.FormEvent);
    });

    expect(mockToastSuccess).toHaveBeenCalledWith(expect.stringContaining("تصنيف جديد"));
    expect(result.current.showModal).toBe(false);
    expect(result.current.name).toBe("");
  });

  it("ترفض الاسم الفارغ (whitespace only) بدون fetch", async () => {
    mockFetchOk(fakeCategories);
    const { result } = renderHook(() => useMainCategories());
    await waitFor(() => expect(result.current.fetchLoading).toBe(false));

    act(() => { result.current.setName("   "); });
    await act(async () => {
      await result.current.handleAdd({ preventDefault: jest.fn() } as unknown as React.FormEvent);
    });

    expect(result.current.error).toBeTruthy();
    // fetch مرة واحدة فقط (الـ initial fetch)
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("ترفض الاسم الأطول من 100 حرف", async () => {
    mockFetchOk(fakeCategories);
    const { result } = renderHook(() => useMainCategories());
    await waitFor(() => expect(result.current.fetchLoading).toBe(false));

    act(() => { result.current.setName("أ".repeat(101)); });
    await act(async () => {
      await result.current.handleAdd({ preventDefault: jest.fn() } as unknown as React.FormEvent);
    });

    expect(result.current.error).toBeTruthy();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("تضع error من الـbackend لو الاسم موجود", async () => {
    mockFetchOk(fakeCategories);
    const { result } = renderHook(() => useMainCategories());
    await waitFor(() => expect(result.current.fetchLoading).toBe(false));

    mockFetchFail(400, "التصنيف موجود بالفعل");
    act(() => { result.current.setName("شرائح STC"); });
    await act(async () => {
      await result.current.handleAdd({ preventDefault: jest.fn() } as unknown as React.FormEvent);
    });

    expect(result.current.error).toBe("التصنيف موجود بالفعل");
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  it("loading=true أثناء الإرسال ثم false بعده", async () => {
    mockFetchOk(fakeCategories);
    const { result } = renderHook(() => useMainCategories());
    await waitFor(() => expect(result.current.fetchLoading).toBe(false));

    let resolvePost!: (v: unknown) => void;
    mockFetch.mockReturnValueOnce(new Promise((res) => { resolvePost = res; }));
    mockFetchOk(fakeCategories);

    act(() => { result.current.setName("تصنيف"); });
    act(() => {
      result.current.handleAdd({ preventDefault: jest.fn() } as unknown as React.FormEvent);
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePost({ ok: true, json: async () => ({ name: "تصنيف", count: 0 }) });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});

describe("useMainCategories — handleEdit", () => {
  it("ترسل PUT وتعرض toast success", async () => {
    mockFetchOk(fakeCategories);
    const { result } = renderHook(() => useMainCategories());
    await waitFor(() => expect(result.current.fetchLoading).toBe(false));

    act(() => {
      result.current.setEditCat(fakeCategories[0]);
      result.current.setEditName("شرائح STC المحدثة");
    });

    mockFetchOk({ success: true });
    mockFetchOk(fakeCategories);

    await act(async () => {
      await result.current.handleEdit({ preventDefault: jest.fn() } as unknown as React.FormEvent);
    });

    expect(mockToastSuccess).toHaveBeenCalledWith("تم حفظ التعديلات بنجاح ✅");
    expect(result.current.editCat).toBeNull();

    const putCall = mockFetch.mock.calls[1];
    expect(putCall[0]).toBe("/api/admin/main-categories/rename");
    expect(putCall[1].method).toBe("PUT");
    const body = JSON.parse(putCall[1].body);
    expect(body.oldName).toBe("شرائح STC");
    expect(body.newName).toBe("شرائح STC المحدثة");
  });

  it("ترفض الاسم الفارغ في التعديل", async () => {
    mockFetchOk(fakeCategories);
    const { result } = renderHook(() => useMainCategories());
    await waitFor(() => expect(result.current.fetchLoading).toBe(false));

    act(() => {
      result.current.setEditCat(fakeCategories[0]);
      result.current.setEditName("  ");
    });

    await act(async () => {
      await result.current.handleEdit({ preventDefault: jest.fn() } as unknown as React.FormEvent);
    });

    expect(result.current.editError).toBeTruthy();
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  it("تضع editError من الـbackend عند الفشل", async () => {
    mockFetchOk(fakeCategories);
    const { result } = renderHook(() => useMainCategories());
    await waitFor(() => expect(result.current.fetchLoading).toBe(false));

    act(() => {
      result.current.setEditCat(fakeCategories[0]);
      result.current.setEditName("شرائح زين");
    });

    mockFetchFail(400, "التصنيف موجود بالفعل");

    await act(async () => {
      await result.current.handleEdit({ preventDefault: jest.fn() } as unknown as React.FormEvent);
    });

    await waitFor(() => expect(result.current.editError).toBe("التصنيف موجود بالفعل"));
  });
});

describe("useMainCategories — confirmDeleteAction", () => {
  it("ترسل DELETE وتعرض toast success", async () => {
    mockFetchOk(fakeCategories);
    const { result } = renderHook(() => useMainCategories());
    await waitFor(() => expect(result.current.fetchLoading).toBe(false));

    act(() => { result.current.setConfirmDelete("شرائح STC"); });

    mockFetchOk({ success: true });
    mockFetchOk(fakeCategories.slice(1));

    await act(async () => { await result.current.confirmDeleteAction(); });

    expect(mockToastSuccess).toHaveBeenCalledWith(expect.stringContaining("شرائح STC"));
    expect(result.current.confirmDelete).toBeNull();

    const deleteCall = mockFetch.mock.calls[1];
    expect(deleteCall[0]).toBe("/api/admin/main-categories/remove");
    expect(deleteCall[1].method).toBe("DELETE");
    const body = JSON.parse(deleteCall[1].body);
    expect(body.name).toBe("شرائح STC");
  });

  it("تعرض toast error لو الـbackend رفض الحذف", async () => {
    mockFetchOk(fakeCategories);
    const { result } = renderHook(() => useMainCategories());
    await waitFor(() => expect(result.current.fetchLoading).toBe(false));

    act(() => { result.current.setConfirmDelete("شرائح STC"); });
    mockFetchFail(400, "لا يمكن الحذف");

    await act(async () => { await result.current.confirmDeleteAction(); });

    expect(mockToastError).toHaveBeenCalledWith("لا يمكن الحذف");
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  it("لا تفعل شيء لو confirmDelete=null", async () => {
    mockFetchOk(fakeCategories);
    const { result } = renderHook(() => useMainCategories());
    await waitFor(() => expect(result.current.fetchLoading).toBe(false));

    const callsBefore = mockFetch.mock.calls.length;
    await act(async () => { await result.current.confirmDeleteAction(); });
    expect(mockFetch.mock.calls.length).toBe(callsBefore);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. CategoriesTable — Component Tests
// ═════════════════════════════════════════════════════════════════════════════

describe("CategoriesTable — render", () => {
  const baseProps = {
    categories: fakeCategories,
    filtered: fakeCategories,
    search: "",
    loading: false,
    onSearchChange: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  it("يعرض عدد التصنيفات الإجمالي", () => {
    render(<CategoriesTable {...baseProps} />);
    const countEl = document.querySelector(".font-bold.text-gray-700");
    expect(countEl?.textContent).toBe("3");
  });

  it("يعرض أسماء التصنيفات في الجدول", () => {
    render(<CategoriesTable {...baseProps} />);
    expect(screen.getByText("شرائح STC")).toBeInTheDocument();
    expect(screen.getByText("شرائح زين")).toBeInTheDocument();
    expect(screen.getByText("شرائح موبايلي")).toBeInTheDocument();
  });

  it("يعرض أرقام الصفوف بشكل صحيح", () => {
    render(<CategoriesTable {...baseProps} />);
    const rows = document.querySelectorAll("tbody tr");
    expect(rows).toHaveLength(3);
    expect(rows[0].querySelector("td")?.textContent).toBe("1");
    expect(rows[1].querySelector("td")?.textContent).toBe("2");
    expect(rows[2].querySelector("td")?.textContent).toBe("3");
  });

  it("يعرض skeleton loading عند loading=true", () => {
    render(<CategoriesTable {...baseProps} loading={true} filtered={[]} />);
    const pulseEls = document.querySelectorAll(".animate-pulse");
    expect(pulseEls.length).toBeGreaterThan(0);
    expect(screen.queryByText("شرائح STC")).not.toBeInTheDocument();
  });

  it("يعرض رسالة 'لا توجد تصنيفات' لما filtered فارغ", () => {
    render(<CategoriesTable {...baseProps} filtered={[]} />);
    expect(screen.getByText("لا توجد تصنيفات")).toBeInTheDocument();
  });

  it("يستدعي onEdit بالـcategory الصحيح عند الضغط على تعديل", () => {
    const onEdit = jest.fn();
    render(<CategoriesTable {...baseProps} onEdit={onEdit} />);
    const editBtns = screen.getAllByTitle("تعديل");
    fireEvent.click(editBtns[0]);
    expect(onEdit).toHaveBeenCalledWith(fakeCategories[0]);
  });

  it("يستدعي onDelete بالاسم الصحيح عند الضغط على حذف", () => {
    const onDelete = jest.fn();
    render(<CategoriesTable {...baseProps} onDelete={onDelete} />);
    const deleteBtns = screen.getAllByTitle("حذف");
    fireEvent.click(deleteBtns[1]);
    expect(onDelete).toHaveBeenCalledWith("شرائح زين");
  });

  it("يستدعي onSearchChange عند الكتابة في البحث", async () => {
    const onSearchChange = jest.fn();
    render(<CategoriesTable {...baseProps} onSearchChange={onSearchChange} />);
    const input = screen.getByPlaceholderText("ابحث عن تصنيف...");
    await userEvent.type(input, "STC");
    expect(onSearchChange).toHaveBeenCalled();
  });

  it("يعرض قيمة البحث الحالية في الـinput", () => {
    render(<CategoriesTable {...baseProps} search="STC" />);
    const input = screen.getByPlaceholderText("ابحث عن تصنيف...") as HTMLInputElement;
    expect(input.value).toBe("STC");
  });

  it("يعرض 0 في العداد لما categories فارغ", () => {
    render(<CategoriesTable {...baseProps} categories={[]} filtered={[]} />);
    const countEl = document.querySelector(".font-bold.text-gray-700");
    expect(countEl?.textContent).toBe("0");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. AddModal — Component Tests
// ═════════════════════════════════════════════════════════════════════════════

describe("AddModal — render & behavior", () => {
  const baseProps = {
    name: "",
    error: "",
    loading: false,
    onNameChange: jest.fn(),
    onSubmit: jest.fn(),
    onClose: jest.fn(),
  };

  it("يعرض العنوان والـinput وزرَّي الإضافة والإلغاء", () => {
    render(<AddModal {...baseProps} />);
    expect(screen.getByText("إضافة تصنيف جديد")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("مثال: هواتف ذكية")).toBeInTheDocument();
    expect(screen.getByText("إضافة")).toBeInTheDocument();
    expect(screen.getByText("إلغاء")).toBeInTheDocument();
  });

  it("يعرض رسالة الخطأ لما error موجود", () => {
    render(<AddModal {...baseProps} error="التصنيف موجود بالفعل" />);
    expect(screen.getByText("التصنيف موجود بالفعل")).toBeInTheDocument();
  });

  it("لا يعرض رسالة خطأ لما error فارغ", () => {
    render(<AddModal {...baseProps} />);
    expect(screen.queryByText("التصنيف موجود بالفعل")).not.toBeInTheDocument();
  });

  it("يعرض 'جاري الإضافة...' لما loading=true ويعطل الزر", () => {
    render(<AddModal {...baseProps} loading={true} />);
    const btn = screen.getByText("جاري الإضافة...").closest("button") as HTMLButtonElement;
    expect(btn).toBeDisabled();
  });

  it("يستدعي onClose عند الضغط على إلغاء", () => {
    const onClose = jest.fn();
    render(<AddModal {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByText("إلغاء"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("يستدعي onSubmit عند submit الـform", () => {
    const onSubmit = jest.fn((e) => e.preventDefault());
    render(<AddModal {...baseProps} onSubmit={onSubmit} name="تصنيف" />);
    fireEvent.submit(screen.getByText("إضافة").closest("form")!);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("يستدعي onNameChange عند الكتابة", async () => {
    const onNameChange = jest.fn();
    render(<AddModal {...baseProps} onNameChange={onNameChange} />);
    const input = screen.getByPlaceholderText("مثال: هواتف ذكية");
    await userEvent.type(input, "ت");
    expect(onNameChange).toHaveBeenCalled();
  });

  it("الـinput يعرض الـname الحالي", () => {
    render(<AddModal {...baseProps} name="شرائح STC" />);
    const input = screen.getByPlaceholderText("مثال: هواتف ذكية") as HTMLInputElement;
    expect(input.value).toBe("شرائح STC");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. EditModal — Component Tests
// ═════════════════════════════════════════════════════════════════════════════

describe("EditModal — render & behavior", () => {
  const baseProps = {
    editCat: { name: "شرائح STC", count: 5 },
    editName: "شرائح STC",
    editError: "",
    editLoading: false,
    onNameChange: jest.fn(),
    onSubmit: jest.fn(),
    onClose: jest.fn(),
  };

  it("يعرض اسم التصنيف في العنوان", () => {
    render(<EditModal {...baseProps} />);
    expect(screen.getByText(/تعديل.*شرائح STC/)).toBeInTheDocument();
  });

  it("يعرض تحذير عدد المنتجات لما count > 0", () => {
    render(<EditModal {...baseProps} />);
    expect(screen.getByText(/5 منتج/)).toBeInTheDocument();
  });

  it("لا يعرض التحذير لما count = 0", () => {
    render(<EditModal {...baseProps} editCat={{ name: "تصنيف جديد", count: 0 }} />);
    expect(screen.queryByText(/منتج/)).not.toBeInTheDocument();
  });

  it("يعرض editError لما موجود", () => {
    render(<EditModal {...baseProps} editError="التصنيف موجود بالفعل" />);
    expect(screen.getByText("التصنيف موجود بالفعل")).toBeInTheDocument();
  });

  it("يعرض 'جاري الحفظ...' ويعطل الزر لما editLoading=true", () => {
    render(<EditModal {...baseProps} editLoading={true} />);
    const btn = screen.getByText("جاري الحفظ...").closest("button") as HTMLButtonElement;
    expect(btn).toBeDisabled();
  });

  it("يستدعي onClose عند الضغط على إلغاء", () => {
    const onClose = jest.fn();
    render(<EditModal {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByText("إلغاء"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("يستدعي onSubmit عند submit الـform", () => {
    const onSubmit = jest.fn((e) => e.preventDefault());
    render(<EditModal {...baseProps} onSubmit={onSubmit} />);
    fireEvent.submit(screen.getByText("حفظ").closest("form")!);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("الـinput يعرض editName الحالي", () => {
    render(<EditModal {...baseProps} editName="شرائح STC المعدلة" />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("شرائح STC المعدلة");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. DeleteModal — Component Tests
// ═════════════════════════════════════════════════════════════════════════════

describe("DeleteModal — render & behavior", () => {
  const baseProps = {
    name: "شرائح STC",
    onConfirm: jest.fn(),
    onClose: jest.fn(),
  };

  it("يعرض اسم التصنيف المراد حذفه", () => {
    render(<DeleteModal {...baseProps} />);
    expect(screen.getByText(/شرائح STC/)).toBeInTheDocument();
  });

  it("يعرض تحذير إزالة التصنيف من المنتجات", () => {
    render(<DeleteModal {...baseProps} />);
    expect(screen.getByText(/سيتم إزالة هذا التصنيف/)).toBeInTheDocument();
  });

  it("يستدعي onConfirm عند الضغط على 'نعم، احذف'", () => {
    const onConfirm = jest.fn();
    render(<DeleteModal {...baseProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText("نعم، احذف"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("يستدعي onClose عند الضغط على إلغاء", () => {
    const onClose = jest.fn();
    render(<DeleteModal {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByText("إلغاء"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("لا يستدعي onConfirm عند الضغط على إلغاء", () => {
    const onConfirm = jest.fn();
    render(<DeleteModal {...baseProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText("إلغاء"));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("يعرض أيقونة الحذف 🗑️", () => {
    render(<DeleteModal {...baseProps} />);
    expect(screen.getByText("🗑️")).toBeInTheDocument();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 6. API Proxy Routes — Next.js Route Handlers
// ═════════════════════════════════════════════════════════════════════════════

describe("GET /api/admin/main-categories/extra", () => {
  it("يمرر الـcookies للـbackend ويرجع البيانات", async () => {
    jest.resetModules();
    mockFetchOk(fakeCategories);
    const { GET } = require("../app/api/admin/main-categories/extra/route");
    const req = makeNextRequest("/api/admin/main-categories/extra", {
      headers: { cookie: "admin_token=abc123" },
    });

    const res = await GET(req);

    expect(res._status).toBe(200);
    expect(res._data).toEqual(fakeCategories);
    const [calledUrl, calledInit] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toContain("/api/admin/main-categories/extra");
    expect((calledInit.headers as Record<string, string>).cookie).toBe("admin_token=abc123");
  });

  it("يرجع status 401 لو الـbackend رفض", async () => {
    jest.resetModules();
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ error: "غير مصرح" }) });
    const { GET } = require("../app/api/admin/main-categories/extra/route");
    const req = makeNextRequest("/api/admin/main-categories/extra");
    const res = await GET(req);
    expect(res._status).toBe(401);
  });
});

describe("POST /api/admin/main-categories", () => {
  it("يمرر الـbody والـcookies ويرجع التصنيف الجديد", async () => {
    jest.resetModules();
    mockFetchOk({ name: "تصنيف جديد", count: 0 });
    const { POST } = require("../app/api/admin/main-categories/route");
    const req = makeNextRequest("/api/admin/main-categories", {
      method: "POST",
      body: JSON.stringify({ name: "تصنيف جديد" }),
      headers: { cookie: "admin_token=abc123", "content-type": "application/json" },
    });

    const res = await POST(req);

    expect(res._status).toBe(200);
    expect(res._data).toEqual({ name: "تصنيف جديد", count: 0 });
    const [calledUrl, calledInit] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toContain("/api/admin/main-categories");
    expect((calledInit as { method: string }).method).toBe("POST");
    expect((calledInit.headers as Record<string, string>).cookie).toBe("admin_token=abc123");
  });

  it("يرجع 400 لو الاسم موجود", async () => {
    jest.resetModules();
    mockFetchFail(400, "التصنيف موجود بالفعل");
    const { POST } = require("../app/api/admin/main-categories/route");
    const req = makeNextRequest("/api/admin/main-categories", {
      method: "POST",
      body: JSON.stringify({ name: "شرائح STC" }),
      headers: { cookie: "admin_token=abc123" },
    });

    const res = await POST(req);
    expect(res._status).toBe(400);
    expect(res._data.error).toBe("التصنيف موجود بالفعل");
  });
});

describe("PUT /api/admin/main-categories/rename", () => {
  it("يمرر oldName و newName والـcookies للـbackend", async () => {
    jest.resetModules();
    mockFetchOk({ success: true });
    const { PUT } = require("../app/api/admin/main-categories/rename/route");
    const req = makeNextRequest("/api/admin/main-categories/rename", {
      method: "PUT",
      body: JSON.stringify({ oldName: "شرائح STC", newName: "شرائح STC الجديدة" }),
      headers: { cookie: "admin_token=abc123" },
    });

    const res = await PUT(req);

    expect(res._status).toBe(200);
    expect(res._data).toEqual({ success: true });
    const [calledUrl, calledInit] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toContain("/api/admin/main-categories/rename");
    expect((calledInit as { method: string }).method).toBe("PUT");
    const body = JSON.parse(calledInit.body as string);
    expect(body.oldName).toBe("شرائح STC");
    expect(body.newName).toBe("شرائح STC الجديدة");
  });

  it("يرجع 400 لو الاسم الجديد موجود بالفعل", async () => {
    jest.resetModules();
    mockFetchFail(400, "التصنيف موجود بالفعل");
    const { PUT } = require("../app/api/admin/main-categories/rename/route");
    const req = makeNextRequest("/api/admin/main-categories/rename", {
      method: "PUT",
      body: JSON.stringify({ oldName: "شرائح STC", newName: "شرائح زين" }),
      headers: { cookie: "admin_token=abc123" },
    });

    const res = await PUT(req);
    expect(res._status).toBe(400);
  });
});

describe("DELETE /api/admin/main-categories/remove", () => {
  it("يمرر الاسم والـcookies للـbackend ويحذف التصنيف", async () => {
    jest.resetModules();
    mockFetchOk({ success: true });
    const { DELETE } = require("../app/api/admin/main-categories/remove/route");
    const req = makeNextRequest("/api/admin/main-categories/remove", {
      method: "DELETE",
      body: JSON.stringify({ name: "شرائح STC" }),
      headers: { cookie: "admin_token=abc123" },
    });

    const res = await DELETE(req);

    expect(res._status).toBe(200);
    expect(res._data).toEqual({ success: true });
    const [calledUrl, calledInit] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toContain("/api/admin/main-categories/remove");
    expect((calledInit as { method: string }).method).toBe("DELETE");
    const body = JSON.parse(calledInit.body as string);
    expect(body.name).toBe("شرائح STC");
  });

  it("يرجع 401 لو مفيش token", async () => {
    jest.resetModules();
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ error: "غير مصرح" }) });
    const { DELETE } = require("../app/api/admin/main-categories/remove/route");
    const req = makeNextRequest("/api/admin/main-categories/remove", {
      method: "DELETE",
      body: JSON.stringify({ name: "شرائح STC" }),
    });

    const res = await DELETE(req);
    expect(res._status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 7. Page Integration — MainCategoriesPage
// ═════════════════════════════════════════════════════════════════════════════

describe("MainCategoriesPage — تكامل كامل", () => {
  function renderPage() {
    return render(<MainCategoriesPage />);
  }

  it("يعرض عنوان الصفحة وزر الإضافة", async () => {
    mockFetchOk(fakeCategories);
    renderPage();
    expect(screen.getByText("التصنيفات الرئيسية")).toBeInTheDocument();
    expect(screen.getByText("+ إضافة تصنيف")).toBeInTheDocument();
  });

  it("يعرض skeleton أثناء التحميل ثم يعرض البيانات", async () => {
    mockFetchOk(fakeCategories);
    renderPage();

    const pulseEls = document.querySelectorAll(".animate-pulse");
    expect(pulseEls.length).toBeGreaterThan(0);

    await waitFor(() => expect(screen.getByText("شرائح STC")).toBeInTheDocument());
    expect(screen.getByText("شرائح زين")).toBeInTheDocument();
  });

  it("يفتح AddModal عند الضغط على '+ إضافة تصنيف'", async () => {
    mockFetchOk(fakeCategories);
    renderPage();
    await waitFor(() => expect(screen.getByText("شرائح STC")).toBeInTheDocument());

    fireEvent.click(screen.getByText("+ إضافة تصنيف"));
    expect(screen.getByText("إضافة تصنيف جديد")).toBeInTheDocument();
  });

  it("يغلق AddModal عند الضغط على إلغاء", async () => {
    mockFetchOk(fakeCategories);
    renderPage();
    await waitFor(() => expect(screen.getByText("شرائح STC")).toBeInTheDocument());

    fireEvent.click(screen.getByText("+ إضافة تصنيف"));
    expect(screen.getByText("إضافة تصنيف جديد")).toBeInTheDocument();

    fireEvent.click(screen.getByText("إلغاء"));
    await waitFor(() => expect(screen.queryByText("إضافة تصنيف جديد")).not.toBeInTheDocument());
  });

  it("يفتح EditModal عند الضغط على تعديل", async () => {
    mockFetchOk(fakeCategories);
    renderPage();
    await waitFor(() => expect(screen.getByText("شرائح STC")).toBeInTheDocument());

    const editBtns = screen.getAllByTitle("تعديل");
    fireEvent.click(editBtns[0]);
    expect(screen.getByText(/تعديل.*شرائح STC/)).toBeInTheDocument();
  });

  it("يغلق EditModal عند الضغط على إلغاء", async () => {
    mockFetchOk(fakeCategories);
    renderPage();
    await waitFor(() => expect(screen.getByText("شرائح STC")).toBeInTheDocument());

    fireEvent.click(screen.getAllByTitle("تعديل")[0]);
    expect(screen.getByText(/تعديل.*شرائح STC/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("إلغاء"));
    await waitFor(() => expect(screen.queryByText(/تعديل.*شرائح STC/)).not.toBeInTheDocument());
  });

  it("يفتح DeleteModal عند الضغط على حذف", async () => {
    mockFetchOk(fakeCategories);
    renderPage();
    await waitFor(() => expect(screen.getByText("شرائح STC")).toBeInTheDocument());

    fireEvent.click(screen.getAllByTitle("حذف")[0]);
    expect(screen.getByText("تأكيد الحذف")).toBeInTheDocument();
    expect(screen.getAllByText(/شرائح STC/).length).toBeGreaterThan(0);
  });

  it("يغلق DeleteModal عند الضغط على إلغاء", async () => {
    mockFetchOk(fakeCategories);
    renderPage();
    await waitFor(() => expect(screen.getByText("شرائح STC")).toBeInTheDocument());

    fireEvent.click(screen.getAllByTitle("حذف")[0]);
    expect(screen.getByText("تأكيد الحذف")).toBeInTheDocument();

    fireEvent.click(screen.getByText("إلغاء"));
    await waitFor(() => expect(screen.queryByText("تأكيد الحذف")).not.toBeInTheDocument());
  });

  it("يضيف تصنيف جديد ويحدث الجدول", async () => {
    mockFetchOk(fakeCategories);
    renderPage();
    await waitFor(() => expect(screen.getByText("شرائح STC")).toBeInTheDocument());

    fireEvent.click(screen.getByText("+ إضافة تصنيف"));

    const input = screen.getByPlaceholderText("مثال: هواتف ذكية");
    await userEvent.type(input, "تصنيف جديد");

    mockFetchOk({ name: "تصنيف جديد", count: 0 });
    mockFetchOk([...fakeCategories, { name: "تصنيف جديد", count: 0 }]);

    fireEvent.submit(input.closest("form")!);

    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith(expect.stringContaining("تصنيف جديد")));
    await waitFor(() => expect(screen.queryByText("إضافة تصنيف جديد")).not.toBeInTheDocument());
  });

  it("يحذف تصنيف ويحدث الجدول", async () => {
    mockFetchOk(fakeCategories);
    renderPage();
    await waitFor(() => expect(screen.getByText("شرائح STC")).toBeInTheDocument());

    fireEvent.click(screen.getAllByTitle("حذف")[0]);
    expect(screen.getByText("تأكيد الحذف")).toBeInTheDocument();

    mockFetchOk({ success: true });
    mockFetchOk(fakeCategories.slice(1));

    fireEvent.click(screen.getByText("نعم، احذف"));

    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith(expect.stringContaining("شرائح STC")));
  });

  it("يفلتر التصنيفات عند الكتابة في البحث", async () => {
    mockFetchOk(fakeCategories);
    renderPage();
    await waitFor(() => expect(screen.getByText("شرائح STC")).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText("ابحث عن تصنيف...");
    await userEvent.type(searchInput, "STC");

    expect(screen.getByText("شرائح STC")).toBeInTheDocument();
    expect(screen.queryByText("شرائح زين")).not.toBeInTheDocument();
    expect(screen.queryByText("شرائح موبايلي")).not.toBeInTheDocument();
  });

  it("يعرض 'لا توجد تصنيفات' لما البحث مش موجود", async () => {
    mockFetchOk(fakeCategories);
    renderPage();
    await waitFor(() => expect(screen.getByText("شرائح STC")).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText("ابحث عن تصنيف...");
    await userEvent.type(searchInput, "xxxxx");

    expect(screen.getByText("لا توجد تصنيفات")).toBeInTheDocument();
  });

  it("لا يفتح أكتر من modal في نفس الوقت", async () => {
    mockFetchOk(fakeCategories);
    renderPage();
    await waitFor(() => expect(screen.getByText("شرائح STC")).toBeInTheDocument());

    fireEvent.click(screen.getByText("+ إضافة تصنيف"));
    expect(screen.getByText("إضافة تصنيف جديد")).toBeInTheDocument();
    expect(screen.queryByText("تأكيد الحذف")).not.toBeInTheDocument();
    expect(screen.queryByText(/تعديل:/)).not.toBeInTheDocument();
  });
});
