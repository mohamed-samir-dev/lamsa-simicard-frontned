/**
 * Tests: paginationPages utility
 * يتحقق من منطق حساب أرقام الـ pagination
 */

function paginationPages(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}

describe("paginationPages", () => {
  it("7 صفحات أو أقل — يرجع كل الأرقام", () => {
    expect(paginationPages(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(paginationPages(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("أكثر من 7 — الصفحة الأولى دائماً موجودة", () => {
    const pages = paginationPages(5, 20);
    expect(pages[0]).toBe(1);
  });

  it("أكثر من 7 — الصفحة الأخيرة دائماً موجودة", () => {
    const pages = paginationPages(5, 20);
    expect(pages[pages.length - 1]).toBe(20);
  });

  it("الصفحة الحالية موجودة في النتيجة", () => {
    [1, 5, 10, 20].forEach((cur) => {
      const pages = paginationPages(cur, 20);
      expect(pages).toContain(cur);
    });
  });

  it("لا يتجاوز 7 عناصر في أي حالة", () => {
    [1, 2, 5, 10, 19, 20].forEach((cur) => {
      expect(paginationPages(cur, 20).length).toBeLessThanOrEqual(7);
    });
  });

  it("يضع ... عند الفجوات", () => {
    const pages = paginationPages(10, 20);
    expect(pages).toContain("...");
  });

  it("صفحة واحدة فقط", () => {
    expect(paginationPages(1, 1)).toEqual([1]);
  });

  it("الصفحة الأولى من مجموعة كبيرة", () => {
    const pages = paginationPages(1, 100);
    expect(pages[0]).toBe(1);
    expect(pages[pages.length - 1]).toBe(100);
    expect(pages).not.toContain(0);
  });

  it("الصفحة الأخيرة من مجموعة كبيرة", () => {
    const pages = paginationPages(100, 100);
    expect(pages).toContain(100);
    expect(pages[0]).toBe(1);
  });
});
