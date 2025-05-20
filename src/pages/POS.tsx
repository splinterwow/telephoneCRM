// import React, {
//   useState,
//   useEffect,
//   useMemo,
//   useCallback,
//   useRef,
// } from "react";
// import axios from "axios";
// import { useApp } from "@/context/AppContext";
// import {
//   Loader2,
//   Search,
//   Tag,
//   ShoppingCart,
//   Trash2,
//   Plus,
//   Minus,
//   Users, // Mijozlar uchun ikona
// } from "lucide-react";
// import { toast } from "sonner";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"; // Shadcn/UI Select komponenti

// // --- BU YERGA AKTUAL KURSNI KIRITING YOKI DINAMIK OLING ---
// const UZS_USD_RATE = 12650; // Misol uchun! Haqiqiy kurs bilan almashtiring.

// // --- Util funksiyalar --- (O'zgarishsiz)
// const formatPriceUZS = (value?: string | number | null): string => {
//   const num = parseFloat(value?.toString() || "0");
//   return isNaN(num)
//     ? "N/A"
//     : new Intl.NumberFormat("uz-UZ").format(Math.round(num)) + " UZS";
// };

// const formatPriceUSD = (value?: string | number | null): string => {
//   const num = parseFloat(value?.toString() || "0");
//   if (isNaN(num)) return "N/A";
//   return (
//     "$" +
//     new Intl.NumberFormat("en-US", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     }).format(num)
//   );
// };

// const getDisplayPrice = (product: ProductFromApi | CartItem): string => {
//   if (product.price_uzs && parseFloat(product.price_uzs) > 0) {
//     return formatPriceUZS(product.price_uzs);
//   } else if (product.price_usd && parseFloat(product.price_usd) > 0) {
//     return formatPriceUSD(product.price_usd);
//   }
//   return "Narx N/A";
// };

// const getPriceInUZS = (
//   product: ProductFromApi | CartItem,
//   rate: number
// ): number => {
//   if (product.price_uzs && parseFloat(product.price_uzs) > 0) {
//     return parseFloat(product.price_uzs);
//   } else if (product.price_usd && parseFloat(product.price_usd) > 0) {
//     if (rate > 0) {
//       return parseFloat(product.price_usd) * rate;
//     } else {
//       console.warn(
//         `USD kursi (${rate}) noto'g'ri, "${product.name}" narxini UZS ga o'girib bo'lmadi.`
//       );
//       return 0;
//     }
//   }
//   return 0;
// };

// const validatePhoneNumber = (phone: string): boolean => {
//   const phoneRegex = /^\+998\d{9}$/;
//   return phoneRegex.test(phone);
// };

// // --- Interfeyslar ---
// interface ProductFromApi {
//   id: number;
//   name: string;
//   price_uzs?: string | null;
//   price_usd?: string | null;
//   quantity_in_stock: number;
//   barcode?: string | null;
//   type?: "phone" | "accessory";
//   category_name?: string;
// }

// interface CartItem extends ProductFromApi {
//   cart_quantity: number;
// }

// interface SalePayloadItem {
//   product_id: number;
//   quantity: number;
//   price: string;
// }

// interface SalePayload {
//   items: SalePayloadItem[];
//   payment_type: "Naqd";
//   kassa_id: number;
//   customer_id?: number | null;
//   currency: "UZS";
// }

// interface CustomerFromApi { // Mijozlar ro'yxati uchun interfeys
//   id: number;
//   full_name: string;
//   phone_number: string;
//   // ... boshqa kerakli maydonlar
// }

// interface CustomerPayload {
//   full_name: string;
//   phone_number: string;
//   email?: string;
//   address: string;
// }

// // --- API manzillari ---
// const API_BASE_URL = "https://smartphone777.pythonanywhere.com/api";
// const API_POS_PRODUCTS_URL = (kassaId: number) => `${API_BASE_URL}/pos/products/?kassa_id=${kassaId}`;
// const API_CUSTOMERS_LIST_URL = `${API_BASE_URL}/customers/`; // Mijozlar ro'yxati uchun
// const API_CREATE_SALE_URL = `${API_BASE_URL}/sales/`;
// const API_CREATE_CUSTOMER_URL = `${API_BASE_URL}/customers/`;


// // --- ProductCard Komponenti --- (O'zgarishsiz)
// const ProductCard = ({ product, onAddToCart, disabled, }: { product: ProductFromApi; onAddToCart: (product: ProductFromApi) => void; disabled: boolean; }) => {
//   return (
//     <div className={`bg-white p-3 rounded-lg shadow-sm flex flex-col justify-between border ${ disabled ? "opacity-50 cursor-not-allowed" : "border-gray-200 hover:shadow-md transition-shadow" } h-48`} >
//       <div> <h3 className="font-semibold text-sm mb-1 truncate" title={product.name || "Nomsiz"} > {product.name || "Nomsiz"} </h3> <p className={`text-xs ${ product.quantity_in_stock > 0 ? "text-gray-600" : "text-red-500 font-medium" }`} > {product.quantity_in_stock > 0 ? `${product.quantity_in_stock} mavjud` : "Tugagan"} </p> <p className="text-lg font-bold text-primary mt-1"> {getDisplayPrice(product)} </p> </div>
//       <Button onClick={() => onAddToCart(product)} disabled={disabled || product.quantity_in_stock <= 0} className="mt-2 w-full py-1.5 text-xs font-medium" size="sm" > <ShoppingCart className="inline-block mr-1 h-3 w-3" /> Savatga </Button>
//     </div>
//   );
// };

// // --- CartSidebar Komponenti --- (O'zgarishsiz)
// const CartSidebar = ({ cartItems, onUpdateQuantity, onRemoveItem, totalUZS, onSubmitSale, isSubmittingSale, }: { cartItems: CartItem[]; onUpdateQuantity: (productId: number, newQuantity: number) => void; onRemoveItem: (productId: number) => void; totalUZS: number; onSubmitSale: () => void; isSubmittingSale: boolean; }) => {
//   const phoneItems = cartItems.filter((item) => item.type === "phone");
//   const accessoryItems = cartItems.filter((item) => item.type === "accessory");
//   return (
//     <div className="w-full lg:w-1/3 bg-gray-50 p-4 rounded-lg shadow-inner flex flex-col h-full">
//       <h2 className="text-xl font-bold mb-4 text-gray-700">Savat</h2>
//       <div className="flex-grow overflow-y-auto pr-2 space-y-3 mb-4 custom-scrollbar">
//         {cartItems.length === 0 ? ( <div className="min-h-[200px] border-dashed border-2 border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500 p-4 text-center"> <ShoppingCart className="h-12 w-12 mb-2 text-gray-400" /> <p>Savat bo'sh</p> </div>
//         ) : (
//           <>
//             {phoneItems.length > 0 && ( <> <h3 className="text-sm font-semibold text-gray-600 mb-2">Telefonlar:</h3> {phoneItems.map((item) => ( <div key={item.id} className="flex justify-between items-start bg-white p-3 rounded shadow-sm text-sm border border-gray-200" > <div className="flex-1 mr-2"> <p className="font-medium truncate max-w-[150px] sm:max-w-[180px]" title={item.name}> {item.name || "Nomsiz"} </p> <p className="text-xs text-gray-600"> Narxi: {getDisplayPrice(item)} </p> </div> <div className="flex items-center gap-1.5"> <Button variant="outline" size="icon" className="h-6 w-6 shrink-0" onClick={() => onUpdateQuantity(item.id, item.cart_quantity - 1)}> <Minus className="h-3 w-3" /> </Button> <span className="h-6 w-10 text-center px-0.5 text-sm flex items-center justify-center border rounded-md bg-gray-50"> {item.cart_quantity} </span> <Button variant="outline" size="icon" className="h-6 w-6 shrink-0" onClick={() => onUpdateQuantity(item.id, item.cart_quantity + 1)}> <Plus className="h-3 w-3" /> </Button> </div> <div className="text-right ml-2 min-w-[70px] flex flex-col items-end"> <p className="font-medium text-primary"> {formatPriceUZS( getPriceInUZS(item, UZS_USD_RATE) * item.cart_quantity )} </p> <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => onRemoveItem(item.id)}> <Trash2 className="h-3.5 w-3.5" /> </Button> </div> </div> ))} </> )}
//             {accessoryItems.length > 0 && ( <> <h3 className="text-sm font-semibold text-gray-600 mb-2 mt-4">Aksessuarlar:</h3> {accessoryItems.map((item) => ( <div key={item.id} className="flex justify-between items-start bg-white p-3 rounded shadow-sm text-sm border border-gray-200" > <div className="flex-1 mr-2"> <p className="font-medium truncate max-w-[150px] sm:max-w-[180px]" title={item.name}> {item.name || "Nomsiz"} </p> <p className="text-xs text-gray-600"> Narxi: {getDisplayPrice(item)} </p> </div> <div className="flex items-center gap-1.5"> <Button variant="outline" size="icon" className="h-6 w-6 shrink-0" onClick={() => onUpdateQuantity(item.id, item.cart_quantity - 1)}> <Minus className="h-3 w-3" /> </Button> <span className="h-6 w-10 text-center px-0.5 text-sm flex items-center justify-center border rounded-md bg-gray-50"> {item.cart_quantity} </span> <Button variant="outline" size="icon" className="h-6 w-6 shrink-0" onClick={() => onUpdateQuantity(item.id, item.cart_quantity + 1)}> <Plus className="h-3 w-3" /> </Button> </div> <div className="text-right ml-2 min-w-[70px] flex flex-col items-end"> <p className="font-medium text-primary"> {formatPriceUZS( getPriceInUZS(item, UZS_USD_RATE) * item.cart_quantity )} </p> <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => onRemoveItem(item.id)}> <Trash2 className="h-3.5 w-3.5" /> </Button> </div> </div> ))} </> )}
//           </>
//         )}
//       </div>
//       {cartItems.length > 0 && (
//         <div className="flex-shrink-0 mt-auto pt-4 border-t border-gray-300">
//           <div className="flex justify-between items-center font-bold text-xl mb-4 text-gray-800"> <span>Jami:</span> <span>{formatPriceUZS(totalUZS)}</span> </div>
//           <p className="text-sm text-gray-600 mb-3 text-center font-medium">To'lov: Naqd</p>
//           <Button onClick={onSubmitSale} disabled={isSubmittingSale || cartItems.length === 0} className="w-full bg-green-500 text-white py-3 text-lg font-semibold hover:bg-green-600 transition-colors shadow-lg disabled:bg-gray-400" size="lg" >
//             {isSubmittingSale && <Loader2 className="inline-block mr-2 h-5 w-5 animate-spin" />} Buyurtma berish (Savat)
//           </Button>
//         </div>
//       )}
//     </div>
//   );
// };

// // --- PosPage Komponenti ---
// export default function PosPage() {
//   const { currentStore } = useApp();
//   const [products, setProducts] = useState<ProductFromApi[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [barcodeTerm, setBarcodeTerm] = useState("");
//   const barcodeInputRef = useRef<HTMLInputElement>(null);

//   const [cartItems, setCartItems] = useState<CartItem[]>([]);
//   const [isSubmittingCartSale, setIsSubmittingCartSale] = useState(false);
  
//   const [customersList, setCustomersList] = useState<CustomerFromApi[]>([]); // Mijozlar ro'yxati uchun state
//   const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
//   const [selectedCustomerId, setSelectedCustomerId] = useState<string>(""); // Tanlangan mijoz IDsi (string, Select uchun)

//   const [selectedProductForSale, setSelectedProductForSale] = useState<ProductFromApi | null>(null);
//   const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
//   const [actualSalePrice, setActualSalePrice] = useState<string>("");
//   const [isSubmittingDirectSale, setIsSubmittingDirectSale] = useState(false);

//   const [customerFullName, setCustomerFullName] = useState<string>("");
//   const [customerPhoneNumber, setCustomerPhoneNumber] = useState<string>("");
//   const [customerAddress, setCustomerAddress] = useState<string>("");

//   const currentKassaId = useMemo(() => currentStore?.id || 1, [currentStore]);

//   const fetchProducts = useCallback(async (kassaId: number) => {
//     setIsLoading(true); setError(null);
//     try {
//       const token = localStorage.getItem("accessToken");
//       if (!token) { setError("Iltimos, tizimga kiring."); setIsLoading(false); return; }
//       const response = await axios.get<{ results: ProductFromApi[] } | ProductFromApi[]>(API_POS_PRODUCTS_URL(kassaId), { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 });
//       const fetchedProducts = Array.isArray(response.data) ? response.data : response.data?.results || [];
//       const productsWithNormalizedData = fetchedProducts.map((p) => ({ ...p, price_uzs: p.price_uzs ? p.price_uzs.toString() : null, price_usd: p.price_usd ? p.price_usd.toString() : null, type: p.type || (p.name.toLowerCase().includes("iphone") || p.name.toLowerCase().includes("phone") || p.category_name?.toLowerCase().includes("phone") ? "phone" : "accessory"), barcode: p.barcode ? p.barcode.trim() : null, }));
//       setProducts(productsWithNormalizedData);
//     } catch (err: any) { console.error("POS API xatosi:", err); if (err.response?.status === 401) setError("Sessiya tugadi. Iltimos, tizimga qayta kiring."); else if (err.code === "ECONNABORTED") setError("So‘rov muddati tugadi. Internetni tekshiring."); else setError("Mahsulotlarni olishda xato: " + (err.response?.data?.detail || err.message || "Noma'lum xato")); setProducts([]); }
//     finally { setIsLoading(false); }
//   }, []);

//   const fetchCustomers = useCallback(async () => { // Mijozlarni yuklash funksiyasi
//     setIsLoadingCustomers(true);
//     try {
//       const token = localStorage.getItem("accessToken");
//       if (!token) { toast.error("Mijozlarni olish uchun avtorizatsiya tokeni topilmadi."); return; }
//       const response = await axios.get<{ results: CustomerFromApi[] } | CustomerFromApi[]>(API_CUSTOMERS_LIST_URL, { headers: { Authorization: `Bearer ${token}` } });
//       const fetchedCustomers = Array.isArray(response.data) ? response.data : response.data?.results || [];
//       setCustomersList(fetchedCustomers);
//     } catch (err: any) {
//       console.error("Mijozlarni olishda xato:", err);
//       toast.error("Mijozlar ro'yxatini olishda xatolik yuz berdi.");
//       setCustomersList([]);
//     } finally {
//       setIsLoadingCustomers(false);
//     }
//   }, []);

//   useEffect(() => {
//     if (currentKassaId) {
//       fetchProducts(currentKassaId);
//       fetchCustomers(); // Komponent yuklanganda mijozlarni ham yuklash
//     } else { setError("Kassa tanlanmagan. Sozlamalarni tekshiring."); setIsLoading(false); }
//   }, [currentKassaId, fetchProducts, fetchCustomers]);


//   const handleAddToCart = (productToAdd: ProductFromApi) => {
//     const priceUZS = getPriceInUZS(productToAdd, UZS_USD_RATE);
//     if (priceUZS <= 0 && productToAdd.quantity_in_stock > 0) { toast.warning(`"${productToAdd.name}" uchun narx belgilanmagan yoki noto'g'ri (UZS: ${formatPriceUZS(priceUZS)}).`); return; }
//     if (productToAdd.quantity_in_stock <= 0) { toast.warning(`"${productToAdd.name}" mahsuloti tugagan.`); return; }
//     setCartItems((prevItems) => {
//       const existingItem = prevItems.find((item) => item.id === productToAdd.id);
//       if (existingItem) {
//         if (existingItem.cart_quantity < productToAdd.quantity_in_stock) { toast.success(`"${productToAdd.name}" miqdori oshirildi.`); return prevItems.map((item) => item.id === productToAdd.id ? { ...item, cart_quantity: item.cart_quantity + 1 } : item); }
//         else { toast.warning(`"${productToAdd.name}" uchun maksimal miqdor (${productToAdd.quantity_in_stock}) savatda.`); return prevItems; }
//       }
//       toast.success(`"${productToAdd.name}" savatga qo'shildi.`);
//       return [...prevItems, { ...productToAdd, cart_quantity: 1 }];
//     });
//   };

//   const handleUpdateCartQuantity = (productId: number, newQuantity: number) => {
//     const productInCatalog = products.find((p) => p.id === productId) || cartItems.find((c) => c.id === productId);
//     if (!productInCatalog) return;
//     if (newQuantity <= 0) { handleRemoveFromCart(productId); return; }
//     if (newQuantity > productInCatalog.quantity_in_stock) { toast.warning(`"${productInCatalog.name}" uchun omborda ${productInCatalog.quantity_in_stock} dona mavjud.`); setCartItems((prevItems) => prevItems.map((item) => item.id === productId ? { ...item, cart_quantity: productInCatalog.quantity_in_stock } : item)); return; }
//     setCartItems((prevItems) => prevItems.map((item) => (item.id === productId ? { ...item, cart_quantity: newQuantity } : item)));
//   };

//   const handleRemoveFromCart = (productId: number) => { setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId)); toast.info("Mahsulot savatdan o'chirildi."); };
//   const calculateCartTotalUZS = useMemo(() => cartItems.reduce((sum, item) => sum + (getPriceInUZS(item, UZS_USD_RATE) * item.cart_quantity), 0), [cartItems]);

//   const handleBarcodeScanAndOpenModal = (scannedBarcode: string) => {
//     if (!scannedBarcode.trim()) return;
//     const trimmedBarcodeFromScanner = scannedBarcode.trim().toUpperCase();
//     console.log("Skanerdan o'qilgan (original):", `"${scannedBarcode}"`);
//     console.log("Skanerdan o'qilgan (trim+upper):", `"${trimmedBarcodeFromScanner}"`);
//     const productFound = products.find((p) => p.barcode && p.barcode.trim().toUpperCase() === trimmedBarcodeFromScanner);
//     if (productFound) {
//       console.log("Mahsulot topildi:", productFound);
//       if (productFound.quantity_in_stock <= 0) { toast.warning(`"${productFound.name}" mahsuloti tugagan.`); if (barcodeInputRef.current) barcodeInputRef.current.select(); return; }
//       const priceInUZSForModal = getPriceInUZS(productFound, UZS_USD_RATE);
//       if (priceInUZSForModal <= 0) { toast.warning(`"${productFound.name}" uchun narx UZS da belgilanmagan yoki noto'g'ri.`); if (barcodeInputRef.current) barcodeInputRef.current.select(); return; }
//       setSelectedProductForSale(productFound);
//       setActualSalePrice(priceInUZSForModal.toString());
//       setCustomerFullName(""); setCustomerPhoneNumber(""); setCustomerAddress("");
//       setSelectedCustomerId(""); // Modal ochilganda tanlangan mijozni tozalash
//       setIsSaleModalOpen(true);
//       setBarcodeTerm("");
//     } else {
//       console.log(`"${trimmedBarcodeFromScanner}" shtrix kodli mahsulot topilmadi. Mavjud shtrixkodlar:`, products.map(p => p.barcode?.trim().toUpperCase()));
//       toast.error(`"${trimmedBarcodeFromScanner}" shtrix kodli mahsulot topilmadi.`);
//       if (barcodeInputRef.current) barcodeInputRef.current.select();
//     }
//   };
  
//   const createCustomer = async (customerData: CustomerPayload): Promise<number | null> => {
//     try {
//       const token = localStorage.getItem("accessToken");
//       const response = await axios.post(API_CREATE_CUSTOMER_URL, customerData, { headers: { Authorization: `Bearer ${token}` } });
//       toast.success(`Mijoz "${response.data.full_name}" muvaffaqiyatli yaratildi! ID: ${response.data.id}`);
//       fetchCustomers(); // Yangi mijoz qo'shilgandan keyin ro'yxatni yangilash
//       return response.data.id;
//     } catch (err: any) { console.error("Mijoz yaratishda xato:", err); let errorMessage = "Mijozni yaratishda xatolik: "; if (err.response?.data) { const errors = err.response.data; if (typeof errors === "string") errorMessage += errors; else if (typeof errors === "object") Object.keys(errors).forEach((key) => { errorMessage += `${key}: ${Array.isArray(errors[key]) ? errors[key].join(", ") : errors[key]}. `; }); else errorMessage += "Noma'lum server xatosi."; } else errorMessage += err.message || "Server bilan aloqa yo'q."; toast.error(errorMessage, { duration: 8000 }); return null; }
//   };

//   const handleSubmitDirectSale = async () => {
//     if (!selectedProductForSale || !currentKassaId) { toast.error("Mahsulot yoki kassa tanlanmagan!"); return; }
//     const finalSalePriceUZS = parseFloat(actualSalePrice);
//     if (isNaN(finalSalePriceUZS) || finalSalePriceUZS <= 0) { toast.error("Sotish narxi (UZS) noto'g'ri kiritilgan."); return; }
    
//     let finalModalCustomerId: number | null = selectedCustomerId ? parseInt(selectedCustomerId) : null;

//     if (!finalModalCustomerId && (customerFullName || customerPhoneNumber || customerAddress)) {
//       if (!customerFullName.trim()) { toast.error("Mijozning ism-familiyasi kiritilishi shart."); return; }
//       if (!customerPhoneNumber.trim()) { toast.error("Mijozning telefon raqami kiritilishi shart."); return; }
//       if (!validatePhoneNumber(customerPhoneNumber)) { toast.error("Telefon raqami noto'g'ri formatda. Masalan: +998901234567"); return; }
//       if (!customerAddress.trim()) { toast.error("Mijozning manzili kiritilishi shart."); return; }
//       const newCustomerId = await createCustomer({ full_name: customerFullName.trim(), phone_number: customerPhoneNumber.trim(), address: customerAddress.trim() });
//       if (!newCustomerId) return;
//       finalModalCustomerId = newCustomerId;
//     }

//     const payload: SalePayload = {
//       items: [{ product_id: selectedProductForSale.id, quantity: 1, price: finalSalePriceUZS.toFixed(2) }],
//       payment_type: "Naqd", kassa_id: currentKassaId, customer_id: finalModalCustomerId, currency: "UZS",
//     };
//     setIsSubmittingDirectSale(true);
//     try {
//       const token = localStorage.getItem("accessToken");
//       await axios.post(API_CREATE_SALE_URL, payload, { headers: { Authorization: `Bearer ${token}` } });
//       toast.success(`"${selectedProductForSale.name}" sotildi!`);
//       setIsSaleModalOpen(false); setCartItems([]); fetchProducts(currentKassaId);
//       setSelectedCustomerId(""); // Umumiy tanlangan mijoz ID sini tozalash
//     } catch (err: any) { console.error("Sotuvda xato:", err); let errorMessage = "Sotuvni amalga oshirishda xatolik: "; if (err.response?.data) { const errors = err.response.data; if (typeof errors === "string") errorMessage += errors; else if (typeof errors === "object") Object.keys(errors).forEach((key) => { errorMessage += `${key}: ${Array.isArray(errors[key]) ? errors[key].join(", ") : errors[key]}. `; }); else errorMessage += "Noma'lum server xatosi."; } else errorMessage += err.message || "Server bilan aloqa yo'q."; toast.error(errorMessage, { duration: 8000 }); }
//     finally { setIsSubmittingDirectSale(false); }
//   };

//   const handleSubmitCartSale = async () => {
//     if (cartItems.length === 0) { toast.warning("Savat bo'sh!"); return; }
//     if (!currentKassaId) { toast.error("Kassa aniqlanmadi!"); return; }
//     setIsSubmittingCartSale(true);
//     const salePayloadItems: SalePayloadItem[] = [];
//     for (const item of cartItems) {
//       const priceInUZSForItem = getPriceInUZS(item, UZS_USD_RATE);
//       if (priceInUZSForItem <= 0) { toast.error(`"${item.name}" uchun narx (UZS) topilmadi yoki 0. Savatdan o'chiring yoki narxini to'g'rilang.`); setIsSubmittingCartSale(false); return; }
//       salePayloadItems.push({ product_id: item.id, quantity: item.cart_quantity, price: priceInUZSForItem.toFixed(2) });
//     }
//     if (salePayloadItems.length === 0 && cartItems.length > 0) { toast.error("Savatdagi mahsulotlar uchun UZS narx topilmadi."); setIsSubmittingCartSale(false); return; }
//     const payload: SalePayload = {
//       items: salePayloadItems, payment_type: "Naqd", kassa_id: currentKassaId,
//       customer_id: selectedCustomerId ? parseInt(selectedCustomerId) : null, // Savat uchun tanlangan mijoz
//       currency: "UZS",
//     };
//     try {
//       const token = localStorage.getItem("accessToken");
//       await axios.post(API_CREATE_SALE_URL, payload, { headers: { Authorization: `Bearer ${token}` } });
//       toast.success("Savatdagi sotuv muvaffaqiyatli amalga oshirildi!");
//       setCartItems([]); setSelectedCustomerId(""); fetchProducts(currentKassaId);
//     } catch (err: any) { console.error("Savat sotuvida xato:", err); let errorMessage = "Savat sotuvida xatolik: "; if (err.response?.data) { const errors = err.response.data; if (typeof errors === "string") errorMessage += errors; else if (typeof errors === "object") Object.keys(errors).forEach((key) => { errorMessage += `${key}: ${Array.isArray(errors[key]) ? errors[key].join(", ") : errors[key]}. `; }); else errorMessage += "Noma'lum server xatosi."; } else errorMessage += err.message || "Server bilan aloqa yo'q."; toast.error(errorMessage.trim(), { duration: 8000 }); }
//     finally { setIsSubmittingCartSale(false); }
//   };

//   const filteredProducts = useMemo(() => {
//     let tempProducts = products;
//     if (searchTerm) { const lowerCaseSearchTerm = searchTerm.toLowerCase(); tempProducts = tempProducts.filter((product) => product.name && product.name.toLowerCase().includes(lowerCaseSearchTerm)); }
//     return tempProducts;
//   }, [products, searchTerm]);

//   return (
//     <div className="p-4 md:p-6 space-y-6 h-full flex flex-col bg-gray-100">
//       <div className="flex-shrink-0"> <h1 className="text-2xl md:text-3xl font-bold text-gray-800"> Kassa (Do'kon: {currentStore?.name || `ID ${currentKassaId}`}) </h1> </div>
//       <div className="flex flex-col lg:flex-row gap-6 flex-grow overflow-hidden min-h-0">
//         <div className="w-full lg:w-2/3 space-y-4 flex flex-col min-h-0">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-shrink-0">
//             <div className="relative"> <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" /> <Input ref={barcodeInputRef} type="text" placeholder="Shtrix kodni skanerlang yoki kiriting" className="pl-10 pr-3 py-2.5 w-full text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary" value={barcodeTerm} onChange={(e) => setBarcodeTerm(e.target.value)} onKeyPress={(e) => { if (e.key === "Enter") { e.preventDefault(); handleBarcodeScanAndOpenModal(barcodeTerm); } }} autoFocus /> </div>
//             <div className="relative"> <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" /> <Input type="text" placeholder="Mahsulot nomi bo'yicha qidirish" className="pl-10 pr-3 py-2.5 w-full text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /> </div>
//           </div>
//           <div className="relative">
//             <div className="flex items-center gap-2">
//                 <Users className="text-gray-500"/>
//                 <Select value={selectedCustomerId} onValueChange={(value) => setSelectedCustomerId(value === "no-customer" ? "" : value)}>
//                     <SelectTrigger className="w-full">
//                         <SelectValue placeholder={isLoadingCustomers ? "Mijozlar yuklanmoqda..." : "Mijozni tanlang (ixtiyoriy)"} />
//                     </SelectTrigger>
//                     <SelectContent>
//                         <SelectItem value="no-customer">Mijozsiz sotuv</SelectItem>
//                         {isLoadingCustomers && <div className="p-2 text-center text-sm text-gray-500">Yuklanmoqda...</div>}
//                         {!isLoadingCustomers && customersList.length === 0 && <div className="p-2 text-center text-sm text-gray-500">Mijozlar topilmadi</div>}
//                         {customersList.map(customer => (
//                             <SelectItem key={customer.id} value={customer.id.toString()}>
//                                 {customer.full_name} ({customer.phone_number})
//                             </SelectItem>
//                         ))}
//                     </SelectContent>
//                 </Select>
//             </div>
//           </div>
//           {isLoading ? ( <div className="flex-grow flex items-center justify-center"> <Loader2 className="h-10 w-10 animate-spin text-primary" /> </div>
//           ) : error ? ( <div className="flex-grow flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-red-300 bg-red-50 rounded-md"> <p className="text-red-600 font-medium">Xatolik!</p> <p className="text-xs text-red-500 mt-1">{error}</p> <Button onClick={() => {fetchProducts(currentKassaId); fetchCustomers();}} variant="destructive" size="sm" className="mt-3"> Qayta urinish </Button> </div>
//           ) : filteredProducts.length > 0 ? ( <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-4 custom-scrollbar flex-grow min-h-0"> {filteredProducts.map((product) => ( <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} disabled={product.quantity_in_stock <= 0} /> ))} </div>
//           ) : ( <div className="text-center text-gray-500 p-8 border-dashed border-2 border-gray-300 rounded-md flex-grow flex flex-col items-center justify-center"> <Search className="h-12 w-12 mb-3 text-gray-400" /> <p>Mahsulotlar topilmadi</p> </div> )}
//         </div>
//         <CartSidebar cartItems={cartItems} onUpdateQuantity={handleUpdateCartQuantity} onRemoveItem={handleRemoveFromCart} totalUZS={calculateCartTotalUZS} onSubmitSale={handleSubmitCartSale} isSubmittingSale={isSubmittingCartSale} />
//       </div>

//       {selectedProductForSale && (
//         <Dialog open={isSaleModalOpen} onOpenChange={(isOpen) => { setIsSaleModalOpen(isOpen); if (!isOpen) {setSelectedProductForSale(null); setSelectedCustomerId(""); /* Modal yopilganda mijoz tanlovini tozalash */} }} >
//           <DialogContent className="sm:max-w-lg">
//             <DialogHeader> <DialogTitle>Sotuv: {selectedProductForSale.name || "Nomsiz"}</DialogTitle> </DialogHeader>
//             <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-3">
//               <div className="text-sm space-y-1"> <p><strong>Asl narxi:</strong> {getDisplayPrice(selectedProductForSale)}</p> <p><strong>Omborda:</strong> {selectedProductForSale.quantity_in_stock} dona</p> </div>
//               <Tabs defaultValue="new" className="w-full" onValueChange={(tabValue) => {
//                 if(tabValue === "new") setSelectedCustomerId(""); // Yangi mijozga o'tganda tanlovni tozalash
//               }}>
//                 <TabsList className="grid w-full grid-cols-2"> <TabsTrigger value="new">Yangi Mijoz</TabsTrigger> <TabsTrigger value="existing">Mavjud Mijoz</TabsTrigger> </TabsList>
//                 <TabsContent value="new" className="mt-3 space-y-2">
//                   <div> <label htmlFor="modalCustomerFullName" className="block text-xs font-medium text-gray-700 mb-0.5">Mijoz ism-familiyasi</label> <Input id="modalCustomerFullName" type="text" value={customerFullName} onChange={(e) => setCustomerFullName(e.target.value)} placeholder="Ism Familiya" /> </div>
//                   <div> <label htmlFor="modalCustomerPhoneNumber" className="block text-xs font-medium text-gray-700 mb-0.5">Telefon raqami</label> <Input id="modalCustomerPhoneNumber" type="text" value={customerPhoneNumber} onChange={(e) => setCustomerPhoneNumber(e.target.value)} placeholder="+998901234567" /> </div>
//                   <div> <label htmlFor="modalCustomerAddress" className="block text-xs font-medium text-gray-700 mb-0.5">Manzil</label> <Input id="modalCustomerAddress" type="text" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Toshkent sh., Chilanzar tumani" /> </div>
//                 </TabsContent>
//                 <TabsContent value="existing" className="mt-3 space-y-2">
//                   <div>
//                      <label htmlFor="modalSelectCustomer" className="block text-xs font-medium text-gray-700 mb-0.5">Mijozni tanlang</label>
//                     <Select value={selectedCustomerId} onValueChange={(value) => {
//                         setSelectedCustomerId(value === "no-customer-modal" ? "" : value);
//                         // Agar mijoz tanlansa, yangi mijoz maydonlarini tozalash
//                         if (value && value !== "no-customer-modal") {
//                             setCustomerFullName("");
//                             setCustomerPhoneNumber("");
//                             setCustomerAddress("");
//                         }
//                     }}>
//                         <SelectTrigger id="modalSelectCustomer" className="w-full">
//                             <SelectValue placeholder={isLoadingCustomers ? "Mijozlar yuklanmoqda..." : "Mavjud mijozni tanlang"} />
//                         </SelectTrigger>
//                         <SelectContent>
//                             <SelectItem value="no-customer-modal">Mijozsiz (yangi mijoz kiritiladi)</SelectItem>
//                              {isLoadingCustomers && <div className="p-2 text-center text-sm text-gray-500">Yuklanmoqda...</div>}
//                             {!isLoadingCustomers && customersList.length === 0 && <div className="p-2 text-center text-sm text-gray-500">Mijozlar topilmadi</div>}
//                             {customersList.map(customer => (
//                                 <SelectItem key={customer.id} value={customer.id.toString()}>
//                                     {customer.full_name} ({customer.phone_number})
//                                 </SelectItem>
//                             ))}
//                         </SelectContent>
//                     </Select>
//                   </div>
//                 </TabsContent>
//               </Tabs>
//               <div className="mt-4 space-y-3">
//                 <h3 className="text-sm font-medium text-gray-700">To'lov: Naqd</h3>
//                 <div> <label htmlFor="salePriceNaqd" className="block text-sm font-medium text-gray-700 mb-1">Sotish narxi (UZS)</label> <Input id="salePriceNaqd" type="number" value={actualSalePrice} onChange={(e) => setActualSalePrice(e.target.value)} placeholder="Narxni UZS da kiriting" /> </div>
//                 <Button variant="outline" size="sm" onClick={() => setActualSalePrice( getPriceInUZS(selectedProductForSale, UZS_USD_RATE).toString() )} > Asl narxni (UZS) ishlatish </Button>
//               </div>
//             </div>
//             <DialogFooter> <Button variant="outline" onClick={() => setIsSaleModalOpen(false)}>Bekor qilish</Button> <Button onClick={handleSubmitDirectSale} disabled={ isSubmittingDirectSale || parseFloat(actualSalePrice) <= 0 } className="bg-green-500 hover:bg-green-600 text-white" > {isSubmittingDirectSale && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sotish </Button> </DialogFooter>
//           </DialogContent>
//         </Dialog>
//       )}
//     </div>
//   );
// }



import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import axios from "axios";
import { useApp } from "@/context/AppContext";
import {
  Loader2,
  Search,
  Tag,
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
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- BU YERGA AKTUAL KURSNI KIRITING YOKI DINAMIK OLING ---
const UZS_USD_RATE = 12650; // Misol uchun! Haqiqiy kurs bilan almashtiring.

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
  price: string;
}

interface SalePayload {
  items: SalePayloadItem[];
  payment_type: "Naqd";
  kassa_id: number;
  customer_id?: number | null;
  currency: "UZS";
}

interface CustomerFromApi {
  id: number;
  full_name: string;
  phone_number: string;
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
const API_CUSTOMERS_LIST_URL = `${API_BASE_URL}/customers/`;
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
  
  const [customersList, setCustomersList] = useState<CustomerFromApi[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [selectedModalCustomerId, setSelectedModalCustomerId] = useState<string>("");

  const [selectedProductForSale, setSelectedProductForSale] = useState<ProductFromApi | null>(null);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [actualSalePrice, setActualSalePrice] = useState<string>("");
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
      const response = await axios.get<{ results: ProductFromApi[] } | ProductFromApi[]>(API_POS_PRODUCTS_URL(kassaId), { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 });
      const fetchedProducts = Array.isArray(response.data) ? response.data : response.data?.results || [];
      const productsWithNormalizedData = fetchedProducts.map((p) => ({ ...p, price_uzs: p.price_uzs ? p.price_uzs.toString() : null, price_usd: p.price_usd ? p.price_usd.toString() : null, type: p.type || (p.name.toLowerCase().includes("iphone") || p.name.toLowerCase().includes("phone") || p.category_name?.toLowerCase().includes("phone") ? "phone" : "accessory"), barcode: p.barcode ? p.barcode.trim() : null, }));
      setProducts(productsWithNormalizedData);
    } catch (err: any) { console.error("POS API xatosi:", err); if (err.response?.status === 401) setError("Sessiya tugadi. Iltimos, tizimga qayta kiring."); else if (err.code === "ECONNABORTED") setError("So‘rov muddati tugadi. Internetni tekshiring."); else setError("Mahsulotlarni olishda xato: " + (err.response?.data?.detail || err.message || "Noma'lum xato")); setProducts([]); }
    finally { setIsLoading(false); }
  }, []);

  const fetchCustomers = useCallback(async () => {
    setIsLoadingCustomers(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) { toast.error("Mijozlarni olish uchun avtorizatsiya tokeni topilmadi."); setIsLoadingCustomers(false); return; } // setIsLoadingCustomers qo'shildi
      const response = await axios.get<{ results: CustomerFromApi[] } | CustomerFromApi[]>(API_CUSTOMERS_LIST_URL, { headers: { Authorization: `Bearer ${token}` } });
      const fetchedCustomers = Array.isArray(response.data) ? response.data : response.data?.results || [];
      setCustomersList(fetchedCustomers);
    } catch (err: any) { console.error("Mijozlarni olishda xato:", err); toast.error("Mijozlar ro'yxatini olishda xatolik yuz berdi."); setCustomersList([]); }
    finally { setIsLoadingCustomers(false); }
  }, []);

  useEffect(() => {
    if (currentKassaId) { fetchProducts(currentKassaId); fetchCustomers(); }
    else { setError("Kassa tanlanmagan. Sozlamalarni tekshiring."); setIsLoading(false); }
  }, [currentKassaId, fetchProducts, fetchCustomers]);


  const openSaleModalWithProduct = (product: ProductFromApi) => {
    if (product.quantity_in_stock <= 0) { toast.warning(`"${product.name}" mahsuloti tugagan.`); return; }
    const priceInUZSForModal = getPriceInUZS(product, UZS_USD_RATE);
    
    const hasAnyPrice = (product.price_uzs && parseFloat(product.price_uzs) > 0) || 
                       (product.price_usd && parseFloat(product.price_usd) > 0);

    if (!hasAnyPrice) {
        toast.warning(`"${product.name}" uchun narx belgilanmagan.`);
        return;
    }
    
    setSelectedProductForSale(product);
    setActualSalePrice(priceInUZSForModal > 0 ? priceInUZSForModal.toString() : "0");
    setCustomerFullName(""); setCustomerPhoneNumber(""); setCustomerAddress("");
    setSelectedModalCustomerId("");
    setIsSaleModalOpen(true);
  };

  const handleBarcodeScanAndOpenModal = (scannedBarcode: string) => {
    if (!scannedBarcode.trim()) return;
    const trimmedBarcodeFromScanner = scannedBarcode.trim().toUpperCase();
    const productFound = products.find((p) => p.barcode && p.barcode.trim().toUpperCase() === trimmedBarcodeFromScanner);
    if (productFound) { openSaleModalWithProduct(productFound); setBarcodeTerm(""); }
    else { toast.error(`"${trimmedBarcodeFromScanner}" shtrix kodli mahsulot topilmadi.`); if (barcodeInputRef.current) barcodeInputRef.current.select(); }
  };
  
  const createCustomer = async (customerData: CustomerPayload): Promise<number | null> => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(API_CREATE_CUSTOMER_URL, customerData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Mijoz "${response.data.full_name}" muvaffaqiyatli yaratildi! ID: ${response.data.id}`);
      fetchCustomers(); return response.data.id;
    } catch (err: any) { console.error("Mijoz yaratishda xato:", err); let errorMessage = "Mijozni yaratishda xatolik: "; if (err.response?.data) { const errors = err.response.data; if (typeof errors === "string") errorMessage += errors; else if (typeof errors === "object") Object.keys(errors).forEach((key) => { errorMessage += `${key}: ${Array.isArray(errors[key]) ? errors[key].join(", ") : errors[key]}. `; }); else errorMessage += "Noma'lum server xatosi."; } else errorMessage += err.message || "Server bilan aloqa yo'q."; toast.error(errorMessage, { duration: 8000 }); return null; }
  };

  const handleSubmitDirectSale = async () => {
    if (!selectedProductForSale || !currentKassaId) { toast.error("Mahsulot yoki kassa tanlanmagan!"); return; }
    const finalSalePriceUZS = parseFloat(actualSalePrice);

    if (isNaN(finalSalePriceUZS) || finalSalePriceUZS <= 0) { 
        const originalPriceInUzs = getPriceInUZS(selectedProductForSale, UZS_USD_RATE);
        const hasAnyOriginalPrice = (selectedProductForSale.price_uzs && parseFloat(selectedProductForSale.price_uzs) > 0) || 
                                    (selectedProductForSale.price_usd && parseFloat(selectedProductForSale.price_usd) > 0);

        if (!hasAnyOriginalPrice) {
            toast.error(`"${selectedProductForSale.name}" uchun narx belgilanmagan. Iltimos, narxni to'g'rilang.`);
            return;
        }
        if (originalPriceInUzs <= 0 && hasAnyOriginalPrice) { // Agar faqat USD narxi bo'lsa va UZS 0 bo'lsa
             toast.error(`"${selectedProductForSale.name}" uchun UZS narxi 0 yoki hisoblanmadi. Sotish narxini (UZS) kiriting.`);
             return;
        }
        toast.error("Sotish narxi (UZS) noto'g'ri kiritilgan yoki 0."); 
        return; 
    }
    
    let finalCustomerIdForPayload: number | null = selectedModalCustomerId ? parseInt(selectedModalCustomerId) : null;

    if (!finalCustomerIdForPayload && (customerFullName || customerPhoneNumber || customerAddress)) {
      if (!customerFullName.trim()) { toast.error("Mijozning ism-familiyasi kiritilishi shart."); return; }
      if (!customerPhoneNumber.trim()) { toast.error("Mijozning telefon raqami kiritilishi shart."); return; }
      if (!validatePhoneNumber(customerPhoneNumber)) { toast.error("Telefon raqami noto'g'ri formatda. Masalan: +998901234567"); return; }
      if (!customerAddress.trim()) { toast.error("Mijozning manzili kiritilishi shart."); return; }
      const newCustomerId = await createCustomer({ full_name: customerFullName.trim(), phone_number: customerPhoneNumber.trim(), address: customerAddress.trim() });
      if (!newCustomerId) return;
      finalCustomerIdForPayload = newCustomerId;
    }

    const payload: SalePayload = {
      items: [{ product_id: selectedProductForSale.id, quantity: 1, price: finalSalePriceUZS.toFixed(2) }],
      payment_type: "Naqd", kassa_id: currentKassaId, customer_id: finalCustomerIdForPayload, currency: "UZS",
    };
    setIsSubmittingDirectSale(true);
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(API_CREATE_SALE_URL, payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`"${selectedProductForSale.name}" sotildi!`);
      setIsSaleModalOpen(false);
      fetchProducts(currentKassaId);
      setSelectedProductForSale(null);
      setSelectedModalCustomerId("");
    } catch (err: any) { console.error("Sotuvda xato:", err); let errorMessage = "Sotuvni amalga oshirishda xatolik: "; if (err.response?.data) { const errors = err.response.data; if (typeof errors === "string") errorMessage += errors; else if (typeof errors === "object") Object.keys(errors).forEach((key) => { errorMessage += `${key}: ${Array.isArray(errors[key]) ? errors[key].join(", ") : errors[key]}. `; }); else errorMessage += "Noma'lum server xatosi."; } else errorMessage += err.message || "Server bilan aloqa yo'q."; toast.error(errorMessage, { duration: 8000 }); }
    finally { setIsSubmittingDirectSale(false); }
  };

  const filteredProducts = useMemo(() => {
    let tempProducts = products;
    if (searchTerm) { const lowerCaseSearchTerm = searchTerm.toLowerCase(); tempProducts = tempProducts.filter((product) => product.name && product.name.toLowerCase().includes(lowerCaseSearchTerm)); }
    return tempProducts;
  }, [products, searchTerm]);

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
            <Input ref={barcodeInputRef} type="text" placeholder="Shtrix kodni skanerlang yoki kiriting" className="pl-10 pr-3 py-2.5 w-full text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary" value={barcodeTerm} onChange={(e) => setBarcodeTerm(e.target.value)} onKeyPress={(e) => { if (e.key === "Enter") { e.preventDefault(); handleBarcodeScanAndOpenModal(barcodeTerm); } }} autoFocus />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input type="text" placeholder="Mahsulot nomi bo'yicha qidirish" className="pl-10 pr-3 py-2.5 w-full text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        
        {isLoading ? ( <div className="flex-grow flex items-center justify-center"> <Loader2 className="h-10 w-10 animate-spin text-primary" /> </div>
        ) : error ? ( <div className="flex-grow flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-red-300 bg-red-50 rounded-md"> <p className="text-red-600 font-medium">Xatolik!</p> <p className="text-xs text-red-500 mt-1">{error}</p> <Button onClick={() => {fetchProducts(currentKassaId); fetchCustomers();}} variant="destructive" size="sm" className="mt-3"> Qayta urinish </Button> </div>
        ) : filteredProducts.length > 0 ? ( <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 overflow-y-auto pr-2 pb-4 custom-scrollbar flex-grow min-h-0">
          {filteredProducts.map((product) => ( <ProductCard key={product.id} product={product} disabled={product.quantity_in_stock <= 0} onCardClick={openSaleModalWithProduct} /> ))} </div>
        ) : ( <div className="text-center text-gray-500 p-8 border-dashed border-2 border-gray-300 rounded-md flex-grow flex flex-col items-center justify-center"> <Search className="h-12 w-12 mb-3 text-gray-400" /> <p>Mahsulotlar topilmadi</p> </div> )}
      </div>

      {selectedProductForSale && (
        <Dialog open={isSaleModalOpen} onOpenChange={(isOpen) => { setIsSaleModalOpen(isOpen); if (!isOpen) {setSelectedProductForSale(null); setSelectedModalCustomerId("");} }} >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader> <DialogTitle>Sotuv: {selectedProductForSale.name || "Nomsiz"}</DialogTitle> </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-3">
              <div className="text-sm space-y-1">
                <p><strong>Asl narxi:</strong> <span className="flex flex-col">{getDisplayPriceElements(selectedProductForSale)}</span></p>
                <p><strong>Omborda:</strong> {selectedProductForSale.quantity_in_stock} dona</p>
              </div>
              <Tabs defaultValue="new" className="w-full" onValueChange={(tabValue) => { if(tabValue === "new") setSelectedModalCustomerId(""); }}>
                <TabsList className="grid w-full grid-cols-2"> <TabsTrigger value="new">Yangi Mijoz</TabsTrigger> <TabsTrigger value="existing">Mavjud Mijoz</TabsTrigger> </TabsList>
                <TabsContent value="new" className="mt-3 space-y-2">
                  <div> <label htmlFor="modalCustomerFullName" className="block text-xs font-medium text-gray-700 mb-0.5">Mijoz ism-familiyasi</label> <Input id="modalCustomerFullName" type="text" value={customerFullName} onChange={(e) => setCustomerFullName(e.target.value)} placeholder="Ism Familiya" /> </div>
                  <div> <label htmlFor="modalCustomerPhoneNumber" className="block text-xs font-medium text-gray-700 mb-0.5">Telefon raqami</label> <Input id="modalCustomerPhoneNumber" type="text" value={customerPhoneNumber} onChange={(e) => setCustomerPhoneNumber(e.target.value)} placeholder="+998901234567" /> </div>
                  <div> <label htmlFor="modalCustomerAddress" className="block text-xs font-medium text-gray-700 mb-0.5">Manzil</label> <Input id="modalCustomerAddress" type="text" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Toshkent sh., Chilanzar tumani" /> </div>
                </TabsContent>
                <TabsContent value="existing" className="mt-3 space-y-2">
                  <div>
                     <label htmlFor="modalSelectCustomer" className="block text-xs font-medium text-gray-700 mb-0.5">Mijozni tanlang</label>
                    <Select value={selectedModalCustomerId} onValueChange={(value) => { setSelectedModalCustomerId(value === "no-customer-modal" ? "" : value); if (value && value !== "no-customer-modal") { setCustomerFullName(""); setCustomerPhoneNumber(""); setCustomerAddress(""); } }}>
                        <SelectTrigger id="modalSelectCustomer" className="w-full">
                            <SelectValue placeholder={isLoadingCustomers ? "Mijozlar yuklanmoqda..." : "Mavjud mijozni tanlang"} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="no-customer-modal">Mijozsiz (yangi mijoz kiritiladi)</SelectItem>
                             {isLoadingCustomers && <div className="p-2 text-center text-sm text-gray-500">Yuklanmoqda...</div>}
                            {!isLoadingCustomers && customersList.length === 0 && <div className="p-2 text-center text-sm text-gray-500">Mijozlar topilmadi</div>}
                            {customersList.map(customer => ( <SelectItem key={customer.id} value={customer.id.toString()}> {customer.full_name} ({customer.phone_number}) </SelectItem> ))}
                        </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>
              <div className="mt-4 space-y-3">
                <h3 className="text-sm font-medium text-gray-700">To'lov: Naqd</h3>
                <div> <label htmlFor="salePriceNaqd" className="block text-sm font-medium text-gray-700 mb-1">Sotish narxi (UZS)</label> <Input id="salePriceNaqd" type="number" value={actualSalePrice} onChange={(e) => setActualSalePrice(e.target.value)} placeholder="Narxni UZS da kiriting" /> </div>
                <Button variant="outline" size="sm" onClick={() => {
                    const originalUzsPrice = getPriceInUZS(selectedProductForSale, UZS_USD_RATE);
                    setActualSalePrice(originalUzsPrice > 0 ? originalUzsPrice.toString() : "0");
                }} > Asl narxni (UZS) ishlatish </Button>
              </div>
            </div>
            <DialogFooter> <Button variant="outline" onClick={() => setIsSaleModalOpen(false)}>Bekor qilish</Button> <Button onClick={handleSubmitDirectSale} disabled={ isSubmittingDirectSale || parseFloat(actualSalePrice) <= 0 } className="bg-green-500 hover:bg-green-600 text-white" > {isSubmittingDirectSale && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sotish </Button> </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}