"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";

type SubCat = { name: string; category: string };
type GalleryItem = { url: string; caption: string };
type SpecItem = { label: string; value: string };
type SpecGroup = { groupName: string; items: SpecItem[] };
type ReviewItem = { name: string; rate: number | string; comment: string; date: string };

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const fileRef = useRef<HTMLInputElement>(null);
  const galleryFileRefs = useRef<(HTMLInputElement | null)[]>([null, null, null]);
  const imagesGalleryRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageLinkInput, setImageLinkInput] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryLinkInput, setGalleryLinkInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imagesGalleryUploading, setImagesGalleryUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<SubCat[]>([]);

  const [form, setForm] = useState({
    name: "",
    brief: "",
    originalPrice: "",
    salePrice: "",
    category: "",
    description: "",
    inStock: "true",
  });

  const [gallery, setGallery] = useState<GalleryItem[]>([
    { url: "", caption: "" },
    { url: "", caption: "" },
    { url: "", caption: "" },
  ]);

  const [specifications, setSpecifications] = useState<SpecGroup[]>([
    { groupName: "", items: [{ label: "", value: "" }] },
  ]);

  const [rating, setRating] = useState({ average: "", count: "" });
  const [reviews, setReviews] = useState<ReviewItem[]>([
    { name: "", rate: "", comment: "", date: "" },
  ]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/products/${id}`, { credentials: "include" }).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/admin/sub-categories", { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
    ]).then(([product, cats]) => {
      if (cats) setCategories(cats);
      if (product) {
        setForm({
          name: product.name || "",
          brief: product.brief || "",
          originalPrice: (product.originalPrice || product.price || "").toString(),
          salePrice: product.salePrice?.toString() || "",
          category: product.category || "",
          description: product.description || "",
          inStock: product.inStock === false ? "false" : "true",
        });

        const mainImg = product.image || product.images?.[0] || "";
        if (mainImg) {
          setImageUrl(mainImg);
          setImagePreview(mainImg);
        }

        // Load gallery images (plain)
        if (product.images?.length > 1) {
          setGalleryImages(product.images.slice(1));
        }

        // Load gallery with captions
        if (product.gallery?.length) {
          const g: GalleryItem[] = [
            product.gallery[0] || { url: "", caption: "" },
            product.gallery[1] || { url: "", caption: "" },
            product.gallery[2] || { url: "", caption: "" },
          ];
          setGallery(g);
        }

        // Load specifications
        if (product.specifications?.length) {
          setSpecifications(product.specifications);
        }

        // Load rating
        if (product.rating) {
          setRating({
            average: product.rating.average?.toString() || "",
            count: product.rating.count?.toString() || "",
          });
        }

        // Load reviews
        if (product.reviews?.length) {
          setReviews(product.reviews.map((r: ReviewItem) => ({ ...r, rate: r.rate?.toString() || "" })));
        }
      }
      setLoading(false);
    });
  }, [id]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function uploadImage(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch("/api/admin/products/upload-image", {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "فشل الرفع");
    return data.url;
  }

  async function handleMainImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setImageUrl(url);
      setImageLinkInput("");
      toast.success("تم رفع الصورة ✅");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "فشل رفع الصورة");
      setImagePreview("");
    } finally {
      setUploading(false);
    }
  }

  function handleMainImageLink() {
    const link = imageLinkInput.trim();
    if (!link) return;
    setImageUrl(link);
    setImagePreview(link);
    setImageLinkInput("");
    toast.success("تم إضافة رابط الصورة ✅");
  }

  function clearMainImage() {
    setImageUrl("");
    setImagePreview("");
    setImageLinkInput("");
    if (fileRef.current) fileRef.current.value = "";
  }

  // Images gallery handlers (plain images)
  async function handleImagesGalleryFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagesGalleryUploading(true);
    try {
      const url = await uploadImage(file);
      setGalleryImages((prev) => [...prev, url]);
      toast.success("تم رفع صورة الجاليري ✅");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "فشل رفع الصورة");
    } finally {
      setImagesGalleryUploading(false);
      if (imagesGalleryRef.current) imagesGalleryRef.current.value = "";
    }
  }

  function handleImagesGalleryLink() {
    const link = galleryLinkInput.trim();
    if (!link) return;
    setGalleryImages((prev) => [...prev, link]);
    setGalleryLinkInput("");
    toast.success("تم إضافة رابط الصورة ✅");
  }

  function removeImagesGalleryItem(index: number) {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  }

  // Gallery with captions handlers
  async function handleGalleryFile(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setGalleryUploading(index);
    try {
      const url = await uploadImage(file);
      setGallery((prev) => prev.map((g, i) => (i === index ? { ...g, url } : g)));
      toast.success("تم رفع الصورة ✅");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "فشل رفع الصورة");
    } finally {
      setGalleryUploading(null);
    }
  }

  function updateGalleryCaption(index: number, caption: string) {
    setGallery((prev) => prev.map((g, i) => (i === index ? { ...g, caption } : g)));
  }

  function updateGalleryUrl(index: number, url: string) {
    setGallery((prev) => prev.map((g, i) => (i === index ? { ...g, url } : g)));
  }

  function clearGalleryItem(index: number) {
    setGallery((prev) => prev.map((g, i) => (i === index ? { url: "", caption: "" } : g)));
  }

  // Specifications handlers
  function addSpecGroup() {
    setSpecifications((prev) => [...prev, { groupName: "", items: [{ label: "", value: "" }] }]);
  }

  function removeSpecGroup(index: number) {
    setSpecifications((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSpecGroupName(index: number, groupName: string) {
    setSpecifications((prev) => prev.map((g, i) => (i === index ? { ...g, groupName } : g)));
  }

  function addSpecItem(groupIndex: number) {
    setSpecifications((prev) =>
      prev.map((g, i) => (i === groupIndex ? { ...g, items: [...g.items, { label: "", value: "" }] } : g))
    );
  }

  function removeSpecItem(groupIndex: number, itemIndex: number) {
    setSpecifications((prev) =>
      prev.map((g, i) => (i === groupIndex ? { ...g, items: g.items.filter((_, j) => j !== itemIndex) } : g))
    );
  }

  function updateSpecItem(groupIndex: number, itemIndex: number, field: "label" | "value", val: string) {
    setSpecifications((prev) =>
      prev.map((g, i) =>
        i === groupIndex
          ? { ...g, items: g.items.map((item, j) => (j === itemIndex ? { ...item, [field]: val } : item)) }
          : g
      )
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.originalPrice) return toast.error("الاسم والسعر مطلوبان");
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        brief: form.brief,
        originalPrice: Number(form.originalPrice),
        price: Number(form.salePrice || form.originalPrice),
        category: form.category,
        description: form.description,
        inStock: form.inStock === "true",
        salePrice: form.salePrice ? Number(form.salePrice) : "",
      };
      if (imageUrl) body.imageUrl = imageUrl;
      else body.imageUrl = "";

      // Gallery with captions
      const filledGallery = gallery.filter((g) => g.url);
      body.gallery = filledGallery;

      // Images array (plain gallery) - always send to allow removal
      const allImages = imageUrl ? [imageUrl, ...galleryImages] : [...galleryImages];
      body.images = allImages;

      // Specifications
      const filledSpecs = specifications
        .filter((g) => g.groupName)
        .map((g) => ({ ...g, items: g.items.filter((item) => item.label && item.value) }))
        .filter((g) => g.items.length > 0);
      body.specifications = filledSpecs;

      // Rating
      body.rating = { average: Number(rating.average) || 0, count: Number(rating.count) || 0 };

      // Reviews
      const filledReviews = reviews.filter((r) => r.name && r.comment);
      body.reviews = filledReviews.map((r) => ({ ...r, rate: Number(r.rate) || 5 }));

      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الحفظ");
      toast.success("تم تعديل المنتج بنجاح ✅");
      router.push("/admin/products");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-400">جاري التحميل...</div>;

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 text-sm">
          ← رجوع
        </button>
        <h1 className="text-2xl font-bold text-gray-800">تعديل المنتج</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* القسم الأول - البيانات الأساسية */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">البيانات الأساسية</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* الصورة الأساسية */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">الصورة الأساسية</label>
              <div
                onClick={() => !imagePreview && fileRef.current?.click()}
                className={`border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center transition-colors h-48 ${!imagePreview ? "cursor-pointer hover:border-blue-400" : ""}`}
              >
                {imagePreview ? (
                  <div className="relative w-full h-full">
                    <img src={imagePreview} alt="preview" className="w-full h-full object-contain rounded-xl" />
                    {uploading && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl">
                        <span className="text-sm text-blue-600 font-medium">جاري الرفع...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <span className="text-4xl text-gray-200 mb-2">📷</span>
                    <span className="text-sm text-gray-500">اضغط لاختيار صورة</span>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleMainImageFile} />
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={imageLinkInput}
                  onChange={(e) => setImageLinkInput(e.target.value)}
                  placeholder="أو الصق رابط الصورة..."
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleMainImageLink())}
                />
                <button type="button" onClick={handleMainImageLink} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                  إضافة
                </button>
              </div>
              {imagePreview && (
                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={() => fileRef.current?.click()} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded-lg text-xs font-medium">
                    تغيير
                  </button>
                  <button type="button" onClick={clearMainImage} className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-1.5 rounded-lg text-xs font-medium">
                    🗑 مسح
                  </button>
                </div>
              )}

              {/* صور الجاليري العادية */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">صور الجاليري</label>
                {galleryImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {galleryImages.map((img, i) => (
                      <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square">
                        <img src={img} alt={`gallery-${i}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImagesGalleryItem(i)}
                          className="absolute top-1 left-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => imagesGalleryRef.current?.click()}
                  disabled={imagesGalleryUploading}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50"
                >
                  {imagesGalleryUploading ? "جاري الرفع..." : "📁 رفع صورة للجاليري"}
                </button>
                <input ref={imagesGalleryRef} type="file" accept="image/*" className="hidden" onChange={handleImagesGalleryFile} />
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={galleryLinkInput}
                    onChange={(e) => setGalleryLinkInput(e.target.value)}
                    placeholder="أو الصق رابط صورة..."
                    className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleImagesGalleryLink())}
                  />
                  <button type="button" onClick={handleImagesGalleryLink} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                    إضافة
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">عدد الصور: {galleryImages.length}</p>
              </div>
            </div>

            {/* البيانات */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنتج *</label>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="مثال: iPhone 16 Pro Max" className={inputClass} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">وصف قصير (Brief)</label>
                <input name="brief" value={form.brief} onChange={handleChange} placeholder="وصف مختصر يظهر تحت اسم المنتج..." className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">السعر الأساسي (ر.س) *</label>
                  <input name="originalPrice" type="number" min="0" step="any" value={form.originalPrice} onChange={handleChange} required placeholder="5000" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">سعر البيع بعد الخصم</label>
                  <input name="salePrice" type="number" min="0" step="any" value={form.salePrice} onChange={handleChange} placeholder="4500" className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
                  <select name="category" value={form.category} onChange={handleChange} className={inputClass}>
                    <option value="">-- اختر تصنيف --</option>
                    {categories.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                  <select name="inStock" value={form.inStock} onChange={handleChange} className={inputClass}>
                    <option value="true">متوفر</option>
                    <option value="false">غير متوفر</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* القسم الثاني - الوصف التفصيلي */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">الوصف التفصيلي</h2>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={6}
            placeholder="اكتب وصف تفصيلي كبير عن المنتج..."
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* القسم الثالث - الجاليري */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">جاليري الصور (3 صور مع وصف)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {gallery.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-3 space-y-3">
                <p className="text-xs font-medium text-gray-500">صورة {index + 1}</p>
                {item.url ? (
                  <div className="relative h-36 rounded-lg overflow-hidden border border-gray-100">
                    <img src={item.url} alt={`gallery-${index}`} className="w-full h-full object-cover" />
                    {galleryUploading === index && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <span className="text-xs text-blue-600">جاري الرفع...</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => clearGalleryItem(index)}
                      className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => galleryFileRefs.current[index]?.click()}
                    className="h-36 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors"
                  >
                    {galleryUploading === index ? (
                      <span className="text-xs text-blue-600">جاري الرفع...</span>
                    ) : (
                      <>
                        <span className="text-2xl text-gray-200">📷</span>
                        <span className="text-xs text-gray-400 mt-1">اضغط للرفع</span>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={(el) => { galleryFileRefs.current[index] = el; }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleGalleryFile(index, e)}
                />
                <input
                  type="text"
                  value={item.url}
                  onChange={(e) => updateGalleryUrl(index, e.target.value)}
                  placeholder="رابط الصورة..."
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={item.caption}
                  onChange={(e) => updateGalleryCaption(index, e.target.value)}
                  placeholder="الكلام على الصورة..."
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* القسم الرابع - المواصفات */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">المواصفات</h2>
            <button type="button" onClick={addSpecGroup} className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-medium">
              + إضافة قسم
            </button>
          </div>

          <div className="space-y-4">
            {specifications.map((group, gIndex) => (
              <div key={gIndex} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={group.groupName}
                    onChange={(e) => updateSpecGroupName(gIndex, e.target.value)}
                    placeholder="اسم القسم (مثال: الشاشة، الكاميرا، البطارية...)"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {specifications.length > 1 && (
                    <button type="button" onClick={() => removeSpecGroup(gIndex)} className="text-red-500 hover:text-red-700 text-sm px-2">
                      🗑
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {group.items.map((item, iIndex) => (
                    <div key={iIndex} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => updateSpecItem(gIndex, iIndex, "label", e.target.value)}
                        placeholder="المواصفة (مثال: الحجم)"
                        className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={item.value}
                        onChange={(e) => updateSpecItem(gIndex, iIndex, "value", e.target.value)}
                        placeholder="القيمة (مثال: 6.7 بوصة)"
                        className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {group.items.length > 1 && (
                        <button type="button" onClick={() => removeSpecItem(gIndex, iIndex)} className="text-red-400 hover:text-red-600 text-xs">
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button type="button" onClick={() => addSpecItem(gIndex)} className="mt-2 text-blue-500 hover:text-blue-700 text-xs font-medium">
                  + إضافة مواصفة
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* القسم الخامس - التقييم والمراجعات */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">التقييم والمراجعات</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">متوسط التقييم</label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={rating.average}
                onChange={(e) => setRating((prev) => ({ ...prev, average: e.target.value }))}
                placeholder="4.9"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">عدد التقييمات</label>
              <input
                type="number"
                min="0"
                value={rating.count}
                onChange={(e) => setRating((prev) => ({ ...prev, count: e.target.value }))}
                placeholder="284"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">المراجعات</h3>
            <button
              type="button"
              onClick={() => setReviews((prev) => [...prev, { name: "", rate: "", comment: "", date: "" }])}
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-medium"
            >
              + إضافة مراجعة
            </button>
          </div>

          <div className="space-y-3">
            {reviews.map((review, rIndex) => (
              <div key={rIndex} className="border border-gray-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-400">مراجعة {rIndex + 1}</span>
                  {reviews.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setReviews((prev) => prev.filter((_, i) => i !== rIndex))}
                      className="text-red-400 hover:text-red-600 text-xs mr-auto"
                    >
                      🗑 حذف
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <input
                    type="text"
                    value={review.name}
                    onChange={(e) => setReviews((prev) => prev.map((r, i) => (i === rIndex ? { ...r, name: e.target.value } : r)))}
                    placeholder="اسم المراجع"
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={review.rate}
                    onChange={(e) => setReviews((prev) => prev.map((r, i) => (i === rIndex ? { ...r, rate: e.target.value } : r)))}
                    placeholder="التقييم (1-5)"
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={review.date}
                    onChange={(e) => setReviews((prev) => prev.map((r, i) => (i === rIndex ? { ...r, date: e.target.value } : r)))}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <input
                  type="text"
                  value={review.comment}
                  onChange={(e) => setReviews((prev) => prev.map((r, i) => (i === rIndex ? { ...r, comment: e.target.value } : r)))}
                  placeholder="التعليق..."
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* زر الحفظ */}
        <div className="flex gap-3">
          <button type="submit" disabled={saving || uploading} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
            {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
          </button>
          <button type="button" onClick={() => router.back()} className="px-8 border border-gray-300 text-gray-600 hover:bg-gray-50 py-2.5 rounded-lg text-sm font-medium transition-colors">
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
