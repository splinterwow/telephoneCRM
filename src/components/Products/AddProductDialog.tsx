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
// import { Loader2 } from "lucide-react";
// import { cn } from "@/lib/utils";

// interface ApiCategory {
//   id: number;
//   name: string;
//   description?: string;
//   barcode_prefix: string;
// }

// export type DialogView = 'phone' | 'accessory';
// type PhoneSubType = 'android' | 'iphone';

// interface Product {
//   id: number;
//   name: string;
//   category: number;
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
//   barcode: string;
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

// const generateBarcode = (categoryPrefix: string): string => {
//   const prefix = categoryPrefix || "3"; // Default aksessuar prefiksi
//   const timestamp = Date.now().toString().slice(-6);
//   const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
//   return `${prefix}${timestamp}${randomSuffix}`.slice(0, 12).toUpperCase();
// };

// const initialFormData: FormData = {
//   name: "",
//   barcode: "",
//   purchaseDate: new Date().toISOString().split('T')[0],
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

// export function AddProductDialog({
//   open,
//   onOpenChange,
//   onAddProduct,
//   initialView,
// }: AddProductDialogProps) {
//   const [formData, setFormData] = useState<FormData>(initialFormData);
//   const [selectedPhoneSubType, setSelectedPhoneSubType] = useState<PhoneSubType>('android');
//   const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);
//   const [isLoadingCategories, setIsLoadingCategories] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const getTargetCategoryName = useCallback((view: DialogView, subType?: PhoneSubType): string => {
//     if (view === 'phone') {
//       return subType === 'android' ? "Android" : "iPhone";
//     } else if (view === 'accessory') {
//       return "accessory";
//     }
//     return "";
//   }, []);

//   const findCategoryIdFromApi = useCallback((targetCategoryName: string, categories: ApiCategory[]): { id: string, prefix: string } => {
//     if (categories.length === 0 || !targetCategoryName) return { id: "", prefix: "3" }; // Default aksessuar prefiksi
//     const category = categories.find(cat => {
//       const catNameLower = cat.name.toLowerCase().trim();
//       const targetLower = targetCategoryName.toLowerCase().trim();
//       return (
//         catNameLower.includes(targetLower) ||
//         (targetLower.includes("iphone") && catNameLower.includes("iphone")) ||
//         (targetLower.includes("android") && catNameLower.includes("android")) ||
//         (targetLower.includes("accessory") || targetLower.includes("aksesuar") && catNameLower.includes("accessory"))
//       );
//     });
//     return category ? { id: category.id.toString(), prefix: category.barcode_prefix } : { id: "", prefix: "3" };
//   }, []);

//   useEffect(() => {
//     if (open) {
//       const targetCatName = getTargetCategoryName(initialView, initialView === 'phone' ? selectedPhoneSubType : undefined);
//       const { prefix } = findCategoryIdFromApi(targetCatName, apiCategories);
//       setFormData({
//         ...initialFormData,
//         barcode: generateBarcode(prefix),
//         purchaseDate: new Date().toISOString().split('T')[0],
//       });
//     }
//   }, [open, initialView, selectedPhoneSubType, getTargetCategoryName, findCategoryIdFromApi, apiCategories]);

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

//         const response = await axios.get("https://smartphone777.pythonanywhere.com/api/categories/", {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const categoriesData = Array.isArray(response.data) ? response.data : response.data.results || [];
//         const currentApiCategories = categoriesData.filter(cat => cat.name && cat.id && cat.barcode_prefix) as ApiCategory[];
//         setApiCategories(currentApiCategories);

//         const targetCatName = getTargetCategoryName(initialView, initialView === 'phone' ? selectedPhoneSubType : undefined);
//         const { id, prefix } = findCategoryIdFromApi(targetCatName, currentApiCategories);
//         setFormData(prev => ({
//           ...prev,
//           categoryId: id || "",
//           barcode: generateBarcode(prefix),
//         }));
//       } catch (error: any) {
//         toast.error("Kategoriyalarni olishda xatolik: " + (error.response?.data?.detail || error.message));
//       } finally {
//         setIsLoadingCategories(false);
//       }
//     };

//     fetchAndSetCategory();
//   }, [open, initialView, selectedPhoneSubType, getTargetCategoryName, findCategoryIdFromApi]);

//   const handleDialogClose = () => {
//     if (isSubmitting) return;
//     onOpenChange(false);
//   };

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (!formData.name.trim()) {
//       toast.error("Mahsulot nomi kiritilishi shart.");
//       return;
//     }

//     // Kategoriyani nomga asoslanib dinamik aniqlash
//     const nameLower = formData.name.toLowerCase().trim();
//     let targetCatName = "";
//     if (initialView === 'phone') {
//       targetCatName = nameLower.includes("iphone") ? "iPhone" : "Android";
//     } else {
//       targetCatName = nameLower.includes("accessory") || nameLower.includes("aksesuar") || nameLower.includes("case") || nameLower.includes("charger") ? "accessory" : "accessory";
//     }
//     const { id: dynamicCategoryId, prefix } = findCategoryIdFromApi(targetCatName, apiCategories);

//     if (!dynamicCategoryId && !isLoadingCategories) {
//       toast.error(`"${targetCatName}" kategoriyasi topilmadi. Standart aksessuar kategoriyasi ishlatildi.`);
//       setFormData(prev => ({ ...prev, categoryId: "", barcode: generateBarcode("3") }));
//       return;
//     }

//     setIsSubmitting(true);

//     let productPayload: any = {
//       name: formData.name.trim(),
//       barcode: formData.barcode,
//       category: Number(dynamicCategoryId || formData.categoryId || apiCategories[0]?.id || 1), // Agar topilmasa, birinchi kategoriyani ishlatamiz
//       purchase_date: formData.purchaseDate,
//       is_active: true,
//       price_uzs: null,
//       price_usd: null,
//       purchase_price_uzs: null,
//       purchase_price_usd: null,
//       storage_capacity: null,
//       color: null,
//       series_region: null,
//       battery_health: null,
//       description: null,
//     };

//     if (initialView === 'phone') {
//       productPayload.purchase_price_uzs = formData.phonePurchasePriceUzs ? Number(formData.phonePurchasePriceUzs) : null;
//       productPayload.price_uzs = formData.phoneSellingPriceUzs ? Number(formData.phoneSellingPriceUzs) : null;
//       productPayload.purchase_price_usd = formData.phonePurchasePriceUsd ? Number(formData.phonePurchasePriceUsd) : null;
//       productPayload.price_usd = formData.phoneSellingPriceUsd ? Number(formData.phoneSellingPriceUsd) : null;

//       if (!productPayload.price_uzs && !productPayload.price_usd && !productPayload.purchase_price_uzs && !productPayload.purchase_price_usd) {
//         toast.error("Telefon uchun kamida bitta narx kiritilishi shart (UZS yoki USD).");
//         setIsSubmitting(false);
//         return;
//       }

//       if (selectedPhoneSubType === 'android') {
//         productPayload.storage_capacity = formData.androidCapacityRamStorage.trim() || null;
//       } else {
//         if (!formData.iphoneColor.trim()) { toast.error("iPhone uchun rang kiritilishi shart."); setIsSubmitting(false); return; }
//         if (!formData.iphoneCapacityStorage.trim()) { toast.error("iPhone uchun sig‘im kiritilishi shart."); setIsSubmitting(false); return; }
//         productPayload.color = formData.iphoneColor.trim();
//         productPayload.storage_capacity = `${formData.iphoneCapacityStorage.trim()}GB`;
//         productPayload.battery_health = formData.iphoneBatteryHealth ? Number(formData.iphoneBatteryHealth) : null;
//         productPayload.series_region = formData.iphoneSeriesRegion.trim() || null;
//       }
//     } else {
//       productPayload.price_uzs = formData.accessoryPriceUzs ? Number(formData.accessoryPriceUzs) : null;
//       productPayload.price_usd = formData.accessoryPriceUsd ? Number(formData.accessoryPriceUsd) : null;
//       productPayload.color = formData.accessoryColor.trim() || null;
//       productPayload.description = formData.accessoryDescription.trim() || null;
//       if (!productPayload.price_uzs && !productPayload.price_usd) {
//         toast.error("Aksesuar uchun narx kiritilishi shart (UZS yoki USD).");
//         setIsSubmitting(false);
//         return;
//       }
//     }

//     try {
//       const token = localStorage.getItem("accessToken");
//       if (!token) { toast.error("Avtorizatsiya tokeni topilmadi."); setIsSubmitting(false); return; }

//       const response = await axios.post("https://smartphone777.pythonanywhere.com/api/products/", productPayload, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       toast.success(`${initialView === 'phone' ? (selectedPhoneSubType === 'android' ? 'Android Telefon' : 'iPhone') : 'Aksesuar'} muvaffaqiyatli qo‘shildi!`);
//       onAddProduct(response.data as Product);
//       handleDialogClose();
//     } catch (error: any) {
//       let errorMessage = `${initialView === 'phone' ? (selectedPhoneSubType === 'android' ? 'Android' : 'iPhone') : 'Aksesuar'} qo‘shishda xatolik: `;
//       if (error.response?.data && typeof error.response.data === 'object') {
//         for (const key in error.response.data) {
//           errorMessage += `${key}: ${Array.isArray(error.response.data[key]) ? error.response.data[key].join(', ') : error.response.data[key]}. `;
//         }
//       } else {
//         errorMessage += error.response?.data?.detail || error.message || "Noma'lum xatolik.";
//       }
//       toast.error(errorMessage, { duration: 7000 });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubTypeChange = (subType: PhoneSubType) => {
//     setSelectedPhoneSubType(subType);
//     const targetCatName = getTargetCategoryName('phone', subType);
//     const { id, prefix } = findCategoryIdFromApi(targetCatName, apiCategories);
//     setFormData(prev => ({
//       ...prev,
//       categoryId: id || "",
//       barcode: generateBarcode(prefix),
//     }));
//   };

//   const renderPhoneSubTypeSelector = () => (
//     <div className="flex border-b mb-4">
//       <Button
//         variant="ghost"
//         type="button"
//         className={cn(
//           "flex-1 justify-center rounded-none border-b-2 py-3 text-sm font-medium",
//           selectedPhoneSubType === 'android'
//             ? "border-primary text-primary bg-primary/10"
//             : "border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
//         )}
//         onClick={() => handleSubTypeChange('android')}
//       >
//         Android
//       </Button>
//       <Button
//         variant="ghost"
//         type="button"
//         className={cn(
//           "flex-1 justify-center rounded-none border-b-2 py-3 text-sm font-medium",
//           selectedPhoneSubType === 'iphone'
//             ? "border-primary text-primary bg-primary/10"
//             : "border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
//         )}
//         onClick={() => handleSubTypeChange('iphone')}
//       >
//         iPhone
//       </Button>
//     </div>
//   );

//   const renderCommonFields = () => (
//     <>
//       <div className="space-y-1">
//         <Label htmlFor="name" className="text-xs font-medium">Nomi <span className="text-destructive">*</span></Label>
//         <Input id="name" name="name" value={formData.name} onChange={handleChange}
//                placeholder={initialView === 'phone' ? (selectedPhoneSubType === 'android' ? "Masalan: Samsung A51" : "Masalan: iPhone 14 Pro") : "Masalan: Chexol, Zaryadchik"}/>
//       </div>
//       <div className="space-y-1">
//         <Label htmlFor="barcode" className="text-xs font-medium">Shtrix Kod</Label>
//         <Input 
//           id="barcode" 
//           name="barcode" 
//           value={formData.barcode} 
//           readOnly 
//           disabled
//           className={cn(
//             "bg-muted/50 cursor-not-allowed",
//             "text-lg font-mono h-12 px-4",
//             "border-2 border-gray-300 rounded-lg",
//             "focus:ring-0 focus:border-gray-300"
//           )} 
//         />
//       </div>
//       <div className="space-y-1">
//         <Label htmlFor="purchaseDate" className="text-xs font-medium">Olingan sana</Label>
//         <Input id="purchaseDate" name="purchaseDate" type="date" value={formData.purchaseDate} onChange={handleChange}/>
//       </div>
//     </>
//   );

//   return (
//     <Dialog open={open} onOpenChange={handleDialogClose}>
//       <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto p-0">
//         <div className="p-6 pt-5">
//           <DialogHeader className="mb-2">
//             <DialogTitle className="text-xl font-semibold">
//               {initialView === 'phone' ? 'Telefon Qo\'shish' : 'Aksesuar Qo\'shish'}
//             </DialogTitle>
//             <DialogDescription className="text-sm">
//               Yangi {initialView === 'phone' ? 'telefon' : 'aksesuar'} ma'lumotlarini kiriting.
//             </DialogDescription>
//           </DialogHeader>
//         </div>

//         {initialView === 'phone' && renderPhoneSubTypeSelector()}

//         <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3">
//           {renderCommonFields()}
//           {initialView === 'phone' && (
//             <>
//               <div className="pt-2 mt-2 border-t">
//                 <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Narxlar (Telefon)</h3>
//                 <div className="grid grid-cols-2 gap-x-4 gap-y-3">
//                   <div className="space-y-1"><Label htmlFor="phonePurchasePriceUzs" className="text-xs">Olingan (so\'m)</Label><Input id="phonePurchasePriceUzs" name="phonePurchasePriceUzs" type="number" value={formData.phonePurchasePriceUzs} onChange={handleChange} placeholder="0"/></div>
//                   <div className="space-y-1"><Label htmlFor="phoneSellingPriceUzs" className="text-xs">Sotiladigan (so\'m)</Label><Input id="phoneSellingPriceUzs" name="phoneSellingPriceUzs" type="number" value={formData.phoneSellingPriceUzs} onChange={handleChange} placeholder="0"/></div>
//                   <div className="space-y-1"><Label htmlFor="phonePurchasePriceUsd" className="text-xs">Olingan (USD)</Label><Input id="phonePurchasePriceUsd" name="phonePurchasePriceUsd" type="number" step="0.01" value={formData.phonePurchasePriceUsd} onChange={handleChange} placeholder="0"/></div>
//                   <div className="space-y-1"><Label htmlFor="phoneSellingPriceUsd" className="text-xs">Sotiladigan (USD)</Label><Input id="phoneSellingPriceUsd" name="phoneSellingPriceUsd" type="number" step="0.01" value={formData.phoneSellingPriceUsd} onChange={handleChange} placeholder="0"/></div>
//                 </div>
//               </div>

//               {selectedPhoneSubType === 'android' && (
//                 <div className="pt-2 mt-2 border-t">
//                   <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Qo'shimcha (Android)</h3>
//                   <div className="space-y-1"><Label htmlFor="androidCapacityRamStorage" className="text-xs">Sig'imi (RAM/Xotira)</Label><Input id="androidCapacityRamStorage" name="androidCapacityRamStorage" value={formData.androidCapacityRamStorage} onChange={handleChange} placeholder="Masalan: 8/256 yoki 256GB"/></div>
//                 </div>
//               )}
//               {selectedPhoneSubType === 'iphone' && (
//                 <div className="pt-2 mt-2 border-t space-y-3">
//                   <h3 className="text-sm font-semibold mb-1 text-muted-foreground">Qo'shimcha (iPhone)</h3>
//                   <div className="space-y-1"><Label htmlFor="iphoneColor" className="text-xs">Rangi <span className="text-destructive">*</span></Label><Input id="iphoneColor" name="iphoneColor" value={formData.iphoneColor} onChange={handleChange} placeholder="Masalan: Natural Titanium" required={selectedPhoneSubType === 'iphone'}/></div>
//                   <div className="grid grid-cols-2 gap-x-4 gap-y-3">
//                     <div className="space-y-1"><Label htmlFor="iphoneCapacityStorage" className="text-xs">Sig'imi (GB) <span className="text-destructive">*</span></Label><Input id="iphoneCapacityStorage" name="iphoneCapacityStorage" type="number" value={formData.iphoneCapacityStorage} onChange={handleChange} placeholder="Masalan: 256" required={selectedPhoneSubType === 'iphone'}/></div>
//                     <div className="space-y-1"><Label htmlFor="iphoneBatteryHealth" className="text-xs">Batareya (%)</Label><Input id="iphoneBatteryHealth" name="iphoneBatteryHealth" type="number" min="0" max="100" value={formData.iphoneBatteryHealth} onChange={handleChange} placeholder="Masalan: 85"/></div>
//                   </div>
//                   <div className="space-y-1"><Label htmlFor="iphoneSeriesRegion" className="text-xs">Seriyasi (Region)</Label><Input id="iphoneSeriesRegion" name="iphoneSeriesRegion" value={formData.iphoneSeriesRegion} onChange={handleChange} placeholder="Masalan: LL/A (USA)"/></div>
//                 </div>
//               )}
//             </>
//           )}

//           {initialView === 'accessory' && (
//             <div className="pt-2 mt-2 border-t space-y-3">
//               <h3 className="text-sm font-semibold mb-1 text-muted-foreground">Qo'shimcha (Aksesuar)</h3>
//               <div className="space-y-1"><Label htmlFor="accessoryPriceUzs" className="text-xs">Narxi (so\'m)</Label><Input id="accessoryPriceUzs" name="accessoryPriceUzs" type="number" value={formData.accessoryPriceUzs} onChange={handleChange} placeholder="0"/></div>
//               <div className="space-y-1"><Label htmlFor="accessoryPriceUsd" className="text-xs">Narxi (USD)</Label><Input id="accessoryPriceUsd" name="accessoryPriceUsd" type="number" step="0.01" value={formData.accessoryPriceUsd} onChange={handleChange} placeholder="0"/></div>
//               <div className="space-y-1"><Label htmlFor="accessoryColor" className="text-xs">Rangi</Label><Input id="accessoryColor" name="accessoryColor" value={formData.accessoryColor} onChange={handleChange} placeholder="Masalan: Qora, Oq"/></div>
//               <div className="space-y-1">
//                 <Label htmlFor="accessoryDescription" className="text-xs">Izoh</Label>
//                 <Textarea id="accessoryDescription" name="accessoryDescription" value={formData.accessoryDescription} onChange={handleChange} rows={2} placeholder="Aksesuar haqida qo'shimcha ma'lumot"/>
//               </div>
//             </div>
//           )}
//           <DialogFooter className="pt-5 border-t mt-4">
//             <Button type="button" variant="outline" onClick={handleDialogClose} disabled={isSubmitting}>Bekor qilish</Button>
//             <Button type="submit" disabled={isSubmitting || isLoadingCategories}>
//               {isSubmitting || isLoadingCategories ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSubmitting ? "Saqlanmoqda..." : "Yuklanmoqda..."}</> : "Saqlash"}
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
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApiCategory {
  id: number;
  name: string;
  description?: string;
  barcode_prefix: string;
}

export type DialogView = 'phone' | 'accessory';
type PhoneSubType = 'android' | 'iphone';

interface Product {
  id: number;
  name: string;
  category: number;
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
  barcode: string;
  purchaseDate: string;
  categoryId: string;
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

const generateBarcode = (categoryPrefix: string): string => {
  const prefix = categoryPrefix || "3"; // Default aksessuar prefiksi
  const timestamp = Date.now().toString().slice(-6);
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${prefix}${timestamp}${randomSuffix}`.slice(0, 12).toUpperCase();
};

const initialFormData: FormData = {
  name: "",
  barcode: "",
  purchaseDate: new Date().toISOString().split('T')[0],
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

export function AddProductDialog({
  open,
  onOpenChange,
  onAddProduct,
  initialView,
}: AddProductDialogProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [selectedPhoneSubType, setSelectedPhoneSubType] = useState<PhoneSubType>('android');
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getTargetCategoryName = useCallback((view: DialogView, subType?: PhoneSubType): string => {
    if (view === 'phone') {
      return subType === 'android' ? "Android" : "iPhone";
    } else if (view === 'accessory') {
      return "accessory";
    }
    return "";
  }, []);

  const findCategoryIdFromApi = useCallback((targetCategoryName: string, categories: ApiCategory[]): { id: string, prefix: string } => {
    if (categories.length === 0 || !targetCategoryName) return { id: "", prefix: "3" }; // Default aksessuar prefiksi
    const category = categories.find(cat => {
      const catNameLower = cat.name.toLowerCase().trim();
      const targetLower = targetCategoryName.toLowerCase().trim();
      return (
        catNameLower.includes(targetLower) ||
        (targetLower.includes("iphone") && catNameLower.includes("iphone")) ||
        (targetLower.includes("android") && catNameLower.includes("android")) ||
        (targetLower.includes("accessory") || targetLower.includes("aksesuar") && catNameLower.includes("accessory"))
      );
    });
    return category ? { id: category.id.toString(), prefix: category.barcode_prefix } : { id: "", prefix: "3" };
  }, []);

  useEffect(() => {
    if (open) {
      const targetCatName = getTargetCategoryName(initialView, initialView === 'phone' ? selectedPhoneSubType : undefined);
      const { prefix } = findCategoryIdFromApi(targetCatName, apiCategories);
      setFormData({
        ...initialFormData,
        barcode: generateBarcode(prefix),
        purchaseDate: new Date().toISOString().split('T')[0],
      });
    }
  }, [open, initialView, selectedPhoneSubType, getTargetCategoryName, findCategoryIdFromApi, apiCategories]);

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

        const response = await axios.get("https://smartphone777.pythonanywhere.com/api/categories/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const categoriesData = Array.isArray(response.data) ? response.data : response.data.results || [];
        const currentApiCategories = categoriesData.filter(cat => cat.name && cat.id && cat.barcode_prefix) as ApiCategory[];
        setApiCategories(currentApiCategories);

        const targetCatName = getTargetCategoryName(initialView, initialView === 'phone' ? selectedPhoneSubType : undefined);
        const { id, prefix } = findCategoryIdFromApi(targetCatName, currentApiCategories);
        setFormData(prev => ({
          ...prev,
          categoryId: id || "",
          barcode: generateBarcode(prefix),
        }));
      } catch (error: any) {
        toast.error("Kategoriyalarni olishda xatolik: " + (error.response?.data?.detail || error.message));
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchAndSetCategory();
  }, [open, initialView, selectedPhoneSubType, getTargetCategoryName, findCategoryIdFromApi]);

  const handleDialogClose = () => {
    if (isSubmitting) return;
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Mahsulot nomi kiritilishi shart.");
      return;
    }

    // Kategoriyani nomga asoslanib dinamik aniqlash
    const nameLower = formData.name.toLowerCase().trim();
    let targetCatName = "";
    if (initialView === 'phone') {
      targetCatName = nameLower.includes("iphone") ? "iPhone" : "Android";
    } else {
      targetCatName = nameLower.includes("accessory") || nameLower.includes("aksesuar") || nameLower.includes("case") || nameLower.includes("charger") ? "accessory" : "accessory";
    }
    const { id: dynamicCategoryId, prefix } = findCategoryIdFromApi(targetCatName, apiCategories);

    if (!dynamicCategoryId && !isLoadingCategories) {
      toast.error(`"${targetCatName}" kategoriyasi topilmadi. Standart aksessuar kategoriyasi ishlatildi.`);
      setFormData(prev => ({ ...prev, categoryId: "", barcode: generateBarcode("3") }));
      return;
    }

    setIsSubmitting(true);

    let productPayload: any = {
      name: formData.name.trim(),
      barcode: formData.barcode,
      category: Number(dynamicCategoryId || formData.categoryId || apiCategories[0]?.id || 1), // Agar topilmasa, birinchi kategoriyani ishlatamiz
      purchase_date: formData.purchaseDate,
      is_active: true,
      price_uzs: null,
      price_usd: null,
      purchase_price_uzs: null,
      purchase_price_usd: null,
      storage_capacity: null,
      color: null,
      series_region: null,
      battery_health: null,
      description: null,
    };

    if (initialView === 'phone') {
      productPayload.purchase_price_uzs = formData.phonePurchasePriceUzs ? Number(formData.phonePurchasePriceUzs) : null;
      productPayload.price_uzs = formData.phoneSellingPriceUzs ? Number(formData.phoneSellingPriceUzs) : null;
      productPayload.purchase_price_usd = formData.phonePurchasePriceUsd ? Number(formData.phonePurchasePriceUsd) : null;
      productPayload.price_usd = formData.phoneSellingPriceUsd ? Number(formData.phoneSellingPriceUsd) : null;

      if (!productPayload.price_uzs && !productPayload.price_usd && !productPayload.purchase_price_uzs && !productPayload.purchase_price_usd) {
        toast.error("Telefon uchun kamida bitta narx kiritilishi shart (UZS yoki USD).");
        setIsSubmitting(false);
        return;
      }

      if (selectedPhoneSubType === 'android') {
        productPayload.storage_capacity = formData.androidCapacityRamStorage.trim() || null;
      } else {
        if (!formData.iphoneColor.trim()) { toast.error("iPhone uchun rang kiritilishi shart."); setIsSubmitting(false); return; }
        if (!formData.iphoneCapacityStorage.trim()) { toast.error("iPhone uchun sig‘im kiritilishi shart."); setIsSubmitting(false); return; }
        productPayload.color = formData.iphoneColor.trim();
        productPayload.storage_capacity = `${formData.iphoneCapacityStorage.trim()}GB`;
        productPayload.battery_health = formData.iphoneBatteryHealth ? Number(formData.iphoneBatteryHealth) : null;
        productPayload.series_region = formData.iphoneSeriesRegion.trim() || null;
      }
    } else {
      productPayload.price_uzs = formData.accessoryPriceUzs ? Number(formData.accessoryPriceUzs) : null;
      productPayload.price_usd = formData.accessoryPriceUsd ? Number(formData.accessoryPriceUsd) : null;
      productPayload.color = formData.accessoryColor.trim() || null;
      productPayload.description = formData.accessoryDescription.trim() || null;
      if (!productPayload.price_uzs && !productPayload.price_usd) {
        toast.error("Aksesuar uchun narx kiritilishi shart (UZS yoki USD).");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) { toast.error("Avtorizatsiya tokeni topilmadi."); setIsSubmitting(false); return; }

      const response = await axios.post("https://smartphone777.pythonanywhere.com/api/products/", productPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`${initialView === 'phone' ? (selectedPhoneSubType === 'android' ? 'Android Telefon' : 'iPhone') : 'Aksesuar'} muvaffaqiyatli qo‘shildi!`);
      onAddProduct(response.data as Product);
      handleDialogClose();
    } catch (error: any) {
      let errorMessage = `${initialView === 'phone' ? (selectedPhoneSubType === 'android' ? 'Android' : 'iPhone') : 'Aksesuar'} qo‘shishda xatolik: `;
      if (error.response?.data && typeof error.response.data === 'object') {
        for (const key in error.response.data) {
          errorMessage += `${key}: ${Array.isArray(error.response.data[key]) ? error.response.data[key].join(', ') : error.response.data[key]}. `;
        }
      } else {
        errorMessage += error.response?.data?.detail || error.message || "Noma'lum xatolik.";
      }
      toast.error(errorMessage, { duration: 7000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubTypeChange = (subType: PhoneSubType) => {
    setSelectedPhoneSubType(subType);
    const targetCatName = getTargetCategoryName('phone', subType);
    const { id, prefix } = findCategoryIdFromApi(targetCatName, apiCategories);
    setFormData(prev => ({
      ...prev,
      categoryId: id || "",
      barcode: generateBarcode(prefix),
    }));
  };

  const renderPhoneSubTypeSelector = () => (
    <div className="flex border-b mb-4">
      <Button
        variant="ghost"
        type="button"
        className={cn(
          "flex-1 justify-center rounded-none border-b-2 py-3 text-sm font-medium",
          selectedPhoneSubType === 'android'
            ? "border-primary text-primary bg-primary/10"
            : "border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
        onClick={() => handleSubTypeChange('android')}
      >
        Android
      </Button>
      <Button
        variant="ghost"
        type="button"
        className={cn(
          "flex-1 justify-center rounded-none border-b-2 py-3 text-sm font-medium",
          selectedPhoneSubType === 'iphone'
            ? "border-primary text-primary bg-primary/10"
            : "border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
        onClick={() => handleSubTypeChange('iphone')}
      >
        iPhone
      </Button>
    </div>
  );

  const renderCommonFields = () => (
    <>
      <div className="space-y-1">
        <Label htmlFor="name" className="text-xs font-medium">Nomi <span className="text-destructive">*</span></Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange}
               placeholder={initialView === 'phone' ? (selectedPhoneSubType === 'android' ? "Masalan: Samsung A51" : "Masalan: iPhone 14 Pro") : "Masalan: Chexol, Zaryadchik"}/>
      </div>
      <div className="space-y-1">
        <Label htmlFor="barcode" className="text-xs font-medium">Shtrix Kod</Label>
        <Input 
          id="barcode" 
          name="barcode" 
          value={formData.barcode} 
          readOnly 
          disabled
          className={cn(
            "bg-muted/50 cursor-not-allowed",
            "text-lg font-mono h-12 px-4",
            "border-2 border-gray-300 rounded-lg",
            "focus:ring-0 focus:border-gray-300"
          )} 
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="purchaseDate" className="text-xs font-medium">Olingan sana</Label>
        <Input id="purchaseDate" name="purchaseDate" type="date" value={formData.purchaseDate} onChange={handleChange}/>
      </div>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6 pt-5">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl font-semibold">
              {initialView === 'phone' ? 'Telefon Qo\'shish' : 'Aksesuar Qo\'shish'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Yangi {initialView === 'phone' ? 'telefon' : 'aksesuar'} ma'lumotlarini kiriting.
            </DialogDescription>
          </DialogHeader>
        </div>

        {initialView === 'phone' && renderPhoneSubTypeSelector()}

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3">
          {renderCommonFields()}
          {initialView === 'phone' && (
            <>
              <div className="pt-2 mt-2 border-t">
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Narxlar (Telefon)</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="space-y-1"><Label htmlFor="phonePurchasePriceUzs" className="text-xs">Olingan (so\'m)</Label><Input id="phonePurchasePriceUzs" name="phonePurchasePriceUzs" type="number" value={formData.phonePurchasePriceUzs} onChange={handleChange} placeholder="0"/></div>
                  <div className="space-y-1"><Label htmlFor="phoneSellingPriceUzs" className="text-xs">Sotiladigan (so\'m)</Label><Input id="phoneSellingPriceUzs" name="phoneSellingPriceUzs" type="number" value={formData.phoneSellingPriceUzs} onChange={handleChange} placeholder="0"/></div>
                  <div className="space-y-1"><Label htmlFor="phonePurchasePriceUsd" className="text-xs">Olingan (USD)</Label><Input id="phonePurchasePriceUsd" name="phonePurchasePriceUsd" type="number" step="0.01" value={formData.phonePurchasePriceUsd} onChange={handleChange} placeholder="0"/></div>
                  <div className="space-y-1"><Label htmlFor="phoneSellingPriceUsd" className="text-xs">Sotiladigan (USD)</Label><Input id="phoneSellingPriceUsd" name="phoneSellingPriceUsd" type="number" step="0.01" value={formData.phoneSellingPriceUsd} onChange={handleChange} placeholder="0"/></div>
                </div>
              </div>

              {selectedPhoneSubType === 'android' && (
                <div className="pt-2 mt-2 border-t">
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Qo'shimcha (Android)</h3>
                  <div className="space-y-1"><Label htmlFor="androidCapacityRamStorage" className="text-xs">Sig'imi (RAM/Xotira)</Label><Input id="androidCapacityRamStorage" name="androidCapacityRamStorage" value={formData.androidCapacityRamStorage} onChange={handleChange} placeholder="Masalan: 8/256 yoki 256GB"/></div>
                </div>
              )}
              {selectedPhoneSubType === 'iphone' && (
                <div className="pt-2 mt-2 border-t space-y-3">
                  <h3 className="text-sm font-semibold mb-1 text-muted-foreground">Qo'shimcha (iPhone)</h3>
                  <div className="space-y-1"><Label htmlFor="iphoneColor" className="text-xs">Rangi <span className="text-destructive">*</span></Label><Input id="iphoneColor" name="iphoneColor" value={formData.iphoneColor} onChange={handleChange} placeholder="Masalan: Natural Titanium" required={selectedPhoneSubType === 'iphone'}/></div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div className="space-y-1"><Label htmlFor="iphoneCapacityStorage" className="text-xs">Sig'imi (GB) <span className="text-destructive">*</span></Label><Input id="iphoneCapacityStorage" name="iphoneCapacityStorage" type="number" value={formData.iphoneCapacityStorage} onChange={handleChange} placeholder="Masalan: 256" required={selectedPhoneSubType === 'iphone'}/></div>
                    <div className="space-y-1"><Label htmlFor="iphoneBatteryHealth" className="text-xs">Batareya (%)</Label><Input id="iphoneBatteryHealth" name="iphoneBatteryHealth" type="number" min="0" max="100" value={formData.iphoneBatteryHealth} onChange={handleChange} placeholder="Masalan: 85"/></div>
                  </div>
                  <div className="space-y-1"><Label htmlFor="iphoneSeriesRegion" className="text-xs">Seriyasi (Region)</Label><Input id="iphoneSeriesRegion" name="iphoneSeriesRegion" value={formData.iphoneSeriesRegion} onChange={handleChange} placeholder="Masalan: LL/A (USA)"/></div>
                </div>
              )}
            </>
          )}

          {initialView === 'accessory' && (
            <div className="pt-2 mt-2 border-t space-y-3">
              <h3 className="text-sm font-semibold mb-1 text-muted-foreground">Qo'shimcha (Aksesuar)</h3>
              <div className="space-y-1"><Label htmlFor="accessoryPriceUzs" className="text-xs">Narxi (so\'m)</Label><Input id="accessoryPriceUzs" name="accessoryPriceUzs" type="number" value={formData.accessoryPriceUzs} onChange={handleChange} placeholder="0"/></div>
              <div className="space-y-1"><Label htmlFor="accessoryPriceUsd" className="text-xs">Narxi (USD)</Label><Input id="accessoryPriceUsd" name="accessoryPriceUsd" type="number" step="0.01" value={formData.accessoryPriceUsd} onChange={handleChange} placeholder="0"/></div>
              <div className="space-y-1"><Label htmlFor="accessoryColor" className="text-xs">Rangi</Label><Input id="accessoryColor" name="accessoryColor" value={formData.accessoryColor} onChange={handleChange} placeholder="Masalan: Qora, Oq"/></div>
              <div className="space-y-1">
                <Label htmlFor="accessoryDescription" className="text-xs">Izoh</Label>
                <Textarea id="accessoryDescription" name="accessoryDescription" value={formData.accessoryDescription} onChange={handleChange} rows={2} placeholder="Aksesuar haqida qo'shimcha ma'lumot"/>
              </div>
            </div>
          )}
          <DialogFooter className="pt-5 border-t mt-4">
            <Button type="button" variant="outline" onClick={handleDialogClose} disabled={isSubmitting}>Bekor qilish</Button>
            <Button type="submit" disabled={isSubmitting || isLoadingCategories}>
              {isSubmitting || isLoadingCategories ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isSubmitting ? "Saqlanmoqda..." : "Yuklanmoqda..."}</> : "Saqlash"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}