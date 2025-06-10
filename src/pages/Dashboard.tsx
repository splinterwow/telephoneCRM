import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { StatsCard } from "@/components/Dashboard/StatsCard"; // Taxminiy joylashuv
import { SalesChart } from "@/components/Dashboard/SalesChart"; // Taxminiy joylashuv
// LowStockProducts import qilingan, lekin ishlatilmagan. Agar kerak bo'lmasa olib tashlanishi mumkin.
// import { LowStockProducts } from "@/components/Dashboard/LowStockProducts";
import { useApp } from "@/context/AppContext"; // Taxminiy joylashuv
import {
  ShoppingCart, // Jami sotuvlar soni uchun qoldirdim
  DollarSign, // Eski ikonka, o'rniga Landmark/TrendingUp ishlatiladi
  Layers, // Jami sotuvlar soni uchun alternativa bo'lishi mumkin
  Loader2,
  ChevronUp,
  ChevronDown,
  X,
  TrendingUp, // Sof foyda uchun
  Landmark, // Tushum uchun
  Info, // Eslatma uchun
} from "lucide-react";

const API_URL_DASHBOARD =
  "https://smartphone777.pythonanywhere.com/api/reports/dashboard/";
const API_URL_SALES_DETAILS =
  "https://smartphone777.pythonanywhere.com/api/reports/sales/";
const API_URL_SALES_CHART =
  "https://smartphone777.pythonanywhere.com/api/reports/sales-chart/";

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

  const [chartRawData, setChartRawData] = useState({
    labels: [],
    data: [],
    currency: "UZS",
  });
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [chartError, setChartError] = useState(null);
  const [chartDisplayCurrency, setChartDisplayCurrency] = useState("UZS");

  useEffect(() => {
    if (currentStore?.id && currentStore.id !== kassaId) {
      setKassaId(currentStore.id);
    }
  }, [currentStore, kassaId]);

  const fetchData = useCallback(
    async (currentKassaId) => {
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
          setError("So‘rov muddati tugadi. Internet aloqasini tekshiring.");
        } else {
          setError(
            "Dashboard ma'lumotlarini olishda xato: " +
              (err.response?.data?.detail || err.message || "Noma'lum xato")
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [periodType]
  );

  const fetchChartData = useCallback(
    async (currentKassaId, chartPeriod, currencyForChart) => {
      setIsChartLoading(true);
      setChartError(null);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setChartError("Grafik uchun: Iltimos, tizimga kiring.");
          setIsChartLoading(false);
          return;
        }
        let apiChartPeriod = chartPeriod;
        if (chartPeriod === "all") {
          apiChartPeriod = "monthly"; // API "all" uchun "monthly" kutishi mumkin
        }
        const response = await axios.get(API_URL_SALES_CHART, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            kassa_id: currentKassaId,
            period_type: apiChartPeriod,
            currency: currencyForChart.toUpperCase(),
          },
          timeout: 10000,
        });
        setChartRawData({
          labels: response.data.labels || [],
          data: response.data.data || [],
          currency: currencyForChart.toUpperCase(),
        });
      } catch (err)
      {
        console.error("Sales Chart API xatosi:", err);
        if (err.response?.status === 401) {
          setChartError("Grafik uchun sessiya muddati tugagan.");
        } else if (err.code === "ECONNABORTED") {
          setChartError("Grafik uchun so‘rov muddati tugadi.");
        } else {
          setChartError(
            "Grafik ma'lumotlarini olishda xato: " +
              (err.response?.data?.detail || err.message || "Noma'lum xato")
          );
        }
      } finally {
        setIsChartLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (kassaId) {
      fetchData(kassaId);
      fetchChartData(kassaId, periodType, chartDisplayCurrency);
    }
  }, [kassaId, periodType, chartDisplayCurrency, fetchData, fetchChartData]);

  const fetchSalesDetails = useCallback(
    async (currencyType) => {
      setIsSalesDetailModalOpen(true);
      setIsSalesDetailLoading(true);
      setSalesDetailError(null);
      setSalesDetailData([]);
      setSalesDetailCurrency(
        currencyType === "ALL_CURRENCIES" ? "Barcha" : currencyType
      );

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
        setSalesDetailData(
          Array.isArray(response.data)
            ? response.data
            : response.data.results || []
        );
      } catch (err) {
        console.error("Sales Detail API xatosi:", err);
        if (err.response?.status === 401) {
          setSalesDetailError(
            "Sessiya muddati tugagan. Iltimos, tizimga qayta kiring."
          );
        } else if (err.code === "ECONNABORTED") {
          setSalesDetailError("So‘rov muddati tugadi. Internetni tekshiring.");
        } else {
          setSalesDetailError(
            "Sotuvlar ro'yxatini olishda xato: " +
              (err.response?.data?.detail || err.message || "Noma'lum xato")
          );
        }
      } finally {
        setIsSalesDetailLoading(false);
      }
    },
    [kassaId, periodType]
  );

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

  let cashflow_usd = 0,
    cashflow_uzs = 0;
  let net_profit_usd = 0,
    net_profit_uzs = 0;
  let sales_count_usd = 0, // Bu eski nom, backend javobiga qarab o'zgartirilishi mumkin
    sales_count_uzs = 0, // Bu eski nom
    total_sales_count = 0;
  let cardTitlePrefix = "Joriy";
  // Backend `sales_change_percentage` ni qaytarishini taxmin qilamiz.
  // Ideal holda tushum va sof foyda uchun alohida foizlar bo'lishi kerak.
  let changePercentage = parseFloat(dashboardData?.sales_change_percentage) || 0;

  if (dashboardData) {
    if (periodType === "daily") {
      cashflow_usd = dashboardData.today_cashflow_usd || 0;
      cashflow_uzs = dashboardData.today_cashflow_uzs || 0;
      net_profit_usd = dashboardData.today_net_profit_usd || 0;
      net_profit_uzs = dashboardData.today_net_profit_uzs || 0;
      sales_count_usd = dashboardData.today_sales_usd_count || 0;
      sales_count_uzs = dashboardData.today_sales_uzs_count || 0;
      cardTitlePrefix = "Kunlik";
    } else if (periodType === "monthly") {
      cashflow_usd = dashboardData.monthly_cashflow_usd || 0;
      cashflow_uzs = dashboardData.monthly_cashflow_uzs || 0;
      net_profit_usd = dashboardData.monthly_net_profit_usd || 0;
      net_profit_uzs = dashboardData.monthly_net_profit_uzs || 0;
      sales_count_usd = dashboardData.monthly_sales_usd_count || 0;
      sales_count_uzs = dashboardData.monthly_sales_uzs_count || 0;
      cardTitlePrefix = "Oylik";
    } else if (periodType === "all") {
      cashflow_usd = dashboardData.total_cashflow_usd || 0; // Taxminiy kalit nomi
      cashflow_uzs = dashboardData.total_cashflow_uzs || 0; // Taxminiy kalit nomi
      net_profit_usd = dashboardData.total_net_profit_usd || 0; // Taxminiy kalit nomi
      net_profit_uzs = dashboardData.total_net_profit_uzs || 0; // Taxminiy kalit nomi
      sales_count_usd = dashboardData.total_sales_usd_count || 0;
      sales_count_uzs = dashboardData.total_sales_uzs_count || 0;
      cardTitlePrefix = "Umumiy";
    }
    total_sales_count = (parseInt(sales_count_usd) || 0) + (parseInt(sales_count_uzs) || 0);
  }

  if (
    isLoading &&
    !dashboardData &&
    isChartLoading &&
    !chartRawData.data.length
  ) {
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
          onClick={() => {
            if (kassaId) fetchData(kassaId);
          }}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  // const lowStockItems = dashboardData?.low_stock_products || []; // Hali ishlatilmayapti

  const commonDesc =
    dashboardData?.sales_change_percentage !== undefined &&
    dashboardData?.sales_change_percentage !== null ? (
      <span
        className={`${
          changePercentage >= 0 ? "text-green-500" : "text-red-500"
        } flex items-center text-xs`}
      >
        {changePercentage >= 0 ? (
          <ChevronUp className="h-4 w-4 mr-1" />
        ) : (
          <ChevronDown className="h-4 w-4 mr-1" />
        )}
        {changePercentage >= 0 ? "+" : ""}
        {parseFloat(changePercentage).toFixed(1)}% o'zgarish
      </span>
    ) : (
      "Oldingi davrga nisbatan"
    );

  let chartTitlePeriod = cardTitlePrefix;
  if (periodType === "all" && chartTitlePeriod === "Umumiy") {
    chartTitlePeriod = "Oylik"; // Grafik uchun "Umumiy" davrda oylik ko'rsatiladi
  }

  return (
    <div className="space-y-6 p-4 md:p-6 relative">
      {(isLoading || isChartLoading) &&
        (dashboardData || chartRawData.data.length > 0) && (
          <div className="absolute top-4 right-4 z-50 bg-background/80 p-2 rounded-full shadow">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      {error && dashboardData && (
        <div className="mb-4 text-center text-sm text-destructive-foreground bg-destructive p-3 rounded-md">
          <p>Asosiy ma'lumotlarni yangilashda xatolik: {error}</p>
          <button
            onClick={() => {
              if (kassaId) fetchData(kassaId);
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
          {currentStore?.name || `Kassa ID: ${kassaId}`}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <select
          value={periodType}
          onChange={(e) => setPeriodType(e.target.value)}
          className="p-2 border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary bg-card text-card-foreground w-full sm:w-auto"
          aria-label="Davrni tanlang"
        >
          <option value="daily">Kunlik</option>
          <option value="monthly">Oylik</option>
          <option value="all">Umumiy</option>
        </select>

        {/* <div className="mt-2 sm:mt-0 w-full sm:w-auto">
          <label
            htmlFor="chartCurrencySelect"
            className="text-sm text-muted-foreground mr-2 sr-only sm:not-sr-only"
          >
            Grafik valyutasi:
          </label>
          <select
            id="chartCurrencySelect"
            value={chartDisplayCurrency}
            onChange={(e) => setChartDisplayCurrency(e.target.value)}
            className="p-2 border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary bg-card text-card-foreground w-full"
            aria-label="Grafik valyutasini tanlang"
          >
            <option value="UZS">UZS</option>
            <option value="USD">USD</option>
          </select>
        </div> */}
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
          icon={<ShoppingCart className="h-5 w-5 text-orange-500" />} // Ikonkani Layers dan ShoppingCart ga o'zgartirdim
          description="Barcha valyutadagi tranzaksiyalar soni"
          onClick={() => fetchSalesDetails("ALL_CURRENCIES")}
          className="cursor-pointer hover:shadow-lg transition-shadow"
        />
        <StatsCard
          title={`${cardTitlePrefix} sof foyda (USD)`}
          value={`${formatCurrency(net_profit_usd)} USD`}
          icon={<TrendingUp className="h-5 w-5 text-sky-500" />}
          description={commonDesc} // Agar sof foyda uchun alohida o'zgarish foizi bo'lsa, shuni ishlatish kerak
          // onClick={() => {}} Hozircha bosilmaydi
          className="hover:shadow-lg transition-shadow" // Agar bosilmasa cursor-pointer olib tashlanadi
        />
        <StatsCard
          title={`${cardTitlePrefix} sof foyda (UZS)`}
          value={`${formatCurrency(net_profit_uzs)} UZS`}
          icon={<TrendingUp className="h-5 w-5 text-lime-500" />}
          description={commonDesc} // Agar sof foyda uchun alohida o'zgarish foizi bo'lsa, shuni ishlatish kerak
          // onClick={() => {}} Hozircha bosilmaydi
          className="hover:shadow-lg transition-shadow" // Agar bosilmasa cursor-pointer olib tashlanadi
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <div className="lg:col-span-2 bg-card p-4 rounded-lg shadow">
          {isChartLoading && (
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
                  if (kassaId)
                    fetchChartData(kassaId, periodType, chartDisplayCurrency);
                }}
                className="mt-3 px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Qayta urinish
              </button>
            </div>
          )}
          {!isChartLoading && !chartError && chartRawData.data.length > 0 && (
            <SalesChart
              title={`${chartTitlePeriod} sotuvlar grafigi (${chartRawData.currency})`}
              labels={chartRawData.labels}
              data={chartRawData.data}
            />
          )}
          {!isChartLoading && !chartError && chartRawData.data.length === 0 && (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">
                Tanlangan davr va valyuta uchun grafik ma'lumotlari mavjud emas.
              </p>
            </div>
          )}
        </div>
        {/* LowStockProducts komponenti uchun joy (agar kerak bo'lsa) */}
        {/* {dashboardData && dashboardData.low_stock_products && dashboardData.low_stock_products.length > 0 && (
          <div className="bg-card p-4 rounded-lg shadow">
            <LowStockProducts products={dashboardData.low_stock_products} />
          </div>
        )} */}
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
                        <th scope="col" className="px-4 py-3">
                          Mahsulot
                        </th>
                        <th scope="col" className="px-4 py-3 text-right">
                          Miqdori
                        </th>
                        {salesDetailCurrency === "Barcha" && (
                          <th scope="col" className="px-4 py-3 text-right">
                            Valyuta
                          </th>
                        )}
                        <th scope="col" className="px-4 py-3 text-right">
                          Narxi
                        </th>
                        <th scope="col" className="px-4 py-3 text-right">
                          Jami
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {salesDetailData.map((item, index) => (
                        <tr
                          key={
                            item.id || item.product_id || `sale-item-${index}`
                          }
                          className="hover:bg-muted/30"
                        >
                          <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                            {item.product_name ||
                              item.product?.name ||
                              "Noma'lum mahsulot"}
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {item.quantity}
                          </td>
                          {salesDetailCurrency === "Barcha" && (
                            <td className="px-4 py-3 text-right text-muted-foreground">
                              {item.currency?.toUpperCase() || "-"}
                            </td>
                          )}
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {formatCurrency(item.price_per_unit || item.price)}{" "}
                            {salesDetailCurrency !== "Barcha"
                              ? salesDetailCurrency
                              : item.currency?.toUpperCase() || ""}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-foreground">
                            {formatCurrency(
                              item.total_price ||
                                parseFloat(item.price) * parseInt(item.quantity)
                            )}{" "}
                            {salesDetailCurrency !== "Barcha"
                              ? salesDetailCurrency
                              : item.currency?.toUpperCase() || ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center py-10 text-muted-foreground flex-grow flex items-center justify-center">
                    Tanlangan davr uchun{" "}
                    {salesDetailCurrency === "Barcha"
                      ? "barcha valyutalarda"
                      : salesDetailCurrency + " da"}{" "}
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