import Image from "next/image";
import Link from "next/link";

export default function DeliveryBanner() {
  return (
    <section className="w-full px-3 sm:px-6 lg:px-8 py-8 sm:py-14">
      <Link href="/all-products" className="block max-w-6xl mx-auto">
        <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "16/7" }}>
          <Image
            src="/simfooter.webp"
            alt="توصيل لكافة مناطق المملكة من 1 إلى 3 أيام عمل"
            fill
            className="object-cover object-right hover:scale-105 transition-transform duration-500"
          />
        </div>
      </Link>
    </section>
  );
}
