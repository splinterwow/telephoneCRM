// import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
//   Printer,
//   FolderPlus,
// } from "lucide-react";
// import {
//   Dialog as ShadDialog,
//   DialogContent as ShadDialogContent,
//   DialogDescription as ShadDialogDescription,
//   DialogFooter as ShadDialogFooter,
//   DialogHeader as ShadDialogHeader,
//   DialogTitle as ShadDialogTitle,
// } from "@/components/ui/dialog";
// import { AddProductDialog, DialogView } from "@/components/Products/AddProductDialog";
// import { EditProductDialog } from "@/components/Products/EditProductDialog";
// import { useNavigate } from "react-router-dom";
// import { toast } from "sonner";
// import JsBarcode from 'jsbarcode';

// const API_URL_PRODUCTS = "https://smartphone777.pythonanywhere.com/api/products/";
// const API_URL_CATEGORIES = "https://smartphone777.pythonanywhere.com/api/categories/";

// interface Product {
//   id: number;
//   name: string;
//   category: number;
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

// interface BarcodeDisplayProps {
//   value: string;
//   className?: string;
//   barWidth?: number;
//   barHeight?: number;
//   fontSize?: number;
//   textMargin?: number;
//   svgMargin?: number;
// }

// const BarcodeDisplay: React.FC<BarcodeDisplayProps> = ({
//   value,
//   className,
//   barWidth = 1.2,
//   barHeight = 25,
//   fontSize = 12,
//   textMargin = 1,
//   svgMargin = 0
// }) => {
//   const barcodeRef = useRef<SVGSVGElement>(null);

//   useEffect(() => {
//     if (barcodeRef.current && value) {
//       try {
//         JsBarcode(barcodeRef.current, value, {
//           format: "CODE128",
//           lineColor: "#000000",
//           width: barWidth,
//           height: barHeight,
//           displayValue: true,
//           text: value,
//           fontSize: fontSize,
//           textMargin: textMargin,
//           margin: svgMargin,
//           font: "Arial",
//           textAlign: "center",
//         });
//       } catch (e) {
//         console.error("JsBarcode xatosi (qiymat: " + value + "):", e);
//         if (barcodeRef.current) {
//           barcodeRef.current.innerHTML = `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="${fontSize}" fill="red">Error</text>`;
//         }
//       }
//     }
//   }, [value, barWidth, barHeight, fontSize, textMargin, svgMargin]);

//   return <svg ref={barcodeRef} className={className}></svg>;
// };

// export default function ProductsPage() {
//   const [products, setProducts] = useState<Product[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [search, setSearch] = useState("");
//   const [categories, setCategories] = useState<Category[]>([]);

//   const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
//   const [addDialogInitialView, setAddDialogInitialView] = useState<DialogView>('phone');

//   const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
//   const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

//   const [productToDelete, setProductToDelete] = useState<Product | null>(null);
//   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

//   const [productsToPrint, setProductsToPrint] = useState<Product[]>([]);
//   const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

//   const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
//   const [newCategoryData, setNewCategoryData] = useState({
//     name: "",
//     description: "",
//     barcode_prefix: "",
//   });
//   const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

//   const navigate = useNavigate();

//   const formatPriceForTable = useCallback((price: string | null | undefined, currency: '$' | "so'm" = '$'): string => {
//     if (price === null || price === undefined || price === "") return "-";
//     const numericPrice = parseFloat(price);
//     if (isNaN(numericPrice)) return "N/A";
//     let options: Intl.NumberFormatOptions = {};
//     if (currency === '$') {
//       options = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
//       if (numericPrice % 1 === 0) {
//         options = { maximumFractionDigits: 0 };
//       }
//     } else { options = { maximumFractionDigits: 0 }; }
//     const formatted = numericPrice.toLocaleString(currency === '$' ? 'en-US' : 'uz-UZ', options);
//     return currency === '$' ? `$${formatted}` : `${formatted} so'm`;
//   }, []);

//   const getPriceForPrint = useCallback((product: Product): string => {
//     if (product.price_uzs && parseFloat(product.price_uzs) > 0) {
//       return `${parseFloat(product.price_uzs).toLocaleString('uz-UZ', { maximumFractionDigits: 0 })} UZS`;
//     } else if (product.price_usd && parseFloat(product.price_usd) > 0) {
//       const numericPrice = parseFloat(product.price_usd);
//       if (numericPrice % 1 === 0) { return `$${numericPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`; }
//       else { return `$${numericPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
//     }
//     return "-";
//   }, []);

//   const determineProductTypeForDisplay = useCallback((product: Product): string => {
//     const categoryName = product.category_name?.toLowerCase() || "";
//     const productName = product.name?.toLowerCase() || "";
//     if (categoryName.includes("iphone") || productName.toLowerCase().startsWith("iphone")) return "iPhone";
//     if (categoryName.includes("android") || (categoryName.includes("phone") && !productName.toLowerCase().startsWith("iphone")) || (categoryName.includes("telefon") && !productName.toLowerCase().startsWith("iphone"))) return "Android";
//     if (categoryName.includes("accessory") || categoryName.includes("aksesuar")) return "Aksesuar";
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
//         timeout: 20000,
//       });
//       let fetchedProducts: Product[] = [];
//       if ('results' in response.data && Array.isArray(response.data.results)) {
//         fetchedProducts = response.data.results;
//       } else if (Array.isArray(response.data)) {
//         fetchedProducts = response.data;
//       } else {
//         setError("Mahsulot ma'lumotlari noto'g'ri formatda keldi.");
//         setProducts([]);
//         setIsLoading(false);
//         return;
//       }
//       setProducts(fetchedProducts.filter(product => product.is_active === true).reverse());
//     } catch (err: any) {
//       if (err.response?.status === 401) {
//         setError("Sessiya muddati tugagan. Iltimos, tizimga qayta kiring.");
//         navigate("/login");
//       } else if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
//         setError("Serverga ulanishda vaqt tugadi. Internet aloqangizni tekshiring yoki keyinroq urinib ko'ring.");
//       } else {
//         setError("Ma'lumotlarni yuklashda xatolik: " + (err.response?.data?.detail || err.message || "Noma'lum server xatosi."));
//       }
//       setProducts([]);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [navigate]);

//   const fetchCategories = useCallback(async () => {
//     try {
//       const token = localStorage.getItem("accessToken");
//       if (!token) return;
//       const response = await axios.get<Category[]>(API_URL_CATEGORIES, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setCategories(response.data);
//     } catch (err) {
//       console.error("Kategoriyalarni yuklashda xatolik:", err);
//     }
//   }, []);

//   const createCategory = useCallback(async (categoryName: string) => {
//     try {
//       const token = localStorage.getItem("accessToken");
//       if (!token) {
//         toast.error("Avtorizatsiya tokeni yo'q.");
//         return null;
//       }
//       const response = await axios.post<Category>(
//         API_URL_CATEGORIES,
//         { name: categoryName },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       toast.success(`Kategoriya "${categoryName}" muvaffaqiyatli qo'shildi!`);
//       setCategories((prev) => [...prev, response.data]);
//       return response.data;
//     } catch (err: any) {
//       const errorMessage = err.response?.data?.detail || err.message || "Kategoriya qo'shishda xatolik.";
//       toast.error(errorMessage);
//       return null;
//     }
//   }, []);

//   const handleSaveNewCategory = async () => {
//     if (!newCategoryData.name.trim()) {
//       toast.error("Kategoriya nomi bo'sh bo'lishi mumkin emas.");
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
//       fetchCategories();
//     } catch (err: any) {
//       let errorMessage = `Kategoriya qo'shishda xatolik: `;
//       if (err.response?.data && typeof err.response.data === 'object') {
//         Object.keys(err.response.data).forEach(key => {
//           const errorValue = Array.isArray(err.response.data[key]) ? err.response.data[key].join(', ') : err.response.data[key];
//           errorMessage += `${key}: ${errorValue} `;
//         });
//       } else {
//         errorMessage += err.response?.data?.detail || err.message || "Noma'lum server xatosi.";
//       }
//       toast.error(errorMessage.trim(), { duration: 7000 });
//     } finally {
//       setIsSubmittingCategory(false);
//     }
//   };

//   useEffect(() => {
//     fetchProducts();
//     fetchCategories();
//   }, [fetchProducts, fetchCategories]);

//   const filteredProducts = useMemo(() => {
//     const trimmedSearch = search.trim();
//     if (!trimmedSearch) return products;
//     const lowerCaseSearch = trimmedSearch.toLowerCase();
//     const isPotentialBarcode = /^\d+$/.test(trimmedSearch);
//     return products.filter(product => {
//       if (isPotentialBarcode && product.barcode) {
//         return product.barcode.toLowerCase().includes(lowerCaseSearch);
//       }
//       return (
//         product.name?.toLowerCase().includes(lowerCaseSearch) ||
//         product.series_region?.toLowerCase().includes(lowerCaseSearch) ||
//         product.category_name?.toLowerCase().includes(lowerCaseSearch) ||
//         product.color?.toLowerCase().includes(lowerCaseSearch) ||
//         product.storage_capacity?.toLowerCase().includes(lowerCaseSearch)
//       );
//     });
//   }, [products, search]);

//   const handleProductAdded = (newlyAddedProduct: Product) => {
//     setProducts((prevProducts) => [newlyAddedProduct, ...prevProducts]);
//     setIsAddProductDialogOpen(false);
//   };
//   const handleProductSuccessfullyEdited = (editedProduct: Product) => {
//     setProducts((prevProducts) =>
//       prevProducts.map((p) => (p.id === editedProduct.id ? editedProduct : p))
//     );
//     setIsEditDialogOpen(false);
//   };
//   const handleDeleteConfirmation = async () => {
//     if (!productToDelete) return;
//     const originalProducts = [...products];
//     setProducts(prev => prev.filter(p => p.id !== productToDelete!.id));
//     setIsDeleteDialogOpen(false);
//     try {
//       const token = localStorage.getItem("accessToken");
//       if (!token) {
//         toast.error("Avtorizatsiya tokeni yo'q.");
//         setProducts(originalProducts);
//         setProductToDelete(null);
//         return;
//       }
//       await axios.put(`${API_URL_PRODUCTS}${productToDelete.id}/`,
//         { ...productToDelete, is_active: false },
//         { headers: { Authorization: `Bearer ${token}` }}
//       );
//       toast.success(`"${productToDelete.name}" arxivlandi.`);
//       setProductToDelete(null);
//     } catch (err: any) {
//       let errorMessage = `"${productToDelete.name}" ni o'chirishda xato: `;
//       if (err.response?.data && typeof err.response.data === 'object') {
//         for (const key in err.response.data) {
//           const errorValue = Array.isArray(err.response.data[key]) ? err.response.data[key].join(', ') : err.response.data[key];
//           errorMessage += `${key}: ${errorValue}. `;
//         }
//       } else {
//         errorMessage += err.response?.data?.detail || err.message || "Noma'lum server xatosi.";
//       }
//       toast.error(errorMessage, {duration: 7000});
//       setProducts(originalProducts);
//       setProductToDelete(null);
//     }
//   };
//   const openEditDialog = (product: Product) => { setSelectedProductForEdit(product); setIsEditDialogOpen(true); };
//   const openDeleteDialog = (product: Product) => { setProductToDelete(product); setIsDeleteDialogOpen(true); };

//   const handleOpenPrintModal = () => {
//     const sourceList = search.trim() ? filteredProducts : products;
//     const itemsToPrint = sourceList.filter(p =>
//         p.barcode && p.barcode.trim() !== "" &&
//         ((p.price_uzs && parseFloat(p.price_uzs) > 0) || (p.price_usd && parseFloat(p.price_usd) > 0))
//     );
//     if (itemsToPrint.length > 0) {
//         setProductsToPrint(itemsToPrint);
//         setIsPrintModalOpen(true);
//     } else {
//         toast.info("Chop etish uchun shtrix kodli va narxli (UZS yoki USD) mahsulotlar topilmadi.");
//     }
//   };

//   const printContent = () => {
//     const printWindow = window.open('', '_blank', 'width=400,height=600');
//     if (!printWindow) {
//       toast.error("Pop-up oynasi bloklandi. Iltimos, brauzer sozlamalarida pop-uplarga ruxsat bering va qayta urinib ko'ring.");
//       setIsPrintModalOpen(false);
//       return;
//     }

//     let labelsHtml = productsToPrint.map((p) => {
//       if (!p.barcode) return '';

//       let priceText = getPriceForPrint(p);
//       if (priceText !== "-") {
//           priceText = `Narxi: ${priceText}`;
//       }

//       let detailsHtml = '';
//       const detailsArray: string[] = [];
//       if (p.storage_capacity) {
//         detailsArray.push(`Xotira: ${p.storage_capacity}`);
//       }
//       if (determineProductTypeForDisplay(p) === "iPhone" && p.battery_health) {
//         detailsArray.push(`Batareya: ${p.battery_health}%`);
//       }

//       if (detailsArray.length > 0) {
//           const detailsContent = detailsArray.map(detail => `<div class="detail-item">${detail}</div>`).join('');
//           detailsHtml = `<div class="label-details">${detailsContent}</div>`;
//       }

//       const barWidth = 0.8;
//       const barHeight = 10;
//       const fontSize = 7;
//       const textMargin = 0;
//       const svgMargin = 0;

//       return `
//         <div class="print-label">
//           <div class="label-name">${p.name || ''}</div>
//           <div class="label-price">${priceText}</div>
//           ${detailsHtml}
//           <div class="label-barcode">
//             <svg class="barcode-svg"
//                  data-value="${p.barcode}"
//                  data-bar-width="${barWidth}"
//                  data-bar-height="${barHeight}"
//                  data-font-size="${fontSize}"
//                  data-text-margin="${textMargin}"
//                  data-svg-margin="${svgMargin}"
//             ></svg>
//           </div>
//         </div>`;
//     }).join('');

//     printWindow.document.write(`
//       <html>
//         <head>
//           <title>Shtrix Kodlar (50x30mm)</title>
//           <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
//           <style>
//             /* PRINTER SOZLAMALARI UCHUN ASOSIY QOIDALAR */
//             @page {
//               size: 50mm 30mm; /* Qog'oz o'lchami: kengligi 50mm, balandligi 30mm */
//               margin: 0mm !important; /* Qog'oz chetidagi bo'sh joylar (margins) ni olib tashlash */
//             }
//             html, body {
//               width: 50mm; /* HTML va BODY elementlarining kengligi qog'ozga mos kelishi */
//               height: 30mm; /* HTML va BODY elementlarining balandligi qog'ozga mos kelishi */
//               margin: 0 !important;
//               padding: 0;
//               box-sizing: border-box;
//               font-family: 'Arial', sans-serif;
//               -webkit-print-color-adjust: exact !important; /* Brauzer ranglarni to'g'ri chop etishi uchun (Chrome/Safari) */
//               print-color-adjust: exact !important; /* Brauzer ranglarni to'g'ri chop etishi uchun (standart) */
//               background-color: #fff; /* Orqa fonni oq qilish (ba'zi printerlar uchun kerak) */
//             }
//             /* HAR BIR ETIKETKA UCHUN STIL */
//             .print-label {
//               width: 50mm; /* Etiketka kengligi */
//               height: 30mm; /* Etiketka balandligi */
//               padding: 0.8mm 2mm; /* Ichki bo'sh joy: tepa/past 0.8mm, yonlar 2mm */
//               text-align: center;
//               display: flex;
//               flex-direction: column;
//               justify-content: center; /* <<< O'ZGARTIRILDI: Elementlarni vertikal markazlashtiradi */
//               align-items: center; /* Elementlarni gorizontal markazlashtirish */
//               box-sizing: border-box;
//               background-color: #fff; /* Etiketka foni oq */
//               overflow: hidden !important; /* Tarkib etiketkadan chiqib ketmasligi uchun juda muhim! */
//               page-break-after: always; /* Har bir etiketkadan keyin yangi varaqqa o'tish */
//             }
//             .label-name {
//               font-size: 7.5pt;
//               font-weight: bold;
//               margin-bottom: 0.3mm; /* Markazlashganda oradagi masofani biroz oshirish */
//               color: #000;
//               white-space: nowrap;
//               width: 100%;
//               overflow: hidden;
//               text-overflow: ellipsis;
//               line-height: 1.1;
//             }
//             .label-price {
//               font-size: 8pt;
//               font-weight: bold;
//               margin-bottom: 0.4mm; /* Markazlashganda oradagi masofani biroz oshirish */
//               color: #000;
//               white-space: nowrap;
//               overflow: hidden;
//               text-overflow: ellipsis;
//               line-height: 1.1;
//             }
//             .label-details {
//               width: 100%;
//               font-size: 6.5pt;
//               font-weight: normal;
//               color: #000;
//               text-align: center;
//               margin-bottom: 0.3mm; /* Markazlashganda oradagi masofani biroz oshirish */
//             }
//             .detail-item {
//               white-space: nowrap;
//               overflow: hidden;
//               text-overflow: ellipsis;
//               width: 100%;
//               line-height: 1.15;
//             }
//             .label-barcode {
//               width: 100%;
//               margin-top: 0.2mm;  /* Shtrix kod va detallar orasidagi masofa */
//               padding-bottom: 0mm;
//               display: flex;
//               justify-content: center; /* Shtrix kodni gorizontal markazlashtirish */
//               align-items: center; /* Shtrix kodni vertikal markazlashtirish (agar bo'sh joy bo'lsa) */
//             }
//             .label-barcode svg {
//               display: block; /* Inline SVG ostidagi qo'shimcha bo'sh joyni olib tashlaydi */
//               max-width: 95%; /* Shtrix kod sig'ishi uchun */
//             }
//           </style>
//         </head>
//         <body>
//           ${labelsHtml}
//           <script type="text/javascript">
//             window.onload = function() {
//               try {
//                 const svgs = document.querySelectorAll('.barcode-svg');
//                 svgs.forEach(svgElement => {
//                   const value = svgElement.getAttribute('data-value');
//                   const barWidth = parseFloat(svgElement.getAttribute('data-bar-width'));
//                   const barHeight = parseInt(svgElement.getAttribute('data-bar-height'));
//                   const fontSize = parseFloat(svgElement.getAttribute('data-font-size'));
//                   const textMargin = parseFloat(svgElement.getAttribute('data-text-margin'));
//                   const svgMargin = parseInt(svgElement.getAttribute('data-svg-margin'));
//                   if (value) {
//                     JsBarcode(svgElement, value, {
//                       format: "CODE128",
//                       lineColor: "#000000",
//                       width: barWidth,
//                       height: barHeight,
//                       displayValue: true,
//                       text: value,
//                       fontSize: fontSize,
//                       textMargin: textMargin,
//                       margin: svgMargin,
//                       font: "Arial",
//                       textAlign: "center",
//                     });
//                   }
//                 });
//               } catch (e) {
//                 console.error("JsBarcode error in print window:", e);
//               }
//               setTimeout(function() {
//                 window.print();
//                 var mediaQueryList = window.matchMedia('print');
//                 var closingScheduled = false;
//                 function closePrintWindow() {
//                     if (!closingScheduled && printWindow && !printWindow.closed) {
//                         closingScheduled = true;
//                         setTimeout(function() {
//                             if (printWindow && !printWindow.closed) {
//                                 printWindow.close();
//                             }
//                         }, 200);
//                     }
//                 }
//                 mediaQueryList.addListener(function(mql) {
//                     if (!mql.matches) {
//                         closePrintWindow();
//                     }
//                 });
//                 window.onafterprint = function() {
//                    closePrintWindow();
//                 }
//                 setTimeout(function() {
//                     closePrintWindow();
//                 }, 5000);
//               }, 700);
//             };
//           </script>
//         </body>
//       </html>
//     `);
//     printWindow.document.close();
//     setIsPrintModalOpen(false);
//   };

//   return (
//     <div className="flex flex-col h-full p-4 md:p-6 space-y-5 bg-muted/20">
//       <header className="flex flex-col sm:flex-row justify-between items-center gap-4">
//         <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Mahsulotlar</h1>
//         <div className="flex gap-2 flex-wrap">
//           <Button className="flex items-center gap-2 shadow-sm" onClick={() => { setAddDialogInitialView('phone'); setIsAddProductDialogOpen(true); }}>
//             <Smartphone className="h-4 w-4" /> Telefon qo‘shish
//           </Button>
//           <Button variant="outline" className="flex items-center gap-2 shadow-sm" onClick={() => { setAddDialogInitialView('accessory'); setIsAddProductDialogOpen(true); }}>
//             <Headphones className="h-4 w-4" /> Aksesuar qo‘shish
//           </Button>
//           <Button variant="outline" className="flex items-center gap-2 shadow-sm" onClick={() => setIsAddCategoryModalOpen(true)}>
//             <FolderPlus className="h-4 w-4" /> Kategoriya qo‘shish
//           </Button>
//           <Button variant="outline" className="flex items-center gap-2 shadow-sm" onClick={handleOpenPrintModal} title="Shtrix kodlarni chop etish">
//             <Printer className="h-4 w-4" /> Chop etish
//           </Button>
//         </div>
//       </header>

//       <Card className="flex-grow flex flex-col overflow-hidden shadow-sm border">
//         <CardHeader className="border-b px-4 py-3 sm:px-6 sm:py-4">
//           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
//             <div>
//               <CardTitle className="text-lg sm:text-xl">Mahsulotlar Ro‘yxati</CardTitle>
//               <CardDescription className="text-xs sm:text-sm mt-0.5">
//                 Jami {filteredProducts.length} ta mahsulot ({products.length} tadan).
//               </CardDescription>
//             </div>
//             <div className="relative w-full md:w-64 lg:w-72">
//               <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//               <Input placeholder="Qidirish yoki skanerlash..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-sm w-full" />
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
//               <Button onClick={fetchProducts} variant="outline" size="sm" className="mt-3">Qayta urinish</Button>
//             </div>
//           ) : filteredProducts.length > 0 ? (
//             <Table className="text-xs sm:text-sm">
//               <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
//                 <TableRow>
//                   <TableHead className="w-[200px] px-2 py-2.5 sm:px-4">Nomi</TableHead>
//                   <TableHead className="hidden xl:table-cell px-2 sm:px-4">Shtrix Kod</TableHead>
//                   <TableHead className="px-2 sm:px-4">Turi</TableHead>
//                   <TableHead className="px-2 sm:px-4">Sotish narxi</TableHead>
//                   <TableHead className="hidden md:table-cell px-2 sm:px-4">Olingan</TableHead>
//                   <TableHead className="hidden lg:table-cell px-2 sm:px-4">Xotira</TableHead>
//                   <TableHead className="hidden sm:table-cell px-2 sm:px-4">Rangi</TableHead>
//                   <TableHead className="text-right w-[100px] px-2 py-2.5 sm:px-4">Amallar</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filteredProducts.map((product) => (
//                   <TableRow key={product.id} className="hover:bg-muted/50">
//                     <TableCell className="font-medium px-2 py-2.5 sm:px-4">{product.name || "-"}</TableCell>
//                     <TableCell className="hidden xl:table-cell px-2 sm:px-4">{product.barcode || "-"}</TableCell>
//                     <TableCell className="px-2 sm:px-4">{determineProductTypeForDisplay(product)}</TableCell>
//                     <TableCell className="px-2 sm:px-4">
//                       {product.price_uzs && parseFloat(product.price_uzs) > 0 ? formatPriceForTable(product.price_uzs, "so'm") : product.price_usd && parseFloat(product.price_usd) > 0 ? formatPriceForTable(product.price_usd, "$") : "-"}
//                     </TableCell>
//                     <TableCell className="hidden md:table-cell px-2 sm:px-4">{formatPriceForTable(product.purchase_price_usd, "$")}</TableCell>
//                     <TableCell className="hidden lg:table-cell px-2 sm:px-4">{product.storage_capacity || '-'}</TableCell>
//                     <TableCell className="hidden sm:table-cell px-2 sm:px-4">{product.color || '-'}</TableCell>
//                     <TableCell className="text-right px-2 py-2.5 sm:px-4">
//                       <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10" onClick={() => openEditDialog(product)} title="Tahrirlash">
//                         <Pencil className="h-3.5 w-3.5" />
//                       </Button>
//                       <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10 ml-1" onClick={() => openDeleteDialog(product)} title="O'chirish">
//                         <Trash2 className="h-3.5 w-3.5" />
//                       </Button>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           ) : (
//             <div className="flex flex-col items-center justify-center h-full text-center p-6 sm:p-10">
//               <PackageSearch className="w-16 h-16 sm:w-20 sm:h-20 text-muted-foreground mb-4 sm:mb-6" />
//               <p className="text-md sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">
//                 {search ? "Qidiruv bo'yicha mahsulot topilmadi" : "Hozircha mahsulotlar yo'q"}
//               </p>
//               <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
//                 {search ? "Boshqa kalit so'z bilan qidirib ko'ring yoki qidiruvni tozalang." : "Yangi mahsulot qo'shish uchun yuqoridagi tugmalardan foydalaning."}
//               </p>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {isAddProductDialogOpen && (
//         <AddProductDialog
//           open={isAddProductDialogOpen}
//           onOpenChange={setIsAddProductDialogOpen}
//           onAddProduct={handleProductAdded}
//           initialView={addDialogInitialView}
//           categories={categories}
//           onCreateCategory={createCategory}
//         />
//       )}
//       {isEditDialogOpen && selectedProductForEdit && (
//         <EditProductDialog
//           open={isEditDialogOpen}
//           onOpenChange={(isOpen) => { setIsEditDialogOpen(isOpen); if (!isOpen) setSelectedProductForEdit(null); }}
//           product={selectedProductForEdit}
//           onProductSuccessfullyEdited={handleProductSuccessfullyEdited}
//         />
//       )}
//       <ShadDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
//         <ShadDialogContent>
//           <ShadDialogHeader>
//             <ShadDialogTitle className="text-lg font-semibold">O'chirishni Tasdiqlang</ShadDialogTitle>
//             <ShadDialogDescription className="mt-2 text-sm">
//               {productToDelete ? `"${productToDelete.name}" nomli mahsulotni arxivlaysizmi?` : "Mahsulotni arxivlash."}
//             </ShadDialogDescription>
//           </ShadDialogHeader>
//           <ShadDialogFooter className="mt-5">
//             <Button variant="outline" onClick={() => { setIsDeleteDialogOpen(false); setProductToDelete(null); }}>Bekor Qilish</Button>
//             <Button variant="destructive" onClick={handleDeleteConfirmation}>Ha, Arxivlash</Button>
//           </ShadDialogFooter>
//         </ShadDialogContent>
//       </ShadDialog>

//       <ShadDialog open={isAddCategoryModalOpen} onOpenChange={(isOpen) => {
//           setIsAddCategoryModalOpen(isOpen);
//           if (!isOpen) {
//             setNewCategoryData({ name: "", description: "", barcode_prefix: "" });
//           }
//       }}>
//         <ShadDialogContent className="sm:max-w-md">
//           <ShadDialogHeader>
//             <ShadDialogTitle>Yangi Kategoriya Qo'shish</ShadDialogTitle>
//             <ShadDialogDescription>
//               Yangi mahsulot kategoriyasini kiriting. Majburiy maydonlar to'ldirilishi shart.
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
//                 onChange={(e) => setNewCategoryData({ ...newCategoryData, name: e.target.value })}
//                 className="col-span-3"
//                 placeholder="Masalan, Smartfonlar"
//               />
//             </div>
//             <div className="grid grid-cols-4 items-center gap-4">
//               <Label htmlFor="categoryDescription" className="text-right col-span-1">
//                 Tavsifi
//               </Label>
//               <Input
//                 id="categoryDescription"
//                 value={newCategoryData.description}
//                 onChange={(e) => setNewCategoryData({ ...newCategoryData, description: e.target.value })}
//                 className="col-span-3"
//                 placeholder="Qisqacha tavsif (ixtiyoriy)"
//               />
//             </div>
//             <div className="grid grid-cols-4 items-center gap-4">
//               <Label htmlFor="categoryBarcodePrefix" className="text-right col-span-1">
//                 Shtrix Kod Prefiksi
//               </Label>
//               <Input
//                 id="categoryBarcodePrefix"
//                 value={newCategoryData.barcode_prefix}
//                 onChange={(e) => setNewCategoryData({ ...newCategoryData, barcode_prefix: e.target.value })}
//                 className="col-span-3"
//                 placeholder="Masalan, CAT001 (ixtiyoriy)"
//               />
//             </div>
//           </div>
//           <ShadDialogFooter>
//             <Button variant="outline" onClick={() => {
//                 setIsAddCategoryModalOpen(false);
//                 setNewCategoryData({ name: "", description: "", barcode_prefix: "" });
//             }}>
//               Bekor Qilish
//             </Button>
//             <Button onClick={handleSaveNewCategory} disabled={isSubmittingCategory}>
//               {isSubmittingCategory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
//               Saqlash
//             </Button>
//           </ShadDialogFooter>
//         </ShadDialogContent>
//       </ShadDialog>

//       <ShadDialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
//         <ShadDialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col">
//           <ShadDialogHeader>
//             <ShadDialogTitle>Shtrix Kodlarni Chop Etish (50x30mm Ko'rinishi)</ShadDialogTitle>
//             <ShadDialogDescription>
//               Quyidagi etiketkalar 50mm x 30mm o'lchamdagi qog'ozga chop etiladi.
//               Printer sozlamalarida (More settings -> Paper size) qog'oz o'lchamini "Custom: 50mm x 30mm"
//               qilib tanlang va Margins (Chekka bo'sh joylar) ni "None" (Yo'q) qiling.
//             </ShadDialogDescription>
//           </ShadDialogHeader>
//           <div className="flex-grow overflow-auto p-3 bg-slate-100 dark:bg-slate-800 my-4 rounded-md">
//             <div className="print-preview-grid-modal">
//               {productsToPrint.map((p) => {
//                 const productType = determineProductTypeForDisplay(p);
//                 const isIphone = productType === "iPhone";

//                 let previewPriceText = getPriceForPrint(p);
//                 if (previewPriceText !== "-") {
//                     previewPriceText = `Narxi: ${previewPriceText}`;
//                 }

//                 const previewDetailsArray: string[] = [];
//                 if (p.storage_capacity) {
//                     previewDetailsArray.push(`Xotira: ${p.storage_capacity}`);
//                 }
//                 if (isIphone && p.battery_health) {
//                     previewDetailsArray.push(`Batareya: ${p.battery_health}%`);
//                 }

//                 return p.barcode && (
//                   <div key={p.id} className="print-preview-label-modal">
//                     <div className="preview-label-name-modal">{p.name}</div>
//                     <div className="preview-label-price-modal">{previewPriceText}</div>
//                     {previewDetailsArray.length > 0 && (
//                         <div className="preview-label-details-container-modal">
//                             {previewDetailsArray.map((detail, index) => (
//                                 <div key={index} className="preview-label-details-item-modal">
//                                     {detail}
//                                 </div>
//                             ))}
//                         </div>
//                     )}
//                     <div className="preview-label-barcode-modal">
//                       <BarcodeDisplay
//                         value={p.barcode}
//                         barWidth={0.8}
//                         barHeight={15}
//                         fontSize={8}
//                         textMargin={1}
//                         svgMargin={0}
//                       />
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//           <ShadDialogFooter>
//             <Button variant="outline" onClick={() => setIsPrintModalOpen(false)}>Yopish</Button>
//             <Button onClick={printContent}><Printer className="mr-2 h-4 w-4" /> Chop etish</Button>
//           </ShadDialogFooter>
//         </ShadDialogContent>
//       </ShadDialog>
//       <style jsx global>{`
//         .print-preview-grid-modal { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; padding: 10px; }
//         .print-preview-label-modal { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: center; background-color: #fff; border-radius: 4px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); display: flex; flex-direction: column; justify-content: flex-start; align-items: center; min-height: 130px; font-family: 'Arial', sans-serif; }
//         .dark .print-preview-label-modal { background-color: #1e293b; border-color: #334155; }
//         .preview-label-name-modal { font-weight: 600; font-size: 0.8rem; margin-bottom: 3px; line-height: 1.2; width:100%; color: #1f2937; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
//         .dark .preview-label-name-modal { color: #e2e8f0; }
//         .preview-label-price-modal { font-weight: 700; font-size: 0.85rem; margin-bottom: 4px; color: #1f2937;  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}
//         .dark .preview-label-price-modal { color: #e2e8f0; }

//         .preview-label-details-container-modal {
//             width: 100%;
//             text-align: center;
//             margin-bottom: 4px;
//         }
//         .preview-label-details-item-modal {
//             font-size: 0.7rem;
//             font-weight: 500;
//             line-height: 1.2;
//             color: #475569;
//             white-space: nowrap;
//             overflow: hidden;
//             text-overflow: ellipsis;
//             width: 100%;
//         }
//         .dark .preview-label-details-item-modal { color: #94a3b8; }

//         .preview-label-barcode-modal { width: 100%; margin-top: auto; padding-bottom: 2px; }
//         .preview-label-barcode-modal svg { display: block; margin: 0 auto; max-width: 96%; height: auto; }
//       `}</style>
//     </div>
//   );
// }

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox"; // Checkboxni import qilamiz
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
} from "lucide-react";
import {
  Dialog as ShadDialog,
  DialogContent as ShadDialogContent,
  DialogDescription as ShadDialogDescription,
  DialogFooter as ShadDialogFooter,
  DialogHeader as ShadDialogHeader,
  DialogTitle as ShadDialogTitle,
} from "@/components/ui/dialog";
import { AddProductDialog, DialogView } from "@/components/Products/AddProductDialog"; // Bu fayl avvalgidek qoladi
import { EditProductDialog } from "@/components/Products/EditProductDialog"; // Bu fayl avvalgidek qoladi
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import JsBarcode from 'jsbarcode';

const API_URL_PRODUCTS = "https://smartphone777.pythonanywhere.com/api/products/";
const API_URL_CATEGORIES = "https://smartphone777.pythonanywhere.com/api/categories/";

interface Product {
  id: number;
  name: string;
  category: number;
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
}

const BarcodeDisplay: React.FC<BarcodeDisplayProps> = ({
  value,
  className,
  barWidth = 1.2, // Preview uchun standart o'lchamlar
  barHeight = 25,
  fontSize = 12,
  textMargin = 1,
  svgMargin = 0
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
          displayValue: true,
          text: value,
          fontSize: fontSize,
          textMargin: textMargin,
          margin: svgMargin,
          font: "Arial",
          textAlign: "center",
        });
      } catch (e) {
        console.error("JsBarcode xatosi (qiymat: " + value + "):", e);
        if (barcodeRef.current) {
          barcodeRef.current.innerHTML = `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="${fontSize}" fill="red">Error</text>`;
        }
      }
    }
  }, [value, barWidth, barHeight, fontSize, textMargin, svgMargin]);

  return <svg ref={barcodeRef} className={className}></svg>;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [addDialogInitialView, setAddDialogInitialView] = useState<DialogView>('phone');

  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [eligibleProductsForPrint, setEligibleProductsForPrint] = useState<Product[]>([]);
  const [selectedProductsToPrint, setSelectedProductsToPrint] = useState<Record<number, boolean>>({});
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({ name: "", description: "", barcode_prefix: "" });
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  const navigate = useNavigate();

  const formatPriceForTable = useCallback((price: string | null | undefined, currency: '$' | "so'm" = '$'): string => {
    if (price === null || price === undefined || price === "") return "-";
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) return "N/A";
    let options: Intl.NumberFormatOptions = {};
    if (currency === '$') {
      options = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
      if (numericPrice % 1 === 0) options = { maximumFractionDigits: 0 };
    } else { options = { maximumFractionDigits: 0 }; }
    const formatted = numericPrice.toLocaleString(currency === '$' ? 'en-US' : 'uz-UZ', options);
    return currency === '$' ? `$${formatted}` : `${formatted} so'm`;
  }, []);

  const getPriceForPrint = useCallback((product: Product): string => {
    if (product.price_uzs && parseFloat(product.price_uzs) > 0) {
      return `${parseFloat(product.price_uzs).toLocaleString('uz-UZ', { maximumFractionDigits: 0 })} UZS`;
    } else if (product.price_usd && parseFloat(product.price_usd) > 0) {
      const numericPrice = parseFloat(product.price_usd);
      if (numericPrice % 1 === 0) return `$${numericPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
      else return `$${numericPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return "-";
  }, []);

  const determineProductTypeForDisplay = useCallback((product: Product): string => {
    const categoryName = product.category_name?.toLowerCase() || "";
    const productName = product.name?.toLowerCase() || "";
    if (categoryName.includes("iphone") || productName.toLowerCase().startsWith("iphone")) return "iPhone";
    if (categoryName.includes("android") || (categoryName.includes("phone") && !productName.toLowerCase().startsWith("iphone")) || (categoryName.includes("telefon") && !productName.toLowerCase().startsWith("iphone"))) return "Android";
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
      const response = await axios.get<{ results: Product[] } | Product[]>(API_URL_PRODUCTS, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 20000,
      });
      let fetchedProducts: Product[] = [];
      if ('results' in response.data && Array.isArray(response.data.results)) {
        fetchedProducts = response.data.results;
      } else if (Array.isArray(response.data)) {
        fetchedProducts = response.data;
      } else {
        setError("Mahsulot ma'lumotlari noto'g'ri formatda keldi.");
        setProducts([]);
        setIsLoading(false);
        return;
      }
      setProducts(fetchedProducts.filter(product => product.is_active === true).reverse());
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Sessiya muddati tugagan. Iltimos, tizimga qayta kiring.");
        navigate("/login");
      } else if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
        setError("Serverga ulanishda vaqt tugadi. Internet aloqangizni tekshiring yoki keyinroq urinib ko'ring.");
      } else {
        setError("Ma'lumotlarni yuklashda xatolik: " + (err.response?.data?.detail || err.message || "Noma'lum server xatosi."));
      }
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const fetchCategories = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      const response = await axios.get<Category[]>(API_URL_CATEGORIES, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(response.data);
    } catch (err) {
      console.error("Kategoriyalarni yuklashda xatolik:", err);
    }
  }, []);

  const createCategory = useCallback(async (categoryName: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Avtorizatsiya tokeni yo'q.");
        return null;
      }
      const response = await axios.post<Category>(
        API_URL_CATEGORIES,
        { name: categoryName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Kategoriya "${categoryName}" muvaffaqiyatli qo'shildi!`);
      setCategories((prev) => [...prev, response.data]);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || "Kategoriya qo'shishda xatolik.";
      toast.error(errorMessage);
      return null;
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
      const payload = {
        name: newCategoryData.name.trim(),
        description: newCategoryData.description.trim() || null,
        barcode_prefix: newCategoryData.barcode_prefix.trim() || null,
      };
      await axios.post(API_URL_CATEGORIES, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`Kategoriya "${newCategoryData.name}" muvaffaqiyatli qo'shildi!`);
      setIsAddCategoryModalOpen(false);
      setNewCategoryData({ name: "", description: "", barcode_prefix: "" });
      fetchCategories();
    } catch (err: any) {
      let errorMessage = `Kategoriya qo'shishda xatolik: `;
      if (err.response?.data && typeof err.response.data === 'object') {
        Object.keys(err.response.data).forEach(key => {
          const errorValue = Array.isArray(err.response.data[key]) ? err.response.data[key].join(', ') : err.response.data[key];
          errorMessage += `${key}: ${errorValue} `;
        });
      } else {
        errorMessage += err.response?.data?.detail || err.message || "Noma'lum server xatosi.";
      }
      toast.error(errorMessage.trim(), { duration: 7000 });
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
    const isPotentialBarcode = /^\d+$/.test(trimmedSearch);
    return products.filter(product => {
      if (isPotentialBarcode && product.barcode) {
        return product.barcode.toLowerCase().includes(lowerCaseSearch);
      }
      return (
        product.name?.toLowerCase().includes(lowerCaseSearch) ||
        product.series_region?.toLowerCase().includes(lowerCaseSearch) ||
        product.category_name?.toLowerCase().includes(lowerCaseSearch) ||
        product.color?.toLowerCase().includes(lowerCaseSearch) ||
        product.storage_capacity?.toLowerCase().includes(lowerCaseSearch)
      );
    });
  }, [products, search]);

  const handleProductAdded = (newlyAddedProduct: Product) => {
    setProducts((prevProducts) => [newlyAddedProduct, ...prevProducts]);
    setIsAddProductDialogOpen(false);
  };
  const handleProductSuccessfullyEdited = (editedProduct: Product) => {
    setProducts((prevProducts) =>
      prevProducts.map((p) => (p.id === editedProduct.id ? editedProduct : p))
    );
    setIsEditDialogOpen(false);
  };
  const handleDeleteConfirmation = async () => {
    if (!productToDelete) return;
    const originalProducts = [...products];
    setProducts(prev => prev.filter(p => p.id !== productToDelete!.id));
    setIsDeleteDialogOpen(false);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Avtorizatsiya tokeni yo'q.");
        setProducts(originalProducts);
        setProductToDelete(null);
        return;
      }
      await axios.put(`${API_URL_PRODUCTS}${productToDelete.id}/`,
        { ...productToDelete, is_active: false },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      toast.success(`"${productToDelete.name}" arxivlandi.`);
      setProductToDelete(null);
    } catch (err: any) {
      let errorMessage = `"${productToDelete.name}" ni o'chirishda xato: `;
      if (err.response?.data && typeof err.response.data === 'object') {
        for (const key in err.response.data) {
          const errorValue = Array.isArray(err.response.data[key]) ? err.response.data[key].join(', ') : err.response.data[key];
          errorMessage += `${key}: ${errorValue}. `;
        }
      } else {
        errorMessage += err.response?.data?.detail || err.message || "Noma'lum server xatosi.";
      }
      toast.error(errorMessage, {duration: 7000});
      setProducts(originalProducts);
      setProductToDelete(null);
    }
  };
  const openEditDialog = (product: Product) => { setSelectedProductForEdit(product); setIsEditDialogOpen(true); };
  const openDeleteDialog = (product: Product) => { setProductToDelete(product); setIsDeleteDialogOpen(true); };

  const handleOpenPrintModal = () => {
    const sourceList = search.trim() ? filteredProducts : products;
    const itemsToPrint = sourceList.filter(p =>
        p.barcode && p.barcode.trim() !== "" &&
        ((p.price_uzs && parseFloat(p.price_uzs) > 0) || (p.price_usd && parseFloat(p.price_usd) > 0))
    );
    if (itemsToPrint.length > 0) {
        setEligibleProductsForPrint(itemsToPrint);
        const initialSelections: Record<number, boolean> = {};
        itemsToPrint.forEach(p => { initialSelections[p.id] = true; }); // Avvaliga hammasini tanlangan qilamiz
        setSelectedProductsToPrint(initialSelections);
        setIsPrintModalOpen(true);
    } else {
        toast.info("Chop etish uchun shtrix kodli va narxli mahsulotlar topilmadi.");
    }
  };

  const printContent = (items: Product[]) => {
    if (!items || items.length === 0) {
      toast.info("Chop etish uchun mahsulot tanlanmagan.");
      return;
    }
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      toast.error("Pop-up oynasi bloklandi. Iltimos, brauzer sozlamalarida pop-uplarga ruxsat bering va qayta urinib ko'ring.");
      setIsPrintModalOpen(false);
      return;
    }

    let labelsHtml = items.map((p) => {
      if (!p.barcode) return '';

      let priceText = getPriceForPrint(p);
      if (priceText !== "-") priceText = `Narxi: ${priceText}`;

      const detailsArray: string[] = [];
      if (p.storage_capacity) detailsArray.push(`Xotira: ${p.storage_capacity}`);
      if (determineProductTypeForDisplay(p) === "iPhone" && p.battery_health) {
        detailsArray.push(`Batareya: ${p.battery_health}%`);
      }
      if (determineProductTypeForDisplay(p) === "Aksesuar" && p.description && p.description.trim() !== "") {
          detailsArray.push(`${p.description.substring(0, 25)}${p.description.length > 25 ? '...' : ''}`);
      }

      const detailsHtml = detailsArray.length > 0
        ? `<div class="label-details">${detailsArray.map(d => `<div class="detail-item">${d}</div>`).join('')}</div>`
        : '';

      const barWidth = 1.3;
      const barHeight = 35;
      const fontSize = 9;
      const textMargin = 1;
      const svgMargin = 0;

      return `
        <div class="print-label">
          <div class="label-name">${p.name || ''}</div>
          <div class="label-price">${priceText}</div>
          ${detailsHtml}
          <div class="label-barcode">
            <svg class="barcode-svg"
                 data-value="${p.barcode}"
                 data-bar-width="${barWidth}"
                 data-bar-height="${barHeight}"
                 data-font-size="${fontSize}"
                 data-text-margin="${textMargin}"
                 data-svg-margin="${svgMargin}"
            ></svg>
          </div>
        </div>`;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Shtrix Kodlar (50x30mm)</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <style>
            @page {
              size: 50mm 30mm;
              margin: 0mm !important;
            }
            html, body {
              width: 50mm;
              height: 30mm;
              margin: 0 !important;
              padding: 0;
              box-sizing: border-box;
              font-family: 'Arial', sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              background-color: #fff;
            }
            .print-label {
              width: 100%;
              height: 100%;
              padding: 1.5mm; /* Har tomondan bir xil masofa */
              text-align: center;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              box-sizing: border-box;
              background-color: #fff;
              overflow: hidden !important;
              page-break-after: always;
            }
            .label-name {
              font-size: 7pt;
              font-weight: bold;
              margin-bottom: 0.5mm;
              color: #000;
              white-space: nowrap;
              width: 100%;
              overflow: hidden;
              text-overflow: ellipsis;
              line-height: 1.1;
            }
            .label-price {
              font-size: 8pt;
              font-weight: bold;
              margin-bottom: 0.5mm;
              color: #000;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              line-height: 1.1;
            }
            .label-details {
              width: 100%;
              font-size: 6pt;
              font-weight: normal;
              color: #000;
              text-align: center;
              margin-bottom: 0.5mm;
            }
            .detail-item {
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              width: 100%;
              line-height: 1.15;
            }
            .label-barcode {
              width: 100%;
              margin-top: 0.5mm;
              display: flex;
              justify-content: center;
              align-items: flex-end;
            }
            .label-barcode svg {
              display: block;
              max-width: 95%;
              height: auto;
            }
          </style>
        </head>
        <body>
          ${labelsHtml}
          <script type="text/javascript">
            window.onload = function() {
              try {
                const svgs = document.querySelectorAll('.barcode-svg');
                svgs.forEach(svgElement => {
                  const value = svgElement.getAttribute('data-value');
                  const barWidth = parseFloat(svgElement.getAttribute('data-bar-width'));
                  const barHeight = parseInt(svgElement.getAttribute('data-bar-height'));
                  const fontSize = parseFloat(svgElement.getAttribute('data-font-size'));
                  const textMargin = parseFloat(svgElement.getAttribute('data-text-margin'));
                  const svgMargin = parseInt(svgElement.getAttribute('data-svg-margin'));
                  if (value) {
                    JsBarcode(svgElement, value, {
                      format: "CODE128",
                      lineColor: "#000000",
                      width: barWidth,
                      height: barHeight,
                      displayValue: true,
                      text: value,
                      fontSize: fontSize,
                      textMargin: textMargin,
                      margin: svgMargin,
                      font: "Arial",
                      textAlign: "center",
                    });
                  }
                });
              } catch (e) {
                console.error("JsBarcode error in print window:", e);
              }
              setTimeout(function() {
                window.print();
                var mediaQueryList = window.matchMedia('print');
                var closingScheduled = false;
                function closePrintWindow() {
                    if (!closingScheduled && printWindow && !printWindow.closed) {
                        closingScheduled = true;
                        setTimeout(function() {
                            if (printWindow && !printWindow.closed) {
                                printWindow.close();
                            }
                        }, 200);
                    }
                }
                mediaQueryList.addListener(function(mql) {
                    if (!mql.matches) {
                        closePrintWindow();
                    }
                });
                window.onafterprint = function() {
                   closePrintWindow();
                }
                setTimeout(function() {
                    closePrintWindow();
                }, 5000);
              }, 700);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    if (isPrintModalOpen) setIsPrintModalOpen(false); // Agar modal orqali chop etilsa, yopish
  };

  const handlePrintSingleProduct = (product: Product) => {
    if (product.barcode && ((product.price_uzs && parseFloat(product.price_uzs) > 0) || (product.price_usd && parseFloat(product.price_usd) > 0))) {
      printContent([product]);
    } else {
      toast.info(`"${product.name}" mahsulotini chop etish uchun shtrix kod yoki narx yetarli emas.`);
    }
  };

  const handleTogglePrintSelection = (productId: number) => {
    setSelectedProductsToPrint(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const handleSelectAllForPrint = (selectAll: boolean) => {
    const newSelections: Record<number, boolean> = {};
    eligibleProductsForPrint.forEach(p => {
      newSelections[p.id] = selectAll;
    });
    setSelectedProductsToPrint(newSelections);
  };

  const getSelectedItemsForActualPrint = () => {
      return eligibleProductsForPrint.filter(p => selectedProductsToPrint[p.id]);
  }

  return (
    <div className="flex flex-col h-full p-4 md:p-6 space-y-5 bg-muted/20">
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Mahsulotlar</h1>
        <div className="flex gap-2 flex-wrap">
          <Button className="flex items-center gap-2 shadow-sm" onClick={() => { setAddDialogInitialView('phone'); setIsAddProductDialogOpen(true); }}>
            <Smartphone className="h-4 w-4" /> Telefon qo‘shish
          </Button>
          <Button variant="outline" className="flex items-center gap-2 shadow-sm" onClick={() => { setAddDialogInitialView('accessory'); setIsAddProductDialogOpen(true); }}>
            <Headphones className="h-4 w-4" /> Aksesuar qo‘shish
          </Button>
          <Button variant="outline" className="flex items-center gap-2 shadow-sm" onClick={() => setIsAddCategoryModalOpen(true)}>
            <FolderPlus className="h-4 w-4" /> Kategoriya qo‘shish
          </Button>
          <Button variant="outline" className="flex items-center gap-2 shadow-sm" onClick={handleOpenPrintModal} title="Shtrix kodlarni chop etish">
            <Printer className="h-4 w-4" /> Chop etish
          </Button>
        </div>
      </header>

      <Card className="flex-grow flex flex-col overflow-hidden shadow-sm border">
        <CardHeader className="border-b px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <CardTitle className="text-lg sm:text-xl">Mahsulotlar Ro‘yxati</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-0.5">
                Jami {filteredProducts.length} ta mahsulot ({products.length} tadan).
              </CardDescription>
            </div>
            <div className="relative w-full md:w-64 lg:w-72">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Qidirish yoki skanerlash..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-sm w-full" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-grow overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground">Yuklanmoqda...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-destructive">
              <p className="font-semibold">Xatolik:</p>
              <p>{error}</p>
              <Button onClick={fetchProducts} variant="outline" size="sm" className="mt-3">Qayta urinish</Button>
            </div>
          ) : filteredProducts.length > 0 ? (
            <Table className="text-xs sm:text-sm">
              <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-[200px] px-2 py-2.5 sm:px-4">Nomi</TableHead>
                  <TableHead className="hidden xl:table-cell px-2 sm:px-4">Shtrix Kod</TableHead>
                  <TableHead className="px-2 sm:px-4">Turi</TableHead>
                  <TableHead className="px-2 sm:px-4">Sotish narxi</TableHead>
                  <TableHead className="hidden md:table-cell px-2 sm:px-4">Olingan</TableHead>
                  <TableHead className="hidden lg:table-cell px-2 sm:px-4">Xotira</TableHead>
                  <TableHead className="hidden sm:table-cell px-2 sm:px-4">Rangi</TableHead>
                  <TableHead className="text-right w-[130px] px-2 py-2.5 sm:px-4">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium px-2 py-2.5 sm:px-4">{product.name || "-"}</TableCell>
                    <TableCell className="hidden xl:table-cell px-2 sm:px-4">{product.barcode || "-"}</TableCell>
                    <TableCell className="px-2 sm:px-4">{determineProductTypeForDisplay(product)}</TableCell>
                    <TableCell className="px-2 sm:px-4">
                      {product.price_uzs && parseFloat(product.price_uzs) > 0 ? formatPriceForTable(product.price_uzs, "so'm") : product.price_usd && parseFloat(product.price_usd) > 0 ? formatPriceForTable(product.price_usd, "$") : "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell px-2 sm:px-4">{formatPriceForTable(product.purchase_price_usd, "$")}</TableCell>
                    <TableCell className="hidden lg:table-cell px-2 sm:px-4">{product.storage_capacity || '-'}</TableCell>
                    <TableCell className="hidden sm:table-cell px-2 sm:px-4">{product.color || '-'}</TableCell>
                    <TableCell className="text-right px-2 py-2.5 sm:px-4">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-sky-600 hover:bg-sky-100" onClick={() => handlePrintSingleProduct(product)} title="Chop etish">
                        <Printer className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10 ml-1" onClick={() => openEditDialog(product)} title="Tahrirlash">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10 ml-1" onClick={() => openDeleteDialog(product)} title="O'chirish">
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
          // Agar AddProductDialog props orqali olishi kerak bo'lsa, quyidagilarni oching:
          // categories={categories} 
          // onCreateCategory={createCategory}
        />
      )}
      {isEditDialogOpen && selectedProductForEdit && (
        <EditProductDialog
          open={isEditDialogOpen}
          onOpenChange={(isOpen) => { setIsEditDialogOpen(isOpen); if (!isOpen) setSelectedProductForEdit(null); }}
          product={selectedProductForEdit}
          onProductSuccessfullyEdited={handleProductSuccessfullyEdited}
        />
      )}
      <ShadDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <ShadDialogContent>
          <ShadDialogHeader>
            <ShadDialogTitle className="text-lg font-semibold">O'chirishni Tasdiqlang</ShadDialogTitle>
            <ShadDialogDescription className="mt-2 text-sm">
              {productToDelete ? `"${productToDelete.name}" nomli mahsulotni arxivlaysizmi?` : "Mahsulotni arxivlash."}
            </ShadDialogDescription>
          </ShadDialogHeader>
          <ShadDialogFooter className="mt-5">
            <Button variant="outline" onClick={() => { setIsDeleteDialogOpen(false); setProductToDelete(null); }}>Bekor Qilish</Button>
            <Button variant="destructive" onClick={handleDeleteConfirmation}>Ha, Arxivlash</Button>
          </ShadDialogFooter>
        </ShadDialogContent>
      </ShadDialog>

      <ShadDialog open={isAddCategoryModalOpen} onOpenChange={(isOpen) => {
          setIsAddCategoryModalOpen(isOpen);
          if (!isOpen) {
            setNewCategoryData({ name: "", description: "", barcode_prefix: "" });
          }
      }}>
        <ShadDialogContent className="sm:max-w-md">
          <ShadDialogHeader>
            <ShadDialogTitle>Yangi Kategoriya Qo'shish</ShadDialogTitle>
            <ShadDialogDescription>
              Yangi mahsulot kategoriyasini kiriting. Majburiy maydonlar to'ldirilishi shart.
            </ShadDialogDescription>
          </ShadDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categoryName" className="text-right col-span-1">
                Nomi <span className="text-destructive">*</span>
              </Label>
              <Input
                id="categoryName"
                value={newCategoryData.name}
                onChange={(e) => setNewCategoryData({ ...newCategoryData, name: e.target.value })}
                className="col-span-3"
                placeholder="Masalan, Smartfonlar"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categoryDescription" className="text-right col-span-1">
                Tavsifi
              </Label>
              <Input
                id="categoryDescription"
                value={newCategoryData.description}
                onChange={(e) => setNewCategoryData({ ...newCategoryData, description: e.target.value })}
                className="col-span-3"
                placeholder="Qisqacha tavsif (ixtiyoriy)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categoryBarcodePrefix" className="text-right col-span-1">
                Shtrix Kod Prefiksi
              </Label>
              <Input
                id="categoryBarcodePrefix"
                value={newCategoryData.barcode_prefix}
                onChange={(e) => setNewCategoryData({ ...newCategoryData, barcode_prefix: e.target.value })}
                className="col-span-3"
                placeholder="Masalan, CAT001 (ixtiyoriy)"
              />
            </div>
          </div>
          <ShadDialogFooter>
            <Button variant="outline" onClick={() => {
                setIsAddCategoryModalOpen(false);
                setNewCategoryData({ name: "", description: "", barcode_prefix: "" });
            }}>
              Bekor Qilish
            </Button>
            <Button onClick={handleSaveNewCategory} disabled={isSubmittingCategory}>
              {isSubmittingCategory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Saqlash
            </Button>
          </ShadDialogFooter>
        </ShadDialogContent>
      </ShadDialog>

      <ShadDialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <ShadDialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
          <ShadDialogHeader>
            <ShadDialogTitle>Shtrix Kodlarni Chop Etish (50x30mm)</ShadDialogTitle>
            <ShadDialogDescription>
              Chop etish uchun mahsulotlarni tanlang. Printer sozlamalarida qog'oz o'lchami "50mm x 30mm" va "Margins: None" bo'lishi kerak.
            </ShadDialogDescription>
          </ShadDialogHeader>
          <div className="my-4 flex items-center space-x-2">
            <Checkbox
                id="selectAllPrint"
                checked={eligibleProductsForPrint.length > 0 && eligibleProductsForPrint.every(p => selectedProductsToPrint[p.id])}
                onCheckedChange={(checked) => handleSelectAllForPrint(Boolean(checked))}
            />
            <Label htmlFor="selectAllPrint" className="text-sm font-medium">
                Hammasini tanlash / Tanlovni bekor qilish ({getSelectedItemsForActualPrint().length} ta tanlangan)
            </Label>
          </div>
          <div className="flex-grow overflow-auto p-1 bg-muted/30 rounded-md border">
            {eligibleProductsForPrint.length > 0 ? (
              <div className="space-y-2 p-2">
                {eligibleProductsForPrint.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-2.5 border rounded-md bg-background hover:bg-muted/50 shadow-sm">
                    <Checkbox
                      id={`print-check-${p.id}`}
                      checked={!!selectedProductsToPrint[p.id]}
                      onCheckedChange={() => handleTogglePrintSelection(p.id)}
                      className="h-5 w-5"
                    />
                    <Label htmlFor={`print-check-${p.id}`} className="flex-grow cursor-pointer flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-sm">{p.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {getPriceForPrint(p)}
                          {p.storage_capacity && ` | ${p.storage_capacity}`}
                          {determineProductTypeForDisplay(p) === "iPhone" && p.battery_health && ` | Bat: ${p.battery_health}%`}
                          {p.barcode && ` | ${p.barcode}`}
                        </div>
                      </div>
                      <div className="w-32 h-12 flex items-center justify-center border rounded-sm bg-white p-0.5 ml-2 shrink-0">
                        {p.barcode && <BarcodeDisplay value={p.barcode} barWidth={0.6} barHeight={18} fontSize={6} textMargin={0} />}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6">Chop etish uchun mos mahsulotlar yo'q.</p>
            )}
          </div>
          <ShadDialogFooter className="mt-5 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsPrintModalOpen(false)}>Yopish</Button>
            <Button onClick={() => printContent(getSelectedItemsForActualPrint())} disabled={getSelectedItemsForActualPrint().length === 0}>
                <Printer className="mr-2 h-4 w-4" /> Tanlanganlarni Chop etish ({getSelectedItemsForActualPrint().length})
            </Button>
          </ShadDialogFooter>
        </ShadDialogContent>
      </ShadDialog>

      <style jsx global>{`
        /* Preview stillari o'zgarishsiz qoldi, chop etish oynasi uchun alohida stillar qo'llanildi */
        .print-preview-grid-modal { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; padding: 10px; }
        .print-preview-label-modal { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: center; background-color: #fff; border-radius: 4px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); display: flex; flex-direction: column; justify-content: flex-start; align-items: center; min-height: 130px; font-family: 'Arial', sans-serif; }
        .dark .print-preview-label-modal { background-color: #1e293b; border-color: #334155; }
        .preview-label-name-modal { font-weight: 600; font-size: 0.8rem; margin-bottom: 3px; line-height: 1.2; width:100%; color: #1f2937; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dark .preview-label-name-modal { color: #e2e8f0; }
        .preview-label-price-modal { font-weight: 700; font-size: 0.85rem; margin-bottom: 4px; color: #1f2937;  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}
        .dark .preview-label-price-modal { color: #e2e8f0; }
        .preview-label-details-container-modal { width: 100%; text-align: center; margin-bottom: 4px; }
        .preview-label-details-item-modal { font-size: 0.7rem; font-weight: 500; line-height: 1.2; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; }
        .dark .preview-label-details-item-modal { color: #94a3b8; }
        .preview-label-barcode-modal { width: 100%; margin-top: auto; padding-bottom: 2px; }
        .preview-label-barcode-modal svg { display: block; margin: 0 auto; max-width: 96%; height: auto; }
      `}</style>
    </div>
  );
}