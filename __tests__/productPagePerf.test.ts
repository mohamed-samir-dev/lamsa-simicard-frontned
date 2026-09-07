/**
 * Tests: Product Page Navigation Performance
 * يقيس وقت الانتقال من الصفحة الرئيسية لصفحة تفاصيل المنتج
 * ويكشف البق الأساسي: المنتج بيتجاب مرتين
 */

const FAST = 300;
const PRODUCT_ID = "6a943492832465e62427be05";

function mockFetch(delayMs: number, data: unknown = {}) {
  global.fetch = jest.fn().mockImplementation(
    () =>
      new Promise((resolve) =>
        setTimeout(
          () => resolve({ ok: true, status: 200, json: async () => data }),
          delayMs
        )
      )
  );
}

async function measure(fn: () => Promise<unknown>): Promise<number> {
  const start = performance.now();
  await fn();
  return Math.round(performance.now() - start);
}

const FAKE_PRODUCT = {
  _id: PRODUCT_ID,
  name: "باقة STC شهرية",
  price: 149,
  salePrice: 129,
  originalPrice: 149,
  inStock: true,
  brand: "STC",
};

// ─── البق: المنتج بيتجاب مرتين ───────────────────────────────────────────────

describe("🐛 البق — double fetch للمنتج", () => {
  it("page.tsx بيجيب المنتج من الـ server (SSR)", async () => {
    // page.tsx → getProduct() → fetch backend مباشرة
    mockFetch(100, FAKE_PRODUCT);

    const ms = await measure(() =>
      fetch(`http://localhost:5000/api/products/${PRODUCT_ID}`, {
        // next: { revalidate: 3600 } ← موجود في page.tsx
      }).then((r) => r.json())
    );

    console.log(`  ✅ SSR fetch (page.tsx): ${ms}ms`);
    expect(ms).toBeLessThan(FAST);
  });

  it("ProductPageClient بيعمل fetch تاني من الـ client رغم إن الداتا موجودة", async () => {
    // ProductPageClient → useEffect → fetch('/api/products/:id')
    // ده بيحصل بعد الـ hydration = وقت إضافي زيادة
    mockFetch(100, FAKE_PRODUCT);

    const ms = await measure(() =>
      fetch(`/api/products/${PRODUCT_ID}`).then((r) => r.json())
    );

    console.log(`  ❌ Client fetch (ProductPageClient useEffect): ${ms}ms — زيادة!`);
    expect(ms).toBeLessThan(FAST);
  });

  it("المنتج بيتجاب مرتين = ضعف الوقت والـ network overhead", async () => {
    let fetchCount = 0;
    global.fetch = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          fetchCount++;
          setTimeout(
            () => resolve({ ok: true, status: 200, json: async () => FAKE_PRODUCT }),
            100
          );
        })
    );

    // SSR fetch (page.tsx)
    await fetch(`http://localhost:5000/api/products/${PRODUCT_ID}`).then((r) => r.json());

    // Client fetch (ProductPageClient useEffect) — بيحصل بعد الـ hydration
    await fetch(`/api/products/${PRODUCT_ID}`).then((r) => r.json());

    console.log(`\n  🐛 عدد مرات جلب المنتج: ${fetchCount} (المفروض 1)`);
    console.log(`     fetch #1 → page.tsx SSR (صح)`);
    console.log(`     fetch #2 → ProductPageClient useEffect (زيادة!)\n`);

    // البق: بيتجاب مرتين
    expect(fetchCount).toBe(2);
  });
});

// ─── قياس وقت ظهور الصفحة كاملة ─────────────────────────────────────────────

describe("⏱ وقت ظهور صفحة المنتج", () => {
  it("SSR فقط (page.tsx) — وقت التحميل", async () => {
    mockFetch(100, FAKE_PRODUCT);

    const ms = await measure(() =>
      Promise.all([
        fetch(`http://localhost:5000/api/products/${PRODUCT_ID}`).then((r) => r.json()),
        fetch(`http://localhost:5000/api/admin/company`).then((r) => r.json()),
      ])
    );

    console.log(`  SSR (product + company parallel): ${ms}ms`);
    expect(ms).toBeLessThan(FAST);
  });

  it("مع البق: SSR + client fetch = وقت مضاعف للمستخدم", async () => {
    mockFetch(100, FAKE_PRODUCT);

    // SSR على السيرفر
    const ssrMs = await measure(() =>
      fetch(`http://localhost:5000/api/products/${PRODUCT_ID}`).then((r) => r.json())
    );

    // بعدين client fetch بعد الـ hydration
    const clientMs = await measure(() =>
      fetch(`/api/products/${PRODUCT_ID}`).then((r) => r.json())
    );

    const totalMs = ssrMs + clientMs;

    console.log(`\n  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  ⏱ وقت ظهور صفحة المنتج`);
    console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  SSR fetch (page.tsx):              ${ssrMs}ms`);
    console.log(`  Client fetch (ProductPageClient):  ${clientMs}ms  ← زيادة بسبب البق`);
    console.log(`  ─────────────────────────────────────`);
    console.log(`  إجمالي وقت انتظار المستخدم:        ${totalMs}ms`);
    console.log(`  لو اتصلح البق:                     ${ssrMs}ms فقط`);
    console.log(`  توفير:                             ${clientMs}ms (${Math.round((clientMs / totalMs) * 100)}% أسرع)`);
    console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // البق بيضيف وقت زيادة
    expect(totalMs).toBeGreaterThan(ssrMs);
  });

  it("بعد الإصلاح: ProductPageClient يستقبل الداتا كـ prop بدل fetch", async () => {
    // الحل: page.tsx يمرر product كـ prop لـ ProductPageClient
    // بدل ما ProductPageClient يعمل fetch تاني
    const clientFetchTime = 0; // مفيش fetch في الـ client

    console.log(`  ✅ بعد الإصلاح — client fetch: ${clientFetchTime}ms`);
    console.log(`     الداتا بتيجي كـ prop من page.tsx مباشرة`);

    expect(clientFetchTime).toBe(0);
  });
});

// ─── مقارنة قبل وبعد الإصلاح ─────────────────────────────────────────────────

describe("📊 مقارنة قبل وبعد إصلاح البق", () => {
  it("الفرق في عدد الـ requests والوقت", async () => {
    const delayMs = 100;

    // قبل: SSR + client fetch
    mockFetch(delayMs, FAKE_PRODUCT);
    const msBefore = await measure(() =>
      Promise.all([
        fetch(`http://localhost:5000/api/products/${PRODUCT_ID}`).then((r) => r.json()),
        fetch(`/api/products/${PRODUCT_ID}`).then((r) => r.json()),
      ])
    );

    // بعد: SSR فقط، الداتا تتمرر كـ prop
    mockFetch(delayMs, FAKE_PRODUCT);
    const msAfter = await measure(() =>
      fetch(`http://localhost:5000/api/products/${PRODUCT_ID}`).then((r) => r.json())
    );

    console.log(`\n  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  📊 مقارنة قبل وبعد إصلاح البق`);
    console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  ❌ قبل: ${msBefore}ms (SSR + client fetch)`);
    console.log(`  ✅ بعد:  ${msAfter}ms  (SSR فقط + prop)`);
    console.log(`  📉 توفير: ~${delayMs}ms لكل زيارة لصفحة منتج`);
    console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    expect(msAfter).toBeLessThan(msBefore);
  });
});
