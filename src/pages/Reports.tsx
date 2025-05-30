import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  ArrowDownCircle,
  ArrowUpCircle,
  MinusCircle,
  Inbox, // Bo'sh holat uchun ikonka
} from "lucide-react";

// Shadcn/ui komponentlari
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const API_URL_INVENTORY_HISTORY = "https://smartphone777.pythonanywhere.com/api/inventory/history/";

// Sana formatlash funksiyasi
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
    }).format(date).replace(',', '');
  } catch (e) {
    console.error("Sana formatlashda xato:", e);
    return isoString;
  }
};

// Operatsiya uchun vizual elementlar
const getOperationVisuals = (quantity) => {
  if (quantity < 0) {
    return {
      icon: <ArrowDownCircle className="h-5 w-5 text-destructive inline mr-1.5" />,
      quantityClass: "text-destructive font-medium",
      text: quantity,
      rowClass: "hover:bg-destructive/5 dark:hover:bg-destructive/10 transition-colors duration-150",
    };
  } else if (quantity > 0) {
    return {
      icon: <ArrowUpCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-500 inline mr-1.5" />,
      quantityClass: "text-emerald-600 dark:text-emerald-500 font-medium",
      text: `+${quantity}`,
      rowClass: "hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10 transition-colors duration-150",
    };
  }
  return {
    icon: <MinusCircle className="h-5 w-5 text-muted-foreground inline mr-1.5" />,
    quantityClass: "text-muted-foreground",
    text: quantity,
    rowClass: "hover:bg-muted/30 dark:hover:bg-muted/20 transition-colors duration-150",
  };
};

export default function InventoryHistoryPage() {
  const [historyData, setHistoryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchInventoryHistory = useCallback(async (page, currentSearchTerm) => {
    setIsLoading(true);
    setError(null);
    let url = `${API_URL_INVENTORY_HISTORY}?page=${page}`;
    if (currentSearchTerm) {
      url += `&search=${encodeURIComponent(currentSearchTerm)}`;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Avtorizatsiya qilinmagan. Iltimos, tizimga kiring.");
        // TODO: Foydalanuvchini login sahifasiga yo'naltirish (masalan, useNavigate bilan)
        setIsLoading(false);
        return;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 20000,
      });
      setHistoryData(response.data);
    } catch (err) {
      console.error("Inventar harakatlari API xatosi:", err);
      if (err.response?.status === 401) {
        setError("Sessiya muddati tugagan. Iltimos, tizimga qayta kiring.");
        // TODO: Login sahifasiga yo'naltirish
      } else if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
        setError("Serverga ulanishda vaqt tugadi. Internet aloqasini tekshiring yoki keyinroq urinib ko'ring.");
      } else {
        setError(
          "Ma'lumotlarni yuklashda xatolik: " +
            (err.response?.data?.detail || err.response?.data?.message || err.message || "Noma'lum server xatosi.")
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchInventoryHistory(currentPage, searchTerm);
    }, 500); // Debounce uchun 500ms kutish

    return () => clearTimeout(handler);
  }, [currentPage, searchTerm, fetchInventoryHistory]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Qidiruv o'zgarganda birinchi sahifaga qaytish
  };

  const handlePageChange = (direction) => {
    if (direction === "next" && historyData?.next) {
      const nextPageParams = new URL(historyData.next).searchParams;
      setCurrentPage(Number(nextPageParams.get('page')) || currentPage + 1);
    } else if (direction === "prev" && historyData?.previous) {
      const prevPageParams = new URL(historyData.previous).searchParams;
      setCurrentPage(Number(prevPageParams.get('page')) || currentPage - 1);
    }
  };

  const itemsPerPage = useMemo(() => {
    // API javobidan `page_size` ni olishga harakat qilish mumkin
    // Hozircha `results` uzunligiga qarab yoki default qiymat
    return historyData?.results?.length || 10; 
  }, [historyData]);

  const pageInfo = useMemo(() => {
    if (!historyData || !historyData.count) return { current: '-', total: '-', totalItems: 0 };
    const totalPages = Math.ceil(historyData.count / itemsPerPage);
    return { current: currentPage, total: totalPages > 0 ? totalPages : 1, totalItems: historyData.count };
  }, [historyData, currentPage, itemsPerPage]);

  const items = historyData?.results || [];
  const startingItemNumber = (currentPage - 1) * itemsPerPage + 1;

  // Boshlang'ich yuklanish holati
  if (isLoading && !historyData && !error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">Yuklanmoqda...</p>
      </div>
    );
  }

  // Boshlang'ich yuklashda xatolik
  if (error && !historyData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-destructive text-center text-xl">Xatolik Yuz Berdi!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-destructive-foreground">{error}</p>
            <Button
              onClick={() => {
                setError(null);
                setSearchTerm("");
                setCurrentPage(1);
                // fetchInventoryHistory(1, ""); // useEffect buni o'zi chaqiradi
              }}
            >
              Qayta urinish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="p-4 md:p-6 lg:p-8 bg-muted/20 dark:bg-background min-h-screen">
        <Card className="shadow-xl border-border">
          <CardHeader className="border-b border-border">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <CardTitle className="text-2xl font-semibold tracking-tight">
                Hisobotlar
              </CardTitle>
              <div className="relative w-full sm:w-auto sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Mahsulot, izoh, foydalanuvchi..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10 text-sm h-9"
                />
              </div>
            </div>
            {/* Keyingi yuklashda xatolik bo'lsa (ma'lumotlar allaqachon bor) */}
            {error && historyData && (
              <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md flex justify-between items-center">
                <span>Xatolik: {error}</span>
                 <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setError(null); fetchInventoryHistory(currentPage, searchTerm);}}>
                    Qayta urinish
                 </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0 relative"> {/* Yuklagich uchun relative */}
            {/* Keyingi sahifalarni yuklash uchun indikator */}
            {isLoading && historyData && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 dark:bg-background/80 z-20 rounded-b-lg">
                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            <div className="overflow-x-auto">
              <Table className="text-sm">
                <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[60px] px-3 sm:px-4 py-3">№</TableHead>
                    <TableHead className="min-w-[220px] px-3 sm:px-4">Mahsulot</TableHead>
                    <TableHead className="w-[120px] text-center px-3 sm:px-4">Miqdor</TableHead>
                    <TableHead className="min-w-[160px] px-3 sm:px-4">Operatsiya</TableHead>
                    <TableHead className="min-w-[130px] px-3 sm:px-4">Kassa</TableHead>
                    <TableHead className="min-w-[130px] px-3 sm:px-4">Foydalanuvchi</TableHead>
                    <TableHead className="min-w-[250px] px-3 sm:px-4">Izoh</TableHead>
                    <TableHead className="w-[170px] text-right px-3 sm:px-4">Sana</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length > 0 ? (
                    items.map((item, index) => {
                      const visuals = getOperationVisuals(item.quantity);
                      return (
                        <TableRow key={item.id} className={visuals.rowClass}>
                          <TableCell className="px-3 sm:px-4 py-3 text-muted-foreground">
                            {startingItemNumber + index}
                          </TableCell>
                          <TableCell className="px-3 sm:px-4 py-3 font-medium">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="font-semibold truncate max-w-[200px] sm:max-w-xs" title={item.product?.name}>
                                  {item.product?.name || "Noma'lum mahsulot"}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{item.product?.name || "Noma'lum mahsulot"}</p>
                              </TooltipContent>
                            </Tooltip>
                            {item.product?.category_name && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {item.product.category_name}
                              </div>
                            )}
                            {item.product?.barcode && (
                              <div className="text-xs text-muted-foreground/80 mt-0.5">
                                Shtrix: {item.product.barcode}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className={`px-3 sm:px-4 py-3 text-center ${visuals.quantityClass} text-base`}>
                            {visuals.icon}
                            {visuals.text}
                          </TableCell>
                          <TableCell className="px-3 sm:px-4 py-3">{item.operation_type_display}</TableCell>
                          <TableCell className="px-3 sm:px-4 py-3">{item.kassa?.name || "-"}</TableCell>
                          <TableCell className="px-3 sm:px-4 py-3">{item.user?.username || "-"}</TableCell>
                          <TableCell className="px-3 sm:px-4 py-3 text-foreground/90 max-w-[250px] break-words leading-relaxed">
                            {item.comment || "-"}
                          </TableCell>
                          <TableCell className="px-3 sm:px-4 py-3 text-right">{formatDate(item.timestamp)}</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-48 text-center"> {/* Balandlik oshirildi */}
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <Inbox className="h-16 w-16 mb-3" /> {/* Ikonka kattalashtirildi */}
                            <p className="text-base font-medium">
                                {searchTerm ? "Qidiruv bo'yicha yozuvlar topilmadi." : "Hozircha harakatlar tarixi mavjud emas."}
                            </p>
                            {searchTerm && (
                                <Button variant="link" size="sm" onClick={() => { setSearchTerm(""); setCurrentPage(1); }} className="mt-2 text-sm">
                                    Qidiruvni tozalash
                                </Button>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
           {/* Paginatsiya */}
           {pageInfo.totalItems > itemsPerPage && (
                <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-border text-sm">
                    <span className="text-muted-foreground mb-2 sm:mb-0">
                        Jami: {pageInfo.totalItems} ta yozuv. Sahifa: {pageInfo.current} / {pageInfo.total}
                    </span>
                    <div className="flex items-center space-x-2">
                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange("prev")}
                        disabled={!historyData?.previous || isLoading}
                        className="h-8 px-3"
                        >
                        <ChevronLeft className="h-4 w-4 mr-1.5" /> Oldingisi
                        </Button>
                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange("next")}
                        disabled={!historyData?.next || isLoading}
                        className="h-8 px-3"
                        >
                        Keyingisi <ChevronRight className="h-4 w-4 ml-1.5" />
                        </Button>
                    </div>
                </div>
            )}
        </Card>
      </div>
    </TooltipProvider>
  );
}