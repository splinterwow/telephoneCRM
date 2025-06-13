import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Aksessuar description uchun
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "axios";
import { Loader2, User, Phone } from "lucide-react";

const API_URL_PRODUCTS = "https://smartphone777.pythonanywhere.com/api/products/";

interface Product {
  id: number;
  name: string;
  category: number;
  category_name?: string;
  barcode?: string | null;
  identifier_type?: string;
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
  // Backenddan keladigan mijoz ma'lumotlari uchun nomlar (agar boshqacha bo'lsa, to'g'rilang)
  supplier_name_manual?: string | null; 
  supplier_phone_manual?: string | null;
  // Agar API dan `customer_full_name` va `customer_phone_number` kelsa, ularni ham qo'shing
  // customer_full_name?: string | null; 
  // customer_phone_number?: string | null;
}

interface EditFormData {
  name: string;
  supplierNameManual: string; // `customerFullName` o'rniga
  supplierPhoneManual: string; // `customerPhoneNumber` o'rniga
  purchaseDate: string;
  barcode: string;
  identifier_type: string;
  
  purchasePriceUsd: string; // `phonePurchasePriceUsd` o'rniga (umumiyroq)
  purchasePriceUzs: string; // `phonePurchasePriceUzs` o'rniga
  sellingPriceUsd: string;  // `phoneSellingPriceUsd` o'rniga
  sellingPriceUzs: string;  // `phoneSellingPriceUzs` o'rniga

  // Telefon hususiyatlari
  androidCapacityRamStorage: string;
  iphoneColor: string;
  iphoneCapacityStorage: string;
  iphoneBatteryHealth: string;
  iphoneSeriesRegion: string;

  // Aksessuar hususiyatlari
  accessoryColor: string;
  accessoryDescription: string;
}

const initialFormData: EditFormData = {
  name: "",
  supplierNameManual: "",
  supplierPhoneManual: "",
  purchaseDate: "", // Bo'sh qoldiramiz, useEffect da to'ldiriladi
  barcode: "",
  identifier_type: "auto_barcode",
  purchasePriceUsd: "",
  purchasePriceUzs: "",
  sellingPriceUsd: "",
  sellingPriceUzs: "",
  androidCapacityRamStorage: "",
  iphoneColor: "",
  iphoneCapacityStorage: "",
  iphoneBatteryHealth: "",
  iphoneSeriesRegion: "",
  accessoryColor: "",
  accessoryDescription: "",
};

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onProductSuccessfullyEdited: (editedProduct: Product) => void;
}

const determineProductMode = (product: Product | null): "android" | "iphone" | "accessory" => {
    if (!product) return "accessory"; // Default
    const categoryName = product.category_name?.toLowerCase() || "";
    const productName = product.name?.toLowerCase() || "";

    if (categoryName.includes("iphone") || productName.toLowerCase().startsWith("iphone")) {
        return "iphone";
    }
    // Aksessuarni telefondan oldin tekshirish muhimroq bo'lishi mumkin
    if (categoryName.includes("accessory") || categoryName.includes("aksesuar")) {
        return "accessory";
    }
    if (categoryName.includes("android") || categoryName.includes("phone") || categoryName.includes("telefon")) {
        return "android";
    }
    // Agar hech biri topilmasa, kategoriyaga qarab (agar is_accessory_category bo'lsa)
    // Bu joyni `AddProductDialog` dagi `findCategoryIdFromApi` bilan moslashtirish kerak bo'lishi mumkin
    // Hozircha oddiy qoldiramiz
    return "accessory"; // Yoki "android" default
};


export function EditProductDialog({
  open,
  onOpenChange,
  product,
  onProductSuccessfullyEdited,
}: EditProductDialogProps) {
  const [formData, setFormData] = useState<EditFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<"android" | "iphone" | "accessory">("accessory");

  useEffect(() => {
    if (product && open) {
      const determinedMode = determineProductMode(product);
      setMode(determinedMode);
      
      let initialIphoneCapacity = "";
      if (determinedMode === "iphone" && product.storage_capacity) {
        const match = product.storage_capacity.match(/(\d+)/); // Faqat raqamni olish
        initialIphoneCapacity = match ? match[1] : "";
      }

      setFormData({
        name: product.name || "",
        // Backenddan keladigan nomlar bilan moslashtiring:
        supplierNameManual: product.supplier_name_manual || "", 
        supplierPhoneManual: product.supplier_phone_manual || "",
        // supplierNameManual: product.customer_full_name || "", // Agar API shunday qaytarsa
        // supplierPhoneManual: product.customer_phone_number || "", // Agar API shunday qaytarsa
        purchaseDate: product.purchase_date ? product.purchase_date.split("T")[0] : "",
        barcode: product.barcode || "",
        identifier_type: product.identifier_type || (determinedMode === "accessory" ? "auto_barcode" : "auto_barcode"), // Aksessuar uchun default
        
        purchasePriceUsd: product.purchase_price_usd || "",
        purchasePriceUzs: product.purchase_price_uzs || "",
        sellingPriceUsd: product.price_usd || "",
        sellingPriceUzs: product.price_uzs || "",
        
        androidCapacityRamStorage: determinedMode === "android" ? (product.storage_capacity || "") : "",
        iphoneCapacityStorage: initialIphoneCapacity,
        iphoneColor: determinedMode === "iphone" ? (product.color || "") : "",
        iphoneBatteryHealth: determinedMode === "iphone" ? (product.battery_health || "") : "",
        iphoneSeriesRegion: determinedMode === "iphone" ? (product.series_region || "") : "",

        accessoryColor: determinedMode === "accessory" ? (product.color || "") : "",
        accessoryDescription: determinedMode === "accessory" ? (product.description || "") : "",
      });
    } else if (!open) {
      setFormData(initialFormData); // Dialog yopilganda formani tozalash
      setMode("accessory");
    }
  }, [product, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleIdentifierTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, identifier_type: value, barcode: value === "auto_barcode" ? prev.barcode : "" })); // Agar avto bo'lsa, shtrixkodni o'zgartirmaymiz, aks holda tozalaymiz
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setIsSubmitting(true);

    if (!formData.name.trim()) {
        toast.error("Mahsulot nomi kiritilishi shart.");
        setIsSubmitting(false); return;
    }

    // Narx validatsiyasi
    const sellingPriceUzsNum = parseFloat(formData.sellingPriceUzs);
    const sellingPriceUsdNum = parseFloat(formData.sellingPriceUsd);
    if ((isNaN(sellingPriceUzsNum) || sellingPriceUzsNum < 0) && (isNaN(sellingPriceUsdNum) || sellingPriceUsdNum < 0)) {
        toast.error("Sotiladigan narxlardan kamida bittasi (so'm yoki USD) 0 yoki undan katta bo'lishi shart.");
        setIsSubmitting(false); return;
    }
    
    // Telefon uchun maxsus validatsiyalar
    if (mode === "iphone" || mode === "android") {
        if (!formData.supplierNameManual.trim()) { toast.error("Telefon uchun mijoz ismi kiritilishi shart."); setIsSubmitting(false); return; }
        if (!formData.supplierPhoneManual.trim()) { toast.error("Telefon uchun mijoz telefon raqami kiritilishi shart."); setIsSubmitting(false); return; }
        if (!formData.identifier_type) { toast.error("Identifikator turi tanlanishi shart."); setIsSubmitting(false); return; }
        if (!formData.barcode.trim() && formData.identifier_type !== 'auto_barcode') {
            toast.error("Shtrix kod / IMEI kiritilishi shart (Avto-shtrixdan tashqari).");
            setIsSubmitting(false); return;
        }
    }
    if (mode === "iphone") {
        if (!formData.iphoneCapacityStorage.trim()) { toast.error("iPhone uchun Sig'im (GB) kiritilishi shart."); setIsSubmitting(false); return; }
        if (!formData.iphoneColor.trim()) { toast.error("iPhone uchun Rang kiritilishi shart."); setIsSubmitting(false); return; }
    }


    const formatPriceForPayload = (priceStr: string, isUsd: boolean = false): string | null => {
        if (!priceStr.trim()) return null;
        const num = parseFloat(priceStr.replace(/\s/g, '').replace(/,/g, '.'));
        if (isNaN(num) || num < 0) return null; // Yoki xatolik qaytarish
        return isUsd ? num.toFixed(2) : num.toFixed(0);
    };

    const payload: any = {
      // id: product.id, // PUT/PATCH so'rovida URL da bo'ladi, payload da kerak emas odatda
      name: formData.name.trim(),
      supplier_name_manual: formData.supplierNameManual.trim() || null,
      supplier_phone_manual: formData.supplierPhoneManual.trim() || null,
      category: product.category, // Kategoriya o'zgartirilmaydi deb hisoblaymiz
      purchase_date: formData.purchaseDate || null,
      
      purchase_price_usd: formatPriceForPayload(formData.purchasePriceUsd, true),
      purchase_price_uzs: formatPriceForPayload(formData.purchasePriceUzs),
      price_usd: formatPriceForPayload(formData.sellingPriceUsd, true),
      price_uzs: formatPriceForPayload(formData.sellingPriceUzs),
      
      is_active: product.is_active, // Aktivlik statusi o'zgartirilmaydi bu formada
    };

    if (mode === "android" || mode === "iphone") {
        payload.identifier_type = formData.identifier_type;
        payload.barcode = formData.identifier_type === 'auto_barcode' && !formData.barcode.trim() 
                            ? product.barcode // Agar avto va bo'sh bo'lsa, eskini qoldiramiz
                            : formData.barcode.trim().toUpperCase() || null;
    } else { // Aksessuar
        payload.identifier_type = product.identifier_type || 'auto_barcode'; // Aksessuar uchun shtrix o'zgartirilmaydi
        payload.barcode = product.barcode || null; // Aksessuar uchun shtrix o'zgartirilmaydi
    }


    if (mode === "android") {
      payload.storage_capacity = formData.androidCapacityRamStorage.trim() || null;
      payload.color = product.color; // Android uchun rang formadan olinmayapti
      payload.battery_health = null;
      payload.series_region = null;
      payload.description = product.description; // Android uchun tavsif formadan olinmayapti
    } else if (mode === "iphone") {
      payload.color = formData.iphoneColor.trim();
      payload.storage_capacity = `${formData.iphoneCapacityStorage.trim()}GB`;
      const batteryNum = parseFloat(formData.iphoneBatteryHealth);
      payload.battery_health = (!isNaN(batteryNum) && batteryNum >=0 && batteryNum <= 100) ? batteryNum.toFixed(0) : null;
      payload.series_region = formData.iphoneSeriesRegion.trim() || null;
      payload.description = product.description; // iPhone uchun tavsif formadan olinmayapti
    } else if (mode === "accessory") {
      payload.color = formData.accessoryColor.trim() || null;
      payload.description = formData.accessoryDescription.trim() || null;
      payload.storage_capacity = null;
      payload.battery_health = null;
      payload.series_region = null;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Avtorizatsiya tokeni topilmadi.");
        setIsSubmitting(false); return;
      }
      // PATCH so'rovini ishlatish yaxshiroq, faqat o'zgargan maydonlarni yuboradi
      const response = await axios.patch(`${API_URL_PRODUCTS}${product.id}/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`"${response.data.name}" muvaffaqiyatli tahrirlandi.`);
      onProductSuccessfullyEdited(response.data as Product);
      onOpenChange(false);
    } catch (err: any) {
      let errorMessage = `"${formData.name}" ni tahrirlashda xato: `;
      if (err.response?.data && typeof err.response.data === 'object') {
        Object.keys(err.response.data).forEach((key) => {
          errorMessage += `${key}: ${ Array.isArray(err.response.data[key]) ? err.response.data[key].join(", ") : err.response.data[key]}. `;
        });
      } else {
        errorMessage += err.response?.data?.detail || err.message || "Noma'lum server xatosi.";
      }
      toast.error(errorMessage.trim(), { duration: 7000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogClose = () => {
    if (isSubmitting) return;
    onOpenChange(false);
  };

  if (!product) return null;

  const dialogDescriptionId = "edit-product-dialog-description";

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto p-0 hide-scrollbar" aria-describedby={dialogDescriptionId}>
        <div className="p-6 pt-5 sticky top-0 bg-background z-10 border-b">
          <DialogHeader className="mb-2">
            <DialogTitle>Mahsulot Tahrirlash: {product.name}</DialogTitle>
            <DialogDescription id={dialogDescriptionId}>
             {mode === "accessory" ? "Aksesuar ma'lumotlarini tahrirlang." : 
             mode === "android" ? "Android qurilma ma'lumotlarini tahrirlang." : "iPhone ma'lumotlarini tahrirlang."}
            </DialogDescription>
          </DialogHeader>
        </div>

          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name-edit"> Nomi <span className="text-destructive">*</span> </Label>
              <Input id="name-edit" name="name" value={formData.name} onChange={handleChange} required 
                   placeholder={mode === "accessory" ? "Masalan: Chexol iPhone 15 uchun" : 
                                mode === 'android' ? "Masalan: Samsung Galaxy S23" : "Masalan: iPhone 15 Pro Max"}/>
            </div>

            { (mode === "iphone" || mode === "android") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                    <div className="space-y-1">
                        <Label htmlFor="identifier_type-edit">Identifikator Turi <span className="text-destructive">*</span></Label>
                        <Select value={formData.identifier_type} onValueChange={handleIdentifierTypeChange}>
                        <SelectTrigger id="identifier_type-edit" className="w-full">
                            <SelectValue placeholder="Turni tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="auto_barcode">Shtrix (Avto)</SelectItem>
                            <SelectItem value="manual_barcode_unique">Shtrix (Unikal)</SelectItem> {/* custom_barcode -> manual_barcode_unique */}
                            <SelectItem value="manual_imei">IMEI (Qo'lda)</SelectItem> {/* imei -> manual_imei */}
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="barcode-edit">Shtrix Kod / IMEI 
                            {formData.identifier_type !== 'auto_barcode' && <span className="text-destructive">*</span>}
                        </Label>
                        <Input id="barcode-edit" name="barcode" value={formData.barcode} onChange={handleChange} placeholder="Shtrix kod yoki IMEI"
                            required={formData.identifier_type !== 'auto_barcode'}
                            disabled={formData.identifier_type === 'auto_barcode'} />
                        {formData.identifier_type === 'auto_barcode' && 
                            <p className="text-xs text-muted-foreground">{formData.barcode ? "Avtomatik generatsiya qilingan." : "Saqlashda avtomatik generatsiya qilinadi."}</p>}
                    </div>
                </div>
            )}
            {mode === "accessory" && (
                <div className="space-y-1">
                    <Label htmlFor="barcode-accessory-display">Shtrix Kod (Aksesuar)</Label>
                    <Input id="barcode-accessory-display" value={formData.barcode || "Avtomatik generatsiya qilingan"} readOnly className="bg-muted/50 cursor-default"/>
                </div>
            )}

            <div className="space-y-1">
                <Label htmlFor="purchaseDate-edit">Olingan sana</Label>
                <Input id="purchaseDate-edit" name="purchaseDate" type="date" value={formData.purchaseDate} onChange={handleChange}/>
            </div>

            {/* Mijoz ma'lumotlari bo'limi */}
            <div className="pt-2 mt-2 border-t">
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground"> Mijoz Ma'lumotlari (Kirimdan) </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                <div className="space-y-1">
                  <Label htmlFor="supplierNameManual-edit" className="text-xs font-medium"> 
                    Mijoz Ism Familiyasi {(mode === 'iphone' || mode === 'android') && <span className="text-destructive">*</span>}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="supplierNameManual-edit" name="supplierNameManual" value={formData.supplierNameManual} onChange={handleChange}
                      placeholder="Masalan: Alisher Valiev" className="pl-8" disabled={isSubmitting}/>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="supplierPhoneManual-edit" className="text-xs font-medium"> 
                    Mijoz Telefon Raqami {(mode === 'iphone' || mode === 'android') && <span className="text-destructive">*</span>}
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="supplierPhoneManual-edit" name="supplierPhoneManual" type="tel" value={formData.supplierPhoneManual} onChange={handleChange}
                      placeholder="Masalan: +998901234567" className="pl-8" disabled={isSubmitting}/>
                  </div>
                </div>
              </div>
            </div>

            {/* Narxlar bo'limi */}
            <div className="pt-2 mt-2 border-t">
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Narxlar</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="space-y-1">
                  <Label htmlFor="purchasePriceUsd-edit" className="text-xs">Olingan ($)</Label>
                  <Input id="purchasePriceUsd-edit" name="purchasePriceUsd" type="text" inputMode="decimal" value={formData.purchasePriceUsd} onChange={handleChange} placeholder="0.00"/>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="purchasePriceUzs-edit" className="text-xs">Olingan (so'm)</Label>
                  <Input id="purchasePriceUzs-edit" name="purchasePriceUzs" type="text" inputMode="decimal" value={formData.purchasePriceUzs} onChange={handleChange} placeholder="0"/>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sellingPriceUsd-edit" className="text-xs"> Sotiladigan ($) <span className="text-destructive">*</span> </Label>
                  <Input id="sellingPriceUsd-edit" name="sellingPriceUsd" type="text" inputMode="decimal" value={formData.sellingPriceUsd} onChange={handleChange} placeholder="0.00"/>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sellingPriceUzs-edit" className="text-xs"> Sotiladigan (so'm) <span className="text-destructive">*</span> </Label>
                  <Input id="sellingPriceUzs-edit" name="sellingPriceUzs" type="text" inputMode="decimal" value={formData.sellingPriceUzs} onChange={handleChange} placeholder="0"/>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1"> Sotiladigan narxlardan kamida bittasi (so'm yoki USD) 0 yoki undan katta bo'lishi shart. </p>
            </div>

            {/* Android uchun qo'shimcha maydonlar */}
            {mode === "android" && (
              <div className="pt-2 mt-2 border-t">
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Qo'shimcha (Android)</h3>
                <div className="space-y-1">
                  <Label htmlFor="androidCapacityRamStorage-edit">Sig'imi (RAM/Xotira)</Label>
                  <Input id="androidCapacityRamStorage-edit" name="androidCapacityRamStorage" value={formData.androidCapacityRamStorage} onChange={handleChange} placeholder="Masalan: 8/256GB yoki 256GB"/>
                </div>
                {/* Android uchun rang va tavsif kabi maydonlar kerak bo'lsa, shu yerga qo'shing */}
              </div>
            )}

            {/* iPhone uchun qo'shimcha maydonlar */}
            {mode === "iphone" && (
              <div className="pt-2 mt-2 border-t space-y-3">
                <h3 className="text-sm font-semibold mb-1 text-muted-foreground">Qo'shimcha (iPhone)</h3>
                <div className="space-y-1">
                  <Label htmlFor="iphoneColor-edit">Rangi <span className="text-destructive">*</span></Label>
                  <Input id="iphoneColor-edit" name="iphoneColor" value={formData.iphoneColor} onChange={handleChange} placeholder="Masalan: Natural Titanium" required={mode === 'iphone'}/>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="iphoneCapacityStorage-edit">Sig'imi (GB) <span className="text-destructive">*</span></Label>
                    <Input id="iphoneCapacityStorage-edit" name="iphoneCapacityStorage" type="text" inputMode="numeric" value={formData.iphoneCapacityStorage} onChange={handleChange} placeholder="Masalan: 256" required={mode === 'iphone'}/>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="iphoneBatteryHealth-edit">Batareya (%)</Label>
                    <Input id="iphoneBatteryHealth-edit" name="iphoneBatteryHealth" type="text" inputMode="numeric" value={formData.iphoneBatteryHealth} onChange={handleChange} placeholder="Masalan: 85"/>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="iphoneSeriesRegion-edit">Seriyasi (Region)</Label>
                  <Input id="iphoneSeriesRegion-edit" name="iphoneSeriesRegion" value={formData.iphoneSeriesRegion} onChange={handleChange} placeholder="Masalan: LL/A (USA)"/>
                </div>
                 {/* iPhone uchun tavsif kabi maydonlar kerak bo'lsa, shu yerga qo'shing */}
              </div>
            )}
            
            {/* Aksessuar uchun qo'shimcha maydonlar */}
            {mode === "accessory" && (
              <div className="pt-2 mt-2 border-t space-y-3">
                <h3 className="text-sm font-semibold mb-1 text-muted-foreground">Qo'shimcha (Aksesuar)</h3>
                 <div className="space-y-1">
                  <Label htmlFor="accessoryColor-edit">Rangi</Label>
                  <Input id="accessoryColor-edit" name="accessoryColor" value={formData.accessoryColor} onChange={handleChange} placeholder="Qora, Oq, Pushti"/>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="accessoryDescription-edit">Qo'shimcha Izoh</Label>
                  <Textarea id="accessoryDescription-edit" name="accessoryDescription" value={formData.accessoryDescription} onChange={handleChange} rows={3} placeholder="Materiali, Brendi, Mosligi va hk."/>
                </div>
              </div>
            )}

            <DialogFooter className="pt-5 border-t mt-4 sticky bottom-0 bg-background pb-6 px-6 z-10">
              <Button type="button" variant="outline" onClick={handleDialogClose} disabled={isSubmitting}>Bekor qilish</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saqlanmoqda...</> : "Saqlash"}
              </Button>
            </DialogFooter>
          </form>
      </DialogContent>
    </Dialog>
  );
}