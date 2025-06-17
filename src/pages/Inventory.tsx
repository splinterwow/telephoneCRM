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
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const API_URL_PRODUCT_STOCKS = "https://smartphone777.pythonanywhere.com/api/inventory/product-stocks/";
const API_URL_KASSAS = "https://smartphone777.pythonanywhere.com/api/kassa/";
const API_URL_PRODUCTS = "https://smartphone777.pythonanywhere.com/api/products/";

interface Product {
  id: number;
  name: string;
  barcode?: string | null;
}

interface Kassa {
  id: number;
  name: string;
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
  isAdmin: boolean; // <<<--- AMALLAR USTUNI UCHUN MUHIM PROP
}

const ALL_KASSAS_VALUE = "___ALL_KASSAS___";
const ALL_PRODUCTS_VALUE = "___ALL_PRODUCTS___";
const ALL_STATUSES_VALUE = "___ALL_STATUSES___";

interface EditFormData {
    quantity: string;
    minimum_stock_level: string;
}

export default function ProductStockManagement({ isAdmin }: ProductStockManagementProps) {
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

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [stockToEdit, setStockToEdit] = useState<ProductStock | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({ quantity: "", minimum_stock_level: "" });
  const [isSaving, setIsSaving] = useState(false);

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

  const fetchKassasAndProductsForFilters = useCallback(async () => {
    setIsFilterDataLoading(true);
    try {
      const headers = getAuthHeaders();
      const [kassaRes, productRes] = await Promise.all([
        axios.get<PaginatedResponse<Kassa> | Kassa[]>(API_URL_KASSAS, { headers, params: { page_size: 1000 } }),
        axios.get<PaginatedResponse<Product> | Product[]>(API_URL_PRODUCTS, { headers, params: { page_size: 1000, is_active: true } })
      ]);

      setKassaList("results" in kassaRes.data ? kassaRes.data.results : kassaRes.data);
      setProductListForFilter("results" in productRes.data ? productRes.data.results : productRes.data);

    } catch (err) {
      console.error("Filtrlar uchun ma'lumotlarni yuklashda xato:", err);
    } finally {
      setIsFilterDataLoading(false);
    }
  }, [getAuthHeaders]);

  const fetchProductStocks = useCallback(async (page = 1, signal?: AbortSignal) => {
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
      if (filterQuantityGTE && !isNaN(parseInt(filterQuantityGTE)) && parseInt(filterQuantityGTE) >= 0) {
        params.quantity__gte = filterQuantityGTE;
      }

      const response = await axios.get<PaginatedResponse<ProductStock>>(API_URL_PRODUCT_STOCKS, { headers, params, signal });
      setProductStocks(response.data.results);
      setTotalCount(response.data.count);
      setCurrentPage(page);

    } catch (err: any) {
      if (axios.isCancel(err)) {
        return;
      }
      if (err.response?.status === 401) {
        setError("Sessiya muddati tugagan yoki ruxsat yo'q. Iltimos, qayta tizimga kiring.");
      } else {
        const errMsg = err.response?.data?.detail || err.message || "Ombor qoldiqlarini yuklashda noma'lum xatolik.";
        setError(`Xatolik: ${errMsg}`);
      }
      setProductStocks([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders, searchQuery, filterKassaId, filterProductId, filterIsLowStock, filterQuantityGTE, ordering, PAGE_SIZE]);

  useEffect(() => {
    fetchKassasAndProductsForFilters();
  }, [fetchKassasAndProductsForFilters]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchProductStocks(1, abortController.signal);
    return () => {
      abortController.abort();
    };
  }, [searchQuery, filterKassaId, filterProductId, filterIsLowStock, filterQuantityGTE, ordering, fetchProductStocks]);


  const totalPages = useMemo(() => Math.ceil(totalCount / PAGE_SIZE), [totalCount, PAGE_SIZE]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      fetchProductStocks(newPage);
    }
  };

  const handleOpenDeleteDialog = (stock: ProductStock) => {
    setStockToDelete(stock);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!stockToDelete) return;
    setIsDeleting(true);
    try {
      const headers = getAuthHeaders();
      await axios.delete(`${API_URL_PRODUCT_STOCKS}${stockToDelete.id}/`, { headers });

      toast.success(
        `"${stockToDelete.product.name}" (${stockToDelete.kassa.name}) uchun ombor yozuvi muvaffaqiyatli o'chirildi.`
      );
      setIsDeleteDialogOpen(false);
      setStockToDelete(null);

      const newPage = (productStocks.length === 1 && totalCount > 1 && currentPage > 1) ? currentPage - 1 : currentPage;
      if (productStocks.length === 1 && totalCount === 1) {
          setProductStocks([]);
          setTotalCount(0);
      } else {
          fetchProductStocks(newPage);
      }

    } catch (err: any) {
      let errMsg = "Ombor yozuvini o'chirishda xatolik yuz berdi.";
      if (err.response?.data) {
        if (typeof err.response.data === 'string') errMsg = err.response.data;
        else if (err.response.data.detail) errMsg = err.response.data.detail;
        else if (Array.isArray(err.response.data) && err.response.data.length > 0 && typeof err.response.data[0] === 'string') errMsg = err.response.data.join(' ');
        else {
            const errorDetails = Object.values(err.response.data || {}).flat().join(' ');
            if (errorDetails) errMsg = errorDetails;
        }
      } else if (err.message) errMsg = err.message;
      toast.error(errMsg, { duration: 5000 });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenEditDialog = (stock: ProductStock) => {
    setStockToEdit(stock);
    setEditFormData({
        quantity: String(stock.quantity),
        minimum_stock_level: String(stock.minimum_stock_level)
    });
    setIsEditDialogOpen(true);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditConfirm = async () => {
    if (!stockToEdit) return;

    const quantity = parseFloat(editFormData.quantity);
    const minimum_stock_level = parseFloat(editFormData.minimum_stock_level);

    if (isNaN(quantity) || quantity < 0) {
        toast.error("Miqdor to'g'ri son bo'lishi kerak va 0 dan kichik bo'lmasligi kerak.");
        return;
    }
    if (isNaN(minimum_stock_level) || minimum_stock_level < 0) {
        toast.error("Minimal qoldiq to'g'ri son bo'lishi kerak va 0 dan kichik bo'lmasligi kerak.");
        return;
    }

    setIsSaving(true);
    try {
        const headers = getAuthHeaders();
        const payload = {
            quantity: quantity,
            minimum_stock_level: minimum_stock_level,
        };
        await axios.patch(`${API_URL_PRODUCT_STOCKS}${stockToEdit.id}/`, payload, { headers });
        toast.success(`"${stockToEdit.product.name}" (${stockToEdit.kassa.name}) uchun ombor yozuvi muvaffaqiyatli tahrirlandi.`);
        setIsEditDialogOpen(false);
        setStockToEdit(null);
        fetchProductStocks(currentPage);
    } catch (err: any) {
        let errMsg = "Ombor yozuvini tahrirlashda xatolik yuz berdi.";
        if (err.response?.data) {
            if (typeof err.response.data === 'string') errMsg = err.response.data;
            else if (err.response.data.detail) errMsg = err.response.data.detail;
            else if (err.response.data.quantity) errMsg = `Miqdor: ${err.response.data.quantity.join(', ')}`;
            else if (err.response.data.minimum_stock_level) errMsg = `Minimal qoldiq: ${err.response.data.minimum_stock_level.join(', ')}`;
            else {
                const errorDetails = Object.values(err.response.data || {}).flat().join(' ');
                if (errorDetails) errMsg = errorDetails;
            }
        } else if (err.message) errMsg = err.message;
        toast.error(errMsg, { duration: 5000 });
    } finally {
        setIsSaving(false);
    }
  };


  const handleSort = (columnKey: string) => {
    const newOrdering = ordering === columnKey ? `-${columnKey}` : columnKey;
    setOrdering(newOrdering);
  };

  const renderSortIndicator = (columnKey: string) => {
    if (ordering.endsWith(columnKey)) {
      return ordering.startsWith('-') ? <ChevronDown className="inline h-4 w-4 ml-1" /> : <ChevronUp className="inline h-4 w-4 ml-1" />;
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
    if (currentPage !== 1) setCurrentPage(1);
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
      </header>

      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="pb-4 border-b border-gray-100">
          <CardTitle className="text-lg text-gray-700">Filtrlar va Qidiruv</CardTitle>
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
              value={filterKassaId === "" ? ALL_KASSAS_VALUE : filterKassaId}
              onValueChange={(value) => {
                setFilterKassaId(value === ALL_KASSAS_VALUE ? "" : value);
              }}
              disabled={isFilterDataLoading}
            >
              <SelectTrigger className="h-10 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder={isFilterDataLoading ? "Kassalar yuklanmoqda..." : "Kassani tanlang"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_KASSAS_VALUE}>Barcha kassalar</SelectItem>
                {kassaList.map(k => <SelectItem key={k.id} value={String(k.id)}>{k.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select
              value={filterProductId === "" ? ALL_PRODUCTS_VALUE : filterProductId}
              onValueChange={(value) => {
                setFilterProductId(value === ALL_PRODUCTS_VALUE ? "" : value);
              }}
              disabled={isFilterDataLoading}
            >
              <SelectTrigger className="h-10 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder={isFilterDataLoading ? "Mahsulotlar yuklanmoqda..." : "Mahsulotni tanlang"} />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                 <SelectItem value={ALL_PRODUCTS_VALUE}>Barcha mahsulotlar</SelectItem>
                {productListForFilter.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select
              value={filterIsLowStock === "" ? ALL_STATUSES_VALUE : filterIsLowStock}
              onValueChange={(value) => {
                setFilterIsLowStock(value === ALL_STATUSES_VALUE ? "" : value);
              }}
            >
              <SelectTrigger className="h-10 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Holati bo'yicha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STATUSES_VALUE}>Barcha holatlar</SelectItem>
                <SelectItem value="true">Kam qolgan</SelectItem>
                <SelectItem value="false">Yetarli</SelectItem>
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
             <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2 h-10 text-sm border-gray-300 hover:bg-gray-50 col-span-1 sm:col-span-full md:col-span-1 lg:col-auto">
                <FilterX className="h-4 w-4 text-gray-500" /> Tozalash
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200 shadow-md">
        <CardHeader className="bg-gray-50 border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <CardTitle className="text-lg text-gray-700">Qoldiqlar Ro'yxati</CardTitle>
            {!isLoading && totalCount > 0 && (
                <CardDescription className="text-xs sm:text-sm mt-0.5 text-gray-500">
                    {currentRangeStart}-{currentRangeEnd} / {totalCount} ta yozuv ko'rsatilmoqda.
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
              <p className="mt-4 text-red-600 font-semibold text-lg">Xatolik Yuz Berdi</p>
              <p className="mt-1 text-gray-600 text-sm max-w-md mx-auto">{error}</p>
              <Button onClick={() => fetchProductStocks(1)} variant="outline" size="sm" className="mt-6 border-blue-500 text-blue-600 hover:bg-blue-50">
                Qayta yuklash
              </Button>
            </div>
          ) : productStocks.length === 0 ? (
            <div className="text-center py-16 px-4">
                <PackageX className="mx-auto h-16 w-16 text-gray-400" />
                <p className="mt-5 text-lg font-medium text-gray-700">
                    {searchQuery || filterKassaId || filterProductId || filterIsLowStock || filterQuantityGTE
                    ? "Filtrlarga mos qoldiqlar topilmadi."
                    : "Omborda qoldiqlar mavjud emas."}
                </p>
                 <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
                    {searchQuery || filterKassaId || filterProductId || filterIsLowStock || filterQuantityGTE
                    ? "Qidiruv parametrlarini o'zgartirib ko'ring yoki filtrlarni tozalang."
                    : "Yangi qoldiqlar omborga qo'shilganda bu yerda avtomatik paydo bo'ladi."}
                </p>
                {(searchQuery || filterKassaId || filterProductId || filterIsLowStock || filterQuantityGTE) && (
                     <Button variant="outline" size="sm" onClick={clearFilters} className="mt-6">
                        <FilterX className="h-4 w-4 mr-2"/> Filtrlarni tozalash
                    </Button>
                )}
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="px-3 py-3 sm:px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap" onClick={() => handleSort('product__name')}>
                    Mahsulot {renderSortIndicator('product__name')}
                  </TableHead>
                  <TableHead className="hidden sm:table-cell px-3 py-3 sm:px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap" onClick={() => handleSort('product__barcode')}>
                    Shtrixkod {renderSortIndicator('product__barcode')}
                  </TableHead>
                  <TableHead className="px-3 py-3 sm:px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap" onClick={() => handleSort('kassa__name')}>
                    Kassa {renderSortIndicator('kassa__name')}
                  </TableHead>
                  <TableHead className="px-3 py-3 sm:px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap text-right" onClick={() => handleSort('quantity')}>
                    Miqdori {renderSortIndicator('quantity')}
                  </TableHead>
                  <TableHead className="hidden md:table-cell px-3 py-3 sm:px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap text-center" onClick={() => handleSort('is_low_stock')}>
                    Holati {renderSortIndicator('is_low_stock')}
                  </TableHead>
                  {/* <<<--- AMALLAR USTUNI BOSHLANISHI --- */ }
                  {isAdmin && <TableHead className="px-3 py-3 sm:px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right whitespace-nowrap">Amallar</TableHead>}
                  {/* --- AMALLAR USTUNI TUGASHI --- >>> */ }
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white divide-y divide-gray-200">
                {productStocks.map((stock) => (
                  <TableRow key={stock.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                    <TableCell className="px-3 py-3 sm:px-4 text-sm font-medium text-gray-800 break-all max-w-xs">{stock.product.name}</TableCell>
                    <TableCell className="hidden sm:table-cell px-3 py-3 sm:px-4 text-sm text-gray-600">{stock.product.barcode || "-"}</TableCell>
                    <TableCell className="px-3 py-3 sm:px-4 text-sm text-gray-600">{stock.kassa.name}</TableCell>
                    <TableCell className="px-3 py-3 sm:px-4 text-sm text-gray-600 text-right">{stock.quantity}</TableCell>
                    <TableCell className={`hidden md:table-cell px-3 py-3 sm:px-4 text-sm font-semibold text-center ${stock.is_low_stock ? "text-orange-600" : "text-green-600"}`}>
                      {stock.is_low_stock ? "Kam qolgan" : "Yetarli"}
                    </TableCell>
                    {/* <<<--- AMALLAR TUGMALARI BOSHLANISHI --- */ }
                    {isAdmin && (
                      <TableCell className="px-3 py-3 sm:px-4 text-right">
                        <div className="flex justify-end space-x-1">
                            <Tooltip delayDuration={100}>
                                <TooltipTrigger asChild>
                                    <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenEditDialog(stock)}
                                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-100 h-8 w-8 rounded-full"
                                    aria-label="Tahrirlash"
                                    >
                                    <Pencil className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="bg-gray-800 text-white text-xs p-2 rounded shadow-lg">
                                    <p>Yozuvni tahrirlash</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip delayDuration={100}>
                                <TooltipTrigger asChild>
                                    <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenDeleteDialog(stock)} // O'CHIRISH UCHUN MANA SHU FUNKSIYA
                                    className="text-red-500 hover:text-red-700 hover:bg-red-100 h-8 w-8 rounded-full"
                                    aria-label="O'chirish"
                                    >
                                    <Trash2 className="h-4 w-4" /> {/* O'CHIRISH IKONKASI */}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs bg-gray-800 text-white text-xs p-2 rounded shadow-lg">
                                    <p className="font-semibold">Yozuvni o'chirish</p>
                                    <p className="mt-1">
                                        Faqat xato kiritilgan yoki faqat "Boshlang'ich qoldiq" operatsiyalari mavjud yozuvlar uchun.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                      </TableCell>
                    )}
                    {/* --- AMALLAR TUGMALARI TUGASHI --- >>> */ }
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
        {totalPages > 1 && !isLoading && productStocks.length > 0 && (
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
                <span className="text-sm text-gray-600">Sahifa {currentPage} / {totalPages}</span>
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

      {/* <<<--- O'CHIRISH UCHUN MODAL (DIALOG) BOSHLANISHI --- */ }
      <Dialog open={isDeleteDialogOpen} onOpenChange={(isOpen) => { if (!isDeleting) setIsDeleteDialogOpen(isOpen); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-800">O'chirishni tasdiqlang</DialogTitle>
            {stockToDelete && (
              <DialogDescription className="mt-2 text-sm text-gray-600">
                Haqiqatan ham <strong className="text-gray-800">{stockToDelete.product.name}</strong> (<strong className="text-gray-800">{stockToDelete.kassa.name}</strong> kassasida, qoldiq: <strong className="text-gray-800">{stockToDelete.quantity}</strong>)
                uchun ombor yozuvini o'chirmoqchimisiz?
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-md text-xs text-yellow-700 flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 shrink-0 text-yellow-600" />
            <span className="leading-relaxed">
            Bu amal faqat tizimga xato kiritilgan va boshqa operatsiyalar bilan "ifloslanmagan" qoldiqlar uchun mo'ljallangan.
            Agar qoldiq > 0 bo'lsa va faqat "Boshlang'ich qoldiq" operatsiyalari mavjud bo'lsa, ular bekor qilinib, yozuv o'chiriladi.
            Aks holda (boshqa operatsiyalar bo'lsa), o'chirishga ruxsat berilmaydi va xatolik xabari chiqadi.
            </span>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting} className="text-sm">
                Bekor qilish
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting} className="text-sm bg-red-600 hover:bg-red-700">
              {isDeleting ? (
                <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> O'chirilmoqda... </>
              ) : ( "Ha, o'chirish" )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* --- O'CHIRISH UCHUN MODAL (DIALOG) TUGASHI --- >>> */ }


      <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => { if (!isSaving) setIsEditDialogOpen(isOpen); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-800">Qoldiqni Tahrirlash</DialogTitle>
            {stockToEdit && (
              <DialogDescription className="mt-2 text-sm text-gray-600">
                Mahsulot: <strong className="text-gray-800">{stockToEdit.product.name}</strong>, Kassa: <strong className="text-gray-800">{stockToEdit.kassa.name}</strong>
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">Miqdori</label>
                <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    value={editFormData.quantity}
                    onChange={handleEditFormChange}
                    className="h-10 text-sm"
                    min="0"
                />
            </div>
            <div>
                <label htmlFor="minimum_stock_level" className="block text-sm font-medium text-gray-700 mb-1">Minimal Qoldiq Darajasi</label>
                <Input
                    id="minimum_stock_level"
                    name="minimum_stock_level"
                    type="number"
                    value={editFormData.minimum_stock_level}
                    onChange={handleEditFormChange}
                    className="h-10 text-sm"
                    min="0"
                />
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving} className="text-sm">
                Bekor qilish
            </Button>
            <Button onClick={handleEditConfirm} disabled={isSaving} className="text-sm">
              {isSaving ? (
                <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saqlanmoqda... </>
              ) : ( "Saqlash" )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
    </TooltipProvider>
  );
}