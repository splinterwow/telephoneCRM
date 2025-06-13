import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { Loader2, ScanBarcode, Fingerprint, User, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApiCategory {
  id: number;
  name: string;
  description?: string;
  is_accessory_category?: boolean;
}

interface Kassa {
  id: number;
  name: string;
  is_active?: boolean;
}

export type DialogView = "phone" | "accessory";
type PhoneSubType = "android" | "iphone";
type IdentifierModeApi = "auto_barcode" | "manual_barcode_unique" | "manual_imei";

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
  supplier_name_manual?: string | null;
  supplier_phone_manual?: string | null;
}

interface FormData {
  name: string;
  purchaseDate: string;
  identifierType: IdentifierModeApi;
  defaultKassaId: string;
  initialStockQuantity: string;
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
  accessoryPriceUzs: string; // Sotish narxi
  accessoryPriceUsd: string; // Sotish narxi
  accessoryPurchasePriceUzs: string; // Olingan narx
  accessoryPurchasePriceUsd: string; // Olingan narx
  accessoryDescription: string;
  supplierNameManual: string;
  supplierPhoneManual: string;
}

const initialFormData: FormData = {
  name: "",
  purchaseDate: new Date().toISOString().split("T")[0],
  identifierType: "auto_barcode",
  defaultKassaId: "",
  initialStockQuantity: "1",
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
  accessoryPurchasePriceUzs: "", // Yangi
  accessoryPurchasePriceUsd: "", // Yangi
  accessoryDescription: "",
  supplierNameManual: "",
  supplierPhoneManual: "",
};

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddProduct: (newProduct: Product) => void;
  initialView: DialogView;
  categories: ApiCategory[];
}

const API_URL_CATEGORIES = "https://smartphone777.pythonanywhere.com/api/categories/";
const API_URL_PRODUCTS = "https://smartphone777.pythonanywhere.com/api/products/";
const API_URL_GENERATE_BARCODE = "https://smartphone777.pythonanywhere.com/api/products/generate-barcode/";
const API_URL_KASSA = "https://smartphone777.pythonanywhere.com/api/kassa/";

export function AddProductDialog({
  open,
  onOpenChange,
  onAddProduct,
  initialView,
  categories: propCategories,
}: AddProductDialogProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [selectedPhoneSubType, setSelectedPhoneSubType] =
    useState<PhoneSubType>("android");

  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingBarcode, setIsGeneratingBarcode] = useState(false);

  const [manualImei, setManualImei] = useState<string>("");
  const [generatedBarcodeForDisplay, setGeneratedBarcodeForDisplay] = useState<string>("");

  const [kassaList, setKassaList] = useState<Kassa[]>([]);
  const [isLoadingKassa, setIsLoadingKassa] = useState(false);

  const currentCategoriesRef = useRef<ApiCategory[]>([]);

  useEffect(() => {
    currentCategoriesRef.current = apiCategories;
  }, [apiCategories]);

  const findCategoryIdFromApi = useCallback(
    (targetCategoryName: string, currentCategoriesFromFunc: ApiCategory[]): string => {
      if (!Array.isArray(currentCategoriesFromFunc) || currentCategoriesFromFunc.length === 0 || !targetCategoryName) {
        return "";
      }
      const targetLower = targetCategoryName.toLowerCase().trim();
      let foundCategory: ApiCategory | undefined = currentCategoriesFromFunc.find(cat => cat.name.toLowerCase().trim() === targetLower);
      
      if (!foundCategory) {
        if (targetLower === "iphone") {
          foundCategory = currentCategoriesFromFunc.find(cat => cat.name.toLowerCase().trim().includes("iphone"));
        } else if (targetLower === "android") {
          foundCategory = currentCategoriesFromFunc.find(cat =>
            cat.name.toLowerCase().trim().includes("android") &&
            !cat.name.toLowerCase().trim().includes("iphone")
          );
        } else if (targetLower === "accessory" || targetLower === "aksesuar") {
          foundCategory = currentCategoriesFromFunc.find(cat =>
            cat.name.toLowerCase().trim().includes("accessory") ||
            cat.name.toLowerCase().trim().includes("aksesuar") ||
            cat.is_accessory_category === true
          );
        }
      }
      if (foundCategory) return foundCategory.id.toString();
      return "";
    },
    []
  );

  useEffect(() => {
    if (open) {
      setFormData({
        ...initialFormData,
        purchaseDate: new Date().toISOString().split("T")[0],
        identifierType: initialView === "accessory" ? "auto_barcode" : "auto_barcode",
        initialStockQuantity: initialView === "phone" ? "1" : "0",
        supplierNameManual: "", 
        supplierPhoneManual: "",
        accessoryPurchasePriceUzs: "", // Reset
        accessoryPurchasePriceUsd: "", // Reset
      });
      setManualImei("");
      setGeneratedBarcodeForDisplay("");
      setSelectedPhoneSubType(initialView === "phone" ? "android" : "android");
      
      setIsLoadingCategories(true);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Avtorizatsiya tokeni topilmadi.");
        onOpenChange(false);
        setIsLoadingCategories(false);
        return;
      }

      setIsLoadingKassa(true);
      axios.get(API_URL_KASSA, { headers: { Authorization: `Bearer ${token}` } })
        .then(response => {
          const kassaData = Array.isArray(response.data) ? response.data : (response.data as any).results || [];
          setKassaList(kassaData.filter((k: Kassa) => k.is_active !== false));
        })
        .catch(error => { toast.error("Kassalarni yuklashda xatolik."); console.error("Kassa yuklash xatosi:", error); })
        .finally(() => setIsLoadingKassa(false));

      if (propCategories && propCategories.length > 0) {
        setApiCategories(propCategories);
        currentCategoriesRef.current = propCategories;
        setIsLoadingCategories(false);
      } else {
        axios.get(API_URL_CATEGORIES, { headers: { Authorization: `Bearer ${token}` } })
          .then(response => {
            let categoriesData: ApiCategory[] = [];
            if (response.data && "results" in response.data && Array.isArray(response.data.results)) {
              categoriesData = response.data.results;
            } else if (Array.isArray(response.data)) {
              categoriesData = response.data;
            }
            const validCategories = categoriesData.filter((cat: any) => cat.name && cat.id) as ApiCategory[];
            setApiCategories(validCategories);
            currentCategoriesRef.current = validCategories;
          })
          .catch(error => {
            toast.error("Kategoriyalarni dialogda yuklashda xatolik.");
            setApiCategories([]);
            currentCategoriesRef.current = [];
          })
          .finally(() => setIsLoadingCategories(false));
      }
    } else {
      setIsLoadingCategories(true);
      setApiCategories([]);
      currentCategoriesRef.current = [];
    }
  }, [open, initialView, propCategories, onOpenChange]);

  const handleDialogClose = () => {
    if (isSubmitting || isGeneratingBarcode) return;
    onOpenChange(false);
  };

  const handleGenerateBarcode = async () => {
    setIsGeneratingBarcode(true);
    setGeneratedBarcodeForDisplay("");
    let categoryIdForBarcode = "";
    let targetCatName = initialView === 'phone' ? (selectedPhoneSubType === 'iphone' ? "iPhone" : "Android") : "Accessory";
    categoryIdForBarcode = findCategoryIdFromApi(targetCatName, currentCategoriesRef.current);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) { toast.error("Avtorizatsiya tokeni yo'q."); setIsGeneratingBarcode(false); return; }
      const params: any = {};
      if (categoryIdForBarcode) params.category_id = categoryIdForBarcode;
      
      const response = await axios.get<{ barcode: string }>(API_URL_GENERATE_BARCODE, { headers: { Authorization: `Bearer ${token}` }, params });
      if (response.data && response.data.barcode) {
        setGeneratedBarcodeForDisplay(response.data.barcode);
        toast.success(`Shtrix-kod generatsiya qilindi: ${response.data.barcode}`);
      } else {
        toast.error("Shtrix-kod generatsiya qilishda serverdan shtrixkod kelmadi.");
      }
    } catch (error: any) {
      let errorMessage = "Shtrix-kod generatsiya qilishda xatolik: ";
       if (error.response) errorMessage += `Server javobi (${error.response.status}): ${JSON.stringify(error.response.data)}.`;
       else if (error.request) errorMessage += "Serverdan javob kelmadi.";
       else errorMessage += error.message;
      toast.error(errorMessage, { duration: 7000 });
      setGeneratedBarcodeForDisplay("");
    } finally {
      setIsGeneratingBarcode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoadingCategories) { toast.info("Kategoriyalar yuklanmoqda, iltimos kuting..."); return; }
    if (!formData.name.trim()) { toast.error("Mahsulot nomi kiritilishi shart."); return; }
    
    if (initialView === "phone") {
        if (!formData.supplierNameManual.trim()) { toast.error("Telefon uchun mijoz ismi kiritilishi shart."); return; }
        if (!formData.supplierPhoneManual.trim()) { toast.error("Telefon uchun mijoz telefon raqami kiritilishi shart."); return; }
    }

    if (initialView === "phone" && (formData.identifierType === "manual_imei" || formData.identifierType === "manual_barcode_unique") && !manualImei.trim()) {
      const id_type_label = formData.identifierType === "manual_imei" ? "IMEI" : "Shtrix Kod (Unikal)";
      toast.error(`${id_type_label} kiritilishi shart.`); return;
    }

    let targetCatNameSubmit = initialView === "phone" ? (selectedPhoneSubType === 'iphone' ? "iPhone" : "Android") : "Accessory";
    let finalCategoryId = findCategoryIdFromApi(targetCatNameSubmit, currentCategoriesRef.current);

    if (!finalCategoryId) {
        toast.error(`"${targetCatNameSubmit}" uchun mos kategoriya tizimda topilmadi.`, {duration: 10000});
        return;
    }

    let finalStockQuantityForPayload = 0;
    const stockQtyStr = formData.initialStockQuantity.trim();
    if (initialView === "phone") {
      if (!stockQtyStr) { toast.error("Telefon uchun boshlang'ich miqdor kiritilishi shart."); return; }
      const stockQtyNum = parseInt(stockQtyStr, 10);
      if (isNaN(stockQtyNum) || stockQtyNum <= 0) { toast.error("Telefon uchun boshlang'ich miqdor 0 dan katta butun son bo'lishi kerak."); return; }
      finalStockQuantityForPayload = stockQtyNum;
    } else { 
      if (stockQtyStr) {
        const stockQtyNum = parseInt(stockQtyStr, 10);
        if (!isNaN(stockQtyNum) && stockQtyNum >= 0) { finalStockQuantityForPayload = stockQtyNum; }
        else { toast.error("Aksessuar uchun boshlang'ich miqdor noto'g'ri."); return; }
      }
    }

    setIsSubmitting(true);
    let productPayload: any = {
      name: formData.name.trim(),
      category: Number(finalCategoryId),
      identifier_type: formData.identifierType,
      barcode: null, 
      purchase_date: formData.purchaseDate || null,
      is_active: true,
      add_to_stock_quantity: finalStockQuantityForPayload,
      supplier_name_manual: formData.supplierNameManual.trim() || null, 
      supplier_phone_manual: formData.supplierPhoneManual.trim() || null,
    };
    
    if (initialView === "accessory") {
      productPayload.product_is_accessory_type = true; 
    }

    if (formData.defaultKassaId && !isNaN(parseInt(formData.defaultKassaId))) {
      productPayload.default_kassa_id_for_new_stock = Number(formData.defaultKassaId);
    }

    if (initialView === "phone") {
        if (formData.identifierType === "manual_imei" || formData.identifierType === "manual_barcode_unique") {
            productPayload.barcode = manualImei.trim().toUpperCase();
        } else if (formData.identifierType === "auto_barcode" && generatedBarcodeForDisplay) {
            productPayload.barcode = generatedBarcodeForDisplay;
        }
    }
    
    let hasSellingPrice = false;
    const p_uzs_str = initialView === "phone" ? formData.phoneSellingPriceUzs : formData.accessoryPriceUzs;
    const p_usd_str = initialView === "phone" ? formData.phoneSellingPriceUsd : formData.accessoryPriceUsd;
    const parsePrice = (priceStr: string) => priceStr ? parseFloat(priceStr.replace(/\s/g, '').replace(/,/g, '.')) : NaN;
    const p_uzs = parsePrice(p_uzs_str);
    const p_usd = parsePrice(p_usd_str);

    if (p_uzs_str.trim() !== "") {
      if (!isNaN(p_uzs) && p_uzs >= 0) { productPayload.price_uzs = p_uzs.toFixed(0); hasSellingPrice = true; } 
      else { toast.error("Sotiladigan narx (so'm) noto'g'ri."); setIsSubmitting(false); return; }
    }
    if (p_usd_str.trim() !== "") {
      if (!isNaN(p_usd) && p_usd >= 0) { productPayload.price_usd = p_usd.toFixed(2); hasSellingPrice = true; } 
      else { toast.error("Sotiladigan narx (USD) noto'g'ri."); setIsSubmitting(false); return; }
    }
    if (!hasSellingPrice) {
      toast.error("Kamida bitta sotish narxi (UZS yoki USD) kiritilishi shart."); setIsSubmitting(false); return;
    }
    
    if (initialView === "phone") {
      const purch_uzs_str = formData.phonePurchasePriceUzs;
      const purch_usd_str = formData.phonePurchasePriceUsd;
      const purch_uzs = parsePrice(purch_uzs_str);
      const purch_usd = parsePrice(purch_usd_str);
      if (purch_uzs_str.trim() !== "" && !isNaN(purch_uzs) && purch_uzs >= 0) productPayload.purchase_price_uzs = purch_uzs.toFixed(0);
      if (purch_usd_str.trim() !== "" && !isNaN(purch_usd) && purch_usd >= 0) productPayload.purchase_price_usd = purch_usd.toFixed(2);
    } else if (initialView === "accessory") {
        const acc_purch_uzs_str = formData.accessoryPurchasePriceUzs;
        const acc_purch_usd_str = formData.accessoryPurchasePriceUsd;
        const acc_purch_uzs = parsePrice(acc_purch_uzs_str);
        const acc_purch_usd = parsePrice(acc_purch_usd_str);

        if (acc_purch_uzs_str.trim() !== "") {
            if (!isNaN(acc_purch_uzs) && acc_purch_uzs >= 0) {
                productPayload.purchase_price_uzs = acc_purch_uzs.toFixed(0);
            } else {
                toast.error("Aksessuar uchun olingan narx (so'm) noto'g'ri.");
                setIsSubmitting(false); return;
            }
        }
        if (acc_purch_usd_str.trim() !== "") {
            if (!isNaN(acc_purch_usd) && acc_purch_usd >= 0) {
                productPayload.purchase_price_usd = acc_purch_usd.toFixed(2);
            } else {
                toast.error("Aksessuar uchun olingan narx (USD) noto'g'ri.");
                setIsSubmitting(false); return;
            }
        }
    }
    
    if (initialView === "phone") {
      if (selectedPhoneSubType === "android") { 
        if (formData.androidCapacityRamStorage.trim()) productPayload.storage_capacity = formData.androidCapacityRamStorage.trim();
      } else if (selectedPhoneSubType === "iphone"){ 
        if (!formData.iphoneColor.trim()) { toast.error("iPhone uchun rang kiritilishi shart."); setIsSubmitting(false); return; }
        if (!formData.iphoneCapacityStorage.trim()) { toast.error("iPhone uchun sig‘im kiritilishi shart."); setIsSubmitting(false); return; }
        productPayload.color = formData.iphoneColor.trim();
        productPayload.storage_capacity = `${formData.iphoneCapacityStorage.trim()}GB`;
        const batteryHealthVal = formData.iphoneBatteryHealth.trim();
        if (batteryHealthVal !== "") {
            const batteryHealthNum = parseFloat(batteryHealthVal);
            if (!isNaN(batteryHealthNum) && batteryHealthNum >= 0 && batteryHealthNum <=100) productPayload.battery_health = Number(batteryHealthNum.toFixed(0)); 
        }
        if (formData.iphoneSeriesRegion.trim()) productPayload.series_region = formData.iphoneSeriesRegion.trim();
      }
    } else { // Aksessuar
      if (formData.accessoryColor.trim()) productPayload.color = formData.accessoryColor.trim();
      if (formData.accessoryDescription.trim()) productPayload.description = formData.accessoryDescription.trim();
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) { toast.error("Avtorizatsiya tokeni topilmadi."); setIsSubmitting(false); return; }
      
      const response = await axios.post(API_URL_PRODUCTS, productPayload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Mahsulot "${response.data.name}" muvaffaqiyatli qo‘shildi! Shtrixkod: ${response.data.barcode || "Avto"}`);
      onAddProduct(response.data as Product);
      handleDialogClose();
    } catch (error: any) {
      let errMsg = `Mahsulot qo‘shishda xatolik: `;
      if (error.response && error.response.data) {
        const data = error.response.data;
        if (typeof data === "object" && data !== null) {
          if (data.detail) errMsg += `${data.detail}. `;
          Object.keys(data).forEach(key => {
              if (key !== 'detail' && Array.isArray(data[key])) errMsg += `${key}: ${data[key].join(', ')}. `;
              else if (key !== 'detail' && typeof data[key] === 'string') errMsg += `${key}: ${data[key]}. `;
          });
          if (errMsg === `Mahsulot qo‘shishda xatolik: ` && !data.detail) errMsg += "Noma'lum server xatosi.";
        } else if (typeof data === 'string') errMsg += data; else errMsg += "Noma'lum server javobi.";
      } else if (error.request) { errMsg += "Serverdan javob kelmadi."; } 
      else { errMsg += error.message || "Noma'lum xatolik."; }
      if (errMsg.trim() === `Mahsulot qo‘shishda xatolik:` || errMsg.trim() === `Mahsulot qo‘shishda xatolik: .`) {
          errMsg = "Mahsulot qo‘shishda noma'lum xatolik. Konsolni tekshiring.";
      }
      toast.error(errMsg.trim(), { duration: 10000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneSubTypeChange = (subType: PhoneSubType) => setSelectedPhoneSubType(subType);
  const handleIdentifierModeChange = (mode: IdentifierModeApi) => {
    setFormData(prev => ({...prev, identifierType: mode}));
    setGeneratedBarcodeForDisplay("");
    if (mode === "manual_imei" || mode === "manual_barcode_unique") setManualImei("");
  };

  const renderPhoneSubTypeSelector = () => (
    <div className="flex border-b mb-4">
     <Button variant="ghost" type="button" className={cn("flex-1 justify-center rounded-none border-b-2 py-3 text-sm font-medium", selectedPhoneSubType === "android" ? "border-primary text-primary bg-primary/10" : "border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground")} onClick={() => handlePhoneSubTypeChange("android")} disabled={isSubmitting || isLoadingCategories || isLoadingKassa}>Android</Button>
     <Button variant="ghost" type="button" className={cn("flex-1 justify-center rounded-none border-b-2 py-3 text-sm font-medium", selectedPhoneSubType === "iphone" ? "border-primary text-primary bg-primary/10" : "border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground")} onClick={() => handlePhoneSubTypeChange("iphone")} disabled={isSubmitting || isLoadingCategories || isLoadingKassa}>iPhone</Button>
   </div>
 );

 const renderIdentifierSelector = () =>
   initialView !== "phone" ? null : (
   <div className="mb-3">
       <Label className="text-xs font-medium mb-1 block">Identifikator Turi</Label>
       <div className="flex rounded-md border bg-muted p-0.5">
         <Button type="button" variant={formData.identifierType === "auto_barcode" ? "default" : "ghost"} onClick={() => handleIdentifierModeChange("auto_barcode")} className={cn("flex-1 h-8 text-xs", formData.identifierType === "auto_barcode" ? "shadow-sm" : "")} disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}><ScanBarcode className="mr-2 h-4 w-4" />Shtrix (Avto)</Button>
         <Button type="button" variant={formData.identifierType === "manual_barcode_unique" ? "default" : "ghost"} onClick={() => handleIdentifierModeChange("manual_barcode_unique")} className={cn("flex-1 h-8 text-xs", formData.identifierType === "manual_barcode_unique" ? "shadow-sm" : "")} disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}><ScanBarcode className="mr-2 h-4 w-4" />Shtrix (Unikal)</Button>
         <Button type="button" variant={formData.identifierType === "manual_imei" ? "default" : "ghost"} onClick={() => handleIdentifierModeChange("manual_imei")} className={cn("flex-1 h-8 text-xs", formData.identifierType === "manual_imei" ? "shadow-sm" : "")} disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}><Fingerprint className="mr-2 h-4 w-4" />IMEI (Qo'lda)</Button>
       </div>
     </div>
 );

 const renderCommonFields = () => (
   <>
     <div className="space-y-1">
       <Label htmlFor="name" className="text-xs font-medium">Nomi <span className="text-destructive">*</span></Label>
       <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder={initialView === "phone" ? (selectedPhoneSubType === "android" ? "Masalan: Samsung A51 8/128GB Black" : "Masalan: iPhone 14 Pro 256GB Deep Purple") : "Masalan: Chexol iPhone 13 uchun (Shisha)"} disabled={isSubmitting}/>
     </div>
     
     <div className="pt-2 mt-2 border-t">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Mijoz Ma'lumotlari (Kirim uchun)</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
             <div className="space-y-1">
                 <Label htmlFor="supplierNameManual" className="text-xs font-medium">
                    Mijoz Ism Familiyasi {initialView === "phone" && <span className="text-destructive">*</span>}
                 </Label>
                 <div className="relative">
                    <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="supplierNameManual" name="supplierNameManual" value={formData.supplierNameManual} onChange={handleChange} placeholder="Masalan: Alisher Valiev" className="pl-8" disabled={isSubmitting}/>
                 </div>
             </div>
             <div className="space-y-1">
                 <Label htmlFor="supplierPhoneManual" className="text-xs font-medium">
                    Mijoz Telefon Raqami {initialView === "phone" && <span className="text-destructive">*</span>}
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="supplierPhoneManual" name="supplierPhoneManual" type="tel" value={formData.supplierPhoneManual} onChange={handleChange} placeholder="Masalan: +998901234567" className="pl-8" disabled={isSubmitting}/>
                  </div>
             </div>
         </div>
         {initialView === "accessory" && <p className="text-xs text-muted-foreground mt-1">Aksessuarlar uchun mijoz ma'lumotlari ixtiyoriy.</p>}
       </div>
     

     {initialView === "phone" && (formData.identifierType === "manual_imei" || formData.identifierType === "manual_barcode_unique") && (
       <div className="space-y-1">
         <Label htmlFor="manualImei" className="text-xs font-medium">{formData.identifierType === "manual_imei" ? "IMEI" : "Shtrix Kod (Unikal)"} <span className="text-destructive">*</span></Label>
         <Input id="manualImei" name="manualImei" value={manualImei} onChange={(e) => setManualImei(e.target.value.toUpperCase())} placeholder={`${formData.identifierType === "manual_imei" ? "IMEI" : "Unikal shtrix kod"}ni kiriting...`} className="text-base font-mono h-11 px-3" maxLength={150} disabled={isSubmitting || isLoadingCategories || isLoadingKassa}/>
         <p className="text-xs text-muted-foreground">{formData.identifierType === "manual_imei" ? "Bir nechta IMEI ni vergul (,) bilan ajratib kiriting." : "Bu shtrix kod tizimda yagona bo'lishi kerak."}</p>
       </div>
     )}

     {( (initialView === "phone" && formData.identifierType === "auto_barcode") || initialView === "accessory" ) && (
        <div className="space-y-1">
         <Label className="text-xs font-medium">Shtrix Kod</Label>
         <div className="flex items-center gap-2">
           <Input id="generatedBarcodeDisplay" value={generatedBarcodeForDisplay || "Avtomatik (saqlashda server yaratadi)"} readOnly className={cn("bg-muted/50 cursor-default h-11 px-3 flex-grow", !generatedBarcodeForDisplay && "italic text-muted-foreground")}/>
           {initialView === "phone" && formData.identifierType === "auto_barcode" && (
             <Button type="button" variant="outline" onClick={handleGenerateBarcode} disabled={isSubmitting || isGeneratingBarcode || isLoadingCategories || isLoadingKassa} className="h-11 shrink-0" title="Yangi shtrix-kod generatsiya qilish (ixtiyoriy)">{isGeneratingBarcode ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generatsiya"}</Button>
           )}
         </div>
          <p className="text-xs text-muted-foreground">{initialView === "phone" && formData.identifierType === "auto_barcode" ? "Agar generatsiya qilmasangiz, server saqlashda o'zi unikal shtrix-kod yaratadi." : initialView === "accessory" ? "Aksessuarlar uchun shtrix-kod serverda har doim avtomatik generatsiya qilinadi." : ""}</p>
       </div>
     )}

     <div className="space-y-1">
       <Label htmlFor="purchaseDate" className="text-xs font-medium">Olingan sana</Label>
       <Input id="purchaseDate" name="purchaseDate" type="date" value={formData.purchaseDate} onChange={handleChange} disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}/>
     </div>

     <div className="space-y-1">
       <Label htmlFor="defaultKassaId" className="text-xs font-medium">Standart kassa (Omborga kirim uchun)</Label>
       <select id="defaultKassaId" name="defaultKassaId" value={formData.defaultKassaId} onChange={handleChange} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" disabled={isSubmitting || isLoadingKassa}>
         <option value="">Kassa tanlanmagan (Standart kassa ishlatiladi)</option>
         {kassaList.map((kassa) => (<option key={kassa.id} value={kassa.id.toString()}>{kassa.name}</option>))}
       </select>
       {isLoadingKassa && <p className="text-xs text-muted-foreground mt-1">Kassalar ro'yxati yuklanmoqda...</p>}
     </div>

     <div className="space-y-1">
       <Label htmlFor="initialStockQuantity" className="text-xs font-medium">Boshlang'ich miqdor (omborga) {initialView === "phone" && <span className="text-destructive">*</span>}</Label>
       <Input id="initialStockQuantity" name="initialStockQuantity" type="number" min={initialView === "phone" ? "1" : "0"} step="1" value={formData.initialStockQuantity} onChange={handleChange} placeholder={initialView === "phone" ? "Kamida 1" : "0 (ixtiyoriy)"} disabled={isSubmitting}/>
       <p className="text-xs text-muted-foreground">{initialView === "phone" ? "Telefon uchun kamida 1 dona kiritilishi shart." : "Aksessuar uchun miqdor. Agar kiritilmasa 0 deb qabul qilinadi."}</p>
     </div>
   </>
 );

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className={cn("sm:max-w-[580px] max-h-[90vh] overflow-y-auto p-0", "hide-scrollbar")}>
        <div className="p-6 pt-5 sticky top-0 bg-background z-10 border-b">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl font-semibold">{initialView === "phone" ? "Telefon Qo'shish" : "Aksesuar Qo'shish"}</DialogTitle>
            <DialogDescription className="text-sm">Yangi {initialView === "phone" ? "telefon" : "aksesuar"} ma'lumotlarini kiriting. <span className="text-destructive">*</span> bilan belgilangan maydonlar majburiy.</DialogDescription>
          </DialogHeader>
        </div>
        {initialView === "phone" && renderPhoneSubTypeSelector()}

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3">
          {renderIdentifierSelector()}
          {renderCommonFields()}
          
          {initialView === "phone" && (
            <>
              <div className="pt-2 mt-2 border-t">
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Narxlar (Telefon)</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="space-y-1"><Label htmlFor="phonePurchasePriceUzs" className="text-xs">Olingan narx (so'm)</Label><Input id="phonePurchasePriceUzs" name="phonePurchasePriceUzs" type="text" inputMode="decimal" value={formData.phonePurchasePriceUzs} onChange={handleChange} placeholder="Masalan: 5000000" disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}/></div>
                  <div className="space-y-1"><Label htmlFor="phoneSellingPriceUzs" className="text-xs">Sotiladigan narx (so'm) <span className="text-destructive">*</span></Label><Input id="phoneSellingPriceUzs" name="phoneSellingPriceUzs" type="text" inputMode="decimal" value={formData.phoneSellingPriceUzs} onChange={handleChange} placeholder="Masalan: 5500000" disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}/></div>
                  <div className="space-y-1"><Label htmlFor="phonePurchasePriceUsd" className="text-xs">Olingan narx (USD)</Label><Input id="phonePurchasePriceUsd" name="phonePurchasePriceUsd" type="text" inputMode="decimal" value={formData.phonePurchasePriceUsd} onChange={handleChange} placeholder="Masalan: 400.00" disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}/></div>
                  <div className="space-y-1"><Label htmlFor="phoneSellingPriceUsd" className="text-xs">Sotiladigan narx (USD) <span className="text-destructive">*</span></Label><Input id="phoneSellingPriceUsd" name="phoneSellingPriceUsd" type="text" inputMode="decimal" value={formData.phoneSellingPriceUsd} onChange={handleChange} placeholder="Masalan: 450.00" disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}/></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Sotiladigan narxlardan kamida bittasi (so'm yoki USD) 0 yoki undan katta bo'lishi shart.</p>
              </div>
              {selectedPhoneSubType === "android" && (
                <div className="pt-2 mt-2 border-t">
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Qo'shimcha Ma'lumotlar (Android)</h3>
                  <div className="space-y-1"><Label htmlFor="androidCapacityRamStorage" className="text-xs">Xotira Sig'imi (RAM/Ichki)</Label><Input id="androidCapacityRamStorage" name="androidCapacityRamStorage" value={formData.androidCapacityRamStorage} onChange={handleChange} placeholder="Masalan: 8/256GB yoki 128GB" disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}/></div>
                </div>
              )}
              {selectedPhoneSubType === "iphone" && (
                <div className="pt-2 mt-2 border-t space-y-3">
                  <h3 className="text-sm font-semibold mb-1 text-muted-foreground">Qo'shimcha Ma'lumotlar (iPhone)</h3>
                  <div className="space-y-1"><Label htmlFor="iphoneColor" className="text-xs">Rangi <span className="text-destructive">*</span></Label><Input id="iphoneColor" name="iphoneColor" value={formData.iphoneColor} onChange={handleChange} placeholder="Masalan: Natural Titanium, Blue, Midnight" required={selectedPhoneSubType === "iphone"} disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}/></div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div className="space-y-1"><Label htmlFor="iphoneCapacityStorage" className="text-xs">Xotira Sig'imi (GB) <span className="text-destructive">*</span></Label><Input id="iphoneCapacityStorage" name="iphoneCapacityStorage" type="text" inputMode="numeric" value={formData.iphoneCapacityStorage} onChange={handleChange} placeholder="Masalan: 256 (faqat raqam)" required={selectedPhoneSubType === "iphone"} disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}/></div>
                    <div className="space-y-1"><Label htmlFor="iphoneBatteryHealth" className="text-xs">Batareya Holati (%)</Label><Input id="iphoneBatteryHealth" name="iphoneBatteryHealth" type="text" inputMode="numeric" value={formData.iphoneBatteryHealth} onChange={handleChange} placeholder="Masalan: 85 (0-100 oralig'ida)" disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}/></div>
                  </div>
                  <div className="space-y-1"><Label htmlFor="iphoneSeriesRegion" className="text-xs">Model Seriyasi (Region)</Label><Input id="iphoneSeriesRegion" name="iphoneSeriesRegion" value={formData.iphoneSeriesRegion} onChange={handleChange} placeholder="Masalan: LL/A (USA), ZP/A (Hong Kong)" disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}/></div>
                </div>
              )}
            </>
          )}
          {initialView === "accessory" && (
            <div className="pt-2 mt-2 border-t space-y-3">
              <h3 className="text-sm font-semibold mb-1 text-muted-foreground">Narxlar va Qo'shimcha Ma'lumotlar (Aksesuar)</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="space-y-1">
                    <Label htmlFor="accessoryPurchasePriceUzs" className="text-xs">Olingan narx (so'm)</Label>
                    <Input id="accessoryPurchasePriceUzs" name="accessoryPurchasePriceUzs" type="text" inputMode="decimal" value={formData.accessoryPurchasePriceUzs} onChange={handleChange} placeholder="Masalan: 100000" disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}/>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="accessoryPriceUzs" className="text-xs">Sotiladigan narx (so'm) <span className="text-destructive">*</span></Label>
                    <Input id="accessoryPriceUzs" name="accessoryPriceUzs" type="text" inputMode="decimal" value={formData.accessoryPriceUzs} onChange={handleChange} placeholder="Masalan: 150000" disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}/>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="accessoryPurchasePriceUsd" className="text-xs">Olingan narx (USD)</Label>
                    <Input id="accessoryPurchasePriceUsd" name="accessoryPurchasePriceUsd" type="text" inputMode="decimal" value={formData.accessoryPurchasePriceUsd} onChange={handleChange} placeholder="Masalan: 8.00" disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}/>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="accessoryPriceUsd" className="text-xs">Sotiladigan narx (USD) <span className="text-destructive">*</span></Label>
                    <Input id="accessoryPriceUsd" name="accessoryPriceUsd" type="text" inputMode="decimal" value={formData.accessoryPriceUsd} onChange={handleChange} placeholder="Masalan: 12.00" disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}/>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Sotiladigan narxlardan kamida bittasi (so'm yoki USD) 0 yoki undan katta bo'lishi shart. Olingan narxlar ixtiyoriy.</p>
              
              <div className="space-y-1"><Label htmlFor="accessoryColor" className="text-xs">Rangi</Label><Input id="accessoryColor" name="accessoryColor" value={formData.accessoryColor} onChange={handleChange} placeholder="Qora, Oq, Pushti" disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}/></div>
              <div className="space-y-1"><Label htmlFor="accessoryDescription" className="text-xs">Qo'shimcha Izoh</Label><Textarea id="accessoryDescription" name="accessoryDescription" value={formData.accessoryDescription} onChange={handleChange} rows={2} placeholder="Materiali, Brendi, Mosligi va hk." disabled={isSubmitting || isLoadingCategories || isGeneratingBarcode || isLoadingKassa}/></div>
            </div>
          )}
          <DialogFooter className="pt-5 border-t mt-4 sticky bottom-0 bg-background pb-6 px-6 z-10">
            <Button type="button" variant="outline" onClick={handleDialogClose} disabled={isSubmitting || isGeneratingBarcode}>Bekor qilish</Button>
            <Button type="submit" disabled={isSubmitting || isLoadingCategories || isLoadingKassa}>
              {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saqlanmoqda...</>) :
              isLoadingCategories || isLoadingKassa ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Yuklanmoqda...</>) :
              ("Saqlash")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}