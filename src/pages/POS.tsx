import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import axios from "axios";
import { useApp } from "@/context/AppContext";
import { Loader2, Search, Tag, ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- Util funksiyalar ---
const formatPrice = (value?: string | number | null): string => {
  const num = parseFloat(value?.toString() || "0");
  return isNaN(num) ? "N/A" : new Intl.NumberFormat("uz-UZ").format(Math.round(num)) + " UZS";
};

// Telefon raqami validatsiyasi
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
}

interface CartItem extends ProductFromApi {
  cart_quantity: number;
}

interface SalePayloadItem {
  product_id: number;
  quantity: number;
  price: string; // Backend talab qilgan narx maydoni
}

interface SalePayload {
  items: SalePayloadItem[];
  payment_type: "Naqd" | "Nasiya";
  kassa_id: number;
  customer_id?: number | null;
  currency: "UZS";
  installment_initial_amount?: string;
  installment_down_payment?: string;
  installment_interest_rate?: string;
  installment_term_months?: number;
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
const ProductCard = ({
  product,
  onAddToCart,
  disabled,
}: {
  product: ProductFromApi;
  onAddToCart: (product: ProductFromApi) => void;
  disabled: boolean;
}) => {
  return (
    <div
      className={`bg-white p-3 rounded-lg shadow-sm flex flex-col justify-between border ${
        disabled ? "opacity-50 cursor-not-allowed" : "border-gray-200 hover:shadow-md transition-shadow"
      } h-48`}
    >
      <div>
        <h3 className="font-semibold text-sm mb-1 truncate" title={product.name || "Nomsiz"}>
          {product.name || "Nomsiz"}
        </h3>
        <p
          className={`text-xs ${product.quantity_in_stock > 0 ? "text-gray-600" : "text-red-500 font-medium"}`}
        >
          {product.quantity_in_stock > 0 ? `${product.quantity_in_stock} mavjud` : "Tugagan"}
        </p>
        <p className="text-lg font-bold text-primary mt-1">{formatPrice(product.price_uzs)}</p>
      </div>
      <Button
        onClick={() => onAddToCart(product)}
        disabled={disabled || product.quantity_in_stock <= 0}
        className="mt-2 w-full py-1.5 text-xs font-medium"
        size="sm"
      >
        <ShoppingCart className="inline-block mr-1 h-3 w-3" />
        Savatga
      </Button>
    </div>
  );
};

// --- CartSidebar Komponenti ---
const CartSidebar = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  total,
  onSubmitSale,
  paymentMethod,
  setPaymentMethod,
  isSubmittingSale,
}: {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: number, newQuantity: number) => void;
  onRemoveItem: (productId: number) => void;
  total: number;
  onSubmitSale: () => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  isSubmittingSale: boolean;
}) => {
  const phoneItems = cartItems.filter(
    (item) => item.type === "phone" || item.name.toLowerCase().includes("iphone") || item.name.toLowerCase().includes("phone")
  );
  const accessoryItems = cartItems.filter(
    (item) => item.type === "accessory" || (!item.name.toLowerCase().includes("iphone") && !item.name.toLowerCase().includes("phone"))
  );

  return (
    <div className="w-full lg:w-1/3 bg-gray-50 p-4 rounded-lg shadow-inner flex flex-col h-full">
      <h2 className="text-xl font-bold mb-4 text-gray-700">Savat</h2>
      <div className="flex-grow overflow-y-auto pr-2 space-y-3 mb-4 custom-scrollbar">
        {cartItems.length === 0 ? (
          <div className="min-h-[200px] border-dashed border-2 border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500 p-4 text-center">
            <ShoppingCart className="h-12 w-12 mb-2 text-gray-400" />
            <p>Savat bo'sh</p>
          </div>
        ) : (
          <>
            {phoneItems.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Telefonlar:</h3>
                {phoneItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start bg-white p-3 rounded shadow-sm text-sm border border-gray-200"
                  >
                    <div className="flex-1 mr-2">
                      <p className="font-medium truncate max-w-[150px] sm:max-w-[180px]" title={item.name}>
                        {item.name || "Nomsiz"}
                      </p>
                      <p className="text-xs text-gray-600">
                        Narxi: {formatPrice(item.price_uzs)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="icon" className="h-6 w-6 shrink-0" onClick={() => onUpdateQuantity(item.id, item.cart_quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="h-6 w-10 text-center px-0.5 text-sm flex items-center justify-center border rounded-md bg-gray-50">
                        {item.cart_quantity}
                      </span>
                      <Button variant="outline" size="icon" className="h-6 w-6 shrink-0" onClick={() => onUpdateQuantity(item.id, item.cart_quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right ml-2 min-w-[70px] flex flex-col items-end">
                      <p className="font-medium text-primary">
                        {formatPrice(parseFloat(item.price_uzs || "0") * item.cart_quantity)}
                      </p>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => onRemoveItem(item.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
            {accessoryItems.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-gray-600 mb-2 mt-4">Aksessuarlar:</h3>
                {accessoryItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start bg-white p-3 rounded shadow-sm text-sm border border-gray-200"
                  >
                    <div className="flex-1 mr-2">
                      <p className="font-medium truncate max-w-[150px] sm:max-w-[180px]" title={item.name}>
                        {item.name || "Nomsiz"}
                      </p>
                      <p className="text-xs text-gray-600">
                        Narxi: {formatPrice(item.price_uzs)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="icon" className="h-6 w-6 shrink-0" onClick={() => onUpdateQuantity(item.id, item.cart_quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="h-6 w-10 text-center px-0.5 text-sm flex items-center justify-center border rounded-md bg-gray-50">
                        {item.cart_quantity}
                      </span>
                      <Button variant="outline" size="icon" className="h-6 w-6 shrink-0" onClick={() => onUpdateQuantity(item.id, item.cart_quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right ml-2 min-w-[70px] flex flex-col items-end">
                      <p className="font-medium text-primary">
                        {formatPrice(parseFloat(item.price_uzs || "0") * item.cart_quantity)}
                      </p>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => onRemoveItem(item.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
      {cartItems.length > 0 && (
        <div className="flex-shrink-0 mt-auto pt-4 border-t border-gray-300">
          <div className="flex justify-between items-center font-bold text-xl mb-4 text-gray-800">
            <span>Jami:</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="mb-4">
            <h3 className="font-semibold mb-2 text-sm text-gray-700">To'lov turi:</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {["Naqd", "Nasiya"].map((method) => (
                <Button
                  key={method}
                  variant={paymentMethod === method ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPaymentMethod(method)}
                  className={`w-full py-1.5 ${paymentMethod === method ? "shadow-sm" : "text-gray-700 bg-gray-200 hover:bg-gray-300"}`}
                >
                  {method}
                </Button>
              ))}
            </div>
          </div>
          <Button
            onClick={onSubmitSale}
            disabled={isSubmittingSale || cartItems.length === 0}
            className="w-full bg-green-500 text-white py-3 text-lg font-semibold hover:bg-green-600 transition-colors shadow-lg disabled:bg-gray-400"
            size="lg"
          >
            {isSubmittingSale && <Loader2 className="inline-block mr-2 h-5 w-5 animate-spin" />}
            Buyurtma berish (Savat)
          </Button>
        </div>
      )}
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

  // Savat uchun state'lar
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartPaymentMethod, setCartPaymentMethod] = useState("Naqd");
  const [isSubmittingCartSale, setIsSubmittingCartSale] = useState(false);
  const [customerId, setCustomerId] = useState<string>("");

  // Modal uchun state'lar
  const [selectedProductForSale, setSelectedProductForSale] = useState<ProductFromApi | null>(null);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [salePaymentType, setSalePaymentType] = useState<"Naqd" | "Nasiya">("Naqd");
  const [actualSalePrice, setActualSalePrice] = useState<string>("");
  const [loanMonths, setLoanMonths] = useState<string>("6");
  const [interestRate, setInterestRate] = useState<string>("20");
  const [initialAmount, setInitialAmount] = useState<string>("");
  const [downPayment, setDownPayment] = useState<string>("0.00");
  const [monthlyPayment, setMonthlyPayment] = useState<number | null>(null);
  const [totalRepayment, setTotalRepayment] = useState<number | null>(null);
  const [isSubmittingDirectSale, setIsSubmittingDirectSale] = useState(false);
  // Mijoz ma'lumotlari uchun yangi state'lar
  const [customerFullName, setCustomerFullName] = useState<string>("");
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState<string>("");
  const [customerAddress, setCustomerAddress] = useState<string>("");

  const currentKassaId = useMemo(() => {
    return currentStore?.id || 1;
  }, [currentStore]);

  const fetchProducts = useCallback(async (kassaId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Iltimos, tizimga kiring.");
        setIsLoading(false);
        return;
      }
      const response = await axios.get<{ results: ProductFromApi[] } | ProductFromApi[]>(
        API_POS_PRODUCTS_URL(kassaId),
        { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
      );
      const fetchedProducts = Array.isArray(response.data)
        ? response.data
        : response.data && Array.isArray(response.data.results)
        ? response.data.results
        : [];
      
      const productsWithType = fetchedProducts.map((p) => ({
        ...p,
        price_uzs: p.price_uzs ? parseFloat(p.price_uzs.toString()).toString() : "0",
        type: p.type || (p.name.toLowerCase().includes("iphone") || p.name.toLowerCase().includes("phone") ? "phone" : "accessory"),
      }));
      setProducts(productsWithType);
    } catch (err: any) {
      console.error("POS API xatosi:", err);
      if (err.response?.status === 401) setError("Sessiya tugadi. Iltimos, tizimga qayta kiring.");
      else if (err.code === "ECONNABORTED") setError("So‘rov muddati tugadi. Internetni tekshiring.");
      else setError("Mahsulotlarni olishda xato: " + (err.response?.data?.detail || err.message || "Noma'lum xato"));
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentKassaId) {
      fetchProducts(currentKassaId);
    } else {
      setError("Kassa tanlanmagan. Sozlamalarni tekshiring.");
      setIsLoading(false);
    }
  }, [currentKassaId, fetchProducts]);

  const handleAddToCart = (productToAdd: ProductFromApi) => {
    const price = parseFloat(productToAdd.price_uzs || "0");
    if (price <= 0 && productToAdd.quantity_in_stock > 0) {
      toast.warning(`"${productToAdd.name}" uchun narx belgilanmagan.`);
      return;
    }
    if (productToAdd.quantity_in_stock <= 0) {
      toast.warning(`"${productToAdd.name}" mahsuloti tugagan.`);
      return;
    }
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === productToAdd.id);
      if (existingItem) {
        if (existingItem.cart_quantity < productToAdd.quantity_in_stock) {
          toast.success(`"${productToAdd.name}" miqdori oshirildi.`);
          return prevItems.map((item) =>
            item.id === productToAdd.id ? { ...item, cart_quantity: item.cart_quantity + 1 } : item
          );
        } else {
          toast.warning(`"${productToAdd.name}" uchun maksimal miqdor (${productToAdd.quantity_in_stock}) savatda.`);
          return prevItems;
        }
      }
      toast.success(`"${productToAdd.name}" savatga qo'shildi.`);
      return [...prevItems, { ...productToAdd, cart_quantity: 1 }];
    });
  };

  const handleUpdateCartQuantity = (productId: number, newQuantity: number) => {
    const productInCatalog = products.find((p) => p.id === productId) || cartItems.find((c) => c.id === productId);
    if (!productInCatalog) return;

    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    if (newQuantity > productInCatalog.quantity_in_stock) {
      toast.warning(`"${productInCatalog.name}" uchun omborda ${productInCatalog.quantity_in_stock} dona mavjud.`);
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === productId ? { ...item, cart_quantity: productInCatalog.quantity_in_stock } : item
        )
      );
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) => (item.id === productId ? { ...item, cart_quantity: newQuantity } : item))
    );
  };

  const handleRemoveFromCart = (productId: number) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
    toast.info("Mahsulot savatdan o'chirildi.");
  };

  const calculateCartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const price = parseFloat(item.price_uzs || "0");
      return sum + (isNaN(price) ? 0 : price * item.cart_quantity);
    }, 0);
  }, [cartItems]);

  const handleBarcodeScanAndOpenModal = (scannedBarcode: string) => {
    if (!scannedBarcode.trim()) return;
    const productFound = products.find((p) => p.barcode === scannedBarcode.trim());
    
    if (productFound) {
      if (productFound.quantity_in_stock <= 0) {
        toast.warning(`"${productFound.name}" mahsuloti tugagan.`);
        if (barcodeInputRef.current) barcodeInputRef.current.select();
        return;
      }
      const originalPrice = parseFloat(productFound.price_uzs || "0");
      if (originalPrice <= 0) {
        toast.warning(`"${productFound.name}" uchun narx belgilanmagan.`);
        if (barcodeInputRef.current) barcodeInputRef.current.select();
        return;
      }

      setSelectedProductForSale(productFound);
      setActualSalePrice(originalPrice.toString());
      setSalePaymentType("Naqd");
      setLoanMonths("6");
      setInterestRate("20");
      setInitialAmount(originalPrice.toString());
      setDownPayment("0.00");
      setMonthlyPayment(null);
      setTotalRepayment(null);
      setCustomerFullName("");
      setCustomerPhoneNumber("");
      setCustomerAddress("");
      setCustomerId("");
      setIsSaleModalOpen(true);
      setBarcodeTerm("");
    } else {
      toast.error(`"${scannedBarcode}" shtrix kodli mahsulot topilmadi.`);
      if (barcodeInputRef.current) barcodeInputRef.current.select();
    }
  };

  useEffect(() => {
    if (salePaymentType === "Nasiya" && selectedProductForSale && actualSalePrice) {
      const price = parseFloat(actualSalePrice);
      const months = parseInt(loanMonths);
      const annualRateDecimal = parseFloat(interestRate) / 100;

      if (!isNaN(price) && price > 0 && !isNaN(months) && months > 0 && !isNaN(annualRateDecimal) && annualRateDecimal >= 0) {
        const monthlyRate = annualRateDecimal / 12;
        const monthly = price * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -months)));
        const total = monthly * months;
        setMonthlyPayment(Math.round(monthly));
        setTotalRepayment(Math.round(total));
      } else {
        setMonthlyPayment(null);
        setTotalRepayment(null);
      }
    } else {
      setMonthlyPayment(null);
      setTotalRepayment(null);
    }
  }, [actualSalePrice, loanMonths, interestRate, salePaymentType, selectedProductForSale]);

  const createCustomer = async (customerData: CustomerPayload): Promise<number | null> => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(API_CREATE_CUSTOMER_URL, customerData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.id;
    } catch (err: any) {
      console.error("Mijoz yaratishda xato:", err);
      let errorMessage = "Mijozni yaratishda xatolik: ";
      if (err.response?.data) {
        const errors = err.response.data;
        if (typeof errors === "string") errorMessage += errors;
        else if (typeof errors === "object") {
          Object.keys(errors).forEach((key) => {
            const errorMessages = Array.isArray(errors[key]) ? errors[key].join(", ") : errors[key];
            errorMessage += `${key}: ${errorMessages}. `;
          });
        } else errorMessage += "Noma'lum server xatosi.";
      } else errorMessage += err.message || "Server bilan aloqa yo'q.";
      toast.error(errorMessage, { duration: 8000 });
      return null;
    }
  };

  const handleSubmitDirectSale = async () => {
    if (!selectedProductForSale || !currentKassaId) {
      toast.error("Mahsulot yoki kassa tanlanmagan!");
      return;
    }

    const finalSalePrice = parseFloat(actualSalePrice);
    if (isNaN(finalSalePrice) || finalSalePrice <= 0) {
      toast.error("Sotish narxi noto'g'ri kiritilgan.");
      return;
    }

    let finalCustomerId: number | null = customerId ? parseInt(customerId) : null;

    // Mijoz ma'lumotlarini tekshirish va yaratish
    if (customerFullName || customerPhoneNumber || customerAddress) {
      if (!customerFullName.trim()) {
        toast.error("Mijozning ism-familiyasi kiritilishi shart.");
        return;
      }
      if (!customerPhoneNumber.trim()) {
        toast.error("Mijozning telefon raqami kiritilishi shart.");
        return;
      }
      if (!validatePhoneNumber(customerPhoneNumber)) {
        toast.error("Telefon raqami noto'g'ri formatda. Masalan: +998901234567");
        return;
      }
      if (!customerAddress.trim()) {
        toast.error("Mijozning manzili kiritilishi shart.");
        return;
      }

      const customerPayload: CustomerPayload = {
        full_name: customerFullName.trim(),
        phone_number: customerPhoneNumber.trim(),
        address: customerAddress.trim(),
        email: "",
      };

      const newCustomerId = await createCustomer(customerPayload);
      if (!newCustomerId) {
        return; // Xato xabari createCustomer ichida ko'rsatiladi
      }
      finalCustomerId = newCustomerId;
    }

    const payload: SalePayload = {
      items: [
        {
          product_id: selectedProductForSale.id,
          quantity: 1,
          price: finalSalePrice.toFixed(2), // Backendga narxni aniq formatda jo'natish
        },
      ],
      payment_type: salePaymentType,
      kassa_id: currentKassaId,
      customer_id: finalCustomerId,
      currency: "UZS",
    };

    if (salePaymentType === "Nasiya") {
      const months = parseInt(loanMonths);
      const ratePercent = parseFloat(interestRate);
      const initial = parseFloat(initialAmount || actualSalePrice);
      const down = parseFloat(downPayment || "0");

      if (isNaN(months) || months <= 0) {
        toast.error("Nasiya muddati noto'g'ri.");
        return;
      }
      if (isNaN(ratePercent) || ratePercent < 0) {
        toast.error("Nasiya foizi noto'g'ri.");
        return;
      }
      if (isNaN(initial) || initial <= 0) {
        toast.error("Boshlang'ich summa noto'g'ri.");
        return;
      }
      if (isNaN(down)) {
        toast.error("Boshlang'ich to'lov noto'g'ri.");
        return;
      }
      if (!monthlyPayment || monthlyPayment <= 0 || !totalRepayment || totalRepayment <= 0) {
        toast.error("Nasiya hisob-kitoblarida xatolik.");
        return;
      }

      payload.installment_initial_amount = initial.toFixed(2);
      payload.installment_down_payment = down.toFixed(2);
      payload.installment_interest_rate = ratePercent.toFixed(2);
      payload.installment_term_months = months;
    }

    setIsSubmittingDirectSale(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(API_CREATE_SALE_URL, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`"${selectedProductForSale.name}" sotildi!`);
      console.log("Sotuv javobi:", response.data);
      setIsSaleModalOpen(false);
      setCartItems([]);
      fetchProducts(currentKassaId);
    } catch (err: any) {
      console.error("Sotuvda xato:", err);
      let errorMessage = "Sotuvni amalga oshirishda xatolik: ";
      if (err.response?.data) {
        const errors = err.response.data;
        if (typeof errors === "string") errorMessage += errors;
        else if (typeof errors === "object") {
          Object.keys(errors).forEach((key) => {
            const errorMessages = Array.isArray(errors[key]) ? errors[key].join(", ") : errors[key];
            errorMessage += `${key}: ${errorMessages}. `;
          });
        } else errorMessage += "Noma'lum server xatosi.";
      } else errorMessage += err.message || "Server bilan aloqa yo'q.";
      toast.error(errorMessage, { duration: 8000 });
    } finally {
      setIsSubmittingDirectSale(false);
    }
  };

  const handleSubmitCartSale = async () => {
    if (cartItems.length === 0) {
      toast.warning("Savat bo'sh!");
      return;
    }
    if (!currentKassaId) {
      toast.error("Kassa aniqlanmadi!");
      return;
    }

    setIsSubmittingCartSale(true);
    const salePayloadItems: SalePayloadItem[] = cartItems.map((item) => ({
      product_id: item.id,
      quantity: item.cart_quantity,
      price: parseFloat(item.price_uzs || "0").toFixed(2), // Har bir mahsulot uchun narxni qo'shish
    }));

    const payload: SalePayload = {
      items: salePayloadItems,
      payment_type: cartPaymentMethod === "Naqd" ? "Naqd" : "Nasiya",
      kassa_id: currentKassaId,
      customer_id: customerId ? parseInt(customerId) : null,
      currency: "UZS",
    };

    if (cartPaymentMethod === "Nasiya") {
      const months = parseInt(loanMonths || "6");
      const ratePercent = parseFloat(interestRate || "20");
      const initial = parseFloat(initialAmount || calculateCartTotal.toString());
      const down = parseFloat(downPayment || "0");

      if (isNaN(months) || months <= 0) {
        toast.error("Nasiya muddati noto'g'ri.");
        return;
      }
      if (isNaN(ratePercent) || ratePercent < 0) {
        toast.error("Nasiya foizi noto'g'ri.");
        return;
      }
      if (isNaN(initial) || initial <= 0) {
        toast.error("Boshlang'ich summa noto'g'ri.");
        return;
      }
      if (isNaN(down)) {
        toast.error("Boshlang'ich to'lov noto'g'ri.");
        return;
      }

      payload.installment_initial_amount = initial.toFixed(2);
      payload.installment_down_payment = down.toFixed(2);
      payload.installment_interest_rate = ratePercent.toFixed(2);
      payload.installment_term_months = months;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(API_CREATE_SALE_URL, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Savatdagi sotuv muvaffaqiyatli amalga oshirildi!");
      setCartItems([]);
      setCartPaymentMethod("Naqd");
      setCustomerId("");
      fetchProducts(currentKassaId);
    } catch (err: any) {
      console.error("Savat sotuvida xato:", err);
      let errorMessage = "Savat sotuvida xatolik: ";
      if (err.response?.data) {
        const errors = err.response.data;
        if (typeof errors === "string") errorMessage += errors;
        else if (typeof errors === "object") {
          Object.keys(errors).forEach((key) => {
            const errorMessages = Array.isArray(errors[key]) ? errors[key].join(", ") : errors[key];
            errorMessage += `${key}: ${errorMessages}. `;
          });
        } else errorMessage += "Noma'lum server xatosi.";
      } else errorMessage += err.message || "Server bilan aloqa yo'q.";
      toast.error(errorMessage, { duration: 8000 });
    } finally {
      setIsSubmittingCartSale(false);
    }
  };

  const filteredProducts = useMemo(() => {
    let tempProducts = products;
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      tempProducts = tempProducts.filter(
        (product) => product.name && product.name.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }
    return tempProducts;
  }, [products, searchTerm]);

  return (
    <div className="p-4 md:p-6 space-y-6 h-full flex flex-col bg-gray-100">
      <div className="flex-shrink-0">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Kassa (Do'kon: {currentStore?.name || `ID ${currentKassaId}`})
        </h1>
      </div>
      <div className="flex flex-col lg:flex-row gap-6 flex-grow overflow-hidden min-h-0">
        <div className="w-full lg:w-2/3 space-y-4 flex flex-col min-h-0">
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
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleBarcodeScanAndOpenModal(barcodeTerm);
                  }
                }}
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
          <div className="relative">
            <Input
              type="number"
              placeholder="Mijoz ID (ixtiyoriy)"
              className="pr-3 py-2.5 w-full text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            />
          </div>
          {isLoading ? (
            <div className="flex-grow flex items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-red-300 bg-red-50 rounded-md">
              <p className="text-red-600 font-medium">Xatolik!</p>
              <p className="text-xs text-red-500 mt-1">{error}</p>
              <Button onClick={() => fetchProducts(currentKassaId)} variant="destructive" size="sm" className="mt-3">
                Qayta urinish
              </Button>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-4 custom-scrollbar flex-grow min-h-0">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  disabled={product.quantity_in_stock <= 0}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 p-8 border-dashed border-2 border-gray-300 rounded-md flex-grow flex flex-col items-center justify-center">
              <Search className="h-12 w-12 mb-3 text-gray-400" />
              <p>Mahsulotlar topilmadi</p>
            </div>
          )}
        </div>
        <CartSidebar
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveFromCart}
          total={calculateCartTotal}
          onSubmitSale={handleSubmitCartSale}
          paymentMethod={cartPaymentMethod}
          setPaymentMethod={setCartPaymentMethod}
          isSubmittingSale={isSubmittingCartSale}
        />
      </div>

      {/* To'g'ridan-to'g'ri Sotuv Modali */}
      {selectedProductForSale && (
        <Dialog open={isSaleModalOpen} onOpenChange={(isOpen) => {
          setIsSaleModalOpen(isOpen);
          if (!isOpen) setSelectedProductForSale(null);
        }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Sotuv: {selectedProductForSale.name || "Nomsiz"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="text-sm space-y-1">
                <p><strong>Asl narxi:</strong> {formatPrice(selectedProductForSale.price_uzs)}</p>
                <p><strong>Omborda:</strong> {selectedProductForSale.quantity_in_stock} dona</p>
              </div>
              <div>
                <label htmlFor="customerFullName" className="block text-sm font-medium text-gray-700 mb-1">Mijoz ism-familiyasi</label>
                <Input
                  id="customerFullName"
                  type="text"
                  value={customerFullName}
                  onChange={(e) => setCustomerFullName(e.target.value)}
                  placeholder="Ism Familiya"
                />
              </div>
              <div>
                <label htmlFor="customerPhoneNumber" className="block text-sm font-medium text-gray-700 mb-1">Telefon raqami</label>
                <Input
                  id="customerPhoneNumber"
                  type="text"
                  value={customerPhoneNumber}
                  onChange={(e) => setCustomerPhoneNumber(e.target.value)}
                  placeholder="+998901234567"
                />
              </div>
              <div>
                <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-700 mb-1">Manzil</label>
                <Input
                  id="customerAddress"
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Toshkent sh., Chilanzar tumani"
                />
              </div>
              <div>
                <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-1">Mijoz ID (agar mavjud bo'lsa)</label>
                <Input
                  id="customerId"
                  type="number"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  placeholder="Mijoz ID kiriting"
                />
              </div>
              <Tabs value={salePaymentType} onValueChange={(value) => setSalePaymentType(value as "Naqd" | "Nasiya")} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="Naqd">Naqd</TabsTrigger>
                  <TabsTrigger value="Nasiya">Nasiya</TabsTrigger>
                </TabsList>
                <TabsContent value="Naqd" className="mt-4 space-y-3">
                  <div>
                    <label htmlFor="salePriceNaqd" className="block text-sm font-medium text-gray-700 mb-1">Sotish narxi (so'mda)</label>
                    <Input
                      id="salePriceNaqd"
                      type="number"
                      value={actualSalePrice}
                      onChange={(e) => setActualSalePrice(e.target.value)}
                      placeholder="Narxni kiriting"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActualSalePrice(selectedProductForSale.price_uzs || "0")}
                  >
                    Asl narxni ishlatish
                  </Button>
                </TabsContent>
                <TabsContent value="Nasiya" className="mt-4 space-y-3">
                  <div>
                    <label htmlFor="salePriceCredit" className="block text-sm font-medium text-gray-700 mb-1">Mahsulot narxi (nasiyaga asos)</label>
                    <Input
                      id="salePriceCredit"
                      type="number"
                      value={actualSalePrice}
                      onChange={(e) => setActualSalePrice(e.target.value)}
                      placeholder="Narxni kiriting"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1"
                      onClick={() => setActualSalePrice(selectedProductForSale.price_uzs || "0")}
                    >
                      Asl narxni ishlatish
                    </Button>
                  </div>
                  <div>
                    <label htmlFor="downPayment" className="block text-sm font-medium text-gray-700 mb-1">Boshlang'ich to'lov (so'mda)</label>
                    <Input
                      id="downPayment"
                      type="number"
                      value={downPayment}
                      onChange={(e) => setDownPayment(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label htmlFor="loanMonths" className="block text-sm font-medium text-gray-700 mb-1">Nasiya muddati (oy)</label>
                    <Input
                      id="loanMonths"
                      type="number"
                      value={loanMonths}
                      onChange={(e) => setLoanMonths(e.target.value)}
                      placeholder="Masalan: 6"
                    />
                  </div>
                  <div>
                    <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-1">Foiz stavkasi (yillik, %)</label>
                    <Input
                      id="interestRate"
                      type="number"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      placeholder="Masalan: 20"
                    />
                  </div>
                  {monthlyPayment !== null && totalRepayment !== null && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm mt-2">
                      <p><strong>Oylik to'lov:</strong> {formatPrice(monthlyPayment)}</p>
                      <p><strong>Jami qaytariladigan summa:</strong> {formatPrice(totalRepayment)}</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSaleModalOpen(false)}>Bekor qilish</Button>
              <Button
                onClick={handleSubmitDirectSale}
                disabled={
                  isSubmittingDirectSale ||
                  (salePaymentType === "Nasiya" && (!monthlyPayment || monthlyPayment <= 0)) ||
                  parseFloat(actualSalePrice) <= 0
                }
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                {isSubmittingDirectSale && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sotish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}