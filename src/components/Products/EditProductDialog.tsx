import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import axios from "axios";
import { Loader2 } from "lucide-react";

const API_URL_PRODUCTS = "https://smartphone777.pythonanywhere.com/api/products/";


interface EditFormData {
  name: string;
  // barcode: string; // Shtrix kod olib tashlandi
  purchaseDate: string;

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

const initialFormData: EditFormData = {
  name: "",
  // barcode: "", // Shtrix kod olib tashlandi
  purchaseDate: new Date().toISOString().split("T")[0],

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

const determineProductMode = (product: Product | null): "android" | "iphone" => {
  if (!product) return "android";
  const categoryName = product.category_name?.toLowerCase() || "";
  const productName = product.name?.toLowerCase() || "";

  if (categoryName.includes("iphone") || productName.includes("iphone")) {
    return "iphone";
  }
  return "android";
};


export function EditProductDialog({ open, onOpenChange, product, onProductSuccessfullyEdited }: EditProductDialogProps) {
  const [mode, setMode] = useState<"android" | "iphone">("android");
  const [formData, setFormData] = useState<EditFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

   useEffect(() => {
    if (product) {
      const determinedMode = determineProductMode(product);
      setMode(determinedMode); 

      let capacityForIphone = "";
      if (determinedMode === "iphone" && product.storage_capacity) {
        capacityForIphone = product.storage_capacity.replace(/gb/i, "").trim();
      }

      setFormData({
        name: product.name || "",
        purchaseDate: product.purchase_date ? product.purchase_date.split("T")[0] : new Date().toISOString().split("T")[0],
        
        phonePurchasePriceUsd: product.purchase_price_usd || "",
        phonePurchasePriceUzs: product.purchase_price_uzs || "",
        phoneSellingPriceUsd: product.price_usd || "",
        phoneSellingPriceUzs: product.price_uzs || "",

        androidCapacityRamStorage: determinedMode === 'android' ? (product.storage_capacity || "") : "",
        iphoneCapacityStorage: capacityForIphone,

        iphoneColor: product.color || "",
        iphoneBatteryHealth: product.battery_health || "",
        iphoneSeriesRegion: product.series_region || "",
      });
    } else {
      setFormData(initialFormData);
      setMode("android");
    }
  }, [product]);

  const handleOpenChangeInternal = (isOpen: boolean) => {
    if (isSubmitting) return; 
    onOpenChange(isOpen);
    if (!isOpen && !product) {
        setFormData(initialFormData);
        setMode("android");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setIsSubmitting(true);

    const payload: any = {
      ...product, 
      name: formData.name.trim(),
      purchase_date: formData.purchaseDate || new Date().toISOString().split("T")[0],
      
      purchase_price_usd: formData.phonePurchasePriceUsd ? Number(formData.phonePurchasePriceUsd) : null,
      purchase_price_uzs: formData.phonePurchasePriceUzs ? Number(formData.phonePurchasePriceUzs) : null,
      price_usd: formData.phoneSellingPriceUsd ? Number(formData.phoneSellingPriceUsd) : null,
      price_uzs: formData.phoneSellingPriceUzs ? Number(formData.phoneSellingPriceUzs) : null,
    };
    
    if (!formData.name.trim()) {
        toast.error("Mahsulot nomi kiritilishi shart.");
        setIsSubmitting(false);
        return;
    }

    if (mode === "android") {
      payload.storage_capacity = formData.androidCapacityRamStorage.trim() || null;
      payload.color = null; 
      payload.battery_health = null;
      payload.series_region = null;
    } else if (mode === "iphone") {
      if (!formData.iphoneCapacityStorage.trim()) { toast.error("iPhone uchun Sig'im kiritilishi shart."); setIsSubmitting(false); return; }
      if (!formData.iphoneColor.trim()) { toast.error("iPhone uchun Rang kiritilishi shart."); setIsSubmitting(false); return; }
      
      payload.color = formData.iphoneColor.trim();
      payload.storage_capacity = `${formData.iphoneCapacityStorage.trim()}GB`;
      payload.battery_health = formData.iphoneBatteryHealth ? Number(formData.iphoneBatteryHealth) : null;
      payload.series_region = formData.iphoneSeriesRegion.trim() || null;
    }
    
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Avtorizatsiya tokeni topilmadi.");
        setIsSubmitting(false);
        return;
      }

      const response = await axios.put(`${API_URL_PRODUCTS}${product.id}/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(`"${response.data.name}" muvaffaqiyatli tahrirlandi.`);
      onProductSuccessfullyEdited(response.data as Product); 
      handleOpenChangeInternal(false);

    } catch (err: any) {
      let errorMessage = `"${formData.name}" ni tahrirlashda xato: `;
      if (err.response?.data && typeof err.response.data === 'object') {
        for (const key in err.response.data) {
          const errorValue = Array.isArray(err.response.data[key]) ? err.response.data[key].join(', ') : err.response.data[key];
          errorMessage += `${key}: ${errorValue}. `;
        }
      } else {
        errorMessage += err.response?.data?.detail || err.message || "Noma'lum server xatosi.";
      }
      toast.error(errorMessage, { duration: 7000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleModeSwitch = (newMode: "android" | "iphone") => {
    if (mode !== newMode) {
        setMode(newMode);
        if(product){
            let capacityForIphone = "";
            let androidCapacity = formData.androidCapacityRamStorage;

            if (newMode === "iphone") {
                if (product.storage_capacity?.toLowerCase().includes('gb') || determineProductMode(product) === 'iphone') {
                    capacityForIphone = product.storage_capacity ? product.storage_capacity.replace(/gb/i, "").trim() : "";
                } else {
                    capacityForIphone = "";
                }
                androidCapacity = ""; 
            } else if (newMode === "android") {
                 androidCapacity = product.storage_capacity || "";
                 capacityForIphone = "";
            }

            setFormData(prev => ({
                ...prev,
                androidCapacityRamStorage: androidCapacity,
                iphoneCapacityStorage: capacityForIphone,
                iphoneColor: newMode === 'iphone' ? (product.color || "") : "",
                iphoneBatteryHealth: newMode === 'iphone' ? (product.battery_health || "") : "",
                iphoneSeriesRegion: newMode === 'iphone' ? (product.series_region || "") : "",
            }));
        }
    }
  };


  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChangeInternal}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6">
        <DialogHeader className="mb-4">
          <DialogTitle>{mode === "android" ? "Android Tahrirlash" : "iPhone Tahrirlash"}</DialogTitle>
          <DialogDescription>
            {mode === "android" ? "Android qurilma ma'lumotlarini tahrirlang." : "iPhone ma'lumotlarini tahrirlang."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex border-b mb-4">
            <Button
              variant="ghost"
              type="button"
              className={cn(
                "flex-1 justify-center rounded-none border-b-2 py-3 text-sm font-medium",
                mode === 'android'
                  ? "border-primary text-primary bg-primary/10"
                  : "border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              onClick={() => handleModeSwitch('android')}
            >
              Android
            </Button>
            <Button
              variant="ghost"
              type="button"
              className={cn(
                "flex-1 justify-center rounded-none border-b-2 py-3 text-sm font-medium",
                mode === 'iphone'
                  ? "border-primary text-primary bg-primary/10"
                  : "border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              onClick={() => handleModeSwitch('iphone')}
            >
              iPhone
            </Button>
          </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name-edit">Nomi <span className="text-destructive">*</span></Label>
            <Input id="name-edit" name="name" value={formData.name} onChange={handleChange} required 
                   placeholder={mode === 'android' ? "Masalan: Samsung Galaxy S23" : "Masalan: iPhone 15 Pro Max"}/>
          </div>
           <div className="space-y-1">
            <Label htmlFor="purchaseDate-edit">Olingan sana</Label>
            <Input id="purchaseDate-edit" name="purchaseDate" type="date" value={formData.purchaseDate} onChange={handleChange}/>
          </div>

          <div className="pt-2 mt-2 border-t">
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Narxlar</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="space-y-1">
                <Label htmlFor="phonePurchasePriceUsd-edit" className="text-xs">Olingan ($)</Label>
                <Input id="phonePurchasePriceUsd-edit" name="phonePurchasePriceUsd" type="number" step="0.01" value={formData.phonePurchasePriceUsd} onChange={handleChange} placeholder="0.00"/>
              </div>
              <div className="space-y-1">
                <Label htmlFor="phonePurchasePriceUzs-edit" className="text-xs">Olingan (so'm)</Label>
                <Input id="phonePurchasePriceUzs-edit" name="phonePurchasePriceUzs" type="number" value={formData.phonePurchasePriceUzs} onChange={handleChange} placeholder="0"/>
              </div>
              <div className="space-y-1">
                <Label htmlFor="phoneSellingPriceUsd-edit" className="text-xs">Sotiladigan ($)</Label>
                <Input id="phoneSellingPriceUsd-edit" name="phoneSellingPriceUsd" type="number" step="0.01" value={formData.phoneSellingPriceUsd} onChange={handleChange} placeholder="0.00"/>
              </div>
              <div className="space-y-1">
                <Label htmlFor="phoneSellingPriceUzs-edit" className="text-xs">Sotiladigan (so'm)</Label>
                <Input id="phoneSellingPriceUzs-edit" name="phoneSellingPriceUzs" type="number" value={formData.phoneSellingPriceUzs} onChange={handleChange} placeholder="0"/>
              </div>
            </div>
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
                  <Input id="iphoneCapacityStorage-edit" name="iphoneCapacityStorage" type="number" value={formData.iphoneCapacityStorage} onChange={handleChange} placeholder="Masalan: 256" required={mode === 'iphone'}/>
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
            <Button type="button" variant="outline" onClick={() => handleOpenChangeInternal(false)} disabled={isSubmitting}>Bekor qilish</Button>
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