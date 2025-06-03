import React, { useState, useEffect } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const INSTALLMENTS_API_URL = "http://nuriddin777.uz/api/installments/";
const SALES_API_URL = "http://nuriddin777.uz/api/sales/sales/";

interface Customer {
  id?: number;
  full_name: string;
  phone_number: string;
  email: string;
  address: string;
}

interface Sale {
  id?: number;
  total_amount_uzs: string;
  total_amount_usd: string;
  payment_type: string;
  status: string;
  created_at: string;
}

export interface Installment {
  id?: number;
  initial_amount: string;
  interest_rate: string;
  term_months: number;
  monthly_payment: string;
  total_amount_due: string;
  down_payment: string;
  amount_paid: string;
  status: string;
  created_at?: string;
  sale: Sale | number | null;
  customer: Customer | number;
  return_adjustment?: string;
}

interface SaleItem {
  product_id: number;
  quantity: number;
}

interface SaleFormData {
  items: SaleItem[];
  payment_type: string;
  kassa_id: number;
  customer_id?: number;
  installment_initial_amount?: string;
  installment_down_payment?: string;
  installment_interest_rate?: string;
  installment_term_months?: number;
}

const initialSaleFormData: SaleFormData = {
  items: [],
  payment_type: "Nasiya", // Standart qiymat "Nasiya" qilib o'rnatildi
  kassa_id: 0,
  customer_id: undefined,
  installment_initial_amount: "",
  installment_down_payment: "0.00",
  installment_interest_rate: "0.00",
  installment_term_months: undefined,
};

const initialInstallmentFormData: Omit<Installment, "id" | "created_at" | "sale" | "customer"> & {
  customer_full_name: string;
  customer_phone_number: string;
  customer_email: string;
  customer_address: string;
} = {
  initial_amount: "",
  interest_rate: "",
  term_months: 1,
  monthly_payment: "",
  total_amount_due: "",
  down_payment: "",
  amount_paid: "",
  status: "Active",
  return_adjustment: "",
  customer_full_name: "",
  customer_phone_number: "",
  customer_email: "",
  customer_address: "",
};

export default function Installments() {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddSaleModalOpen, setIsAddSaleModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [installmentFormData, setInstallmentFormData] = useState(initialInstallmentFormData);
  const [saleFormData, setSaleFormData] = useState(initialSaleFormData);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Avtorizatsiya tokeni topilmadi. Iltimos, qayta tizimga kiring.");
      return null;
    }
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  };

  const fetchInstallments = async () => {
    setIsLoading(true);
    const headers = getAuthHeaders();
    if (!headers) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await axios.get<Installment[]>(INSTALLMENTS_API_URL, { headers });
      setInstallments(
        res.data.map((item) => ({
          ...item,
          customer:
            typeof item.customer === "number"
              ? { id: item.customer, full_name: "Noma'lum mijoz", phone_number: "", email: "", address: "" }
              : item.customer,
          sale:
            typeof item.sale === "number"
              ? { id: item.sale, total_amount_uzs: "0", total_amount_usd: "0", payment_type: "", status: "", created_at: "" }
              : item.sale,
        }))
      );
    } catch (e: any) {
      toast.error("Ma'lumotlarni yuklashda xatolik: " + (e.response?.data?.detail || e.message));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInstallments();
  }, []);

  const handleInstallmentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInstallmentFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSaleFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaleSelectChange = (name: string, value: string) => {
    setSaleFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const headers = getAuthHeaders();
    if (!headers) {
      setIsSubmitting(false);
      return;
    }
    try {
      const payload = {
        initial_amount: installmentFormData.initial_amount,
        interest_rate: installmentFormData.interest_rate,
        term_months: Number(installmentFormData.term_months),
        monthly_payment: installmentFormData.monthly_payment,
        total_amount_due: installmentFormData.total_amount_due,
        down_payment: installmentFormData.down_payment,
        amount_paid: installmentFormData.amount_paid,
        status: installmentFormData.status,
        return_adjustment: installmentFormData.return_adjustment || null,
        customer: {
          full_name: installmentFormData.customer_full_name,
          phone_number: installmentFormData.customer_phone_number,
          email: installmentFormData.customer_email,
          address: installmentFormData.customer_address,
        },
      };
      await axios.post(INSTALLMENTS_API_URL, payload, { headers });
      toast.success("Bo'lib to'lash muvaffaqiyatli qo'shildi!");
      setIsAddModalOpen(false);
      fetchInstallments();
      setInstallmentFormData(initialInstallmentFormData);
    } catch (e: any) {
      let errorMessage = "Qo'shishda xatolik: ";
      if (e.response?.data) {
        Object.keys(e.response.data).forEach((key) => {
          errorMessage += `${key}: ${e.response.data[key].join ? e.response.data[key].join(", ") : e.response.data[key]} `;
        });
      } else {
        errorMessage += e.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const headers = getAuthHeaders();
    if (!headers) {
      setIsSubmitting(false);
      return;
    }
    try {
      const payload = {
        items: saleFormData.items,
        payment_type: saleFormData.payment_type,
        kassa_id: saleFormData.kassa_id,
        customer_id: saleFormData.customer_id,
        ...(saleFormData.payment_type === "Nasiya" && {
          amount_paid_uzs_initial: saleFormData.installment_down_payment || "0.00",
          ...(saleFormData.installment_initial_amount && { installment_initial_amount: saleFormData.installment_initial_amount }),
          ...(saleFormData.installment_interest_rate && { installment_interest_rate: saleFormData.installment_interest_rate }),
          ...(saleFormData.installment_term_months && { installment_term_months: saleFormData.installment_term_months }),
        }),
      };
      await axios.post(SALES_API_URL, payload, { headers });
      toast.success("Yangi sotuv muvaffaqiyatli qo'shildi!");
      setIsAddSaleModalOpen(false);
      fetchInstallments();
      setSaleFormData(initialSaleFormData);
    } catch (e: any) {
      let errorMessage = "Sotuv qo'shishda xatolik: ";
      if (e.response?.data) {
        Object.keys(e.response.data).forEach((key) => {
          errorMessage += `${key}: ${e.response.data[key].join ? e.response.data[key].join(", ") : e.response.data[key]} `;
        });
      } else {
        errorMessage += e.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstallment || !selectedInstallment.id) return;
    setIsSubmitting(true);
    const headers = getAuthHeaders();
    if (!headers) {
      setIsSubmitting(false);
      return;
    }
    try {
      const payload = {
        initial_amount: installmentFormData.initial_amount,
        interest_rate: installmentFormData.interest_rate,
        term_months: Number(installmentFormData.term_months),
        monthly_payment: installmentFormData.monthly_payment,
        total_amount_due: installmentFormData.total_amount_due,
        down_payment: installmentFormData.down_payment,
        amount_paid: installmentFormData.amount_paid,
        status: installmentFormData.status,
        return_adjustment: installmentFormData.return_adjustment || null,
        customer: {
          full_name: installmentFormData.customer_full_name,
          phone_number: installmentFormData.customer_phone_number,
          email: installmentFormData.customer_email,
          address: installmentFormData.customer_address,
        },
      };
      await axios.put(`${INSTALLMENTS_API_URL}${selectedInstallment.id}/`, payload, { headers });
      toast.success("Ma'lumot tahrirlandi!");
      setIsEditModalOpen(false);
      fetchInstallments();
      setSelectedInstallment(null);
    } catch (e: any) {
      let errorMessage = "Tahrirlashda xatolik: ";
      if (e.response?.data) {
        Object.keys(e.response.data).forEach((key) => {
          errorMessage += `${key}: ${e.response.data[key].join ? e.response.data[key].join(", ") : e.response.data[key]} `;
        });
      } else {
        errorMessage += e.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Haqiqatan ham o'chirmoqchimisiz?")) return;
    const originalInstallments = [...installments];
    setInstallments((prev) => prev.filter((item) => item.id !== id));

    setIsSubmitting(true);
    const headers = getAuthHeaders();
    if (!headers) {
      setIsSubmitting(false);
      setInstallments(originalInstallments);
      return;
    }
    try {
      await axios.delete(`${INSTALLMENTS_API_URL}${id}/`, { headers });
      toast.success("O'chirildi!");
    } catch (e: any) {
      toast.error("O'chirishda xatolik: " + (e.response?.data?.detail || e.message));
      setInstallments(originalInstallments);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (item: Installment) => {
    setSelectedInstallment(item);
    const customer = item.customer as Customer;
    setInstallmentFormData({
      initial_amount: item.initial_amount,
      interest_rate: item.interest_rate,
      term_months: item.term_months,
      monthly_payment: item.monthly_payment,
      total_amount_due: item.total_amount_due,
      down_payment: item.down_payment,
      amount_paid: item.amount_paid,
      status: item.status,
      return_adjustment: item.return_adjustment || "",
      customer_full_name: customer?.full_name || "",
      customer_phone_number: customer?.phone_number || "",
      customer_email: customer?.email || "",
      customer_address: customer?.address || "",
    });
    setIsEditModalOpen(true);
  };

  const openAddInstallmentModal = () => {
    setSelectedInstallment(null);
    setInstallmentFormData(initialInstallmentFormData);
    setIsAddModalOpen(true);
  };

  const openAddSaleModal = () => {
    setSaleFormData(initialSaleFormData);
    setIsAddSaleModalOpen(true);
  };

  const filtered = installments.filter((item) =>
    item.customer &&
    typeof item.customer === "object" &&
    item.customer.full_name &&
    item.customer.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const statusOptions = [
    { value: "Active", label: "Faol" },
    { value: "Pending", label: "Kutilmoqda" },
    { value: "Paid", label: "To'langan" },
    { value: "Overdue", label: "Muddati o'tgan" },
    { value: "Cancelled", label: "Bekor qilingan" },
  ];

  const paymentTypeOptions = [
    { value: "Nasiya", label: "Nasiya" }, // Faqat "Nasiya" qoldi
  ];

  const getCustomerFullName = (customer: Customer | number | undefined | null): string => {
    if (customer && typeof customer === "object" && customer.full_name) {
      return customer.full_name;
    }
    return "Noma'lum mijoz";
  };

  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold gradient-heading">Bo'lib to'lash</h1>
      </div>
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Input
            placeholder="Mijoz F.I.Sh. bo'yicha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex gap-2">
          <Button onClick={openAddInstallmentModal}>
            <Plus className="mr-2 w-5 h-5" /> Bo'lib to'lash qo'shish
          </Button>
          <Button onClick={openAddSaleModal} variant="outline">
            <Plus className="mr-2 w-5 h-5" /> Yangi sotuv qo'shish
          </Button>
        </div>
      </div>
      <Card className="card-gradient shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Bo'lib to'lash ro'yxati</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin w-12 h-12 text-indigo-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Mijoz</TableHead>
                    <TableHead>Bosh. Miqdor</TableHead>
                    <TableHead>Qoldiq</TableHead>
                    <TableHead>Holati</TableHead>
                    <TableHead>Yaratilgan sana</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        Ma'lumot topilmadi
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell>{getCustomerFullName(item.customer)}</TableCell>
                        <TableCell>{parseFloat(item.initial_amount).toLocaleString()} UZS</TableCell>
                        <TableCell>
                          {(parseFloat(item.total_amount_due) - parseFloat(item.amount_paid)).toLocaleString()} UZS
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              item.status === "Paid"
                                ? "bg-green-100 text-green-700"
                                : item.status === "Active"
                                ? "bg-blue-100 text-blue-700"
                                : item.status === "Overdue"
                                ? "bg-red-100 text-red-700"
                                : item.status === "Pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {statusOptions.find((s) => s.value === item.status)?.label || item.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => openEditModal(item)}
                              title="Tahrirlash"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleDelete(item.id!)}
                              title="O'chirish"
                              disabled={isSubmitting}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              {isSubmitting && selectedInstallment?.id === item.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-xl">
                {isEditModalOpen ? "Bo'lib to'lashni tahrirlash" : "Yangi bo'lib to'lash"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={isEditModalOpen ? handleEdit : handleAddInstallment}>
                <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 border-b pb-2 mb-3">
                  Mijoz ma'lumotlari
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    required
                    name="customer_full_name"
                    placeholder="Mijoz F.I.Sh."
                    value={installmentFormData.customer_full_name}
                    onChange={handleInstallmentInputChange}
                  />
                  <Input
                    required
                    name="customer_phone_number"
                    type="tel"
                    placeholder="Telefon raqam (+998 XX XXX XX XX)"
                    value={installmentFormData.customer_phone_number}
                    onChange={handleInstallmentInputChange}
                  />
                  <Input
                    name="customer_email"
                    type="email"
                    placeholder="Email (ixtiyoriy)"
                    value={installmentFormData.customer_email}
                    onChange={handleInstallmentInputChange}
                  />
                  <Input
                    name="customer_address"
                    placeholder="Manzil (ixtiyoriy)"
                    value={installmentFormData.customer_address}
                    onChange={handleInstallmentInputChange}
                  />
                </div>

                <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 border-b pb-2 mb-3 pt-4">
                  To'lov ma'lumotlari
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    required
                    name="initial_amount"
                    type="number"
                    placeholder="Boshlang'ich miqdor (UZS)"
                    value={installmentFormData.initial_amount}
                    onChange={handleInstallmentInputChange}
                  />
                  <Input
                    name="interest_rate"
                    type="number"
                    step="0.01"
                    placeholder="Foiz stavkasi (%)"
                    value={installmentFormData.interest_rate}
                    onChange={handleInstallmentInputChange}
                  />
                  <Input
                    name="term_months"
                    type="number"
                    placeholder="Muddat (oylar)"
                    value={installmentFormData.term_months}
                    onChange={handleInstallmentInputChange}
                  />
                  <Input
                    name="monthly_payment"
                    type="number"
                    placeholder="Oylik to'lov (UZS)"
                    value={installmentFormData.monthly_payment}
                    onChange={handleInstallmentInputChange}
                  />
                  <Input
                    name="total_amount_due"
                    type="number"
                    placeholder="Jami to'lanadigan summa (UZS)"
                    value={installmentFormData.total_amount_due}
                    onChange={handleInstallmentInputChange}
                  />
                  <Input
                    name="down_payment"
                    type="number"
                    placeholder="Boshlang'ich to'lov (UZS)"
                    value={installmentFormData.down_payment}
                    onChange={handleInstallmentInputChange}
                  />
                  <Input
                    name="amount_paid"
                    type="number"
                    placeholder="To'langan summa (UZS)"
                    value={installmentFormData.amount_paid}
                    onChange={handleInstallmentInputChange}
                  />
                  <Select
                    value={installmentFormData.status}
                    onValueChange={(value) => handleInstallmentInputChange({ target: { name: "status", value } } as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Holatini tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    name="return_adjustment"
                    placeholder="Qaytarilgan/o'zgartirilgan summa"
                    value={installmentFormData.return_adjustment}
                    onChange={handleInstallmentInputChange}
                  />
                </div>

                <div className="flex gap-3 justify-end pt-5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setIsEditModalOpen(false);
                    }}
                  >
                    Bekor qilish
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {isEditModalOpen ? "Saqlash" : "Qo'shish"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {isAddSaleModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-xl">Yangi sotuv qo'shish</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleAddSale}>
                <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 border-b pb-2 mb-3">
                  Mahsulotlar
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    name="items"
                    placeholder="Mahsulotlar ro'yxatini qo'shish uchun API integratsiyasi kerak"
                    value={saleFormData.items.map((item) => `ID: ${item.product_id}, Qty: ${item.quantity}`).join(", ") || ""}
                    disabled
                  />
                </div>

                <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 border-b pb-2 mb-3 pt-4">
                  To'lov ma'lumotlari
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    value={saleFormData.payment_type}
                    onValueChange={(value) => handleSaleSelectChange("payment_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="To'lov turini tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    required
                    name="kassa_id"
                    type="number"
                    placeholder="Kassa ID"
                    value={saleFormData.kassa_id}
                    onChange={handleSaleInputChange}
                  />
                  <Input
                    name="customer_id"
                    type="number"
                    placeholder="Mijoz ID (Nasiya uchun majburiy)"
                    value={saleFormData.customer_id || ""}
                    onChange={handleSaleInputChange}
                  />
                  {saleFormData.payment_type === "Nasiya" && (
                    <>
                      <Input
                        name="installment_initial_amount"
                        type="number"
                        placeholder="Asl narx (UZS)"
                        value={saleFormData.installment_initial_amount || ""}
                        onChange={handleSaleInputChange}
                      />
                      <Input
                        name="installment_down_payment"
                        type="number"
                        placeholder="Boshlang'ich to'lov (UZS)"
                        value={saleFormData.installment_down_payment}
                        onChange={handleSaleInputChange}
                      />
                      <Input
                        name="installment_interest_rate"
                        type="number"
                        step="0.01"
                        placeholder="Foiz stavkasi (%)"
                        value={saleFormData.installment_interest_rate}
                        onChange={handleSaleInputChange}
                      />
                      <Input
                        name="installment_term_months"
                        type="number"
                        placeholder="Muddat (oylar)"
                        value={saleFormData.installment_term_months || ""}
                        onChange={handleSaleInputChange}
                      />
                    </>
                  )}
                </div>

                <div className="flex gap-3 justify-end pt-5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddSaleModalOpen(false)}
                  >
                    Bekor qilish
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Qo'shish
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}