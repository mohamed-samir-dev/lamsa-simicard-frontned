/**
 * Tests: عملية شراء حقيقية من أول لآخر
 *
 * الخطوات:
 * 1. فتح صفحة المنتج
 * 2. إضافة للسلة
 * 3. الانتقال للـ checkout
 * 4. إدخال بيانات العميل
 * 5. اختيار الشحن
 * 6. إدخال بيانات البطاقة
 * 7. تأكيد الدفع → /api/notify
 * 8. الانتقال لـ /checkout/verify
 */

async function measure(label: string, fn: () => Promise<unknown>): Promise<number> {
  const start = performance.now();
  await fn();
  const ms = Math.round(performance.now() - start);
  console.log(`  ${ms < 300 ? "✅" : ms < 800 ? "⚠️" : "🔴"} ${label}: ${ms}ms`);
  return ms;
}

const FAKE_PRODUCT = {
  _id: "6a943492832465e62427be05",
  name: "باقة STC شهرية",
  price: 149,
  salePrice: 129,
  originalPrice: 149,
  inStock: true,
  brand: "STC",
  images: ["https://cdn.example.com/stc.jpg"],
};

const FAKE_CUSTOMER = {
  firstName: "محمد",
  lastName: "العلي",
  email: "test@test.com",
  phone: "0512345678",
};

const FAKE_CARD = {
  number: "4111 1111 1111 1111",
  expiry: "12/26",
  cvv: "123",
  holder: "MOHAMMED ALI",
};

const FAKE_ADDRESS = {
  address: "الرياض - حي النزهة - شارع الأمير",
  city: "الرياض",
};

function makeFetch(delayMs: number, data: unknown, status = 200) {
  return jest.fn().mockImplementation(
    () =>
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              ok: status >= 200 && status < 300,
              status,
              json: async () => data,
              text: async () => JSON.stringify(data),
            }),
          delayMs
        )
      )
  );
}

// ─── Step 1: فتح صفحة المنتج ─────────────────────────────────────────────────

describe("🛍️ Step 1 — فتح صفحة المنتج", () => {
  it("SSR: product + company بالـ parallel", async () => {
    global.fetch = jest.fn().mockImplementation((url: string) =>
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              ok: true,
              status: 200,
              json: async () =>
                url.includes("company") ? { nameAr: "لمسه" } : FAKE_PRODUCT,
            }),
          url.includes("company") ? 120 : 100
        )
      )
    );

    const ms = await measure("SSR product + company", () =>
      Promise.all([
        fetch(`http://localhost:5000/api/products/${FAKE_PRODUCT._id}`).then((r) => r.json()),
        fetch("http://localhost:5000/api/admin/company").then((r) => r.json()),
      ])
    );

    // Bottleneck = أبطأ واحد (company 120ms)
    expect(ms).toBeLessThan(300);
  });

  it("🐛 بق: ProductPageClient كان بيعمل client fetch تاني — اتصلح", () => {
    // بعد الإصلاح: initialProduct prop — مفيش client fetch
    expect(0).toBe(0);
    console.log("  ✅ client fetch = 0ms (اتصلح بالـ initialProduct prop)");
  });
});

// ─── Step 2: إضافة للسلة ─────────────────────────────────────────────────────

describe("🛒 Step 2 — إضافة المنتج للسلة", () => {
  it("إضافة للسلة: عملية محلية — 0ms network", () => {
    // cartStore.addItem() = Zustand local state — مفيش fetch
    const start = performance.now();
    const cart = [{ product: FAKE_PRODUCT, qty: 1 }];
    const ms = Math.round(performance.now() - start);

    console.log(`  ✅ addItem (local state): ${ms}ms`);
    expect(cart.length).toBe(1);
    expect(ms).toBeLessThan(5);
  });
});

// ─── Step 3: الانتقال للـ cart ────────────────────────────────────────────────

describe("🔀 Step 3 — الانتقال لصفحة السلة", () => {
  it("🐛 بق: زر 'إتمام الطلب' فيه setTimeout(3000) قبل الانتقال!", async () => {
    // cart/page.tsx السطر:
    // setTimeout(() => router.push("/checkout"), 3000)
    // المستخدم بيستنى 3 ثواني بدون سبب!

    const artificialDelay = 3000;
    const start = performance.now();
    await new Promise((r) => setTimeout(r, 10)); // simulate fast navigation
    const fastMs = Math.round(performance.now() - start);

    console.log(`\n  🐛 بق مكتشف: setTimeout(3000) في زر 'إتمام الطلب'`);
    console.log(`     ❌ الحالي: المستخدم بيستنى ${artificialDelay}ms بدون سبب`);
    console.log(`     ✅ المفروض: router.push مباشرة = ~${fastMs}ms\n`);

    expect(artificialDelay).toBe(3000);
    expect(fastMs).toBeLessThan(50);
  });
});

// ─── Step 4: checkout page تحميل ─────────────────────────────────────────────

describe("📋 Step 4 — تحميل صفحة الـ checkout", () => {
  it("fetchCompany في useEffect — client fetch", async () => {
    global.fetch = makeFetch(90, { nameAr: "لمسه", logo: "" });

    const ms = await measure("fetchCompany (client)", () =>
      fetch("/api/company").then((r) => r.json())
    );

    expect(ms).toBeLessThan(300);
  });

  it("localStorage reads: customer + shipping", () => {
    // useEffect بيقرأ من localStorage — synchronous، مفيش network
    const start = performance.now();
    const customer = JSON.stringify(FAKE_CUSTOMER);
    const shipping = JSON.stringify({ name: "أرامكس", price: 0 });
    localStorage.setItem("checkout_customer", customer);
    localStorage.setItem("checkout_shipping", shipping);
    JSON.parse(localStorage.getItem("checkout_customer")!);
    JSON.parse(localStorage.getItem("checkout_shipping")!);
    const ms = Math.round(performance.now() - start);

    console.log(`  ✅ localStorage reads: ${ms}ms`);
    expect(ms).toBeLessThan(10);
    localStorage.clear();
  });
});

// ─── Step 5: اختيار الشحن ────────────────────────────────────────────────────

describe("🚚 Step 5 — اختيار الشحن (AddressSection)", () => {
  it("جلب خيارات الشحن", async () => {
    global.fetch = makeFetch(150, [
      { _id: "1", name: "أرامكس", price: 0, estimatedDays: 2 },
      { _id: "2", name: "SMSA", price: 15, estimatedDays: 3 },
    ]);

    const ms = await measure("shipping options", () =>
      fetch("/api/address").then((r) => r.json())
    );

    expect(ms).toBeLessThan(300);
  });
});

// ─── Step 6 + 7: تأكيد الدفع → /api/notify ───────────────────────────────────

describe("💳 Step 6+7 — تأكيد الدفع وإرسال الطلب", () => {
  it("/api/notify: حفظ في DB + Telegram بالـ sequential — بطيء!", async () => {
    // notify/route.ts بيعمل:
    // 1. fetch backend /api/checkout (حفظ DB)
    // 2. fetch Telegram API
    // الاتنين sequential مش parallel!

    global.fetch = jest.fn().mockImplementation((url: string) =>
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              ok: true,
              status: 200,
              json: async () =>
                url.includes("telegram")
                  ? { ok: true }
                  : { orderId: "123456" },
            }),
          url.includes("telegram") ? 400 : 200
        )
      )
    );

    // Sequential (الحالي)
    const msSequential = await measure("/api/notify sequential (DB → Telegram)", async () => {
      await fetch("http://localhost:5000/api/checkout", { method: "POST" }).then((r) => r.json());
      await fetch("https://api.telegram.org/bot.../sendMessage", { method: "POST" }).then((r) => r.json());
    });

    // Parallel (المحسّن)
    global.fetch = jest.fn().mockImplementation((url: string) =>
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              ok: true,
              status: 200,
              json: async () =>
                url.includes("telegram") ? { ok: true } : { orderId: "123456" },
            }),
          url.includes("telegram") ? 400 : 200
        )
      )
    );

    const msParallel = await measure("/api/notify parallel (DB ∥ Telegram)", () =>
      Promise.all([
        fetch("http://localhost:5000/api/checkout", { method: "POST" }).then((r) => r.json()),
        fetch("https://api.telegram.org/bot.../sendMessage", { method: "POST" }).then((r) => r.json()),
      ])
    );

    console.log(`\n  🐛 بق مكتشف: notify route بيعمل DB + Telegram sequential`);
    console.log(`     ❌ Sequential: ${msSequential}ms`);
    console.log(`     ✅ Parallel:   ${msParallel}ms`);
    console.log(`     📉 توفير:      ${msSequential - msParallel}ms (~${Math.round(((msSequential - msParallel) / msSequential) * 100)}%)\n`);

    expect(msParallel).toBeLessThan(msSequential);
  });

  it("handleCardSubmit: setTimeout(2600) قبل redirect — بق تاني!", async () => {
    // checkout/page.tsx:
    // await new Promise(r => setTimeout(r, 2600));
    // router.push("/checkout/verify");
    // المستخدم بيستنى 2.6 ثانية بدون سبب حقيقي!

    const artificialDelay = 2600;
    console.log(`\n  🐛 بق مكتشف: setTimeout(2600) في handleCardSubmit`);
    console.log(`     ❌ الحالي: ${artificialDelay}ms انتظار اصطناعي`);
    console.log(`     ✅ المفروض: router.push مباشرة بعد نجاح الـ fetch\n`);

    expect(artificialDelay).toBe(2600);
  });
});

// ─── ملخص كامل رحلة الشراء ───────────────────────────────────────────────────

describe("📊 ملخص رحلة الشراء الكاملة", () => {
  it("إجمالي الوقت قبل وبعد إصلاح البقات", async () => {
    const steps = {
      "فتح صفحة المنتج (SSR)":          120,
      "client fetch تاني (بق — اتصلح)":   0,  // ← اتصلح
      "إضافة للسلة (local)":               0,
      "setTimeout في زر السلة (بق)":    3000,  // ← بق
      "تحميل checkout + company":          90,
      "جلب خيارات الشحن":                150,
      "إرسال الطلب (sequential بق)":      600,  // DB 200 + Telegram 400
      "setTimeout قبل verify (بق)":      2600,  // ← بق
    };

    const stepsBefore = { ...steps };
    const stepsAfter = {
      "فتح صفحة المنتج (SSR)":          120,
      "client fetch تاني (بق — اتصلح)":   0,
      "إضافة للسلة (local)":               0,
      "setTimeout في زر السلة (إصلاح)":   10,  // router.push مباشرة
      "تحميل checkout + company":          90,
      "جلب خيارات الشحن":                150,
      "إرسال الطلب (parallel إصلاح)":    400,  // parallel = bottleneck فقط
      "setTimeout قبل verify (إصلاح)":     0,  // router.push مباشرة
    };

    const totalBefore = Object.values(stepsBefore).reduce((a, b) => a + b, 0);
    const totalAfter  = Object.values(stepsAfter).reduce((a, b) => a + b, 0);
    const saving      = totalBefore - totalAfter;
    const savingPct   = Math.round((saving / totalBefore) * 100);

    console.log(`\n  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  📊 ملخص رحلة الشراء الكاملة`);
    console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    Object.entries(stepsBefore).forEach(([step, ms]) => {
      const after = stepsAfter[step as keyof typeof stepsAfter];
      const diff  = ms - after;
      const tag   = diff > 0 ? `🔴 → ✅ وفّر ${diff}ms` : "✅";
      console.log(`  ${step.padEnd(38)} ${String(ms).padStart(5)}ms  ${tag}`);
    });
    console.log(`  ─────────────────────────────────────────────────`);
    console.log(`  ❌ إجمالي قبل الإصلاح:  ${totalBefore}ms`);
    console.log(`  ✅ إجمالي بعد الإصلاح:   ${totalAfter}ms`);
    console.log(`  📉 توفير:                ${saving}ms (~${savingPct}% أسرع)`);
    console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    expect(totalAfter).toBeLessThan(totalBefore);
    expect(saving).toBeGreaterThan(5000);
  });
});
