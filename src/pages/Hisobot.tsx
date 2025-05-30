import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { StatsCard } from "@/components/Dashboard/StatsCard";
import { SalesChart } from "@/components/Dashboard/SalesChart";
import { LowStockProducts } from "@/components/Dashboard/LowStockProducts";
import { useApp } from "@/context/AppContext";
import {
  ShoppingCart,
  DollarSign,
  Layers,
  Loader2,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";

// API manzillari
const API_BASE_URL = "https://smartphone777.pythonanywhere.com/api";
const API_URL_DASHBOARD = `${API_BASE_URL}/reports/dashboard/`;
const API_URL_SALES_DETAILS = `${API_BASE_URL}/reports/sales/`;
const API_URL_SALES_CHART = `${API_BASE_URL}/reports/sales-chart/`;
const API_URL_LOW_STOCK = `${API_BASE_URL}/inventory/low-stock/`; // YANGI ENDPOINT

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

  const [chartRawData, setChartRawData] = useState({ labels: [], data: [], currency: 'UZS' });
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [chartError, setChartError] = useState(null);
  const [chartDisplayCurrency, setChartDisplayCurrency] = useState('UZS');

  // Kam qolgan mahsulotlar uchun holatlar
  const [lowStockData, setLowStockData] = useState([]);
  const [isLowStockLoading, setIsLowStockLoading] = useState(true);
  const [lowStockError, setLowStockError] = useState(null);

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
      if (err.response?.status === 401) setError("Sessiya muddati tugagan. Iltimos, tizimga qayta kiring.");
      else if (err.code === "ECONNABORTED") setError("So‘rov muddati tugadi. Internet aloqasini tekshiring.");
      else setError("Dashboard ma'lumotlarini olishda xato: " + (err.response?.data?.detail || err.message || "Noma'lum xato"));
    } finally {
      setIsLoading(false);
    }
  }, [periodType]);

  const fetchChartData = useCallback(async (currentKassaId, chartPeriod, currencyForChart) => {
    setIsChartLoading(true);
    setChartError(null);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setChartError("Grafik uchun: Iltimos, tizimga kiring.");
        setIsChartLoading(false);
        return;
      }
      let apiChartPeriod = chartPeriod === "all" ? "monthly" : chartPeriod;
      const response = await axios.get(API_URL_SALES_CHART, {
        headers: { Authorization: `Bearer ${token}` },
        params: { kassa_id: currentKassaId, period_type: apiChartPeriod, currency: currencyForChart.toUpperCase() },
        timeout: 10000,
      });
      setChartRawData({
        labels: response.data.labels || [],
        data: response.data.data || [],
        currency: currencyForChart.toUpperCase(),
      });
    } catch (err) {
      console.error("Sales Chart API xatosi:", err);
      if (err.response?.status === 401) setChartError("Grafik uchun sessiya muddati tugagan.");
      else if (err.code === "ECONNABORTED") setChartError("Grafik uchun so‘rov muddati tugadi.");
      else setChartError("Grafik ma'lumotlarini olishda xato: " + (err.response?.data?.detail || err.message || "Noma'lum xato"));
    } finally {
      setIsChartLoading(false);
    }
  }, []);

  // Kam qolgan mahsulotlarni olish
  const fetchLowStockData = useCallback(async (currentKassaId) => {
    setIsLowStockLoading(true);
    setLowStockError(null);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setLowStockError("Kam qolgan mahsulotlar uchun: Iltimos, tizimga kiring.");
        setIsLowStockLoading(false);
        return;
      }
      const params = {};
      if (currentKassaId) { // Agar kassa_id mavjud bo'lsa, parametrga qo'shamiz
          params.kassa_id = currentKassaId;
      }
      // Agar `threshold` parametri kerak bo'lsa: params.threshold = 5; (masalan)

      const response = await axios.get(API_URL_LOW_STOCK, {
        headers: { Authorization: `Bearer ${token}` },
        params: params,
        timeout: 10000,
      });
      // API javobi massiv yoki { results: [...] } ko'rinishida bo'lishi mumkin
      setLowStockData(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (err) {
      console.error("Low Stock API xatosi:", err);
      if (err.response?.status === 401) setLowStockError("Kam qolgan mahsulotlar uchun sessiya muddati tugagan.");
      else if (err.code === "ECONNABORTED") setLowStockError("Kam qolgan mahsulotlar uchun so‘rov muddati tugadi.");
      else setLowStockError("Kam qolgan mahsulotlarni olishda xato: " + (err.response?.data?.detail || err.message || "Noma'lum xato"));
    } finally {
      setIsLowStockLoading(false);
    }
  }, []);

  useEffect(() => {
    if (kassaId) {
      fetchData(kassaId);
      fetchChartData(kassaId, periodType, chartDisplayCurrency);
      fetchLowStockData(kassaId); // Kam qolgan mahsulotlarni chaqirish
    }
  }, [kassaId, periodType, chartDisplayCurrency, fetchData, fetchChartData, fetchLowStockData]);

  const fetchSalesDetails = useCallback(async (currencyType) => {
    // ... (bu funksiya o'zgarishsiz qoladi) ...
    setIsSalesDetailModalOpen(true);
    setIsSalesDetailLoading(true);
    setSalesDetailError(null);
    setSalesDetailData([]);
    setSalesDetailCurrency(currencyType === "ALL_CURRENCIES" ? "Barcha" : currencyType);

    const params = {
      kassa_id: kassaId,
      period_type: periodType,
    };

    if (currencyType !== "ALL_CURRENCIES") {
      params.currency = currencyType.toLowerCase();
    }

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
      setSalesDetailData(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (err) {
      console.error("Sales Detail API xatosi:", err);
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

  // Boshlang'ich to'liq sahifa yuklanishi
  if (isLoading && isChartLoading && isLowStockLoading && !dashboardData && !chartRawData.data.length && !lowStockData.length) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin mr-3 text-primary" />
        <p className="text-lg">Yuklanmoqda...</p>
      </div>
    );
  }

  // Asosiy ma'lumotlarni yuklashda jiddiy xatolik (agar boshqa hech narsa yuklanmagan bo'lsa)
  if (error && !dashboardData) {
    return (
      <div className="text-center text-destructive-foreground bg-destructive p-6 rounded-lg shadow-md mt-10 max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-2">Asosiy xatolik!</h2>
        <p>{error}</p>
        <button onClick={() => { if (kassaId) fetchData(kassaId); }} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          Qayta urinish
        </button>
      </div>
    );
  }

  const commonDesc = (
    (dashboardData?.sales_change_percentage !== undefined && dashboardData?.sales_change_percentage !== null) ? (
        <span className={`${salesChangePercentage >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center text-xs`}>
        {salesChangePercentage >= 0 ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
        {salesChangePercentage >= 0 ? '+' : ''}{parseFloat(salesChangePercentage).toFixed(1)}% o'zgarish
        </span>
    ) : "Oldingi davrga nisbatan"
  );

  let chartTitlePeriod = cardTitlePrefix;
  if (periodType === "all") chartTitlePeriod = "Oylik";

  return (
    <div className="space-y-6 p-4 md:p-6 relative">
      {(isLoading || isChartLoading || isLowStockLoading) && (
        <div className="absolute top-4 right-4 z-50 bg-background/80 p-2 rounded-full shadow">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      {error && dashboardData && ( /* Asosiy ma'lumot bor, lekin yangilashda xato */
        <div className="mb-4 text-center text-sm text-destructive-foreground bg-destructive p-3 rounded-md">
          <p>Asosiy ma'lumotlarni yangilashda xatolik: {error}</p>
          <button onClick={() => { if (kassaId) fetchData(kassaId); }} className="mt-2 px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90">
             Qayta urinish
           </button>
        </div>
      )}

      <div>
        <h1 className="text-2xl md:text-3xl font-bold gradient-heading">Boshqaruv paneli</h1>
        <p className="text-muted-foreground mt-1">{currentStore?.name || `Kassa ID: ${kassaId}`}</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <select value={periodType} onChange={(e) => setPeriodType(e.target.value)} className="p-2 border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary bg-card text-card-foreground w-full sm:w-auto" aria-label="Davrni tanlang">
          <option value="daily">Kunlik</option>
          <option value="monthly">Oylik</option>
          <option value="all">Umumiy</option>
        </select>
        <div className="mt-2 sm:mt-0 w-full sm:w-auto">
          <label htmlFor="chartCurrencySelect" className="text-sm text-muted-foreground mr-2 sr-only sm:not-sr-only">Grafik valyutasi:</label>
          <select id="chartCurrencySelect" value={chartDisplayCurrency} onChange={(e) => setChartDisplayCurrency(e.target.value)} className="p-2 border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary bg-card text-card-foreground w-full" aria-label="Grafik valyutasini tanlang">
            <option value="UZS">UZS</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard title={`${cardTitlePrefix} sotuvlar (USD)`} value={`${formatCurrency(sales_amount_usd)} USD`} icon={<DollarSign className="h-5 w-5 text-blue-500" />} description={commonDesc} onClick={() => fetchSalesDetails("USD")} className="cursor-pointer hover:shadow-lg transition-shadow" />
        <StatsCard title={`${cardTitlePrefix} sotuvlar (UZS)`} value={`${formatCurrency(sales_amount_uzs)} UZS`} icon={<ShoppingCart className="h-5 w-5 text-green-500" />} description={commonDesc} onClick={() => fetchSalesDetails("UZS")} className="cursor-pointer hover:shadow-lg transition-shadow" />
        <StatsCard title={`${cardTitlePrefix} JAMI SOTUVLAR`} value={`${formatCount(total_sales_count)} dona`} icon={<Layers className="h-5 w-5 text-indigo-500" />} description="Barcha valyutadagi tranzaksiyalar soni" onClick={() => fetchSalesDetails("ALL_CURRENCIES")} className="cursor-pointer hover:shadow-lg transition-shadow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <div className="lg:col-span-2 bg-card p-4 rounded-lg shadow">
          {isChartLoading && <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin mr-2 text-primary" /><p className="text-muted-foreground">Grafik yuklanmoqda...</p></div>}
          {chartError && !isChartLoading && <div className="text-center text-destructive-foreground bg-destructive p-4 rounded h-64 flex flex-col justify-center items-center"><p className="font-semibold">Grafik xatosi!</p><p className="text-sm mt-1">{chartError}</p><button onClick={() => { if (kassaId) fetchChartData(kassaId, periodType, chartDisplayCurrency); }} className="mt-3 px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90">Qayta urinish</button></div>}
          {!isChartLoading && !chartError && chartRawData.data.length > 0 && <SalesChart title={`${chartTitlePeriod} sotuvlar grafigi (${chartRawData.currency})`} labels={chartRawData.labels} data={chartRawData.data} />}
          {!isChartLoading && !chartError && chartRawData.data.length === 0 && <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Tanlangan davr va valyuta uchun grafik ma'lumotlari mavjud emas.</p></div>}
        </div>
        
        <div className="bg-card p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3 text-foreground">Kam qolgan mahsulotlar</h3>
          {isLowStockLoading && <div className="flex flex-col items-center justify-center h-full min-h-[100px] py-4"><Loader2 className="h-6 w-6 animate-spin text-primary mb-2" /><p className="text-muted-foreground text-sm">Yuklanmoqda...</p></div>}
          {lowStockError && !isLowStockLoading && <div className="flex flex-col items-center justify-center h-full min-h-[100px] py-4"><p className="text-destructive text-sm text-center">{lowStockError}</p><button onClick={() => { if (kassaId) fetchLowStockData(kassaId); }} className="mt-2 px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90">Qayta urinish</button></div>}
          {!isLowStockLoading && !lowStockError && lowStockData.length > 0 && <LowStockProducts products={lowStockData} />}
          {!isLowStockLoading && !lowStockError && lowStockData.length === 0 && <div className="flex items-center justify-center h-full min-h-[100px] py-4"><p className="text-muted-foreground text-sm">Kam qolgan mahsulotlar mavjud emas.</p></div>}
        </div>
      </div>

      {isSalesDetailModalOpen && (
        // ... (Sotuvlar tafsilotlari modal oyna kodi o'zgarishsiz qoladi) ...
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