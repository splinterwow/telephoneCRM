import { useState, useEffect } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Search, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const API_URL = "http://nuriddin777.uz/api/installments/";
const SALES_API_URL = "http://nuriddin777.uz/api/sales/";
const KASSA_API_URL = "http://nuriddin777.uz/api/kassa/";
const CUSTOMERS_API_URL = "http://nuriddin777.uz/api/customers/";
const PRODUCTS_API_URL = "http://nuriddin777.uz/api/products/";

// API'dan kelgan ma'lumotlarga mos interfeys
interface Installment {
  id: number;
  sale_id: number;
  customer_name: string;
  initial_amount: string;
  interest_rate: string;
  term_months: number;
  monthly_payment: string;
  total_amount_due: string;
  down_payment: string;
  amount_paid: string;
  remaining_amount: number;
  next_payment_due_date: string;
  status: string;
  status_display: string;
  is_overdue: boolean;
  created_at: string;
  sale?: {
    total_amount_uzs: string;
    total_amount_usd: string;
    payment_type: string;
    status: string;
    created_at: string;
  };
  customer?: {
    full_name: string;
    phone_number: string;
    email: string;
    address: string;
  };
  return_adjustment?: string;
}

// Kassa ma'lumotlari uchun interfeys
interface Kassa {
  id: number;
  name: string;
}

// Mijoz ma'lumotlari uchun interfeys
interface Customer {
  id: number;
  full_name: string;
}

// Mahsulot ma'lumotlari uchun interfeys
interface Product {
  id: number;
  name: string;
}

// API javobining tuzilishi
interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: any[];
}

// Yangi savdo uchun forma ma'lumotlari
interface NewSale {
  items: { product_id: number; quantity: number }[];
  payment_type: string;
  kassa_id: number;
  customer_id: number;
  amount_paid_uzs_initial: string;
  installment_initial_amount?: string;
  installment_interest_rate?: string;
  installment_term_months?: number;
}

export default function MuddatliTolovlar() {
  const [qidiruv, setQidiruv] = useState("");
  const [muddatliTolovlar, setMuddatliTolovlar] = useState<Installment[]>([]);
  const [yuklanmoqda, setYuklanmoqda] = useState(false);
  const [modalOchik, setModalOchik] = useState(false);
  const [createModalOchik, setCreateModalOchik] = useState(false);
  const [tanlanganTolov, setTanlanganTolov] = useState<Installment | null>(null);
  const [tolovYuklanmoqda, setTolovYuklanmoqda] = useState(false);
  const [tolovMiqdori, setTolovMiqdori] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Naqd");
  const [newSale, setNewSale] = useState<NewSale>({
    items: [{ product_id: 0, quantity: 1 }],
    payment_type: "Nasiya", // Standart qiymat "Nasiya" qilib o'rnatildi
    kassa_id: 0,
    customer_id: 0,
    amount_paid_uzs_initial: "0.00",
    installment_initial_amount: "0.00",
    installment_interest_rate: "0.00",
    installment_term_months: 1,
  });
  const [kassaList, setKassaList] = useState<Kassa[]>([]);
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [productList, setProductList] = useState<Product[]>([]);

  const autentifikatsiyaSarlavhalari = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Avtorizatsiya tokeni topilmadi. Iltimos, qayta tizimga kiring.");
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  };

  // API'dan kassa ma'lumotlarini olish
  const fetchKassaList = async () => {
    const sarlavhalar = autentifikatsiyaSarlavhalari();
    if (!sarlavhalar) return;
    try {
      const response = await axios.get(KASSA_API_URL, { headers: sarlavhalar });
      setKassaList(response.data.results || response.data);
    } catch (e: any) {
      toast.error("Kassa ma'lumotlarini yuklashda xatolik: " + (e.response?.data?.detail || e.message));
    }
  };

  // API'dan mijozlar ma'lumotlarini olish
  const fetchCustomerList = async () => {
    const sarlavhalar = autentifikatsiyaSarlavhalari();
    if (!sarlavhalar) return;
    try {
      const response = await axios.get(CUSTOMERS_API_URL, { headers: sarlavhalar });
      setCustomerList(response.data.results || response.data);
    } catch (e: any) {
      toast.error("Mijozlar ma'lumotlarini yuklashda xatolik: " + (e.response?.data?.detail || e.message));
    }
  };

  // API'dan mahsulotlar ma'lumotlarini olish
  const fetchProductList = async () => {
    const sarlavhalar = autentifikatsiyaSarlavhalari();
    if (!sarlavhalar) return;
    try {
      const response = await axios.get(PRODUCTS_API_URL, { headers: sarlavhalar });
      setProductList(response.data.results || response.data);
    } catch (e: any) {
      toast.error("Mahsulotlar ma'lumotlarini yuklashda xatolik: " + (e.response?.data?.detail || e.message));
    }
  };

  // API'dan ma'lumotlarni olish
  const muddatliTolovlarniOlish = async () => {
    setYuklanmoqda(true);
    const sarlavhalar = autentifikatsiyaSarlavhalari();
    if (!sarlavhalar) {
      setYuklanmoqda(false);
      return;
    }
    try {
      const javob = await axios.get<ApiResponse>(API_URL, { headers: sarlavhalar });
      setMuddatliTolovlar(javob.data.results);
    } catch (e: any) {
      toast.error("Ma'lumotlarni yuklashda xatolik: " + (e.response?.data?.detail || e.message));
    } finally {
      setYuklanmoqda(false);
    }
  };

  useEffect(() => {
    muddatliTolovlarniOlish();
    fetchKassaList();
    fetchCustomerList();
    fetchProductList();
  }, []);

  const holatBelgisi = (holat: string, muddatiOtgan: boolean) => {
    const holatRanglari: Record<string, string> = {
      Active: muddatiOtgan ? "bg-red-500" : "bg-green-500",
      Completed: "bg-blue-500",
      Overdue: "bg-red-500",
      Pending: "bg-yellow-500",
      Cancelled: "bg-gray-500",
    };

    const holatMatni = holat.toLowerCase() === "active" ? (muddatiOtgan ? "Muddati o'tgan" : "Faol") : holat;
    return (
      <Badge className={holatRanglari[holat] || "bg-gray-500"}>
        {holatMatni}
      </Badge>
    );
  };

  // Mijoz nomiga qarab filtr qilish
  const filtrlanganTolovlar = muddatliTolovlar.filter((tolov) =>
    tolov.customer_name.toLowerCase().includes(qidiruv.toLowerCase())
  );

  // Modalni ochish
  const modalniOchish = (tolov: Installment) => {
    setTanlanganTolov(tolov);
    setTolovMiqdori("");
    setPaymentMethod("Naqd");
    setModalOchik(true);
  };

  // To‘lovni amalga oshirish
  const tolovniAmalgaOshirish = async () => {
    if (!tanlanganTolov || !tolovMiqdori || parseFloat(tolovMiqdori) <= 0) {
      toast.error("Iltimos, to‘lov miqdorini to‘g‘ri kiriting!");
      return;
    }

    if (parseFloat(tolovMiqdori) > tanlanganTolov.remaining_amount) {
      toast.error("To‘lov miqdori qolgan summadan katta bo‘lishi mumkin emas!");
      return;
    }

    setTolovYuklanmoqda(true);
    const sarlavhalar = autentifikatsiyaSarlavhalari();
    if (!sarlavhalar) {
      setTolovYuklanmoqda(false);
      return;
    }
    try {
      const payload = {
        amount: tolovMiqdori,
        payment_method: paymentMethod,
      };
      await axios.post(`${API_URL}${tanlanganTolov.id}/pay/`, payload, { headers: sarlavhalar });
      toast.success("To‘lov muvaffaqiyatli amalga oshirildi!");
      setModalOchik(false);
      muddatliTolovlarniOlish();
    } catch (e: any) {
      const xatoXabari = e.response?.data?.detail || e.response?.data?.error || e.message;
      toast.error(`To‘lovda xatolik: ${xatoXabari}`);
    } finally {
      setTolovYuklanmoqda(false);
    }
  };

  // Yangi savdoni yaratish
  const createSale = async () => {
    const sarlavhalar = autentifikatsiyaSarlavhalari();
    if (!sarlavhalar) return;

    try {
      const payload = {
        items: newSale.items,
        payment_type: newSale.payment_type,
        kassa_id: newSale.kassa_id,
        customer_id: newSale.customer_id,
        amount_paid_uzs_initial: newSale.amount_paid_uzs_initial,
        ...(newSale.payment_type === "Nasiya" && {
          installment_initial_amount: newSale.installment_initial_amount,
          installment_interest_rate: newSale.installment_interest_rate,
          installment_term_months: newSale.installment_term_months,
        }),
      };
      await axios.post(SALES_API_URL, payload, { headers: sarlavhalar });
      toast.success("Savdo muvaffaqiyatli qo‘shildi!");
      setCreateModalOchik(false);
      setNewSale({
        items: [{ product_id: 0, quantity: 1 }],
        payment_type: "Nasiya",
        kassa_id: 0,
        customer_id: 0,
        amount_paid_uzs_initial: "0.00",
        installment_initial_amount: "0.00",
        installment_interest_rate: "0.00",
        installment_term_months: 1,
      });
      muddatliTolovlarniOlish();
    } catch (e: any) {
      toast.error("Savdoni qo‘shishda xatolik: " + (e.response?.data?.detail || e.message));
    }
  };

  // Mahsulot qo'shish
  const addItem = () => {
    setNewSale({
      ...newSale,
      items: [...newSale.items, { product_id: 0, quantity: 1 }],
    });
  };

  // Mahsulotni o'chirish
  const removeItem = (index: number) => {
    setNewSale({
      ...newSale,
      items: newSale.items.filter((_, i) => i !== index),
    });
  };

  // Mahsulotni o'zgartirish
  const updateItem = (index: number, field: "product_id" | "quantity", value: number) => {
    const updatedItems = [...newSale.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setNewSale({ ...newSale, items: updatedItems });
  };

  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold gradient-heading">Muddatli to‘lovlar</h1>
        <Button className="flex items-center gap-2" onClick={() => setCreateModalOchik(true)}>
          <Plus className="h-4 w-4" />
          Muddatli to‘lov qo‘shish
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative md:w-96">
          <Input
            placeholder="Qidiruv..."
            value={qidiruv}
            onChange={(e) => setQidiruv(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <Card className="card-gradient">
        <CardHeader>
          <CardTitle>Muddatli to‘lovlar ro‘yxati</CardTitle>
        </CardHeader>
        <CardContent>
          {yuklanmoqda ? (
            <div className="flex justify-center items-center h-64">
              <p>Yuklanmoqda...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mijoz</TableHead>
                  <TableHead>Jami summa</TableHead>
                  <TableHead>Qolgan summa</TableHead>
                  <TableHead>Keyingi to‘lov</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrlanganTolovlar.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      Ma'lumot topilmadi
                    </TableCell>
                  </TableRow>
                ) : (
                  filtrlanganTolovlar.map((tolov) => (
                    <TableRow key={tolov.id}>
                      <TableCell>{tolov.customer_name}</TableCell>
                      <TableCell>{parseFloat(tolov.total_amount_due).toLocaleString()}</TableCell>
                      <TableCell>{tolov.remaining_amount.toLocaleString()}</TableCell>
                      <TableCell>
                        {tolov.next_payment_due_date
                          ? format(new Date(tolov.next_payment_due_date), "dd/MM/yyyy")
                          : "N/A"}
                      </TableCell>
                      <TableCell>{holatBelgisi(tolov.status, tolov.is_overdue)}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => modalniOchish(tolov)}>
                          To‘lash
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* To'lov qilish modal */}
      {modalOchik && tanlanganTolov && (
        <Dialog open={modalOchik} onOpenChange={setModalOchik}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>To‘lov amalga oshirish</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 items-center gap-4">
                <span className="font-bold">Mijoz:</span>
                <span>{tanlanganTolov.customer_name}</span>
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <span className="font-bold">Jami summa:</span>
                <span>{parseFloat(tanlanganTolov.total_amount_due).toLocaleString()} UZS</span>
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <span className="font-bold">Qolgan summa:</span>
                <span>{tanlanganTolov.remaining_amount.toLocaleString()} UZS</span>
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <span className="font-bold">Keyingi to‘lov sanasi:</span>
                <span>
                  {tanlanganTolov.next_payment_due_date
                    ? format(new Date(tanlanganTolov.next_payment_due_date), "dd/MM/yyyy")
                    : "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <span className="font-bold">To‘lov miqdori:</span>
                <Input
                  type="number"
                  placeholder="Summani kiriting (UZS)"
                  value={tolovMiqdori}
                  onChange={(e) => setTolovMiqdori(e.target.value)}
                  min="0"
                  max={tanlanganTolov.remaining_amount.toString()}
                  required
                />
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <span className="font-bold">To‘lov usuli:</span>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="Naqd">Naqd</option>
                  <option value="Karta">Karta</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOchik(false)}>
                Bekor qilish
              </Button>
              <Button onClick={tolovniAmalgaOshirish} disabled={tolovYuklanmoqda}>
                {tolovYuklanmoqda ? "Yuklanmoqda..." : "To‘lash"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Yangi savdo qo‘shish modal */}
      {createModalOchik && (
        <Dialog open={createModalOchik} onOpenChange={setCreateModalOchik}>
          <DialogContent className="sm:max-w-[400px] max-h-[80vh] overflow-y-auto hide-scrollbar">
            <DialogHeader>
              <DialogTitle>Yangi savdo qo‘shish</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 items-center gap-4">
                <span className="font-bold">To‘lov turi:</span>
                <select
                  value={newSale.payment_type}
                  onChange={(e) => setNewSale({ ...newSale, payment_type: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="Nasiya">Nasiya</option>
                </select>
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <span className="font-bold">Kassa:</span>
                <select
                  value={newSale.kassa_id}
                  onChange={(e) => setNewSale({ ...newSale, kassa_id: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded"
                >
                  <option value={0}>Tanlang</option>
                  {kassaList.map((kassa) => (
                    <option key={kassa.id} value={kassa.id}>
                      {kassa.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <span className="font-bold">Mijoz:</span>
                <select
                  value={newSale.customer_id}
                  onChange={(e) => setNewSale({ ...newSale, customer_id: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded"
                >
                  <option value={0}>Tanlang</option>
                  {customerList.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <span className="font-bold">Dastlabki to‘lov (UZS):</span>
                <Input
                  type="number"
                  step="0.01"
                  value={newSale.amount_paid_uzs_initial}
                  onChange={(e) => setNewSale({ ...newSale, amount_paid_uzs_initial: e.target.value })}
                  placeholder="Dastlabki to‘lov (UZS)"
                  required
                />
              </div>
              {newSale.payment_type === "Nasiya" && (
                <>
                  <div className="grid grid-cols-2 items-center gap-4">
                    <span className="font-bold">Asl narx (UZS):</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={newSale.installment_initial_amount}
                      onChange={(e) => setNewSale({ ...newSale, installment_initial_amount: e.target.value })}
                      placeholder="Asl narx (UZS)"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 items-center gap-4">
                    <span className="font-bold">Foiz stavkasi (%):</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={newSale.installment_interest_rate}
                      onChange={(e) => setNewSale({ ...newSale, installment_interest_rate: e.target.value })}
                      placeholder="Foiz stavkasi (%)"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 items-center gap-4">
                    <span className="font-bold">Muddat (oy):</span>
                    <Input
                      type="number"
                      value={newSale.installment_term_months}
                      onChange={(e) => setNewSale({ ...newSale, installment_term_months: parseInt(e.target.value) })}
                      placeholder="Muddat (oy)"
                      min="1"
                      required
                    />
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 items-center gap-4">
                <span className="font-bold">Mahsulotlar:</span>
                <Button variant="outline" onClick={addItem}>
                  + Mahsulot qo‘shish
                </Button>
              </div>
              {newSale.items.map((item, index) => (
                <div key={index} className="grid gap-2 border p-2 rounded relative">
                  <button
                    onClick={() => removeItem(index)}
                    className="absolute top-1 right-1 p-1 text-red-500 hover:bg-red-100 rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="grid grid-cols-2 items-center gap-4">
                    <span className="font-bold">Mahsulot ID:</span>
                    <select
                      value={item.product_id}
                      onChange={(e) => updateItem(index, "product_id", parseInt(e.target.value))}
                      className="w-full p-2 border rounded"
                    >
                      <option value={0}>Tanlang</option>
                      {productList.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name || `Mahsulot #${product.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 items-center gap-4">
                    <span className="font-bold">Miqdor:</span>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value))}
                      placeholder="Miqdor"
                      min="1"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateModalOchik(false)}>
                Bekor qilish
              </Button>
              <Button onClick={createSale}>Saqlash</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}