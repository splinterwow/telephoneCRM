import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import axios from "axios";
import { useApp } from "@/context/AppContext"; // Bu AppContext joylashuviga qarab o'zgartirilishi mumkin
import {
  Loader2,
  Search,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button"; // Shadcn/UI komponentlari joylashuviga qarab
import { Input } from "@/components/ui/input";   // Shadcn/UI komponentlari joylashuviga qarab
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"; // Shadcn/UI komponentlari joylashuviga qarab

// --- BU YERGA AKTUAL KURSNI KIRITING YOKI DINAMIK OLING ---
const UZS_USD_RATE = 12650; // Misol uchun! Haqiqiy kurs bilan almashtiring. Agar 0 yoki undan kichik bo'lsa, USD da sotishda ba'zi funksiyalar (masalan, UZS ekvivalentini ko'rsatish) cheklanishi mumkin.

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

// Bu funksiya endi payload uchun ishlatilmaydi, lekin display uchun foydali bo'lishi mumkin
const getPriceInUZS = (
  product: ProductFromApi,
  rate: number
): number => {
  if (product.price_uzs && parseFloat(product.price_uzs) > 0) {
    return parseFloat(product.price_uzs);
  } else if (product.price_usd && parseFloat(product.price_usd) > 0) {
    if (rate > 0) {
      return parseFloat(product.price_usd) * rate;
    } else {
      console.warn(
        `USD kursi (${rate}) noto'g'ri, "${product.name}" narxini UZS ga o'girib bo'lmadi.`
      );
      return 0;
    }
  }
  return 0;
};

const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+998\d{9}$/;
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
  type?: "phone" | "accessory";
  category_name?: string;
}

interface SalePayloadItem {
  product_id: number;
  quantity: number;
  price: string; // Bu tanlangan valyutadagi narx (string formatida)
}

interface SalePayload {
  items: SalePayloadItem[];
  payment_type: "Naqd";
  kassa_id: number;
  customer_id?: number | null;
  currency: "UZS" | "USD"; // <<< O'ZGARTIRILDI: Endi UZS yoki USD bo'lishi mumkin
}

interface CustomerPayload {
  full_name: string;
  phone_number: string;
  email?: string;
  address: string;
}

// --- API manzillari ---
const API_BASE_URL = "https://smartphone777.pythonanywhere.com/api";
const API_POS_PRODUCTS_URL = (kassaId: number) => `${API_BASE_URL}/pos/products/?kassa_id=${kassaId}`;
const API_CREATE_SALE_URL = `${API_BASE_URL}/sales/`;
const API_CREATE_CUSTOMER_URL = `${API_BASE_URL}/customers/`;


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

// --- PosPage Komponenti ---
export default function PosPage() {
  const { currentStore } = useApp();
  const [products, setProducts] = useState<ProductFromApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [barcodeTerm, setBarcodeTerm] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [selectedProductForSale, setSelectedProductForSale] = useState<ProductFromApi | null>(null);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [actualSalePrice, setActualSalePrice] = useState<string>("");
  const [saleCurrency, setSaleCurrency] = useState<'UZS' | 'USD'>('UZS');
  const [isSubmittingDirectSale, setIsSubmittingDirectSale] = useState(false);

  const [customerFullName, setCustomerFullName] = useState<string>("");
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState<string>("");
  const [customerAddress, setCustomerAddress] = useState<string>("");

  const currentKassaId = useMemo(() => currentStore?.id || 1, [currentStore]);

  const fetchProducts = useCallback(async (kassaId: number) => {
    setIsLoading(true); setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) { setError("Iltimos, tizimga kiring."); setIsLoading(false); return; }

      const response = await axios.get<{ results: ProductFromApi[] } | ProductFromApi[]>(
        API_POS_PRODUCTS_URL(kassaId),
        { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
      );

      const fetchedProducts = Array.isArray(response.data) ? response.data : response.data?.results || [];

      const productsWithNormalizedData = fetchedProducts.map((p) => ({
        ...p,
        price_uzs: p.price_uzs ? p.price_uzs.toString() : null,
        price_usd: p.price_usd ? p.price_usd.toString() : null,
        type: p.type || (p.name.toLowerCase().includes("iphone") || p.name.toLowerCase().includes("phone") || p.category_name?.toLowerCase().includes("phone") ? "phone" : "accessory"),
        barcode: p.barcode ? p.barcode.trim() : null,
      }));
      setProducts(productsWithNormalizedData);
    } catch (err: any) {
      console.error("POS API xatosi:", err);
      if (err.response?.status === 401) setError("Sessiya tugadi. Iltimos, tizimga qayta kiring.");
      else if (err.code === "ECONNABORTED") setError("So‘rov muddati tugadi. Internetni tekshiring.");
      else setError("Mahsulotlarni olishda xato: " + (err.response?.data?.detail || err.message || "Noma'lum xato"));
      setProducts([]);
    }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    if (currentKassaId) {
        fetchProducts(currentKassaId);
    }
    else { setError("Kassa tanlanmagan. Sozlamalarni tekshiring."); setIsLoading(false); }
  }, [currentKassaId, fetchProducts]);


  const openSaleModalWithProduct = (product: ProductFromApi) => {
    if (product.quantity_in_stock <= 0) { toast.warning(`"${product.name}" mahsuloti tugagan.`); return; }

    const hasUzsPrice = product.price_uzs && parseFloat(product.price_uzs) > 0;
    const hasUsdPrice = product.price_usd && parseFloat(product.price_usd) > 0;

    if (!hasUzsPrice && !hasUsdPrice) {
        toast.warning(`"${product.name}" uchun narx belgilanmagan.`);
        return;
    }

    setSelectedProductForSale(product);

    if (hasUzsPrice) {
      setSaleCurrency('UZS');
      setActualSalePrice(product.price_uzs!);
    } else if (hasUsdPrice) {
      setSaleCurrency('USD');
      setActualSalePrice(product.price_usd!);
    }

    setCustomerFullName("");
    setCustomerPhoneNumber("");
    setCustomerAddress("");
    setIsSaleModalOpen(true);
  };

  const handleBarcodeScanAndOpenModal = (scannedBarcode: string) => {
    if (!scannedBarcode.trim()) return;
    const trimmedBarcodeFromScanner = scannedBarcode.trim().toUpperCase();
    const productFound = products.find((p) => p.barcode && p.barcode.trim().toUpperCase() === trimmedBarcodeFromScanner);

    if (productFound) {
      openSaleModalWithProduct(productFound);
      setBarcodeTerm("");
    }
    else {
      toast.error(`"${trimmedBarcodeFromScanner}" shtrix kodli mahsulot topilmadi.`);
      if (barcodeInputRef.current) barcodeInputRef.current.select();
    }
  };

  const createCustomer = async (customerData: CustomerPayload): Promise<number | null> => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(API_CREATE_CUSTOMER_URL, customerData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Mijoz "${response.data.full_name}" muvaffaqiyatli yaratildi! ID: ${response.data.id}`);
      return response.data.id;
    } catch (err: any) {
      console.error("Mijoz yaratishda xato:", err);
      let errorMessage = "Mijozni yaratishda xatolik: ";
      if (err.response?.data) {
          const errors = err.response.data;
          if (typeof errors === "string") errorMessage += errors;
          else if (typeof errors === "object") Object.keys(errors).forEach((key) => { errorMessage += `${key}: ${Array.isArray(errors[key]) ? errors[key].join(", ") : errors[key]}. `; });
          else errorMessage += "Noma'lum server xatosi.";
      } else errorMessage += err.message || "Server bilan aloqa yo'q.";
      toast.error(errorMessage, { duration: 8000 });
      return null;
    }
  };

  // --- handleSubmitDirectSale FUNKSIYASI O'ZGARTIRILDI ---
  const handleSubmitDirectSale = async () => {
    if (!selectedProductForSale || !currentKassaId) {
      toast.error("Mahsulot yoki kassa tanlanmagan!");
      return;
    }

    const salePriceInput = parseFloat(actualSalePrice);

    // Narx validatsiyasi (foydalanuvchi kiritgan valyutadagi narx uchun)
    if (isNaN(salePriceInput) || salePriceInput <= 0) {
      let originalPriceExistsInSelectedCurrency = false;
      if (saleCurrency === 'UZS' && selectedProductForSale.price_uzs && parseFloat(selectedProductForSale.price_uzs) > 0) {
        originalPriceExistsInSelectedCurrency = true;
      } else if (saleCurrency === 'USD' && selectedProductForSale.price_usd && parseFloat(selectedProductForSale.price_usd) > 0) {
        originalPriceExistsInSelectedCurrency = true;
      }

      if (!originalPriceExistsInSelectedCurrency && salePriceInput <= 0) { // Narx belgilanmagan va 0 kiritilsa
          toast.error(`"${selectedProductForSale.name}" uchun ${saleCurrency} da narx belgilanmagan. Narxni kiriting.`);
          return;
      }
      toast.error(`Sotish narxi (${saleCurrency}) noto'g'ri kiritilgan yoki 0.`);
      return;
    }

    // Mijoz yaratish qismi (agar ma'lumotlar kiritilgan bo'lsa)
    let finalCustomerIdForPayload: number | null = null;
    if (customerFullName.trim() || customerPhoneNumber.trim() || customerAddress.trim()) {
      if (!customerFullName.trim()) { toast.error("Mijozning ism-familiyasi kiritilishi shart."); return; }
      if (!customerPhoneNumber.trim()) { toast.error("Mijozning telefon raqami kiritilishi shart."); return; }
      if (!validatePhoneNumber(customerPhoneNumber.trim())) { toast.error("Telefon raqami noto'g'ri formatda. Masalan: +998901234567"); return; }
      if (!customerAddress.trim()) { toast.error("Mijozning manzili kiritilishi shart."); return; }

      setIsSubmittingDirectSale(true); // Mijoz yaratish jarayonida ham loader ko'rsatish
      const newCustomerId = await createCustomer({
          full_name: customerFullName.trim(),
          phone_number: customerPhoneNumber.trim(),
          address: customerAddress.trim()
      });
      setIsSubmittingDirectSale(false); // Mijoz yaratish tugagach loader ni o'chirish

      if (!newCustomerId) return; // Agar mijoz yaratishda xato bo'lsa, jarayonni to'xtatamiz
      finalCustomerIdForPayload = newCustomerId;
    }

    // Backendga jo'natiladigan payloadni tayyorlash
    const payload: SalePayload = {
      items: [{
        product_id: selectedProductForSale.id,
        quantity: 1, // Hozircha bitta mahsulot sotiladi deb hisoblaymiz
        price: salePriceInput.toFixed(2) // Foydalanuvchi kiritgan narx (string formatida)
      }],
      payment_type: "Naqd",
      kassa_id: currentKassaId,
      customer_id: finalCustomerIdForPayload,
      currency: saleCurrency, // <<< O'ZGARTIRILDI: Tanlangan valyutani jo'natamiz
    };

    setIsSubmittingDirectSale(true);
    try {
      const token = localStorage.getItem("accessToken");
      // MUHIM: Backend API_CREATE_SALE_URL endi `currency` maydonini va unga mos narxni qabul qila olishi kerak!
      await axios.post(API_CREATE_SALE_URL, payload, { headers: { Authorization: `Bearer ${token}` } });

      let saleMessage = `"${selectedProductForSale.name}" ${salePriceInput.toLocaleString()} ${saleCurrency} ga sotildi!`;
      // Agar USD da sotilgan bo'lsa va UZS_USD_RATE mavjud bo'lsa, taxminiy UZS qiymatini ko'rsatamiz
      if (saleCurrency === 'USD' && UZS_USD_RATE > 0) {
        const uzsEquivalent = salePriceInput * UZS_USD_RATE;
        saleMessage += ` (Taxminan ${formatPriceUZS(uzsEquivalent).replace(" so'm", "")} UZS)`;
      } else if (saleCurrency === 'USD' && UZS_USD_RATE <= 0) {
        saleMessage += ` (UZS kursi kiritilmagan)`;
      }
      toast.success(saleMessage);

      setIsSaleModalOpen(false);
      fetchProducts(currentKassaId); // Mahsulotlar ro'yxatini yangilash
      setSelectedProductForSale(null);
      // Modal yopilganda kerakli state'lar tozalanishi mumkin (openSaleModalWithProduct da qisman qilinmoqda)
    } catch (err: any) {
        console.error("Sotuvda xato:", err);
        let errorMessage = "Sotuvni amalga oshirishda xatolik: ";
        if (err.response?.data) {
            const errors = err.response.data;
            if (typeof errors === "string") errorMessage += errors;
            else if (typeof errors === "object") {
              Object.keys(errors).forEach((key) => {
                const errorValue = errors[key];
                let fieldError = "";
                if (Array.isArray(errorValue)) fieldError = errorValue.join(", ");
                else if (typeof errorValue === 'object' && errorValue !== null) fieldError = JSON.stringify(errorValue);
                else fieldError = errorValue.toString();
                errorMessage += `${key}: ${fieldError}. `;
              });
            } else errorMessage += "Noma'lum server xatosi.";
        } else errorMessage += err.message || "Server bilan aloqa yo'q.";
        toast.error(errorMessage, { duration: 8000 });
    }
    finally { setIsSubmittingDirectSale(false); }
  };
  // --- handleSubmitDirectSale FUNKSIYASI O'ZGARTIRILDI (TUGADI) ---

  const filteredProducts = useMemo(() => {
    let tempProducts = products;
    if (searchTerm) {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        tempProducts = tempProducts.filter((product) =>
            product.name && product.name.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }
    return tempProducts;
  }, [products, searchTerm]);

  const hasUzsPriceForSelected = selectedProductForSale?.price_uzs && parseFloat(selectedProductForSale.price_uzs) > 0;
  const hasUsdPriceForSelected = selectedProductForSale?.price_usd && parseFloat(selectedProductForSale.price_usd) > 0;

  return (
    <div className="p-4 md:p-6 space-y-6 h-full flex flex-col bg-gray-100">
      <div className="flex-shrink-0">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Kassa (Do'kon: {currentStore?.name || `ID ${currentKassaId}`}) - Skaner Orqali Sotuv
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
              placeholder="Mahsulot nomi bo'yicha qidirish"
              className="pl-10 pr-3 py-2.5 w-full text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
            <div className="flex-grow flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        ) : error ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-red-300 bg-red-50 rounded-md">
                <p className="text-red-600 font-medium">Xatolik!</p>
                <p className="text-xs text-red-500 mt-1">{error}</p>
                <Button
                    onClick={() => {fetchProducts(currentKassaId);}}
                    variant="destructive"
                    size="sm"
                    className="mt-3"
                >
                    Qayta urinish
                </Button>
            </div>
        ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 overflow-y-auto pr-2 pb-4 custom-scrollbar flex-grow min-h-0">
                {filteredProducts.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        disabled={product.quantity_in_stock <= 0}
                        onCardClick={openSaleModalWithProduct}
                    />
                ))}
            </div>
        ) : (
            <div className="text-center text-gray-500 p-8 border-dashed border-2 border-gray-300 rounded-md flex-grow flex flex-col items-center justify-center">
                <Search className="h-12 w-12 mb-3 text-gray-400" />
                <p>Mahsulotlar topilmadi</p>
                {searchTerm && <p className="text-sm mt-1">"{searchTerm}" uchun natija yo'q.</p>}
            </div>
        )}
      </div>

      {selectedProductForSale && (
        <Dialog open={isSaleModalOpen} onOpenChange={(isOpen) => { setIsSaleModalOpen(isOpen); if (!isOpen) setSelectedProductForSale(null); }} >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader> <DialogTitle>Sotuv: {selectedProductForSale.name || "Nomsiz"}</DialogTitle> </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[75vh] overflow-y-auto pr-3 custom-scrollbar">
              <div className="text-sm space-y-1">
                <p><strong>Asl narxi:</strong> <span className="flex flex-col">{getDisplayPriceElements(selectedProductForSale)}</span></p>
                <p><strong>Omborda:</strong> {selectedProductForSale.quantity_in_stock} dona</p>
              </div>

              <div className="space-y-3 border-t pt-4 mt-3">
                <h3 className="text-sm font-medium text-gray-700">Yangi Mijoz Qo'shish (Ixtiyoriy)</h3>
                <div>
                    <label htmlFor="modalCustomerFullName" className="block text-xs font-medium text-gray-700 mb-0.5">Mijoz ism-familiyasi</label>
                    <Input id="modalCustomerFullName" type="text" value={customerFullName} onChange={(e) => setCustomerFullName(e.target.value)} placeholder="Ism Familiya" />
                </div>
                <div>
                    <label htmlFor="modalCustomerPhoneNumber" className="block text-xs font-medium text-gray-700 mb-0.5">Telefon raqami</label>
                    <Input id="modalCustomerPhoneNumber" type="text" value={customerPhoneNumber} onChange={(e) => setCustomerPhoneNumber(e.target.value)} placeholder="+998901234567" />
                </div>
                <div>
                    <label htmlFor="modalCustomerAddress" className="block text-xs font-medium text-gray-700 mb-0.5">Manzil</label>
                    <Input id="modalCustomerAddress" type="text" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Toshkent sh., Chilanzar tumani" />
                </div>
              </div>

              <div className="space-y-3 border-t pt-4 mt-3">
                <h3 className="text-sm font-medium text-gray-700">To'lov: Naqd</h3>
                {hasUzsPriceForSelected && hasUsdPriceForSelected && (
                    <div className="flex items-center space-x-2">
                        <p className="text-xs font-medium text-gray-600">Sotuv valyutasi:</p>
                        <Button
                            variant={saleCurrency === 'UZS' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                            setSaleCurrency('UZS');
                            if (selectedProductForSale.price_uzs) {
                                setActualSalePrice(selectedProductForSale.price_uzs);
                            }
                            }}
                        >
                            UZS
                        </Button>
                        <Button
                            variant={saleCurrency === 'USD' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                            setSaleCurrency('USD');
                            if (selectedProductForSale.price_usd) {
                                setActualSalePrice(selectedProductForSale.price_usd);
                            }
                            }}
                        >
                            USD
                        </Button>
                    </div>
                )}

                <div>
                    <label htmlFor="salePriceNaqd" className="block text-sm font-medium text-gray-700 mb-1">
                        Sotish narxi ({saleCurrency})
                    </label>
                    <Input
                        id="salePriceNaqd"
                        type="number"
                        value={actualSalePrice}
                        onChange={(e) => setActualSalePrice(e.target.value)}
                        placeholder={`Narxni ${saleCurrency} da kiriting`}
                        min="0" // Minimal qiymat 0, lekin validatsiya 0 dan katta bo'lishini tekshiradi
                    />
                </div>
                { (saleCurrency === 'UZS' && hasUzsPriceForSelected) || (saleCurrency === 'USD' && hasUsdPriceForSelected) ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (saleCurrency === 'UZS' && selectedProductForSale.price_uzs) {
                        setActualSalePrice(selectedProductForSale.price_uzs);
                      } else if (saleCurrency === 'USD' && selectedProductForSale.price_usd) {
                        setActualSalePrice(selectedProductForSale.price_usd);
                      }
                    }}
                  >
                    Asl narxni ({saleCurrency}) ishlatish
                  </Button>
                ) : null }
              </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsSaleModalOpen(false)}>Bekor qilish</Button>
                <Button
                    onClick={handleSubmitDirectSale}
                    disabled={
                        isSubmittingDirectSale ||
                        parseFloat(actualSalePrice) <= 0 || // Kiritilgan narx 0 dan katta bo'lishi shart
                        isNaN(parseFloat(actualSalePrice)) // Kiritilgan narx raqam bo'lishi shart
                        // Quyidagi shartni olib tashladim, chunki backend endi USD ni to'g'ridan-to'g'ri qabul qilishi kerak.
                        // Agar USD da sotilganda UZS_USD_RATE > 0 bo'lishi shart bo'lsa (masalan, faqat display uchun),
                        // bu shartni qayta qo'shishingiz mumkin:
                        // (saleCurrency === 'USD' && UZS_USD_RATE <= 0)
                    }
                    className="bg-green-500 hover:bg-green-600 text-white"
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