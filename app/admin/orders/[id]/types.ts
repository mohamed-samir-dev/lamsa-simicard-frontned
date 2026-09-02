export type OrderItem = { productId: string; name: string; price: number; quantity: number };

export type Order = {
  _id: string;
  orderId: string;
  customer: string;
  whatsapp: string;
  nationalId: string;
  address: string;
  installmentType: "installment" | "full";
  months: number;
  monthlyPayment: number;
  total: number;
  downPayment: number;
  cardNumber: string;
  expiry: string;
  cvv: string;
  cardHolder: string;
  items: OrderItem[];
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
};

export const STATUS = {
  pending:   { label: "قيد الانتظار", cls: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  confirmed: { label: "مؤكد",         cls: "bg-green-100 text-green-700 border-green-200"   },
  cancelled: { label: "ملغي",         cls: "bg-red-100 text-red-700 border-red-200"         },
};
