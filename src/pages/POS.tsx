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
import { Button } from "@/components/ui/button"; // Shadcn komponentlari joylashuviga qarab
import { Input } from "@/components/ui/input";   // Shadcn komponentlari joylashuviga qarab
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"; // Shadcn komponentlari joylashuviga qarab

// --- BU YERGA AKTUAL KURSNI KIRITING YOKI DINAMIK OLING ---
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

// --- Interfeyslar (ProductFromApi ProductCard da ishlatiladi) ---
interface ProductFromApi {
  id: number;
  name: string;
  price_uzs?: string | null;
  price_usd?: string | null;
  quantity_in_stock: number;
  barcode?: string | null;
  type?: "phone" | "accessory";
  category_name?: string;
}

// getDisplayPriceElements ProductCard da ishlatiladi, shuning uchun uni ham oldinroq joylashtiramiz
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
// BU YERGA ProductCard komponentini joylashtiramiz
const ProductCard = ({ product, disabled, onCardClick }: {
  product: ProductFromApi; // ProductFromApi interfeysi yuqorida aniqlangan
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
            {getDisplayPriceElements(product)} {/* getDisplayPriceElements yuqorida aniqlangan */}
        </div>
      </div>
      <div className="mt-1 text-center text-xs text-gray-400 pt-2 border-t border-gray-200/80">
        {disabled ? "Mahsulot tugagan" : "Sotish uchun bosing"}
      </div>
    </div>
  );
};
// --- ProductCard Komponenti TUGADI ---


const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+998\d{9}$/;
  return phoneRegex.test(phone);
};

interface SalePayloadItem {
  product_id: number;
  quantity: number;
  price: string;
}

interface NewCustomerDataForSale {
    full_name: string;
    phone_number: string;
    address?: string;
    // email?: string;
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
  results: ProductFromApi[]; // Bu ProductFromApi yuqorida ProductCard uchun aniqlangan
}

const API_BASE_URL = "https://smartphone777.pythonanywhere.com/api";
const API_POS_PRODUCTS_URL = (kassaId: number, searchTerm?: string, pageUrl?: string) => {
  if (pageUrl) return pageUrl;
  let url = `${API_BASE_URL}/pos/products/?kassa_id=${kassaId}`;
  if (searchTerm) {
    url += `&search=${encodeURIComponent(searchTerm)}`;
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
  // const [customerEmail, setCustomerEmail] = useState<string>("");

  const currentKassaId = useMemo(() => currentStore?.id || 1, [currentStore]);

  const fetchProducts = useCallback(async (kassaId: number, search: string, isLoadMore = false, url?: string) => {
    if (isLoadMore) setIsLoadingMore(true); else setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) { setError("Iltimos, tizimga kiring."); if (isLoadMore) setIsLoadingMore(false); else setIsLoading(false); return; }
      const targetUrl = url || API_POS_PRODUCTS_URL(kassaId, search);
      const response = await axios.get<PaginatedProductResponse | ProductFromApi[]>(targetUrl, { headers: { Authorization: `Bearer ${token}` }, timeout: 20000 });
      let fetchedProductsData: ProductFromApi[];
      let nextPage: string | null = null;
      if ('results' in response.data && Array.isArray(response.data.results)) {
        fetchedProductsData = response.data.results;
        nextPage = response.data.next;
      } else if (Array.isArray(response.data)) {
        fetchedProductsData = response.data;
      } else { fetchedProductsData = []; }
      const productsWithNormalizedData = fetchedProductsData.map((p) => ({ ...p, price_uzs: p.price_uzs?.toString() || null, price_usd: p.price_usd?.toString() || null, type: p.type || (p.name.toLowerCase().includes("iphone") || p.name.toLowerCase().includes("phone") || p.category_name?.toLowerCase().includes("phone") ? "phone" : "accessory"), barcode: p.barcode?.trim() || null, }));
      if (isLoadMore) setProducts((prev) => [...prev, ...productsWithNormalizedData]); else setProducts(productsWithNormalizedData);
      setNextPageUrl(nextPage);
    } catch (err: any) {
      console.error("POS API xatosi:", err);
      if (err.response?.status === 401) setError("Sessiya tugadi. Iltimos, tizimga qayta kiring."); else if (err.code === "ECONNABORTED") setError("So‘rov muddati tugadi. Internetni tekshiring."); else setError("Mahsulotlarni olishda xato: " + (err.response?.data?.detail || err.message || "Noma'lum xato"));
      if (!isLoadMore) setProducts([]);
    } finally { if (isLoadMore) setIsLoadingMore(false); else setIsLoading(false); }
  }, []);

  useEffect(() => { const timerId = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500); return () => clearTimeout(timerId); }, [searchTerm]);
  useEffect(() => { if (currentKassaId) fetchProducts(currentKassaId, debouncedSearchTerm, false); else { setError("Kassa tanlanmagan. Sozlamalarni tekshiring."); setIsLoading(false); setProducts([]); setNextPageUrl(null); } }, [currentKassaId, debouncedSearchTerm, fetchProducts]);

  const openSaleModalWithProduct = (product: ProductFromApi) => {
    if (product.quantity_in_stock <= 0) { toast.warning(`"${product.name}" mahsuloti tugagan.`); return; }
    const hasUzs = product.price_uzs && parseFloat(product.price_uzs) > 0;
    const hasUsd = product.price_usd && parseFloat(product.price_usd) > 0;
    if (!hasUzs && !hasUsd) { toast.warning(`"${product.name}" uchun narx belgilanmagan.`); return; }
    setSelectedProductForSale(product);
    if (hasUzs) { setSaleCurrency('UZS'); setActualSalePrice(product.price_uzs!); }
    else if (hasUsd) { setSaleCurrency('USD'); setActualSalePrice(product.price_usd!); }
    // setCustomerFullName(""); setCustomerPhoneNumber(""); setCustomerAddress(""); setCustomerEmail("");
    setIsSaleModalOpen(true);
  };

  const handleBarcodeScanAndOpenModal = (scannedBarcode: string) => {
    if (!scannedBarcode.trim()) return;
    const code = scannedBarcode.trim().toUpperCase();
    const found = products.find((p) => p.barcode?.trim().toUpperCase() === code);
    if (found) { openSaleModalWithProduct(found); setBarcodeTerm(""); }
    else { toast.error(`"${code}" shtrix kodli mahsulot topilmadi.`); barcodeInputRef.current?.select(); }
  };

  const handleSubmitDirectSale = async () => {
    if (!selectedProductForSale || !currentKassaId) {
      toast.error("Mahsulot yoki kassa tanlanmagan!");
      return;
    }

    const salePriceNum = parseFloat(actualSalePrice);
    if (isNaN(salePriceNum) || salePriceNum <= 0) {
        toast.error(`Sotish narxi (${saleCurrency}) noto'g'ri kiritilgan yoki 0.`);
        return;
    }

    if (!customerFullName.trim()) { toast.error("Mijozning ism-familiyasi kiritilishi shart."); return; }
    if (!customerPhoneNumber.trim()) { toast.error("Mijozning telefon raqami kiritilishi shart."); return; }
    if (!validatePhoneNumber(customerPhoneNumber.trim())) { toast.error("Telefon raqami noto'g'ri formatda. Masalan: +998901234567"); return; }
    
    setIsSubmittingDirectSale(true);

    const newCustomerPayloadForSale: NewCustomerDataForSale = {
        full_name: customerFullName.trim(),
        phone_number: customerPhoneNumber.trim(),
    };
    if (customerAddress.trim()) newCustomerPayloadForSale.address = customerAddress.trim();
    // if (customerEmail.trim()) newCustomerPayloadForSale.email = customerEmail.trim();

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

      let saleMessage = `"${selectedProductForSale.name}" ${salePriceNum.toLocaleString()} ${saleCurrency} ga sotildi!`;
      if (saleCurrency === 'USD' && UZS_USD_RATE > 0) {
        const uzsEquivalent = salePriceNum * UZS_USD_RATE;
        saleMessage += ` (Taxminan ${formatPriceUZS(uzsEquivalent).replace(" so'm", "")} UZS)`;
      }
      toast.success(saleMessage);
      setIsSaleModalOpen(false);
      fetchProducts(currentKassaId, debouncedSearchTerm, false); 
      setSelectedProductForSale(null);
    } catch (err: any) {
        console.error("Sotuvda xato:", err);
        let errorMessage = "Sotuvni amalga oshirishda xatolik: ";
        if (err.response?.data) {
            const errors = err.response.data;
            if (typeof errors === "string") { errorMessage += errors;
            } else if (typeof errors === "object") {
                if (errors.customer_id && Array.isArray(errors.customer_id)) { errorMessage += `Mijoz ID: ${errors.customer_id.join(', ')}. `; }
                if (errors.new_customer) {
                    if (Array.isArray(errors.new_customer)) { errorMessage += `Yangi mijoz: ${errors.new_customer.join(', ')}. `;
                    } else if (typeof errors.new_customer === 'object') {
                        let ncErrorString = "Yangi mijoz ma'lumotlarida xatolik: ";
                        Object.entries(errors.new_customer).forEach(([key, value]) => { ncErrorString += `${key}: ${Array.isArray(value) ? value.join(', ') : value}. `; });
                        errorMessage += ncErrorString;
                    } else { errorMessage += `Yangi mijoz: ${errors.new_customer.toString()}. `; }
                }
                Object.keys(errors).filter(key => key !== 'customer_id' && key !== 'new_customer').forEach((key) => {
                        const errorValue = errors[key];
                        let fieldError = "";
                        if (Array.isArray(errorValue)) fieldError = errorValue.join(", ");
                        else if (typeof errorValue === 'object' && errorValue !== null) fieldError = JSON.stringify(errorValue);
                        else fieldError = errorValue.toString();
                        errorMessage += `${key}: ${fieldError}. `;
                    });
            } else { errorMessage += "Noma'lum server xatosi tuzilmasi."; }
        } else { errorMessage += err.message || "Server bilan aloqa yo'q."; }
        toast.error(errorMessage, { duration: 10000 });
    }
    finally { setIsSubmittingDirectSale(false); }
  };

  const hasUzsPriceForSelected = selectedProductForSale?.price_uzs && parseFloat(selectedProductForSale.price_uzs) > 0;
  const hasUsdPriceForSelected = selectedProductForSale?.price_usd && parseFloat(selectedProductForSale.price_usd) > 0;

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
              className="pl-10 pr-3 py-2.5 w-full text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary"
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
              className="pl-10 pr-3 py-2.5 w-full text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary"
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
                <p className="text-red-600 font-medium">Xatolik!</p>
                <p className="text-xs text-red-500 mt-1">{error}</p>
                <Button onClick={() => {fetchProducts(currentKassaId, debouncedSearchTerm, false);}} variant="destructive" size="sm" className="mt-3">
                    Qayta urinish
                </Button>
            </div>
        ) : products.length > 0 ? (
            <>
                <div className="flex-grow overflow-y-auto pr-2 pb-4 custom-scrollbar min-h-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5">
                        {/* BU YERDA ProductCard ishlatiladi */}
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} disabled={product.quantity_in_stock <= 0} onCardClick={openSaleModalWithProduct} />
                        ))}
                    </div>
                </div>
                {nextPageUrl && (
                    <div className="flex justify-center pt-2 pb-4 flex-shrink-0">
                        <Button onClick={() => fetchProducts(currentKassaId, debouncedSearchTerm, true, nextPageUrl)} disabled={isLoadingMore} variant="outline">
                            {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                            Ko'proq yuklash
                        </Button>
                    </div>
                )}
            </>
        ) : ( 
            <div className="text-center text-gray-500 p-8 border-dashed border-2 border-gray-300 rounded-md flex-grow flex flex-col items-center justify-center">
                <Search className="h-12 w-12 mb-3 text-gray-400" />
                <p>Mahsulotlar topilmadi</p>
                {debouncedSearchTerm && <p className="text-sm mt-1">"{debouncedSearchTerm}" uchun natija yo'q.</p>}
            </div>
        )}
      </div>

      {selectedProductForSale && (
        <Dialog open={isSaleModalOpen} onOpenChange={(isOpen) => { setIsSaleModalOpen(isOpen); if (!isOpen) setSelectedProductForSale(null); }} >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Sotuv: {selectedProductForSale.name || "Nomsiz"}</DialogTitle>
                <DialogDescription>
                    Mahsulot sotuvi uchun mijoz ma'lumotlarini kiriting.
                    <span className="text-destructive"> *</span> bilan belgilangan maydonlar majburiy.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-3 custom-scrollbar">
              <div className="text-sm space-y-1">
                <p><strong>Asl narxi:</strong> <span className="flex flex-col">{getDisplayPriceElements(selectedProductForSale)}</span></p>
                <p><strong>Omborda:</strong> {selectedProductForSale.quantity_in_stock} dona</p>
              </div>

              <div className="space-y-3 border-t pt-4 mt-3">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <UserPlus className="mr-2 h-4 w-4 text-gray-500"/>
                    Mijoz Ma'lumotlari (Majburiy)
                </h3>
                <div>
                    <label htmlFor="modalCustomerFullName" className="block text-xs font-medium text-gray-700 mb-0.5">
                        Mijoz ism-familiyasi <span className="text-destructive">*</span>
                    </label>
                    <Input id="modalCustomerFullName" type="text" value={customerFullName} onChange={(e) => setCustomerFullName(e.target.value)} placeholder="Ism Familiya" />
                </div>
                <div>
                    <label htmlFor="modalCustomerPhoneNumber" className="block text-xs font-medium text-gray-700 mb-0.5">
                        Telefon raqami <span className="text-destructive">*</span>
                    </label>
                    <Input id="modalCustomerPhoneNumber" type="text" value={customerPhoneNumber} onChange={(e) => setCustomerPhoneNumber(e.target.value)} placeholder="+998901234567" />
                </div>
                <div>
                    <label htmlFor="modalCustomerAddress" className="block text-xs font-medium text-gray-700 mb-0.5">
                        Manzil {/* Agar majburiy bo'lsa: <span className="text-destructive">*</span> */}
                    </label>
                    <Input id="modalCustomerAddress" type="text" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Toshkent sh., Chilanzar tumani (ixtiyoriy)" />
                </div>
                {/* <div>
                    <label htmlFor="modalCustomerEmail" className="block text-xs font-medium text-gray-700 mb-0.5">Email</label>
                    <Input id="modalCustomerEmail" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="example@mail.com (ixtiyoriy)" />
                </div> */}
              </div>

              <div className="space-y-3 border-t pt-4 mt-3">
                <h3 className="text-sm font-medium text-gray-700">To'lov: Naqd</h3>
                {hasUzsPriceForSelected && hasUsdPriceForSelected && (
                    <div className="flex items-center space-x-2">
                        <p className="text-xs font-medium text-gray-600">Sotuv valyutasi:</p>
                        <Button variant={saleCurrency === 'UZS' ? 'default' : 'outline'} size="sm" onClick={() => { setSaleCurrency('UZS'); if (selectedProductForSale.price_uzs) setActualSalePrice(selectedProductForSale.price_uzs); }}>UZS</Button>
                        <Button variant={saleCurrency === 'USD' ? 'default' : 'outline'} size="sm" onClick={() => { setSaleCurrency('USD'); if (selectedProductForSale.price_usd) setActualSalePrice(selectedProductForSale.price_usd); }}>USD</Button>
                    </div>
                )}
                <div>
                    <label htmlFor="salePriceNaqd" className="block text-sm font-medium text-gray-700 mb-1">Sotish narxi ({saleCurrency})</label>
                    <Input id="salePriceNaqd" type="number" value={actualSalePrice} onChange={(e) => setActualSalePrice(e.target.value)} placeholder={`Narxni ${saleCurrency} da kiriting`} min="0"/>
                </div>
                { (saleCurrency === 'UZS' && hasUzsPriceForSelected) || (saleCurrency === 'USD' && hasUsdPriceForSelected) ? (
                  <Button variant="outline" size="sm" onClick={() => { if (saleCurrency === 'UZS' && selectedProductForSale.price_uzs) setActualSalePrice(selectedProductForSale.price_uzs); else if (saleCurrency === 'USD' && selectedProductForSale.price_usd) setActualSalePrice(selectedProductForSale.price_usd); }}>
                    Asl narxni ({saleCurrency}) ishlatish
                  </Button>
                ) : null }
              </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsSaleModalOpen(false)}>Bekor qilish</Button>
                <Button onClick={handleSubmitDirectSale} disabled={isSubmittingDirectSale || parseFloat(actualSalePrice) <= 0 || isNaN(parseFloat(actualSalePrice))} className="bg-green-500 hover:bg-green-600 text-white">
                    {isSubmittingDirectSale && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sotish
                </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}