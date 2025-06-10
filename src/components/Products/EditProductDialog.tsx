import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription, // Import qilindi
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// >>> Select komponentlarini import qilish <<<
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// >>> <<<
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
  identifier_type?: string; // Yoki IdentifierType
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
  customer_full_name?: string | null;
  customer_phone_number?: string | null;
}

interface EditFormData {
  name: string;
  customerFullName: string;
  customerPhoneNumber: string;
  purchaseDate: string;
  barcode: string;
  identifier_type: string; // string yoki IdentifierType
  phonePurchasePriceUsd: string;
  phonePurchasePriceUzs: string;
  phoneSellingPriceUsd: string;
  phoneSellingPriceUzs: string;
  androidCapacityRamStorage: string;
  iphoneColor: string;
  iphoneCapacityStorage: string;
  iphoneBatteryHealth: string;
  iphoneSeriesRegion: string;
}

const initialFormData: EditFormData = {
  name: "",
  customerFullName: "",
  customerPhoneNumber: "",
  purchaseDate: new Date().toISOString().split("T")[0],
  barcode: "",
  identifier_type: "auto_barcode",
  phonePurchasePriceUsd: "",
  phonePurchasePriceUzs: "",
  phoneSellingPriceUsd: "",
  phoneSellingPriceUzs: "",
  androidCapacityRamStorage: "",
  iphoneColor: "",
  iphoneCapacityStorage: "",
  iphoneBatteryHealth: "",
  iphoneSeriesRegion: "",
};

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onProductSuccessfullyEdited: (editedProduct: Product) => void;
}

// determineProductMode va handleIdentifierTypeChange funksiyalarini avvalgi koddan oling
const determineProductMode = (product: Product | null): "android" | "iphone" | "accessory" => {
    if (!product) return "android";
    const categoryName = product.category_name?.toLowerCase() || "";
    const productName = product.name?.toLowerCase() || "";

    if (categoryName.includes("iphone") || productName.toLowerCase().startsWith("iphone")) {
        return "iphone";
    }
    if (categoryName.includes("accessory") || categoryName.includes("aksesuar")) {
        return "accessory";
    }
    if (categoryName.includes("phone") || categoryName.includes("telefon") || categoryName.includes("android")) {
        return "android";
    }
    return "accessory";
};


export function EditProductDialog({
  open,
  onOpenChange,
  product,
  onProductSuccessfullyEdited,
}: EditProductDialogProps) {
  const [formData, setFormData] = useState<EditFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<"android" | "iphone" | "accessory">("android");

  useEffect(() => {
    if (product && open) {
      const determinedMode = determineProductMode(product);
      setMode(determinedMode);
      let initialIphoneCapacity = "";
      let initialAndroidCapacity = "";
      if (determinedMode === "iphone" && product.storage_capacity) {
        const match = product.storage_capacity.match(/(\d+)\s*GB/i);
        initialIphoneCapacity = match ? match[1] : product.storage_capacity;
      } else if (determinedMode === "android" && product.storage_capacity) {
        initialAndroidCapacity = product.storage_capacity;
      }

      setFormData({
        name: product.name || "",
        customerFullName: product.customer_full_name || "",
        customerPhoneNumber: product.customer_phone_number || "",
        purchaseDate: product.purchase_date ? product.purchase_date.split("T")[0] : new Date().toISOString().split("T")[0],
        barcode: product.barcode || "",
        identifier_type: product.identifier_type || "auto_barcode",
        phonePurchasePriceUsd: product.purchase_price_usd || "",
        phonePurchasePriceUzs: product.purchase_price_uzs || "",
        phoneSellingPriceUsd: product.price_usd || "",
        phoneSellingPriceUzs: product.price_uzs || "",
        androidCapacityRamStorage: initialAndroidCapacity,
        iphoneCapacityStorage: initialIphoneCapacity,
        iphoneColor: product.color || "",
        iphoneBatteryHealth: product.battery_health || "",
        iphoneSeriesRegion: product.series_region || "",
      });
    } else if (!open) {
      setFormData(initialFormData);
      setMode("android");
    }
  }, [product, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleIdentifierTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, identifier_type: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setIsSubmitting(true);

    const isAccessory = mode === "accessory";
    if (!formData.name.trim()) {
        toast.error("Mahsulot nomi kiritilishi shart.");
        setIsSubmitting(false); return;
    }
    if (!isAccessory && !formData.identifier_type) {
        toast.error("Identifikator turi tanlanishi shart.");
        setIsSubmitting(false); return;
    }
    if (!isAccessory && !formData.barcode.trim() && formData.identifier_type !== 'auto_barcode') {
        toast.error("Shtrix kod / IMEI kiritilishi shart (Avto-shtrixdan tashqari).");
        setIsSubmitting(false); return;
    }
    if (!isAccessory) {
        const sellingPriceUzs = parseFloat(formData.phoneSellingPriceUzs);
        const sellingPriceUsd = parseFloat(formData.phoneSellingPriceUsd);
        if ((isNaN(sellingPriceUzs) || sellingPriceUzs <= 0) && (isNaN(sellingPriceUsd) || sellingPriceUsd <= 0)) {
            toast.error("Telefon uchun sotiladigan narxlardan kamida bittasi (so'm yoki USD) 0 dan katta bo'lishi shart.");
            setIsSubmitting(false); return;
        }
    } else {
        const accessoryPriceUzs = parseFloat(formData.phoneSellingPriceUzs);
        const accessoryPriceUsd = parseFloat(formData.phoneSellingPriceUsd);
         if ((isNaN(accessoryPriceUzs) || accessoryPriceUzs <= 0) && (isNaN(accessoryPriceUsd) || accessoryPriceUsd <= 0)) {
            toast.error("Aksesuar uchun sotiladigan narxlardan kamida bittasi (so'm yoki USD) 0 dan katta bo'lishi shart.");
            setIsSubmitting(false); return;
        }
    }

    const payload: any = {
      id: product.id,
      name: formData.name.trim(),
      customer_full_name: formData.customerFullName.trim() || null,
      customer_phone_number: formData.customerPhoneNumber.trim() || null,
      category: product.category,
      purchase_date: formData.purchaseDate || null,
      identifier_type: isAccessory ? product.identifier_type || 'auto_barcode' : formData.identifier_type,
      barcode: isAccessory 
                ? product.barcode || null
                : (formData.identifier_type === 'auto_barcode' && !formData.barcode.trim() 
                    ? null 
                    : formData.barcode.trim() || null),
      purchase_price_usd: formData.phonePurchasePriceUsd ? Number(formData.phonePurchasePriceUsd) : null,
      purchase_price_uzs: formData.phonePurchasePriceUzs ? Number(formData.phonePurchasePriceUzs) : null,
      price_usd: formData.phoneSellingPriceUsd ? Number(formData.phoneSellingPriceUsd) : null,
      price_uzs: formData.phoneSellingPriceUzs ? Number(formData.phoneSellingPriceUzs) : null,
      is_active: product.is_active,
      description: product.description,
    };

    if (mode === "android") {
      payload.storage_capacity = formData.androidCapacityRamStorage.trim() || null;
      payload.color = product.color; 
      payload.battery_health = null;
      payload.series_region = null;
    } else if (mode === "iphone") {
      if (!formData.iphoneCapacityStorage.trim()) { toast.error("iPhone uchun Sig'im (GB) kiritilishi shart."); setIsSubmitting(false); return; }
      if (!formData.iphoneColor.trim()) { toast.error("iPhone uchun Rang kiritilishi shart."); setIsSubmitting(false); return; }
      
      payload.color = formData.iphoneColor.trim();
      payload.storage_capacity = `${formData.iphoneCapacityStorage.trim()}GB`;
      payload.battery_health = formData.iphoneBatteryHealth ? Number(formData.iphoneBatteryHealth) : null;
      payload.series_region = formData.iphoneSeriesRegion.trim() || null;
    } else if (mode === "accessory") {
      payload.color = product.color; 
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
      const response = await axios.put(`${API_URL_PRODUCTS}${product.id}/`, payload, {
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
  const isAccessory = mode === "accessory";

  const dialogDescriptionId = "edit-product-dialog-description"; // ID DialogDescription uchun

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      {/* aria-describedby ni DialogContent ga qo'shish */}
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto p-0" aria-describedby={dialogDescriptionId}>
        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle>Mahsulot Tahrirlash: {product.name}</DialogTitle>
            {/* DialogDescription ga id berish */}
            <DialogDescription id={dialogDescriptionId}>
             {isAccessory ? "Aksesuar ma'lumotlarini tahrirlang." : 
             mode === "android" ? "Android qurilma ma'lumotlarini tahrirlang." : "iPhone ma'lumotlarini tahrirlang."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name-edit"> Nomi <span className="text-destructive">*</span> </Label>
              <Input id="name-edit" name="name" value={formData.name} onChange={handleChange} required 
                   placeholder={isAccessory ? "Masalan: Chexol iPhone 15 uchun" : 
                                mode === 'android' ? "Masalan: Samsung Galaxy S23" : "Masalan: iPhone 15 Pro Max"}/>
            </div>

            {!isAccessory && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div className="space-y-1">
                        <Label htmlFor="identifier_type-edit">Identifikator Turi <span className="text-destructive">*</span></Label>
                        {/* BU YERDA Select komponenti ishlatiladi */}
                        <Select value={formData.identifier_type} onValueChange={handleIdentifierTypeChange}>
                        <SelectTrigger id="identifier_type-edit" className="w-full">
                            <SelectValue placeholder="Turni tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="auto_barcode">Shtrix (Avto)</SelectItem>
                            <SelectItem value="custom_barcode">Shtrix (Unikal)</SelectItem>
                            <SelectItem value="imei">IMEI (Qo'lda)</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="barcode-edit">Shtrix Kod / IMEI 
                            {formData.identifier_type !== 'auto_barcode' && <span className="text-destructive">*</span>}
                        </Label>
                        <Input id="barcode-edit" name="barcode" value={formData.barcode} onChange={handleChange} placeholder="Shtrix kod yoki IMEI"
                            required={formData.identifier_type !== 'auto_barcode'}
                            disabled={formData.identifier_type === 'auto_barcode' && !product.barcode} />
                        {formData.identifier_type === 'auto_barcode' && 
                            <p className="text-xs text-muted-foreground">Avtomatik generatsiya qilingan yoki qilinadi.</p>}
                    </div>
                </div>
            )}
            {isAccessory && (
                <div className="space-y-1">
                    <Label htmlFor="barcode-accessory-display">Shtrix Kod (Aksesuar)</Label>
                    <Input id="barcode-accessory-display" value={product.barcode || "Avtomatik generatsiya qilingan"} readOnly className="bg-muted/50 cursor-default"/>
                </div>
            )}

            <div className="space-y-1">
                <Label htmlFor="purchaseDate-edit">Olingan sana</Label>
                <Input id="purchaseDate-edit" name="purchaseDate" type="date" value={formData.purchaseDate} onChange={handleChange}/>
            </div>

            <div className="pt-2 mt-2 border-t">
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground"> Mijoz Ma'lumotlari (Kirimdan) </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                <div className="space-y-1">
                  <Label htmlFor="customerFullName-edit" className="text-xs font-medium"> Mijoz Ism Familiyasi </Label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="customerFullName-edit" name="customerFullName" value={formData.customerFullName} onChange={handleChange}
                      placeholder="Masalan: Alisher Valiev" className="pl-8" disabled={isSubmitting}/>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="customerPhoneNumber-edit" className="text-xs font-medium"> Mijoz Telefon Raqami </Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="customerPhoneNumber-edit" name="customerPhoneNumber" type="tel" value={formData.customerPhoneNumber} onChange={handleChange}
                      placeholder="Masalan: +998901234567" className="pl-8" disabled={isSubmitting}/>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 mt-2 border-t">
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Narxlar</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="space-y-1">
                  <Label htmlFor="phonePurchasePriceUsd-edit" className="text-xs">Olingan ($)</Label>
                  <Input id="phonePurchasePriceUsd-edit" name="phonePurchasePriceUsd" type="number" step="0.01" min="0" value={formData.phonePurchasePriceUsd} onChange={handleChange} placeholder="0.00"/>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phonePurchasePriceUzs-edit" className="text-xs">Olingan (so'm)</Label>
                  <Input id="phonePurchasePriceUzs-edit" name="phonePurchasePriceUzs" type="number" min="0" value={formData.phonePurchasePriceUzs} onChange={handleChange} placeholder="0"/>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phoneSellingPriceUsd-edit" className="text-xs"> Sotiladigan ($) { !isAccessory && <span className="text-destructive">*</span>} </Label>
                  <Input id="phoneSellingPriceUsd-edit" name="phoneSellingPriceUsd" type="number" step="0.01" min="0" value={formData.phoneSellingPriceUsd} onChange={handleChange} placeholder="0.00"/>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phoneSellingPriceUzs-edit" className="text-xs"> Sotiladigan (so'm) { !isAccessory && <span className="text-destructive">*</span>} </Label>
                  <Input id="phoneSellingPriceUzs-edit" name="phoneSellingPriceUzs" type="number" min="0" value={formData.phoneSellingPriceUzs} onChange={handleChange} placeholder="0"/>
                </div>
              </div>
              {!isAccessory && <p className="text-xs text-muted-foreground mt-1"> Sotiladigan narxlardan kamida bittasi (so'm yoki USD) 0 dan katta bo'lishi shart. </p>}
            </div>

            {mode === "android" && (
              <div className="pt-2 mt-2 border-t">
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Qo'shimcha (Android)</h3>
                <div className="space-y-1">
                  <Label htmlFor="androidCapacityRamStorage-edit">Sig'imi (RAM/Xotira)</Label>
                  <Input id="androidCapacityRamStorage-edit" name="androidCapacityRamStorage" value={formData.androidCapacityRamStorage} onChange={handleChange} placeholder="Masalan: 8/256GB yoki 256GB"/>
                </div>
              </div>
            )}
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
                    <Input id="iphoneCapacityStorage-edit" name="iphoneCapacityStorage" type="number" min="0" value={formData.iphoneCapacityStorage} onChange={handleChange} placeholder="Masalan: 256" required={mode === 'iphone'}/>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="iphoneBatteryHealth-edit">Batareya (%)</Label>
                    <Input id="iphoneBatteryHealth-edit" name="iphoneBatteryHealth" type="number" min="0" max="100" value={formData.iphoneBatteryHealth} onChange={handleChange} placeholder="Masalan: 85"/>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="iphoneSeriesRegion-edit">Seriyasi (Region)</Label>
                  <Input id="iphoneSeriesRegion-edit" name="iphoneSeriesRegion" value={formData.iphoneSeriesRegion} onChange={handleChange} placeholder="Masalan: LL/A (USA)"/>
                </div>
              </div>
            )}
            <DialogFooter className="pt-5 border-t mt-4">
              <Button type="button" variant="outline" onClick={handleDialogClose} disabled={isSubmitting}>Bekor qilish</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saqlanmoqda...</> : "Saqlash"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}