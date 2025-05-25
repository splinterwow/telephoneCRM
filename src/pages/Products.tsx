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
import { Checkbox } from "@/components/ui/checkbox";
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
  Dialog as ShadDialog, // Dialog nomini o'zgartiramiz, chunki AddProductDialog da ham Dialog bor
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

// AddProductDialog va EditProductDialog importlari sizning loyihangiz strukturasiga mos kelishi kerak
import { AddProductDialog, DialogView as AddDialogView } from "@/components/Products/AddProductDialog"; // DialogView ni ham import qilamiz
import { EditProductDialog } from "@/components/Products/EditProductDialog"; // Buni ham to'g'ri import qiling
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import JsBarcode from "jsbarcode";

// API URL manzillari
const API_URL_PRODUCTS_LISTING =
  "https://smartphone777.pythonanywhere.com/api/products/";
const API_URL_PRODUCT_OPERATIONS =
  "https://smartphone777.pythonanywhere.com/api/products/";
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
  const [categories, setCategories] = useState<Category[]>([]); // Bu AddProductDialog'ga prop sifatida uzatilmaydi

  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [addDialogInitialView, setAddDialogInitialView] = useState<AddDialogView>("phone"); // AddDialogView ishlatiladi

  const [selectedProductForEdit, setSelectedProductForEdit] =
    useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [eligibleProductsForPrint, setEligibleProductsForPrint] = useState<
    Product[]
  >([]);
  const [selectedProductsToPrint, setSelectedProductsToPrint] = useState<
    Record<number, boolean>
  >({});
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printingProductId, setPrintingProductId] = useState<number | null>(
    null
  );

  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({
    name: "",
    description: "",
    barcode_prefix: "",
  });
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  const navigate = useNavigate();

  const formatPriceForTable = useCallback(
    (
      price: string | null | undefined,
      currency: "$" | "so'm" = "$"
    ): string => {
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
      const formatted = numericPrice.toLocaleString(
        currency === "$" ? "en-US" : "uz-UZ",
        options
      );
      return currency === "$" ? `$${formatted}` : `${formatted} so'm`;
    },
    []
  );

  const determineProductTypeForDisplay = useCallback(
    (product: Product): string => {
      const categoryName = product.category_name?.toLowerCase() || "";
      const productName = product.name?.toLowerCase() || "";
      if (
        categoryName.includes("iphone") ||
        productName.toLowerCase().startsWith("iphone")
      )
        return "iPhone";
      if (
        categoryName.includes("android") ||
        (categoryName.includes("phone") &&
          !productName.toLowerCase().startsWith("iphone")) ||
        (categoryName.includes("telefon") &&
          !productName.toLowerCase().startsWith("iphone"))
      )
        return "Android";
      if (
        categoryName.includes("accessory") ||
        categoryName.includes("aksesuar")
      )
        return "Aksesuar";
      return product.category_name || "Noma'lum";
    },
    []
  );

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Avtorizatsiya qilinmagan.");
        navigate("/login");
        setIsLoading(false);
        return;
      }

      const response = await axios.get<{ results: Product[] } | Product[]>(
        API_URL_PRODUCTS_LISTING,
        { headers: { Authorization: `Bearer ${token}` }, timeout: 20000 }
      );

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
        setError("Sessiya muddati tugagan.");
        navigate("/login");
      } else if (
        err.code === "ECONNABORTED" ||
        err.message.includes("timeout")
      ) {
        setError("Serverga ulanishda vaqt tugadi.");
      } else {
        setError(
          "Ma'lumotlarni yuklashda xatolik: " +
            (err.response?.data?.detail ||
              err.response?.data?.non_field_errors?.[0] ||
              err.message ||
              "Noma'lum server xatosi.")
        );
      }
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const fetchCategories = useCallback(async () => {
    // Bu funksiya kategoriya qo'shish modalida kerak bo'lishi mumkin,
    // lekin AddProductDialog o'zi kategoriyalarni yuklaydi.
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      const response = await axios.get<Category[] | { results: Category[] }>(
        API_URL_CATEGORIES,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const categoriesData = Array.isArray(response.data)
        ? response.data
        : (response.data as any).results || [];
      setCategories(categoriesData);
    } catch (err) {
      console.error("Kategoriyalarni yuklashda xatolik:", err);
      // Bu yerda toast chiqarish shart emas, chunki bu asosan orqa fon ishi
    }
  }, []);

  const handleSaveNewCategory = async () => {
    if (!newCategoryData.name.trim()) {
      toast.error("Kategoriya nomi bo'sh bo'lishi mumkin emas.");
      return;
    }
    setIsSubmittingCategory(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Avtorizatsiya tokeni yo'q.");
        setIsSubmittingCategory(false);
        return;
      }
      const payload: any = {
        name: newCategoryData.name.trim(),
        description: newCategoryData.description.trim() || null,
      };
      if (newCategoryData.barcode_prefix.trim())
        payload.barcode_prefix = newCategoryData.barcode_prefix.trim();

      const response = await axios.post<Category>(API_URL_CATEGORIES, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`Kategoriya "${response.data.name}" qo'shildi!`);
      setCategories((prev) =>
        [response.data, ...prev].sort((a, b) => a.name.localeCompare(b.name))
      );
      setIsAddCategoryModalOpen(false);
      setNewCategoryData({ name: "", description: "", barcode_prefix: "" });
      // Agar AddProductDialog ochiq bo'lsa, uni yangilash uchun signal yuborish kerak bo'lishi mumkin
      // yoki AddProductDialog kategoriyalarni o'zi qayta yuklashi kerak.
      // Hozirgi holatda AddProductDialog o'zi kategoriyalarni yuklaydi.
    } catch (err: any) {
      let errorMessage = `Kategoriya qo'shishda xatolik: `;
      if (err.response?.data && typeof err.response.data === "object") {
        Object.keys(err.response.data).forEach((key) => {
          errorMessage += `${key}: ${
            Array.isArray(err.response.data[key])
              ? err.response.data[key].join(", ")
              : err.response.data[key]
          } `;
        });
      } else {
        errorMessage +=
          err.response?.data?.detail ||
          err.message ||
          "Noma'lum server xatosi.";
      }
      toast.error(errorMessage.trim(), { duration: 7000 });
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories(); // Kategoriya modalida kerak bo'lishi mumkin
  }, [fetchProducts, fetchCategories]);

  const filteredProducts = useMemo(() => {
    const trimmedSearch = search.trim();
    if (!trimmedSearch) return products;
    const lowerCaseSearch = trimmedSearch.toLowerCase();
    const isPotentialCode = /^[0-9A-Za-z,\s-]+$/.test(trimmedSearch);
    const searchTerms = lowerCaseSearch
      .split(/[\s,]+/)
      .filter((term) => term.length > 0);

    return products.filter((product) => {
      const nameMatch = product.name?.toLowerCase().includes(lowerCaseSearch);
      let barcodeOrImeiMatch = false;
      if (product.barcode) {
        const ids = product.barcode.toLowerCase().split(/[\s,;]+/);
        barcodeOrImeiMatch = searchTerms.some((term) =>
          ids.some((id) => id.includes(term))
        );
      }
      const seriesRegionMatch = product.series_region
        ?.toLowerCase()
        .includes(lowerCaseSearch);
      const categoryNameMatch = product.category_name
        ?.toLowerCase()
        .includes(lowerCaseSearch);
      const colorMatch = product.color?.toLowerCase().includes(lowerCaseSearch);
      const storageMatch = product.storage_capacity
        ?.toLowerCase()
        .includes(lowerCaseSearch);

      if (isPotentialCode) return barcodeOrImeiMatch;
      return (
        nameMatch ||
        seriesRegionMatch ||
        categoryNameMatch ||
        colorMatch ||
        storageMatch ||
        barcodeOrImeiMatch
      );
    });
  }, [products, search]);

  const handleProductAdded = (newlyAddedProduct: Product) => {
    // setProducts((prev) => [newlyAddedProduct, ...prev]); // Bu optimistik update
    fetchProducts(); // Yoki qayta fetch qilish, chunki omborga ham qo'shilgan bo'lishi mumkin
    setIsAddProductDialogOpen(false);
  };
  const handleProductSuccessfullyEdited = (editedProduct: Product) => {
    // setProducts((prev) =>
    //   prev.map((p) => (p.id === editedProduct.id ? editedProduct : p))
    // );
    fetchProducts(); // Tahrirlashdan keyin ham qayta fetch qilish yaxshiroq
    setIsEditDialogOpen(false);
    setSelectedProductForEdit(null);
  };

  const handleDeleteConfirmation = async () => {
    if (!productToDelete) return;
    // Optimistik update
    const originalProducts = [...products];
    setProducts((prev) => prev.filter((p) => p.id !== productToDelete!.id));
    setIsDeleteDialogOpen(false);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Avtorizatsiya tokeni yo'q.");
        setProducts(originalProducts); // Qaytaramiz
        setProductToDelete(null);
        return;
      }
      await axios.patch(
        `${API_URL_PRODUCT_OPERATIONS}${productToDelete.id}/`,
        { is_active: false }, // Arxivlash uchun
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`"${productToDelete.name}" arxivlandi.`);
      setProductToDelete(null);
      // fetchProducts(); // Bu yerda qayta fetch shart emas, chunki optimistik o'chirdik
    } catch (err: any) {
      let errMsg = `"${productToDelete.name}" ni arxivlashda xato: `;
      if (err.response?.data && typeof err.response.data === 'object') {
        Object.keys(err.response.data).forEach((key) => {
          const errorValue = err.response.data[key];
          errMsg += `${key}: ${Array.isArray(errorValue) ? errorValue.join(", ") : errorValue}. `;
        });
      } else {
        errMsg += err.message || "Noma'lum xato.";
      }
      toast.error(errMsg.trim(), { duration: 7000 });
      setProducts(originalProducts); // Xatolikda orqaga qaytaramiz
      setProductToDelete(null);
    }
  };

  const openEditDialog = (product: Product) => {
    setSelectedProductForEdit(product);
    setIsEditDialogOpen(true);
  };
  const openDeleteDialog = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const handleOpenPrintModal = () => {
    const sourceList = search.trim() ? filteredProducts : products;
    const itemsToPrint = sourceList.filter(
      (p) =>  p.barcode && p.barcode.trim() !== ""
    );
    if (itemsToPrint.length > 0) {
      setEligibleProductsForPrint(itemsToPrint);
      const initialSelections: Record<number, boolean> = {};
      itemsToPrint.forEach((p) => {
        initialSelections[p.id] = true;
      });
      setSelectedProductsToPrint(initialSelections);
      setIsPrintModalOpen(true);
    } else {
      toast.info("Chop etish uchun mos (shtrix-kodli) mahsulotlar topilmadi.");
    }
  };

  const printContentBulk = (items: Product[]) => {
    if (!items || items.length === 0) {
      toast.info("Mahsulot tanlanmagan.");
      return;
    }
    const printWin = window.open("", "_blank", "width=400,height=600");
    if (!printWin) {
      toast.error("Pop-up bloklandi.");
      setIsPrintModalOpen(false);
      return;
    }
    let labelsHtml = items
      .map((p) => {
        if (!p.barcode) return "";

        const details: string[] = [];
        if (p.storage_capacity) details.push(`Xotira: ${p.storage_capacity}`);
        const pType = determineProductTypeForDisplay(p);
        if (pType === "iPhone" && p.battery_health)
          details.push(`Batareya: ${p.battery_health}%`);
        if (pType === "iPhone" && p.series_region)
            details.push(`Region: ${p.series_region}`);
        if (pType === "Aksesuar" && p.description)
          details.push(
            `${p.description.substring(0, 25)}${
              p.description.length > 25 ? "..." : ""
            }`
          );

        const detailsHtml =
          details.length > 0
            ? `<div class="label-details">${details
                .map((d) => `<div class="detail-item">${d}</div>`)
                .join("")}</div>`
            : '<div class="label-details-placeholder"></div>';

        return `<div class="print-label">
                    <div class="label-name">${p.name || ""}</div>
                    ${detailsHtml}
                    <div class="label-barcode-container">
                        <svg class="barcode-svg" 
                             data-value="${p.barcode}" 
                             data-bar-width="1.1" 
                             data-bar-height="28" 
                             data-font-size="0" 
                             data-text-margin="0" 
                             data-svg-margin="0" 
                             data-display-value="false">
                        </svg>
                    </div>
                </div>`;
      })
      .join("");
    printWin.document.write(
      `<html><head><title>Shtrix Kodlar (50x30mm)</title><script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script><style>
      @page{size: 50mm 30mm; margin: 0mm !important;}
      html,body{width:50mm;height:30mm;margin:0 !important;padding:0;box-sizing:border-box;font-family:'Arial',sans-serif;-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;background-color:#fff;overflow:hidden;}
      .print-label{width:100%;height:100%;padding: 2.5mm 2mm 1.5mm 2mm;text-align:center;display:flex;flex-direction:column;justify-content:space-between;align-items:center;box-sizing:border-box;overflow:hidden !important;page-break-after:always;}
      .label-name{font-size:9pt;font-weight:bold; margin-bottom:1mm;color:#000;width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.1;}
      .label-details{width:100%;font-size:7.5pt;font-weight:normal; color:#000;text-align:center;margin-bottom:1mm;line-height:1.15;min-height: 4mm;}
      .label-details-placeholder {min-height: 4mm;width: 100%;}
      .detail-item{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;line-height:1.15;}
      .label-barcode-container{width:100%;display:flex;justify-content:center;align-items:flex-end;}
      .label-barcode-container svg{display:block;max-width: 95%;width: 44mm;height:auto;max-height:9mm;}
      </style></head><body>${labelsHtml}<script>
      window.onload=function(){
        try{document.querySelectorAll(".barcode-svg").forEach(svg=>{const val=svg.getAttribute("data-value");const displayValAttr=svg.getAttribute("data-display-value");const displayVal=displayValAttr==='true';if(val)JsBarcode(svg,val,{format:"CODE128",lineColor:"#000",width:parseFloat(svg.getAttribute("data-bar-width")||"1.1"),height:parseInt(svg.getAttribute("data-bar-height")||"28"),displayValue:displayVal,text:displayVal?val:undefined,fontSize:parseFloat(svg.getAttribute("data-font-size")||"0"),textMargin:parseFloat(svg.getAttribute("data-text-margin")||"0"),margin:parseInt(svg.getAttribute("data-svg-margin")||"0"),font:"Arial",textAlign:"center"})})}catch(e){console.error("JsBarcode error:",e)}
        setTimeout(()=>{window.print();var mql=window.matchMedia("print");function closeWindow(){if(printWin&&!printWin.closed)setTimeout(()=>printWin.close(),200)}mql.addListener(e=>{if(!e.matches)closeWindow()});window.onafterprint=closeWindow;setTimeout(closeWindow,7e3)},700)}
      </script></body></html>`
    );
    printWin.document.close();
    if (isPrintModalOpen) setIsPrintModalOpen(false);
  };

  const printSingleProductWithApiData = async (product: Product) => {
    if (!product.id) {
      toast.error("Mahsulot ID si topilmadi.");
      return;
    }
    if (!product.barcode) {
        toast.info(`"${product.name}" uchun shtrix-kod mavjud emas.`);
        return;
    }
    setPrintingProductId(product.id);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Avtorizatsiya tokeni yo'q.");
        setPrintingProductId(null);
        return;
      }
      const response = await axios.get<{
        name: string;
        barcode_image_base64: string;
        battery_health?: string;
        series_region?: string;
      }>(
        `${API_URL_PRODUCT_OPERATIONS}${product.id}/print-label-data/`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      const printData = response.data;
      const printWindow = window.open("", "_blank", "width=400,height=600");
      if (!printWindow) {
        toast.error("Pop-up bloklandi. Brauzer sozlamalarini tekshiring.");
        setPrintingProductId(null);
        return;
      }

      const detailsArray: string[] = [];
      if (product.storage_capacity)
        detailsArray.push(`Xotira: ${product.storage_capacity}`);
      const productType = determineProductTypeForDisplay(product);
      if (productType === "iPhone") {
        if (printData.battery_health || product.battery_health)
          detailsArray.push(`Batareya: ${printData.battery_health || product.battery_health}%`);
        if (printData.series_region || product.series_region)
          detailsArray.push(`Region: ${printData.series_region || product.series_region}`);
      }
      if (productType === "Aksesuar" && product.description)
        detailsArray.push(
          `${product.description.substring(0, 25)}${
            product.description.length > 25 ? "..." : ""
          }`
        );
      const detailsHtml =
        detailsArray.length > 0
          ? `<div class="label-details">${detailsArray
              .map((d) => `<div class="detail-item">${d}</div>`)
              .join("")}</div>`
          : '<div class="label-details-placeholder"></div>';

      printWindow.document.write(
        `<html><head><title>Yorliq - ${printData.name}</title><style>
        @page{size: 50mm 30mm;margin: 0mm !important;}
        html,body{width:50mm;height:30mm;margin:0 !important;padding:0;box-sizing:border-box;font-family:'Arial',sans-serif;-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;background-color:#fff;overflow:hidden;}
        .print-label{width:100%;height:100%;padding: 3mm 2mm 1.5mm 2mm;text-align:center;display:flex;flex-direction:column;justify-content:space-between;align-items:center;box-sizing:border-box;overflow:hidden !important;}
        .label-name{font-size:9pt;font-weight:bold; margin-bottom:1mm;color:#000;width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.1;}
        .label-details{width:100%;font-size:7.5pt;font-weight:normal;color:#000;text-align:center;margin-bottom:1mm;line-height:1.15;min-height: 4mm;}
        .label-details-placeholder {min-height: 4mm;width: 100%;}
        .detail-item{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;line-height:1.15;}
        .label-barcode-container{width:100%;display:flex;justify-content:center;align-items:flex-end;}
        .label-barcode-image{max-width: 95%;width: 44mm;height:auto;max-height:9mm;display:block;}
        </style></head><body><div class="print-label"><div class="label-name">${printData.name || ""}</div>${detailsHtml}<div class="label-barcode-container"><img src="${printData.barcode_image_base64}" alt="Barcode" class="label-barcode-image"/></div></div><script>window.onload=function(){setTimeout(()=>{window.print();var mql=window.matchMedia("print");function closeWindow(){if(printWindow&&!printWindow.closed)setTimeout(()=>printWindow.close(),200)}mql.addListener(e=>{if(!e.matches)closeWindow()});window.onafterprint=closeWindow;setTimeout(closeWindow,7e3)},500);}</script></body></html>`
      );
      printWindow.document.close();
    } catch (err: any) {
      toast.error(
        `Yorliq ma'lumotlarini olishda xatolik: ${
          err.response?.data?.detail ||
          err.message ||
          "Serverga ulanishda muammo"
        }`
      );
      console.error("API xatosi:", err);
    } finally {
      setPrintingProductId(null);
    }
  };

  const handleTogglePrintSelection = (productId: number) => {
    setSelectedProductsToPrint((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };
  const handleSelectAllForPrint = (selectAll: boolean) => {
    const newSelections: Record<number, boolean> = {};
    eligibleProductsForPrint.forEach((p) => {
      newSelections[p.id] = selectAll;
    });
    setSelectedProductsToPrint(newSelections);
  };
  const getSelectedItemsForActualPrint = () =>
    eligibleProductsForPrint.filter((p) => selectedProductsToPrint[p.id]);

  const formatIdentifierForDisplay = (idStr: string | null | undefined) => {
    if (!idStr) return "-";
    const ids = idStr.split(/[\s,;]+/).filter(Boolean);
    if (ids.length === 0) return "-";
    if (ids.length === 1) return ids[0];
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help underline decoration-dotted">
              {ids[0]} ({ids.length} ta) <Info size={12} className="inline ml-1" />
            </span>
          </TooltipTrigger>
          <TooltipContent
            className="max-w-xs break-words bg-popover text-popover-foreground shadow-md rounded-md p-2"
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
          <div className="flex gap-2 flex-wrap">
            <Button
              className="flex items-center gap-2 shadow-sm"
              onClick={() => {
                setAddDialogInitialView("phone");
                setIsAddProductDialogOpen(true);
              }}
            >
              <Smartphone className="h-4 w-4" />
              Telefon qo‘shish
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 shadow-sm"
              onClick={() => {
                setAddDialogInitialView("accessory");
                setIsAddProductDialogOpen(true);
              }}
            >
              <Headphones className="h-4 w-4" />
              Aksesuar qo‘shish
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 shadow-sm"
              onClick={() => setIsAddCategoryModalOpen(true)}
            >
              <FolderPlus className="h-4 w-4" />
              Kategoriya qo‘shish
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 shadow-sm"
              onClick={handleOpenPrintModal}
              title="Ommaviy chop etish"
            >
              <Printer className="h-4 w-4" />
              Ommaviy Chop etish
            </Button>
          </div>
        </header>
        <Card className="flex-grow flex flex-col overflow-hidden shadow-sm border">
          <CardHeader className="border-b px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <CardTitle className="text-lg sm:text-xl">
                  Mahsulotlar Ro‘yxati
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-0.5">
                  Jami {filteredProducts.length} ta ({products.length} tadan).
                </CardDescription>
              </div>
              <div className="relative w-full md:w-64 lg:w-72">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Qidirish (nom, shtrix/IMEI...)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 text-sm w-full"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-grow overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
                <p>Yuklanmoqda...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-destructive">
                <p className="font-semibold">Xatolik:</p>
                <p>{error}</p>
                <Button
                  onClick={fetchProducts}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  Qayta urinish
                </Button>
              </div>
            ) : filteredProducts.length > 0 ? (
              <Table className="text-xs sm:text-sm">
                <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[180px] px-2 py-2.5 sm:px-4">
                      Nomi
                    </TableHead>
                    <TableHead className="hidden xl:table-cell px-2 sm:px-4">
                      Shtrix/IMEI
                    </TableHead>
                    <TableHead className="px-2 sm:px-4">Turi</TableHead>
                    <TableHead className="px-2 sm:px-4">Sotish narxi</TableHead>
                    <TableHead className="hidden md:table-cell px-2 sm:px-4">
                      Olingan narx
                    </TableHead>
                    <TableHead className="hidden lg:table-cell px-2 sm:px-4">
                      Xotira
                    </TableHead>
                    <TableHead className="hidden sm:table-cell px-2 sm:px-4">
                      Rangi
                    </TableHead>
                    <TableHead className="text-right w-[130px] px-2 py-2.5 sm:px-4">
                      Amallar
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium px-2 py-2.5 sm:px-4">
                        {p.name || "-"}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell px-2 sm:px-4">
                        {formatIdentifierForDisplay(p.barcode)}
                      </TableCell>
                      <TableCell className="px-2 sm:px-4">
                        {determineProductTypeForDisplay(p)}
                      </TableCell>
                      <TableCell className="px-2 sm:px-4">
                        {p.price_uzs && parseFloat(p.price_uzs) > 0
                          ? formatPriceForTable(p.price_uzs, "so'm")
                          : p.price_usd && parseFloat(p.price_usd) > 0
                          ? formatPriceForTable(p.price_usd, "$")
                          : "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell px-2 sm:px-4">
                        {p.purchase_price_usd && parseFloat(p.purchase_price_usd) > 0
                         ? formatPriceForTable(p.purchase_price_usd, "$")
                         : p.purchase_price_uzs && parseFloat(p.purchase_price_uzs) > 0
                         ? formatPriceForTable(p.purchase_price_uzs, "so'm")
                         : "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell px-2 sm:px-4">
                        {p.storage_capacity || "-"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell px-2 sm:px-4">
                        {p.color || "-"}
                      </TableCell>
                      <TableCell className="text-right px-2 py-2.5 sm:px-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-sky-600 hover:bg-sky-100"
                          onClick={() => printSingleProductWithApiData(p)}
                          title="Yorliq chop etish"
                          disabled={printingProductId === p.id || !p.barcode}
                        >
                          {printingProductId === p.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Printer className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-primary hover:bg-primary/10 ml-1"
                          onClick={() => openEditDialog(p)}
                          title="Tahrirlash"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10 ml-1"
                          onClick={() => openDeleteDialog(p)}
                          title="Arxivlash"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 sm:p-10">
                <PackageSearch className="w-16 h-16 sm:w-20 sm:h-20 text-muted-foreground mb-4 sm:mb-6" />
                <p className="text-md sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">
                  {search
                    ? "Qidiruv bo'yicha mahsulot topilmadi"
                    : "Hozircha mahsulotlar yo'q"}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
                  {search
                    ? "Boshqa kalit so'z bilan qidirib ko'ring."
                    : "Yangi mahsulot qo'shish uchun yuqoridagi tugmalardan foydalaning."}
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
          />
        )}
        {isEditDialogOpen && selectedProductForEdit && (
          <EditProductDialog // Bu komponentni ham yaratishingiz kerak
            open={isEditDialogOpen}
            onOpenChange={(isOpen) => {
              setIsEditDialogOpen(isOpen);
              if (!isOpen) setSelectedProductForEdit(null);
            }}
            product={selectedProductForEdit}
            onProductSuccessfullyEdited={handleProductSuccessfullyEdited}
          />
        )}
        <ShadDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <ShadDialogContent>
            <ShadDialogHeader>
              <ShadDialogTitle>Arxivlashni Tasdiqlang</ShadDialogTitle>
              <ShadDialogDescription className="mt-2">
                {productToDelete
                  ? `"${productToDelete.name}"ni arxivlaysizmi?`
                  : "Mahsulotni arxivlash."}
              </ShadDialogDescription>
            </ShadDialogHeader>
            <ShadDialogFooter className="mt-5">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setProductToDelete(null);
                }}
              >
                Bekor
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirmation}>
                Ha, Arxivlash
              </Button>
            </ShadDialogFooter>
          </ShadDialogContent>
        </ShadDialog>
        <ShadDialog
          open={isAddCategoryModalOpen}
          onOpenChange={(isOpen) => {
            setIsAddCategoryModalOpen(isOpen);
            if (!isOpen)
              setNewCategoryData({
                name: "",
                description: "",
                barcode_prefix: "",
              });
          }}
        >
          <ShadDialogContent className="sm:max-w-md">
            <ShadDialogHeader>
              <ShadDialogTitle>Yangi Kategoriya</ShadDialogTitle>
              <ShadDialogDescription>
                Yangi kategoriya kiriting.
              </ShadDialogDescription>
            </ShadDialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="catName" className="text-right col-span-1">
                  Nomi <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="catName"
                  value={newCategoryData.name}
                  onChange={(e) =>
                    setNewCategoryData({
                      ...newCategoryData,
                      name: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="catDesc" className="text-right col-span-1">
                  Tavsifi
                </Label>
                <Input
                  id="catDesc"
                  value={newCategoryData.description}
                  onChange={(e) =>
                    setNewCategoryData({
                      ...newCategoryData,
                      description: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="catPrefix" className="text-right col-span-1">
                  Shtrix Prefiksi
                </Label>
                <Input
                  id="catPrefix"
                  value={newCategoryData.barcode_prefix}
                  onChange={(e) =>
                    setNewCategoryData({
                      ...newCategoryData,
                      barcode_prefix: e.target.value,
                    })
                  }
                  className="col-span-3"
                  placeholder="Ixtiyoriy"
                />
              </div>
            </div>
            <ShadDialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddCategoryModalOpen(false);
                  setNewCategoryData({
                    name: "",
                    description: "",
                    barcode_prefix: "",
                  });
                }}
              >
                Bekor
              </Button>
              <Button
                onClick={handleSaveNewCategory}
                disabled={isSubmittingCategory}
              >
                {isSubmittingCategory ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Saqlash
              </Button>
            </ShadDialogFooter>
          </ShadDialogContent>
        </ShadDialog>
        <ShadDialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
          <ShadDialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
            <ShadDialogHeader>
              <ShadDialogTitle>Ommaviy Chop Etish (50x30mm)</ShadDialogTitle>
              <ShadDialogDescription>
                Chop etish uchun mahsulotlarni tanlang. (Narx va shtrix raqami yorliqda ko'rsatilmaydi)
              </ShadDialogDescription>
            </ShadDialogHeader>
            <div className="my-4 flex items-center space-x-2">
              <Checkbox
                id="selectAllPrint"
                checked={
                  eligibleProductsForPrint.length > 0 &&
                  eligibleProductsForPrint.every(
                    (p) => selectedProductsToPrint[p.id]
                  )
                }
                onCheckedChange={(c) => handleSelectAllForPrint(Boolean(c))}
              />
              <Label htmlFor="selectAllPrint">
                Hammasini tanlash ({getSelectedItemsForActualPrint().length} ta)
              </Label>
            </div>
            <div className="flex-grow overflow-auto p-1 bg-muted/30 rounded-md border">
              {eligibleProductsForPrint.length > 0 ? (
                <div className="space-y-2 p-2">
                  {eligibleProductsForPrint.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-2.5 border rounded-md bg-background hover:bg-muted/50 shadow-sm"
                    >
                      <Checkbox
                        id={`pc-${p.id}`}
                        checked={!!selectedProductsToPrint[p.id]}
                        onCheckedChange={() => handleTogglePrintSelection(p.id)}
                        className="h-5 w-5"
                      />
                      <Label
                        htmlFor={`pc-${p.id}`}
                        className="flex-grow cursor-pointer flex justify-between items-center"
                      >
                        <div>
                          <div className="font-semibold text-sm">{p.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {p.storage_capacity && `${p.storage_capacity}`}
                            {determineProductTypeForDisplay(p) === "iPhone" &&
                              p.battery_health &&
                              ` | Bat: ${p.battery_health}%`}
                          </div>
                        </div>
                        <div className="w-32 h-12 flex items-center justify-center border rounded-sm bg-white p-0.5 ml-2 shrink-0">
                          {p.barcode && (
                            <BarcodeDisplay
                              value={p.barcode}
                              barWidth={0.6}
                              barHeight={18}
                              fontSize={0}
                              textMargin={0}
                              displayValue={false}
                            />
                          )}
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-6">
                  Mos mahsulotlar yo'q.
                </p>
              )}
            </div>
            <ShadDialogFooter className="mt-5 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsPrintModalOpen(false)}>
                Yopish
              </Button>
              <Button
                onClick={() => printContentBulk(getSelectedItemsForActualPrint())}
                disabled={getSelectedItemsForActualPrint().length === 0}
              >
                <Printer className="mr-2 h-4 w-4" />
                Tanlanganlarni Chop etish (
                {getSelectedItemsForActualPrint().length})
              </Button>
            </ShadDialogFooter>
          </ShadDialogContent>
        </ShadDialog>
        {/* Global stillar kerak bo'lsa, bu yerga yoki alohida CSS fayliga qo'shing */}
      </div>
    </TooltipProvider>
  );
}