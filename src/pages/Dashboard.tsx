import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { StatsCard } from "@/components/Dashboard/StatsCard";
import { SalesChart } from "@/components/Dashboard/SalesChart";
import { useApp } from "@/context/AppContext";
import {
  ShoppingCart,
  Loader2,
  ChevronUp,
  ChevronDown,
  X,
  TrendingUp,
  Landmark,
  Info,
  CalendarDays,
  FilterX,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const API_URL_DASHBOARD =
  "https://smartphone777.pythonanywhere.com/api/reports/dashboard/";
const API_URL_SALES_DETAILS =
  "https://smartphone777.pythonanywhere.com/api/reports/sales/";
const API_URL_SALES_CHART =
  "https://smartphone777.pythonanywhere.com/api/reports/sales-chart/";

const formatDateToYYYYMMDD = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  const year = d.getFullYear();
  return [year, month, day].join("-");
};

const formatDateToYYYYMM = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const year = d.getFullYear();
  return [year, month].join("-");
};

export default function Dashboard() {
  console.log("--- Dashboard komponenti render boshlandi ---");
  const { currentStore, isStoreLoading } = useApp(); // isStoreLoading AppContext dan kelishini taxmin qilamiz
  console.log("useApp dan: currentStore:", currentStore, "isStoreLoading:", isStoreLoading);

  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Boshida true
  const [error, setError] = useState(null);

  const [statsPeriodType, setStatsPeriodType] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);

  // Sales Detail Modal
  const [isSalesDetailModalOpen, setIsSalesDetailModalOpen] = useState(false);
  const [salesDetailData, setSalesDetailData] = useState([]);
  const [isSalesDetailLoading, setIsSalesDetailLoading] = useState(false);
  const [salesDetailError, setSalesDetailError] = useState(null);
  const [salesDetailCurrency, setSalesDetailCurrency] = useState(null);

  // Sales Chart
  const [chartRawData, setChartRawData] = useState({
    labels: [], data: [], currency: "UZS",
  });
  const [isChartLoading, setIsChartLoading] = useState(true); // Boshida true
  const [chartError, setChartError] = useState(null);
  const [chartDisplayCurrency, setChartDisplayCurrency] = useState("UZS");
  const [chartStartDate, setChartStartDate] = useState(null);
  const [chartEndDate, setChartEndDate] = useState(null);
  const [chartGroupingPeriod, setChartGroupingPeriod] = useState("monthly");


  const fetchData = useCallback(async (kassaIdToFetch: number | null) => {
    console.log(`fetchData chaqirildi. kassaId: ${kassaIdToFetch}, selectedDate: ${selectedDate}, selectedMonth: ${selectedMonth}, statsPeriodType: ${statsPeriodType}`);
    if (kassaIdToFetch === null) {
      console.warn("fetchData: kassaIdToFetch null, so'rov yuborilmadi. Dashboard ma'lumotlari bo'sh qoladi.");
      setIsLoading(false); // Agar kassa bo'lmasa, yuklanishni to'xtatamiz
      setDashboardData(null); // Eski ma'lumotlarni tozalaymiz
      return;
    }

    setIsLoading(true);
    setError(null);
    const params: any = { kassa_id: kassaIdToFetch };

    if (selectedDate) params.date = selectedDate;
    else if (selectedMonth) params.month = selectedMonth;
    else params.period_type = statsPeriodType;

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Iltimos, tizimga kiring."); setIsLoading(false); return;
      }
      console.log("fetchData: API_URL_DASHBOARD ga so'rov. Params:", params);
      const response = await axios.get(API_URL_DASHBOARD, {
        headers: { Authorization: `Bearer ${token}` }, params, timeout: 10000,
      });
      console.log("fetchData: API javobi:", response.data);
      setDashboardData(response.data);
    } catch (err: any) {
      console.error("Dashboard API xatosi:", err);
      // Xatolikni qayta ishlash...
       if (err.response?.status === 401) setError("Sessiya muddati tugagan. Iltimos, tizimga qayta kiring.");
        else if (err.code === "ECONNABORTED") setError("So‘rov muddati tugadi. Internet aloqasini tekshiring.");
        else setError(`Dashboard ma'lumotlarini olishda xato: ${err.response?.data?.detail || err.message || "Noma'lum xato"}`);
      setDashboardData(null); // Xatolikda ma'lumotni tozalash
    } finally {
      console.log("fetchData: finally.");
      setIsLoading(false);
    }
  }, [statsPeriodType, selectedDate, selectedMonth]);


  const fetchChartData = useCallback(async (kassaIdToFetch: number | null) => {
    console.log(`fetchChartData chaqirildi. kassaId: ${kassaIdToFetch}, chartGroupingPeriod: ${chartGroupingPeriod}, currency: ${chartDisplayCurrency}, start: ${chartStartDate}, end: ${chartEndDate}`);
    if (kassaIdToFetch === null) {
      console.warn("fetchChartData: kassaIdToFetch null, so'rov yuborilmadi. Grafik ma'lumotlari bo'sh qoladi.");
      setIsChartLoading(false);
      setChartRawData({ labels: [], data: [], currency: chartDisplayCurrency.toUpperCase() });
      return;
    }

    setIsChartLoading(true);
    setChartError(null);
    const params: any = {
      kassa_id: kassaIdToFetch,
      period_type: chartGroupingPeriod,
      currency: chartDisplayCurrency.toUpperCase(),
    };
    if (chartStartDate) params.start_date = formatDateToYYYYMMDD(chartStartDate);
    if (chartEndDate) params.end_date = formatDateToYYYYMMDD(chartEndDate);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setChartError("Grafik uchun: Iltimos, tizimga kiring."); setIsChartLoading(false); return;
      }
      console.log("fetchChartData: API_URL_SALES_CHART ga so'rov. Params:", params);
      const response = await axios.get(API_URL_SALES_CHART, {
        headers: { Authorization: `Bearer ${token}` }, params, timeout: 10000,
      });
      console.log("fetchChartData: API javobi:", response.data);
      setChartRawData({
        labels: response.data.labels || [], data: response.data.data || [],
        currency: chartDisplayCurrency.toUpperCase(),
      });
    } catch (err: any) {
      console.error("Sales Chart API xatosi:", err);
      // Xatolikni qayta ishlash...
      if (err.response?.status === 401) setChartError("Grafik uchun sessiya muddati tugagan.");
        else if (err.code === "ECONNABORTED") setChartError("Grafik uchun so‘rov muddati tugadi.");
        else setChartError(`Grafik ma'lumotlarini olishda xato: ${err.response?.data?.detail || err.message || "Noma'lum xato"}`);
      setChartRawData({ labels: [], data: [], currency: chartDisplayCurrency.toUpperCase() }); // Xatolikda ma'lumotni tozalash
    } finally {
      console.log("fetchChartData: finally.");
      setIsChartLoading(false);
    }
  }, [chartDisplayCurrency, chartStartDate, chartEndDate, chartGroupingPeriod]);


  // Asosiy ma'lumotlarni yuklash uchun useEffect
  useEffect(() => {
    console.log("Asosiy useEffect ishga tushdi. isStoreLoading:", isStoreLoading, "currentStore:", currentStore);
    if (isStoreLoading === false) { // Faqat AppContext dan store yuklanib bo'lganda
      const idToFetch = currentStore?.id || null; // Agar store yo'q bo'lsa null
      console.log("Asosiy useEffect: idToFetch:", idToFetch);
      fetchData(idToFetch);
      fetchChartData(idToFetch);
    } else if (isStoreLoading === undefined) {
        // Agar AppContext da isStoreLoading yo'q bo'lsa, currentStore.id ni darhol ishlatamiz
        console.warn("AppContext da isStoreLoading topilmadi. currentStore.id ni darhol ishlatishga harakat qilinadi.");
        const idToFetchImmediate = currentStore?.id || null;
        fetchData(idToFetchImmediate);
        fetchChartData(idToFetchImmediate);
    } else {
        console.log("Asosiy useEffect: currentStore hali yuklanmoqda...");
        // Yuklanishni davom ettiramiz, chunki isLoading/isChartLoading true
    }
  }, [isStoreLoading, currentStore, fetchData, fetchChartData]);
  // `fetchData` va `fetchChartData` `useCallback` da o'z dependencylariga ega,
  // shuning uchun ular o'zgarganda bu `useEffect` qayta ishlaydi.


  const fetchSalesDetails = useCallback(async (currencyType) => {
    const kassaIdForDetails = currentStore?.id || null; // Har doim joriy store dan olish
    console.log(`fetchSalesDetails chaqirildi. currencyType: ${currencyType}, kassaIdForDetails: ${kassaIdForDetails}`);
    if (kassaIdForDetails === null) {
      setSalesDetailError("Kassa tanlanmagan yoki mavjud emas.");
      setIsSalesDetailLoading(false); // Yuklanishni to'xtatish
      setIsSalesDetailModalOpen(true); // Modalni ochish (xatolikni ko'rsatish uchun)
      setSalesDetailData([]); // Ma'lumotni tozalash
      return;
    }
    // ... (qolgan kod avvalgidek)
    setIsSalesDetailModalOpen(true);
    setIsSalesDetailLoading(true);
    setSalesDetailError(null);
    setSalesDetailData([]);
    setSalesDetailCurrency(
      currencyType === "ALL_CURRENCIES" ? "Barcha" : currencyType
    );

    const params: any = { kassa_id: kassaIdForDetails };
      if (selectedDate) params.date = selectedDate;
    else if (selectedMonth) params.month = selectedMonth;
    else params.period_type = statsPeriodType;

    if (currencyType !== "ALL_CURRENCIES") {
      params.currency = currencyType.toLowerCase();
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setSalesDetailError("Iltimos, tizimga kiring.");
        setIsSalesDetailLoading(false); return;
      }
      console.log("fetchSalesDetails: API_URL_SALES_DETAILS ga so'rov. Params:", params);
      const response = await axios.get(API_URL_SALES_DETAILS, {
        headers: { Authorization: `Bearer ${token}` }, params, timeout: 15000,
      });
      console.log("fetchSalesDetails: API javobi:", response.data);
      setSalesDetailData( Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (err:any) {
        console.error("Sales Detail API xatosi:", err);
      // Xatolikni qayta ishlash...
       if (err.response?.status === 401) setSalesDetailError("Sessiya muddati tugagan. Iltimos, tizimga qayta kiring.");
        else if (err.code === "ECONNABORTED") setSalesDetailError("So‘rov muddati tugadi. Internetni tekshiring.");
        else setSalesDetailError(`Sotuvlar ro'yxatini olishda xato: ${err.response?.data?.detail || err.message || "Noma'lum xato"}`);
        setSalesDetailData([]);
    } finally {
      console.log("fetchSalesDetails: finally.");
      setIsSalesDetailLoading(false);
    }
  }, [currentStore, statsPeriodType, selectedDate, selectedMonth]); // currentStore ga bog'liqlik qo'shildi


  // ... (formatCurrency, formatCount, handle... funksiyalari avvalgidek)
   const formatCurrency = (number) => {
    const num = parseFloat(number);
    return isNaN(num)
      ? "0"
      : new Intl.NumberFormat("uz-UZ").format(Math.round(num));
  };

  const formatCount = (number) => {
    const num = parseInt(number);
    return isNaN(num) ? "0" : num.toLocaleString("uz-UZ");
  };

  const handleStatsDateChange = (e) => {
    const dateValue = e.target.value;
    setSelectedDate(dateValue ? dateValue : null);
    setSelectedMonth(null);
  };

  const handleStatsMonthChange = (e) => {
    const monthValue = e.target.value;
    setSelectedMonth(monthValue ? monthValue : null);
    setSelectedDate(null);
  };

  const clearStatsFilters = () => {
    setSelectedDate(null);
    setSelectedMonth(null);
    setStatsPeriodType("daily");
  };

  const clearChartFilters = () => {
    setChartStartDate(null);
    setChartEndDate(null);
    setChartGroupingPeriod("monthly");
    setChartDisplayCurrency("UZS");
  };

  // ... (ma'lumotlarni chiqarish logikasi avvalgidek)
  let cashflow_usd = 0, cashflow_uzs = 0;
  let net_profit_usd = 0, net_profit_uzs = 0;
  let sales_count_usd = 0, sales_count_uzs = 0, total_sales_count = 0;
  let cardTitlePrefix = "Joriy";

  if (dashboardData) {
    // ... (avvalgi logika, faqat statsPeriodType ishlatiladi)
    if (selectedDate) {
        cashflow_usd = dashboardData.today_cashflow_usd || 0;
        cashflow_uzs = dashboardData.today_cashflow_uzs || 0;
        net_profit_usd = dashboardData.today_net_profit_usd || 0;
        net_profit_uzs = dashboardData.today_net_profit_uzs || 0;
        sales_count_usd = dashboardData.today_sales_usd_count || 0;
        sales_count_uzs = dashboardData.today_sales_uzs_count || 0;
        cardTitlePrefix = `${new Date(selectedDate + 'T00:00:00').toLocaleDateString('uz-Latn-UZ', { year: 'numeric', month: 'long', day: 'numeric' })}gi`;
    } else if (selectedMonth) {
        cashflow_usd = dashboardData.monthly_cashflow_usd || 0;
        cashflow_uzs = dashboardData.monthly_cashflow_uzs || 0;
        net_profit_usd = dashboardData.monthly_net_profit_usd || 0;
        net_profit_uzs = dashboardData.monthly_net_profit_uzs || 0;
        sales_count_usd = dashboardData.monthly_sales_usd_count || 0;
        sales_count_uzs = dashboardData.monthly_sales_uzs_count || 0;
        const [year, month] = selectedMonth.split('-');
        cardTitlePrefix = `${new Date(year, parseInt(month)-1).toLocaleDateString('uz-Latn-UZ', { year: 'numeric', month: 'long' })} oyi uchun`;
    } else {
        if (statsPeriodType === "daily") { /* ... */ cardTitlePrefix = "Kunlik";
            cashflow_usd = dashboardData.today_cashflow_usd || 0;
            cashflow_uzs = dashboardData.today_cashflow_uzs || 0;
            net_profit_usd = dashboardData.today_net_profit_usd || 0;
            net_profit_uzs = dashboardData.today_net_profit_uzs || 0;
            sales_count_usd = dashboardData.today_sales_usd_count || 0;
            sales_count_uzs = dashboardData.today_sales_uzs_count || 0;
        }
        else if (statsPeriodType === "monthly") { /* ... */  cardTitlePrefix = "Oylik";
            cashflow_usd = dashboardData.monthly_cashflow_usd || 0;
            cashflow_uzs = dashboardData.monthly_cashflow_uzs || 0;
            net_profit_usd = dashboardData.monthly_net_profit_usd || 0;
            net_profit_uzs = dashboardData.monthly_net_profit_uzs || 0;
            sales_count_usd = dashboardData.monthly_sales_usd_count || 0;
            sales_count_uzs = dashboardData.monthly_sales_uzs_count || 0;
        }
        else if (statsPeriodType === "all") { /* ... */ cardTitlePrefix = "Umumiy";
            cashflow_usd = dashboardData.total_cashflow_usd || 0;
            cashflow_uzs = dashboardData.total_cashflow_uzs || 0;
            net_profit_usd = dashboardData.total_net_profit_usd || 0;
            net_profit_uzs = dashboardData.total_net_profit_uzs || 0;
            sales_count_usd = dashboardData.total_sales_usd_count || 0;
            sales_count_uzs = dashboardData.total_sales_uzs_count || 0;
        }
    }
    total_sales_count = (parseInt(sales_count_usd) || 0) + (parseInt(sales_count_uzs) || 0);
  }

  const changePercentage = parseFloat(dashboardData?.sales_change_percentage) || 0;
  const commonDesc =
    dashboardData?.sales_change_percentage !== undefined &&
    !selectedDate && !selectedMonth
    ? ( /* ... */ <span className={`${changePercentage >= 0 ? "text-green-500" : "text-red-500"} flex items-center text-xs`} >
        {changePercentage >= 0 ? ( <ChevronUp className="h-4 w-4 mr-1" /> ) : ( <ChevronDown className="h-4 w-4 mr-1" /> )}
        {changePercentage >= 0 ? "+" : ""}
        {parseFloat(changePercentage).toFixed(1)}% o'zgarish
      </span>)
    : (selectedDate || selectedMonth ? "Tanlangan davr uchun" : "Oldingi davrga nisbatan");

  let chartTitleSuffix = "";
    if (chartStartDate && chartEndDate) chartTitleSuffix = ` (${formatDateToYYYYMMDD(chartStartDate)} - ${formatDateToYYYYMMDD(chartEndDate)})`;
    else if (chartStartDate) chartTitleSuffix = ` (${formatDateToYYYYMMDD(chartStartDate)} dan)`;


  // Yuklanish holatini boshqarish
  if (isStoreLoading !== false && isStoreLoading !== undefined) { // AppContext dan store yuklanishini kutamiz
    console.log("Render: Yuklanish ekrani (isStoreLoading).");
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin mr-3 text-primary" />
        <p className="text-lg">Dastlabki sozlamalar yuklanmoqda...</p>
      </div>
    );
  }

  if (isLoading || isChartLoading) { // API so'rovlari bajarilayotgan bo'lsa
      // Agar birinchi marta yuklanayotgan bo'lsa (dashboardData va chartRawData bo'sh bo'lsa) to'liq ekran loader
      if (!dashboardData && !chartRawData.labels.length) {
          console.log("Render: Yuklanish ekrani (API so'rovlari).");
            return (
                <div className="flex items-center justify-center h-screen">
                    <Loader2 className="h-12 w-12 animate-spin mr-3 text-primary" />
                    <p className="text-lg">Ma'lumotlar yuklanmoqda...</p>
                </div>
            );
      }
      // Agar qisman ma'lumot bo'lsa, kichik loader ko'rsatiladi (keyingi renderda)
  }


  if (error && !dashboardData) { // Faqat dashboard uchun asosiy xatolik bo'lsa
    console.log("Render: Xatolik ekrani (dashboardData uchun).");
    // ... (Xatolik ekrani JSX)
    return (
      <div className="text-center text-destructive-foreground bg-destructive p-6 rounded-lg shadow-md mt-10 max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-2">Xatolik!</h2>
        <p>{error}</p>
        <button
          onClick={() => {
            if (currentStore?.id) fetchData(currentStore.id);
            // yoki isStoreLoading === false bo'lganda
          }}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Qayta urinish
        </button>
      </div>
    );
  }
  console.log("--- Dashboard komponenti render tugadi ---");
  // JSX qismi avvalgidek
  return (
    <div className="space-y-6 p-4 md:p-6 relative">
      {(isLoading || isChartLoading) && (dashboardData || chartRawData.labels.length > 0) && (
          <div className="absolute top-4 right-4 z-50 bg-background/80 p-2 rounded-full shadow">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      {error && dashboardData && ( // Agar dashboardData bor bo'lsa, xatolikni kichikroq ko'rsatamiz
         <div className="mb-4 text-center text-sm text-destructive-foreground bg-destructive p-3 rounded-md">
          <p>Ma'lumotlarni yangilashda xatolik: {error}</p>
          <button
            onClick={() => {
              if (currentStore?.id) fetchData(currentStore.id);
            }}
            className="mt-2 px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Qayta urinish
          </button>
        </div>
      )}

      <div>
        <h1 className="text-2xl md:text-3xl font-bold gradient-heading">
          Boshqaruv paneli
        </h1>
        <p className="text-muted-foreground mt-1">
          {currentStore?.name || `Kassa: ${isStoreLoading ? 'Yuklanmoqda...' : (currentStore?.id || 'Tanlanmagan')}`}
        </p>
      </div>

      <div className="p-4 border rounded-lg shadow-sm bg-card mb-6">
        <h3 className="text-lg font-semibold mb-3 text-card-foreground">Statistika Filtrlari</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div>
            <label htmlFor="statsPeriodType" className="block text-sm font-medium text-muted-foreground mb-1">
              Standart Davr
            </label>
            <select
              id="statsPeriodType"
              value={statsPeriodType}
              onChange={(e) => {
                setStatsPeriodType(e.target.value);
                setSelectedDate(null);
                setSelectedMonth(null);
              }}
              disabled={!!selectedDate || !!selectedMonth}
              className="p-2 w-full border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary bg-background text-foreground"
            >
              <option value="daily">Kunlik (Joriy)</option>
              <option value="monthly">Oylik (Joriy)</option>
              <option value="all">Umumiy</option>
            </select>
          </div>
          <div>
            <label htmlFor="selectedDate" className="block text-sm font-medium text-muted-foreground mb-1">
              Aniq Kun Tanlash
            </label>
            <input
              type="date"
              id="selectedDate"
              value={selectedDate || ""}
              onChange={handleStatsDateChange}
              className="p-2 w-full border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary bg-background text-foreground"
            />
          </div>
          <div>
            <label htmlFor="selectedMonth" className="block text-sm font-medium text-muted-foreground mb-1">
              Aniq Oy Tanlash
            </label>
            <input
              type="month"
              id="selectedMonth"
              value={selectedMonth || ""}
              onChange={handleStatsMonthChange}
              className="p-2 w-full border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary bg-background text-foreground"
            />
          </div>
          <div>
            <button
              onClick={clearStatsFilters}
              className="w-full p-2 border border-border rounded-md shadow-sm bg-muted hover:bg-muted/80 text-muted-foreground flex items-center justify-center gap-2"
            >
              <FilterX className="h-4 w-4" /> Tozalash
            </button>
          </div>
        </div>
         {(selectedDate || selectedMonth) && (
            <p className="text-xs text-muted-foreground mt-2">
                {selectedDate ? `${new Date(selectedDate + 'T00:00:00').toLocaleDateString('uz-Latn-UZ', {dateStyle: 'full'})} uchun statistika.` : ''}
                {selectedMonth ? `${new Date(selectedMonth + '-01T00:00:00').toLocaleDateString('uz-Latn-UZ', {year: 'numeric', month: 'long'})} oyi uchun statistika.` : ''}
                {' '}Agar standart davrga qaytmoqchi bo'lsangiz, filtrlarni tozalang.
            </p>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md relative mb-4 text-sm" role="alert">
         <div className="flex items-start">
          <Info className="h-5 w-5 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
          <div>
            <strong className="font-semibold">Muhim eslatma:</strong>
            <span className="block sm:inline ml-1">
              Sof foyda to'g'ri hisoblanishi uchun mahsulotlarning tan narxlari (sotib olish narxi) tizimga kiritilgan bo'lishi shart.
              Aks holda, tan narxi kiritilmagan mahsulotlar uchun foyda 0 deb hisoblanishi mumkin.
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
         <StatsCard
          title={`${cardTitlePrefix} tushum (USD)`}
          value={`${formatCurrency(cashflow_usd)} USD`}
          icon={<Landmark className="h-5 w-5 text-purple-500" />}
          description={commonDesc}
          onClick={() => fetchSalesDetails("USD")}
          className="cursor-pointer hover:shadow-lg transition-shadow"
        />
        <StatsCard
          title={`${cardTitlePrefix} tushum (UZS)`}
          value={`${formatCurrency(cashflow_uzs)} UZS`}
          icon={<Landmark className="h-5 w-5 text-teal-500" />}
          description={commonDesc}
          onClick={() => fetchSalesDetails("UZS")}
          className="cursor-pointer hover:shadow-lg transition-shadow"
        />
         <StatsCard
          title={`${cardTitlePrefix} JAMI SOTUVLAR`}
          value={`${formatCount(total_sales_count)} dona`}
          icon={<ShoppingCart className="h-5 w-5 text-orange-500" />}
          description="Barcha valyutadagi tranzaksiyalar soni"
          onClick={() => fetchSalesDetails("ALL_CURRENCIES")}
          className="cursor-pointer hover:shadow-lg transition-shadow"
        />
        <StatsCard
          title={`${cardTitlePrefix} sof foyda (USD)`}
          value={`${formatCurrency(net_profit_usd)} USD`}
          icon={<TrendingUp className="h-5 w-5 text-sky-500" />}
          description={commonDesc}
          className="hover:shadow-lg transition-shadow"
        />
        <StatsCard
          title={`${cardTitlePrefix} sof foyda (UZS)`}
          value={`${formatCurrency(net_profit_uzs)} UZS`}
          icon={<TrendingUp className="h-5 w-5 text-lime-500" />}
          description={commonDesc}
          className="hover:shadow-lg transition-shadow"
        />
         {dashboardData?.kassa_balance_uzs !== undefined && (
            <StatsCard
            title="Kassa Balansi (UZS)"
            value={`${formatCurrency(dashboardData.kassa_balance_uzs)} UZS`}
            icon={<Landmark className="h-5 w-5 text-gray-500" />}
            description="Joriy vaqtdagi kassa balansi"
            className="opacity-80"
            />
        )}
        {dashboardData?.kassa_balance_usd !== undefined && (
            <StatsCard
            title="Kassa Balansi (USD)"
            value={`${formatCurrency(dashboardData.kassa_balance_usd)} USD`}
            icon={<Landmark className="h-5 w-5 text-gray-400" />}
            description="Joriy vaqtdagi kassa balansi"
            className="opacity-80"
            />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <div className="lg:col-span-2 bg-card p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3 text-card-foreground">Sotuvlar Grafigi Filtrlari</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end mb-4">
                 <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Davr Tanlash (Grafik uchun)
                    </label>
                    <div className="flex items-center gap-2">
                        <DatePicker
                            selected={chartStartDate}
                            onChange={(date) => setChartStartDate(date)}
                            selectsStart
                            startDate={chartStartDate}
                            endDate={chartEndDate}
                            placeholderText="Boshlanish sanasi"
                            dateFormat="yyyy-MM-dd"
                            className="p-2 w-full border border-border rounded-md shadow-sm bg-background text-foreground"
                        />
                        <DatePicker
                            selected={chartEndDate}
                            onChange={(date) => setChartEndDate(date)}
                            selectsEnd
                            startDate={chartStartDate}
                            endDate={chartEndDate}
                            minDate={chartStartDate}
                            placeholderText="Tugash sanasi"
                            dateFormat="yyyy-MM-dd"
                            className="p-2 w-full border border-border rounded-md shadow-sm bg-background text-foreground"
                        />
                    </div>
                </div>
                 <div>
                    <label htmlFor="chartGroupingPeriod" className="block text-sm font-medium text-muted-foreground mb-1">
                        Guruhlash Intervali
                    </label>
                    <select
                        id="chartGroupingPeriod"
                        value={chartGroupingPeriod}
                        onChange={(e) => setChartGroupingPeriod(e.target.value)}
                        className="p-2 w-full border border-border rounded-md shadow-sm bg-background text-foreground"
                    >
                        <option value="daily">Kunlik</option>
                        <option value="weekly">Haftalik</option>
                        <option value="monthly">Oylik</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="chartDisplayCurrency" className="block text-sm font-medium text-muted-foreground mb-1">
                        Grafik Valyutasi
                    </label>
                    <select
                        id="chartDisplayCurrency"
                        value={chartDisplayCurrency}
                        onChange={(e) => setChartDisplayCurrency(e.target.value)}
                        className="p-2 w-full border border-border rounded-md shadow-sm bg-background text-foreground"
                    >
                        <option value="UZS">UZS</option>
                        <option value="USD">USD</option>
                    </select>
                </div>
                 <div className="md:col-start-4">
                    <button
                    onClick={clearChartFilters}
                    className="w-full p-2 border border-border rounded-md shadow-sm bg-muted hover:bg-muted/80 text-muted-foreground flex items-center justify-center gap-2"
                    >
                    <FilterX className="h-4 w-4" /> Tozalash
                    </button>
                </div>
            </div>

          {isChartLoading && !chartRawData.labels.length && ( // Faqat birinchi marta yuklanayotganda yoki data yo'q bo'lsa
             <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin mr-2 text-primary" />
              <p className="text-muted-foreground">Grafik yuklanmoqda...</p>
            </div>
          )}
          {chartError && !isChartLoading && (
             <div className="text-center text-destructive-foreground bg-destructive p-4 rounded h-64 flex flex-col justify-center items-center">
              <p className="font-semibold">Grafik xatosi!</p>
              <p className="text-sm mt-1">{chartError}</p>
              <button
                onClick={() => {
                  if (currentStore?.id) fetchChartData(currentStore.id);
                }}
                className="mt-3 px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Qayta urinish
              </button>
            </div>
          )}
          {!isChartLoading && !chartError && chartRawData.labels.length > 0 && (
            <SalesChart
              title={`Sotuvlar grafigi (${chartRawData.currency})${chartTitleSuffix}`}
              labels={chartRawData.labels}
              data={chartRawData.data}
            />
          )}
          {!isChartLoading && !chartError && chartRawData.labels.length === 0 && !isChartLoading && ( // Ma'lumot yo'q holati
             <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">
                Tanlangan davr va valyuta uchun grafik ma'lumotlari mavjud emas.
              </p>
            </div>
          )}
        </div>
      </div>
      {isSalesDetailModalOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 transition-opacity duration-300 ease-in-out">
          <div className="bg-background p-5 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col transform transition-all duration-300 ease-in-out scale-100">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                {cardTitlePrefix} sotuvlar (
                {salesDetailCurrency === "Barcha"
                  ? "Barcha valyutalar"
                  : salesDetailCurrency}
                ) - Ro'yxat
              </h2>
              <button
                onClick={() => setIsSalesDetailModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Yopish"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {isSalesDetailLoading && (
              <div className="flex flex-col items-center justify-center py-10 flex-grow">
                <Loader2 className="h-8 w-8 animate-spin mr-2 text-primary" />
                <p className="text-muted-foreground mt-2">Yuklanmoqda...</p>
              </div>
            )}
            {salesDetailError && !isSalesDetailLoading && (
              <div className="text-destructive-foreground bg-destructive p-3 rounded text-center flex-grow flex items-center justify-center">
                <p>{salesDetailError}</p>
              </div>
            )}
            {!isSalesDetailLoading && !salesDetailError && (
              <div className="overflow-y-auto flex-grow pr-1 custom-scrollbar">
                {salesDetailData.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0">
                      <tr>
                        <th scope="col" className="px-4 py-3">Mahsulot</th>
                        <th scope="col" className="px-4 py-3 text-right">Miqdori</th>
                        {salesDetailCurrency === "Barcha" && (
                          <th scope="col" className="px-4 py-3 text-right">Valyuta</th>
                        )}
                        <th scope="col" className="px-4 py-3 text-right">Narxi</th>
                        <th scope="col" className="px-4 py-3 text-right">Jami</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {salesDetailData.map((item: any, index) => (
                        <tr key={item.id || item.product_id || `sale-item-${index}`} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                            {item.product_name || item.product?.name || "Noma'lum mahsulot"}
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{item.quantity}</td>
                          {salesDetailCurrency === "Barcha" && (
                            <td className="px-4 py-3 text-right text-muted-foreground">{item.currency?.toUpperCase() || "-"}</td>
                          )}
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {formatCurrency(item.price_per_unit || item.price)}{" "}
                            {salesDetailCurrency !== "Barcha" ? salesDetailCurrency : item.currency?.toUpperCase() || ""}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-foreground">
                            {formatCurrency(item.total_price || parseFloat(item.price) * parseInt(item.quantity))}{" "}
                            {salesDetailCurrency !== "Barcha" ? salesDetailCurrency : item.currency?.toUpperCase() || ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center py-10 text-muted-foreground flex-grow flex items-center justify-center">
                    Tanlangan davr uchun{" "}
                    {salesDetailCurrency === "Barcha" ? "barcha valyutalarda" : salesDetailCurrency + " da"}{" "}
                    sotilgan mahsulotlar mavjud emas.
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