import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { StatsCard } from "@/components/Dashboard/StatsCard";
import { SalesChart } from "@/components/Dashboard/SalesChart";
import { LowStockProducts } from "@/components/Dashboard/LowStockProducts";
import { useApp } from "@/context/AppContext";
import {
  ShoppingCart,
  DollarSign,
  Wallet,
  Loader2,
  ChevronUp,
  ChevronDown,
  X,
  Layers,
} from "lucide-react";

const API_URL_DASHBOARD = "https://smartphone777.pythonanywhere.com/api/reports/dashboard/";
const API_URL_SALES_DETAILS = "https://smartphone777.pythonanywhere.com/api/reports/sales/";

export default function Dashboard() {
  const { currentStore } = useApp();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periodType, setPeriodType] = useState("daily");
  const [kassaId, setKassaId] = useState(currentStore?.id || 1);

  const [isSalesDetailModalOpen, setIsSalesDetailModalOpen] = useState(false);
  const [salesDetailData, setSalesDetailData] = useState([]);
  const [isSalesDetailLoading, setIsSalesDetailLoading] = useState(false);
  const [salesDetailError, setSalesDetailError] = useState(null);
  const [salesDetailCurrency, setSalesDetailCurrency] = useState(null);

  useEffect(() => {
    if (currentStore?.id && currentStore.id !== kassaId) {
      setKassaId(currentStore.id);
    }
  }, [currentStore, kassaId]);

  const fetchData = useCallback(async (currentKassaId) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Iltimos, tizimga kiring.");
        setIsLoading(false);
        return;
      }
      const response = await axios.get(API_URL_DASHBOARD, {
        headers: { Authorization: `Bearer ${token}` },
        params: { kassa_id: currentKassaId, period_type: periodType },
        timeout: 10000,
      });
      setDashboardData(response.data);
    } catch (err) {
      console.error("Dashboard API xatosi:", err);
      if (err.response?.status === 401) {
        setError("Sessiya muddati tugagan. Iltimos, tizimga qayta kiring.");
      } else if (err.code === "ECONNABORTED") {
        setError("So‘rov muddati tugadi. Internetni tekshiring.");
      } else {
        setError("Dashboard ma'lumotlarini olishda xato: " + (err.response?.data?.detail || err.message || "Noma'lum xato"));
      }
    } finally {
      setIsLoading(false);
    }
  }, [periodType]);

  useEffect(() => {
    if (kassaId) {
      fetchData(kassaId);
    }
  }, [kassaId, fetchData]);

  const fetchSalesDetails = useCallback(async (currencyType) => {
    setIsSalesDetailModalOpen(true);
    setIsSalesDetailLoading(true);
    setSalesDetailError(null);
    setSalesDetailData([]);
    setSalesDetailCurrency(currencyType === "ALL_CURRENCIES" ? "Barcha" : currencyType); // "ALL_CURRENCIES" ni modal sarlavhasi uchun "Barcha" ga o'zgartiramiz

    const params = {
      kassa_id: kassaId,
      period_type: periodType,
    };

    // Backend qanday qiymat kutishiga qarab o'zgartiring:
    // Variant 1: "ALL_CURRENCIES" uchun 'currency' parametri umuman jo'natilmaydi
    if (currencyType !== "ALL_CURRENCIES") {
      params.currency = currencyType.toLowerCase();
    }

    // Variant 2: "ALL_CURRENCIES" uchun backend maxsus qiymat kutadi (masalan, 'all')
    // if (currencyType === "ALL_CURRENCIES") {
    //   params.currency = "all"; // YOKI backend kutadigan boshqa qiymat
    // } else {
    //   params.currency = currencyType.toLowerCase();
    // }
    // YUQORIDAGI IKKI VARIANTDAN BIRINI TANLANG! Hozir Variant 1 faol.

    console.log("Fetching sales details with params:", params); // Konsolga qanday parametrlar bilan so'rov ketayotganini chiqarish

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setSalesDetailError("Iltimos, tizimga kiring.");
        setIsSalesDetailLoading(false);
        return;
      }
      const response = await axios.get(API_URL_SALES_DETAILS, {
        headers: { Authorization: `Bearer ${token}` },
        params: params,
        timeout: 15000,
      });
      console.log("Sales Detail API response data:", response.data); // API javobini konsolga chiqarish
      setSalesDetailData(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (err) {
      console.error("Sales Detail API xatosi:", err);
      console.log("Sales Detail API error object:", err.response || err.message); // Xatolik obyektini konsolga chiqarish
       if (err.response?.status === 401) {
        setSalesDetailError("Sessiya muddati tugagan. Iltimos, tizimga qayta kiring.");
      } else if (err.code === "ECONNABORTED") {
        setSalesDetailError("So‘rov muddati tugadi. Internetni tekshiring.");
      } else {
        setSalesDetailError("Sotuvlar ro'yxatini olishda xato: " + (err.response?.data?.detail || err.message || "Noma'lum xato"));
      }
    } finally {
      setIsSalesDetailLoading(false);
    }
  }, [kassaId, periodType]);

  const formatCurrency = (number) => {
    const num = parseFloat(number);
    return isNaN(num) ? "0" : new Intl.NumberFormat("uz-UZ").format(Math.round(num));
  };

  const formatCount = (number) => {
    const num = parseInt(number);
    return isNaN(num) ? "0" : num.toLocaleString("uz-UZ");
  };

  let sales_amount_usd = 0, sales_amount_uzs = 0;
  let sales_count_usd = 0, sales_count_uzs = 0, total_sales_count = 0;
  let cardTitlePrefix = "Joriy";
  let salesChangePercentage = parseFloat(dashboardData?.sales_change_percentage) || 0;

  if (dashboardData) {
    if (periodType === "daily") {
      sales_amount_usd = dashboardData.today_profit_usd || 0;
      sales_amount_uzs = dashboardData.today_profit_uzs || 0;
      sales_count_usd = dashboardData.today_sales_usd_count || 0;
      sales_count_uzs = dashboardData.today_sales_uzs_count || 0;
      cardTitlePrefix = "Kunlik";
    } else if (periodType === "monthly") {
      sales_amount_usd = dashboardData.monthly_profit_usd || 0;
      sales_amount_uzs = dashboardData.monthly_profit_uzs || 0;
      sales_count_usd = dashboardData.monthly_sales_usd_count || 0;
      sales_count_uzs = dashboardData.monthly_sales_uzs_count || 0;
      cardTitlePrefix = "Oylik";
    } else if (periodType === "all") {
      sales_amount_usd = dashboardData.total_profit_usd || 0;
      sales_amount_uzs = dashboardData.total_profit_uzs || 0;
      sales_count_usd = dashboardData.total_sales_usd_count || 0;
      sales_count_uzs = dashboardData.total_sales_uzs_count || 0;
      cardTitlePrefix = "Umumiy";
    }
    total_sales_count = (parseInt(sales_count_usd) || 0) + (parseInt(sales_count_uzs) || 0);
  }

  if (isLoading && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin mr-3 text-primary" />
        <p className="text-lg">Yuklanmoqda...</p>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="text-center text-destructive-foreground bg-destructive p-6 rounded-lg shadow-md mt-10 max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-2">Xatolik!</h2>
        <p>{error}</p>
        <button
          onClick={() => { if (kassaId) fetchData(kassaId); }}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  const lowStockItems = dashboardData?.low_stock_products || [];
  const commonDesc = (
    (dashboardData?.sales_change_percentage !== undefined && dashboardData?.sales_change_percentage !== null) ? (
        <span className={`${salesChangePercentage >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center text-xs`}>
        {salesChangePercentage >= 0 ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
        {salesChangePercentage >= 0 ? '+' : ''}{parseFloat(salesChangePercentage).toFixed(1)}% o'zgarish
        </span>
    ) : null
  );

  return (
    <div className="space-y-6 p-4 md:p-6 relative">
      {isLoading && dashboardData && (
        <div className="absolute top-4 right-4 z-50 bg-background/80 p-2 rounded-full shadow">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      {error && dashboardData && (
        <div className="mb-4 text-center text-sm text-destructive-foreground bg-destructive p-3 rounded-md">
          <p>Ma'lumotlarni yangilashda xatolik: {error}</p>
          <button
             onClick={() => { if (kassaId) fetchData(kassaId); }}
             className="mt-2 px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
           >
             Qayta urinish
           </button>
        </div>
      )}

      <div>
        <h1 className="text-2xl md:text-3xl font-bold gradient-heading">Boshqaruv paneli</h1>
        <p className="text-muted-foreground mt-1">{currentStore?.name || `Kassa ID: ${kassaId}`}</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
        <select
          value={periodType}
          onChange={(e) => setPeriodType(e.target.value)}
          className="p-2 border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary bg-card text-card-foreground"
        >
          <option value="daily">Kunlik</option>
          <option value="monthly">Oylik</option>
          <option value="all">Umumiy</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={`${cardTitlePrefix} sotuvlar (USD)`}
          value={`${formatCurrency(sales_amount_usd)} USD`}
          icon={<DollarSign className="h-5 w-5 text-blue-500" />}
          description={commonDesc || "Valyutadagi jami tushum"}
          onClick={() => fetchSalesDetails("USD")}
          className="cursor-pointer hover:shadow-lg transition-shadow"
        />
        <StatsCard
          title={`${cardTitlePrefix} sotuvlar (UZS)`}
          value={`${formatCurrency(sales_amount_uzs)} UZS`}
          icon={<ShoppingCart className="h-5 w-5 text-green-500" />}
          description={commonDesc || "So'mdagi jami tushum"}
          onClick={() => fetchSalesDetails("UZS")}
          className="cursor-pointer hover:shadow-lg transition-shadow"
        />
        <StatsCard
          title={`${cardTitlePrefix} JAMI SOTUVLAR`}
          value={`${formatCount(total_sales_count)} dona`}
          icon={<Layers className="h-5 w-5 text-indigo-500" />}
          description="Barcha valyutadagi tranzaksiyalar"
          onClick={() => fetchSalesDetails("ALL_CURRENCIES")} // O'zgartirildi
          className="cursor-pointer hover:shadow-lg transition-shadow"
        />
        <StatsCard
          title="Kassa balansi"
          value={`${formatCurrency(dashboardData?.kassa_balance_uzs)} UZS`}
          icon={<Wallet className="h-5 w-5 text-purple-500" />}
          description={dashboardData?.kassa_name || "Noma'lum kassa"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <div className="lg:col-span-2 bg-card p-4 rounded-lg shadow">
          <SalesChart
            title={`${cardTitlePrefix} sotuvlar grafigi (${dashboardData?.sales_chart_currency || 'UZS'})`}
            data={dashboardData?.sales_chart_data || []}
          />
        </div>
        <div className="bg-card p-4 rounded-lg shadow">
          <LowStockProducts
            title="Kam qolgan mahsulotlar"
            products={lowStockItems}
          />
        </div>
      </div>

      {isSalesDetailModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 transition-opacity duration-300 ease-in-out">
          <div className="bg-background p-5 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col transform transition-all duration-300 ease-in-out scale-100">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                {cardTitlePrefix} sotuvlar ({salesDetailCurrency === "Barcha" ? "Barcha valyutalar" : salesDetailCurrency}) - Ro'yxat
              </h2>
              <button
                onClick={() => setIsSalesDetailModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Yopish"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {isSalesDetailLoading && ( <div className="flex flex-col items-center justify-center py-10 flex-grow"><Loader2 className="h-8 w-8 animate-spin mr-2 text-primary" /><p className="text-muted-foreground mt-2">Yuklanmoqda...</p></div>)}
            {salesDetailError && !isSalesDetailLoading && ( <div className="text-destructive-foreground bg-destructive p-3 rounded text-center flex-grow flex items-center justify-center"><p>{salesDetailError}</p></div>)}
            {!isSalesDetailLoading && !salesDetailError && (
              <div className="overflow-y-auto flex-grow pr-1 custom-scrollbar">
                {salesDetailData.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0">
                      <tr>
                        <th scope="col" className="px-4 py-3">Mahsulot</th>
                        <th scope="col" className="px-4 py-3 text-right">Miqdori</th>
                        {salesDetailCurrency === "Barcha" && <th scope="col" className="px-4 py-3 text-right">Valyuta</th>}
                        <th scope="col" className="px-4 py-3 text-right">Narxi</th>
                        <th scope="col" className="px-4 py-3 text-right">Jami</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {salesDetailData.map((item, index) => (
                        <tr key={item.id || item.product_id || `sale-item-${index}`} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                            {item.product_name || item.product?.name || "Noma'lum mahsulot"}
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{item.quantity}</td>
                          {salesDetailCurrency === "Barcha" && (
                            <td className="px-4 py-3 text-right text-muted-foreground">{item.currency?.toUpperCase() || '-'}</td>
                          )}
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {formatCurrency(item.price_per_unit || item.price)} {salesDetailCurrency !== "Barcha" ? salesDetailCurrency : (item.currency?.toUpperCase() || '')}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-foreground">
                            {formatCurrency(item.total_price || (parseFloat(item.price) * parseInt(item.quantity)))} {salesDetailCurrency !== "Barcha" ? salesDetailCurrency : (item.currency?.toUpperCase() || '')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center py-10 text-muted-foreground flex-grow flex items-center justify-center">
                    Tanlangan davr uchun {salesDetailCurrency === "Barcha" ? "barcha valyutalarda" : salesDetailCurrency + " da"} sotilgan mahsulotlar mavjud emas.
                  </p>
                )}
              </div>
            )}
             <div className="mt-5 pt-4 border-t border-border text-right">
                <button
                    onClick={() => setIsSalesDetailModalOpen(false)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                    Yopish
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}