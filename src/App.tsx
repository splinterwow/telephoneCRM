// Gerekli kutubxonalar va komponentlar import qilinadi
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
// import { LanguageProvider } from "@/context/LanguageContext";

// Layout komponentlari
import { AppLayout } from "@/components/Layout/AppLayout";

// Sahifa komponentlari import qilinadi
import Employees from "./pages/Employees";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import POS from "./pages/POS";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import InstallmentPayments from "./pages/InstallmentPayments";
import NotFound from "./pages/NotFound";
import Hisobot from "./pages/Hisobot";

// React Query Client yaratish
const queryClient = new QueryClient();

// Asosiy App komponenti
const App = () => (
  // Providerlarni joylashtirish (ichma-ich)
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      {/* <LanguageProvider> */}
        <TooltipProvider>
          {/* UI komponentlari */}
          <Toaster />
          <Sonner />
          {/* Router */}
          <BrowserRouter>
            <Routes>
              {/* Login sahifasi uchun Route */}
              <Route path="/login" element={<Login />} />

              <Route path="/admin" element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                {/* Boshqa admin sahifalari */}
                <Route path="pos" element={<POS />} />
                <Route path="sales" element={<Sales />} />
                <Route path="products" element={<Products />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="reports" element={<Reports />} />
                <Route path="installments" element={<InstallmentPayments />} />
                {/* <Route path="settings" element={<Settings />} /> */}
                <Route path="employees" element={<Employees />} />
              </Route>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="pos" element={<POS />} />
                <Route path="sales" element={<Sales />} />
                <Route path="products" element={<Products />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="reports" element={<Reports />} />
                <Route path="installments" element={<InstallmentPayments />} />
                <Route path="hisobot" element={<Hisobot />} />
                
                {/* <Route path="settings" element={<Settings />} /> */}
                <Route path="employees" element={<Employees />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      {/* </LanguageProvider> */}
    </AppProvider>
  </QueryClientProvider>
);

// App komponentini export qilish
export default App;







// import React, { useState, useEffect, useMemo, useCallback } from "react";
// import axios from "axios";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import {
//   Table,
//   TableHeader,
//   TableRow,
//   TableHead,
//   TableBody,
//   TableCell,
// } from "@/components/ui/table";
// import {
//   Search,
//   Pencil,
//   Trash2,
//   Loader2,
//   Smartphone,
//   Headphones,
//   PackageSearch,
//   FolderPlus,
//   Printer,
// } from "lucide-react";
// import {
//   Dialog as ShadDialog,
//   DialogContent as ShadDialogContent,
//   DialogDescription as ShadDialogDescription,
//   DialogFooter as ShadDialogFooter,
//   DialogHeader as ShadDialogHeader,
//   DialogTitle as ShadDialogTitle,
// } from "@/components/ui/dialog";
// // AddProductDialog va EditProductDialog importlari sizning loyihangiz strukturasiga mos bo'lishi kerak
// // Masalan: import { AddProductDialog, DialogView } from "./AddProductDialog";
// // Masalan: import { EditProductDialog } from "./EditProductDialog";
// // Quyidagi importlar placeholder sifatida qoldirildi. O'zingiznikiga almashtiring.
// import { AddProductDialog, DialogView } from "@/components/Products/AddProductDialog";
// import { EditProductDialog } from "@/components/Products/EditProductDialog";
// import { useNavigate } from "react-router-dom";
// import { toast } from "sonner";

// interface Product {
//   id: number;
//   name: string;
//   category: number; // Bu ID
//   category_name?: string;
//   barcode?: string | null;
//   price_usd?: string | null;
//   purchase_price_usd?: string | null;
//   price_uzs?: string | null;
//   purchase_price_uzs?: string | null;
//   storage_capacity?: string | null;
//   color?: string | null;
//   series_region?: string | null;
//   battery_health?: string | null;
//   purchase_date?: string | null;
//   is_active: boolean;
//   description?: string | null;
// }

// interface Category {
//   id: number;
//   name: string;
//   description?: string;
//   barcode_prefix?: string;
// }

// // printLabel uchun /barcode-data/ endpointidan keladigan ma'lumotlar
// interface BarcodeLabelData {
//   name: string;
//   price_uzs?: string | null;
//   price_usd?: string | null;
//   barcode_image_base64?: string; // Hozircha ishlatilmayapti, lekin kelajakda kerak bo'lishi mumkin
//   barcode_number: string;      // Asosiy shtrix-kod raqami
//   [key: string]: any;          // Qo'shimcha maydonlar uchun
// }

// const API_BASE_URL = "https://smartphone777.pythonanywhere.com/api";
// const API_URL_PRODUCTS = `${API_BASE_URL}/products/`;
// const API_URL_PRODUCTS_BARCODE_DATA = (id: number) => `${API_BASE_URL}/products/${id}/barcode-data/`;
// const API_URL_CATEGORIES = `${API_BASE_URL}/categories/`;
// export const API_URL_GENERATE_BARCODE = `${API_BASE_URL}/products/generate-barcode/`; // Dialoglar uchun export qilinishi mumkin

// export default function ProductsPage() {
//   const [products, setProducts] = useState<Product[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [search, setSearch] = useState("");
//   const [categories, setCategories] = useState<Category[]>([]);

//   const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
//   const [addDialogInitialView, setAddDialogInitialView] = useState<DialogView>("phone");

//   const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
//   const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

//   const [productToDelete, setProductToDelete] = useState<Product | null>(null);
//   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

//   const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
//   const [newCategoryData, setNewCategoryData] = useState({
//     name: "",
//     description: "",
//     barcode_prefix: "",
//   });
//   const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

//   const navigate = useNavigate();

//   const formatPriceForTable = useCallback(
//     (price: string | null | undefined, currency: "$" | "so'm" = "$"): string => {
//       if (price === null || price === undefined || price === "") return "-";
//       const numericPrice = parseFloat(price);
//       if (isNaN(numericPrice)) return "N/A";
//       let options: Intl.NumberFormatOptions = {};
//       if (currency === "$") {
//         options = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
//         if (numericPrice % 1 === 0) { // Agar butun son bo'lsa, kasr qismini ko'rsatmaslik
//           options = { maximumFractionDigits: 0 };
//         }
//       } else { // so'm uchun
//         options = { maximumFractionDigits: 0 };
//       }
//       const formatted = numericPrice.toLocaleString(
//         currency === "$" ? "en-US" : "uz-UZ",
//         options
//       );
//       return currency === "$" ? `$${formatted}` : `${formatted} so'm`;
//     },
//     []
//   );

//   const determineProductTypeForDisplay = useCallback((product: Product): string => {
//     const categoryName = product.category_name?.toLowerCase() || "";
//     const productName = product.name?.toLowerCase() || "";
//     if (categoryName.includes("iphone") || productName.toLowerCase().startsWith("iphone"))
//       return "iPhone";
//     if (
//       categoryName.includes("android") ||
//       (categoryName.includes("phone") && !productName.toLowerCase().startsWith("iphone")) ||
//       (categoryName.includes("telefon") && !productName.toLowerCase().startsWith("iphone"))
//     )
//       return "Android";
//     if (categoryName.includes("accessory") || categoryName.includes("aksesuar"))
//       return "Aksesuar";
//     return product.category_name || "Noma'lum";
//   }, []);

//   const fetchProducts = useCallback(async () => {
//     setIsLoading(true);
//     setError(null);
//     try {
//       const token = localStorage.getItem("accessToken");
//       if (!token) {
//         setError("Avtorizatsiya qilinmagan. Iltimos, tizimga kiring.");
//         navigate("/login");
//         setIsLoading(false);
//         return;
//       }
//       const response = await axios.get<{ results: Product[] } | Product[]>(API_URL_PRODUCTS, {
//         headers: { Authorization: `Bearer ${token}` },
//         timeout: 20000, // 20 sekund timeout
//       });

//       // HTML javobini tekshirish
//       if (typeof response.data === "string" && response.data.includes("<!DOCTYPE html>")) {
//         throw new Error("API javobi JSON formatida emas, HTML sahifa qaytdi.");
//       }

//       let fetchedProducts: Product[] = [];
//       // API paginatsiya bilan yoki shunchaki massiv qaytarishi mumkin
//       if ("results" in response.data && Array.isArray(response.data.results)) {
//         fetchedProducts = response.data.results;
//       } else if (Array.isArray(response.data)) {
//         fetchedProducts = response.data;
//       } else {
//         setError("Mahsulot ma'lumotlari noto'g'ri formatda keldi.");
//         setProducts([]);
//         setIsLoading(false);
//         return;
//       }
//       setProducts(fetchedProducts.filter((product) => product.is_active === true).reverse());
//     } catch (err: any) {
//       if (err.response?.status === 401) {
//         setError("Sessiya muddati tugagan. Iltimos, tizimga qayta kiring.");
//         navigate("/login");
//       } else if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
//         setError("Serverga ulanishda vaqt tugadi. Internet aloqangizni tekshiring yoki keyinroq urinib ko'ring.");
//       } else if (err.code === "ECONNREFUSED") {
//          setError(`Serverga ulanish rad etildi. URL: ${API_URL_PRODUCTS}. Server ishlayotganligini tekshiring.`);
//       }
//       else {
//         setError(
//           "Ma'lumotlarni yuklashda xatolik: " + (err.response?.data?.detail || err.message || "Noma'lum server xatosi.")
//         );
//       }
//       setProducts([]); // Xatolik yuz berganda bo'sh ro'yxat
//     } finally {
//       setIsLoading(false);
//     }
//   }, [navigate]);

//   const fetchCategories = useCallback(async () => {
//     try {
//       const token = localStorage.getItem("accessToken");
//       if (!token) return; // Agar token bo'lmasa, so'rov yubormaslik
//       const response = await axios.get<Category[]>(API_URL_CATEGORIES, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (typeof response.data === "string" && response.data.includes("<!DOCTYPE html>")) {
//         throw new Error("Kategoriya API javobi JSON formatida emas, HTML sahifa qaytdi.");
//       }
//       setCategories(response.data);
//     } catch (err: any) {
//       console.error("Kategoriyalarni yuklashda xatolik:", err);
//       toast.error("Kategoriyalarni yuklashda xatolik: " + (err.message || "Noma'lum xato."));
//     }
//   }, []);

//   const handleSaveNewCategory = async () => {
//     if (!newCategoryData.name.trim()) {
//       toast.error("Kategoriya nomi bo'sh bo'lishi mumkin emas.");
//       return;
//     }
//     // Prefiks validatsiyasi: (XX) yoki faqat harf va raqamlar (maks 6)
//     if (
//       newCategoryData.barcode_prefix &&
//       !/^\(\d{2}\)$/.test(newCategoryData.barcode_prefix) && // (XX) format
//       !/^[A-Z0-9]{1,6}$/.test(newCategoryData.barcode_prefix)  // HARF_RAQAM (1-6) format
//     ) {
//       toast.error(
//         "Shtrix-kod prefiksi (XX) formatida yoki faqat bosh harflar va raqamlardan iborat bo'lishi kerak (maks. 6 belgi)."
//       );
//       return;
//     }

//     setIsSubmittingCategory(true);
//     try {
//       const token = localStorage.getItem("accessToken");
//       if (!token) {
//         toast.error("Avtorizatsiya tokeni yo'q.");
//         setIsSubmittingCategory(false);
//         return;
//       }
//       const payload = {
//         name: newCategoryData.name.trim(),
//         description: newCategoryData.description.trim() || null,
//         barcode_prefix: newCategoryData.barcode_prefix.trim() || null,
//       };
//       await axios.post(API_URL_CATEGORIES, payload, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       toast.success(`Kategoriya "${newCategoryData.name}" muvaffaqiyatli qo'shildi!`);
//       setIsAddCategoryModalOpen(false);
//       setNewCategoryData({ name: "", description: "", barcode_prefix: "" });
//       fetchCategories(); // Kategoriyalar ro'yxatini yangilash
//     } catch (err: any) {
//       let errorMessage = `Kategoriya qo'shishda xatolik: `;
//       if (err.response?.data && typeof err.response.data === "object") {
//         // Backenddan kelgan xatoliklarni chiroyli formatlash
//         Object.keys(err.response.data).forEach((key) => {
//           const errorValue = Array.isArray(err.response.data[key])
//             ? err.response.data[key].join(", ")
//             : err.response.data[key];
//           errorMessage += `${key}: ${errorValue} `;
//         });
//       } else {
//         errorMessage += (err.response?.data?.detail || err.message || "Noma'lum server xatosi.");
//       }
//       toast.error(errorMessage.trim(), { duration: 7000 });
//     } finally {
//       setIsSubmittingCategory(false);
//     }
//   };

//   const printLabel = async (productId: number) => {
//     console.log(`printLabel chaqirildi: Mahsulot IDsi ${productId}`);
//     try {
//       const token = localStorage.getItem("accessToken");
//       if (!token) {
//         toast.error("Avtorizatsiya tokeni yo'q.");
//         return;
//       }

//       const response = await axios.get<BarcodeLabelData>(API_URL_PRODUCTS_BARCODE_DATA(productId), {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       console.log("Serverdan /barcode-data/ javobi:", response);
//       const barcodeLabelData = response.data;
//       console.log("Etiketka uchun olingan ma'lumot (barcodeLabelData):", barcodeLabelData);

//       let errorMessage = "";
//       if (!barcodeLabelData) {
//         errorMessage = "Serverdan etiketka uchun ma'lumot kelmadi.";
//       } else if (!barcodeLabelData.name) {
//         errorMessage = "Etiketka uchun mahsulot nomi (name) topilmadi.";
//       } else if (!barcodeLabelData.barcode_number) { // barcode_number ni tekshiramiz
//         errorMessage = `"${barcodeLabelData.name}" uchun shtrix kod raqami (barcode_number) topilmadi.`;
//       }

//       if (errorMessage) {
//         toast.error(errorMessage);
//         console.error(errorMessage, "Olingan ma'lumot:", barcodeLabelData);
//         return;
//       }

//       let priceDisplay = "";
//       const uzsPriceNum = barcodeLabelData.price_uzs ? parseFloat(barcodeLabelData.price_uzs) : null;
//       const usdPriceNum = barcodeLabelData.price_usd ? parseFloat(barcodeLabelData.price_usd) : null;

//       const formatNumber = (num: number, currency: "UZS" | "USD") => {
//           if (currency === "UZS") {
//               return num.toLocaleString('uz-UZ', { maximumFractionDigits: 0 });
//           } else { // USD
//               return num.toLocaleString('en-US', { minimumFractionDigits: (num % 1 === 0 ? 0 : 2), maximumFractionDigits: 2 });
//           }
//       };

//       if (uzsPriceNum !== null && !isNaN(uzsPriceNum)) {
//           priceDisplay += `${formatNumber(uzsPriceNum, "UZS")} UZS`;
//       }
//       if (usdPriceNum !== null && !isNaN(usdPriceNum)) {
//           if (priceDisplay) priceDisplay += " / ";
//           priceDisplay += `$${formatNumber(usdPriceNum, "USD")}`;
//       }
//       if (!priceDisplay) {
//           priceDisplay = '-'; // Narx yo'q bo'lsa
//       }

//       // Etiketka o'lchamlari va stillari
//       const labelWidthMm = 50;
//       const labelHeightMm = 30;
//       const paddingTopMm = 1.5;
//       const paddingBottomMm = 1;
//       const paddingHorizontalMm = 1.5;

//       const productNameFontSize = "6.5pt"; // Mahsulot nomi shrifti
//       const priceFontSize = "6pt";         // Narx shrifti
//       const barcodeTextFontSize = "22pt";    // Shtrix-kod (grafik) shrifti
//       const barcodeNumericFontSize = "6.5pt"; // Shtrix-kod (raqamli) shrifti

//       // barcodeLabelData.barcode_number dan foydalanamiz
//       const visualBarcode = `*${barcodeLabelData.barcode_number}*`; // Code 39 uchun * bilan o'raladi
//       const numericBarcode = barcodeLabelData.barcode_number;

//       const labelHtml = `
//       <html>
//         <head>
//           <title>${barcodeLabelData.name}</title>
//           <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet" type="text/css">
//           <style>
//             @page {
//               size: ${labelWidthMm}mm ${labelHeightMm}mm;
//               margin: 0mm !important; /* Barcha chekka bo'shliqlarni olib tashlash */
//             }
//             html, body {
//               width: ${labelWidthMm}mm;
//               height: ${labelHeightMm}mm;
//               margin: 0 !important;
//               padding: 0 !important;
//               font-family: Arial, sans-serif;
//               box-sizing: border-box;
//               overflow: hidden; /* Scrollbarlarni oldini olish */
//               -webkit-print-color-adjust: exact !important; /* Chrome/Safari uchun fon ranglarini chop etish */
//               print-color-adjust: exact !important; /* Firefox uchun fon ranglarini chop etish */
//               display: flex; /* Kontentni markazlashtirish uchun */
//               justify-content: center;
//               align-items: center;
//             }
//             .label-content {
//               width: 100%;
//               height: 100%;
//               box-sizing: border-box;
//               text-align: center;
//               display: flex;
//               flex-direction: column;
//               justify-content: space-between; /* Elementlarni vertikal taqsimlash */
//               align-items: center;
//               padding-top: ${paddingTopMm}mm;
//               padding-bottom: ${paddingBottomMm}mm;
//               padding-left: ${paddingHorizontalMm}mm;
//               padding-right: ${paddingHorizontalMm}mm;
//             }
//             .product-name {
//               font-size: ${productNameFontSize};
//               font-weight: bold;
//               line-height: 1.1;
//               margin-bottom: 0.3mm; /* Mahsulot nomi va narx orasidagi masofa */
//               word-break: break-word; /* Uzun so'zlarni sindirish */
//               max-height: 7mm; /* Taxminan 2 qator */
//               overflow: hidden;
//               text-overflow: ellipsis;
//               display: -webkit-box;
//               -webkit-line-clamp: 2; /* Maksimal 2 qator ko'rsatish */
//               -webkit-box-orient: vertical;
//             }
//             .price {
//               font-size: ${priceFontSize};
//               font-weight: bold;
//               line-height: 1.1;
//               margin-bottom: 0.5mm; /* Narx va shtrix-kod orasidagi masofa */
//             }
//             .barcode-container {
//               line-height: 1; /* Shtrix-kod va raqamlar orasidagi bo'shliqni kamaytirish */
//             }
//             .barcode-text { /* Grafik shtrix-kod uchun */
//               font-family: 'Libre Barcode 39', cursive;
//               font-size: ${barcodeTextFontSize};
//               display: block;
//               color: black;
//               margin-bottom: -1mm; /* Raqamlar bilan yaqinlashtirish uchun (sozlash kerak bo'lishi mumkin) */
//             }
//             .barcode-numeric { /* Raqamli shtrix-kod uchun */
//               font-family: Arial, sans-serif;
//               font-size: ${barcodeNumericFontSize};
//               letter-spacing: 0.5px; /* Raqamlar orasidagi masofa */
//               line-height: 1;
//               color: black;
//               display: block;
//             }
//           </style>
//         </head>
//         <body>
//           <div class="label-content">
//             <div class="product-name">${barcodeLabelData.name}</div>
//             <div class="price">${priceDisplay}</div>
//             <div class="barcode-container">
//                 <span class="barcode-text">${visualBarcode}</span>
//                 <div class="barcode-numeric">${numericBarcode}</div>
//             </div>
//           </div>
//         </body>
//       </html>
//     `;

//       const printWindow = window.open("", "_blank", "width=300,height=200,menubar=no,toolbar=no,location=no,status=no");
//       if (printWindow) {
//         printWindow.document.write(labelHtml);
//         printWindow.document.close();
//         printWindow.document.title = barcodeLabelData.name || "Etiketka Chop Etish";

//         setTimeout(() => {
//           try {
//             printWindow.focus(); // Chop etish oynasini fokuslash
//             printWindow.print();
//             // printWindow.close(); // Avtomatik yopishni xohlasangiz (testdan keyin)
//           } catch (e) {
//             console.error("Chop etishda xato (ichki):", e);
//             toast.error("Chop etishni boshlashda xatolik.");
//             // printWindow.close(); // Xatolik yuz berganda ham yopish
//           }
//         }, 1200); // 1.2 sekund kutish (brauzer render qilishiga vaqt berish uchun)
//       } else {
//         toast.error("Chop etish oynasini ochishda xatolik yuz berdi. Pop-up bloklagichni tekshiring.");
//       }
//     } catch (err: any) {
//       console.error("printLabel funksiyasida umumiy xatolik:", err);
//       let errorMsg = "Etiketka chiqarishda umumiy xatolik: ";
//       if (err.response?.data?.detail) { // Umumiy backend xatoligi
//         errorMsg += err.response.data.detail;
//       } else if (err.response?.data?.error) { // /barcode-data/ dan kelgan maxsus xatolik
//         errorMsg += err.response.data.error;
//       }
//       else if (err.message) {
//         errorMsg += err.message;
//       } else {
//         errorMsg += "Noma'lum server xatosi.";
//       }
//       toast.error(errorMsg);
//       if (err.response) { // Agar server javobi bo'lsa, uni to'liq log qilish
//         console.error("Serverdan xatolik javobi:", err.response);
//       }
//     }
//   };

//   const handleProductAdded = (newlyAddedProductResponse: any) => {
//     console.log("AddProductDialog'dan kelgan javob (newlyAddedProductResponse):", newlyAddedProductResponse);

//     if (!newlyAddedProductResponse || typeof newlyAddedProductResponse.id !== 'number' || !newlyAddedProductResponse.name ) {
//         toast.error("Mahsulot qo'shildi, lekin serverdan olingan ma'lumotlar to'liq emas. Ro'yxat yangilanmoqda...");
//         console.error("Backenddan to'liqsiz mahsulot ma'lumoti (handleProductAdded):", newlyAddedProductResponse);
//         fetchProducts(); // Ro'yxatni qayta yuklash
//         setIsAddProductDialogOpen(false);
//         return;
//     }
    
//     // Product interfeysiga moslab obyekt yaratamiz
//     const newProduct: Product = {
//         id: newlyAddedProductResponse.id,
//         name: newlyAddedProductResponse.name,
//         category: newlyAddedProductResponse.category, // Bu category ID bo'lishi kerak
//         category_name: newlyAddedProductResponse.category_name, // Kategoriya nomi
//         barcode: newlyAddedProductResponse.barcode || null, // Backenddan kelgan shtrix-kod (agar bo'lsa)
//         price_usd: newlyAddedProductResponse.price_usd || null,
//         purchase_price_usd: newlyAddedProductResponse.purchase_price_usd || null,
//         price_uzs: newlyAddedProductResponse.price_uzs || null,
//         purchase_price_uzs: newlyAddedProductResponse.purchase_price_uzs || null,
//         storage_capacity: newlyAddedProductResponse.storage_capacity || null,
//         color: newlyAddedProductResponse.color || null,
//         series_region: newlyAddedProductResponse.series_region || null,
//         battery_health: newlyAddedProductResponse.battery_health || null,
//         purchase_date: newlyAddedProductResponse.purchase_date || null,
//         is_active: newlyAddedProductResponse.is_active !== undefined ? newlyAddedProductResponse.is_active : true,
//         description: newlyAddedProductResponse.description || null,
//     };
//     console.log("Yangi mahsulot obyekti (newProduct):", newProduct);

//     setProducts((prevProducts) => [newProduct, ...prevProducts]);
//     setIsAddProductDialogOpen(false);
//     toast.success(`"${newProduct.name}" muvaffaqiyatli qo'shildi.`);

//     // Mahsulot IDsi mavjud bo'lsa etiketkani chop etishga harakat qilamiz.
//     // printLabel funksiyasi o'zi /barcode-data/ orqali shtrix-kod mavjudligini tekshiradi.
//     if (newProduct.id) {
//         console.log(`"${newProduct.name}" uchun ID mavjud (${newProduct.id}), printLabel chaqirilmoqda.`);
//         printLabel(newProduct.id);
//     } else {
//         const errMsg = `"${newProduct.name}" mahsuloti uchun ID olinmadi, etiketka chop etib bo'lmaydi.`;
//         toast.error(errMsg);
//         console.error(errMsg, "Mahsulot:", newProduct);
//     }
//   };

//   const handleProductSuccessfullyEdited = (editedProduct: Product) => {
//     setProducts((prevProducts) =>
//       prevProducts.map((p) => (p.id === editedProduct.id ? editedProduct : p))
//     );
//     setIsEditDialogOpen(false);
//     toast.success(`"${editedProduct.name}" muvaffaqiyatli tahrirlandi.`);
//     // Tahrirlangandan keyin ham etiketkani chop etishni xohlasangiz:
//     // if (editedProduct.id) {
//     //   printLabel(editedProduct.id);
//     // }
//   };

//   const handleDeleteConfirmation = async () => {
//     if (!productToDelete) return;
//     const originalProducts = [...products]; // Orqaga qaytarish uchun saqlab qo'yish
    
//     // Optimistik UI yangilanishi: darhol ro'yxatdan o'chirish
//     setProducts((prev) => prev.filter((p) => p.id !== productToDelete!.id));
//     setIsDeleteDialogOpen(false); // Dialog oynasini yopish
    
//     try {
//       const token = localStorage.getItem("accessToken");
//       if (!token) {
//         toast.error("Avtorizatsiya tokeni yo'q.");
//         setProducts(originalProducts); // UI ni orqaga qaytarish
//         setProductToDelete(null);
//         return;
//       }
//       await axios.delete(`${API_URL_PRODUCTS}${productToDelete.id}/`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       toast.success(`"${productToDelete.name}" muvaffaqiyatli o'chirildi.`);
//       setProductToDelete(null); // O'chiriladigan mahsulotni tozalash
//     } catch (err: any) {
//       let errorMessage = `"${productToDelete.name}" ni o'chirishda xato: `;
//       if (err.response?.data && typeof err.response.data === "object") {
//         for (const key in err.response.data) {
//           const errorValue = Array.isArray(err.response.data[key])
//             ? err.response.data[key].join(", ")
//             : err.response.data[key];
//           errorMessage += `${key}: ${errorValue}. `;
//         }
//       } else {
//         errorMessage += (err.response?.data?.detail || err.message || "Noma'lum server xatosi.");
//       }
//       toast.error(errorMessage, { duration: 7000 });
//       setProducts(originalProducts); // Xatolik yuz berganda UI ni orqaga qaytarish
//       setProductToDelete(null); // O'chiriladigan mahsulotni tozalash
//     }
//   };

//   const openEditDialog = (product: Product) => {
//     setSelectedProductForEdit(product);
//     setIsEditDialogOpen(true);
//   };

//   const openDeleteDialog = (product: Product) => {
//     setProductToDelete(product);
//     setIsDeleteDialogOpen(true);
//   };

//   useEffect(() => {
//     fetchProducts();
//     fetchCategories();
//   }, [fetchProducts, fetchCategories]); // navigate ni bog'liqlikdan olib tashladim, fetchProducts ichida bor

//   const filteredProducts = useMemo(() => {
//     const trimmedSearch = search.trim();
//     if (!trimmedSearch) return products;
//     const lowerCaseSearch = trimmedSearch.toLowerCase();
//     // Shtrix-kodni qidirish uchun "(", ")", "-" belgilarni olib tashlaymiz
//     const isPotentialBarcode = /^\(?\d+\)?\d*$/.test(trimmedSearch.replace(/[\s()-]/g, ''));


//     return products.filter((product) => {
//       // Shtrix-kod bo'yicha qidiruv
//       if (isPotentialBarcode && product.barcode) {
//         const searchableBarcode = product.barcode.replace(/[\s()-]/g, '').toLowerCase();
//         const searchInputBarcode = lowerCaseSearch.replace(/[\s()-]/g, '');
//         if (searchableBarcode.includes(searchInputBarcode)) return true;
//       }
//       // Boshqa maydonlar bo'yicha qidiruv
//       return (
//         product.name?.toLowerCase().includes(lowerCaseSearch) ||
//         product.series_region?.toLowerCase().includes(lowerCaseSearch) ||
//         product.category_name?.toLowerCase().includes(lowerCaseSearch) ||
//         product.color?.toLowerCase().includes(lowerCaseSearch) ||
//         product.storage_capacity?.toLowerCase().includes(lowerCaseSearch)
//       );
//     });
//   }, [products, search]);

//   return (
//     <div className="flex flex-col h-full p-4 md:p-6 space-y-5 bg-muted/20">
//       <header className="flex flex-col sm:flex-row justify-between items-center gap-4">
//         <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
//           Mahsulotlar
//         </h1>
//         <div className="flex gap-2 flex-wrap">
//           <Button
//             className="flex items-center gap-2 shadow-sm"
//             onClick={() => {
//               setAddDialogInitialView("phone");
//               setIsAddProductDialogOpen(true);
//             }}
//           >
//             <Smartphone className="h-4 w-4" /> Telefon qo‘shish
//           </Button>
//           <Button
//             variant="outline"
//             className="flex items-center gap-2 shadow-sm"
//             onClick={() => {
//               setAddDialogInitialView("accessory");
//               setIsAddProductDialogOpen(true);
//             }}
//           >
//             <Headphones className="h-4 w-4" /> Aksesuar qo‘shish
//           </Button>
//           <Button
//             variant="outline"
//             className="flex items-center gap-2 shadow-sm"
//             onClick={() => setIsAddCategoryModalOpen(true)}
//           >
//             <FolderPlus className="h-4 w-4" /> Kategoriya qo‘shish
//           </Button>
//         </div>
//       </header>

//       <Card className="flex-grow flex flex-col overflow-hidden shadow-sm border">
//         <CardHeader className="border-b px-4 py-3 sm:px-6 sm:py-4">
//           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
//             <div>
//               <CardTitle className="text-lg sm:text-xl">
//                 Mahsulotlar Ro‘yxati
//               </CardTitle>
//               <CardDescription className="text-xs sm:text-sm mt-0.5">
//                 Jami {filteredProducts.length} ta mahsulot ({products.length}{" "}
//                 tadan).
//               </CardDescription>
//             </div>
//             <div className="relative w-full md:w-64 lg:w-72">
//               <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//               <Input
//                 placeholder="Qidirish yoki skanerlash..."
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 className="pl-8 h-9 text-sm w-full"
//               />
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent className="p-0 flex-grow overflow-y-auto">
//           {isLoading ? (
//             <div className="flex flex-col items-center justify-center h-full">
//               <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
//               <p className="text-muted-foreground">Yuklanmoqda...</p>
//             </div>
//           ) : error ? (
//             <div className="p-6 text-center text-destructive">
//               <p className="font-semibold">Xatolik:</p>
//               <p>{error}</p>
//               <Button
//                 onClick={fetchProducts}
//                 variant="outline"
//                 size="sm"
//                 className="mt-3"
//               >
//                 Qayta urinish
//               </Button>
//             </div>
//           ) : filteredProducts.length > 0 ? (
//             <Table className="text-xs sm:text-sm">
//               <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
//                 <TableRow>
//                   <TableHead className="w-[200px] px-2 py-2.5 sm:px-4">Nomi</TableHead>
//                   <TableHead className="hidden xl:table-cell px-2 sm:px-4">Shtrix Kod</TableHead>
//                   <TableHead className="px-2 sm:px-4">Turi</TableHead>
//                   <TableHead className="px-2 sm:px-4">Sotish narxi (UZS)</TableHead>
//                   <TableHead className="px-2 sm:px-4">Sotish narxi (USD)</TableHead>
//                   <TableHead className="hidden md:table-cell px-2 sm:px-4">Olingan narxi (UZS)</TableHead>
//                   <TableHead className="hidden md:table-cell px-2 sm:px-4">Olingan narxi (USD)</TableHead>
//                   <TableHead className="hidden lg:table-cell px-2 sm:px-4">Xotira</TableHead>
//                   <TableHead className="hidden sm:table-cell px-2 sm:px-4">Rangi</TableHead>
//                   <TableHead className="text-right w-[120px] px-2 py-2.5 sm:px-4">Amallar</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filteredProducts.map((product) => (
//                   <TableRow key={product.id} className="hover:bg-muted/50">
//                     <TableCell className="font-medium px-2 py-2.5 sm:px-4">{product.name || "-"}</TableCell>
//                     <TableCell className="hidden xl:table-cell px-2 sm:px-4">{product.barcode || "-"}</TableCell>
//                     <TableCell className="px-2 sm:px-4">{determineProductTypeForDisplay(product)}</TableCell>
//                     <TableCell className="px-2 sm:px-4">{formatPriceForTable(product.price_uzs, "so'm")}</TableCell>
//                     <TableCell className="px-2 sm:px-4">{formatPriceForTable(product.price_usd, "$")}</TableCell>
//                     <TableCell className="hidden md:table-cell px-2 sm:px-4">{formatPriceForTable(product.purchase_price_uzs, "so'm")}</TableCell>
//                     <TableCell className="hidden md:table-cell px-2 sm:px-4">{formatPriceForTable(product.purchase_price_usd, "$")}</TableCell>
//                     <TableCell className="hidden lg:table-cell px-2 sm:px-4">{product.storage_capacity || "-"}</TableCell>
//                     <TableCell className="hidden sm:table-cell px-2 sm:px-4">{product.color || "-"}</TableCell>
//                     <TableCell className="text-right px-2 py-2.5 sm:px-4">
//                       <Button
//                         variant="ghost"
//                         size="icon"
//                         className="h-7 w-7 text-primary hover:bg-primary/10"
//                         onClick={() => openEditDialog(product)}
//                         title="Tahrirlash"
//                       >
//                         <Pencil className="h-3.5 w-3.5" />
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="icon"
//                         className="h-7 w-7 text-destructive hover:bg-destructive/10 ml-1"
//                         onClick={() => openDeleteDialog(product)}
//                         title="O'chirish"
//                       >
//                         <Trash2 className="h-3.5 w-3.5" />
//                       </Button>
//                        {/* Printer tugmasi mahsulot IDsi mavjud bo'lganda ko'rsatiladi */}
//                        {product.id && (
//                          <Button
//                             variant="ghost"
//                             size="icon"
//                             className="h-7 w-7 text-muted-foreground hover:bg-muted/20 ml-1"
//                             onClick={() => printLabel(product.id)}
//                             title="Etiketka chop etish"
//                           >
//                             <Printer className="h-3.5 w-3.5" />
//                           </Button>
//                        )}
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           ) : (
//             <div className="flex flex-col items-center justify-center h-full text-center p-6 sm:p-10">
//               <PackageSearch className="w-16 h-16 sm:w-20 sm:h-20 text-muted-foreground mb-4 sm:mb-6" />
//               <p className="text-md sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">
//                 {search
//                   ? "Qidiruv bo'yicha mahsulot topilmadi"
//                   : "Hozircha mahsulotlar yo'q"}
//               </p>
//               <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
//                 {search
//                   ? "Boshqa kalit so'z bilan qidirib ko'ring yoki qidiruvni tozalang."
//                   : "Yangi mahsulot qo'shish uchun yuqoridagi tugmalardan foydalaning."}
//               </p>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Dialog oynalari */}
//       {isAddProductDialogOpen && (
//         <AddProductDialog
//           open={isAddProductDialogOpen}
//           onOpenChange={setIsAddProductDialogOpen}
//           onAddProduct={handleProductAdded}
//           initialView={addDialogInitialView}
//           categories={categories}
//           // API_URL_GENERATE_BARCODE ni bu yerga prop sifatida yuborish shart emas,
//           // chunki u AddProductDialog ichida import qilinishi mumkin.
//         />
//       )}
//       {isEditDialogOpen && selectedProductForEdit && (
//         <EditProductDialog
//           open={isEditDialogOpen}
//           onOpenChange={(isOpen) => {
//             setIsEditDialogOpen(isOpen);
//             if (!isOpen) setSelectedProductForEdit(null); // Dialog yopilganda tanlangan mahsulotni tozalash
//           }}
//           product={selectedProductForEdit}
//           onProductSuccessfullyEdited={handleProductSuccessfullyEdited}
//           categories={categories}
//         />
//       )}
      
//       <ShadDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
//         <ShadDialogContent>
//           <ShadDialogHeader>
//             <ShadDialogTitle className="text-lg font-semibold">
//               O'chirishni Tasdiqlang
//             </ShadDialogTitle>
//             <ShadDialogDescription className="mt-2 text-sm">
//               {productToDelete
//                 ? `"${productToDelete.name}" nomli mahsulotni o'chirasizmi? Bu amalni qaytarib bo'lmaydi.`
//                 : "Mahsulotni o'chirish."}
//             </ShadDialogDescription>
//           </ShadDialogHeader>
//           <ShadDialogFooter className="mt-5">
//             <Button
//               variant="outline"
//               onClick={() => {
//                 setIsDeleteDialogOpen(false);
//                 setProductToDelete(null);
//               }}
//             >
//               Bekor Qilish
//             </Button>
//             <Button variant="destructive" onClick={handleDeleteConfirmation}>
//               Ha, O'chirish
//             </Button>
//           </ShadDialogFooter>
//         </ShadDialogContent>
//       </ShadDialog>

//       <ShadDialog
//         open={isAddCategoryModalOpen}
//         onOpenChange={(isOpen) => {
//           setIsAddCategoryModalOpen(isOpen);
//           if (!isOpen) { // Dialog yopilganda formani tozalash
//             setNewCategoryData({ name: "", description: "", barcode_prefix: "" });
//           }
//         }}
//       >
//         <ShadDialogContent className="sm:max-w-md">
//           <ShadDialogHeader>
//             <ShadDialogTitle>Yangi Kategoriya Qo'shish</ShadDialogTitle>
//             <ShadDialogDescription>
//               Yangi mahsulot kategoriyasini kiriting.
//             </ShadDialogDescription>
//           </ShadDialogHeader>
//           <div className="grid gap-4 py-4">
//             <div className="grid grid-cols-4 items-center gap-4">
//               <Label htmlFor="categoryName" className="text-right col-span-1">
//                 Nomi <span className="text-destructive">*</span>
//               </Label>
//               <Input
//                 id="categoryName"
//                 value={newCategoryData.name}
//                 onChange={(e) =>
//                   setNewCategoryData({
//                     ...newCategoryData,
//                     name: e.target.value,
//                   })
//                 }
//                 className="col-span-3"
//                 placeholder="Masalan, Smartfonlar"
//               />
//             </div>
//             <div className="grid grid-cols-4 items-center gap-4">
//               <Label
//                 htmlFor="categoryDescription"
//                 className="text-right col-span-1"
//               >
//                 Tavsifi
//               </Label>
//               <Input
//                 id="categoryDescription"
//                 value={newCategoryData.description}
//                 onChange={(e) =>
//                   setNewCategoryData({
//                     ...newCategoryData,
//                     description: e.target.value,
//                   })
//                 }
//                 className="col-span-3"
//                 placeholder="Qisqacha tavsif (ixtiyoriy)"
//               />
//             </div>
//             <div className="grid grid-cols-4 items-center gap-4">
//               <Label
//                 htmlFor="categoryBarcodePrefix"
//                 className="text-right col-span-1"
//               >
//                 Shtrix Kod Prefiksi
//               </Label>
//               <Input
//                 id="categoryBarcodePrefix"
//                 value={newCategoryData.barcode_prefix}
//                 onChange={(e) =>
//                   setNewCategoryData({
//                     ...newCategoryData,
//                     barcode_prefix: e.target.value.toUpperCase(), // Avtomatik katta harflarga o'tkazish
//                   })
//                 }
//                 className="col-span-3"
//                 placeholder="Masalan, (01) yoki IPH (ixtiyoriy)"
//               />
//             </div>
//              <p className="col-span-4 text-xs text-muted-foreground pl-1 pt-1">
//               Prefiks (XX) formatida (qavs ichida 2 ta raqam) yoki faqat bosh harflar va raqamlardan iborat bo'lishi mumkin (1-6 belgi). Masalan: (01) yoki IPHONE.
//             </p>
//           </div>
//           <ShadDialogFooter>
//             <Button
//               variant="outline"
//               onClick={() => {
//                 setIsAddCategoryModalOpen(false);
//                 setNewCategoryData({ name: "", description: "", barcode_prefix: "" });
//               }}
//             >
//               Bekor Qilish
//             </Button>
//             <Button onClick={handleSaveNewCategory} disabled={isSubmittingCategory}>
//               {isSubmittingCategory ? (
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//               ) : null}
//               Saqlash
//             </Button>
//           </ShadDialogFooter>
//         </ShadDialogContent>
//       </ShadDialog>
//     </div>
//   );
// }

