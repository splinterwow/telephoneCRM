import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Trash2,
  Loader2,
  PackageX,
  FilterX,
  AlertTriangle,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Warehouse,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Backend API manzillari
const API_BASE_URL = "https://smartphone777.pythonanywhere.com/api";
const API_URL_PRODUCT_STOCKS_LIST = `${API_BASE_URL}/inventory/product-stocks/`;
const API_URL_INVENTORY_ADD = `${API_BASE_URL}/inventory/add/`;
const API_URL_KASSAS = `${API_BASE_URL}/kassa/`;
const API_URL_PRODUCTS = `${API_BASE_URL}/products/`;

// Interfeyslar
interface Product {
  id: number;
  name: string;
  barcode?: string | null;
  category_name?: string | null;
  price_usd?: string | null;
  price_uzs?: string | null;
  purchase_price_usd?: string | null;
  purchase_price_uzs?: string | null;
  created_at?: string;
  supplier_name_manual?: string | null;
  supplier_phone_manual?: string | null;
}

interface Kassa {
  id: number;
  name: string;
  is_active?: boolean;
}

interface ProductStock {
  id: number;
  product: Product;
  kassa: Kassa;
  quantity: number;
  minimum_stock_level: number;
  is_low_stock: boolean;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface ProductStockManagementProps {
  isAdmin: boolean;
}

const formatCurrency = (
  value: string | number | null | undefined,
  currency = "USD",
) => {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    String(value).trim() === ""
  )
    return null;
  const num = parseFloat(String(value));
  if (isNaN(num)) return null;

  return new Intl.NumberFormat(currency === "UZS" ? "uz-UZ" : "en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: currency === "UZS" ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch (e) {
    return dateString;
  }
};

export default function ProductStockManagement({
  isAdmin,
}: ProductStockManagementProps) {
  const [productStocks, setProductStocks] = useState<ProductStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterKassaId, setFilterKassaId] = useState<string>("");
  const [filterProductId, setFilterProductId] = useState<string>("");
  const [filterIsLowStock, setFilterIsLowStock] = useState<string>("");
  const [filterQuantityGTE, setFilterQuantityGTE] = useState<string>("");
  const [ordering, setOrdering] = useState<string>("-id");

  const [kassaList, setKassaList] = useState<Kassa[]>([]);
  const [productListForFilter, setProductListForFilter] = useState<Product[]>([]);
  const [isFilterDataLoading, setIsFilterDataLoading] = useState(true);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [stockToDelete, setStockToDelete] = useState<ProductStock | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteQuantity, setDeleteQuantity] = useState<string>("");
  const [deleteAll, setDeleteAll] = useState(false);

  const [isAddKassaModalOpen, setIsAddKassaModalOpen] = useState(false);
  const [newKassaName, setNewKassaName] = useState("");
  const [newKassaIsActive, setNewKassaIsActive] = useState(true);
  const [isSubmittingKassa, setIsSubmittingKassa] = useState(false);

  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [selectedProductIdForStock, setSelectedProductIdForStock] =
    useState<string>("");
  const [selectedKassaIdForStock, setSelectedKassaIdForStock] =
    useState<string>("");
  const [stockQuantity, setStockQuantity] = useState<string>("");
  const [stockMinLevel, setStockMinLevel] = useState<string>("");
  const [isSubmittingStock, setIsSubmittingStock] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 15;

  const navigate = useNavigate();

  const getAuthHeaders = useCallback(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast.error("Sessiya topilmadi. Iltimos, tizimga qayta kiring.");
      navigate("/login");
      throw new Error("Sessiya topilmadi.");
    }
    return {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
  }, [navigate]);

  const fetchKassasAndProductsForFilters = useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsFilterDataLoading(true);
      try {
        const headers = getAuthHeaders();
        const [kassaRes, productRes] = await Promise.all([
          axios.get<PaginatedResponse<Kassa> | Kassa[]>(API_URL_KASSAS, {
            headers,
            params: { page_size: 1000 },
          }),
          axios.get<PaginatedResponse<Product> | Product[]>(API_URL_PRODUCTS, {
            headers,
            params: { page_size: 1000, is_active: true },
          }),
        ]);

        setKassaList(
          "results" in kassaRes.data ? kassaRes.data.results : kassaRes.data,
        );
        setProductListForFilter(
          "results" in productRes.data ? productRes.data.results : productRes.data,
        );
      } catch (err) {
        console.error("Filtrlar uchun ma'lumotlarni yuklashda xato:", err);
        setError("Filtrlar ma'lumotlarini yuklashda xatolik yuz berdi.");
      } finally {
        if (showLoading) setIsFilterDataLoading(false);
      }
    },
    [getAuthHeaders],
  );

  const fetchProductStocks = useCallback(
    async (page = 1, signal?: AbortSignal) => {
      setIsLoading(true);
      setError(null);
      try {
        const headers = getAuthHeaders();
        const params: any = {
          page,
          page_size: PAGE_SIZE,
          ordering,
        };
        if (searchQuery.trim()) params.search = searchQuery.trim();
        if (filterKassaId) params.kassa = filterKassaId;
        if (filterProductId) params.product = filterProductId;
        if (filterIsLowStock) params.is_low_stock = filterIsLowStock;
        if (
          filterQuantityGTE &&
          !isNaN(parseInt(filterQuantityGTE)) &&
          parseInt(filterQuantityGTE) >= 0
        ) {
          params.quantity__gte = parseInt(filterQuantityGTE);
        }

        const response = await axios.get<PaginatedResponse<ProductStock>>(
          API_URL_PRODUCT_STOCKS_LIST,
          { headers, params, signal },
        );
        setProductStocks(response.data.results);
        setTotalCount(response.data.count);
        setCurrentPage(page);
      } catch (err: any) {
        if (axios.isCancel(err)) {
          console.log("Request canceled:", err.message);
          return;
        }
        if (err.response?.status === 401) {
          setError(
            "Sessiya muddati tugagan yoki ruxsat yo'q. Iltimos, qayta tizimga kiring.",
          );
        } else if (err.response?.status === 500) {
          setError(
            "Serverda ichki xatolik yuz berdi. Iltimos, keyinroq qayta urining.",
          );
        } else {
          const errMsg =
            err.response?.data?.detail ||
            err.message ||
            "Ombor qoldiqlarini yuklashda noma'lum xatolik.";
          setError(`Xatolik: ${errMsg}`);
        }
        setProductStocks([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    },
    [
      getAuthHeaders,
      searchQuery,
      filterKassaId,
      filterProductId,
      filterIsLowStock,
      filterQuantityGTE,
      ordering,
      PAGE_SIZE,
    ],
  );

  useEffect(() => {
    fetchKassasAndProductsForFilters();
  }, [fetchKassasAndProductsForFilters]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchProductStocks(1, abortController.signal);
    return () => {
      abortController.abort();
    };
  }, [
    searchQuery,
    filterKassaId,
    filterProductId,
    filterIsLowStock,
    filterQuantityGTE,
    ordering,
    fetchProductStocks,
  ]);

  const handleAddKassa = async () => {
    if (!newKassaName.trim()) {
      toast.error("Kassa nomi kiritilishi shart.");
      return;
    }
    setIsSubmittingKassa(true);
    try {
      const headers = getAuthHeaders();
      await axios.post(
        API_URL_KASSAS,
        { name: newKassaName.trim(), is_active: newKassaIsActive },
        { headers },
      );
      toast.success(`"${newKassaName.trim()}" nomli kassa muvaffaqiyatli qo'shildi.`);
      setIsAddKassaModalOpen(false);
      setNewKassaName("");
      setNewKassaIsActive(true);
      fetchKassasAndProductsForFilters(false);
    } catch (err: any) {
      const errMsg =
        err.response?.data?.name?.[0] ||
        err.response?.data?.detail ||
        err.message ||
        "Kassa qo'shishda xatolik.";
      toast.error(errMsg);
    } finally {
      setIsSubmittingKassa(false);
    }
  };

  const handleAddStock = async () => {
    if (!selectedProductIdForStock) {
      toast.error("Mahsulot tanlanishi shart.");
      return;
    }
    if (!selectedKassaIdForStock) {
      toast.error("Kassa tanlanishi shart.");
      return;
    }
    const quantityNum = parseInt(stockQuantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast.error("Miqdor musbat son bo'lishi kerak.");
      return;
    }
    const minLevelNum = stockMinLevel ? parseInt(stockMinLevel) : undefined;
    if (stockMinLevel && (isNaN(minLevelNum) || minLevelNum < 0)) {
      toast.error(
        "Minimal qoldiq noto'g'ri kiritilgan (0 yoki undan katta bo'lishi kerak).",
      );
      return;
    }

    setIsSubmittingStock(true);
    try {
      const headers = getAuthHeaders();
      const payload: any = {
        product_id: parseInt(selectedProductIdForStock),
        kassa_id: parseInt(selectedKassaIdForStock),
        quantity: quantityNum,
      };
      if (minLevelNum !== undefined) {
        payload.minimum_stock_level = minLevelNum;
      }

      await axios.post(API_URL_INVENTORY_ADD, payload, { headers });
      toast.success(`Omborga mahsulot muvaffaqiyatli qo'shildi.`);
      setIsAddStockModalOpen(false);
      setSelectedProductIdForStock("");
      setSelectedKassaIdForStock("");
      setStockQuantity("");
      setStockMinLevel("");
      fetchProductStocks(currentPage);
    } catch (err: any) {
      console.error("Omborga qo'shish xatosi raw:", err);
      let errMsg = "Omborga mahsulot qo'shishda xatolik yuz berdi. ";
      if (err.response) {
        if (err.response.data && typeof err.response.data === "object") {
          const errors = err.response.data;
          Object.keys(errors).forEach((key) => {
            const errorValue = errors[key];
            if (Array.isArray(errorValue)) {
              errMsg += `${key}: ${errorValue.join(", ")}. `;
            } else {
              errMsg += `${key}: ${errorValue}. `;
            }
          });
          if (errors.detail && Object.keys(errors).length === 1) {
            errMsg = errors.detail;
          }
        } else if (
          typeof err.response.data === "string" &&
          err.response.headers["content-type"]?.includes("text/html")
        ) {
          errMsg =
            "Backendda kutilmagan xatolik yuz berdi. Konsolni tekshiring.";
          console.error("Backend HTML xato qaytardi:", err.response.data);
        } else if (typeof err.response.data === "string") {
          errMsg = err.response.data;
        } else {
          errMsg += `Server xatosi: ${err.response.status} ${err.response.statusText}`;
        }
      } else if (err.request) {
        errMsg = "Serverdan javob olinmadi. Internet aloqasini tekshiring.";
      } else {
        errMsg = err.message || "Noma'lum xatolik yuz berdi.";
      }
      toast.error(errMsg, { duration: 7000 });
    } finally {
      setIsSubmittingStock(false);
    }
  };

  const handleOpenDeleteDialog = (stock: ProductStock) => {
    setStockToDelete(stock);
    setDeleteQuantity("");
    setDeleteAll(false); // Default to partial delete
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!stockToDelete) return;
    setIsDeleting(true);
    try {
      const headers = getAuthHeaders();
      const apiUrl = `${API_URL_PRODUCT_STOCKS_LIST}${stockToDelete.id}/`;

      if (deleteAll) {
        // Barcha qoldiqni o'chirish
        await axios.delete(apiUrl, { headers });
        toast.success(
          `"${stockToDelete.product.name} (${stockToDelete.kassa.name})" uchun ombor yozuvi to'liq o'chirildi.`,
        );
      } else {
        // Faqat kiritilgan miqdorni o'chirish
        const quantityToDelete = parseInt(deleteQuantity);
        if (
          isNaN(quantityToDelete) ||
          quantityToDelete <= 0 ||
          quantityToDelete > stockToDelete.quantity
        ) {
          toast.error(
            `Noto'g'ri miqdor kiritildi. Miqdor 1 dan ${stockToDelete.quantity} gacha bo'lishi kerak.`,
          );
          setIsDeleting(false);
          return;
        }

        const newQuantity = stockToDelete.quantity - quantityToDelete;
        if (newQuantity === 0) {
          await axios.delete(apiUrl, { headers });
          toast.success(
            `"${stockToDelete.product.name} (${stockToDelete.kassa.name})" uchun ombor yozuvi to'liq o'chirildi.`,
          );
        } else {
          await axios.patch(
            apiUrl,
            { quantity: newQuantity },
            { headers },
          );
          toast.success(
            `"${stockToDelete.product.name} (${stockToDelete.kassa.name})" uchun ${quantityToDelete} dona qoldiq o'chirildi.`,
          );
        }
      }

      setIsDeleteDialogOpen(false);
      setStockToDelete(null);
      setDeleteQuantity("");
      setDeleteAll(false);

      const isLastItemOnPage = productStocks.length === 1 && currentPage > 1;
      const newPage = isLastItemOnPage ? currentPage - 1 : currentPage;

      if (productStocks.length === 1 && totalCount === 1) {
        setProductStocks([]);
        setTotalCount(0);
      } else {
        fetchProductStocks(newPage);
      }
    } catch (err: any) {
      let errMsg = "Ombor yozuvini o'chirishda xatolik yuz berdi.";
      if (err.response?.data) {
        if (typeof err.response.data === "string") errMsg = err.response.data;
        else if (err.response.data.detail)
          errMsg = err.response.data.detail;
        else {
          const errorDetails = Object.values(err.response.data || {})
            .flat()
            .join(" ");
          if (errorDetails) errMsg = errorDetails;
        }
      } else if (err.message) errMsg = err.message;
      toast.error(errMsg, { duration: 5000 });
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = useMemo(
    () => Math.ceil(totalCount / PAGE_SIZE),
    [totalCount, PAGE_SIZE],
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      fetchProductStocks(newPage);
    }
  };

  const handleSort = (columnKey: string) => {
    const backendColumnKey = columnKey.startsWith("product.")
      ? columnKey.replace("product.", "product__")
      : columnKey;
    const newOrdering =
      ordering === backendColumnKey ? `-${backendColumnKey}` : backendColumnKey;
    setOrdering(newOrdering);
  };

  const renderSortIndicator = (columnKey: string) => {
    const backendColumnKey = columnKey.startsWith("product.")
      ? columnKey.replace("product.", "product__")
      : columnKey;
    if (ordering.endsWith(backendColumnKey)) {
      return ordering.startsWith("-") ? (
        <ChevronDown className="inline h-4 w-4 ml-1" />
      ) : (
        <ChevronUp className="inline h-4 w-4 ml-1" />
      );
    }
    return null;
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterKassaId("");
    setFilterProductId("");
    setFilterIsLowStock("");
    setFilterQuantityGTE("");
    setOrdering("-id");
  };

  const currentRangeStart = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const currentRangeEnd = Math.min(currentPage * PAGE_SIZE, totalCount);

  return (
    <TooltipProvider>
      <div className="space-y-6 p-4 md:p-6 animate-fade-in">
        <header className="flex flex-wrap justify-between items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-800">
            Ombor Qoldiqlari
          </h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddKassaModalOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Kassa Qo'shish
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsAddStockModalOpen(true)}
            >
              <Warehouse className="mr-2 h-4 w-4" /> Omborga Mahsulot Qo'shish
            </Button>
          </div>
        </header>

        <Card className="shadow-sm border border-gray-200">
          <CardHeader className="pb-4 border-b border-gray-100">
            <CardTitle className="text-lg text-gray-700">
              Filtrlar va Qidiruv
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-5 items-end">
              <div className="relative col-span-1 sm:col-span-2 md:col-span-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  placeholder="Mahsulot, kassa, shtrix..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <Select
                value={filterKassaId}
                onValueChange={setFilterKassaId}
                disabled={isFilterDataLoading}
              >
                <SelectTrigger className="h-10 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue
                    placeholder={
                      isFilterDataLoading
                        ? "Kassalar yuklanmoqda..."
                        : "Barcha kassalar"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {kassaList.map((k) => (
                    <SelectItem key={k.id} value={String(k.id)}>
                      {k.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filterProductId}
                onValueChange={setFilterProductId}
                disabled={isFilterDataLoading}
              >
                <SelectTrigger className="h-10 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue
                    placeholder={
                      isFilterDataLoading
                        ? "Mahsulotlar yuklanmoqda..."
                        : "Barcha mahsulotlar"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {productListForFilter.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filterIsLowStock}
                onValueChange={setFilterIsLowStock}
              >
                <SelectTrigger className="h-10 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Barcha holatlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Kam qolgan</SelectItem>
                  <SelectItem value="false">Bor</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Minimal miqdor (≥)"
                value={filterQuantityGTE}
                onChange={(e) => setFilterQuantityGTE(e.target.value)}
                min="0"
                className="h-10 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex items-center gap-2 h-10 text-sm border-gray-300 hover:bg-gray-50 col-span-1 sm:col-span-full md:col-span-1 lg:col-auto"
              >
                <FilterX className="h-4 w-4 text-gray-500" /> Tozalash
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-md">
          <CardHeader className="bg-gray-50 border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <CardTitle className="text-lg text-gray-700">
                Qoldiqlar Ro'yxati
              </CardTitle>
              {!isLoading && totalCount > 0 && (
                <CardDescription className="text-xs sm:text-sm mt-0.5 text-gray-500">
                  {currentRangeStart}-{currentRangeEnd} / {totalCount} ta yozuv
                  ko'rsatilmoqda.
                </CardDescription>
              )}
              {!isLoading && totalCount === 0 && !error && (
                <CardDescription className="text-xs sm:text-sm mt-0.5 text-gray-500">
                  Hozircha yozuvlar yo'q.
                </CardDescription>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col justify-center items-center h-60 text-gray-500">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-3" />
                <p>Ma'lumotlar yuklanmoqda...</p>
              </div>
            ) : error ? (
              <div className="text-center py-10 px-4">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
                <p className="mt-4 text-red-600 font-semibold text-lg">
                  Xatolik Yuz Berdi
                </p>
                <p className="mt-1 text-gray-600 text-sm max-w-md mx-auto">
                  {error}
                </p>
                <Button
                  onClick={() => fetchProductStocks(1)}
                  variant="outline"
                  size="sm"
                  className="mt-6 border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  Qayta yuklash
                </Button>
              </div>
            ) : productStocks.length === 0 ? (
              <div className="text-center py-16 px-4">
                <PackageX className="mx-auto h-16 w-16 text-gray-400" />
                <p className="mt-5 text-lg font-medium text-gray-700">
                  {searchQuery ||
                  filterKassaId ||
                  filterProductId ||
                  filterIsLowStock ||
                  filterQuantityGTE
                    ? "Filtrlarga mos qoldiqlar topilmadi."
                    : "Omborda qoldiqlar mavjud emas."}
                </p>
                <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
                  {searchQuery ||
                  filterKassaId ||
                  filterProductId ||
                  filterIsLowStock ||
                  filterQuantityGTE
                    ? "Qidiruv parametrlarini o'zgartirib ko'ring yoki filtrlarni tozalang."
                    : "Yangi qoldiqlar omborga qo'shilganda bu yerda avtomatik paydo bo'ladi."}
                </p>
                {(searchQuery ||
                  filterKassaId ||
                  filterProductId ||
                  filterIsLowStock ||
                  filterQuantityGTE) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="mt-6"
                  >
                    <FilterX className="h-4 w-4 mr-2" /> Filtrlarni tozalash
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-full whitespace-nowrap">
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead
                        className="px-3 py-3 sm:px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("product.name")}
                      >
                        Mahsulot {renderSortIndicator("product.name")}
                      </TableHead>
                      <TableHead
                        className="px-3 py-3 sm:px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() =>
                          handleSort("product.supplier_name_manual")
                        }
                      >
                        Ta'minotchi{" "}
                        {renderSortIndicator("product.supplier_name_manual")}
                      </TableHead>
                      <TableHead
                        className="px-3 py-3 sm:px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("product.barcode")}
                      >
                        Shtrixkod {renderSortIndicator("product.barcode")}
                      </TableHead>
                      <TableHead
                        className="px-3 py-3 sm:px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("kassa__name")}
                      >
                        Kassa {renderSortIndicator("kassa__name")}
                      </TableHead>
                      <TableHead
                        className="px-3 py-3 sm:px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 text-right"
                        onClick={() => handleSort("quantity")}
                      >
                        Miqdori {renderSortIndicator("quantity")}
                      </TableHead>
                      <TableHead
                        className="px-3 py-3 sm:px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 text-right"
                        onClick={() => handleSort("product.purchase_price_usd")}
                      >
                        Olingan Narx{" "}
                        {renderSortIndicator("product.purchase_price_usd")}
                      </TableHead>
                      <TableHead
                        className="px-3 py-3 sm:px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 text-right"
                        onClick={() => handleSort("product.price_usd")}
                      >
                        Sotuv Narxi {renderSortIndicator("product.price_usd")}
                      </TableHead>
                      <TableHead
                        className="px-3 py-3 sm:px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("product.created_at")}
                      >
                        Qo'shilgan Sana{" "}
                        {renderSortIndicator("product.created_at")}
                      </TableHead>
                      <TableHead
                        className="px-3 py-3 sm:px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 text-center"
                        onClick={() => handleSort("is_low_stock")}
                      >
                        Holati {renderSortIndicator("is_low_stock")}
                      </TableHead>
                      <TableHead className="px-3 py-3 sm:px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">
                        Amallar
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white divide-y divide-gray-200">
                    {productStocks.map((stock) => {
                      const purchasePriceUSDFormatted = formatCurrency(
                        stock.product.purchase_price_usd,
                        "USD",
                      );
                      const purchasePriceUZSFormatted = formatCurrency(
                        stock.product.purchase_price_uzs,
                        "UZS",
                      );

                      const salePriceUSDFormatted = formatCurrency(
                        stock.product.price_usd,
                        "USD",
                      );
                      const salePriceUZSFormatted = formatCurrency(
                        stock.product.price_uzs,
                        "UZS",
                      );

                      return (
                        <TableRow
                          key={stock.id}
                          className="hover:bg-gray-50/50 transition-colors duration-150"
                        >
                          <TableCell
                            className="px-3 py-3 sm:px-4 text-sm font-medium text-gray-800 max-w-xs truncate"
                            title={stock.product.name}
                          >
                            {stock.product.name}
                          </TableCell>
                          <TableCell
                            className="px-3 py-3 sm:px-4 text-sm text-gray-600"
                            title={`${
                              stock.product.supplier_name_manual || ""
                            } ${stock.product.supplier_phone_manual || ""}`.trim() || "-"}
                          >
                            {stock.product.supplier_name_manual || "-"}
                            {stock.product.supplier_phone_manual && (
                              <span className="block text-xs text-gray-500">
                                {stock.product.supplier_phone_manual}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="px-3 py-3 sm:px-4 text-sm text-gray-600">
                            {stock.product.barcode || "-"}
                          </TableCell>
                          <TableCell className="px-3 py-3 sm:px-4 text-sm text-gray-600">
                            {stock.kassa.name}
                          </TableCell>
                          <TableCell className="px-3 py-3 sm:px-4 text-sm text-gray-600 text-right">
                            {stock.quantity}
                          </TableCell>
                          <TableCell className="px-3 py-3 sm:px-4 text-sm text-gray-600 text-right">
                            {purchasePriceUSDFormatted && (
                              <div className="leading-tight">
                                {purchasePriceUSDFormatted}
                              </div>
                            )}
                            {purchasePriceUZSFormatted && (
                              <div
                                className={`leading-tight ${
                                  purchasePriceUSDFormatted
                                    ? "text-xs text-gray-500"
                                    : ""
                                }`}
                              >
                                {purchasePriceUZSFormatted}
                              </div>
                            )}
                            {!purchasePriceUSDFormatted &&
                              !purchasePriceUZSFormatted &&
                              "-"}
                          </TableCell>
                          <TableCell className="px-3 py-3 sm:px-4 text-sm text-gray-600 text-right">
                            {salePriceUSDFormatted && (
                              <div className="leading-tight">
                                {salePriceUSDFormatted}
                              </div>
                            )}
                            {salePriceUZSFormatted && (
                              <div
                                className={`leading-tight ${
                                  salePriceUSDFormatted
                                    ? "text-xs text-gray-500"
                                    : ""
                                }`}
                              >
                                {salePriceUZSFormatted}
                              </div>
                            )}
                            {!salePriceUSDFormatted &&
                              !salePriceUZSFormatted &&
                              "-"}
                          </TableCell>
                          <TableCell className="px-3 py-3 sm:px-4 text-sm text-gray-600">
                            {formatDate(stock.product.created_at)}
                          </TableCell>
                          <TableCell
                            className={`px-3 py-3 sm:px-4 text-sm font-semibold text-center ${
                              stock.is_low_stock
                                ? "text-orange-600"
                                : "text-green-600"
                            }`}
                          >
                            {stock.is_low_stock ? "Kam qolgan" : "Bor"}
                          </TableCell>
                          <TableCell className="px-3 py-3 sm:px-4 text-right">
                            <Tooltip delayDuration={100}>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenDeleteDialog(stock)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-100 h-8 w-8 rounded-full"
                                  aria-label="O'chirish"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent
                                side="left"
                                className="bg-gray-800 text-white text-xs p-2 rounded shadow-lg"
                              >
                                <p>Yozuvni o'chirish</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          {totalPages > 1 &&
            !isLoading &&
            !error &&
            productStocks.length > 0 && (
              <CardFooter className="flex items-center justify-center sm:justify-end space-x-2 p-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 px-3 text-xs"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Oldingi
                </Button>
                <span className="text-sm text-gray-600">
                  Sahifa {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 px-3 text-xs"
                >
                  Keyingi <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardFooter>
            )}
        </Card>

        {/* Kassa Qo'shish Modali */}
        <Dialog
          open={isAddKassaModalOpen}
          onOpenChange={(isOpen) => {
            if (!isSubmittingKassa) setIsAddKassaModalOpen(isOpen);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl text-gray-800">
                Yangi Kassa Qo'shish
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-gray-600">
                Yangi kassa nomini kiriting va uning aktivligini belgilang.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="kassaNameModal"
                  className="text-right col-span-1 text-sm"
                >
                  Nomi
                </Label>
                <Input
                  id="kassaNameModal"
                  value={newKassaName}
                  onChange={(e) => setNewKassaName(e.target.value)}
                  className="col-span-3 h-10"
                  placeholder="Masalan: Asosiy do'kon"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="kassaActiveModal"
                  className="text-right col-span-1 text-sm"
                >
                  Aktiv
                </Label>
                <div className="col-span-3 flex items-center">
                  <Checkbox
                    id="kassaActiveModal"
                    checked={newKassaIsActive}
                    onCheckedChange={(checked) =>
                      setNewKassaIsActive(Boolean(checked))
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddKassaModalOpen(false)}
                disabled={isSubmittingKassa}
              >
                Bekor qilish
              </Button>
              <Button
                onClick={handleAddKassa}
                disabled={isSubmittingKassa || !newKassaName.trim()}
              >
                {isSubmittingKassa && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Qo'shish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Omborga Mahsulot Qo'shish Modali */}
        <Dialog
          open={isAddStockModalOpen}
          onOpenChange={(isOpen) => {
            if (!isSubmittingStock) setIsAddStockModalOpen(isOpen);
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl text-gray-800">
                Omborga Mahsulot Qo'shish
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-gray-600">
                Mahsulotni, kassani tanlang va qo'shiladigan miqdorni kiriting.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-5 py-4">
              <div>
                <Label
                  htmlFor="stockProductModal"
                  className="text-sm font-medium"
                >
                  Mahsulot
                </Label>
                <Select
                  value={selectedProductIdForStock}
                  onValueChange={setSelectedProductIdForStock}
                  disabled={isFilterDataLoading}
                >
                  <SelectTrigger id="stockProductModal" className="mt-1 h-10">
                    <SelectValue
                      placeholder={
                        isFilterDataLoading
                          ? "Mahsulotlar yuklanmoqda..."
                          : "Mahsulotni tanlang"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {productListForFilter.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="stockKassaModal" className="text-sm font-medium">
                  Kassa
                </Label>
                <Select
                  value={selectedKassaIdForStock}
                  onValueChange={setSelectedKassaIdForStock}
                  disabled={isFilterDataLoading}
                >
                  <SelectTrigger id="stockKassaModal" className="mt-1 h-10">
                    <SelectValue
                      placeholder={
                        isFilterDataLoading
                          ? "Kassalar yuklanmoqda..."
                          : "Kassani tanlang"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {kassaList
                      .filter((k) => k.is_active !== false)
                      .map((k) => (
                        <SelectItem key={k.id} value={String(k.id)}>
                          {k.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label
                  htmlFor="stockQuantityModal"
                  className="text-sm font-medium"
                >
                  Miqdori
                </Label>
                <Input
                  id="stockQuantityModal"
                  type="number"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  placeholder="Masalan: 10"
                  min="1"
                  className="mt-1 h-10"
                />
              </div>
              {/* <div>
                <Label
                  htmlFor="stockMinLevelModal"
                  className="text-sm font-medium"
                >
                  Minimal Qoldiq (ixtiyoriy)
                </Label>
                <Input
                  id="stockMinLevelModal"
                  type="number"
                  value={stockMinLevel}
                  onChange={(e) => setStockMinLevel(e.target.value)}
                  placeholder="Masalan: 2 (0 yoki undan katta)"
                  min="0"
                  className="mt-1 h-10"
                />
              </div> */}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddStockModalOpen(false)}
                disabled={isSubmittingStock}
              >
                Bekor qilish
              </Button>
              <Button
                onClick={handleAddStock}
                disabled={
                  isSubmittingStock ||
                  !selectedProductIdForStock ||
                  !selectedKassaIdForStock ||
                  !stockQuantity.trim() ||
                  parseInt(stockQuantity) <= 0
                }
              >
                {isSubmittingStock && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Omborga Qo'shish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* O'chirish Modali */}
        <Dialog
          open={isDeleteDialogOpen}
          onOpenChange={(isOpen) => {
            if (!isDeleting) setIsDeleteDialogOpen(isOpen);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl text-gray-800">
                Qoldiqni O'chirish
              </DialogTitle>
              {stockToDelete && (
                <DialogDescription className="mt-2 text-sm text-gray-600">
                  <strong className="text-gray-800">
                    {stockToDelete.product.name}
                  </strong>{" "}
                  (
                  <strong className="text-gray-800">
                    {stockToDelete.kassa.name}
                  </strong>{" "}
                  kassasida, jami qoldiq:{" "}
                  <strong className="text-gray-800">
                    {stockToDelete.quantity}
                  </strong>
                  ) uchun qoldiqni o'chirmoqchimisiz?
                </DialogDescription>
              )}
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="deleteQuantity"
                  className="text-right col-span-1 text-sm"
                >
                  Miqdor
                </Label>
                <Input
                  id="deleteQuantity"
                  type="number"
                  value={deleteQuantity}
                  onChange={(e) => setDeleteQuantity(e.target.value)}
                  placeholder="O'chiriladigan miqdor"
                  min="1"
                  max={stockToDelete?.quantity}
                  disabled={deleteAll}
                  className="col-span-3 h-10"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="deleteAll"
                  className="text-right col-span-1 text-sm"
                >
                  Hammasi
                </Label>
                <div className="col-span-3 flex items-center">
                  <Checkbox
                    id="deleteAll"
                    checked={deleteAll}
                    onCheckedChange={(checked) => {
                      setDeleteAll(Boolean(checked));
                      if (checked) setDeleteQuantity("");
                    }}
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Barcha qoldiqni o'chirish
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-md text-xs text-yellow-700 flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 shrink-0 text-yellow-600" />
              <span className="leading-relaxed">
                Agar "Hammasi" belgilansa, qoldiq to'liq o'chiriladi. Aks holda,
                kiritilgan miqdor qoldiqdan ayiriladi.
              </span>
            </div>
            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
                className="text-sm"
              >
                Bekor qilish
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={
                  isDeleting ||
                  (!deleteAll &&
                    (!deleteQuantity ||
                      parseInt(deleteQuantity) <= 0 ||
                      parseInt(deleteQuantity) > (stockToDelete?.quantity || 0)))
                }
                className="text-sm bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    O'chirilmoqda...
                  </>
                ) : (
                  "O'chirish"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}