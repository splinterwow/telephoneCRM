import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, Search, Loader2, ArrowDownCircle, ArrowUpCircle, MinusCircle } from "lucide-react"; // Qo'shimcha ikonlar

const API_URL_INVENTORY_HISTORY = "https://smartphone777.pythonanywhere.com/api/inventory/history/";

const formatDate = (isoString) => {
  if (!isoString) return "-";
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date).replace(',', ''); // Vergulni olib tashlash
  } catch (e) {
    console.error("Sana formatlashda xato:", e);
    return isoString;
  }
};

// Miqdor va operatsiya turi uchun ikonka va rang qaytaruvchi funksiya
const getOperationVisuals = (quantity, operationTypeDisplay) => {
  if (quantity < 0) {
    return {
      icon: <ArrowDownCircle className="h-5 w-5 text-red-500 inline mr-1" />,
      quantityClass: "text-red-600 font-semibold",
      text: quantity,
      rowClass: "bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-800/40",
    };
  } else if (quantity > 0) {
    // "Boshlang'ich qoldiq" yoki "Qo'shish (Kirim)" kabi operatsiyalar
    return {
      icon: <ArrowUpCircle className="h-5 w-5 text-green-500 inline mr-1" />,
      quantityClass: "text-green-600 font-semibold",
      text: `+${quantity}`,
      rowClass: "bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-800/40",
    };
  }
  // Agar miqdor 0 bo'lsa (kamdan-kam uchraydi, lekin himoya uchun)
  return {
    icon: <MinusCircle className="h-5 w-5 text-gray-500 inline mr-1" />,
    quantityClass: "text-gray-700 dark:text-gray-300",
    text: quantity,
    rowClass: "hover:bg-gray-50 dark:hover:bg-gray-750",
  };
};


export default function InventoryHistoryPage() {
  const [historyData, setHistoryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPageUrl, setCurrentPageUrl] = useState(API_URL_INVENTORY_HISTORY);

  const fetchInventoryHistory = useCallback(async (url, currentSearchTerm) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Iltimos, tizimga kiring.");
        setIsLoading(false);
        return;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search: currentSearchTerm || undefined }, // Agar search term bo'sh bo'lsa, parametrni jo'natmaymiz
        timeout: 15000,
      });
      setHistoryData(response.data);
    } catch (err) {
      console.error("Inventar harakatlari API xatosi:", err);
      if (err.response?.status === 401) {
        setError("Sessiya muddati tugagan. Iltimos, tizimga qayta kiring.");
      } else if (err.code === "ECONNABORTED") {
        setError("So‘rov muddati tugadi. Internetni tekshiring.");
      } else {
        setError(
          "Ma'lumotlarni olishda xato: " +
            (err.response?.data?.detail || err.message || "Noma'lum xato")
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    // Debounce uchun
    const handler = setTimeout(() => {
      // Qidiruv termini o'zgarganda, URLni qayta tiklaymiz (faqat search parametri bilan)
      // Sahifa o'zgarganda esa, currentPageUrl allaqachon to'g'ri bo'ladi
      const urlToFetch = searchTerm && currentPageUrl.includes('?page=') // Agar pagination bo'lsa
        ? `${API_URL_INVENTORY_HISTORY}?search=${encodeURIComponent(searchTerm)}&${currentPageUrl.split('?')[1]}`
        : `${API_URL_INVENTORY_HISTORY}?search=${encodeURIComponent(searchTerm)}`;

      fetchInventoryHistory(searchTerm ? urlToFetch : currentPageUrl, searchTerm);

    }, 500); // 500ms kutish

    return () => clearTimeout(handler);
  }, [currentPageUrl, searchTerm, fetchInventoryHistory]);


  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    // Qidiruv o'zgarganda birinchi sahifaga o'tkazish uchun URLni yangilaymiz,
    // lekin useEffect ichida to'liq URL tuziladi.
    setCurrentPageUrl(API_URL_INVENTORY_HISTORY);
  };


  const handlePageChange = (url) => {
    if (url) {
      setCurrentPageUrl(url); // useEffect buni ushlab, fetchInventoryHistoryni chaqiradi
    }
  };


  if (isLoading && !historyData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="ml-3 text-lg text-gray-700 dark:text-gray-300">Yuklanmoqda...</p>
      </div>
    );
  }

  if (error && !historyData) { // Faqat boshlang'ich yuklashdagi xato uchun to'liq ekran
    return (
      <div className="text-center text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 p-6 rounded-lg shadow-md mt-10 max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-2">Xatolik!</h2>
        <p>{error}</p>
        <button
          onClick={() => {
            setSearchTerm(""); // Qidiruvni tozalash
            setCurrentPageUrl(API_URL_INVENTORY_HISTORY); // useEffect qayta chaqiriladi
          }}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  const items = historyData?.results || [];

  return (
    <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-full xl:max-w-7xl mx-auto"> {/* Kengroq container */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
            Inventar Harakatlari
          </h1>
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Mahsulot, izoh, foydalanuvchi..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-72 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
        </div>

        {/* Ma'lumotlar yuklanayotganda yoki xatolik bo'lganda (lekin data allaqachon bor bo'lsa) ko'rsatiladigan indikator/xabar */}
        {isLoading && historyData && (
          <div className="flex justify-center my-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )}
        {error && historyData && ( // Agar data bor va yangilashda xato bo'lsa
           <div className="my-4 p-3 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-md text-center">
             Xatolik: {error}
             <button
                onClick={() => fetchInventoryHistory(currentPageUrl, searchTerm)}
                className="ml-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
             >
                Qayta urinish
             </button>
           </div>
        )}


        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
              <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-100 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-5 py-3.5 whitespace-nowrap w-[5%]">№</th>
                  <th scope="col" className="px-5 py-3.5 whitespace-nowrap w-[25%]">Mahsulot</th>
                  <th scope="col" className="px-3 py-3.5 text-center whitespace-nowrap w-[10%]">Miqdor</th>
                  <th scope="col" className="px-5 py-3.5 whitespace-nowrap w-[15%]">Operatsiya</th>
                  <th scope="col" className="px-5 py-3.5 whitespace-nowrap w-[10%]">Kassa</th>
                  <th scope="col" className="px-5 py-3.5 whitespace-nowrap w-[10%]">Foydalanuvchi</th>
                  <th scope="col" className="px-5 py-3.5 min-w-[200px] w-[20%]">Izoh</th>
                  <th scope="col" className="px-5 py-3.5 text-right whitespace-nowrap w-[10%]">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.length > 0 ? (
                  items.map((item, index) => {
                    const visuals = getOperationVisuals(item.quantity, item.operation_type_display);
                    const startingIndex = historyData?.previous ? (parseInt(new URL(historyData.previous).searchParams.get('page') || '0') * (historyData.results.length)) : 0;

                    return (
                      <tr key={item.id} className={`${visuals.rowClass} transition-colors duration-150`}>
                        <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                            {startingIndex + index + 1}
                        </td>
                        <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">
                          <div className="font-semibold">{item.product?.name || "Noma'lum"}</div>
                          {item.product?.category_name && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">{item.product.category_name}</div>
                          )}
                           {item.product?.barcode && (
                            <div className="text-xs text-gray-400 dark:text-gray-500">Shtrix: {item.product.barcode}</div>
                          )}
                        </td>
                        <td className={`px-3 py-4 text-center ${visuals.quantityClass} text-base`}>
                          {visuals.icon}
                          {visuals.text}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">{item.operation_type_display}</td>
                        <td className="px-5 py-4 whitespace-nowrap">{item.kassa?.name || "-"}</td>
                        <td className="px-5 py-4 whitespace-nowrap">{item.user?.username || "-"}</td>
                        <td className="px-5 py-4 text-gray-700 dark:text-gray-300 min-w-[200px] break-words">
                          {item.comment || "-"}
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">{formatDate(item.timestamp)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="px-5 py-16 text-center text-gray-500 dark:text-gray-400 text-lg">
                      {searchTerm ? "Qidiruv natijasi bo'sh." : "Harakatlar tarixi mavjud emas."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {historyData && (items.length > 0 || historyData.previous || historyData.next) && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-700 dark:text-gray-400 mb-2 sm:mb-0">
              Jami: {historyData.count} ta yozuv. Sahifa: {historyData.results.length > 0 ? (parseInt(new URL(currentPageUrl.includes('?') ? currentPageUrl : `${currentPageUrl}?page=1`).searchParams.get('page') || '1')) : '-'} / {historyData.count > 0 ? Math.ceil(historyData.count / (historyData.results.length || 10)) : '-'}
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(historyData.previous)}
                disabled={!historyData.previous || isLoading}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Oldingisi
              </button>
              <button
                onClick={() => handlePageChange(historyData.next)}
                disabled={!historyData.next || isLoading}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                Keyingisi <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}