import { useState, useEffect } from "react";
import axios from "axios";
import { StatsCard } from "@/components/Dashboard/StatsCard";
import { SalesChart } from "@/components/Dashboard/SalesChart";
import { LowStockProducts } from "@/components/Dashboard/LowStockProducts";
import { useApp } from "@/context/AppContext";
import { ShoppingCart, DollarSign, Wallet, Loader2, ChevronUp, ChevronDown } from "lucide-react";

const API_URL = "https://smartphone777.pythonanywhere.com/api/reports/dashboard/";

export default function Dashboard() {
  const { currentStore } = useApp();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periodType, setPeriodType] = useState("all");
  const [kassaId, setKassaId] = useState(1); // Default kassa ID

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("Iltimos, tizimga kiring.");
          return;
        }

        const response = await axios.get(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          params: {
            kassa_id: kassaId,
            period_type: periodType,
          },
          timeout: 10000,
        });

        setDashboardData(response.data);
      } catch (error) {
        console.error("API xatosi:", error);
        if (error.response?.status === 401) {
          setError("Tizimga qayta kiring.");
        } else if (error.code === "ECONNABORTED") {
          setError("So‘rov muddati tugadi. Internetni tekshiring yoki keyinroq urinib ko‘ring.");
        } else {
          setError("Ma'lumotlarni olishda xato yuz berdi: " + error.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [periodType, kassaId]);

  const formatNumber = (number) => {
    return number == null ? "Mavjud emas" : new Intl.NumberFormat("uz-UZ").format(Math.round(number));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin mr-2 text-primary" />
        <p>Yuklanmoqda...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive-foreground bg-destructive p-4 rounded">
        <p>Xatolik: {error}</p>
      </div>
    );
  }

  const dailySalesChange = 12;
  const lowStockChange = -2;
  const salesData = periodType === "daily" 
    ? { usd: dashboardData.today_sales_usd, uzs: dashboardData.today_sales_uzs, count: dashboardData.today_sales_usd_count }
    : periodType === "monthly" 
    ? { usd: dashboardData.monthly_sales_usd, uzs: dashboardData.monthly_sales_uzs, count: dashboardData.monthly_sales_usd_count }
    : { usd: dashboardData.today_sales_usd || dashboardData.monthly_sales_usd, uzs: dashboardData.today_sales_uzs || dashboardData.monthly_sales_uzs, count: dashboardData.today_sales_usd_count || dashboardData.monthly_sales_usd_count };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-heading">Boshqaruv paneli</h1>
        <p className="text-muted-foreground mt-1">{currentStore?.name || "Demo Phone Store"}</p>
      </div>

      <div className="flex justify-between items-center mb-4">
        <select
          value={periodType}
          onChange={(e) => setPeriodType(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="daily">Kunlik</option>
          <option value="monthly">Oylik</option>
          <option value="all">Umumiy</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard
          title="Kunlik sotuvlar (USD)"
          value={`${formatNumber(salesData.usd)} USD`}
          icon={<ShoppingCart className="h-4 w-4" />}
          description={
            <span className="text-green-500 flex items-center">
              <ChevronUp className="h-4 w-4 mr-1" />
              +{dailySalesChange}% o‘tgan oydan
            </span>
          }
        />
        <StatsCard
          title="Kunlik sotuvlar (UZS)"
          value={`${formatNumber(salesData.uzs)} UZS`}
          icon={<ShoppingCart className="h-4 w-4" />}
          description={
            <span className="text-green-500 flex items-center">
              <ChevronUp className="h-4 w-4 mr-1" />
              +{dailySalesChange}% o‘tgan oydan
            </span>
          }
        />
        <StatsCard
          title="Kassa balansi"
          value={`${formatNumber(dashboardData.kassa_balance_uzs) || "0"} UZS`}
          icon={<Wallet className="h-4 w-4" />}
          description={dashboardData.kassa_name || "Main Register"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SalesChart
            title="Oylik sotuvlar"
            data={dashboardData.weekly_sales_chart_uzs || []}
          />
        </div>
        <div>
          <LowStockProducts
            products={[
              { name: "iPhone 13 Pro Max", stock: "2/5" },
              { name: "Samsung Galaxy S22", stock: "1/5" },
              { name: "AirPods Pro", stock: "3/10" },
              { name: "USB-C Charging Cable", stock: "4/15" },
              { name: "Phone Case Clear", stock: "2/10" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}