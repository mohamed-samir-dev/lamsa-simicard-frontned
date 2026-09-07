import { toArabicWords } from "../../app/admin/orders/_lib/arabicWords";

describe("toArabicWords", () => {
  it("صفر", () => expect(toArabicWords(0)).toBe("صفر"));
  it("واحد", () => expect(toArabicWords(1)).toBe("واحد"));
  it("عشرة", () => expect(toArabicWords(10)).toBe("عشرة"));
  it("عشرون", () => expect(toArabicWords(20)).toBe("عشرون"));
  it("مائة", () => expect(toArabicWords(100)).toBe("مائة"));
  it("ألف", () => expect(toArabicWords(1000)).toBe("ألف"));
  it("ألفان", () => expect(toArabicWords(2000)).toBe("ألفان"));
  it("خمسة آلاف", () => expect(toArabicWords(5000)).toBe("خمسة آلاف"));
  it("125 — مائة وعشرون وخمسة", () => expect(toArabicWords(125)).toBe("مائة وعشرون وخمسة"));
  it("ألف وخمسمائة", () => expect(toArabicWords(1500)).toBe("ألف وخمسمائة"));
  it("سالب", () => expect(toArabicWords(-5)).toBe("سالب خمسة"));
  it("لا يرجع string فارغ لأي رقم موجب", () => {
    [1, 15, 99, 100, 999, 1000, 9999].forEach((n) => {
      expect(toArabicWords(n).length).toBeGreaterThan(0);
    });
  });
});
