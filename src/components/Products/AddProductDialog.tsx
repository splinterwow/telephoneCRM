// import React, { useState, useEffect, useCallback } from "react";
// import {
//   Dialog, // Shadcn Dialog
//   DialogContent,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
// } from "@/components/ui/dialog"; // Shadcn Dialog importlari
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { toast } from "sonner";
// import axios from "axios";
// import { Loader2, ScanBarcode, Fingerprint } from "lucide-react";
// import { cn } from "@/lib/utils"; // Shadcn utils

// // Tiplar (global types faylida bo'lishi mumkin)
// interface ApiCategory {
//   id: number;
//   name: string;
//   description?: string;
// }

// interface Kassa { // Kassa uchun yangi interfeys
//     id: number;
//     name: string;
//     is_active?: boolean; // Backenddan keladigan maydon
// }

// export type DialogView = "phone" | "accessory";
// type PhoneSubType = "android" | "iphone";
// type IdentifierModeApi = "auto_barcode" | "manual_barcode_unique" | "manual_imei"; // Yangilangan

// interface Product {
//   id: number;
//   name: string;
//   category: number | null;
//   category_name?: string;
//   barcode?: string | null;
//   price_uzs?: string | null;
//   price_usd?: string | null;
//   purchase_price_uzs?: string | null;
//   purchase_price_usd?: string | null;
//   storage_capacity?: string | null;
//   color?: string | null;
//   series_region?: string | null;
//   battery_health?: string | null;
//   purchase_date?: string | null;
//   is_active: boolean;
//   description?: string | null;
// }

// interface FormData {
//   name: string;
//   purchaseDate: string;
//   categoryId: string; // Bu avtomatik aniqlanadi, lekin state'da qoladi
//   identifierType: IdentifierModeApi; // Yangi
//   defaultKassaId: string; // Yangi
//   initialStockQuantity: string; // Yangi
//   phonePurchasePriceUzs: string;
//   phoneSellingPriceUzs: string;
//   phonePurchasePriceUsd: string;
//   phoneSellingPriceUsd: string;
//   androidCapacityRamStorage: string;
//   iphoneColor: string;
//   iphoneCapacityStorage: string;
//   iphoneBatteryHealth: string;
//   iphoneSeriesRegion: string;
//   accessoryColor: string;
//   accessoryPriceUzs: string;
//   accessoryPriceUsd: string;
//   accessoryDescription: string;
// }

// const initialFormData: FormData = {
//   name: "",
//   purchaseDate: new Date().toISOString().split("T")[0],
//   categoryId: "",
//   identifierType: "auto_barcode", // Default qiymat
//   defaultKassaId: "", // Default bo'sh
//   initialStockQuantity: "0", // Default 0
//   phonePurchasePriceUzs: "",
//   phoneSellingPriceUzs: "",
//   phonePurchasePriceUsd: "",
//   phoneSellingPriceUsd: "",
//   androidCapacityRamStorage: "",
//   iphoneColor: "",
//   iphoneCapacityStorage: "",
//   iphoneBatteryHealth: "",
//   iphoneSeriesRegion: "",
//   accessoryColor: "",
//   accessoryPriceUzs: "",
//   accessoryPriceUsd: "",
//   accessoryDescription: "",
// };

// interface AddProductDialogProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   onAddProduct: (newProduct: Product) => void;
//   initialView: DialogView;
// }

// // API URL manzillari
// const API_URL_CATEGORIES =
//   "https://smartphone777.pythonanywhere.com/api/categories/";
// const API_URL_PRODUCTS =
//   "https://smartphone777.pythonanywhere.com/api/products/";
// const API_URL_GENERATE_BARCODE =
//   "https://smartphone777.pythonanywhere.com/api/products/generate-barcode/";
// const API_URL_KASSA =
//   "https://smartphone777.pythonanywhere.com/api/kassa/"; // Kassa uchun API

// export function AddProductDialog({
//   open,
//   onOpenChange,
//   onAddProduct,
//   initialView,
// }: AddProductDialogProps) {
//   const [formData, setFormData] = useState<FormData>(initialFormData);
//   const [selectedPhoneSubType, setSelectedPhoneSubType] =
//     useState<PhoneSubType>(initialView === "phone" ? "android" : "android"); // Boshlang'ich phone sub type
//   const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);
//   const [isLoadingCategories, setIsLoadingCategories] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isGeneratingBarcode, setIsGeneratingBarcode] = useState(false);

//   const [manualImei, setManualImei] = useState<string>(""); // manual_barcode_unique uchun ham ishlatiladi
//   const [generatedBarcodeForDisplay, setGeneratedBarcodeForDisplay] =
//     useState<string>("");

//   const [kassaList, setKassaList] = useState<Kassa[]>([]);
//   const [isLoadingKassa, setIsLoadingKassa] = useState(false);

//   const findCategoryIdFromApi = useCallback(
//     (targetCategoryName: string, categories: ApiCategory[]): string => {
//       if (categories.length === 0 || !targetCategoryName) return "";
//       const targetLower = targetCategoryName.toLowerCase().trim();
//       const category = categories.find((cat) => {
//         const catNameLower = cat.name.toLowerCase().trim();
//         if (targetLower.includes("iphone") && catNameLower.includes("iphone")) return true;
//         if (targetLower.includes("android") && catNameLower.includes("android") && !catNameLower.includes("iphone")) return true;
//         if ((targetLower.includes("accessory") || targetLower.includes("aksesuar")) && (catNameLower.includes("accessory") || catNameLower.includes("aksesuar"))) return true;
//         return catNameLower === targetLower;
//       });
//       return category ? category.id.toString() : "";
//     },
//     []
//   );

//   useEffect(() => {
//     if (open) {
//       // Reset form data
//       setFormData({
//         ...initialFormData,
//         purchaseDate: new Date().toISOString().split("T")[0],
//         identifierType: initialView === "accessory" ? "auto_barcode" : "auto_barcode",
//         // initialStockQuantity keyingi useEffect da o'rnatiladi
//       });
//       setManualImei("");
//       setGeneratedBarcodeForDisplay("");
//       setSelectedPhoneSubType(initialView === "phone" ? "android" : "android");
//     }
//   }, [open, initialView]);


//   // identifierType yoki initialView o'zgarganda initialStockQuantity ni o'rnatish
//   useEffect(() => {
//     if (!open) return; // Faqat modal ochiq bo'lganda

//     if (initialView === "phone") {
//         if (formData.identifierType === "manual_barcode_unique" || formData.identifierType === "manual_imei") {
//             setFormData(prev => ({ ...prev, initialStockQuantity: "1" }));
//         } else if (formData.identifierType === "auto_barcode") {
//              setFormData(prev => ({ ...prev, initialStockQuantity: "0" }));
//         }
//     } else if (initialView === "accessory") { // Aksessuarlar har doim auto_barcode
//         setFormData(prev => ({ ...prev, initialStockQuantity: "0" }));
//     }
//   }, [open, formData.identifierType, initialView]);


//   useEffect(() => {
//     if (!open) return;
//     const fetchData = async () => {
//       setIsLoadingCategories(true);
//       setIsLoadingKassa(true);
//       const token = localStorage.getItem("accessToken");
//       if (!token) {
//         toast.error("Avtorizatsiya tokeni topilmadi.");
//         setIsLoadingCategories(false);
//         setIsLoadingKassa(false);
//         return;
//       }
//       try {
//         const [categoriesResponse, kassaResponse] = await Promise.all([
//           axios.get(API_URL_CATEGORIES, { headers: { Authorization: `Bearer ${token}` } }),
//           axios.get(API_URL_KASSA, { headers: { Authorization: `Bearer ${token}` } })
//         ]);

//         const categoriesData = Array.isArray(categoriesResponse.data)
//           ? categoriesResponse.data
//           : (categoriesResponse.data as any).results || [];
//         setApiCategories(
//           categoriesData.filter((cat: any) => cat.name && cat.id) as ApiCategory[]
//         );

//         const kassaData = Array.isArray(kassaResponse.data)
//           ? kassaResponse.data
//           : (kassaResponse.data as any).results || [];
//         setKassaList(kassaData.filter((k: Kassa) => k.is_active !== false));

//       } catch (error: any) {
//         toast.error(
//           "Kategoriya yoki kassalarni olishda xatolik: " +
//             (error.response?.data?.detail || error.message)
//         );
//       } finally {
//         setIsLoadingCategories(false);
//         setIsLoadingKassa(false);
//       }
//     };
//     fetchData();
//   }, [open]);

//   const handleDialogClose = () => {
//     if (isSubmitting || isGeneratingBarcode) return;
//     onOpenChange(false);
//   };

//   const handleGenerateBarcode = async () => {
//     setIsGeneratingBarcode(true);
//     let categoryIdForBarcode = "";
//     const nameLower = formData.name.toLowerCase().trim();
//     const targetCatName = initialView === 'phone'
//         ? (selectedPhoneSubType === 'iphone' || nameLower.includes("iphone") ? "iPhone" : "Android")
//         : "accessory";
//     categoryIdForBarcode = findCategoryIdFromApi(targetCatName, apiCategories);

//     try {
//       const token = localStorage.getItem("accessToken");
//       if (!token) {
//         toast.error("Avtorizatsiya tokeni yo'q.");
//         setIsGeneratingBarcode(false);
//         return;
//       }
//       const params: any = {};
//       if (categoryIdForBarcode) params.category_id = categoryIdForBarcode;

//       const response = await axios.get<{ barcode: string }>(
//         API_URL_GENERATE_BARCODE,
//         { headers: { Authorization: `Bearer ${token}` }, params }
//       );
//       setGeneratedBarcodeForDisplay(response.data.barcode);
//       toast.success("Yangi shtrix-kod generatsiya qilindi!");
//     } catch (error: any) {
//       toast.error(
//         "Shtrix-kod generatsiya qilishda xatolik: " +
//           (error.response?.data?.detail || error.message)
//       );
//       setGeneratedBarcodeForDisplay("");
//     } finally {
//       setIsGeneratingBarcode(false);
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (!formData.name.trim()) {
//       toast.error("Mahsulot nomi kiritilishi shart.");
//       return;
//     }
//     if (
//       initialView === "phone" &&
//       (formData.identifierType === "manual_imei" || formData.identifierType === "manual_barcode_unique") &&
//       !manualImei.trim()
//     ) {
//       toast.error(
//         `${formData.identifierType === "manual_imei" ? "IMEI" : "Shtrix Kod (Unikal)"} kiritilishi shart.`
//       );
//       return;
//     }

//     const nameLower = formData.name.toLowerCase().trim();
//     let targetCatNameSubmit = initialView === "phone"
//         ? (selectedPhoneSubType === 'iphone' || nameLower.includes("iphone") ? "iPhone" : "Android")
//         : "accessory";
//     let finalCategoryId = findCategoryIdFromApi(targetCatNameSubmit, apiCategories);

//     if (!finalCategoryId) {
//         toast.warn(`"${targetCatNameSubmit}" uchun mos kategoriya topilmadi. Kategoriya qo'shishingiz yoki mahsulot nomini to'g'rilashingiz kerak bo'lishi mumkin.`);
//         // Agar kategoriya umuman topilmasa, backend xato qaytarishi mumkin
//     }

//     setIsSubmitting(true);
//     let productPayload: any = {
//       name: formData.name.trim(),
//       category: finalCategoryId ? Number(finalCategoryId) : null,
//       identifier_type: formData.identifierType,
//       barcode: null,
//       purchase_date: formData.purchaseDate || null,
//       is_active: true,
//       add_to_stock_quantity: parseInt(formData.initialStockQuantity) >= 0 ? parseInt(formData.initialStockQuantity) : 0,
//     };

//     if (formData.defaultKassaId) {
//       productPayload.default_kassa_id_for_new_stock = Number(formData.defaultKassaId);
//     }

//     if ((formData.identifierType === "manual_imei" || formData.identifierType === "manual_barcode_unique") && initialView === "phone") {
//       productPayload.barcode = manualImei.trim().toUpperCase();
//     } else if (formData.identifierType === "auto_barcode" && generatedBarcodeForDisplay) {
//       productPayload.barcode = generatedBarcodeForDisplay;
//     }
//     // Agar auto_barcode va generatedBarcodeForDisplay bo'sh bo'lsa, backend o'zi yaratadi (barcode: null)

//     let hasSellingPrice = false;
//     const p_uzs_str = formData.phoneSellingPriceUzs || formData.accessoryPriceUzs;
//     const p_usd_str = formData.phoneSellingPriceUsd || formData.accessoryPriceUsd;
//     const p_uzs = parseFloat(p_uzs_str);
//     const p_usd = parseFloat(p_usd_str);

//     if (p_uzs_str && !isNaN(p_uzs) && p_uzs > 0) {
//         productPayload.price_uzs = p_uzs_str;
//         hasSellingPrice = true;
//     }
//     if (p_usd_str && !isNaN(p_usd) && p_usd > 0) {
//         productPayload.price_usd = p_usd_str;
//         hasSellingPrice = true;
//     }

//     const purch_uzs_str = formData.phonePurchasePriceUzs;
//     const purch_usd_str = formData.phonePurchasePriceUsd;
//     const purch_uzs = parseFloat(purch_uzs_str);
//     const purch_usd = parseFloat(purch_usd_str);

//     if (purch_uzs_str && !isNaN(purch_uzs) && purch_uzs > 0)
//       productPayload.purchase_price_uzs = purch_uzs_str;
//     if (purch_usd_str && !isNaN(purch_usd) && purch_usd > 0)
//       productPayload.purchase_price_usd = purch_usd_str;

//     if (!hasSellingPrice) {
//       toast.error(
//         "Kamida bitta sotish narxi (UZS yoki USD) 0 dan katta bo'lishi shart."
//       );
//       setIsSubmitting(false);
//       return;
//     }

//     if (initialView === "phone") {
//       // Telefon turi (iPhone/Android) `selectedPhoneSubType` va mahsulot nomidan aniqlanadi
//       const isIphone = selectedPhoneSubType === "iphone" || nameLower.includes("iphone");
//       if (!isIphone) { // Android uchun
//         if (formData.androidCapacityRamStorage.trim())
//           productPayload.storage_capacity = formData.androidCapacityRamStorage.trim();
//       } else { // iPhone uchun
//         if (!formData.iphoneColor.trim()) {
//           toast.error("iPhone uchun rang kiritilishi shart.");
//           setIsSubmitting(false);
//           return;
//         }
//         if (!formData.iphoneCapacityStorage.trim()) {
//           toast.error("iPhone uchun sig‘im kiritilishi shart.");
//           setIsSubmitting(false);
//           return;
//         }
//         productPayload.color = formData.iphoneColor.trim();
//         productPayload.storage_capacity = `${formData.iphoneCapacityStorage.trim()}GB`;
//         if (formData.iphoneBatteryHealth && !isNaN(parseFloat(formData.iphoneBatteryHealth)))
//           productPayload.battery_health = Number(formData.iphoneBatteryHealth);
//         if (formData.iphoneSeriesRegion.trim())
//           productPayload.series_region = formData.iphoneSeriesRegion.trim();
//       }
//     } else { // Aksessuar uchun
//       if (formData.accessoryColor.trim())
//         productPayload.color = formData.accessoryColor.trim();
//       if (formData.accessoryDescription.trim())
//         productPayload.description = formData.accessoryDescription.trim();
//     }

//     try {
//       const token = localStorage.getItem("accessToken");
//       if (!token) {
//         toast.error("Avtorizatsiya tokeni topilmadi.");
//         setIsSubmitting(false);
//         return;
//       }
//       const response = await axios.post(API_URL_PRODUCTS, productPayload, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       toast.success(`Mahsulot "${response.data.name}" muvaffaqiyatli qo‘shildi!`);
//       onAddProduct(response.data as Product);
//       handleDialogClose();
//     } catch (error: any) {
//       let errMsg = `Mahsulot qo‘shishda xatolik: `;
//       if (error.response?.data && typeof error.response.data === "object") {
//         const data = error.response.data;
//         Object.keys(data).forEach(key => {
//             if (Array.isArray(data[key])) {
//                 errMsg += `${key}: ${data[key].join(', ')}. `;
//             } else if (typeof data[key] === 'string') {
//                  errMsg += `${key}: ${data[key]}. `;
//             } else if (typeof data[key] === 'object' && data[key] !== null) {
//                 // Ichki obyektlar uchun (agar kerak bo'lsa)
//                  errMsg += `${key}: ${JSON.stringify(data[key])}. `;
//             }
//         });
//         if (data.detail && !Object.keys(data).filter(k=>k!=='detail').length) { // Agar faqat detail bo'lsa
//              errMsg = `Xatolik: ${data.detail}`;
//         } else if (errMsg === `Mahsulot qo‘shishda xatolik: ` && data.detail) {
//              errMsg += data.detail;
//         } else if (errMsg === `Mahsulot qo‘shishda xatolik: `) {
//             errMsg += "Noma'lum server xatosi.";
//         }

//       } else {
//         errMsg += error.message || "Noma'lum xatolik.";
//       }
//       toast.error(errMsg.trim(), { duration: 8000 });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
//   ) => {
//     const { name, value } = e.target;
//     setFormData((prev) => {
//         const newState = { ...prev, [name]: value };
//         // Agar mahsulot nomi o'zgartirilsa va "phone" view bo'lsa, subType'ni avtomatik o'zgartirish
//         if (name === "name" && initialView === "phone") {
//             const nameLower = value.toLowerCase().trim();
//             if (nameLower.includes("iphone")) {
//                 setSelectedPhoneSubType("iphone");
//             } else if (selectedPhoneSubType === "iphone" && !nameLower.includes("iphone")) {
//                  // Agar oldin iPhone bo'lib, endi nomidan "iphone" olib tashlansa, Androidga o'tkazilishi mumkin
//                  // Yoki foydalanuvchi o'zi tab orqali tanlagani ma'qulroq
//             }
//         }
//         return newState;
//     });
//   };

//   const handlePhoneSubTypeChange = (subType: PhoneSubType) => {
//     setSelectedPhoneSubType(subType);
//   };

//   const handleIdentifierModeChange = (mode: IdentifierModeApi) => {
//     setFormData(prev => ({...prev, identifierType: mode}));
//     setGeneratedBarcodeForDisplay("");
//     if (mode === "manual_imei" || mode === "manual_barcode_unique") {
//         setManualImei("");
//     }
//   };

//   const renderPhoneSubTypeSelector = () => (
//     <div className="flex border-b mb-4">
//       <Button
//         variant="ghost"
//         type="button"
//         className={cn(
//           "flex-1 justify-center rounded-none border-b-2 py-3 text-sm font-medium",
//           selectedPhoneSubType === "android"
//             ? "border-primary text-primary bg-primary/10"
//             : "border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
//         )}
//         onClick={() => handlePhoneSubTypeChange("android")}
//       >
//         Android
//       </Button>
//       <Button
//         variant="ghost"
//         type="button"
//         className={cn(
//           "flex-1 justify-center rounded-none border-b-2 py-3 text-sm font-medium",
//           selectedPhoneSubType === "iphone"
//             ? "border-primary text-primary bg-primary/10"
//             : "border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
//         )}
//         onClick={() => handlePhoneSubTypeChange("iphone")}
//       >
//         iPhone
//       </Button>
//     </div>
//   );

//   const renderIdentifierSelector = () =>
//     initialView !== "phone" ? null : (
//       <div className="mb-3">
//         <Label className="text-xs font-medium mb-1 block">Identifikator Turi</Label>
//         <div className="flex rounded-md border bg-muted p-0.5">
//           <Button
//             type="button"
//             variant={formData.identifierType === "auto_barcode" ? "default" : "ghost"}
//             onClick={() => handleIdentifierModeChange("auto_barcode")}
//             className={cn("flex-1 h-8 text-xs", formData.identifierType === "auto_barcode" ? "shadow-sm" : "")}
//             disabled={isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
//           >
//             <ScanBarcode className="mr-2 h-4 w-4" />
//             Shtrix (Avto)
//           </Button>
//           <Button // Yangi "Shtrix Kod (Unikal, Qo'lda)"
//             type="button"
//             variant={formData.identifierType === "manual_barcode_unique" ? "default" : "ghost"}
//             onClick={() => handleIdentifierModeChange("manual_barcode_unique")}
//             className={cn("flex-1 h-8 text-xs", formData.identifierType === "manual_barcode_unique" ? "shadow-sm" : "")}
//             disabled={isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
//           >
//             <ScanBarcode className="mr-2 h-4 w-4" /> {/* Ikonkani moslashtiring */}
//             Shtrix (Unikal)
//           </Button>
//           <Button
//             type="button"
//             variant={formData.identifierType === "manual_imei" ? "default" : "ghost"}
//             onClick={() => handleIdentifierModeChange("manual_imei")}
//             className={cn("flex-1 h-8 text-xs", formData.identifierType === "manual_imei" ? "shadow-sm" : "")}
//             disabled={isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
//           >
//             <Fingerprint className="mr-2 h-4 w-4" />
//             IMEI (Qo'lda)
//           </Button>
//         </div>
//       </div>
//     );

//   const renderCommonFields = () => (
//     <>
//       <div className="space-y-1">
//         <Label htmlFor="name" className="text-xs font-medium">
//           Nomi <span className="text-destructive">*</span>
//         </Label>
//         <Input
//           id="name"
//           name="name"
//           value={formData.name}
//           onChange={handleChange}
//           placeholder={
//             initialView === "phone"
//               ? selectedPhoneSubType === "android"
//                 ? "Samsung A51"
//                 : "iPhone 14 Pro"
//               : "Chexol"
//           }
//         />
//       </div>

//       {initialView === "phone" && (formData.identifierType === "manual_imei" || formData.identifierType === "manual_barcode_unique") && (
//         <div className="space-y-1">
//           <Label htmlFor="manualImei" className="text-xs font-medium">
//             {formData.identifierType === "manual_imei" ? "IMEI" : "Shtrix Kod (Unikal)"} <span className="text-destructive">*</span>
//           </Label>
//           <Input
//             id="manualImei"
//             name="manualImei" // Bu state nomi, o'zgartirilmaydi
//             value={manualImei}
//             onChange={(e) => setManualImei(e.target.value.toUpperCase())}
//             placeholder={`${formData.identifierType === "manual_imei" ? "IMEI" : "Unikal shtrix kod"}ni kiriting...`}
//             className="text-base font-mono h-11 px-3"
//             maxLength={150} // Bir nechta kod uchun
//             disabled={isLoadingCategories || isLoadingKassa}
//           />
//           <p className="text-xs text-muted-foreground">
//             Bir nechta {formData.identifierType === "manual_imei" ? "IMEI" : "Shtrix Kod"}ni vergul (,) bilan ajratib kiriting.
//           </p>
//         </div>
//       )}

//       {( (initialView === "phone" && formData.identifierType === "auto_barcode") || initialView === "accessory" ) && (
//         <div className="space-y-1">
//           <Label className="text-xs font-medium">Shtrix Kod</Label>
//           <div className="flex items-center gap-2">
//             <Input
//               id="generatedBarcodeDisplay"
//               value={generatedBarcodeForDisplay || (formData.identifierType === "auto_barcode" ? "Avtomatik (saqlashda)" : "Shtrix-kod kiritilmagan")}
//               readOnly
//               className={cn(
//                 "bg-muted/50 cursor-default h-11 px-3 flex-grow",
//                 !generatedBarcodeForDisplay && formData.identifierType === "auto_barcode" && "italic text-muted-foreground"
//               )}
//             />
//             {initialView === "phone" && formData.identifierType === "auto_barcode" && (
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={handleGenerateBarcode}
//                 disabled={isGeneratingBarcode || isLoadingCategories || isLoadingKassa}
//                 className="h-11 shrink-0"
//                 title="Yangi shtrix-kod generatsiya qilish"
//               >
//                 {isGeneratingBarcode ? (
//                   <Loader2 className="h-4 w-4 animate-spin" />
//                 ) : (
//                   "Generatsiya"
//                 )}
//               </Button>
//             )}
//           </div>
//            <p className="text-xs text-muted-foreground">
//                 {initialView === "phone" && formData.identifierType === "auto_barcode"
//                   ? "Server o'zi unikal shtrix-kod generatsiya qiladi yoki yuqorida generatsiya qilinganini ishlatadi."
//                   : initialView === "accessory"
//                   ? "Aksessuarlar uchun shtrix-kod serverda avtomatik generatsiya qilinadi."
//                   : ""}
//             </p>
//         </div>
//       )}

//       <div className="space-y-1">
//         <Label htmlFor="purchaseDate" className="text-xs font-medium">
//           Olingan sana
//         </Label>
//         <Input
//           id="purchaseDate"
//           name="purchaseDate"
//           type="date"
//           value={formData.purchaseDate}
//           onChange={handleChange}
//           disabled={isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
//         />
//       </div>

//       {/* Yangi maydonlar */}
//       <div className="space-y-1">
//         <Label htmlFor="defaultKassaId" className="text-xs font-medium">
//           Standart kassa (Ombor uchun)
//         </Label>
//         <select
//           id="defaultKassaId"
//           name="defaultKassaId"
//           value={formData.defaultKassaId}
//           onChange={handleChange}
//           className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
//           disabled={isLoadingKassa || isSubmitting}
//         >
//           <option value="">Kassa tanlanmagan (avtomatik)</option>
//           {kassaList.map((kassa) => (
//             <option key={kassa.id} value={kassa.id.toString()}>
//               {kassa.name}
//             </option>
//           ))}
//         </select>
//         {isLoadingKassa && <p className="text-xs text-muted-foreground">Kassalar yuklanmoqda...</p>}
//       </div>

//       <div className="space-y-1">
//         <Label htmlFor="initialStockQuantity" className="text-xs font-medium">
//           Boshlang'ich miqdor (omborga)
//         </Label>
//         <Input
//           id="initialStockQuantity"
//           name="initialStockQuantity"
//           type="number"
//           min="0"
//           value={formData.initialStockQuantity}
//           onChange={handleChange}
//           placeholder="0"
//           disabled={isSubmitting}
//         />
//         <p className="text-xs text-muted-foreground">
//           {formData.identifierType === "manual_imei" || formData.identifierType === "manual_barcode_unique"
//             ? "Standart: 1. Agar bir xil unikal kod bilan bir nechta bo'lsa, o'zgartiring."
//             : "Standart: 0. Agar darhol kirim qilmoqchi bo'lsangiz, kiriting."}
//         </p>
//       </div>
//     </>
//   );

//   // JSX (Qolgan qismi avvalgidek)
//   return (
//     <Dialog open={open} onOpenChange={handleDialogClose}>
//       <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto p-0">
//         <div className="p-6 pt-5 sticky top-0 bg-background z-10">
//           <DialogHeader className="mb-2">
//             <DialogTitle className="text-xl font-semibold">
//               {initialView === "phone"
//                 ? "Telefon Qo'shish"
//                 : "Aksesuar Qo'shish"}
//             </DialogTitle>
//             <DialogDescription className="text-sm">
//               Yangi {initialView === "phone" ? "telefon" : "aksesuar"}{" "}
//               ma'lumotlarini kiriting.{" "}
//               <span className="text-destructive">*</span> majburiy.
//             </DialogDescription>
//           </DialogHeader>
//         </div>
//         {initialView === "phone" && renderPhoneSubTypeSelector()}
//         <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3">
//           {initialView === "phone" && renderIdentifierSelector()}
//           {renderCommonFields()}
//           {initialView === "phone" && (
//             <>
//               <div className="pt-2 mt-2 border-t">
//                 <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
//                   Narxlar (Telefon)
//                 </h3>
//                 <div className="grid grid-cols-2 gap-x-4 gap-y-3">
//                   <div className="space-y-1">
//                     <Label htmlFor="phonePurchasePriceUzs" className="text-xs">
//                       Olingan (so'm)
//                     </Label>
//                     <Input
//                       id="phonePurchasePriceUzs"
//                       name="phonePurchasePriceUzs"
//                       type="text"
//                       inputMode="decimal"
//                       value={formData.phonePurchasePriceUzs}
//                       onChange={handleChange}
//                       placeholder="0"
//                       disabled={isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
//                     />
//                   </div>
//                   <div className="space-y-1">
//                     <Label htmlFor="phoneSellingPriceUzs" className="text-xs">
//                       Sotiladigan (so'm) <span className="text-destructive">*</span>
//                     </Label>
//                     <Input
//                       id="phoneSellingPriceUzs"
//                       name="phoneSellingPriceUzs"
//                       type="text"
//                       inputMode="decimal"
//                       value={formData.phoneSellingPriceUzs}
//                       onChange={handleChange}
//                       placeholder="0"
//                       disabled={isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
//                     />
//                   </div>
//                   <div className="space-y-1">
//                     <Label htmlFor="phonePurchasePriceUsd" className="text-xs">
//                       Olingan (USD)
//                     </Label>
//                     <Input
//                       id="phonePurchasePriceUsd"
//                       name="phonePurchasePriceUsd"
//                       type="text"
//                       inputMode="decimal"
//                       value={formData.phonePurchasePriceUsd}
//                       onChange={handleChange}
//                       placeholder="0.00"
//                       disabled={isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
//                     />
//                   </div>
//                   <div className="space-y-1">
//                     <Label htmlFor="phoneSellingPriceUsd" className="text-xs">
//                       Sotiladigan (USD) <span className="text-destructive">*</span>
//                     </Label>
//                     <Input
//                       id="phoneSellingPriceUsd"
//                       name="phoneSellingPriceUsd"
//                       type="text"
//                       inputMode="decimal"
//                       value={formData.phoneSellingPriceUsd}
//                       onChange={handleChange}
//                       placeholder="0.00"
//                       disabled={isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
//                     />
//                   </div>
//                 </div>
//                 <p className="text-xs text-muted-foreground mt-1">
//                   Sotiladigan narxdan kamida bittasi 0 dan katta bo'lishi shart.
//                 </p>
//               </div>
//               {selectedPhoneSubType === "android" && (
//                 <div className="pt-2 mt-2 border-t">
//                   <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
//                     Qo'shimcha (Android)
//                   </h3>
//                   <div className="space-y-1">
//                     <Label
//                       htmlFor="androidCapacityRamStorage"
//                       className="text-xs"
//                     >
//                       Sig'imi (RAM/Xotira)
//                     </Label>
//                     <Input
//                       id="androidCapacityRamStorage"
//                       name="androidCapacityRamStorage"
//                       value={formData.androidCapacityRamStorage}
//                       onChange={handleChange}
//                       placeholder="8/256GB"
//                       disabled={isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
//                     />
//                   </div>
//                 </div>
//               )}
//               {selectedPhoneSubType === "iphone" && (
//                 <div className="pt-2 mt-2 border-t space-y-3">
//                   <h3 className="text-sm font-semibold mb-1 text-muted-foreground">
//                     Qo'shimcha (iPhone)
//                   </h3>
//                   <div className="space-y-1">
//                     <Label htmlFor="iphoneColor" className="text-xs">
//                       Rangi <span className="text-destructive">*</span>
//                     </Label>
//                     <Input
//                       id="iphoneColor"
//                       name="iphoneColor"
//                       value={formData.iphoneColor}
//                       onChange={handleChange}
//                       placeholder="Natural Titanium"
//                       required={selectedPhoneSubType === "iphone"}
//                       disabled={isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
//                     />
//                   </div>
//                   <div className="grid grid-cols-2 gap-x-4 gap-y-3">
//                     <div className="space-y-1">
//                       <Label
//                         htmlFor="iphoneCapacityStorage"
//                         className="text-xs"
//                       >
//                         Sig'imi (GB) <span className="text-destructive">*</span>
//                       </Label>
//                       <Input
//                         id="iphoneCapacityStorage"
//                         name="iphoneCapacityStorage"
//                         type="text"
//                         inputMode="numeric"
//                         value={formData.iphoneCapacityStorage}
//                         onChange={handleChange}
//                         placeholder="256"
//                         required={selectedPhoneSubType === "iphone"}
//                         disabled={isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
//                       />
//                     </div>
//                     <div className="space-y-1">
//                       <Label htmlFor="iphoneBatteryHealth" className="text-xs">
//                         Batareya (%)
//                       </Label>
//                       <Input
//                         id="iphoneBatteryHealth"
//                         name="iphoneBatteryHealth"
//                         type="text"
//                         inputMode="numeric"
//                         value={formData.iphoneBatteryHealth}
//                         onChange={handleChange}
//                         placeholder="85"
//                         disabled={isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
//                       />
//                     </div>
//                   </div>
//                   <div className="space-y-1">
//                     <Label htmlFor="iphoneSeriesRegion" className="text-xs">
//                       Seriyasi (Region)
//                     </Label>
//                     <Input
//                       id="iphoneSeriesRegion"
//                       name="iphoneSeriesRegion"
//                       value={formData.iphoneSeriesRegion}
//                       onChange={handleChange}
//                       placeholder="LL/A (USA)"
//                       disabled={isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
//                     />
//                   </div>
//                 </div>
//               )}
//             </>
//           )}
//           {initialView === "accessory" && (
//             <div className="pt-2 mt-2 border-t space-y-3">
//               <h3 className="text-sm font-semibold mb-1 text-muted-foreground">
//                 Qo'shimcha (Aksesuar)
//               </h3>
//               <div className="space-y-1">
//                 <Label htmlFor="accessoryPriceUzs" className="text-xs">
//                   Narxi (so'm) <span className="text-destructive">*</span>
//                 </Label>
//                 <Input
//                   id="accessoryPriceUzs"
//                   name="accessoryPriceUzs"
//                   type="text"
//                   inputMode="decimal"
//                   value={formData.accessoryPriceUzs}
//                   onChange={handleChange}
//                   placeholder="0"
//                   disabled={isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
//                 />
//               </div>
//               <div className="space-y-1">
//                 <Label htmlFor="accessoryPriceUsd" className="text-xs">
//                   Narxi (USD) <span className="text-destructive">*</span>
//                 </Label>
//                 <Input
//                   id="accessoryPriceUsd"
//                   name="accessoryPriceUsd"
//                   type="text"
//                   inputMode="decimal"
//                   value={formData.accessoryPriceUsd}
//                   onChange={handleChange}
//                   placeholder="0.00"
//                   disabled={isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
//                 />
//               </div>
//               <p className="text-xs text-muted-foreground mt-1">
//                 Narxdan kamida bittasi 0 dan katta bo'lishi shart.
//               </p>
//               <div className="space-y-1">
//                 <Label htmlFor="accessoryColor" className="text-xs">
//                   Rangi
//                 </Label>
//                 <Input
//                   id="accessoryColor"
//                   name="accessoryColor"
//                   value={formData.accessoryColor}
//                   onChange={handleChange}
//                   placeholder="Qora"
//                   disabled={isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
//                 />
//               </div>
//               <div className="space-y-1">
//                 <Label htmlFor="accessoryDescription" className="text-xs">
//                   Izoh
//                 </Label>
//                 <Textarea
//                   id="accessoryDescription"
//                   name="accessoryDescription"
//                   value={formData.accessoryDescription}
//                   onChange={handleChange}
//                   rows={2}
//                   placeholder="Qo'shimcha ma'lumot"
//                   disabled={isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
//                 />
//               </div>
//             </div>
//           )}
//           <DialogFooter className="pt-5 border-t mt-4 sticky bottom-0 bg-background pb-6 px-6 z-10">
//             <Button
//               type="button"
//               variant="outline"
//               onClick={handleDialogClose}
//               disabled={isSubmitting || isGeneratingBarcode}
//             >
//               Bekor qilish
//             </Button>
//             <Button
//               type="submit"
//               disabled={
//                 isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa
//               }
//             >
//               {isSubmitting ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Saqlanmoqda...
//                 </>
//               ) : isLoadingCategories || isGeneratingBarcode || isLoadingKassa ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Tayyorlanmoqda...
//                 </>
//               ) : (
//                 "Saqlash"
//               )}
//             </Button>
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }


import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog, // Shadcn Dialog
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"; // Shadcn Dialog importlari
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axios from "axios";
import { Loader2, ScanBarcode, Fingerprint } from "lucide-react";
import { cn } from "@/lib/utils"; // Shadcn utils

// Tiplar (global types faylida bo'lishi mumkin)
interface ApiCategory {
  id: number;
  name: string;
  description?: string;
}

interface Kassa { // Kassa uchun yangi interfeys
    id: number;
    name: string;
    is_active?: boolean; // Backenddan keladigan maydon
}

export type DialogView = "phone" | "accessory";
type PhoneSubType = "android" | "iphone";
type IdentifierModeApi = "auto_barcode" | "manual_barcode_unique" | "manual_imei"; // Yangilangan

interface Product {
  id: number;
  name: string;
  category: number | null;
  category_name?: string;
  barcode?: string | null;
  price_uzs?: string | null;
  price_usd?: string | null;
  purchase_price_uzs?: string | null;
  purchase_price_usd?: string | null;
  storage_capacity?: string | null;
  color?: string | null;
  series_region?: string | null;
  battery_health?: string | null;
  purchase_date?: string | null;
  is_active: boolean;
  description?: string | null;
}

interface FormData {
  name: string;
  purchaseDate: string;
  categoryId: string; // Bu avtomatik aniqlanadi, lekin state'da qoladi
  identifierType: IdentifierModeApi; // Yangi
  defaultKassaId: string; // Yangi
  initialStockQuantity: string; // Yangi
  phonePurchasePriceUzs: string;
  phoneSellingPriceUzs: string;
  phonePurchasePriceUsd: string;
  phoneSellingPriceUsd: string;
  androidCapacityRamStorage: string;
  iphoneColor: string;
  iphoneCapacityStorage: string;
  iphoneBatteryHealth: string;
  iphoneSeriesRegion: string;
  accessoryColor: string;
  accessoryPriceUzs: string;
  accessoryPriceUsd: string;
  accessoryDescription: string;
}

const initialFormData: FormData = {
  name: "",
  purchaseDate: new Date().toISOString().split("T")[0],
  categoryId: "",
  identifierType: "auto_barcode", // Default qiymat
  defaultKassaId: "", // Default bo'sh
  initialStockQuantity: "0", // Default 0
  phonePurchasePriceUzs: "",
  phoneSellingPriceUzs: "",
  phonePurchasePriceUsd: "",
  phoneSellingPriceUsd: "",
  androidCapacityRamStorage: "",
  iphoneColor: "",
  iphoneCapacityStorage: "",
  iphoneBatteryHealth: "",
  iphoneSeriesRegion: "",
  accessoryColor: "",
  accessoryPriceUzs: "",
  accessoryPriceUsd: "",
  accessoryDescription: "",
};

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddProduct: (newProduct: Product) => void;
  initialView: DialogView;
}

// API URL manzillari
const API_URL_CATEGORIES =
  "https://smartphone777.pythonanywhere.com/api/categories/";
const API_URL_PRODUCTS =
  "https://smartphone777.pythonanywhere.com/api/products/";
const API_URL_GENERATE_BARCODE =
  "https://smartphone777.pythonanywhere.com/api/products/generate-barcode/";
const API_URL_KASSA =
  "https://smartphone777.pythonanywhere.com/api/kassa/"; // Kassa uchun API

export function AddProductDialog({
  open,
  onOpenChange,
  onAddProduct,
  initialView,
}: AddProductDialogProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [selectedPhoneSubType, setSelectedPhoneSubType] =
    useState<PhoneSubType>(initialView === "phone" ? "android" : "android");
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingBarcode, setIsGeneratingBarcode] = useState(false);

  const [manualImei, setManualImei] = useState<string>("");
  const [generatedBarcodeForDisplay, setGeneratedBarcodeForDisplay] =
    useState<string>("");

  const [kassaList, setKassaList] = useState<Kassa[]>([]);
  const [isLoadingKassa, setIsLoadingKassa] = useState(false);

  const findCategoryIdFromApi = useCallback(
    (targetCategoryName: string, categories: ApiCategory[]): string => {
      console.log("findCategoryIdFromApi: Attempting to find category for:", targetCategoryName, "Available categories:", categories);
      if (categories.length === 0 || !targetCategoryName) {
        console.warn("findCategoryIdFromApi: No categories available or targetCategoryName is empty.");
        return "";
      }
      const targetLower = targetCategoryName.toLowerCase().trim();
      const category = categories.find((cat) => {
        const catNameLower = cat.name.toLowerCase().trim();
        if (targetLower.includes("iphone") && catNameLower.includes("iphone")) return true;
        if (targetLower.includes("android") && catNameLower.includes("android") && !catNameLower.includes("iphone")) return true;
        if ((targetLower.includes("accessory") || targetLower.includes("aksesuar")) && (catNameLower.includes("accessory") || catNameLower.includes("aksesuar"))) return true;
        return catNameLower === targetLower;
      });
      if (category) {
        console.log("findCategoryIdFromApi: Found category:", category);
      } else {
        console.warn("findCategoryIdFromApi: Category not found for target:", targetCategoryName);
      }
      return category ? category.id.toString() : "";
    },
    []
  );

  useEffect(() => {
    if (open) {
      console.log("AddProductDialog opened. Initial view:", initialView);
      setFormData({
        ...initialFormData,
        purchaseDate: new Date().toISOString().split("T")[0],
        identifierType: initialView === "accessory" ? "auto_barcode" : "auto_barcode",
      });
      setManualImei("");
      setGeneratedBarcodeForDisplay("");
      setSelectedPhoneSubType(initialView === "phone" ? "android" : "android");
    }
  }, [open, initialView]);

  useEffect(() => {
    if (!open) return;

    if (initialView === "phone") {
        if (formData.identifierType === "manual_barcode_unique" || formData.identifierType === "manual_imei") {
            setFormData(prev => ({ ...prev, initialStockQuantity: "1" }));
        } else if (formData.identifierType === "auto_barcode") {
             setFormData(prev => ({ ...prev, initialStockQuantity: "0" }));
        }
    } else if (initialView === "accessory") {
        setFormData(prev => ({ ...prev, initialStockQuantity: "0" }));
    }
  }, [open, formData.identifierType, initialView]);


  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      setIsLoadingCategories(true);
      setIsLoadingKassa(true);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Avtorizatsiya tokeni topilmadi. Iltimos, qayta tizimga kiring.");
        console.error("AddProductDialog: Auth token not found in fetchData. Aborting data load.");
        setIsLoadingCategories(false);
        setIsLoadingKassa(false);
        onOpenChange(false); // Close dialog if no token
        return;
      }
      try {
        console.log("AddProductDialog: Fetching categories and kassa list...");
        const [categoriesResponse, kassaResponse] = await Promise.all([
          axios.get(API_URL_CATEGORIES, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(API_URL_KASSA, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        console.log("AddProductDialog: Categories API Response raw data:", categoriesResponse.data);
        const categoriesData = Array.isArray(categoriesResponse.data)
          ? categoriesResponse.data
          : (categoriesResponse.data as any).results || [];
        const filteredCategories = categoriesData.filter((cat: any) => cat.name && cat.id) as ApiCategory[];
        setApiCategories(filteredCategories);
        console.log("AddProductDialog: Processed ApiCategories:", filteredCategories);


        console.log("AddProductDialog: Kassa API Response raw data:", kassaResponse.data);
        const kassaData = Array.isArray(kassaResponse.data)
          ? kassaResponse.data
          : (kassaResponse.data as any).results || [];
        const filteredKassa = kassaData.filter((k: Kassa) => k.is_active !== false);
        setKassaList(filteredKassa);
        console.log("AddProductDialog: Processed KassaList:", filteredKassa);


      } catch (error: any) {
        console.error("AddProductDialog: Error fetching categories or kassa:", error);
        let errorMessage = "Kategoriya yoki kassalarni yuklashda xatolik: ";
        if (error.response) {
          errorMessage += `Server javobi: ${error.response.status}. Tafsilotlar konsolda.`;
          console.error("Server Response Data:", error.response.data);
        } else if (error.request) {
          errorMessage += "Serverdan javob kelmadi. Internet aloqasini tekshiring.";
        } else {
          errorMessage += error.message;
        }
        toast.error(errorMessage, { duration: 7000 });
      } finally {
        setIsLoadingCategories(false);
        setIsLoadingKassa(false);
      }
    };
    fetchData();
  }, [open, onOpenChange]);

  const handleDialogClose = () => {
    if (isSubmitting || isGeneratingBarcode) return;
    onOpenChange(false);
  };

  const handleGenerateBarcode = async () => {
    setIsGeneratingBarcode(true);
    setGeneratedBarcodeForDisplay("");
    let categoryIdForBarcode = "";
    const nameLower = formData.name.toLowerCase().trim();
    const targetCatName = initialView === 'phone'
        ? (selectedPhoneSubType === 'iphone' || nameLower.includes("iphone") ? "iPhone" : "Android")
        : "accessory";

    console.log("handleGenerateBarcode: Attempting to find category for barcode generation:", targetCatName);
    categoryIdForBarcode = findCategoryIdFromApi(targetCatName, apiCategories);
    if (!categoryIdForBarcode && initialView === 'phone') {
        toast.info(`"${targetCatName}" uchun mos kategoriya topilmadi. Shtrix-kod umumiyroq prefiks bilan generatsiya qilinishi mumkin.`);
        console.warn("handleGenerateBarcode: Category not found for phone, barcode might use generic prefix.");
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Avtorizatsiya tokeni yo'q. Generatsiya qilib bo'lmadi.");
        console.error("handleGenerateBarcode: Auth token not found.");
        setIsGeneratingBarcode(false);
        return;
      }
      const params: any = {};
      if (categoryIdForBarcode) params.category_id = categoryIdForBarcode;
      
      console.log("handleGenerateBarcode: Generating barcode with params:", params);
      const response = await axios.get<{ barcode: string }>(
        API_URL_GENERATE_BARCODE,
        { headers: { Authorization: `Bearer ${token}` }, params }
      );
      setGeneratedBarcodeForDisplay(response.data.barcode);
      console.log("handleGenerateBarcode: Generated barcode:", response.data.barcode);
      toast.success("Yangi shtrix-kod generatsiya qilindi!");
    } catch (error: any) {
      console.error("handleGenerateBarcode: Error generating barcode:", error);
      let errorMessage = "Shtrix-kod generatsiya qilishda xatolik: ";
       if (error.response) {
          errorMessage += `Server javobi: ${error.response.status}. Tafsilotlar konsolda.`;
          console.error("Server Response Data (Barcode Gen):", error.response.data);
        } else if (error.request) {
          errorMessage += "Serverdan javob kelmadi.";
        } else {
          errorMessage += error.message;
        }
      toast.error(errorMessage, { duration: 7000 });
      setGeneratedBarcodeForDisplay("");
    } finally {
      setIsGeneratingBarcode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("handleSubmit: Form submission started. Current state:", {formData, manualImei, generatedBarcodeForDisplay, selectedPhoneSubType, initialView});

    // --- VALIDATIONS ---
    if (!formData.name.trim()) {
      toast.error("Mahsulot nomi kiritilishi shart.");
      console.error("handleSubmit: Validation failed - Product name is empty.");
      return;
    }
    if (
      initialView === "phone" &&
      (formData.identifierType === "manual_imei" || formData.identifierType === "manual_barcode_unique") &&
      !manualImei.trim()
    ) {
      const id_type_label = formData.identifierType === "manual_imei" ? "IMEI" : "Shtrix Kod (Unikal)";
      toast.error(`${id_type_label} kiritilishi shart.`);
      console.error(`handleSubmit: Validation failed - ${id_type_label} is empty for manual input.`);
      return;
    }

    const nameLower = formData.name.toLowerCase().trim();
    let targetCatNameSubmit = initialView === "phone"
        ? (selectedPhoneSubType === 'iphone' || nameLower.includes("iphone") ? "iPhone" : "Android")
        : "accessory";
    
    console.log("handleSubmit: Attempting to find category for submission. Target category name:", targetCatNameSubmit);
    let finalCategoryId = findCategoryIdFromApi(targetCatNameSubmit, apiCategories);

    if (!finalCategoryId) {
        toast.error(`"${targetCatNameSubmit}" uchun mos kategoriya tizimda mavjud emas. Iltimos, avval "Kategoriya qo'shish" orqali kerakli kategoriyani yarating yoki mahsulot nomini to'g'rilang. Mahsulot saqlanmadi.`);
        console.error(`handleSubmit: Validation failed - Category ID not found for "${targetCatNameSubmit}". Submission halted.`);
        setIsSubmitting(false); 
        return;
    }
    // --- END VALIDATIONS ---


    setIsSubmitting(true);
    let productPayload: any = {
      name: formData.name.trim(),
      category: Number(finalCategoryId),
      identifier_type: formData.identifierType,
      barcode: null,
      purchase_date: formData.purchaseDate || null,
      is_active: true,
      add_to_stock_quantity: 0,
    };

    const stockQty = parseInt(formData.initialStockQuantity);
    if (!isNaN(stockQty) && stockQty >= 0) {
        productPayload.add_to_stock_quantity = stockQty;
    } else if (formData.initialStockQuantity.trim() !== "") { // Agar bo'sh bo'lmasa, lekin notog'ri bo'lsa
        toast.warn("Boshlang'ich miqdor noto'g'ri kiritilgan, 0 deb qabul qilindi.");
        console.warn("handleSubmit: initialStockQuantity is invalid, defaulting to 0. Value:", formData.initialStockQuantity);
        productPayload.add_to_stock_quantity = 0;
    }


    if (formData.defaultKassaId && !isNaN(parseInt(formData.defaultKassaId))) {
      productPayload.default_kassa_id_for_new_stock = Number(formData.defaultKassaId);
    }

    if ((formData.identifierType === "manual_imei" || formData.identifierType === "manual_barcode_unique") && initialView === "phone") {
      productPayload.barcode = manualImei.trim().toUpperCase();
    } else if (formData.identifierType === "auto_barcode" && generatedBarcodeForDisplay) {
      productPayload.barcode = generatedBarcodeForDisplay;
    }
    

    let hasSellingPrice = false;
    const p_uzs_str = initialView === "phone" ? formData.phoneSellingPriceUzs : formData.accessoryPriceUzs;
    const p_usd_str = initialView === "phone" ? formData.phoneSellingPriceUsd : formData.accessoryPriceUsd;
    
    const parsePrice = (priceStr: string) => priceStr ? parseFloat(priceStr.replace(/\s/g, '').replace(/,/g, '.')) : NaN;

    const p_uzs = parsePrice(p_uzs_str);
    const p_usd = parsePrice(p_usd_str);

    if (p_uzs_str.trim() !== "") {
      if (!isNaN(p_uzs) && p_uzs > 0) {
          productPayload.price_uzs = p_uzs.toFixed(0); 
          hasSellingPrice = true;
      } else {
          toast.error("Sotiladigan narx (so'm) noto'g'ri formatda yoki 0 dan kichik/teng.");
          console.error("handleSubmit: Validation failed - Selling price UZS is invalid. Value:", p_uzs_str);
          setIsSubmitting(false); return;
      }
    }

    if (p_usd_str.trim() !== "") {
      if (!isNaN(p_usd) && p_usd > 0) {
          productPayload.price_usd = p_usd.toFixed(2);
          hasSellingPrice = true;
      } else {
          toast.error("Sotiladigan narx (USD) noto'g'ri formatda yoki 0 dan kichik/teng.");
          console.error("handleSubmit: Validation failed - Selling price USD is invalid. Value:", p_usd_str);
          setIsSubmitting(false); return;
      }
    }
    
    if (!hasSellingPrice) {
      toast.error(
        "Kamida bitta sotish narxi (UZS yoki USD) 0 dan katta bo'lishi shart."
      );
      console.error("handleSubmit: Validation failed - No selling price provided (UZS or USD > 0).");
      setIsSubmitting(false);
      return;
    }

    const purch_uzs_str = formData.phonePurchasePriceUzs;
    const purch_usd_str = formData.phonePurchasePriceUsd;

    const purch_uzs = parsePrice(purch_uzs_str);
    const purch_usd = parsePrice(purch_usd_str);

    if (initialView === "phone") {
      if (purch_uzs_str.trim() !== "") {
        if (!isNaN(purch_uzs) && purch_uzs > 0)
          productPayload.purchase_price_uzs = purch_uzs.toFixed(0);
        else {
            toast.warn("Olingan narx (so'm) noto'g'ri formatda yoki 0 dan kichik/teng, kiritilmadi.");
            console.warn("handleSubmit: Purchase price UZS is invalid, not included. Value:", purch_uzs_str);
        }
      }

      if (purch_usd_str.trim() !== "") {
        if (!isNaN(purch_usd) && purch_usd > 0)
          productPayload.purchase_price_usd = purch_usd.toFixed(2);
        else {
            toast.warn("Olingan narx (USD) noto'g'ri formatda yoki 0 dan kichik/teng, kiritilmadi.");
            console.warn("handleSubmit: Purchase price USD is invalid, not included. Value:", purch_usd_str);
        }
      }
    }


    if (initialView === "phone") {
      const isIphone = selectedPhoneSubType === "iphone" || nameLower.includes("iphone");
      if (!isIphone) { // Android uchun
        if (formData.androidCapacityRamStorage.trim())
          productPayload.storage_capacity = formData.androidCapacityRamStorage.trim();
      } else { // iPhone uchun
        if (!formData.iphoneColor.trim()) {
          toast.error("iPhone uchun rang kiritilishi shart.");
          console.error("handleSubmit: Validation failed - iPhone color is empty.");
          setIsSubmitting(false);
          return;
        }
        if (!formData.iphoneCapacityStorage.trim()) {
          toast.error("iPhone uchun sig‘im kiritilishi shart.");
          console.error("handleSubmit: Validation failed - iPhone capacity is empty.");
          setIsSubmitting(false);
          return;
        }
        productPayload.color = formData.iphoneColor.trim();
        productPayload.storage_capacity = `${formData.iphoneCapacityStorage.trim()}GB`;
        
        const batteryHealthVal = formData.iphoneBatteryHealth.trim();
        if (batteryHealthVal !== "") {
            const batteryHealth = parseFloat(batteryHealthVal);
            if (!isNaN(batteryHealth) && batteryHealth > 0 && batteryHealth <=100)
              productPayload.battery_health = Number(batteryHealth); // Backend number kutsa
            else {
               toast.warn("iPhone batareya quvvati noto'g'ri formatda (0-100 oralig'ida bo'lishi kerak), kiritilmadi.");
               console.warn("handleSubmit: iPhone battery health is invalid, not included. Value:", batteryHealthVal);
            }
        }

        if (formData.iphoneSeriesRegion.trim())
          productPayload.series_region = formData.iphoneSeriesRegion.trim();
      }
    } else { // Aksessuar uchun
      if (formData.accessoryColor.trim())
        productPayload.color = formData.accessoryColor.trim();
      if (formData.accessoryDescription.trim())
        productPayload.description = formData.accessoryDescription.trim();
    }

    console.log("handleSubmit: Final productPayload to be sent to API:", productPayload);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Avtorizatsiya tokeni topilmadi. Saqlash amalga oshirilmadi.");
        console.error("handleSubmit: Auth token not found before API call.");
        setIsSubmitting(false);
        return;
      }
      const response = await axios.post(API_URL_PRODUCTS, productPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("handleSubmit: API success response:", response);
      toast.success(`Mahsulot "${response.data.name}" muvaffaqiyatli qo‘shildi!`);
      onAddProduct(response.data as Product);
      handleDialogClose();
    } catch (error: any) {
      console.error("handleSubmit: API submission error:", error);
      let errMsg = `Mahsulot qo‘shishda xatolik: `;
      if (error.response && error.response.data) {
        const data = error.response.data;
        console.error("handleSubmit: Server error response data:", data);
        if (typeof data === "object" && data !== null) {
          if (data.detail) { // Django REST framework common detail field
             errMsg += `${data.detail}. `;
          }
          Object.keys(data).forEach(key => {
              if (key !== 'detail') { // detailni qayta qo'shmaslik uchun
                if (Array.isArray(data[key])) {
                    errMsg += `${key}: ${data[key].join(', ')}. `;
                } else if (typeof data[key] === 'string') {
                     errMsg += `${key}: ${data[key]}. `;
                } else if (typeof data[key] === 'object' && data[key] !== null) {
                     errMsg += `${key}: ${JSON.stringify(data[key])}. `;
                }
              }
          });
          // Agar faqat "detail" bo'lsa va boshqa xato bo'lmasa, yuqorida qo'shilgan bo'ladi.
          if (errMsg === `Mahsulot qo‘shishda xatolik: ` && !data.detail) { // Agar detail yo'q bo'lsa va boshqa hech narsa topilmasa
             errMsg += "Noma'lum server xatosi tuzilmasi.";
          }
        } else if (typeof data === 'string') { // Ba'zida server string qaytarishi mumkin
            errMsg += data;
        } else {
            errMsg += "Noma'lum server javobi tuzilmasi.";
        }
      } else if (error.request) {
        errMsg += "Serverdan javob kelmadi. Internet aloqangizni tekshiring yoki serverda muammo bo'lishi mumkin.";
      } else {
        errMsg += error.message || "Noma'lum xatolik.";
      }
      
      if (errMsg.trim() === `Mahsulot qo‘shishda xatolik:` || errMsg.trim() === `Mahsulot qo‘shishda xatolik: .`) {
          errMsg = "Mahsulot qo‘shishda noma'lum xatolik yuz berdi. Iltimos, konsolni tekshiring.";
      }

      toast.error(errMsg.trim(), { duration: 10000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
        const newState = { ...prev, [name]: value };
        if (name === "name" && initialView === "phone") {
            const nameLower = value.toLowerCase().trim();
            if (nameLower.includes("iphone") && selectedPhoneSubType !== "iphone") {
                setSelectedPhoneSubType("iphone");
                 console.log("handleChange: Auto-switched to iPhone subtype based on name.");
            } else if (!nameLower.includes("iphone") && selectedPhoneSubType === "iphone" && !nameLower.includes("android")) {
                 setSelectedPhoneSubType("android");
                 console.log("handleChange: Auto-switched to Android subtype as 'iphone' removed from name.");
            }
        }
        return newState;
    });
  };

  const handlePhoneSubTypeChange = (subType: PhoneSubType) => {
    setSelectedPhoneSubType(subType);
    console.log("handlePhoneSubTypeChange: Phone subtype changed to:", subType);
  };

  const handleIdentifierModeChange = (mode: IdentifierModeApi) => {
    setFormData(prev => ({...prev, identifierType: mode}));
    setGeneratedBarcodeForDisplay("");
    if (mode === "manual_imei" || mode === "manual_barcode_unique") {
        setManualImei("");
    }
    console.log("handleIdentifierModeChange: Identifier mode changed to:", mode);
  };

  // ----- JSX QISMI (O'zgarishsiz qoldirildi, faqat ba'zi placeholderlar va disabled holatlari aniqlashtirilgan) -----
  const renderPhoneSubTypeSelector = () => (
    <div className="flex border-b mb-4">
      <Button
        variant="ghost"
        type="button"
        className={cn(
          "flex-1 justify-center rounded-none border-b-2 py-3 text-sm font-medium",
          selectedPhoneSubType === "android"
            ? "border-primary text-primary bg-primary/10"
            : "border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
        onClick={() => handlePhoneSubTypeChange("android")}
        disabled={isSubmitting || isLoadingCategories || isLoadingKassa}
      >
        Android
      </Button>
      <Button
        variant="ghost"
        type="button"
        className={cn(
          "flex-1 justify-center rounded-none border-b-2 py-3 text-sm font-medium",
          selectedPhoneSubType === "iphone"
            ? "border-primary text-primary bg-primary/10"
            : "border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
        onClick={() => handlePhoneSubTypeChange("iphone")}
        disabled={isSubmitting || isLoadingCategories || isLoadingKassa}
      >
        iPhone
      </Button>
    </div>
  );

  const renderIdentifierSelector = () =>
    initialView !== "phone" ? null : (
      <div className="mb-3">
        <Label className="text-xs font-medium mb-1 block">Identifikator Turi</Label>
        <div className="flex rounded-md border bg-muted p-0.5">
          <Button
            type="button"
            variant={formData.identifierType === "auto_barcode" ? "default" : "ghost"}
            onClick={() => handleIdentifierModeChange("auto_barcode")}
            className={cn("flex-1 h-8 text-xs", formData.identifierType === "auto_barcode" ? "shadow-sm" : "")}
            disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
          >
            <ScanBarcode className="mr-2 h-4 w-4" />
            Shtrix (Avto)
          </Button>
          <Button
            type="button"
            variant={formData.identifierType === "manual_barcode_unique" ? "default" : "ghost"}
            onClick={() => handleIdentifierModeChange("manual_barcode_unique")}
            className={cn("flex-1 h-8 text-xs", formData.identifierType === "manual_barcode_unique" ? "shadow-sm" : "")}
            disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
          >
            <ScanBarcode className="mr-2 h-4 w-4" />
            Shtrix (Unikal)
          </Button>
          <Button
            type="button"
            variant={formData.identifierType === "manual_imei" ? "default" : "ghost"}
            onClick={() => handleIdentifierModeChange("manual_imei")}
            className={cn("flex-1 h-8 text-xs", formData.identifierType === "manual_imei" ? "shadow-sm" : "")}
            disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
          >
            <Fingerprint className="mr-2 h-4 w-4" />
            IMEI (Qo'lda)
          </Button>
        </div>
      </div>
    );

  const renderCommonFields = () => (
    <>
      <div className="space-y-1">
        <Label htmlFor="name" className="text-xs font-medium">
          Nomi <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder={
            initialView === "phone"
              ? selectedPhoneSubType === "android"
                ? "Masalan: Samsung A51 8/128GB Black"
                : "Masalan: iPhone 14 Pro 256GB Deep Purple"
              : "Masalan: Chexol iPhone 13 uchun (Shisha)"
          }
          disabled={isSubmitting}
        />
      </div>

      {initialView === "phone" && (formData.identifierType === "manual_imei" || formData.identifierType === "manual_barcode_unique") && (
        <div className="space-y-1">
          <Label htmlFor="manualImei" className="text-xs font-medium">
            {formData.identifierType === "manual_imei" ? "IMEI" : "Shtrix Kod (Unikal)"} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="manualImei"
            name="manualImei"
            value={manualImei}
            onChange={(e) => setManualImei(e.target.value.toUpperCase())}
            placeholder={`${formData.identifierType === "manual_imei" ? "IMEI" : "Unikal shtrix kod"}ni kiriting...`}
            className="text-base font-mono h-11 px-3"
            maxLength={150}
            disabled={isSubmitting || isLoadingCategories || isLoadingKassa}
          />
          <p className="text-xs text-muted-foreground">
            {formData.identifierType === "manual_imei"
              ? "Bir nechta IMEI ni vergul (,) bilan ajratib kiriting (agar backend bir nechta IMEI ni bitta mahsulot uchun qo'llab-quvvatlasa)."
              : "Bu shtrix kod tizimda yagona bo'lishi kerak."
            }
          </p>
        </div>
      )}

      {( (initialView === "phone" && formData.identifierType === "auto_barcode") || initialView === "accessory" ) && (
        <div className="space-y-1">
          <Label className="text-xs font-medium">Shtrix Kod</Label>
          <div className="flex items-center gap-2">
            <Input
              id="generatedBarcodeDisplay"
              value={generatedBarcodeForDisplay || ((formData.identifierType === "auto_barcode" || initialView === "accessory") ? "Avtomatik (saqlashda server yaratadi)" : "Shtrix-kod kiritilmagan")}
              readOnly
              className={cn(
                "bg-muted/50 cursor-default h-11 px-3 flex-grow",
                !generatedBarcodeForDisplay && (formData.identifierType === "auto_barcode" || initialView === "accessory") && "italic text-muted-foreground"
              )}
            />
            {initialView === "phone" && formData.identifierType === "auto_barcode" && (
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateBarcode}
                disabled={isSubmitting || isGeneratingBarcode || isLoadingCategories || isLoadingKassa}
                className="h-11 shrink-0"
                title="Yangi shtrix-kod generatsiya qilish (ixtiyoriy)"
              >
                {isGeneratingBarcode ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Generatsiya"
                )}
              </Button>
            )}
          </div>
           <p className="text-xs text-muted-foreground">
                {initialView === "phone" && formData.identifierType === "auto_barcode"
                  ? "Agar generatsiya qilmasangiz, server saqlashda o'zi unikal shtrix-kod yaratadi."
                  : initialView === "accessory"
                  ? "Aksessuarlar uchun shtrix-kod serverda har doim avtomatik generatsiya qilinadi."
                  : ""}
            </p>
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="purchaseDate" className="text-xs font-medium">
          Olingan sana
        </Label>
        <Input
          id="purchaseDate"
          name="purchaseDate"
          type="date"
          value={formData.purchaseDate}
          onChange={handleChange}
          disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="defaultKassaId" className="text-xs font-medium">
          Standart kassa (Omborga kirim uchun)
        </Label>
        <select
          id="defaultKassaId"
          name="defaultKassaId"
          value={formData.defaultKassaId}
          onChange={handleChange}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSubmitting || isLoadingKassa}
        >
          <option value="">Kassa tanlanmagan (Standart kassa ishlatiladi)</option>
          {kassaList.map((kassa) => (
            <option key={kassa.id} value={kassa.id.toString()}>
              {kassa.name}
            </option>
          ))}
        </select>
        {isLoadingKassa && <p className="text-xs text-muted-foreground mt-1">Kassalar ro'yxati yuklanmoqda...</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="initialStockQuantity" className="text-xs font-medium">
          Boshlang'ich miqdor (omborga)
        </Label>
        <Input
          id="initialStockQuantity"
          name="initialStockQuantity"
          type="number"
          min="0"
          step="1"
          value={formData.initialStockQuantity}
          onChange={handleChange}
          placeholder="0"
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">
          {initialView === "phone" && (formData.identifierType === "manual_imei" || formData.identifierType === "manual_barcode_unique")
            ? "Odatda 1 dona. Agar bir xil IMEI/Shtrix bilan bir nechta bo'lsa (masalan, qutilar), shunga mos kiriting."
            : "Agar darhol omborga kirim qilmoqchi bo'lsangiz, miqdorni kiriting. Standart: 0."}
        </p>
      </div>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6 pt-5 sticky top-0 bg-background z-10 border-b">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl font-semibold">
              {initialView === "phone"
                ? "Telefon Qo'shish"
                : "Aksesuar Qo'shish"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Yangi {initialView === "phone" ? "telefon" : "aksesuar"}{" "}
              ma'lumotlarini kiriting.{" "}
              <span className="text-destructive">*</span> bilan belgilangan maydonlar majburiy.
            </DialogDescription>
          </DialogHeader>
        </div>
        {initialView === "phone" && renderPhoneSubTypeSelector()}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3">
          {initialView === "phone" && renderIdentifierSelector()}
          {renderCommonFields()}
          {initialView === "phone" && (
            <>
              <div className="pt-2 mt-2 border-t">
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                  Narxlar (Telefon)
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="phonePurchasePriceUzs" className="text-xs">
                      Olingan narx (so'm)
                    </Label>
                    <Input
                      id="phonePurchasePriceUzs"
                      name="phonePurchasePriceUzs"
                      type="text"
                      inputMode="decimal"
                      value={formData.phonePurchasePriceUzs}
                      onChange={handleChange}
                      placeholder="Masalan: 5000000"
                      disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phoneSellingPriceUzs" className="text-xs">
                      Sotiladigan narx (so'm) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phoneSellingPriceUzs"
                      name="phoneSellingPriceUzs"
                      type="text"
                      inputMode="decimal"
                      value={formData.phoneSellingPriceUzs}
                      onChange={handleChange}
                      placeholder="Masalan: 5500000"
                      disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phonePurchasePriceUsd" className="text-xs">
                      Olingan narx (USD)
                    </Label>
                    <Input
                      id="phonePurchasePriceUsd"
                      name="phonePurchasePriceUsd"
                      type="text"
                      inputMode="decimal"
                      value={formData.phonePurchasePriceUsd}
                      onChange={handleChange}
                      placeholder="Masalan: 400.00"
                      disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phoneSellingPriceUsd" className="text-xs">
                      Sotiladigan narx (USD) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phoneSellingPriceUsd"
                      name="phoneSellingPriceUsd"
                      type="text"
                      inputMode="decimal"
                      value={formData.phoneSellingPriceUsd}
                      onChange={handleChange}
                      placeholder="Masalan: 450.00"
                      disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Sotiladigan narxlardan kamida bittasi (so'm yoki USD) 0 dan katta bo'lishi shart.
                </p>
              </div>
              {selectedPhoneSubType === "android" && (
                <div className="pt-2 mt-2 border-t">
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                    Qo'shimcha Ma'lumotlar (Android)
                  </h3>
                  <div className="space-y-1">
                    <Label
                      htmlFor="androidCapacityRamStorage"
                      className="text-xs"
                    >
                      Xotira Sig'imi (RAM/Ichki)
                    </Label>
                    <Input
                      id="androidCapacityRamStorage"
                      name="androidCapacityRamStorage"
                      value={formData.androidCapacityRamStorage}
                      onChange={handleChange}
                      placeholder="Masalan: 8/256GB yoki 128GB"
                      disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
                    />
                  </div>
                </div>
              )}
              {selectedPhoneSubType === "iphone" && (
                <div className="pt-2 mt-2 border-t space-y-3">
                  <h3 className="text-sm font-semibold mb-1 text-muted-foreground">
                    Qo'shimcha Ma'lumotlar (iPhone)
                  </h3>
                  <div className="space-y-1">
                    <Label htmlFor="iphoneColor" className="text-xs">
                      Rangi <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="iphoneColor"
                      name="iphoneColor"
                      value={formData.iphoneColor}
                      onChange={handleChange}
                      placeholder="Masalan: Natural Titanium, Blue, Midnight"
                      required={selectedPhoneSubType === "iphone"}
                      disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div className="space-y-1">
                      <Label
                        htmlFor="iphoneCapacityStorage"
                        className="text-xs"
                      >
                        Xotira Sig'imi (GB) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="iphoneCapacityStorage"
                        name="iphoneCapacityStorage"
                        type="text"
                        inputMode="numeric" // Faqat raqam kiritishga yordam beradi
                        value={formData.iphoneCapacityStorage}
                        onChange={handleChange}
                        placeholder="Masalan: 256 (faqat raqam)"
                        required={selectedPhoneSubType === "iphone"}
                        disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="iphoneBatteryHealth" className="text-xs">
                        Batareya Holati (%)
                      </Label>
                      <Input
                        id="iphoneBatteryHealth"
                        name="iphoneBatteryHealth"
                        type="text"
                        inputMode="numeric"
                        value={formData.iphoneBatteryHealth}
                        onChange={handleChange}
                        placeholder="Masalan: 85 (0-100 oralig'ida)"
                        disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="iphoneSeriesRegion" className="text-xs">
                      Model Seriyasi (Region)
                    </Label>
                    <Input
                      id="iphoneSeriesRegion"
                      name="iphoneSeriesRegion"
                      value={formData.iphoneSeriesRegion}
                      onChange={handleChange}
                      placeholder="Masalan: LL/A (USA), ZP/A (Hong Kong)"
                      disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
                    />
                  </div>
                </div>
              )}
            </>
          )}
          {initialView === "accessory" && (
            <div className="pt-2 mt-2 border-t space-y-3">
              <h3 className="text-sm font-semibold mb-1 text-muted-foreground">
                Qo'shimcha Ma'lumotlar (Aksesuar)
              </h3>
              <div className="space-y-1">
                <Label htmlFor="accessoryPriceUzs" className="text-xs">
                  Narxi (so'm) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="accessoryPriceUzs"
                  name="accessoryPriceUzs"
                  type="text"
                  inputMode="decimal"
                  value={formData.accessoryPriceUzs}
                  onChange={handleChange}
                  placeholder="Masalan: 150000"
                  disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="accessoryPriceUsd" className="text-xs">
                  Narxi (USD) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="accessoryPriceUsd"
                  name="accessoryPriceUsd"
                  type="text"
                  inputMode="decimal"
                  value={formData.accessoryPriceUsd}
                  onChange={handleChange}
                  placeholder="Masalan: 12.00"
                  disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Narxlardan kamida bittasi (so'm yoki USD) 0 dan katta bo'lishi shart.
              </p>
              <div className="space-y-1">
                <Label htmlFor="accessoryColor" className="text-xs">
                  Rangi
                </Label>
                <Input
                  id="accessoryColor"
                  name="accessoryColor"
                  value={formData.accessoryColor}
                  onChange={handleChange}
                  placeholder="Qora, Oq, Pushti"
                  disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="accessoryDescription" className="text-xs">
                  Qo'shimcha Izoh
                </Label>
                <Textarea
                  id="accessoryDescription"
                  name="accessoryDescription"
                  value={formData.accessoryDescription}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Materiali, Brendi, Mosligi va hk."
                  disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}
                />
              </div>
            </div>
          )}
          <DialogFooter className="pt-5 border-t mt-4 sticky bottom-0 bg-background pb-6 px-6 z-10">
            <Button
              type="button"
              variant="outline"
              onClick={handleDialogClose}
              disabled={isSubmitting || isGeneratingBarcode}
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting || isLoadingCategories || isLoadingKassa // isGeneratingBarcode submitni bloklamasligi kerak
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saqlanmoqda...
                </>
              ) : isLoadingCategories || isLoadingKassa ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ma'lumotlar yuklanmoqda...
                </>
              ) : (
                "Saqlash"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}