import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import axios from "axios";
import { useApp } from "@/context/AppContext"; // Kontekst joylashuviga qarab o'zgartiring
import {
  Loader2,
  Search,
  Tag,
  ChevronDown,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

// --- BU YERGA AKTUAL KURSNI KIRITING YOKI DINAMIK OLING ---
// DIQQAT: Bu qiymatni dinamik olish tavsiya etiladi!
// Bu konstanta endi faqat sotuvdan keyingi informatsion xabarda ishlatiladi
const UZS_USD_RATE = 12650;

// --- Util funksiyalar ---
const formatPriceUZS = (value?: string | number | null): string => {
  const num = parseFloat(value?.toString() || "0");
  return isNaN(num)
    ? ""
    : new Intl.NumberFormat("uz-UZ").format(Math.round(num)) + " so'm";
};

const formatPriceUSD = (value?: string | number | null): string => {
  const num = parseFloat(value?.toString() || "0");
  if (isNaN(num) || num === 0) return "";
  return (
    "$" +
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: num % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(num)
  );
};

// Telefon raqamini tekshirish endi "+" belgisisiz format uchun
const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^998\d{9}$/; // Format: 998XXXXXXXXX (masalan, 998901234567)
  return phoneRegex.test(phone);
};


// --- Interfeyslar ---
interface ProductFromApi {
  id: number;
  name: string;
  price_uzs?: string | null;
  price_usd?: string | null;
  quantity_in_stock: number;
  barcode?: string | null;
  type: "phone" | "accessory";
  category_name?: string;
}

interface SalePayloadItem {
  product_id: number;
  quantity: number;
  price: string;
}

interface NewCustomerDataForSale {
    full_name: string;
    phone_number: string; // Bu API ga +998... formatida yuboriladi
    address?: string;
}

interface SalePayload {
  items: SalePayloadItem[];
  payment_type: "Naqd";
  kassa_id: number;
  customer_id?: number | null;
  new_customer?: NewCustomerDataForSale | null;
  currency: "UZS" | "USD";
}

interface PaginatedProductResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: any[];
}


// --- getDisplayPriceElements ---
const getDisplayPriceElements = (product: ProductFromApi): JSX.Element => {
  const uzsPriceString = product.price_uzs && parseFloat(product.price_uzs) > 0 ? formatPriceUZS(product.price_uzs) : "";
  const usdPriceString = product.price_usd && parseFloat(product.price_usd) > 0 ? formatPriceUSD(product.price_usd) : "";

  if (uzsPriceString && usdPriceString) {
    return (
      <>
        <p className="text-lg font-bold text-primary leading-tight">{uzsPriceString}</p>
        <p className="text-sm font-semibold text-gray-600 leading-tight">{usdPriceString}</p>
      </>
    );
  } else if (uzsPriceString) {
    return <p className="text-xl font-bold text-primary leading-tight">{uzsPriceString}</p>;
  } else if (usdPriceString) {
    return <p className="text-xl font-bold text-primary leading-tight">{usdPriceString}</p>;
  }
  return <p className="text-lg font-bold text-destructive leading-tight">Narx N/A</p>;
};


// --- ProductCard Komponenti ---
const ProductCard = ({ product, disabled, onCardClick }: {
  product: ProductFromApi;
  disabled: boolean;
  onCardClick: (product: ProductFromApi) => void;
}) => {
  return (
    <div
      className={`bg-white p-3.5 rounded-lg shadow-md flex flex-col justify-between border ${
        disabled ? "opacity-60 cursor-not-allowed bg-gray-50" : "border-gray-200 hover:shadow-lg transition-all duration-200 ease-in-out cursor-pointer"
      } h-[11.5rem]`}
      onClick={() => !disabled && onCardClick(product)}
      title={disabled ? `${product.name || "Nomsiz"} (tugagan)` : `Sotish: ${product.name || "Nomsiz"}`}
    >
      <div className="flex-grow flex flex-col justify-start">
        <h3 className="font-semibold text-base mb-1 leading-snug truncate" title={product.name || "Nomsiz"}>
          {product.name || "Nomsiz"}
        </h3>
        <p className={`text-xs mb-2 ${ product.quantity_in_stock > 0 ? "text-gray-500" : "text-red-600 font-medium" }`}>
          {product.quantity_in_stock > 0 ? `${product.quantity_in_stock} dona mavjud` : "Tugagan"}
        </p>
        <div className="mt-auto mb-1">
            {getDisplayPriceElements(product)}
        </div>
      </div>
      <div className="mt-1 text-center text-xs text-gray-400 pt-2 border-t border-gray-200/80">
        {disabled ? "Mahsulot tugagan" : "Sotish uchun bosing"}
      </div>
    </div>
  );
};


// --- API URL manzillari ---
const API_BASE_URL = "https://smartphone777.pythonanywhere.com/api";
const API_POS_PRODUCTS_URL = (kassaId: number, searchTerm?: string, pageUrl?: string) => {
  if (pageUrl) return pageUrl;
  let url = `${API_BASE_URL}/pos/products/?kassa_id=${kassaId}`;
  if (searchTerm && searchTerm.trim() !== "") {
    url += `&search=${encodeURIComponent(searchTerm.trim())}`;
  }
  return url;
};
const API_CREATE_SALE_URL = `${API_BASE_URL}/sales/`;


// --- PosPage Komponenti ---
export default function PosPage() {
  const { currentStore } = useApp();
  const [products, setProducts] = useState<ProductFromApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [barcodeTerm, setBarcodeTerm] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [selectedProductForSale, setSelectedProductForSale] = useState<ProductFromApi | null>(null);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [actualSalePrice, setActualSalePrice] = useState<string>("");
  const [saleCurrency, setSaleCurrency] = useState<'UZS' | 'USD'>('UZS');
  const [isSubmittingDirectSale, setIsSubmittingDirectSale] = useState(false);

  const [customerFullName, setCustomerFullName] = useState<string>("");
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState<string>("");
  const [customerAddress, setCustomerAddress] = useState<string>("");

  const currentKassaId = useMemo(() => currentStore?.id || 1, [currentStore]);

  const fetchProducts = useCallback(async (kassaId: number, search: string, isLoadMore = false, url?: string) => {
    if (isLoadMore) setIsLoadingMore(true); else setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Avtorizatsiya qilinmagan. Iltimos, tizimga kiring.");
        if (isLoadMore) setIsLoadingMore(false); else setIsLoading(false);
        return;
      }
      const targetUrl = url || API_POS_PRODUCTS_URL(kassaId, search);
      const response = await axios.get<PaginatedProductResponse>(targetUrl, { headers: { Authorization: `Bearer ${token}` }, timeout: 20000 });

      let fetchedProductsData: any[] = response.data.results || [];
      let nextPage: string | null = response.data.next;

      const productsWithNormalizedData: ProductFromApi[] = fetchedProductsData.map((p: any) => {
        const pNameLower = p.name?.toLowerCase() || "";
        const pCategoryNameLower = p.category_name?.toLowerCase() || "";
        const isPhone = pCategoryNameLower.includes("telefon") ||
                        pCategoryNameLower.includes("phone") ||
                        pCategoryNameLower.includes("смартфон") ||
                        pNameLower.includes("phone") ||
                        pNameLower.includes("iphone") ||
                        pNameLower.includes("samsung") ||
                        pNameLower.includes("redmi") ||
                        pNameLower.includes("xiaomi") ||
                        pNameLower.includes("galaxy") ||
                        pNameLower.match(/\b(a|s|m|f|z)\d{1,2}\b/i);

        let priceUzsRaw = p.price_uzs?.toString() || null;
        let priceUsdRaw = p.price_usd?.toString() || null;

        let finalPriceUzs: string | null = null;
        let finalPriceUsd: string | null = null;

        const uzsNum = priceUzsRaw ? parseFloat(priceUzsRaw) : null;
        const usdNum = priceUsdRaw ? parseFloat(priceUsdRaw) : null;

        if (uzsNum !== null && uzsNum > 0) {
          finalPriceUzs = uzsNum.toString();
        }
        if (usdNum !== null && usdNum > 0) {
          finalPriceUsd = usdNum.toString();
        }
        
        // --- BU QISM HOZIR ISHLAMAYDI (KOMMENTDA) ---
        // Agar bitta valyutada narx bo'lmasa va ikkinchisida bo'lsa, UZS_USD_RATE orqali hisoblash
        // (faqat agar UZS_USD_RATE > 0 bo'lsa)
        /*
        if (finalPriceUzs && !finalPriceUsd && UZS_USD_RATE > 0) {
          finalPriceUsd = (parseFloat(finalPriceUzs) / UZS_USD_RATE).toFixed(2);
        } else if (finalPriceUsd && !finalPriceUzs && UZS_USD_RATE > 0) {
          finalPriceUzs = Math.round(parseFloat(finalPriceUsd) * UZS_USD_RATE).toString();
        }
        */
        // --- /KOMMENTDAGI QISM ---

        return {
          id: p.id,
          name: p.name,
          price_uzs: finalPriceUzs,
          price_usd: finalPriceUsd,
          quantity_in_stock: p.quantity_in_stock,
          barcode: p.barcode?.trim() || null,
          category_name: p.category_name,
          type: isPhone ? "phone" : "accessory",
        };
      });

      if (isLoadMore) {
        setProducts((prev) => [...prev, ...productsWithNormalizedData]);
      } else {
        setProducts(productsWithNormalizedData);
      }
      setNextPageUrl(nextPage);

    } catch (err: any) {
      console.error("POS API xatosi (fetchProducts):", err);
      if (err.response?.status === 401) {
        setError("Sessiya muddati tugagan. Iltimos, tizimga qayta kiring.");
      } else if (err.code === "ECONNABORTED") {
        setError("Serverga ulanishda vaqt tugadi. Internet aloqasini tekshiring yoki keyinroq urinib ko'ring.");
      } else {
        setError("Mahsulotlarni yuklashda xato yuz berdi: " + (err.response?.data?.detail || err.message || "Noma'lum server xatosi"));
      }
      if (!isLoadMore) setProducts([]);
    } finally {
      if (isLoadMore) setIsLoadingMore(false); else setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timerId = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timerId);
  }, [searchTerm]);

  useEffect(() => {
    if (currentKassaId) {
      fetchProducts(currentKassaId, debouncedSearchTerm, false);
    } else {
      setError("Kassa tanlanmagan. Sozlamalarni tekshiring yoki administratorga murojaat qiling.");
      setIsLoading(false);
      setProducts([]);
      setNextPageUrl(null);
    }
  }, [currentKassaId, debouncedSearchTerm, fetchProducts]);

  const openSaleModalWithProduct = (product: ProductFromApi) => {
    if (product.quantity_in_stock <= 0) {
      toast.warning(`"${product.name}" mahsuloti omborda tugagan.`);
      return;
    }
    const hasUzs = product.price_uzs && parseFloat(product.price_uzs) > 0;
    const hasUsd = product.price_usd && parseFloat(product.price_usd) > 0;

    if (!hasUzs && !hasUsd) {
      toast.warning(`"${product.name}" uchun narx belgilanmagan. Sotish mumkin emas.`);
      return;
    }
    setSelectedProductForSale(product);

    if (hasUzs) {
      setSaleCurrency('UZS');
      setActualSalePrice(product.price_uzs as string); // hasUzs tekshirilgan
    } else if (hasUsd) {
      setSaleCurrency('USD');
      setActualSalePrice(product.price_usd as string); // hasUsd tekshirilgan
    }
    setCustomerFullName("");
    setCustomerPhoneNumber("");
    setCustomerAddress("");
    setIsSaleModalOpen(true);
  };

  const handleBarcodeScanAndOpenModal = (scannedBarcode: string) => {
    if (!scannedBarcode.trim()) return;
    const code = scannedBarcode.trim().toUpperCase();
    const foundProduct = products.find((p) => p.barcode?.trim().toUpperCase() === code);
    if (foundProduct) {
      openSaleModalWithProduct(foundProduct);
      setBarcodeTerm("");
    } else {
      toast.error(`"${code}" shtrix kodli mahsulot joriy kassada topilmadi.`);
      barcodeInputRef.current?.select();
    }
  };

  const handleSubmitDirectSale = async () => {
    if (!selectedProductForSale || !currentKassaId) {
      toast.error("Sotuv uchun mahsulot yoki kassa tanlanmagan!");
      return;
    }

    const salePriceNum = parseFloat(actualSalePrice);
    if (isNaN(salePriceNum) || salePriceNum <= 0) {
        toast.error(`Sotish narxi (${saleCurrency}) noto'g'ri kiritilgan yoki 0 dan kichik/teng.`);
        return;
    }

    let newCustomerPayloadForSale: NewCustomerDataForSale | null = null;
    const trimmedPhoneNumber = customerPhoneNumber.trim();

    if (selectedProductForSale.type === 'phone') {
      if (!customerFullName.trim()) {
          toast.error("Mijozning ism-familiyasi kiritilishi shart (telefon sotuvi uchun).");
          return;
      }
      if (!trimmedPhoneNumber) {
          toast.error("Mijozning telefon raqami kiritilishi shart (telefon sotuvi uchun).");
          return;
      }
      if (!validatePhoneNumber(trimmedPhoneNumber)) {
          toast.error("Telefon raqami noto'g'ri formatda kiritilgan. Masalan: 998901234567");
          return;
      }
      newCustomerPayloadForSale = {
          full_name: customerFullName.trim(),
          phone_number: `+${trimmedPhoneNumber}`,
      };
      if (customerAddress.trim()) newCustomerPayloadForSale.address = customerAddress.trim();
    }

    setIsSubmittingDirectSale(true);

    const salePayload: SalePayload = {
      items: [{
        product_id: selectedProductForSale.id,
        quantity: 1,
        price: salePriceNum.toFixed(saleCurrency === 'UZS' ? 0 : 2)
      }],
      payment_type: "Naqd",
      kassa_id: currentKassaId,
      customer_id: null,
      new_customer: newCustomerPayloadForSale,
      currency: saleCurrency,
    };

    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(API_CREATE_SALE_URL, salePayload, { headers: { Authorization: `Bearer ${token}` } });

      let saleMessage = `"${selectedProductForSale.name}" mahsuloti ${salePriceNum.toLocaleString()} ${saleCurrency} ga muvaffaqiyatli sotildi!`;
      if (saleCurrency === 'USD' && UZS_USD_RATE > 0) {
        const uzsEquivalent = salePriceNum * UZS_USD_RATE;
        saleMessage += ` (Taxminan ${formatPriceUZS(uzsEquivalent).replace(" so'm", "")} UZS)`;
      }
      toast.success(saleMessage);
      setIsSaleModalOpen(false);
      fetchProducts(currentKassaId, debouncedSearchTerm, false);
      setSelectedProductForSale(null);
    } catch (err: any) {
        console.error("Sotuvni amalga oshirishda xato:", err);
        let errorMessage = "Sotuvni amalga oshirishda xatolik yuz berdi: ";
        if (err.response?.data) {
            const errors = err.response.data;
            if (typeof errors === "string") {
                errorMessage += errors;
            } else if (typeof errors === "object") {
                if (errors.new_customer && typeof errors.new_customer === 'object') {
                    let ncErrorString = "Yangi mijoz ma'lumotlarida xatolik: ";
                    Object.entries(errors.new_customer).forEach(([key, value]) => {
                        ncErrorString += `${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}. `;
                    });
                    errorMessage += ncErrorString;
                    // Boshqa xatoliklarni ham qo'shish (new_customer dan tashqari)
                    Object.keys(errors).filter(key => key !== 'new_customer').forEach((key) => {
                        const errorValue = errors[key];
                        errorMessage += `${key}: ${Array.isArray(errorValue) ? errorValue.join(", ") : String(errorValue)}. `;
                    });

                } else {
                    Object.keys(errors).forEach((key) => {
                        const errorValue = errors[key];
                        let fieldError = "";
                        if (Array.isArray(errorValue)) fieldError = errorValue.join(", ");
                        else if (typeof errorValue === 'object' && errorValue !== null) fieldError = JSON.stringify(errorValue);
                        else fieldError = String(errorValue);
                        errorMessage += `${key}: ${fieldError}. `;
                    });
                }
            } else {
                errorMessage += "Noma'lum server xatosi tuzilmasi.";
            }
        } else {
            errorMessage += err.message || "Server bilan aloqa yo'q yoki noma'lum xatolik.";
        }
        toast.error(errorMessage, { duration: 10000 });
    }
    finally {
      setIsSubmittingDirectSale(false);
    }
  };

  const hasUzsPriceForSelected = selectedProductForSale?.price_uzs && parseFloat(selectedProductForSale.price_uzs) > 0;
  const hasUsdPriceForSelected = selectedProductForSale?.price_usd && parseFloat(selectedProductForSale.price_usd) > 0;
  const isCustomerInfoRequired = selectedProductForSale?.type === 'phone';

  return (
    <div className="p-4 md:p-6 space-y-6 h-full flex flex-col bg-gray-100">
      <div className="flex-shrink-0">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Kassa (Do'kon: {currentStore?.name || `ID ${currentKassaId}`}) - Sotuv
        </h1>
      </div>
      <div className="w-full space-y-4 flex flex-col min-h-0 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-shrink-0">
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              ref={barcodeInputRef}
              type="text"
              placeholder="Shtrix kodni skanerlang yoki kiriting"
              className="pl-10 pr-3 py-2.5 w-full text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary h-11"
              value={barcodeTerm}
              onChange={(e) => setBarcodeTerm(e.target.value)}
              onKeyPress={(e) => { if (e.key === "Enter") { e.preventDefault(); handleBarcodeScanAndOpenModal(barcodeTerm); } }}
              autoFocus
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Mahsulot nomi bo'yicha qidirish..."
              className="pl-10 pr-3 py-2.5 w-full text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading && products.length === 0 ? (
            <div className="flex-grow flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        ) : error ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-red-300 bg-red-50 rounded-md">
                <p className="text-red-600 font-medium">Xatolik Yuz Berdi!</p>
                <p className="text-sm text-red-500 mt-1 whitespace-pre-line">{error}</p>
                <Button onClick={() => {fetchProducts(currentKassaId, debouncedSearchTerm, false);}} variant="destructive" size="sm" className="mt-3">
                    Qayta Yuklash
                </Button>
            </div>
        ) : products.length > 0 ? (
            <>
                <div className="flex-grow overflow-y-auto pr-2 pb-4 custom-scrollbar min-h-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5">
                        {products.map((product) => (
                            <ProductCard
                              key={product.id}
                              product={product}
                              disabled={product.quantity_in_stock <= 0}
                              onCardClick={openSaleModalWithProduct}
                            />
                        ))}
                    </div>
                </div>
                {nextPageUrl && (
                    <div className="flex justify-center pt-2 pb-4 flex-shrink-0">
                        <Button onClick={() => fetchProducts(currentKassaId, debouncedSearchTerm, true, nextPageUrl)} disabled={isLoadingMore} variant="outline">
                            {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                            Ko'proq mahsulot yuklash
                        </Button>
                    </div>
                )}
            </>
        ) : (
            <div className="text-center text-gray-500 p-8 border-dashed border-2 border-gray-300 rounded-md flex-grow flex flex-col items-center justify-center">
                <Search className="h-12 w-12 mb-3 text-gray-400" />
                <p>Hozircha mahsulotlar yo'q</p>
                {debouncedSearchTerm && <p className="text-sm mt-1">"{debouncedSearchTerm}" qidiruvi bo'yicha natija topilmadi.</p>}
            </div>
        )}
      </div>

      {selectedProductForSale && (
        <Dialog open={isSaleModalOpen} onOpenChange={(isOpen) => { setIsSaleModalOpen(isOpen); if (!isOpen) setSelectedProductForSale(null); }} >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Sotuv: {selectedProductForSale.name || "Nomsiz mahsulot"}</DialogTitle>
                <DialogDescription>
                    Mahsulot sotuvi uchun {isCustomerInfoRequired ? "mijoz ma'lumotlarini va " : ""}sotuv narxini kiriting.
                    {isCustomerInfoRequired && <><span className="text-destructive"> *</span> bilan belgilangan maydonlar majburiy.</>}
                    {isCustomerInfoRequired && <span className="block text-xs mt-1">Telefon raqamini 998901234567 formatida kiriting.</span>}
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-3 custom-scrollbar">
              <div className="text-sm space-y-1 bg-gray-50 p-3 rounded-md border">
                <p><strong>Asl narxi (API dan olingan):</strong></p>
                <div className="pl-2">{getDisplayPriceElements(selectedProductForSale)}</div>
                <p><strong>Omborda mavjud:</strong> {selectedProductForSale.quantity_in_stock} dona</p>
              </div>

              {isCustomerInfoRequired && (
                <div className="space-y-3 border-t pt-4 mt-3">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <UserPlus className="mr-2 h-4 w-4 text-gray-500"/>
                      Mijoz Ma'lumotlari (Telefon sotuvi uchun)
                  </h3>
                  <div>
                      <label htmlFor="modalCustomerFullName" className="block text-xs font-medium text-gray-700 mb-0.5">
                          Mijoz ism-familiyasi <span className="text-destructive">*</span>
                      </label>
                      <Input id="modalCustomerFullName" type="text" value={customerFullName} onChange={(e) => setCustomerFullName(e.target.value)} placeholder="Masalan: Alisher Valiev" />
                  </div>
                  <div>
                      <label htmlFor="modalCustomerPhoneNumber" className="block text-xs font-medium text-gray-700 mb-0.5">
                          Telefon raqami <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="modalCustomerPhoneNumber"
                        type="tel"
                        value={customerPhoneNumber}
                        onChange={(e) => {
                            const numericValue = e.target.value.replace(/[^0-9]/g, "");
                            setCustomerPhoneNumber(numericValue);
                        }}
                        placeholder="998901234567"
                        maxLength={12} // 998xxxxxxxxx
                      />
                  </div>
                  <div>
                      <label htmlFor="modalCustomerAddress" className="block text-xs font-medium text-gray-700 mb-0.5">
                          Manzil (ixtiyoriy)
                      </label>
                      <Input id="modalCustomerAddress" type="text" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Masalan: Toshkent sh., Chilanzar tumani" />
                  </div>
                </div>
              )}

              <div className="space-y-3 border-t pt-4 mt-3">
                <h3 className="text-sm font-medium text-gray-700">To'lov: Naqd</h3>
                {(hasUzsPriceForSelected && hasUsdPriceForSelected) && (
                    <div className="flex items-center space-x-2">
                        <p className="text-xs font-medium text-gray-600">Sotuv valyutasi:</p>
                        <Button variant={saleCurrency === 'UZS' ? 'default' : 'outline'} size="sm" onClick={() => { setSaleCurrency('UZS'); if (selectedProductForSale.price_uzs) setActualSalePrice(selectedProductForSale.price_uzs); }}>UZS</Button>
                        <Button variant={saleCurrency === 'USD' ? 'default' : 'outline'} size="sm" onClick={() => { setSaleCurrency('USD'); if (selectedProductForSale.price_usd) setActualSalePrice(selectedProductForSale.price_usd); }}>USD</Button>
                    </div>
                )}
                <div>
                    <label htmlFor="salePriceNaqd" className="block text-sm font-medium text-gray-700 mb-1">
                        Sotish narxi ({saleCurrency}) <span className="text-destructive">*</span>
                    </label>
                    <Input id="salePriceNaqd" type="number" value={actualSalePrice} onChange={(e) => setActualSalePrice(e.target.value)} placeholder={`Narxni ${saleCurrency} da kiriting`} min="0.01" step="any"/>
                </div>
                { ((saleCurrency === 'UZS' && hasUzsPriceForSelected) || (saleCurrency === 'USD' && hasUsdPriceForSelected)) && (
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-xs"
                    onClick={() => {
                      if (saleCurrency === 'UZS' && selectedProductForSale.price_uzs) {
                        setActualSalePrice(selectedProductForSale.price_uzs);
                      } else if (saleCurrency === 'USD' && selectedProductForSale.price_usd) {
                        setActualSalePrice(selectedProductForSale.price_usd);
                      }
                    }}>
                    Asl narxni ({saleCurrency}) ishlatish
                  </Button>
                )}
              </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsSaleModalOpen(false)} disabled={isSubmittingDirectSale}>Bekor qilish</Button>
                <Button
                  onClick={handleSubmitDirectSale}
                  disabled={
                    isSubmittingDirectSale ||
                    parseFloat(actualSalePrice) <= 0 ||
                    isNaN(parseFloat(actualSalePrice)) ||
                    (isCustomerInfoRequired &&
                        (
                            !customerFullName.trim() ||
                            !validatePhoneNumber(customerPhoneNumber.trim()) // Telefon raqami bo'sh emasligi va validatsiyadan o'tishi kerak
                        )
                    )
                  }
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                    {isSubmittingDirectSale && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sotish
                </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}