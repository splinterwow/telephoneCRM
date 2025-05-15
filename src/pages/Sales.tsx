import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Search } from "lucide-react";
import { toast } from "sonner";

const SALES_API_URL = "https://smartphone777.pythonanywhere.com/api/sales/"; // API endpoint

// Sotuv interfeysi
interface SaleItem {
  product_name: string;
  quantity: number;
}

interface Sale {
  id: number;
  seller_username: string;
  customer_name: string;
  kassa_name: string;
  currency: string;
  total_amount_currency: string;
  payment_type: string;
  payment_type_display: string;
  status: string;
  status_display: string;
  created_at: string;
  items_count: number;
  items: SaleItem[];
}

export default function Sales() {
  const [search, setSearch] = useState("");
  const [salesData, setSalesData] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tokenni olish funksiyasi
  const getAuthHeaders = () => {
    let accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      throw new Error("Sessiya topilmadi. Iltimos, tizimga qayta kiring.");
    }

    return {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
  };

  // API'dan sotuvlar ro'yxatini olish
  const fetchSales = async () => {
    try {
      const headers = getAuthHeaders();
      setLoading(true);
      setError(null);

      const url = new URL(SALES_API_URL);
      if (search) {
        url.searchParams.append("search", search);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Ruxsat berilmagan. Iltimos, tizimga qayta kiring.");
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || "Sotuvlarni olishda xato yuz berdi.");
      }

      const data = await response.json();
      console.log("API javobi:", data); // API javobini tekshirish uchun log qilamiz

      if (Array.isArray(data)) {
        setSalesData(data);
      } else if (Array.isArray(data.results)) {
        setSalesData(data.results);
      } else {
        setSalesData([]);
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      if (err.message.includes("Ruxsat berilmagan")) {
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  };

  // Komponent yuklanganda va qidiruv o'zgarganda sotuvlarni olish
  useEffect(() => {
    fetchSales();
  }, [search]);

  // Sana formatini DD/MM/YYYY ga o'zgartirish
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Oy 0 dan boshlanadi
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Valyutani formatlash
  const formatCurrency = (currency: string): string => {
    return currency === "UZS" ? "So'm" : currency;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold gradient-heading">Sotuvlar</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative md:w-96">
          <Input
            placeholder="Qidirish (mijoz, kassa, sotuvchi)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <Card className="card-gradient">
        <CardHeader>
          <CardTitle>Sotuvlar ro'yxati</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mijoz</TableHead>
                <TableHead>Sana</TableHead>
                <TableHead>To'lov usuli</TableHead>
                <TableHead>Valyuta</TableHead>
                <TableHead>Holati</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <p className="text-muted-foreground">Yuklanmoqda...</p>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <p className="text-red-600">{error}</p>
                  </TableCell>
                </TableRow>
              ) : salesData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <p className="text-muted-foreground">Sotuvlar topilmadi</p>
                  </TableCell>
                </TableRow>
              ) : (
                salesData.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{sale.customer_name || "Noma'lum"}</TableCell>
                    <TableCell>{formatDate(sale.created_at)}</TableCell>
                    <TableCell>{sale.payment_type_display || "Noma'lum"}</TableCell>
                    <TableCell>{formatCurrency(sale.currency || "UZS")}</TableCell>
                    <TableCell
                      className={
                        sale.status_display === "Yakunlandi"
                          ? "text-green-600 font-semibold"
                          : "text-gray-700"
                      }
                    >
                      {sale.status_display || "Noma'lum"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}