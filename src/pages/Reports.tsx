import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { toast } from "sonner";

// API URL'lari
const SALES_REPORT_API_URL = "https://smartphone777.pythonanywhere.com/api/reports/sales/";
const INVENTORY_HISTORY_API_URL = "https://smartphone777.pythonanywhere.com/api/inventory/history/";

// Sotuvlar hisoboti interfeysi
interface SalesReport {
  total_sales: number;
  total_revenue: number;
  sales_count: number;
  timestamp: string;
}

// Inventar tarixi interfeysi
interface InventoryOperation {
  id: number;
  product: { id: number; name: string };
  user: { id: number; username: string };
  kassa: { id: number; name: string };
  quantity: number;
  operation_type: string;
  operation_type_display: string;
  comment: string;
  timestamp: string;
  related_operation_id: number | null;
}

export default function Reports() {
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [inventoryHistory, setInventoryHistory] = useState<InventoryOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tokenni olish funksiyasi
  const getAuthHeaders = () => {
    let accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      accessToken = "your-test-token-here";
      localStorage.setItem("accessToken", accessToken);
    }

    if (!accessToken) {
      throw new Error("Sessiya topilmadi. Iltimos, tizimga qayta kiring.");
    }

    return {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
  };

  // Sotuvlar hisobotini olish
  const fetchSalesReport = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(SALES_REPORT_API_URL, { method: "GET", headers });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Ruxsat berilmagan. Iltimos, tizimga qayta kiring.");
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || "Sotuvlar hisobotini olishda xato yuz berdi.");
      }

      const data = await response.json();
      setSalesReport(data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      if (err.message.includes("Ruxsat berilmagan")) {
        window.location.href = "/login";
      }
    }
  };

  // Inventar tarixini olish
  const fetchInventoryHistory = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(INVENTORY_HISTORY_API_URL, { method: "GET", headers });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Ruxsat berilmagan. Iltimos, tizimga qayta kiring.");
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || "Inventar tarixini olishda xato yuz berdi.");
      }

      const data = await response.json();
      setInventoryHistory(data.results || []);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      if (err.message.includes("Ruxsat berilmagan")) {
        window.location.href = "/login";
      }
    }
  };

  // Ma'lumotlarni olish
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([fetchSalesReport(), fetchInventoryHistory()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in p-4">
      <div>
        <h1 className="text-3xl font-bold gradient-heading">Hisobotlar</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sotuvlar hisoboti */}
        <Card className="card-gradient w-full min-h-[400px] flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Sotuvlar hisoboti</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {loading ? (
              <p className="text-muted-foreground text-sm">Yuklanmoqda...</p>
            ) : error ? (
              <p className="text-red-600 text-sm">{error}</p>
            ) : salesReport ? (
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Jami sotuvlar:</strong> {salesReport.total_sales}
                </p>
                <p>
                  <strong>Jami daromad:</strong> {salesReport.total_revenue} so‘m
                </p>
                <p>
                  <strong>Sotuvlar soni:</strong> {salesReport.sales_count}
                </p>
                <p>
                  <strong>Oxirgi yangilanish:</strong>{" "}
                  {new Date(salesReport.timestamp).toLocaleString("uz-UZ", {
                    hour12: true,
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  })}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Ma'lumot yo'q</p>
            )}
          </CardContent>
        </Card>

        {/* Inventar tarixi */}
        <Card className="card-gradient w-full min-h-[400px] flex flex-col">
          <CardHeader>
            <CardTitle>Inventar tarixi</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {loading ? (
              <p className="text-muted-foreground">Yuklanmoqda...</p>
            ) : error ? (
              <p className="text-red-600">{error}</p>
            ) : inventoryHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Mahsulot</TableHead>
                      <TableHead className="whitespace-nowrap">Miqdor</TableHead>
                      <TableHead className="whitespace-nowrap">Operatsiya turi</TableHead>
                      <TableHead className="whitespace-nowrap">Kassa</TableHead>
                      <TableHead className="whitespace-nowrap">Foydalanuvchi</TableHead>
                      <TableHead className="whitespace-nowrap">Izoh</TableHead>
                      <TableHead className="whitespace-nowrap">Sana</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryHistory.map((operation) => (
                      <TableRow key={operation.id}>
                        <TableCell className="whitespace-normal break-words max-w-[150px]">
                          {operation.product.name}
                        </TableCell>
                        <TableCell className="text-red-600">{operation.quantity}</TableCell>
                        <TableCell className="whitespace-normal break-words max-w-[150px]">
                          {operation.operation_type_display}
                        </TableCell>
                        <TableCell className="whitespace-normal break-words max-w-[100px]">
                          {operation.kassa.name}
                        </TableCell>
                        <TableCell className="whitespace-normal break-words max-w-[100px]">
                          {operation.user.username}
                        </TableCell>
                        <TableCell className="whitespace-normal break-words max-w-[100px]">
                          {operation.comment || "Yo‘q"}
                        </TableCell>
                        <TableCell className="whitespace-normal break-words max-w-[150px]">
                          {new Date(operation.timestamp).toLocaleString("uz-UZ", {
                            hour12: true,
                            year: "numeric",
                            month: "numeric",
                            day: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground">Ma'lumot yo'q</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}