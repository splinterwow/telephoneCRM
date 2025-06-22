import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Search,
  Pencil,
  Trash2,
  Loader2,
  Smartphone,
  Headphones,
  PackageSearch,
  Printer,
  FolderPlus,
  Info,
} from "lucide-react";
import {
  Dialog as ShadDialog,
  DialogContent as ShadDialogContent,
  DialogDescription as ShadDialogDescription,
  DialogFooter as ShadDialogFooter,
  DialogHeader as ShadDialogHeader,
  DialogTitle as ShadDialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { AddProductDialog, DialogView as AddDialogView } from "@/components/Products/AddProductDialog";
import { EditProductDialog } from "@/components/Products/EditProductDialog";
// import { cn } from "@/lib/utils"; // Agar kerak bo'lmasa

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import JsBarcode from "jsbarcode";

const API_URL_PRODUCTS_LISTING =
  "https://smartphone777.pythonanywhere.com/api/products/";
const API_URL_CATEGORIES =
  "https://smartphone777.pythonanywhere.com/api/categories/";
// Ombor yozuvlari uchun API URL (ProductStockManagement'dagi bilan bir xil bo'lishi kerak)
const API_URL_PRODUCT_STOCKS_LISTING =
  "https://smartphone777.pythonanywhere.com/api/inventory/product-stocks/";


interface Product {
  id: number;
  name: string;
  category: number | null;
  category_name?: string;
  barcode?: string | null;
  price_usd?: string | null;
  purchase_price_usd?: string | null;
  price_uzs?: string | null;
  purchase_price_uzs?: string | null;
  storage_capacity?: string | null;
  color?: string | null;
  series_region?: string | null;
  battery_health?: string | null;
  purchase_date?: string | null;
  is_active: boolean;
  description?: string | null;
  supplier_name_manual?: string | null;
  supplier_phone_manual?: string | null;
}

interface Category {
  id: number;
  name: string;
  description?: string;
  barcode_prefix?: string;
}

interface BarcodeDisplayProps {
    value: string;
    className?: string;
    barWidth?: number;
    barHeight?: number;
    fontSize?: number;
    textMargin?: number;
    svgMargin?: number;
    displayValue?: boolean;
}

// O'chirish uchun kerak bo'ladigan minimal ProductStock interfeysi
interface MinimalProductStock {
  id: number;
  // Boshqa maydonlar shart emas, chunki faqat ID orqali o'chiramiz
}

// ProductStock ro'yxatini olganda paginatsiyalangan javob uchun interfeys
interface PaginatedMinimalProductStockResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: MinimalProductStock[];
}

const BarcodeDisplay: React.FC<BarcodeDisplayProps> = ({
  value,
  className,
  barWidth = 1.2,
  barHeight = 25,
  fontSize = 12,
  textMargin = 1,
  svgMargin = 0,
  displayValue = false,
}) => {
  const barcodeRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (barcodeRef.current && value) {
      try {
        JsBarcode(barcodeRef.current, value, {
          format: "CODE128",
          lineColor: "#000000",
          width: barWidth,
          height: barHeight,
          displayValue: displayValue,
          text: displayValue ? value : undefined,
          fontSize: fontSize,
          textMargin: textMargin,
          margin: svgMargin,
          font: "Arial",
          textAlign: "center",
        });
      } catch (e) {
        console.error("JsBarcode xatosi: ", e);
        if (barcodeRef.current) {
          barcodeRef.current.innerHTML = `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="${fontSize}" fill="red">Xato</text>`;
        }
      }
    }
  }, [value, barWidth, barHeight, fontSize, textMargin, svgMargin, displayValue]);
  return <svg ref={barcodeRef} className={className}></svg>;
};


export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({ name: "", description: "", barcode_prefix: "" });
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [addDialogInitialView, setAddDialogInitialView] = useState<AddDialogView>("phone");

  const [selectedProductForEdit, setSelectedProductForEdit] =
    useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false); // Yangi state arxivlash jarayoni uchun

  const [eligibleProductsForPrint, setEligibleProductsForPrint] = useState<Product[]>([]);
  const [selectedProductsToPrint, setSelectedProductsToPrint] = useState<Record<number, boolean>>({});
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printingProductId, setPrintingProductId] = useState<number | null>(null);

  const navigate = useNavigate();

  const formatPriceForTable = useCallback(
    (price: string | null | undefined, currency: "$" | "so'm" = "$"): string => {
      if (price === null || price === undefined || price === "") return "-";
      const numericPrice = parseFloat(price);
      if (isNaN(numericPrice)) return "N/A";
      let options: Intl.NumberFormatOptions = {};
      if (currency === "$") {
        options = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
        if (numericPrice % 1 === 0) options = { maximumFractionDigits: 0 };
      } else {
        options = { maximumFractionDigits: 0 };
      }
      const formatted = numericPrice.toLocaleString(currency === "$" ? "en-US" : "uz-UZ", options);
      return currency === "$" ? `$${formatted}` : `${formatted} so'm`;
    },[]
  );

  const formatCombinedPrice = useCallback(
    (priceUsdStr: string | null | undefined, priceUzsStr: string | null | undefined, forPrintLabel: boolean = false): string => {
      const usdValid = priceUsdStr && !isNaN(parseFloat(priceUsdStr)) && parseFloat(priceUsdStr) >= 0;
      const uzsValid = priceUzsStr && !isNaN(parseFloat(priceUzsStr)) && parseFloat(priceUzsStr) >= 0;
      const usdFormatted = usdValid ? formatPriceForTable(priceUsdStr, "$") : null;
      const uzsFormatted = uzsValid ? formatPriceForTable(priceUzsStr, "so'm") : null;
      if (usdFormatted && uzsFormatted) return forPrintLabel ? `${uzsFormatted} / ${usdFormatted}` : `${usdFormatted} / ${uzsFormatted}`;
      if (uzsFormatted) return uzsFormatted;
      if (usdFormatted) return usdFormatted;
      return "-";
    },[formatPriceForTable]
  );

  const determineProductTypeForDisplay = useCallback((product: Product): string => {
    const categoryName = product.category_name?.toLowerCase() || "";
    const productName = product.name?.toLowerCase() || "";
    if (categoryName.includes("iphone") || productName.startsWith("iphone")) return "iPhone";
    if (categoryName.includes("android") || (categoryName.includes("phone") && !productName.startsWith("iphone")) || (categoryName.includes("telefon") && !productName.startsWith("iphone"))) return "Android";
    if (categoryName.includes("accessory") || categoryName.includes("aksesuar")) return "Aksesuar";
    return product.category_name || "Noma'lum";
  }, []);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Avtorizatsiya qilinmagan. Iltimos, tizimga kiring.");
        navigate("/login");
        setIsLoading(false);
        return;
      }
      const params = { page_size: 10000 };
      type PaginatedProductResponse = { count: number; next: string | null; previous: string | null; results: Product[]; };
      const response = await axios.get<PaginatedProductResponse | Product[]>(API_URL_PRODUCTS_LISTING, { headers: { Authorization: `Bearer ${token}` }, timeout: 25000, params });
      let fetchedProducts: Product[] = [];
      if ("results" in response.data && Array.isArray(response.data.results)) {
        fetchedProducts = response.data.results;
      } else if (Array.isArray(response.data)) {
        fetchedProducts = response.data;
      } else {
        setError("Mahsulot ma'lumotlari noto'g'ri formatda keldi.");
        setProducts([]);
        setIsLoading(false);
        return;
      }
      setProducts(fetchedProducts.filter((p) => p.is_active === true).reverse());
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Sessiya muddati tugagan. Iltimos, qayta tizimga kiring.");
        localStorage.removeItem("accessToken");
        navigate("/login");
      } else if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
        setError("Serverga ulanishda vaqt tugadi.");
      } else {
        let errMsg = "Ma'lumotlarni yuklashda noma'lum xatolik.";
        if (err.response?.data?.detail) errMsg = err.response.data.detail;
        else if (err.message) errMsg = err.message;
        setError(`Xatolik: ${errMsg}`);
      }
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const fetchCategories = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        return;
      }
      const response = await axios.get<Category[]>(API_URL_CATEGORIES, {
        headers: { Authorization: `Bearer ${token}` }, timeout: 15000,
      });
      setCategories(response.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        toast.error("Sessiya muddati tugagan (kategoriyalar). Iltimos, qayta tizimga kiring.");
        localStorage.removeItem("accessToken");
        navigate("/login");
      } else {
        toast.error("Kategoriyalarni yuklashda xatolik.");
      }
    }
  }, [navigate]);

  const handleSaveNewCategory = async () => {
    if (!newCategoryData.name.trim()) {
        toast.error("Kategoriya nomi kiritilishi shart."); return;
    }
    setIsSubmittingCategory(true);
    try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            toast.error("Avtorizatsiya qilinmagan. Iltimos, tizimga kiring.");
            localStorage.removeItem("accessToken");
            navigate("/login");
            setIsSubmittingCategory(false); return;
        }
        await axios.post(API_URL_CATEGORIES, newCategoryData, {
            headers: { Authorization: `Bearer ${token}` }, timeout: 15000,
        });
        toast.success(`"${newCategoryData.name}" kategoriyasi qo'shildi!`);
        setIsAddCategoryModalOpen(false);
        setNewCategoryData({ name: "", description: "", barcode_prefix: "" });
        fetchCategories();
    } catch (err: any) {
        if (err.response?.status === 401) {
            toast.error("Sessiya muddati tugagan. Iltimos, qayta tizimga kiring.");
            localStorage.removeItem("accessToken");
            navigate("/login");
        } else {
            let errMsg = "Kategoriyani saqlashda xatolik.";
            if (err.response?.data?.detail) errMsg = err.response.data.detail;
            else if (err.message) errMsg = err.message;
            toast.error(`Xatolik: ${errMsg}`);
        }
    } finally {
        setIsSubmittingCategory(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const filteredProducts = useMemo(() => {
    const trimmedSearch = search.trim().toLowerCase();
    if (!trimmedSearch) return products;
    return products.filter((p) =>
        p.name?.toLowerCase().includes(trimmedSearch) ||
        p.supplier_name_manual?.toLowerCase().includes(trimmedSearch) ||
        p.barcode?.toLowerCase().includes(trimmedSearch) ||
        p.category_name?.toLowerCase().includes(trimmedSearch) ||
        p.color?.toLowerCase().includes(trimmedSearch) ||
        p.series_region?.toLowerCase().includes(trimmedSearch)
    );
  }, [products, search]);

  const handleProductAdded = (newlyAddedProduct: Product) => {
    fetchProducts();
    setIsAddProductDialogOpen(false);
    toast.success(`"${newlyAddedProduct.name}" qo'shildi!`);
  };

  const handleProductSuccessfullyEdited = (editedProduct: Product) => {
    fetchProducts();
    setIsEditDialogOpen(false);
    setSelectedProductForEdit(null);
    toast.success(`"${editedProduct.name}" tahrirlandi!`);
  };

  const handleDeleteConfirmation = async () => {
    if (!productToDelete) return;

    setIsDeletingProduct(true); // Jarayon boshlandi
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Avtorizatsiya qilinmagan. Iltimos, tizimga kiring.");
      localStorage.removeItem("accessToken");
      navigate("/login");
      setIsDeletingProduct(false); // Jarayon tugadi
      return;
    }

    try {
      // 1. Mahsulotni arxivlash (is_active = false)
      await axios.patch(
        `${API_URL_PRODUCTS_LISTING}${productToDelete.id}/`,
        { is_active: false },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 },
      );
      toast.success(`"${productToDelete.name}" mahsuloti arxivlandi.`);

      // 2. Ushbu mahsulotga tegishli ombor yozuvlarini o'chirish
      try {
        const stockResponse = await axios.get<PaginatedMinimalProductStockResponse>(
          API_URL_PRODUCT_STOCKS_LISTING,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { product: productToDelete.id, page_size: 1000 },
            timeout: 20000,
          },
        );

        const stocksToDelete = stockResponse.data.results;

        if (stocksToDelete && stocksToDelete.length > 0) {
          toast.info(
            `"${productToDelete.name}" uchun ${stocksToDelete.length} ta ombor yozuvi o'chirilmoqda...`,
            { duration: 4000 }
          );

          const deletePromises = stocksToDelete.map((stockItem) =>
            axios.delete(
              `${API_URL_PRODUCT_STOCKS_LISTING}${stockItem.id}/`,
              { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 },
            ),
          );

          const results = await Promise.allSettled(deletePromises);
          let successfullyDeletedCount = 0;
          results.forEach((result, index) => {
            if (result.status === "fulfilled") {
              successfullyDeletedCount++;
            } else {
              console.error(`Ombor yozuvi (ID: ${stocksToDelete[index].id}) o'chirishda xatolik:`, result.reason);
            }
          });

          if (successfullyDeletedCount === stocksToDelete.length) {
              toast.success(`"${productToDelete.name}" bilan bog'liq barcha ${successfullyDeletedCount} ta ombor yozuvi muvaffaqiyatli o'chirildi.`);
          } else if (successfullyDeletedCount > 0) {
              toast.warning(`${successfullyDeletedCount} ta ombor yozuvi o'chirildi, ${stocksToDelete.length - successfullyDeletedCount} tasida xatolik yuz berdi.`);
          } else if (stocksToDelete.length > 0) { // Faqat xatolik bo'lsa va o'chiriladigan yozuvlar bo'lsa
              toast.error(`"${productToDelete.name}" bilan bog'liq ombor yozuvlarini o'chirishda xatolik yuz berdi.`);
          }

        } else {
          toast.info(
            `"${productToDelete.name}" uchun omborda yozuvlar topilmadi.`, { duration: 4000 }
          );
        }
      } catch (stockError: any) {
        console.error("Ombor yozuvlarini olish yoki o'chirishda xatolik:", stockError);
        let stockErrMsg = "Mahsulot arxivlandi, lekin unga bog'liq ombor yozuvlarini o'chirishda xatolik yuz berdi.";
        if (stockError.response?.status === 401) {
          stockErrMsg = "Sessiya muddati tugagan (ombor yozuvlari). Iltimos, qayta tizimga kiring.";
          localStorage.removeItem("accessToken");
          navigate("/login");
        } else if (stockError.response?.data?.detail) {
          stockErrMsg += ` (${stockError.response.data.detail})`;
        } else if (stockError.message?.includes("timeout")) {
          stockErrMsg = "Ombor yozuvlarini o'chirishda serverga ulanish vaqti tugadi.";
        } else if (stockError.message) {
          stockErrMsg += ` (${stockError.message})`;
        }
        toast.error(stockErrMsg, { duration: 7000 });
      }

      fetchProducts();
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);

    } catch (productArchiveError: any) {
      if (productArchiveError.response?.status === 401) {
        toast.error("Sessiya muddati tugagan. Iltimos, qayta tizimga kiring.");
        localStorage.removeItem("accessToken");
        navigate("/login");
      } else {
        toast.error(
          "Mahsulotni arxivlashda xatolik: " +
            (productArchiveError.response?.data?.detail || productArchiveError.message),
        );
      }
    } finally {
        setIsDeletingProduct(false); // Jarayon tugadi
    }
  };


  const openEditDialog = (product: Product) => { setSelectedProductForEdit(product); setIsEditDialogOpen(true); };
  const openDeleteDialog = (product: Product) => { setProductToDelete(product); setIsDeleteDialogOpen(true); };

  const handleOpenPrintModal = () => {
    const itemsToPrint = filteredProducts.filter(p => p.barcode && p.barcode.trim() !== "");
    if (itemsToPrint.length === 0) { toast.info("Chop etish uchun yaroqli mahsulot topilmadi."); return; }
    setEligibleProductsForPrint(itemsToPrint);
    setSelectedProductsToPrint(itemsToPrint.reduce((acc, p) => ({ ...acc, [p.id]: false }), {}));
    setIsPrintModalOpen(true);
  };

  const printContentBulk = (items: Product[]) => {
    if (items.length === 0) { toast.info("Chop etish uchun mahsulot tanlanmagan."); return; }
    const printWindow = window.open('', '_blank', 'height=600,width=800');
    if (printWindow) {
        printWindow.document.write('<html><head><title>Shtrixkodlar</title>');
        printWindow.document.write('<style>body{font-family: Arial, sans-serif; margin: 20px;} .barcode-item { display: inline-block; text-align: center; margin: 10px; padding: 10px; border: 1px solid #ccc; page-break-inside: avoid; position: relative; } .shop-name-bulk { position: absolute; top: 3px; right: 5px; font-size: 7px; color: #888; } .barcode-item svg { display: block; margin: 0 auto 5px auto; } .product-name { font-size: 10px; margin-bottom: 3px; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;} .product-detail-bulk { font-size: 9px; margin-bottom: 2px; color: #333;} .price { font-size: 11px; font-weight: bold; } @media print { .no-print { display: none; } body { margin: 0; } }</style>');
        printWindow.document.write('</head><body>');
        items.forEach(product => {
            const productType = determineProductTypeForDisplay(product);
            let contentHtml = `<div class="shop-name-bulk">Apple777</div>`;
            contentHtml += `<div class="product-name" title="${product.name}">${product.name}</div>`;
            if (productType === "iPhone") {
                if (product.storage_capacity) contentHtml += `<div class="product-detail-bulk">Xotira: ${product.storage_capacity}</div>`;
                if (product.battery_health) contentHtml += `<div class="product-detail-bulk">Batareya: ${product.battery_health}%</div>`;
            } else if (productType === "Android") {
                if (product.storage_capacity) contentHtml += `<div class="product-detail-bulk">Xotira: ${product.storage_capacity}</div>`;
            } else { // Aksessuarlar uchun
                const priceDisplay = formatCombinedPrice(product.price_usd, product.price_uzs, true);
                if (priceDisplay !== "-") contentHtml += `<div class="price">${priceDisplay}</div>`;
            }
            const barcodeSvgId = `barcode-svg-bulk-${product.id}-${Math.random().toString(36).substring(7)}`;
            printWindow.document.write(`<div class="barcode-item">${contentHtml}<svg id="${barcodeSvgId}"></svg></div>`);
            const svgElement = printWindow.document.getElementById(barcodeSvgId);
            if (svgElement && product.barcode) {
                try { JsBarcode(svgElement, product.barcode, { format: "CODE128", lineColor: "#000000", width: 1.1, height: 22, displayValue: true, fontSize: 9, textMargin: 0, margin: 2 });
                } catch (e) { svgElement.innerHTML = `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="9" fill="red">Xato</text>`; }
            }
        });
        printWindow.document.write('</body></html>'); printWindow.document.close(); printWindow.focus();
        setTimeout(() => { try { printWindow.print(); } catch (e) { toast.error("Chop etish oynasini avtomatik ishga tushirib bo'lmadi."); } }, 500);
    } else { toast.error("Chop etish oynasini ochib bo'lmadi."); }
    setIsPrintModalOpen(false);
  };

  const printSingleProductWithApiData = async (product: Product) => {
    if (!product.barcode || product.barcode.trim() === "") {
      toast.warn("Bu mahsulot uchun shtrixkod mavjud emas.");
      return;
    }
    setPrintingProductId(product.id);

    try {
      const printWindow = window.open('', '_blank', 'height=300,width=250');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Yorliq</title>');
        printWindow.document.write(`
          <style>
            @page {
                size: 50mm 30mm; /* Yorliq o'lchami */
                margin: 0;
            }
            body {
              font-family: Arial, sans-serif; text-align: center; margin: 0;
              padding: 1.5mm; /* Ichki bo'shliqlar */
              width: calc(50mm - 3mm); /* Paddings hisobga olingan eni */
              height: calc(30mm - 3mm); /* Paddings hisobga olingan bo'yi */
              display: flex; flex-direction: column; align-items: center; justify-content: space-between;
              box-sizing: border-box; overflow: hidden;
            }
            .label-content-wrapper { /* Kontentni to'liq egallashi uchun */
                width: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-start; /* Kontent tepadan boshlansin */
                flex-grow: 1; /* Mavjud bo'sh joyni egallasin */
            }
            .header-info {
                width: 100%;
                display: flex;
                justify-content: flex-end; /* O'ng tomonga */
                align-items: flex-start; /* Tepaga */
                height: auto; /* Kontentga mos balandlik */
                margin-bottom: 0.5mm; /* Pastki bo'shliq */
            }
            .shop-name {
                font-size: 8.5px; /* Kichikroq shrift */
                font-weight: 600; /* Qalinroq */
                color: #333;
                padding-right: 0.5mm; /* O'ngdan kichik bo'shliq */
            }
            .main-product-info { /* Asosiy ma'lumotlar bloki */
                text-align: center;
                margin-bottom: 1mm; /* Shtrixkoddan oldingi bo'shliq */
            }
            svg { /* Shtrixkod */
                display: block;
                margin-left: auto;
                margin-right: auto;
                margin-bottom: 0; /* Pastki bo'shliqni minimal qilish */
            }
            .product-name-main {
              font-size: 12.5px; /* Kattaroq va qalin */
              font-weight: bold; margin-bottom: 1px; line-height: 1.1;
              max-width: 46mm; overflow: hidden; text-overflow: ellipsis; /* Sig'masa kesish */
            }
            .product-detail { /* Xotira, batareya uchun */
              font-size: 9.5px;
              margin-bottom: 1px; line-height: 1.1;
            }
            .price-accessory { /* Aksessuar narxi uchun */
              font-size: 10.5px;
              font-weight: 500; /* O'rtacha qalinlik */
              margin-bottom: 1.5px; line-height: 1.1;
            }
          </style>
        `);
        printWindow.document.write('</head><body>');
        printWindow.document.write('<div class="label-content-wrapper">'); // Wrapper ochildi

        // Do'kon nomi
        printWindow.document.write('<div class="header-info">');
        printWindow.document.write('<span class="shop-name">Apple777</span>');
        printWindow.document.write('</div>');

        // Asosiy mahsulot ma'lumotlari
        printWindow.document.write('<div class="main-product-info">');
        const productType = determineProductTypeForDisplay(product);
        printWindow.document.write(`<div class="product-name-main" title="${product.name}">${product.name}</div>`);

        if (productType === "iPhone") {
            if (product.storage_capacity) {
                printWindow.document.write(`<div class="product-detail">Xotira: ${product.storage_capacity}</div>`);
            }
            if (product.battery_health) {
                printWindow.document.write(`<div class="product-detail">Batareya holati: ${product.battery_health}%</div>`);
            }
        } else if (productType === "Android") {
            if (product.storage_capacity) {
                printWindow.document.write(`<div class="product-detail">Xotira: ${product.storage_capacity}</div>`);
            }
            // Android uchun batareya yoki boshqa ma'lumotlar qo'shilishi mumkin
        } else { // Aksessuarlar uchun
            const priceDisplay = formatCombinedPrice(product.price_usd, product.price_uzs, true); // true -> so'm birinchi
            if (priceDisplay !== "-") {
              printWindow.document.write(`<div class="price-accessory">${priceDisplay}</div>`);
            }
        }
        printWindow.document.write('</div>'); // .main-product-info yopildi

        // Shtrixkod
        const barcodeSvgContainerId = `barcode-svg-single-${product.id}`;
        printWindow.document.write(`<svg id="${barcodeSvgContainerId}"></svg>`);

        printWindow.document.write('</div>'); // .label-content-wrapper yopildi
        printWindow.document.write('</body></html>');
        printWindow.document.close();

        // Shtrixkodni generatsiya qilish
        const svgElement = printWindow.document.getElementById(barcodeSvgContainerId);
        if (svgElement && product.barcode) {
            JsBarcode(svgElement, product.barcode, {
                format: "CODE128", lineColor: "#000000",
                width: 1.3, /* Shtrixkod chiziqlari kengligi */
                height: 32, /* Shtrixkod balandligi (matn bilan birga umumiy balandlikni hisobga oling) */
                displayValue: true, /* Shtrixkod ostidagi raqamlarni ko'rsatish */
                fontSize: 10, /* Shtrixkod ostidagi raqamlar shrifti */
                textMargin: 0.5, /* Raqamlar va shtrixkod orasidagi masofa */
                margin: 2, /* SVG chetlaridagi umumiy bo'shliq */
            });
        }
        printWindow.focus();
        setTimeout(() => {
            try { printWindow.print(); }
            catch (e) { toast.error("Chop etish oynasini avtomatik ishga tushirib bo'lmadi."); }
        }, 300); // Brauzer render qilishiga vaqt berish
      } else {
        toast.error("Chop etish oynasini ochib bo'lmadi.");
      }
    } catch (error) {
      console.error("Yorliq chop etishda xatolik:", error);
      toast.error("Yorliq chop etishda xatolik yuz berdi.");
    } finally {
      setPrintingProductId(null);
    }
  };

  const handleTogglePrintSelection = (productId: number) => {
    setSelectedProductsToPrint(prev => ({ ...prev, [productId]: !prev[productId] }));
  };

  const handleSelectAllForPrint = (selectAll: boolean) => {
    setSelectedProductsToPrint(eligibleProductsForPrint.reduce((acc, p) => ({ ...acc, [p.id]: selectAll }), {}));
  };

  const getSelectedItemsForActualPrint = () => {
    return eligibleProductsForPrint.filter(p => selectedProductsToPrint[p.id]);
  };

  const formatIdentifierForDisplay = (idStr: string | null | undefined) => {
    if (!idStr) return "-";
    const ids = idStr.split(/[\s,;]+/).filter(Boolean); // Regular expression to split by space, comma, or semicolon
    if (ids.length === 0) return "-";
    if (ids.length === 1) return ids[0];

    const triggerContent = (
      <span className="cursor-help underline decoration-dotted">
        {ids[0]} ({ids.length} ta) <Info size={12} className="inline ml-1 align-middle" />
      </span>
    );

    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>{triggerContent}</TooltipTrigger>
          <TooltipContent
            className="max-w-xs break-words bg-popover text-popover-foreground shadow-md rounded-md p-2 z-50"
            side="top"
          >
            {ids.map((im, idx) => (
              <div key={idx} className="text-xs">
                {im}
              </div>
            ))}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };


  return (
    <TooltipProvider>
      <div className="flex flex-col h-full p-4 md:p-6 space-y-5 bg-muted/20">
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Mahsulotlar
          </h1>
          <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
            <Button className="flex items-center gap-2 shadow-sm" onClick={() => { setAddDialogInitialView("phone"); setIsAddProductDialogOpen(true); }}>
              <Smartphone className="h-4 w-4" /> Telefon qo‘shish
            </Button>
            <Button variant="outline" className="flex items-center gap-2 shadow-sm" onClick={() => { setAddDialogInitialView("accessory"); setIsAddProductDialogOpen(true); }}>
              <Headphones className="h-4 w-4" /> Aksesuar qo‘shish
            </Button>
            <Button variant="outline" className="flex items-center gap-2 shadow-sm" onClick={() => setIsAddCategoryModalOpen(true)} >
                <FolderPlus className="h-4 w-4" /> Kategoriya qo‘shish
            </Button>
            <Button variant="outline" className="flex items-center gap-2 shadow-sm" onClick={handleOpenPrintModal} title="Ommaviy chop etish">
              <Printer className="h-4 w-4" /> Ommaviy Chop etish
            </Button>
          </div>
        </header>
        <Card className="flex-grow flex flex-col overflow-hidden shadow-sm border">
            <CardHeader className="border-b px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <CardTitle className="text-lg sm:text-xl">Mahsulotlar Ro‘yxati</CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-0.5">
                  Jami {filteredProducts.length} ta ({products.length} tadan).
                </CardDescription>
              </div>
              <div className="relative w-full md:w-64 lg:w-72">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Qidirish (nom, mijoz, shtrix...)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 text-sm w-full"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-grow overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full p-6">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" /> <p>Yuklanmoqda...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-destructive whitespace-pre-line">
                <p className="font-semibold mb-2">Xatolik yuz berdi:</p> <p className="text-sm">{error}</p>
                <Button onClick={fetchProducts} variant="outline" size="sm" className="mt-4">Qayta urinish</Button>
              </div>
            ) : filteredProducts.length > 0 ? (
              <Table className="text-xs sm:text-sm">
                <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[180px] px-2 py-2.5 sm:px-4">Nomi</TableHead>
                    <TableHead className="hidden md:table-cell px-2 py-2.5 sm:px-4">Mijoz</TableHead>
                    <TableHead className="hidden xl:table-cell px-2 sm:px-4">Shtrix/IMEI</TableHead>
                    <TableHead className="px-2 sm:px-4">Turi</TableHead>
                    <TableHead className="hidden md:table-cell px-2 sm:px-4">Olingan narx</TableHead>
                    <TableHead className="px-2 sm:px-4">Sotish narxi</TableHead>
                    <TableHead className="hidden lg:table-cell px-2 sm:px-4">Xotira</TableHead>
                    <TableHead className="hidden sm:table-cell px-2 sm:px-4">Rangi</TableHead>
                    <TableHead className="text-right w-[130px] px-2 py-2.5 sm:px-4">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium px-2 py-2.5 sm:px-4 break-all max-w-[180px]">{p.name || "-"}</TableCell>
                      <TableCell className="hidden md:table-cell px-2 py-2.5 sm:px-4">
                        {p.supplier_name_manual || (determineProductTypeForDisplay(p) === "Aksesuar" ? "-" : "Noma'lum")}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell px-2 sm:px-4">{formatIdentifierForDisplay(p.barcode)}</TableCell>
                      <TableCell className="px-2 sm:px-4">{determineProductTypeForDisplay(p)}</TableCell>
                      <TableCell className="hidden md:table-cell px-2 sm:px-4 whitespace-nowrap">{formatCombinedPrice(p.purchase_price_usd, p.purchase_price_uzs)}</TableCell>
                      <TableCell className="px-2 sm:px-4 whitespace-nowrap">{formatCombinedPrice(p.price_usd, p.price_uzs)}</TableCell>
                      <TableCell className="hidden lg:table-cell px-2 sm:px-4">{p.storage_capacity || "-"}</TableCell>
                      <TableCell className="hidden sm:table-cell px-2 sm:px-4">{p.color || "-"}</TableCell>
                      <TableCell className="text-right px-2 py-2.5 sm:px-4">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-sky-600 hover:bg-sky-100" onClick={() => printSingleProductWithApiData(p)} disabled={printingProductId === p.id || !p.barcode || p.barcode.trim() === ""}>
                              {printingProductId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Yorliq chop etish</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10 ml-1" onClick={() => openEditDialog(p)} disabled={isDeletingProduct}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Tahrirlash</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10 ml-1" onClick={() => openDeleteDialog(p)} disabled={isDeletingProduct}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Arxivlash</p></TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 sm:p-10">
                <PackageSearch className="w-16 h-16 sm:w-20 sm:h-20 text-muted-foreground mb-4 sm:mb-6" />
                <p className="text-md sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">
                  {search ? "Qidiruv bo'yicha mahsulot topilmadi" : "Hozircha mahsulotlar yo'q"}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
                  {search ? "Boshqa kalit so'z bilan qidirib ko'ring." : "Yangi mahsulot qo'shing."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {isAddProductDialogOpen && ( <AddProductDialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen} onAddProduct={handleProductAdded} initialView={addDialogInitialView} categories={categories} /> )}
        {isEditDialogOpen && selectedProductForEdit && ( <EditProductDialog open={isEditDialogOpen} onOpenChange={(isOpen) => { setIsEditDialogOpen(isOpen); if (!isOpen) setSelectedProductForEdit(null); }} product={selectedProductForEdit} onProductSuccessfullyEdited={handleProductSuccessfullyEdited} categories={categories} /> )}

        {/* Arxivlash Dialogi */}
        <ShadDialog open={isDeleteDialogOpen} onOpenChange={(isOpen) => { if (!isDeletingProduct) setIsDeleteDialogOpen(isOpen);}}>
            <ShadDialogContent>
                <ShadDialogHeader>
                    <ShadDialogTitle>Mahsulotni arxivlashni tasdiqlaysizmi?</ShadDialogTitle>
                    <ShadDialogDescription>
                        "{productToDelete?.name}" nomli mahsulot arxivlanadi va unga bog'liq barcha ombor yozuvlari o'chiriladi.
                    </ShadDialogDescription>
                </ShadDialogHeader>
                <ShadDialogFooter>
                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeletingProduct}>
                        Bekor qilish
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteConfirmation} disabled={isDeletingProduct}>
                        {isDeletingProduct ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Arxivlanmoqda...
                            </>
                        ) : (
                            "Arxivlash"
                        )}
                    </Button>
                </ShadDialogFooter>
            </ShadDialogContent>
        </ShadDialog>

        {/* Kategoriya Qo'shish Dialogi */}
        <ShadDialog open={isAddCategoryModalOpen} onOpenChange={(isOpen) => { if (!isSubmittingCategory) { setIsAddCategoryModalOpen(isOpen); if (!isOpen) setNewCategoryData({ name: "", description: "", barcode_prefix: "" }); } }}>
            <ShadDialogContent className="sm:max-w-[425px]">
                <ShadDialogHeader>
                    <ShadDialogTitle>Yangi Kategoriya Qo'shish</ShadDialogTitle>
                    <ShadDialogDescription>
                        Yangi kategoriya ma'lumotlarini kiriting.
                    </ShadDialogDescription>
                </ShadDialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category-name" className="text-right">Nomi <span className="text-destructive">*</span></Label>
                        <Input id="category-name" value={newCategoryData.name} onChange={(e) => setNewCategoryData({ ...newCategoryData, name: e.target.value })} className="col-span-3"/>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category-description" className="text-right">Tavsif</Label>
                        <Input id="category-description" value={newCategoryData.description} onChange={(e) => setNewCategoryData({ ...newCategoryData, description: e.target.value })} className="col-span-3"/>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category-barcode-prefix" className="text-right">Shtrixkod Prefiksi</Label>
                        <Input id="category-barcode-prefix" value={newCategoryData.barcode_prefix} onChange={(e) => setNewCategoryData({ ...newCategoryData, barcode_prefix: e.target.value })} className="col-span-3" placeholder="Masalan, 200"/>
                    </div>
                </div>
                <ShadDialogFooter>
                    <Button variant="outline" onClick={() => setIsAddCategoryModalOpen(false)} disabled={isSubmittingCategory}>Bekor qilish</Button>
                    <Button type="button" onClick={handleSaveNewCategory} disabled={isSubmittingCategory}>
                        {isSubmittingCategory && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Saqlash
                    </Button>
                </ShadDialogFooter>
            </ShadDialogContent>
        </ShadDialog>

        {/* Ommaviy Chop Etish Dialogi */}
        <ShadDialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
            <ShadDialogContent className="max-w-2xl">
                <ShadDialogHeader>
                    <ShadDialogTitle>Ommaviy Yorliq Chop Etish</ShadDialogTitle>
                    <ShadDialogDescription>
                        Chop etish uchun mahsulotlarni tanlang. Faqat shtrixkodi mavjud mahsulotlar ko'rsatiladi.
                    </ShadDialogDescription>
                </ShadDialogHeader>
                {eligibleProductsForPrint.length > 0 ? (
                    <>
                        <div className="my-4 flex justify-between items-center">
                            <Label htmlFor="select-all-print" className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    id="select-all-print"
                                    className="h-4 w-4 accent-primary"
                                    checked={eligibleProductsForPrint.length > 0 && eligibleProductsForPrint.every(p => selectedProductsToPrint[p.id])}
                                    onChange={(e) => handleSelectAllForPrint(e.target.checked)}
                                />
                                Barchasini tanlash
                            </Label>
                            <span>Tanlanganlar: {getSelectedItemsForActualPrint().length} / {eligibleProductsForPrint.length}</span>
                        </div>
                        <div className="max-h-[40vh] overflow-y-auto border rounded-md p-2 space-y-1">
                            {eligibleProductsForPrint.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-1.5 hover:bg-muted/50 rounded">
                                    <Label htmlFor={`print-check-${p.id}`} className="flex items-center gap-2 cursor-pointer text-xs flex-grow">
                                        <input
                                            type="checkbox"
                                            id={`print-check-${p.id}`}
                                            className="h-3.5 w-3.5 accent-primary"
                                            checked={!!selectedProductsToPrint[p.id]}
                                            onChange={() => handleTogglePrintSelection(p.id)}
                                        />
                                        <span className="truncate max-w-[200px] sm:max-w-xs" title={p.name}>{p.name}</span>
                                        <span className="text-muted-foreground">({p.barcode})</span>
                                    </Label>
                                    <span className="text-xs whitespace-nowrap">{formatCombinedPrice(p.price_usd, p.price_uzs, true)}</span>
                                </div>
                            ))}
                        </div>
                        <ShadDialogFooter className="mt-4">
                            <Button variant="outline" onClick={() => setIsPrintModalOpen(false)}>Yopish</Button>
                            <Button onClick={() => printContentBulk(getSelectedItemsForActualPrint())} disabled={getSelectedItemsForActualPrint().length === 0}>
                                <Printer className="mr-2 h-4 w-4" /> Chop etish ({getSelectedItemsForActualPrint().length})
                            </Button>
                        </ShadDialogFooter>
                    </>
                ) : (
                    <p className="text-center py-8 text-muted-foreground">Chop etish uchun yaroqli mahsulot topilmadi.</p>
                )}
            </ShadDialogContent>
        </ShadDialog>
      </div>
    </TooltipProvider>
  );
}