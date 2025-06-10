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
// Checkbox importi ishlatilmayotgan edi, agar kerak bo'lsa qoldiring
// import { Checkbox } from "@/components/ui/checkbox";
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
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import JsBarcode from "jsbarcode";

const API_URL_PRODUCTS_LISTING =
  "https://smartphone777.pythonanywhere.com/api/products/";
// const API_URL_PRODUCT_OPERATIONS = // Bu ishlatilmayotganga o'xshaydi, agar kerak bo'lsa qoldiring
//   "https://smartphone777.pythonanywhere.com/api/products/";
const API_URL_CATEGORIES =
  "https://smartphone777.pythonanywhere.com/api/categories/";

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
  customer_full_name?: string | null;
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

  // Ommaviy chop etish uchun state-lar (qisqartirilgan)
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
        if(response.data.count > fetchedProducts.length) {
          console.warn("Pagination aniqlandi, lekin barcha mahsulotlar yuklanmadi. Hozircha faqat birinchi sahifa ishlatilmoqda.");
          // TODO: Agar kerak bo'lsa, pagination logikasini qo'shing
        }
      } else if (Array.isArray(response.data)) {
        fetchedProducts = response.data;
      } else {
        console.error("Mahsulot ma'lumotlari kutilgan formatda emas:", response.data);
        setError("Mahsulot ma'lumotlari noto'g'ri formatda keldi.");
        setProducts([]);
        setIsLoading(false);
        return;
      }
      setProducts(fetchedProducts.filter((p) => p.is_active === true).reverse());
    } catch (err: any) {
      if (err.response?.status === 401) { setError("Sessiya muddati tugagan. Iltimos, qayta tizimga kiring."); navigate("/login");
      } else if (err.code === "ECONNABORTED" || err.message.includes("timeout")) { setError("Serverga ulanishda vaqt tugadi. Internet aloqasini tekshiring yoki keyinroq urinib ko'ring.");
      } else {
        let errMsg = "Ma'lumotlarni yuklashda noma'lum xatolik yuz berdi.";
        if (err.response?.data) {
          if (err.response.data.detail) errMsg = err.response.data.detail;
          else if (typeof err.response.data === "object") {
            const errors = Object.entries(err.response.data).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`).join("; ");
            if (errors) errMsg = errors;
          }
        } else if (err.message) errMsg = err.message;
        setError(`Xatolik: ${errMsg}`);
        console.error("Mahsulotlarni yuklashda xatolik:", err.response || err);
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
        // Agar kategoriyalarni yuklash uchun ham login kerak bo'lsa:
        // toast.error("Avtorizatsiya qilinmagan.");
        // navigate("/login");
        return;
      }
      const response = await axios.get<Category[]>(API_URL_CATEGORIES, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000, // Timeout qo'shildi
      });
      setCategories(response.data);
    } catch (err: any) {
      console.error("Kategoriyalarni yuklashda xatolik:", err.response || err);
      toast.error("Kategoriyalarni yuklashda xatolik yuz berdi.");
    }
  }, [/* navigate - agar login kerak bo'lsa */]);

  const handleSaveNewCategory = async () => {
    if (!newCategoryData.name.trim()) {
        toast.error("Kategoriya nomi kiritilishi shart.");
        return;
    }
    setIsSubmittingCategory(true);
    try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            toast.error("Avtorizatsiya qilinmagan. Iltimos, tizimga kiring.");
            navigate("/login"); // Agar kerak bo'lsa
            setIsSubmittingCategory(false);
            return;
        }
        await axios.post(API_URL_CATEGORIES, newCategoryData, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 15000, // Timeout qo'shildi
        });
        toast.success(`"${newCategoryData.name}" kategoriyasi muvaffaqiyatli qo'shildi!`);
        setIsAddCategoryModalOpen(false);
        setNewCategoryData({ name: "", description: "", barcode_prefix: "" });
        fetchCategories(); // Kategoriyalar ro'yxatini yangilash
    } catch (err: any) {
        console.error("Kategoriyani saqlashda xatolik:", err.response?.data || err);
        let errMsg = "Kategoriyani saqlashda noma'lum xatolik.";
        if (err.response?.data) {
            if (err.response.data.detail) errMsg = err.response.data.detail;
            else if (typeof err.response.data === "object") {
                const errors = Object.entries(err.response.data)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
                    .join("; ");
                if (errors) errMsg = errors;
            }
        } else if (err.message) {
          errMsg = err.message;
        }
        if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
          errMsg = "Serverga ulanishda vaqt tugadi.";
        }
        toast.error(`Xatolik: ${errMsg}`);
    } finally {
        setIsSubmittingCategory(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const filteredProducts = useMemo(() => {
    const trimmedSearch = search.trim();
    if (!trimmedSearch) return products;
    const lowerCaseSearch = trimmedSearch.toLowerCase();
    
    return products.filter((product) => {
      const nameMatch = product.name?.toLowerCase().includes(lowerCaseSearch);
      const customerNameMatch = product.customer_full_name?.toLowerCase().includes(lowerCaseSearch);
      const barcodeMatch = product.barcode?.toLowerCase().includes(lowerCaseSearch);
      const categoryNameMatch = product.category_name?.toLowerCase().includes(lowerCaseSearch);
      const colorMatch = product.color?.toLowerCase().includes(lowerCaseSearch);
      const seriesRegionMatch = product.series_region?.toLowerCase().includes(lowerCaseSearch);

      return nameMatch || customerNameMatch || barcodeMatch || categoryNameMatch || colorMatch || seriesRegionMatch;
    });
  }, [products, search]);

  const handleProductAdded = (newlyAddedProduct: Product) => {
    fetchProducts();
    setIsAddProductDialogOpen(false);
    toast.success(`"${newlyAddedProduct.name}" muvaffaqiyatli qo'shildi!`);
  };

  const handleProductSuccessfullyEdited = (editedProduct: Product) => {
    fetchProducts();
    setIsEditDialogOpen(false);
    setSelectedProductForEdit(null);
    toast.success(`"${editedProduct.name}" muvaffaqiyatli tahrirlandi!`);
  };

  const handleDeleteConfirmation = async () => {
    if (!productToDelete) return;
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Avtorizatsiya qilinmagan.");
        navigate("/login");
        return;
      }
      // is_active=false qilib PATCH so'rovini yuborish
      await axios.patch(
        `${API_URL_PRODUCTS_LISTING}${productToDelete.id}/`,
        { is_active: false },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
      );
      toast.success(`"${productToDelete.name}" muvaffaqiyatli arxivlandi.`);
      fetchProducts(); // Mahsulotlar ro'yxatini yangilash
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error: any) {
      console.error("Mahsulotni arxivlashda xatolik:", error.response || error);
      toast.error("Mahsulotni arxivlashda xatolik: " + (error.response?.data?.detail || error.message));
    }
  };

  const openEditDialog = (product: Product) => { setSelectedProductForEdit(product); setIsEditDialogOpen(true); };
  const openDeleteDialog = (product: Product) => { setProductToDelete(product); setIsDeleteDialogOpen(true); };
  
  // Ommaviy chop etish funksiyalari (qisqartirilgan)
  const handleOpenPrintModal = () => {
    const itemsToPrint = filteredProducts.filter(p => p.barcode && p.barcode.trim() !== "");
    if (itemsToPrint.length === 0) {
        toast.info("Chop etish uchun yaroqli (shtrixkodli) mahsulotlar topilmadi.");
        return;
    }
    setEligibleProductsForPrint(itemsToPrint);
    // Barcha yaroqli mahsulotlarni dastlab tanlanmagan qilib belgilash
    const initialSelection = itemsToPrint.reduce((acc, p) => ({ ...acc, [p.id]: false }), {});
    setSelectedProductsToPrint(initialSelection);
    setIsPrintModalOpen(true);
  };

  const printContentBulk = (items: Product[]) => {
    if (items.length === 0) {
      toast.info("Chop etish uchun mahsulot tanlanmagan.");
      return;
    }
    // ... (chop etish logikasi, kerak bo'lsa JsBarcode ishlatiladi)
    // Bu yerda items - faqat TANLANGAN mahsulotlar bo'lishi kerak
    const printWindow = window.open('', '_blank', 'height=600,width=800');
    if (printWindow) {
        printWindow.document.write('<html><head><title>Shtrixkodlar</title>');
        printWindow.document.write('<style>body{font-family: Arial, sans-serif; margin: 20px;} .barcode-item { display: inline-block; text-align: center; margin: 10px; padding: 10px; border: 1px solid #ccc; page-break-inside: avoid; } .barcode-item svg { display: block; margin: 0 auto 5px auto; } .product-name { font-size: 10px; margin-bottom: 3px; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;} .price { font-size: 11px; font-weight: bold; } @media print { .no-print { display: none; } body { margin: 0; } }</style>');
        printWindow.document.write('</head><body>');
        
        items.forEach(product => {
            const priceDisplay = formatCombinedPrice(product.price_usd, product.price_uzs, true);
            printWindow.document.write(`<div class="barcode-item">`);
            printWindow.document.write(`<div class="product-name" title="${product.name}">${product.name}</div>`);
            if (priceDisplay !== "-") {
              printWindow.document.write(`<div class="price">${priceDisplay}</div>`);
            }
            // BarcodeDisplay komponentini bu yerda to'g'ridan-to'g'ri ishlata olmaymiz,
            // shuning uchun JsBarcode'ni chaqirish kerak bo'ladi yoki SVG'ni serverda generatsiya qilish.
            // Hozircha faqat shtrixkod qiymatini chiqaramiz.
            // Yoki BarcodeDisplay'dagi SVG generatsiya logikasini bu yerga ko'chirish mumkin.
            const barcodeSvgContainerId = `barcode-svg-${product.id}-${Math.random().toString(36).substring(7)}`;
            printWindow.document.write(`<svg id="${barcodeSvgContainerId}"></svg>`);
            printWindow.document.write(`</div>`);

            // JsBarcode ni yangi document contextida ishlatish
            const svgElement = printWindow.document.getElementById(barcodeSvgContainerId);
            if (svgElement && product.barcode) {
                try {
                    JsBarcode(svgElement, product.barcode, {
                        format: "CODE128",
                        lineColor: "#000000",
                        width: 1.2, //kichikroq qilingan
                        height: 25, //kichikroq qilingan
                        displayValue: true,
                        fontSize: 10, //kichikroq qilingan
                        textMargin: 0,
                        margin: 2,
                    });
                } catch (e) {
                    console.error("JsBarcode xatosi (ommaviy chop etish): ", e);
                    svgElement.innerHTML = `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="10" fill="red">Xato</text>`;
                }
            }
        });

        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        // setTimeout(() => { printWindow.print(); /* printWindow.close(); */ }, 500); // Ba'zi brauzerlar uchun kechiktirish
    } else {
        toast.error("Chop etish oynasini ochib bo'lmadi. Pop-up bloklagichini tekshiring.");
    }
    setIsPrintModalOpen(false);
  };

  const printSingleProductWithApiData = async (product: Product) => {
    if (!product.barcode || product.barcode.trim() === "") {
      toast.warn("Bu mahsulot uchun shtrixkod mavjud emas.");
      return;
    }
    setPrintingProductId(product.id);
    // Bu yerda API'dan mahsulotning eng so'nggi ma'lumotlarini olishingiz mumkin, agar kerak bo'lsa.
    // Hozircha mavjud 'product' obyektidan foydalanamiz.
    try {
      // Misol uchun, agar API'dan qayta yuklash kerak bo'lsa:
      // const token = localStorage.getItem("accessToken");
      // const response = await axios.get(`${API_URL_PRODUCTS_LISTING}${product.id}/`, { headers: { Authorization: `Bearer ${token}` } });
      // const freshProductData = response.data;
      
      const printWindow = window.open('', '_blank', 'height=400,width=300');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Yorliq</title>');
        printWindow.document.write('<style>body{font-family: Arial, sans-serif; text-align: center; margin: 10px;} svg{display: block; margin: 5px auto;} .product-name { font-size: 11px; margin-bottom: 3px; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-left: auto; margin-right: auto; } .price { font-size: 12px; font-weight: bold; margin-bottom: 5px; } @media print { body { margin: 0; } }</style>');
        printWindow.document.write('</head><body>');
        
        const priceDisplay = formatCombinedPrice(product.price_usd, product.price_uzs, true);
        printWindow.document.write(`<div class="product-name" title="${product.name}">${product.name}</div>`);
        if (priceDisplay !== "-") {
          printWindow.document.write(`<div class="price">${priceDisplay}</div>`);
        }
        const barcodeSvgContainerId = `barcode-svg-single-${product.id}`;
        printWindow.document.write(`<svg id="${barcodeSvgContainerId}"></svg>`);
        
        printWindow.document.write('</body></html>');
        printWindow.document.close();

        const svgElement = printWindow.document.getElementById(barcodeSvgContainerId);
        if (svgElement && product.barcode) {
            JsBarcode(svgElement, product.barcode, {
                format: "CODE128",
                lineColor: "#000000",
                width: 1.5, // Biroz kattaroq
                height: 40, // Biroz balandroq
                displayValue: true,
                fontSize: 12,
                textMargin: 2,
                margin: 5,
            });
        }
        printWindow.focus();
        // setTimeout(() => { printWindow.print(); /* printWindow.close(); */ }, 250);
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
    const newSelection: Record<number, boolean> = {};
    eligibleProductsForPrint.forEach(p => {
        newSelection[p.id] = selectAll;
    });
    setSelectedProductsToPrint(newSelection);
  };

  const getSelectedItemsForActualPrint = () => {
    return eligibleProductsForPrint.filter(p => selectedProductsToPrint[p.id]);
  };

  const formatIdentifierForDisplay = (idStr: string | null | undefined) => {
    if (!idStr) return "-";
    const ids = idStr.split(/[\s,;]+/).filter(Boolean);
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
          <TooltipTrigger asChild>
            {triggerContent}
          </TooltipTrigger>
          <TooltipContent
            className="max-w-xs break-words bg-popover text-popover-foreground shadow-md rounded-md p-2 z-50" // z-index qo'shildi
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
                    <TableHead className="hidden md:table-cell px-2 py-2.5 sm:px-4">Mijoz Ismi</TableHead>
                    <TableHead className="hidden xl:table-cell px-2 sm:px-4">Shtrix/IMEI</TableHead>
                    <TableHead className="px-2 sm:px-4">Turi</TableHead>
                    <TableHead className="px-2 sm:px-4">Sotish narxi</TableHead>
                    <TableHead className="hidden md:table-cell px-2 sm:px-4">Olingan narx</TableHead>
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
                        {p.customer_full_name || "-"}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell px-2 sm:px-4">{formatIdentifierForDisplay(p.barcode)}</TableCell>
                      <TableCell className="px-2 sm:px-4">{determineProductTypeForDisplay(p)}</TableCell>
                      <TableCell className="px-2 sm:px-4 whitespace-nowrap">{formatCombinedPrice(p.price_usd, p.price_uzs)}</TableCell>
                      <TableCell className="hidden md:table-cell px-2 sm:px-4 whitespace-nowrap">{formatCombinedPrice(p.purchase_price_usd, p.purchase_price_uzs)}</TableCell>
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
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10 ml-1" onClick={() => openEditDialog(p)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Tahrirlash</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10 ml-1" onClick={() => openDeleteDialog(p)}>
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
                  {search ? "Boshqa kalit so'z bilan qidirib ko'ring yoki qidiruvni tozalang." : "Yangi mahsulot qo'shish uchun yuqoridagi tugmalardan foydalaning."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {isAddProductDialogOpen && (
          <AddProductDialog 
            open={isAddProductDialogOpen} 
            onOpenChange={setIsAddProductDialogOpen} 
            onAddProduct={handleProductAdded} 
            initialView={addDialogInitialView}
            categories={categories} // Kategoriyalarni uzatish
          />
        )}
        {isEditDialogOpen && selectedProductForEdit && (
          <EditProductDialog 
            open={isEditDialogOpen} 
            onOpenChange={(isOpen) => { setIsEditDialogOpen(isOpen); if (!isOpen) setSelectedProductForEdit(null); }} 
            product={selectedProductForEdit} 
            onProductSuccessfullyEdited={handleProductSuccessfullyEdited} 
            categories={categories} // Kategoriyalarni uzatish
          />
        )}
        
        {/* Delete Product Dialog */}
        <ShadDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <ShadDialogContent>
            <ShadDialogHeader>
              <ShadDialogTitle>Mahsulotni arxivlashni tasdiqlaysizmi?</ShadDialogTitle>
              <ShadDialogDescription>
                "{productToDelete?.name}" nomli mahsulot arxivlanadi va ro'yxatda ko'rinmaydi.
                Bu amalni orqaga qaytarish mumkin (agar backendda shunday imkoniyat bo'lsa).
              </ShadDialogDescription>
            </ShadDialogHeader>
            <ShadDialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Bekor qilish</Button>
              <Button variant="destructive" onClick={handleDeleteConfirmation}>Arxivlash</Button>
            </ShadDialogFooter>
          </ShadDialogContent>
        </ShadDialog>

        {/* Add Category Dialog */}
        <ShadDialog open={isAddCategoryModalOpen} onOpenChange={(isOpen) => { setIsAddCategoryModalOpen(isOpen); if (!isOpen) setNewCategoryData({ name: "", description: "", barcode_prefix: "" }); }}>
          <ShadDialogContent className="sm:max-w-[425px]">
            <ShadDialogHeader>
                <ShadDialogTitle>Yangi Kategoriya Qo'shish</ShadDialogTitle>
                <ShadDialogDescription>
                    Mahsulotlar uchun yangi kategoriya ma'lumotlarini kiriting.
                </ShadDialogDescription>
            </ShadDialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category-name" className="text-right">Nomi <span className="text-destructive">*</span></Label>
                    <Input
                        id="category-name"
                        value={newCategoryData.name}
                        onChange={(e) => setNewCategoryData({ ...newCategoryData, name: e.target.value })}
                        className="col-span-3"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category-description" className="text-right">Tavsif</Label>
                    <Input
                        id="category-description"
                        value={newCategoryData.description}
                        onChange={(e) => setNewCategoryData({ ...newCategoryData, description: e.target.value })}
                        className="col-span-3"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category-barcode-prefix" className="text-right">Shtrixkod Prefiksi</Label>
                    <Input
                        id="category-barcode-prefix"
                        value={newCategoryData.barcode_prefix}
                        onChange={(e) => setNewCategoryData({ ...newCategoryData, barcode_prefix: e.target.value })}
                        className="col-span-3"
                        placeholder="Masalan, 200"
                    />
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
        
        {/* Print Modal */}
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
                                    className="h-4 w-4"
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
                                            className="h-3.5 w-3.5"
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
                    <p className="text-center py-8 text-muted-foreground">Chop etish uchun yaroqli mahsulotlar topilmadi.</p>
                )}
            </ShadDialogContent>
        </ShadDialog>

      </div>
    </TooltipProvider>
  );
}