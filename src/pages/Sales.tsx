import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Search,
  Package,
  CalendarDays,
  UserCircle,
  Home,
  CheckCircle,
  Clock,
  AlertTriangle,
  ScanLine,
} from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

const SALES_API_URL = "http://nuriddin777.uz/api/sales/";

interface SoldItemDetail {
  id?: number;
  product_name: string;
  quantity: number;
  price_per_item_currency: string | null;
  barcode?: string | null;
}

interface Sale {
  id: number;
  seller_username: string;
  customer_name: string | null;
  kassa_name: string;
  currency: string;
  final_amount_currency: string;
  amount_actually_paid_at_sale?: string;
  payment_type: string;
  payment_type_display: string;
  status: string;
  status_display: string;
  created_at: string;
  items_count?: number;
  items: SoldItemDetail[];
  items_summary?: Array<{
    product_name: string;
    quantity: number;
    price_at_sale_uzs: string | null;
    price_at_sale_usd: string | null;
    product_barcode?: string | null;
    id?: number;
  }>;
}

export default function SalesPage() {
  const [search, setSearch] = useState("");
  const [salesData, setSalesData] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSales, setTotalSales] = useState(0);

  const getAuthHeaders = () => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      throw new Error(
        "Avtorizatsiya tokeni topilmadi. Iltimos, tizimga qayta kiring."
      );
    }
    return {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
  };

  const fetchSales = async (searchTerm: string = search) => {
    setLoading(true);
    setError(null);
    try {
      const headers = getAuthHeaders();
      const url = new URL(SALES_API_URL);
      if (searchTerm.trim()) {
        // Backend `search` parametri orqali ID, mijoz, mahsulot nomi, shtrix-kod va boshqa maydonlarda qidiradi
        url.searchParams.append("search", searchTerm.trim());
        // Agar backend shtrix-kod uchun alohida parametr talab qilsa:
        // url.searchParams.append("barcode", searchTerm.trim());
      }
      // Paginatsiya uchun (agar backend qo'llab-quvvatlasa)
      // url.searchParams.append("page", "1");
      // url.searchParams.append("page_size", "15");

      const response = await fetch(url.toString(), { method: "GET", headers });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Ruxsat berilmagan. Sessiya muddati tugagan bo'lishi mumkin. Qayta kiring."
          );
        }
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Serverdan noma'lum xato." }));
        throw new Error(
          errorData.detail ||
            `Sotuvlarni yuklashda xatolik (status: ${response.status}).`
        );
      }

      const data = await response.json();
      // console.log("API Response (Sales List):", data);

      const fetchedSalesFromResults =
        data.results && Array.isArray(data.results) ? data.results : [];

      type ApiItemSummary = {
        product_name: string;
        quantity: number;
        price_at_sale_uzs: string | null;
        price_at_sale_usd: string | null;
        product_barcode?: string | null;
        id?: number;
      };

      const validatedSales: Sale[] = fetchedSalesFromResults.map(
        (sale: any, saleIndex: number) => {
          const saleCurrency = sale.currency?.toUpperCase();

          const mappedItems: SoldItemDetail[] =
            sale.items_summary && Array.isArray(sale.items_summary)
              ? sale.items_summary.map(
                  (summaryItem: ApiItemSummary, itemIndex: number) => {
                    let pricePerItem: string | null = null;
                    if (saleCurrency === "UZS") {
                      pricePerItem = summaryItem.price_at_sale_uzs;
                    } else if (saleCurrency === "USD") {
                      pricePerItem = summaryItem.price_at_sale_usd;
                    }

                    return {
                      id: summaryItem.id || itemIndex,
                      product_name: summaryItem.product_name,
                      quantity: summaryItem.quantity,
                      price_per_item_currency: pricePerItem,
                      barcode: summaryItem.product_barcode || null,
                    };
                  }
                )
              : [];

          return {
            ...sale,
            items: mappedItems,
          };
        }
      );

      setSalesData(validatedSales);
      if (data && typeof data.count === "number") {
        setTotalSales(data.count);
      } else {
        setTotalSales(validatedSales.length);
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(`Xatolik: ${err.message}`, { duration: 5000 });
      if (
        err.message.includes("Avtorizatsiya") ||
        err.message.includes("Ruxsat berilmagan")
      ) {
        console.error("Avtorizatsiya xatosi, loginga yo'naltirish kerak.");
        // Ideal holda: router.push('/login') yoki authContext.logout()
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSales(search);
    }, 500); // Qidiruv uchun debounce

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  useEffect(() => {
    fetchSales(); // Komponent ilk yuklanganda ma'lumotlarni oladi
  }, []);

  const formatDateWithTime = (dateString: string): string => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${day}.${month}.${year} ${hours}:${minutes}`;
    } catch (e) {
      return "Noto'g'ri sana";
    }
  };

  const formatAmountWithCurrency = (
    amountStr?: string | null,
    currencyCode?: string | null
  ): string => {
    if (amountStr === null || amountStr === undefined || amountStr.trim() === "")
      return "-";
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) return "-";
    const code = (currencyCode || "UZS").toUpperCase();
    try {
      return new Intl.NumberFormat(code === "USD" ? "en-US" : "uz-UZ", {
        style: "decimal",
        minimumFractionDigits: code === "USD" ? 2 : 0,
        maximumFractionDigits: code === "USD" ? 2 : 0,
      }).format(amount);
    } catch (e) {
      return amountStr;
    }
  };

  const getStatusIconAndColor = (
    statusDisplay: string
  ): { icon: JSX.Element | null; color: string } => {
    switch (statusDisplay?.toLowerCase()) {
      case "yakunlangan":
      case "completed":
        return {
          icon: <CheckCircle size={14} className="text-green-600" />,
          color: "text-green-700 bg-green-100 border-green-200",
        };
      case "kutilmoqda":
      case "pending":
        return {
          icon: <Clock size={14} className="text-yellow-600" />,
          color: "text-yellow-700 bg-yellow-100 border-yellow-200",
        };
      case "bekor qilingan":
      case "cancelled":
        return {
          icon: <AlertTriangle size={14} className="text-red-600" />,
          color: "text-red-700 bg-red-100 border-red-200",
        };
      default:
        return {
          icon: null,
          color: "text-gray-700 bg-gray-100 border-gray-200",
        };
    }
  };

  const COL_SPAN = 11;

  return (
    <TooltipProvider>
      <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Sotuvlar Tarixi
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Barcha sotuv operatsiyalarini ko'rish va boshqarish.
          </p>
        </header>

        <div className="relative w-full md:max-w-lg mb-6">
          <Input
            placeholder="Qidirish (ID, Mijoz, Mahsulot, Shtrix-kod, Sotuvchi...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 text-sm border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>

        <Card className="shadow-xl border border-gray-200 rounded-lg overflow-hidden">
          <CardHeader className="bg-gray-100 border-b border-gray-200 px-6 py-4">
            <CardTitle className="text-lg font-semibold text-gray-700">
              Sotuvlar ro'yxati{" "}
              {totalSales > 0 && !loading && `(Jami: ${totalSales} ta)`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-[1350px]">
                <TableHeader className="bg-gray-50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[70px]">
                      ID
                    </TableHead>
                    <TableHead className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[140px]">
                      Mijoz
                    </TableHead>
                    <TableHead className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[220px]">
                      Mahsulotlar
                    </TableHead>
                    <TableHead className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[150px]">
                      Shtrix-kodlar
                    </TableHead>
                    <TableHead className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[110px]">
                      Summa
                    </TableHead>
                    <TableHead className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[70px]">
                      Valyuta
                    </TableHead>
                    <TableHead className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[110px]">
                      To'lov Usuli
                    </TableHead>
                    <TableHead className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[140px]">
                      Sana va Vaqt
                    </TableHead>
                    <TableHead className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[110px]">
                      Sotuvchi
                    </TableHead>
                    <TableHead className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[100px]">
                      Kassa
                    </TableHead>
                    <TableHead className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[120px]">
                      Holati
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={COL_SPAN}
                        className="text-center py-16 text-gray-500"
                      >
                        <div className="flex flex-col justify-center items-center space-y-2">
                          <svg
                            className="animate-spin h-8 w-8 text-primary-600"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <span className="text-sm">
                            Yuklanmoqda, iltimos kuting...
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell
                        colSpan={COL_SPAN}
                        className="text-center py-16 text-red-600 font-medium"
                      >
                        Xatolik: {error}
                        <Button
                          onClick={() => fetchSales(search)}
                          variant="link"
                          size="sm"
                          className="ml-2 text-red-600 underline"
                        >
                          Qayta urinish
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : salesData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={COL_SPAN}
                        className="text-center py-16 text-gray-500"
                      >
                        <Package
                          size={32}
                          className="mx-auto mb-2 text-gray-400"
                        />
                        {search
                          ? `"${search}" uchun sotuvlar topilmadi.`
                          : "Hozircha sotuvlar mavjud emas."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    salesData.map((sale) => {
                      const statusStyle = getStatusIconAndColor(sale.status_display);
                      return (
                        <TableRow
                          key={sale.id}
                          className="hover:bg-gray-50/50 transition-colors duration-150"
                        >
                          <TableCell className="px-3 py-3 text-sm text-gray-700 font-medium whitespace-nowrap">
                            #{sale.id}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-sm text-black whitespace-nowrap">
                            <div className="flex text-[0.95rem] font-bold items-center">
                              <UserCircle
                                size={16}
                                className="mr-1.5 text-gray-400"
                              />
                              {sale.customer_name || (
                                <span className="italic text-gray-400">
                                  Noma'lum mijoz
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-3 text-sm text-gray-600 max-w-xs">
                            {sale.items && sale.items.length > 0 ? (
                              <div className="space-y-1.5">
                                {sale.items.map((item, index) => (
                                  <div
                                    key={item.id ?? `sale-${sale.id}-item-${index}`}
                                    className="flex items-start text-xs"
                                  >
                                    <Package
                                      size={14}
                                      className="inline mr-1.5 text-blue-500 flex-shrink-0 mt-0.5"
                                    />
                                    <div className="flex-grow">
                                      <span
                                        className="font-bold text-[0.97rem] text-gray-700 block truncate"
                                        title={item.product_name}
                                      >
                                        {item.product_name}
                                      </span>
                                      <span className="text-gray-500">
                                        ({item.quantity} dona)
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="italic text-gray-400">
                                Mahsulotlar yo'q
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-sm text-gray-600 max-w-[150px]">
                            {sale.items && sale.items.some((item) => item.barcode) ? (
                              <div className="space-y-1">
                                {sale.items.map((item, index) =>
                                  item.barcode ? (
                                    <Tooltip
                                      key={`barcode-${sale.id}-${item.id ?? index}`}
                                      delayDuration={50}
                                    >
                                      <TooltipTrigger asChild>
                                        <span className="flex items-center text-xs text-gray-500 cursor-help bg-gray-100 px-1.5 py-0.5 rounded-sm font-mono leading-none truncate">
                                          <ScanLine
                                            size={12}
                                            className="mr-1 text-gray-400 flex-shrink-0"
                                          />
                                          {item.barcode}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent
                                        side="top"
                                        className="bg-slate-800 text-white text-xs p-1.5 rounded shadow-lg"
                                      >
                                        <p>Shtrix-kod: {item.barcode}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : null
                                )}
                              </div>
                            ) : (
                              <span className="italic text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-sm text-gray-800 font-semibold text-right whitespace-nowrap">
                            {formatAmountWithCurrency(
                              sale.final_amount_currency,
                              sale.currency
                            )}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-sm text-gray-600 text-center whitespace-nowrap">
                            {sale.currency}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">
                            {sale.payment_type_display || "N/A"}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">
                            <div className="flex items-center">
                              <CalendarDays
                                size={14}
                                className="mr-1.5 text-gray-400"
                              />
                              {formatDateWithTime(sale.created_at)}
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">
                            {sale.seller_username || "N/A"}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">
                            <div className="flex items-center">
                              <Home
                                size={14}
                                className="mr-1.5 text-gray-400"
                              />
                              {sale.kassa_name || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-3 text-sm font-medium text-center whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full shadow-sm border ${statusStyle.color}`}
                            >
                              {statusStyle.icon && (
                                <span className="mr-1">{statusStyle.icon}</span>
                              )}
                              {sale.status_display || "Noma'lum"}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}