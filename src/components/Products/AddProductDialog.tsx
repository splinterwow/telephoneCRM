// // import React, { useState, useEffect, useCallback } from "react";
// // import {
// //   Dialog,
// //   DialogContent,
// //   DialogFooter,
// //   DialogHeader,
// //   DialogTitle,
// //   DialogDescription,
// // } from "@/components/ui/dialog";
// // import { Button } from "@/components/ui/button";
// // import { Label } from "@/components/ui/label";
// // import { Input } from "@/components/ui/input";
// // import { Textarea } from "@/components/ui/textarea";
// // import { toast } from "sonner";
// // import axios from "axios";
// // import { Loader2, ScanBarcode, Fingerprint } from "lucide-react";
// // import { cn } from "@/lib/utils";

// // interface ApiCategory {
// //   id: number;
// //   name: string;
// //   description?: string;
// // }

// // export type DialogView = "phone" | "accessory";
// // type PhoneSubType = "android" | "iphone";
// // type IdentifierModeApi = "auto_barcode" | "manual_imei";

// // interface Product {
// //   id: number;
// //   name: string;
// //   category: number | null;
// //   category_name?: string;
// //   barcode?: string | null;
// //   price_uzs?: string | null;
// //   price_usd?: string | null;
// //   purchase_price_uzs?: string | null;
// //   purchase_price_usd?: string | null;
// //   storage_capacity?: string | null;
// //   color?: string | null;
// //   series_region?: string | null;
// //   battery_health?: string | null;
// //   purchase_date?: string | null;
// //   is_active: boolean;
// //   description?: string | null;
// // }

// // interface FormData {
// //   name: string;
// //   purchaseDate: string;
// //   categoryId: string;
// //   phonePurchasePriceUzs: string;
// //   phoneSellingPriceUzs: string;
// //   phonePurchasePriceUsd: string;
// //   phoneSellingPriceUsd: string;
// //   androidCapacityRamStorage: string;
// //   iphoneColor: string;
// //   iphoneCapacityStorage: string;
// //   iphoneBatteryHealth: string;
// //   iphoneSeriesRegion: string;
// //   accessoryColor: string;
// //   accessoryPriceUzs: string;
// //   accessoryPriceUsd: string;
// //   accessoryDescription: string;
// // }

// // const initialFormData: FormData = {
// //   name: "",
// //   purchaseDate: new Date().toISOString().split("T")[0],
// //   categoryId: "",
// //   phonePurchasePriceUzs: "",
// //   phoneSellingPriceUzs: "",
// //   phonePurchasePriceUsd: "",
// //   phoneSellingPriceUsd: "",
// //   androidCapacityRamStorage: "",
// //   iphoneColor: "",
// //   iphoneCapacityStorage: "",
// //   iphoneBatteryHealth: "",
// //   iphoneSeriesRegion: "",
// //   accessoryColor: "",
// //   accessoryPriceUzs: "",
// //   accessoryPriceUsd: "",
// //   accessoryDescription: "",
// // };

// // interface AddProductDialogProps {
// //   open: boolean;
// //   onOpenChange: (open: boolean) => void;
// //   onAddProduct: (newProduct: Product) => void;
// //   initialView: DialogView;
// // }

// // const API_URL_CATEGORIES =
// //   "https://smartphone777.pythonanywhere.com/api/categories/";
// // const API_URL_PRODUCTS =
// //   "https://smartphone777.pythonanywhere.com/api/products/"; // Bitta URL
// // const API_URL_GENERATE_BARCODE =
// //   "https://smartphone777.pythonanywhere.com/api/products/generate-barcode/";

// // export function AddProductDialog({
// //   open,
// //   onOpenChange,
// //   onAddProduct,
// //   initialView,
// // }: AddProductDialogProps) {
// //   const [formData, setFormData] = useState<FormData>(initialFormData);
// //   const [selectedPhoneSubType, setSelectedPhoneSubType] =
// //     useState<PhoneSubType>("android");
// //   const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);
// //   const [isLoadingCategories, setIsLoadingCategories] = useState(false);
// //   const [isSubmitting, setIsSubmitting] = useState(false);
// //   const [isGeneratingBarcode, setIsGeneratingBarcode] = useState(false);

// //   const [identifierMode, setIdentifierMode] =
// //     useState<IdentifierModeApi>("auto_barcode");
// //   const [manualImei, setManualImei] = useState<string>("");
// //   const [generatedBarcodeForDisplay, setGeneratedBarcodeForDisplay] =
// //     useState<string>("");

// //   const getTargetCategoryName = useCallback(
// //     (view: DialogView, subType?: PhoneSubType): string => {
// //       if (view === "phone") {
// //         return subType === "android" ? "Android" : "iPhone";
// //       } else if (view === "accessory") {
// //         return "accessory";
// //       }
// //       return "";
// //     },
// //     []
// //   );

// //   const findCategoryIdFromApi = useCallback(
// //     (targetCategoryName: string, categories: ApiCategory[]): string => {
// //       if (categories.length === 0 || !targetCategoryName) return "";
// //       const category = categories.find((cat) => {
// //         const catNameLower = cat.name.toLowerCase().trim();
// //         const targetLower = targetCategoryName.toLowerCase().trim();
// //         return (
// //           catNameLower.includes(targetLower) ||
// //           (targetLower.includes("iphone") && catNameLower.includes("iphone")) ||
// //           (targetLower.includes("android") &&
// //             catNameLower.includes("android")) ||
// //           ((targetLower.includes("accessory") ||
// //             targetLower.includes("aksesuar")) &&
// //             (catNameLower.includes("accessory") ||
// //               catNameLower.includes("aksesuar")))
// //         );
// //       });
// //       return category ? category.id.toString() : "";
// //     },
// //     []
// //   );

// //   useEffect(() => {
// //     if (open) {
// //       setFormData({
// //         ...initialFormData,
// //         purchaseDate: new Date().toISOString().split("T")[0],
// //       });
// //       setManualImei("");
// //       setGeneratedBarcodeForDisplay("");
// //       setSelectedPhoneSubType(initialView === "phone" ? "android" : "android");
// //       setIdentifierMode(
// //         initialView === "accessory" ? "auto_barcode" : "auto_barcode"
// //       );
// //     }
// //   }, [open, initialView]);

// //   useEffect(() => {
// //     if (!open) return;
// //     const fetchAndSetCategory = async () => {
// //       setIsLoadingCategories(true);
// //       try {
// //         const token = localStorage.getItem("accessToken");
// //         if (!token) {
// //           toast.error("Avtorizatsiya tokeni topilmadi.");
// //           setIsLoadingCategories(false);
// //           return;
// //         }
// //         const response = await axios.get(API_URL_CATEGORIES, {
// //           headers: { Authorization: `Bearer ${token}` },
// //         });
// //         const categoriesData = Array.isArray(response.data)
// //           ? response.data
// //           : (response.data as any).results || [];
// //         setApiCategories(
// //           categoriesData.filter(
// //             (cat: any) => cat.name && cat.id
// //           ) as ApiCategory[]
// //         );
// //         const targetCatName = getTargetCategoryName(
// //           initialView,
// //           initialView === "phone" ? selectedPhoneSubType : undefined
// //         );
// //         setFormData((prev) => ({
// //           ...prev,
// //           categoryId: findCategoryIdFromApi(targetCatName, categoriesData),
// //         }));
// //       } catch (error: any) {
// //         toast.error(
// //           "Kategoriyalarni olishda xatolik: " +
// //             (error.response?.data?.detail || error.message)
// //         );
// //       } finally {
// //         setIsLoadingCategories(false);
// //       }
// //     };
// //     fetchAndSetCategory();
// //   }, [
// //     open,
// //     initialView,
// //     selectedPhoneSubType,
// //     getTargetCategoryName,
// //     findCategoryIdFromApi,
// //   ]);

// //   const handleDialogClose = () => {
// //     if (isSubmitting || isGeneratingBarcode) return;
// //     onOpenChange(false);
// //   };

// //   const handleGenerateBarcode = async () => {
// //     setIsGeneratingBarcode(true);
// //     try {
// //       const token = localStorage.getItem("accessToken");
// //       if (!token) {
// //         toast.error("Avtorizatsiya tokeni yo'q.");
// //         return;
// //       }
// //       const params: any = {};
// //       if (formData.categoryId) params.category_id = formData.categoryId;
// //       const response = await axios.get<{ barcode: string }>(
// //         API_URL_GENERATE_BARCODE,
// //         { headers: { Authorization: `Bearer ${token}` }, params }
// //       );
// //       setGeneratedBarcodeForDisplay(response.data.barcode);
// //       toast.success("Yangi shtrix-kod generatsiya qilindi!");
// //     } catch (error: any) {
// //       toast.error(
// //         "Shtrix-kod generatsiya qilishda xatolik: " +
// //           (error.response?.data?.detail || error.message)
// //       );
// //       setGeneratedBarcodeForDisplay("");
// //     } finally {
// //       setIsGeneratingBarcode(false);
// //     }
// //   };

// //   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
// //     e.preventDefault();
// //     if (!formData.name.trim()) {
// //       toast.error("Mahsulot nomi kiritilishi shart.");
// //       return;
// //     }
// //     if (
// //       initialView === "phone" &&
// //       identifierMode === "manual_imei" &&
// //       !manualImei.trim()
// //     ) {
// //       toast.error("Telefon uchun IMEI raqami kiritilishi shart.");
// //       return;
// //     }

// //     const nameLower = formData.name.toLowerCase().trim();
// //     let targetCatNameSubmit =
// //       initialView === "phone"
// //         ? nameLower.includes("iphone")
// //           ? "iPhone"
// //           : "Android"
// //         : "accessory";
// //     const dynamicCategoryId = findCategoryIdFromApi(
// //       targetCatNameSubmit,
// //       apiCategories
// //     );
// //     let finalCategoryId = formData.categoryId;
// //     if (dynamicCategoryId && !finalCategoryId)
// //       finalCategoryId = dynamicCategoryId;
// //     if (!finalCategoryId && initialView === "accessory") {
// //       const accId = findCategoryIdFromApi("accessory", apiCategories);
// //       if (accId) finalCategoryId = accId;
// //     }

// //     setIsSubmitting(true);
// //     let productPayload: any = {
// //       name: formData.name.trim(),
// //       category: finalCategoryId ? Number(finalCategoryId) : null,
// //       identifier_type: identifierMode,
// //       barcode: null,
// //       purchase_date: formData.purchaseDate || null,
// //       is_active: true,
// //     };
// //     if (identifierMode === "manual_imei")
// //       productPayload.barcode = manualImei.trim().toUpperCase();
// //     else if (identifierMode === "auto_barcode") productPayload.barcode = null;

// //     let hasSellingPrice = false;
// //     const p_uzs = formData.phoneSellingPriceUzs || formData.accessoryPriceUzs;
// //     const p_usd = formData.phoneSellingPriceUsd || formData.accessoryPriceUsd;
// //     if (p_uzs) productPayload.price_uzs = p_uzs;
// //     if (p_usd) productPayload.price_usd = p_usd;
// //     if (formData.phonePurchasePriceUzs)
// //       productPayload.purchase_price_uzs = formData.phonePurchasePriceUzs;
// //     if (formData.phonePurchasePriceUsd)
// //       productPayload.purchase_price_usd = formData.phonePurchasePriceUsd;
// //     if (productPayload.price_uzs || productPayload.price_usd)
// //       hasSellingPrice = true;
// //     if (!hasSellingPrice) {
// //       toast.error(
// //         "Kamida bitta sotish narxi (UZS yoki USD) kiritilishi shart."
// //       );
// //       setIsSubmitting(false);
// //       return;
// //     }

// //     if (initialView === "phone") {
// //       if (selectedPhoneSubType === "android") {
// //         if (formData.androidCapacityRamStorage.trim())
// //           productPayload.storage_capacity =
// //             formData.androidCapacityRamStorage.trim();
// //       } else {
// //         if (!formData.iphoneColor.trim()) {
// //           toast.error("iPhone uchun rang kiritilishi shart.");
// //           setIsSubmitting(false);
// //           return;
// //         }
// //         if (!formData.iphoneCapacityStorage.trim()) {
// //           toast.error("iPhone uchun sig‘im kiritilishi shart.");
// //           setIsSubmitting(false);
// //           return;
// //         }
// //         productPayload.color = formData.iphoneColor.trim();
// //         productPayload.storage_capacity = `${formData.iphoneCapacityStorage.trim()}GB`;
// //         if (formData.iphoneBatteryHealth)
// //           productPayload.battery_health = Number(formData.iphoneBatteryHealth);
// //         if (formData.iphoneSeriesRegion.trim())
// //           productPayload.series_region = formData.iphoneSeriesRegion.trim();
// //       }
// //     } else {
// //       if (formData.accessoryColor.trim())
// //         productPayload.color = formData.accessoryColor.trim();
// //       if (formData.accessoryDescription.trim())
// //         productPayload.description = formData.accessoryDescription.trim();
// //     }

// //     try {
// //       const token = localStorage.getItem("accessToken");
// //       if (!token) {
// //         toast.error("Avtorizatsiya tokeni topilmadi.");
// //         setIsSubmitting(false);
// //         return;
// //       }
// //       const response = await axios.post(API_URL_PRODUCTS, productPayload, {
// //         headers: { Authorization: `Bearer ${token}` },
// //       }); // Bitta API_URL_PRODUCTS ishlatiladi
// //       toast.success(`Mahsulot muvaffaqiyatli qo‘shildi!`);
// //       onAddProduct(response.data as Product);
// //       handleDialogClose();
// //     } catch (error: any) {
// //       let errMsg = `Mahsulot qo‘shishda xatolik: `;
// //       if (error.response?.data && typeof error.response.data === "object") {
// //         const data = error.response.data;
// //         if (data.barcode && Array.isArray(data.barcode))
// //           errMsg += `Identifikator: ${data.barcode.join(", ")}. `;
// //         else if (data.identifier_type && Array.isArray(data.identifier_type))
// //           errMsg += `Identifikator turi: ${data.identifier_type.join(", ")}. `;
// //         else if (data.name && Array.isArray(data.name))
// //           errMsg += `Nom: ${data.name.join(", ")}. `;
// //         else if (data.category && Array.isArray(data.category))
// //           errMsg += `Kategoriya: ${data.category.join(", ")}. `;
// //         else if (data.non_field_errors && Array.isArray(data.non_field_errors))
// //           errMsg += data.non_field_errors.join(" ");
// //         else {
// //           let other = "";
// //           for (const k in data)
// //             if (
// //               ![
// //                 "barcode",
// //                 "identifier_type",
// //                 "name",
// //                 "category",
// //                 "non_field_errors",
// //               ].includes(k)
// //             )
// //               other += `${k}: ${
// //                 Array.isArray(data[k]) ? data[k].join(", ") : data[k]
// //               }. `;
// //           if (other) errMsg += other;
// //           else if (errMsg.endsWith(": "))
// //             errMsg += data.detail || "Noma'lum server xatosi.";
// //         }
// //       } else
// //         errMsg +=
// //           error.response?.data?.detail || error.message || "Noma'lum xatolik.";
// //       toast.error(errMsg.trim(), { duration: 8000 });
// //     } finally {
// //       setIsSubmitting(false);
// //     }
// //   };

// //   const handleChange = (
// //     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
// //   ) => {
// //     const { name, value } = e.target;
// //     setFormData((prev) => ({ ...prev, [name]: value }));
// //   };
// //   const handlePhoneSubTypeChange = (subType: PhoneSubType) =>
// //     setSelectedPhoneSubType(subType);
// //   const handleIdentifierModeChange = (mode: IdentifierModeApi) => {
// //     setIdentifierMode(mode);
// //     setGeneratedBarcodeForDisplay("");
// //   };

// //   const renderPhoneSubTypeSelector = () => (
// //     /* ... avvalgidek ... */ <div className="flex border-b mb-4">
// //       <Button
// //         variant="ghost"
// //         type="button"
// //         className={cn(
// //           "flex-1 justify-center rounded-none border-b-2 py-3 text-sm font-medium",
// //           selectedPhoneSubType === "android"
// //             ? "border-primary text-primary bg-primary/10"
// //             : "border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
// //         )}
// //         onClick={() => handlePhoneSubTypeChange("android")}
// //       >
// //         Android
// //       </Button>
// //       <Button
// //         variant="ghost"
// //         type="button"
// //         className={cn(
// //           "flex-1 justify-center rounded-none border-b-2 py-3 text-sm font-medium",
// //           selectedPhoneSubType === "iphone"
// //             ? "border-primary text-primary bg-primary/10"
// //             : "border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
// //         )}
// //         onClick={() => handlePhoneSubTypeChange("iphone")}
// //       >
// //         iPhone
// //       </Button>
// //     </div>
// //   );
// //   const renderIdentifierSelector = () =>
// //     /* ... avvalgidek ... */ initialView !== "phone" ? null : (
// //       <div className="mb-3">
// //         <Label className="text-xs font-medium mb-1 block">
// //           Identifikator Turi
// //         </Label>
// //         <div className="flex rounded-md border bg-muted p-0.5">
// //           <Button
// //             type="button"
// //             variant={identifierMode === "auto_barcode" ? "default" : "ghost"}
// //             onClick={() => handleIdentifierModeChange("auto_barcode")}
// //             className={cn(
// //               "flex-1 h-8 text-xs",
// //               identifierMode === "auto_barcode" ? "shadow-sm" : ""
// //             )}
// //             disabled={isLoadingCategories || isGeneratingBarcode}
// //           >
// //             <ScanBarcode className="mr-2 h-4 w-4" />
// //             Shtrix (Avto)
// //           </Button>
// //           <Button
// //             type="button"
// //             variant={identifierMode === "manual_imei" ? "default" : "ghost"}
// //             onClick={() => handleIdentifierModeChange("manual_imei")}
// //             className={cn(
// //               "flex-1 h-8 text-xs",
// //               identifierMode === "manual_imei" ? "shadow-sm" : ""
// //             )}
// //             disabled={isLoadingCategories || isGeneratingBarcode}
// //           >
// //             <Fingerprint className="mr-2 h-4 w-4" />
// //             IMEI (Qo'lda)
// //           </Button>
// //         </div>
// //       </div>
// //     );
// //   const renderCommonFields = () => (
// //     /* ... avvalgidek, kategoriya select ham qo'shilgan ... */ <>
// //       <div className="space-y-1">
// //         <Label htmlFor="name" className="text-xs font-medium">
// //           Nomi <span className="text-destructive">*</span>
// //         </Label>
// //         <Input
// //           id="name"
// //           name="name"
// //           value={formData.name}
// //           onChange={handleChange}
// //           placeholder={
// //             initialView === "phone"
// //               ? selectedPhoneSubType === "android"
// //                 ? "Samsung A51"
// //                 : "iPhone 14 Pro"
// //               : "Chexol"
// //           }
// //         />
// //       </div>{" "}
// //       {identifierMode === "manual_imei" && initialView === "phone" ? (
// //         <div className="space-y-1">
// //           <Label htmlFor="manualImei" className="text-xs font-medium">
// //             IMEI <span className="text-destructive">*</span>
// //           </Label>
// //           <Input
// //             id="manualImei"
// //             name="manualImei"
// //             value={manualImei}
// //             onChange={(e) => setManualImei(e.target.value.toUpperCase())}
// //             placeholder="IMEI raqamini kiriting..."
// //             className="text-base font-mono h-11 px-3"
// //             maxLength={100}
// //             disabled={isLoadingCategories}
// //           />
// //           <p className="text-xs text-muted-foreground">
// //             Bir nechta IMEI ni vergul (,) bilan ajratib kiriting.
// //           </p>
// //         </div>
// //       ) : identifierMode === "auto_barcode" ? (
// //         <div className="space-y-1">
// //           <Label className="text-xs font-medium">
// //             {initialView === "phone" ? "Shtrix Kod" : "Shtrix Kod"}
// //           </Label>
// //           <div className="flex items-center gap-2">
// //             <Input
// //               id="generatedBarcodeDisplay"
// //               value={generatedBarcodeForDisplay || "Avtomatik (serverda)"}
// //               readOnly
// //               className={cn(
// //                 "bg-muted/50 cursor-default h-11 px-3 flex-grow",
// //                 !generatedBarcodeForDisplay && "italic text-muted-foreground"
// //               )}
// //             />
// //             {initialView === "phone" && (
// //               <Button
// //                 type="button"
// //                 variant="outline"
// //                 onClick={handleGenerateBarcode}
// //                 disabled={isGeneratingBarcode || isLoadingCategories}
// //                 className="h-11 shrink-0"
// //                 title="Yangi shtrix-kod generatsiya qilish"
// //               >
// //                 {isGeneratingBarcode ? (
// //                   <Loader2 className="h-4 w-4 animate-spin" />
// //                 ) : (
// //                   "Generatsiya"
// //                 )}
// //               </Button>
// //             )}
// //           </div>
// //           {initialView === "phone" && (
// //             <p className="text-xs text-muted-foreground">
// //               Server o'zi unikal shtrix-kod generatsiya qiladi.
// //             </p>
// //           )}
// //           {initialView === "accessory" && (
// //             <p className="text-xs text-muted-foreground">
// //               Aksessuarlar uchun shtrix-kod serverda avtomatik generatsiya
// //               qilinadi.
// //             </p>
// //           )}
// //         </div>
// //       ) : null}{" "}
// //       <div className="space-y-1">
// //         <Label htmlFor="purchaseDate" className="text-xs font-medium">
// //           Olingan sana
// //         </Label>
// //         <Input
// //           id="purchaseDate"
// //           name="purchaseDate"
// //           type="date"
// //           value={formData.purchaseDate}
// //           onChange={handleChange}
// //           disabled={isLoadingCategories || isGeneratingBarcode}
// //         />
// //       </div>{" "}
// //       {/* <div className="space-y-1">
// //         <Label htmlFor="categoryId" className="text-xs font-medium">
// //           Kategoriya
// //         </Label>
// //         <select
// //           id="categoryId"
// //           name="categoryId"
// //           value={formData.categoryId}
// //           onChange={handleChange}
// //           className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
// //           disabled={isLoadingCategories || isGeneratingBarcode}
// //         >
// //           <option value="">Kategoriya tanlanmagan</option>
// //           {apiCategories.map((cat) => (
// //             <option key={cat.id} value={cat.id.toString()}>
// //               {cat.name}
// //             </option>
// //           ))}
// //         </select>
// //         {isLoadingCategories && (
// //           <p className="text-xs text-muted-foreground">
// //             Kategoriyalar yuklanmoqda...
// //           </p>
// //         )}
// //         {!formData.categoryId &&
// //           !isLoadingCategories &&
// //           apiCategories.length > 0 && (
// //             <p className="text-xs text-amber-600">Kategoriya tanlanmagan.</p>
// //           )}
// //       </div> */}
// //     </>
// //   );

// //   // JSX (o'zgarishsiz)
// //   return (
// //     <Dialog open={open} onOpenChange={handleDialogClose}>
// //       <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto p-0">
// //         <div className="p-6 pt-5 sticky top-0 bg-background z-10">
// //           <DialogHeader className="mb-2">
// //             <DialogTitle className="text-xl font-semibold">
// //               {initialView === "phone"
// //                 ? "Telefon Qo'shish"
// //                 : "Aksesuar Qo'shish"}
// //             </DialogTitle>
// //             <DialogDescription className="text-sm">
// //               Yangi {initialView === "phone" ? "telefon" : "aksesuar"}{" "}
// //               ma'lumotlarini kiriting.{" "}
// //               <span className="text-destructive">*</span> majburiy.
// //             </DialogDescription>
// //           </DialogHeader>
// //         </div>
// //         {initialView === "phone" && renderPhoneSubTypeSelector()}
// //         <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3">
// //           {initialView === "phone" && renderIdentifierSelector()}
// //           {renderCommonFields()}
// //           {initialView === "phone" && (
// //             <>
// //               {" "}
// //               <div className="pt-2 mt-2 border-t">
// //                 <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
// //                   Narxlar (Telefon)
// //                 </h3>
// //                 <div className="grid grid-cols-2 gap-x-4 gap-y-3">
// //                   <div className="space-y-1">
// //                     <Label htmlFor="phonePurchasePriceUzs" className="text-xs">
// //                       Olingan (so'm)
// //                     </Label>
// //                     <Input
// //                       id="phonePurchasePriceUzs"
// //                       name="phonePurchasePriceUzs"
// //                       type="text"
// //                       inputMode="decimal"
// //                       value={formData.phonePurchasePriceUzs}
// //                       onChange={handleChange}
// //                       placeholder="0"
// //                       disabled={isLoadingCategories || isGeneratingBarcode}
// //                     />
// //                   </div>
// //                   <div className="space-y-1">
// //                     <Label htmlFor="phoneSellingPriceUzs" className="text-xs">
// //                       Sotiladigan (so'm)
// //                     </Label>
// //                     <Input
// //                       id="phoneSellingPriceUzs"
// //                       name="phoneSellingPriceUzs"
// //                       type="text"
// //                       inputMode="decimal"
// //                       value={formData.phoneSellingPriceUzs}
// //                       onChange={handleChange}
// //                       placeholder="0"
// //                       disabled={isLoadingCategories || isGeneratingBarcode}
// //                     />
// //                   </div>
// //                   <div className="space-y-1">
// //                     <Label htmlFor="phonePurchasePriceUsd" className="text-xs">
// //                       Olingan (USD)
// //                     </Label>
// //                     <Input
// //                       id="phonePurchasePriceUsd"
// //                       name="phonePurchasePriceUsd"
// //                       type="text"
// //                       inputMode="decimal"
// //                       value={formData.phonePurchasePriceUsd}
// //                       onChange={handleChange}
// //                       placeholder="0.00"
// //                       disabled={isLoadingCategories || isGeneratingBarcode}
// //                     />
// //                   </div>
// //                   <div className="space-y-1">
// //                     <Label htmlFor="phoneSellingPriceUsd" className="text-xs">
// //                       Sotiladigan (USD)
// //                     </Label>
// //                     <Input
// //                       id="phoneSellingPriceUsd"
// //                       name="phoneSellingPriceUsd"
// //                       type="text"
// //                       inputMode="decimal"
// //                       value={formData.phoneSellingPriceUsd}
// //                       onChange={handleChange}
// //                       placeholder="0.00"
// //                       disabled={isLoadingCategories || isGeneratingBarcode}
// //                     />
// //                   </div>
// //                 </div>
// //                 <p className="text-xs text-muted-foreground mt-1">
// //                   Sotiladigan narxdan kamida bittasi majburiy.
// //                 </p>
// //               </div>{" "}
// //               {selectedPhoneSubType === "android" && (
// //                 <div className="pt-2 mt-2 border-t">
// //                   <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
// //                     Qo'shimcha (Android)
// //                   </h3>
// //                   <div className="space-y-1">
// //                     <Label
// //                       htmlFor="androidCapacityRamStorage"
// //                       className="text-xs"
// //                     >
// //                       Sig'imi (RAM/Xotira)
// //                     </Label>
// //                     <Input
// //                       id="androidCapacityRamStorage"
// //                       name="androidCapacityRamStorage"
// //                       value={formData.androidCapacityRamStorage}
// //                       onChange={handleChange}
// //                       placeholder="8/256GB"
// //                       disabled={isLoadingCategories || isGeneratingBarcode}
// //                     />
// //                   </div>
// //                 </div>
// //               )}{" "}
// //               {selectedPhoneSubType === "iphone" && (
// //                 <div className="pt-2 mt-2 border-t space-y-3">
// //                   <h3 className="text-sm font-semibold mb-1 text-muted-foreground">
// //                     Qo'shimcha (iPhone)
// //                   </h3>
// //                   <div className="space-y-1">
// //                     <Label htmlFor="iphoneColor" className="text-xs">
// //                       Rangi <span className="text-destructive">*</span>
// //                     </Label>
// //                     <Input
// //                       id="iphoneColor"
// //                       name="iphoneColor"
// //                       value={formData.iphoneColor}
// //                       onChange={handleChange}
// //                       placeholder="Natural Titanium"
// //                       required={selectedPhoneSubType === "iphone"}
// //                       disabled={isLoadingCategories || isGeneratingBarcode}
// //                     />
// //                   </div>
// //                   <div className="grid grid-cols-2 gap-x-4 gap-y-3">
// //                     <div className="space-y-1">
// //                       <Label
// //                         htmlFor="iphoneCapacityStorage"
// //                         className="text-xs"
// //                       >
// //                         Sig'imi (GB) <span className="text-destructive">*</span>
// //                       </Label>
// //                       <Input
// //                         id="iphoneCapacityStorage"
// //                         name="iphoneCapacityStorage"
// //                         type="text"
// //                         inputMode="numeric"
// //                         value={formData.iphoneCapacityStorage}
// //                         onChange={handleChange}
// //                         placeholder="256"
// //                         required={selectedPhoneSubType === "iphone"}
// //                         disabled={isLoadingCategories || isGeneratingBarcode}
// //                       />
// //                     </div>
// //                     <div className="space-y-1">
// //                       <Label htmlFor="iphoneBatteryHealth" className="text-xs">
// //                         Batareya (%)
// //                       </Label>
// //                       <Input
// //                         id="iphoneBatteryHealth"
// //                         name="iphoneBatteryHealth"
// //                         type="text"
// //                         inputMode="numeric"
// //                         value={formData.iphoneBatteryHealth}
// //                         onChange={handleChange}
// //                         placeholder="85"
// //                         disabled={isLoadingCategories || isGeneratingBarcode}
// //                       />
// //                     </div>
// //                   </div>
// //                   <div className="space-y-1">
// //                     <Label htmlFor="iphoneSeriesRegion" className="text-xs">
// //                       Seriyasi (Region)
// //                     </Label>
// //                     <Input
// //                       id="iphoneSeriesRegion"
// //                       name="iphoneSeriesRegion"
// //                       value={formData.iphoneSeriesRegion}
// //                       onChange={handleChange}
// //                       placeholder="LL/A (USA)"
// //                       disabled={isLoadingCategories || isGeneratingBarcode}
// //                     />
// //                   </div>
// //                 </div>
// //               )}{" "}
// //             </>
// //           )}
// //           {initialView === "accessory" && (
// //             <div className="pt-2 mt-2 border-t space-y-3">
// //               <h3 className="text-sm font-semibold mb-1 text-muted-foreground">
// //                 Qo'shimcha (Aksesuar)
// //               </h3>
// //               <div className="space-y-1">
// //                 <Label htmlFor="accessoryPriceUzs" className="text-xs">
// //                   Narxi (so'm)
// //                 </Label>
// //                 <Input
// //                   id="accessoryPriceUzs"
// //                   name="accessoryPriceUzs"
// //                   type="text"
// //                   inputMode="decimal"
// //                   value={formData.accessoryPriceUzs}
// //                   onChange={handleChange}
// //                   placeholder="0"
// //                   disabled={isLoadingCategories || isGeneratingBarcode}
// //                 />
// //               </div>
// //               <div className="space-y-1">
// //                 <Label htmlFor="accessoryPriceUsd" className="text-xs">
// //                   Narxi (USD)
// //                 </Label>
// //                 <Input
// //                   id="accessoryPriceUsd"
// //                   name="accessoryPriceUsd"
// //                   type="text"
// //                   inputMode="decimal"
// //                   value={formData.accessoryPriceUsd}
// //                   onChange={handleChange}
// //                   placeholder="0.00"
// //                   disabled={isLoadingCategories || isGeneratingBarcode}
// //                 />
// //               </div>
// //               <p className="text-xs text-muted-foreground mt-1">
// //                 Narxdan kamida bittasi majburiy.
// //               </p>
// //               <div className="space-y-1">
// //                 <Label htmlFor="accessoryColor" className="text-xs">
// //                   Rangi
// //                 </Label>
// //                 <Input
// //                   id="accessoryColor"
// //                   name="accessoryColor"
// //                   value={formData.accessoryColor}
// //                   onChange={handleChange}
// //                   placeholder="Qora"
// //                   disabled={isLoadingCategories || isGeneratingBarcode}
// //                 />
// //               </div>
// //               <div className="space-y-1">
// //                 <Label htmlFor="accessoryDescription" className="text-xs">
// //                   Izoh
// //                 </Label>
// //                 <Textarea
// //                   id="accessoryDescription"
// //                   name="accessoryDescription"
// //                   value={formData.accessoryDescription}
// //                   onChange={handleChange}
// //                   rows={2}
// //                   placeholder="Qo'shimcha ma'lumot"
// //                   disabled={isLoadingCategories || isGeneratingBarcode}
// //                 />
// //               </div>
// //             </div>
// //           )}
// //           <DialogFooter className="pt-5 border-t mt-4 sticky bottom-0 bg-background pb-6 px-6 z-10">
// //             <Button
// //               type="button"
// //               variant="outline"
// //               onClick={handleDialogClose}
// //               disabled={isSubmitting || isGeneratingBarcode}
// //             >
// //               Bekor qilish
// //             </Button>
// //             <Button
// //               type="submit"
// //               disabled={
// //                 isSubmitting || isLoadingCategories || isGeneratingBarcode
// //               }
// //             >
// //               {isSubmitting ? (
// //                 <>
// //                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
// //                   Saqlanmoqda...
// //                 </>
// //               ) : isLoadingCategories || isGeneratingBarcode ? (
// //                 <>
// //                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
// //                   Tayyorlanmoqda...
// //                 </>
// //               ) : (
// //                 "Saqlash"
// //               )}
// //             </Button>
// //           </DialogFooter>
// //         </form>
// //       </DialogContent>
// //     </Dialog>
// //   );
// // }


// import React, { useState, useEffect, useCallback } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { toast } from "sonner";
// import axios from "axios";
// import { Loader2, ScanBarcode, Fingerprint } from "lucide-react";
// import { cn } from "@/lib/utils";

// interface ApiCategory {
//   id: number;
//   name: string;
//   description?: string;
// }

// export type DialogView = "phone" | "accessory";
// type PhoneSubType = "android" | "iphone";
// type IdentifierModeApi = "auto_barcode" | "manual_imei";

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
//   categoryId: string;
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

// const API_URL_CATEGORIES =
//   "https://smartphone777.pythonanywhere.com/api/categories/";
// const API_URL_PRODUCTS =
//   "https://smartphone777.pythonanywhere.com/api/products/"; // Bitta URL
// const API_URL_GENERATE_BARCODE =
//   "https://smartphone777.pythonanywhere.com/api/products/generate-barcode/";

// export function AddProductDialog({
//   open,
//   onOpenChange,
//   onAddProduct,
//   initialView,
// }: AddProductDialogProps) {
//   const [formData, setFormData] = useState<FormData>(initialFormData);
//   const [selectedPhoneSubType, setSelectedPhoneSubType] =
//     useState<PhoneSubType>("android");
//   const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);
//   const [isLoadingCategories, setIsLoadingCategories] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isGeneratingBarcode, setIsGeneratingBarcode] = useState(false);

//   const [identifierMode, setIdentifierMode] =
//     useState<IdentifierModeApi>("auto_barcode");
//   const [manualImei, setManualImei] = useState<string>("");
//   const [generatedBarcodeForDisplay, setGeneratedBarcodeForDisplay] =
//     useState<string>("");

//   const getTargetCategoryName = useCallback(
//     (view: DialogView, subType?: PhoneSubType): string => {
//       if (view === "phone") {
//         return subType === "android" ? "Android" : "iPhone";
//       } else if (view === "accessory") {
//         return "accessory";
//       }
//       return "";
//     },
//     []
//   );

//   const findCategoryIdFromApi = useCallback(
//     (targetCategoryName: string, categories: ApiCategory[]): string => {
//       if (categories.length === 0 || !targetCategoryName) return "";
//       const category = categories.find((cat) => {
//         const catNameLower = cat.name.toLowerCase().trim();
//         const targetLower = targetCategoryName.toLowerCase().trim();
//         return (
//           catNameLower.includes(targetLower) ||
//           (targetLower.includes("iphone") && catNameLower.includes("iphone")) ||
//           (targetLower.includes("android") &&
//             catNameLower.includes("android")) ||
//           ((targetLower.includes("accessory") ||
//             targetLower.includes("aksesuar")) &&
//             (catNameLower.includes("accessory") ||
//               catNameLower.includes("aksesuar")))
//         );
//       });
//       return category ? category.id.toString() : "";
//     },
//     []
//   );

//   useEffect(() => {
//     if (open) {
//       setFormData({
//         ...initialFormData,
//         purchaseDate: new Date().toISOString().split("T")[0],
//       });
//       setManualImei("");
//       setGeneratedBarcodeForDisplay("");
//       setSelectedPhoneSubType(initialView === "phone" ? "android" : "android");
//       setIdentifierMode(
//         initialView === "accessory" ? "auto_barcode" : "auto_barcode"
//       );
//     }
//   }, [open, initialView]);

//   useEffect(() => {
//     if (!open) return;
//     const fetchAndSetCategory = async () => {
//       setIsLoadingCategories(true);
//       try {
//         const token = localStorage.getItem("accessToken");
//         if (!token) {
//           toast.error("Avtorizatsiya tokeni topilmadi.");
//           setIsLoadingCategories(false);
//           return;
//         }
//         const response = await axios.get(API_URL_CATEGORIES, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const categoriesData = Array.isArray(response.data)
//           ? response.data
//           : (response.data as any).results || [];
//         setApiCategories(
//           categoriesData.filter(
//             (cat: any) => cat.name && cat.id
//           ) as ApiCategory[]
//         );
//         const targetCatName = getTargetCategoryName(
//           initialView,
//           initialView === "phone" ? selectedPhoneSubType : undefined
//         );
//         setFormData((prev) => ({
//           ...prev,
//           categoryId: findCategoryIdFromApi(targetCatName, categoriesData),
//         }));
//       } catch (error: any) {
//         toast.error(
//           "Kategoriyalarni olishda xatolik: " +
//             (error.response?.data?.detail || error.message)
//         );
//       } finally {
//         setIsLoadingCategories(false);
//       }
//     };
//     fetchAndSetCategory();
//   }, [
//     open,
//     initialView,
//     selectedPhoneSubType,
//     getTargetCategoryName,
//     findCategoryIdFromApi,
//   ]);

//   const handleDialogClose = () => {
//     if (isSubmitting || isGeneratingBarcode) return;
//     onOpenChange(false);
//   };

//   const handleGenerateBarcode = async () => {
//     setIsGeneratingBarcode(true);
//     try {
//       const token = localStorage.getItem("accessToken");
//       if (!token) {
//         toast.error("Avtorizatsiya tokeni yo'q.");
//         return;
//       }
//       const params: any = {};
//       if (formData.categoryId) params.category_id = formData.categoryId;
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
//       identifierMode === "manual_imei" &&
//       !manualImei.trim()
//     ) {
//       toast.error("Telefon uchun IMEI raqami kiritilishi shart.");
//       return;
//     }

//     const nameLower = formData.name.toLowerCase().trim();
//     let targetCatNameSubmit =
//       initialView === "phone"
//         ? nameLower.includes("iphone")
//           ? "iPhone"
//           : "Android"
//         : "accessory";
//     const dynamicCategoryId = findCategoryIdFromApi(
//       targetCatNameSubmit,
//       apiCategories
//     );
//     let finalCategoryId = formData.categoryId;
//     if (dynamicCategoryId && !finalCategoryId)
//       finalCategoryId = dynamicCategoryId;
//     if (!finalCategoryId && initialView === "accessory") {
//       const accId = findCategoryIdFromApi("accessory", apiCategories);
//       if (accId) finalCategoryId = accId;
//     }

//     setIsSubmitting(true);
//     let productPayload: any = {
//       name: formData.name.trim(),
//       category: finalCategoryId ? Number(finalCategoryId) : null,
//       identifier_type: identifierMode,
//       barcode: null,
//       purchase_date: formData.purchaseDate || null,
//       is_active: true,
//     };
//     if (identifierMode === "manual_imei")
//       productPayload.barcode = manualImei.trim().toUpperCase();
//     else if (identifierMode === "auto_barcode") productPayload.barcode = null;

//     let hasSellingPrice = false;
//     const p_uzs = formData.phoneSellingPriceUzs || formData.accessoryPriceUzs;
//     const p_usd = formData.phoneSellingPriceUsd || formData.accessoryPriceUsd;
//     if (p_uzs) productPayload.price_uzs = p_uzs;
//     if (p_usd) productPayload.price_usd = p_usd;
//     if (formData.phonePurchasePriceUzs)
//       productPayload.purchase_price_uzs = formData.phonePurchasePriceUzs;
//     if (formData.phonePurchasePriceUsd)
//       productPayload.purchase_price_usd = formData.phonePurchasePriceUsd;
//     if (productPayload.price_uzs || productPayload.price_usd)
//       hasSellingPrice = true;
//     if (!hasSellingPrice) {
//       toast.error(
//         "Kamida bitta sotish narxi (UZS yoki USD) kiritilishi shart."
//       );
//       setIsSubmitting(false);
//       return;
//     }

//     if (initialView === "phone") {
//       if (selectedPhoneSubType === "android") {
//         if (formData.androidCapacityRamStorage.trim())
//           productPayload.storage_capacity =
//             formData.androidCapacityRamStorage.trim();
//       } else {
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
//         if (formData.iphoneBatteryHealth)
//           productPayload.battery_health = Number(formData.iphoneBatteryHealth);
//         if (formData.iphoneSeriesRegion.trim())
//           productPayload.series_region = formData.iphoneSeriesRegion.trim();
//       }
//     } else {
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
//       }); // Bitta API_URL_PRODUCTS ishlatiladi
//       toast.success(`Mahsulot muvaffaqiyatli qo‘shildi!`);
//       onAddProduct(response.data as Product);
//       handleDialogClose();
//     } catch (error: any) {
//       let errMsg = `Mahsulot qo‘shishda xatolik: `;
//       if (error.response?.data && typeof error.response.data === "object") {
//         const data = error.response.data;
//         if (data.barcode && Array.isArray(data.barcode))
//           errMsg += `Identifikator: ${data.barcode.join(", ")}. `;
//         else if (data.identifier_type && Array.isArray(data.identifier_type))
//           errMsg += `Identifikator turi: ${data.identifier_type.join(", ")}. `;
//         else if (data.name && Array.isArray(data.name))
//           errMsg += `Nom: ${data.name.join(", ")}. `;
//         else if (data.category && Array.isArray(data.category))
//           errMsg += `Kategoriya: ${data.category.join(", ")}. `;
//         else if (data.non_field_errors && Array.isArray(data.non_field_errors))
//           errMsg += data.non_field_errors.join(" ");
//         else {
//           let other = "";
//           for (const k in data)
//             if (
//               ![
//                 "barcode",
//                 "identifier_type",
//                 "name",
//                 "category",
//                 "non_field_errors",
//               ].includes(k)
//             )
//               other += `${k}: ${
//                 Array.isArray(data[k]) ? data[k].join(", ") : data[k]
//               }. `;
//           if (other) errMsg += other;
//           else if (errMsg.endsWith(": "))
//             errMsg += data.detail || "Noma'lum server xatosi.";
//         }
//       } else
//         errMsg +=
//           error.response?.data?.detail || error.message || "Noma'lum xatolik.";
//       toast.error(errMsg.trim(), { duration: 8000 });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
//   ) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };
//   const handlePhoneSubTypeChange = (subType: PhoneSubType) =>
//     setSelectedPhoneSubType(subType);
//   const handleIdentifierModeChange = (mode: IdentifierModeApi) => {
//     setIdentifierMode(mode);
//     setGeneratedBarcodeForDisplay("");
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
//         <Label className="text-xs font-medium mb-1 block">
//           Identifikator Turi
//         </Label>
//         <div className="flex rounded-md border bg-muted p-0.5">
//           <Button
//             type="button"
//             variant={identifierMode === "auto_barcode" ? "default" : "ghost"}
//             onClick={() => handleIdentifierModeChange("auto_barcode")}
//             className={cn(
//               "flex-1 h-8 text-xs",
//               identifierMode === "auto_barcode" ? "shadow-sm" : ""
//             )}
//             disabled={isLoadingCategories || isGeneratingBarcode}
//           >
//             <ScanBarcode className="mr-2 h-4 w-4" />
//             Shtrix (Avto)
//           </Button>
//           <Button
//             type="button"
//             variant={identifierMode === "manual_imei" ? "default" : "ghost"}
//             onClick={() => handleIdentifierModeChange("manual_imei")}
//             className={cn(
//               "flex-1 h-8 text-xs",
//               identifierMode === "manual_imei" ? "shadow-sm" : ""
//             )}
//             disabled={isLoadingCategories || isGeneratingBarcode}
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
//       </div>{" "}
//       {identifierMode === "manual_imei" && initialView === "phone" ? (
//         <div className="space-y-1">
//           <Label htmlFor="manualImei" className="text-xs font-medium">
//             IMEI <span className="text-destructive">*</span>
//           </Label>
//           <Input
//             id="manualImei"
//             name="manualImei"
//             value={manualImei}
//             onChange={(e) => setManualImei(e.target.value.toUpperCase())}
//             placeholder="IMEI raqamini kiriting..."
//             className="text-base font-mono h-11 px-3"
//             maxLength={100}
//             disabled={isLoadingCategories}
//           />
//           <p className="text-xs text-muted-foreground">
//             Bir nechta IMEI ni vergul (,) bilan ajratib kiriting.
//           </p>
//         </div>
//       ) : identifierMode === "auto_barcode" ? (
//         <div className="space-y-1">
//           <Label className="text-xs font-medium">
//             {initialView === "phone" ? "Shtrix Kod" : "Shtrix Kod"}
//           </Label>
//           <div className="flex items-center gap-2">
//             <Input
//               id="generatedBarcodeDisplay"
//               value={generatedBarcodeForDisplay || "Avtomatik (serverda)"}
//               readOnly
//               className={cn(
//                 "bg-muted/50 cursor-default h-11 px-3 flex-grow",
//                 !generatedBarcodeForDisplay && "italic text-muted-foreground"
//               )}
//             />
//             {initialView === "phone" && (
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={handleGenerateBarcode}
//                 disabled={isGeneratingBarcode || isLoadingCategories}
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
//           {initialView === "phone" && (
//             <p className="text-xs text-muted-foreground">
//               Server o'zi unikal shtrix-kod generatsiya qiladi.
//             </p>
//           )}
//           {initialView === "accessory" && (
//             <p className="text-xs text-muted-foreground">
//               Aksessuarlar uchun shtrix-kod serverda avtomatik generatsiya
//               qilinadi.
//             </p>
//           )}
//         </div>
//       ) : null}{" "}
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
//           disabled={isLoadingCategories || isGeneratingBarcode}
//         />
//       </div>
//     </>
//   );

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
//               {" "}
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
//                       disabled={isLoadingCategories || isGeneratingBarcode}
//                     />
//                   </div>
//                   <div className="space-y-1">
//                     <Label htmlFor="phoneSellingPriceUzs" className="text-xs">
//                       Sotiladigan (so'm)
//                     </Label>
//                     <Input
//                       id="phoneSellingPriceUzs"
//                       name="phoneSellingPriceUzs"
//                       type="text"
//                       inputMode="decimal"
//                       value={formData.phoneSellingPriceUzs}
//                       onChange={handleChange}
//                       placeholder="0"
//                       disabled={isLoadingCategories || isGeneratingBarcode}
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
//                       disabled={isLoadingCategories || isGeneratingBarcode}
//                     />
//                   </div>
//                   <div className="space-y-1">
//                     <Label htmlFor="phoneSellingPriceUsd" className="text-xs">
//                       Sotiladigan (USD)
//                     </Label>
//                     <Input
//                       id="phoneSellingPriceUsd"
//                       name="phoneSellingPriceUsd"
//                       type="text"
//                       inputMode="decimal"
//                       value={formData.phoneSellingPriceUsd}
//                       onChange={handleChange}
//                       placeholder="0.00"
//                       disabled={isLoadingCategories || isGeneratingBarcode}
//                     />
//                   </div>
//                 </div>
//                 <p className="text-xs text-muted-foreground mt-1">
//                   Sotiladigan narxdan kamida bittasi majburiy.
//                 </p>
//               </div>{" "}
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
//                       disabled={isLoadingCategories || isGeneratingBarcode}
//                     />
//                   </div>
//                 </div>
//               )}{" "}
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
//                       disabled={isLoadingCategories || isGeneratingBarcode}
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
//                         disabled={isLoadingCategories || isGeneratingBarcode}
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
//                         disabled={isLoadingCategories || isGeneratingBarcode}
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
//                       disabled={isLoadingCategories || isGeneratingBarcode}
//                     />
//                   </div>
//                 </div>
//               )}{" "}
//             </>
//           )}
//           {initialView === "accessory" && (
//             <div className="pt-2 mt-2 border-t space-y-3">
//               <h3 className="text-sm font-semibold mb-1 text-muted-foreground">
//                 Qo'shimcha (Aksesuar)
//               </h3>
//               <div className="space-y-1">
//                 <Label htmlFor="accessoryPriceUzs" className="text-xs">
//                   Narxi (so'm)
//                 </Label>
//                 <Input
//                   id="accessoryPriceUzs"
//                   name="accessoryPriceUzs"
//                   type="text"
//                   inputMode="decimal"
//                   value={formData.accessoryPriceUzs}
//                   onChange={handleChange}
//                   placeholder="0"
//                   disabled={isLoadingCategories || isGeneratingBarcode}
//                 />
//               </div>
//               <div className="space-y-1">
//                 <Label htmlFor="accessoryPriceUsd" className="text-xs">
//                   Narxi (USD)
//                 </Label>
//                 <Input
//                   id="accessoryPriceUsd"
//                   name="accessoryPriceUsd"
//                   type="text"
//                   inputMode="decimal"
//                   value={formData.accessoryPriceUsd}
//                   onChange={handleChange}
//                   placeholder="0.00"
//                   disabled={isLoadingCategories || isGeneratingBarcode}
//                 />
//               </div>
//               <p className="text-xs text-muted-foreground mt-1">
//                 Narxdan kamida bittasi majburiy.
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
//                   disabled={isLoadingCategories || isGeneratingBarcode}
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
//                   disabled={isLoadingCategories || isGeneratingBarcode}
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
//                 isSubmitting || isLoadingCategories || isGeneratingBarcode
//               }
//             >
//               {isSubmitting ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Saqlanmoqda...
//                 </>
//               ) : isLoadingCategories || isGeneratingBarcode ? (
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axios from "axios";
import { Loader2, ScanBarcode, Fingerprint } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApiCategory {
  id: number;
  name: string;
  description?: string;
}

export type DialogView = "phone" | "accessory";
type PhoneSubType = "android" | "iphone";
type IdentifierModeApi = "auto_barcode" | "manual_imei";

interface Product { // Bu tipni global (masalan, src/types/index.ts) faylga chiqarish yaxshi amaliyot
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
  categoryId: string; // Bu endi avtomatik aniqlanadi, lekin forma state'ida qolishi mumkin
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

const API_URL_CATEGORIES =
  "https://smartphone777.pythonanywhere.com/api/categories/";
const API_URL_PRODUCTS =
  "https://smartphone777.pythonanywhere.com/api/products/"; 
const API_URL_GENERATE_BARCODE =
  "https://smartphone777.pythonanywhere.com/api/products/generate-barcode/";

export function AddProductDialog({
  open,
  onOpenChange,
  onAddProduct,
  initialView,
}: AddProductDialogProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [selectedPhoneSubType, setSelectedPhoneSubType] =
    useState<PhoneSubType>("android");
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingBarcode, setIsGeneratingBarcode] = useState(false);

  const [identifierMode, setIdentifierMode] =
    useState<IdentifierModeApi>("auto_barcode");
  const [manualImei, setManualImei] = useState<string>("");
  const [generatedBarcodeForDisplay, setGeneratedBarcodeForDisplay] =
    useState<string>("");

  const getTargetCategoryName = useCallback(
    (view: DialogView, subType?: PhoneSubType): string => {
      if (view === "phone") {
        return subType === "android" ? "Android" : "iPhone";
      } else if (view === "accessory") {
        return "accessory"; // yoki "Aksesuar"
      }
      return "";
    },
    []
  );

  const findCategoryIdFromApi = useCallback(
    (targetCategoryName: string, categories: ApiCategory[]): string => {
      if (categories.length === 0 || !targetCategoryName) return "";
      const targetLower = targetCategoryName.toLowerCase().trim();
      const category = categories.find((cat) => {
        const catNameLower = cat.name.toLowerCase().trim();
        
        if (targetLower.includes("iphone") && catNameLower.includes("iphone")) return true;
        if (targetLower.includes("android") && catNameLower.includes("android") && !catNameLower.includes("iphone")) return true;
        if ((targetLower.includes("accessory") || targetLower.includes("aksesuar")) && (catNameLower.includes("accessory") || catNameLower.includes("aksesuar"))) return true;
        
        return catNameLower === targetLower; // To'liq moslikni ham tekshirish
      });
      return category ? category.id.toString() : "";
    },
    []
  );

  useEffect(() => {
    if (open) {
      setFormData({
        ...initialFormData,
        purchaseDate: new Date().toISOString().split("T")[0],
      });
      setManualImei("");
      setGeneratedBarcodeForDisplay("");
      setSelectedPhoneSubType(initialView === "phone" ? "android" : "android"); // Aksessuar uchun ham default
      setIdentifierMode(
        initialView === "accessory" ? "auto_barcode" : "auto_barcode"
      );
    }
  }, [open, initialView]);

  useEffect(() => {
    if (!open) return;
    const fetchAndSetCategory = async () => {
      setIsLoadingCategories(true);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          toast.error("Avtorizatsiya tokeni topilmadi.");
          setIsLoadingCategories(false);
          return;
        }
        const response = await axios.get(API_URL_CATEGORIES, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const categoriesData = Array.isArray(response.data)
          ? response.data
          : (response.data as any).results || [];
        const validCategories = categoriesData.filter(
            (cat: any) => cat.name && cat.id
          ) as ApiCategory[];
        setApiCategories(validCategories);

        // Kategoriya ID sini avtomatik aniqlash
        // Bu qism handleSubmit ichiga ko'chirilgan, chunki mahsulot nomi o'zgarishi mumkin
        // va kategoriya shunga qarab aniqlanishi kerak.
        // Forma ochilganda, categoryId bo'sh qoladi va handleSubmitda aniqlanadi.

      } catch (error: any) {
        toast.error(
          "Kategoriyalarni olishda xatolik: " +
            (error.response?.data?.detail || error.message)
        );
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchAndSetCategory();
  }, [open]); // Bu yerdan initialView, selectedPhoneSubType bog'liqliklari olib tashlandi

  const handleDialogClose = () => {
    if (isSubmitting || isGeneratingBarcode) return;
    onOpenChange(false);
  };

  const handleGenerateBarcode = async () => {
    setIsGeneratingBarcode(true);
    let categoryIdForBarcode = formData.categoryId;
    if (!categoryIdForBarcode) { // Agar formadagi categoryId bo'sh bo'lsa, avtomatik aniqlashga urinish
        const nameLower = formData.name.toLowerCase().trim();
        const targetCatName = initialView === 'phone' 
            ? (selectedPhoneSubType === 'iphone' || nameLower.includes("iphone") ? "iPhone" : "Android") 
            : "accessory";
        categoryIdForBarcode = findCategoryIdFromApi(targetCatName, apiCategories);
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Avtorizatsiya tokeni yo'q.");
        return;
      }
      const params: any = {};
      if (categoryIdForBarcode) params.category_id = categoryIdForBarcode;
      
      const response = await axios.get<{ barcode: string }>(
        API_URL_GENERATE_BARCODE,
        { headers: { Authorization: `Bearer ${token}` }, params }
      );
      setGeneratedBarcodeForDisplay(response.data.barcode);
      toast.success("Yangi shtrix-kod generatsiya qilindi!");
    } catch (error: any) {
      toast.error(
        "Shtrix-kod generatsiya qilishda xatolik: " +
          (error.response?.data?.detail || error.message)
      );
      setGeneratedBarcodeForDisplay("");
    } finally {
      setIsGeneratingBarcode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Mahsulot nomi kiritilishi shart.");
      return;
    }
    if (
      initialView === "phone" &&
      identifierMode === "manual_imei" &&
      !manualImei.trim()
    ) {
      toast.error("Telefon uchun IMEI raqami kiritilishi shart.");
      return;
    }

    // Kategoriya ID sini yakuniy aniqlash
    const nameLower = formData.name.toLowerCase().trim();
    let targetCatNameSubmit = initialView === "phone"
        ? (selectedPhoneSubType === 'iphone' || nameLower.includes("iphone") ? "iPhone" : "Android")
        : "accessory";
    
    let finalCategoryId = findCategoryIdFromApi(targetCatNameSubmit, apiCategories);

    if (!finalCategoryId) {
        toast.warn(`"${targetCatNameSubmit}" uchun mos kategoriya topilmadi. Umumiy kategoriya ishlatilishi mumkin yoki xatolik yuz berishi mumkin.`);
        // Agar umuman kategoriya topilmasa, null yuborish yoki xato chiqarish mumkin
    }


    setIsSubmitting(true);
    let productPayload: any = {
      name: formData.name.trim(),
      category: finalCategoryId ? Number(finalCategoryId) : null,
      identifier_type: identifierMode,
      barcode: null, 
      purchase_date: formData.purchaseDate || null,
      is_active: true,
    };

    if (identifierMode === "manual_imei" && initialView === "phone") {
      productPayload.barcode = manualImei.trim().toUpperCase();
    } else if (identifierMode === "auto_barcode" && generatedBarcodeForDisplay) {
      // Agar shtrix-kod generatsiya qilingan bo'lsa, o'shani ishlatamiz
      productPayload.barcode = generatedBarcodeForDisplay;
    } // Agar auto_barcode va generatsiya qilinmagan bo'lsa, backend o'zi yaratadi (barcode: null)

    let hasSellingPrice = false;
    const p_uzs = formData.phoneSellingPriceUzs || formData.accessoryPriceUzs;
    const p_usd = formData.phoneSellingPriceUsd || formData.accessoryPriceUsd;
    if (p_uzs && parseFloat(p_uzs) > 0) {
        productPayload.price_uzs = p_uzs;
        hasSellingPrice = true;
    }
    if (p_usd && parseFloat(p_usd) > 0) {
        productPayload.price_usd = p_usd;
        hasSellingPrice = true;
    }
    
    if (formData.phonePurchasePriceUzs && parseFloat(formData.phonePurchasePriceUzs) > 0)
      productPayload.purchase_price_uzs = formData.phonePurchasePriceUzs;
    if (formData.phonePurchasePriceUsd && parseFloat(formData.phonePurchasePriceUsd) > 0)
      productPayload.purchase_price_usd = formData.phonePurchasePriceUsd;
    
    if (!hasSellingPrice) {
      toast.error(
        "Kamida bitta sotish narxi (UZS yoki USD) kiritilishi shart."
      );
      setIsSubmitting(false);
      return;
    }

    if (initialView === "phone") {
      if (selectedPhoneSubType === "android" || (!nameLower.includes("iphone") && nameLower.includes("android"))) { // Android uchun
        if (formData.androidCapacityRamStorage.trim())
          productPayload.storage_capacity =
            formData.androidCapacityRamStorage.trim();
      } else { // iPhone uchun
        if (!formData.iphoneColor.trim()) {
          toast.error("iPhone uchun rang kiritilishi shart.");
          setIsSubmitting(false);
          return;
        }
        if (!formData.iphoneCapacityStorage.trim()) {
          toast.error("iPhone uchun sig‘im kiritilishi shart.");
          setIsSubmitting(false);
          return;
        }
        productPayload.color = formData.iphoneColor.trim();
        productPayload.storage_capacity = `${formData.iphoneCapacityStorage.trim()}GB`;
        if (formData.iphoneBatteryHealth && !isNaN(parseFloat(formData.iphoneBatteryHealth)))
          productPayload.battery_health = Number(formData.iphoneBatteryHealth);
        if (formData.iphoneSeriesRegion.trim())
          productPayload.series_region = formData.iphoneSeriesRegion.trim();
      }
    } else { // Aksessuar uchun
      if (formData.accessoryColor.trim())
        productPayload.color = formData.accessoryColor.trim();
      if (formData.accessoryDescription.trim())
        productPayload.description = formData.accessoryDescription.trim();
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Avtorizatsiya tokeni topilmadi.");
        setIsSubmitting(false);
        return;
      }
      const response = await axios.post(API_URL_PRODUCTS, productPayload, {
        headers: { Authorization: `Bearer ${token}` },
      }); 
      toast.success(`Mahsulot "${response.data.name}" muvaffaqiyatli qo‘shildi!`);
      onAddProduct(response.data as Product);
      handleDialogClose();
    } catch (error: any) {
      let errMsg = `Mahsulot qo‘shishda xatolik: `;
      if (error.response?.data && typeof error.response.data === "object") {
        const data = error.response.data;
        // Xatoliklarni batafsilroq chiqarish
        Object.keys(data).forEach(key => {
            if (Array.isArray(data[key])) {
                errMsg += `${key}: ${data[key].join(', ')}. `;
            } else {
                errMsg += `${key}: ${data[key]}. `;
            }
        });
        if (errMsg.endsWith(': ')) { // Agar umumiy xatolik bo'lsa
             errMsg = data.detail || "Noma'lum server xatosi.";
        }

      } else {
        errMsg += error.message || "Noma'lum xatolik.";
      }
      toast.error(errMsg.trim(), { duration: 8000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Agar mahsulot nomi o'zgartirilsa va "phone" view bo'lsa, subType'ni avtomatik o'zgartirish
    if (name === "name" && initialView === "phone") {
        const nameLower = value.toLowerCase().trim();
        if (nameLower.includes("iphone")) {
            setSelectedPhoneSubType("iphone");
        } else if (selectedPhoneSubType === "iphone" && !nameLower.includes("iphone")) {
            // Agar oldin iPhone bo'lib, endi nomidan "iphone" olib tashlansa, Androidga o'tkazish
            // Bu holatda foydalanuvchi Android deb yozmasa ham, subType o'zgaradi.
            // setSelectedPhoneSubType("android"); 
            // Yoki bu logikani olib tashlash mumkin, foydalanuvchi o'zi tanlasin.
        }
    }
  };

  const handlePhoneSubTypeChange = (subType: PhoneSubType) => {
    setSelectedPhoneSubType(subType);
    // Agar subType o'zgartirilsa, categoryId ni ham qayta aniqlashga harakat qilish mumkin,
    // lekin hozircha bu handleSubmitda qilingani ma'qulroq.
  };

  const handleIdentifierModeChange = (mode: IdentifierModeApi) => {
    setIdentifierMode(mode);
    setGeneratedBarcodeForDisplay(""); // Identifikator turi o'zgarganda generatsiya qilingan shtrixni tozalash
    if (mode === "manual_imei") {
        setManualImei(""); // IMEI rejimiga o'tganda eski IMEI ni tozalash
    }
  };

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
      >
        iPhone
      </Button>
    </div>
  );

  const renderIdentifierSelector = () =>
    initialView !== "phone" ? null : (
      <div className="mb-3">
        <Label className="text-xs font-medium mb-1 block">
          Identifikator Turi
        </Label>
        <div className="flex rounded-md border bg-muted p-0.5">
          <Button
            type="button"
            variant={identifierMode === "auto_barcode" ? "default" : "ghost"}
            onClick={() => handleIdentifierModeChange("auto_barcode")}
            className={cn(
              "flex-1 h-8 text-xs",
              identifierMode === "auto_barcode" ? "shadow-sm" : ""
            )}
            disabled={isLoadingCategories || isGeneratingBarcode}
          >
            <ScanBarcode className="mr-2 h-4 w-4" />
            Shtrix (Avto)
          </Button>
          <Button
            type="button"
            variant={identifierMode === "manual_imei" ? "default" : "ghost"}
            onClick={() => handleIdentifierModeChange("manual_imei")}
            className={cn(
              "flex-1 h-8 text-xs",
              identifierMode === "manual_imei" ? "shadow-sm" : ""
            )}
            disabled={isLoadingCategories || isGeneratingBarcode}
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
                ? "Samsung A51"
                : "iPhone 14 Pro"
              : "Chexol"
          }
        />
      </div>
      {initialView === "phone" && identifierMode === "manual_imei" && (
        <div className="space-y-1">
          <Label htmlFor="manualImei" className="text-xs font-medium">
            IMEI <span className="text-destructive">*</span>
          </Label>
          <Input
            id="manualImei"
            name="manualImei"
            value={manualImei}
            onChange={(e) => setManualImei(e.target.value.toUpperCase())}
            placeholder="IMEI raqamini kiriting..."
            className="text-base font-mono h-11 px-3"
            maxLength={100} // Bir nechta IMEI uchun yetarli
            disabled={isLoadingCategories}
          />
          <p className="text-xs text-muted-foreground">
            Bir nechta IMEI ni vergul (,) bilan ajratib kiriting.
          </p>
        </div>
      )}
      {(initialView === "phone" && identifierMode === "auto_barcode") || initialView === "accessory" ? (
        // Aksessuarlar uchun ham shtrix-kod maydoni (agar generatsiya qilinadigan bo'lsa)
        <div className="space-y-1">
          <Label className="text-xs font-medium">Shtrix Kod</Label>
          <div className="flex items-center gap-2">
            <Input
              id="generatedBarcodeDisplay"
              value={generatedBarcodeForDisplay || (identifierMode === "auto_barcode" ? "Avtomatik (serverda saqlashda)" : "Shtrix-kod kiritilmagan")}
              readOnly
              className={cn(
                "bg-muted/50 cursor-default h-11 px-3 flex-grow",
                !generatedBarcodeForDisplay && identifierMode === "auto_barcode" && "italic text-muted-foreground"
              )}
            />
            {/* Faqat telefonlar uchun va avto_barcode rejimida generatsiya tugmasi */}
            {initialView === "phone" && identifierMode === "auto_barcode" && ( 
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateBarcode}
                disabled={isGeneratingBarcode || isLoadingCategories}
                className="h-11 shrink-0"
                title="Yangi shtrix-kod generatsiya qilish"
              >
                {isGeneratingBarcode ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Generatsiya"
                )}
              </Button>
            )}
          </div>
          {identifierMode === "auto_barcode" && (
             <p className="text-xs text-muted-foreground">
                {initialView === "phone" 
                  ? "Server o'zi unikal shtrix-kod generatsiya qiladi yoki yuqorida generatsiya qilinganini ishlatadi."
                  : "Aksessuarlar uchun shtrix-kod serverda avtomatik generatsiya qilinadi."}
            </p>
          )}
        </div>
      ) : null}
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
          disabled={isLoadingCategories || isGeneratingBarcode}
        />
      </div>
      {/* Kategoriya tanlash select elementi olib tashlandi, chunki avtomatik aniqlanadi */}
    </>
  );

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6 pt-5 sticky top-0 bg-background z-10">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl font-semibold">
              {initialView === "phone"
                ? "Telefon Qo'shish"
                : "Aksesuar Qo'shish"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Yangi {initialView === "phone" ? "telefon" : "aksesuar"}{" "}
              ma'lumotlarini kiriting.{" "}
              <span className="text-destructive">*</span> majburiy.
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
                      Olingan (so'm)
                    </Label>
                    <Input
                      id="phonePurchasePriceUzs"
                      name="phonePurchasePriceUzs"
                      type="text"
                      inputMode="decimal"
                      value={formData.phonePurchasePriceUzs}
                      onChange={handleChange}
                      placeholder="0"
                      disabled={isLoadingCategories || isGeneratingBarcode}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phoneSellingPriceUzs" className="text-xs">
                      Sotiladigan (so'm) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phoneSellingPriceUzs"
                      name="phoneSellingPriceUzs"
                      type="text"
                      inputMode="decimal"
                      value={formData.phoneSellingPriceUzs}
                      onChange={handleChange}
                      placeholder="0"
                      disabled={isLoadingCategories || isGeneratingBarcode}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phonePurchasePriceUsd" className="text-xs">
                      Olingan (USD)
                    </Label>
                    <Input
                      id="phonePurchasePriceUsd"
                      name="phonePurchasePriceUsd"
                      type="text"
                      inputMode="decimal"
                      value={formData.phonePurchasePriceUsd}
                      onChange={handleChange}
                      placeholder="0.00"
                      disabled={isLoadingCategories || isGeneratingBarcode}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phoneSellingPriceUsd" className="text-xs">
                      Sotiladigan (USD) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phoneSellingPriceUsd"
                      name="phoneSellingPriceUsd"
                      type="text"
                      inputMode="decimal"
                      value={formData.phoneSellingPriceUsd}
                      onChange={handleChange}
                      placeholder="0.00"
                      disabled={isLoadingCategories || isGeneratingBarcode}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Sotiladigan narxdan kamida bittasi majburiy.
                </p>
              </div>
              {selectedPhoneSubType === "android" && (
                <div className="pt-2 mt-2 border-t">
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                    Qo'shimcha (Android)
                  </h3>
                  <div className="space-y-1">
                    <Label
                      htmlFor="androidCapacityRamStorage"
                      className="text-xs"
                    >
                      Sig'imi (RAM/Xotira)
                    </Label>
                    <Input
                      id="androidCapacityRamStorage"
                      name="androidCapacityRamStorage"
                      value={formData.androidCapacityRamStorage}
                      onChange={handleChange}
                      placeholder="8/256GB"
                      disabled={isLoadingCategories || isGeneratingBarcode}
                    />
                  </div>
                </div>
              )}
              {selectedPhoneSubType === "iphone" && (
                <div className="pt-2 mt-2 border-t space-y-3">
                  <h3 className="text-sm font-semibold mb-1 text-muted-foreground">
                    Qo'shimcha (iPhone)
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
                      placeholder="Natural Titanium"
                      required={selectedPhoneSubType === "iphone"}
                      disabled={isLoadingCategories || isGeneratingBarcode}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div className="space-y-1">
                      <Label
                        htmlFor="iphoneCapacityStorage"
                        className="text-xs"
                      >
                        Sig'imi (GB) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="iphoneCapacityStorage"
                        name="iphoneCapacityStorage"
                        type="text"
                        inputMode="numeric"
                        value={formData.iphoneCapacityStorage}
                        onChange={handleChange}
                        placeholder="256"
                        required={selectedPhoneSubType === "iphone"}
                        disabled={isLoadingCategories || isGeneratingBarcode}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="iphoneBatteryHealth" className="text-xs">
                        Batareya (%)
                      </Label>
                      <Input
                        id="iphoneBatteryHealth"
                        name="iphoneBatteryHealth"
                        type="text"
                        inputMode="numeric"
                        value={formData.iphoneBatteryHealth}
                        onChange={handleChange}
                        placeholder="85"
                        disabled={isLoadingCategories || isGeneratingBarcode}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="iphoneSeriesRegion" className="text-xs">
                      Seriyasi (Region)
                    </Label>
                    <Input
                      id="iphoneSeriesRegion"
                      name="iphoneSeriesRegion"
                      value={formData.iphoneSeriesRegion}
                      onChange={handleChange}
                      placeholder="LL/A (USA)"
                      disabled={isLoadingCategories || isGeneratingBarcode}
                    />
                  </div>
                </div>
              )}
            </>
          )}
          {initialView === "accessory" && (
            <div className="pt-2 mt-2 border-t space-y-3">
              <h3 className="text-sm font-semibold mb-1 text-muted-foreground">
                Qo'shimcha (Aksesuar)
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
                  placeholder="0"
                  disabled={isLoadingCategories || isGeneratingBarcode}
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
                  placeholder="0.00"
                  disabled={isLoadingCategories || isGeneratingBarcode}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Narxdan kamida bittasi majburiy.
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
                  placeholder="Qora"
                  disabled={isLoadingCategories || isGeneratingBarcode}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="accessoryDescription" className="text-xs">
                  Izoh
                </Label>
                <Textarea
                  id="accessoryDescription"
                  name="accessoryDescription"
                  value={formData.accessoryDescription}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Qo'shimcha ma'lumot"
                  disabled={isLoadingCategories || isGeneratingBarcode}
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
                isSubmitting || isLoadingCategories || isGeneratingBarcode
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saqlanmoqda...
                </>
              ) : isLoadingCategories || isGeneratingBarcode ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Tayyorlanmoqda...
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