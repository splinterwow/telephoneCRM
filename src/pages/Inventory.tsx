import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Search, Plus, Trash2, Building } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const INVENTORY_API_URL = "http://nuriddin777.uz/api/inventory/";
const INVENTORY_ADD_URL = "http://nuriddin777.uz/api/inventory/add/";
const INVENTORY_REMOVE_URL = "http://nuriddin777.uz/api/inventory/remove/";
const PRODUCTS_API_URL = "http://nuriddin777.uz/api/products/";
const KASSA_API_URL = "http://nuriddin777.uz/api/kassa/";

// Inventory interfeysi
interface InventoryItem {
  id: number;
  product: { id: number; name: string };
  quantity: number;
  minimum_stock_level: number;
  is_low_stock: boolean;
}

// Mahsulot interfeysi
interface Product {
  id: number;
  name: string;
}

// Kassa interfeysi
interface Kassa {
  id: number;
  name: string;
  location?: string;
  is_active?: boolean;
}

// Yangi kassa qo'shish uchun forma ma'lumotlari
interface NewKassaItem {
  name: string;
  location: string;
  is_active: boolean;
}

// InventoryOperation interfeysi
interface InventoryOperation {
  id: number;
  product: { id: number; name: string };
  user: { id: number; username: string };
  kassa: { id: number; name: string };
  quantity: number;
  operation_type: string;
  operation_type_display: string;
  comment: string;
  timestamp: string;
  related_operation_id: number | null;
}

// Yangi mahsulot qo'shish uchun forma ma'lumotlari
interface NewInventoryItem {
  product_id: number;
  quantity: number;
  comment: string;
  kassa_id: number;
}

// O'chirish uchun ma'lumotlar
interface DeleteInventoryItem {
  product_id: number;
  quantity: number;
  comment: string;
  kassa_id: number;
}

// O'chirish uchun holat
interface DeleteState {
  item: InventoryItem | null;
  quantity: number | null;
  kassa_id: number;
  comment: string;
  removeAll: boolean;
  open: boolean;
  operationResult: InventoryOperation | null;
}

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteState, setDeleteState] = useState<DeleteState>({
    item: null,
    quantity: null,
    kassa_id: 0,
    comment: "",
    removeAll: false,
    open: false,
    operationResult: null,
  });
  const [productList, setProductList] = useState<Product[]>([]);
  const [kassaList, setKassaList] = useState<Kassa[]>([]);
  const [newItem, setNewItem] = useState<NewInventoryItem>({
    product_id: 0,
    quantity: 1,
    comment: "",
    kassa_id: 0,
  });

  const [addKassaModalOpen, setAddKassaModalOpen] = useState(false);
  const [newKassa, setNewKassa] = useState<NewKassaItem>({
    name: "",
    location: "",
    is_active: true,
  });

  const getAuthHeaders = () => {
    let accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast.error("Sessiya topilmadi. Iltimos, tizimga qayta kiring.");
      window.location.href = "/login";
      throw new Error("Sessiya topilmadi.");
    }
    return {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
  };

  const fetchInventory = async () => {
    try {
      const headers = getAuthHeaders();
      setLoading(true);
      setError(null);
      const response = await fetch(INVENTORY_API_URL, { method: "GET", headers });
      if (!response.ok) {
        if (response.status === 401) throw new Error("Ruxsat berilmagan. Iltimos, tizimga qayta kiring.");
        const errorData = await response.json();
        throw new Error(errorData.detail || "Ma'lumotlarni olishda xato yuz berdi.");
      }
      const data = await response.json();
      setInventoryData(data.results || []);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      if (err.message.includes("Ruxsat berilmagan") || err.message.includes("Sessiya topilmadi")) {
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(PRODUCTS_API_URL, { method: "GET", headers });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Mahsulotlar ro'yxatini olishda xato.");
      }
      const data = await response.json();
      setProductList(data.results || []);
    } catch (err: any) {
      toast.error(err.message);
      if (err.message.includes("Ruxsat berilmagan") || err.message.includes("Sessiya topilmadi")) {
        window.location.href = "/login";
      }
    }
  };

  const fetchKassa = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(KASSA_API_URL, { method: "GET", headers });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Kassa ro'yxatini olishda xato.");
      }
      const data = await response.json();
      setKassaList(data.results || []);
    } catch (err: any) {
      toast.error(err.message);
       if (err.message.includes("Ruxsat berilmagan") || err.message.includes("Sessiya topilmadi")) {
        window.location.href = "/login";
      }
    }
  };

  const addInventoryItem = async () => {
    if (newItem.product_id === 0) {
      toast.error("Iltimos, mahsulotni tanlang!");
      return;
    }
    if (newItem.kassa_id === 0) {
      // Agar kassaList bo'sh bo'lsa va newItem.kassa_id hali ham 0 bo'lsa,
      // bu kassa yo'qligini va qo'shilmaganligini bildiradi.
      // Yoki, agar bitta kassa bo'lsa, uni avtomatik tanlash mumkin.
      // Hozircha, kassa tanlanishini talab qilamiz.
      if (kassaList.length === 0) {
        toast.error("Avval kassani qo'shing!");
        return;
      } else if (kassaList.length === 1 && newItem.kassa_id === 0) {
        // Agar faqat bitta kassa bo'lsa va foydalanuvchi tanlamagan bo'lsa,
        // uni avtomatik tanlaymiz.
        // Bu qismni olib tashlashingiz yoki o'zgartirishingiz mumkin.
        // Hozircha bu logikani qoldirmaymiz, foydalanuvchi o'zi tanlasin.
         toast.error("Iltimos, kassani tanlang!");
         return;
      } else if (newItem.kassa_id === 0) {
        toast.error("Iltimos, kassani tanlang!");
        return;
      }
    }
    if (newItem.quantity <= 0) { 
      toast.error("Miqdor musbat son bo‘lishi kerak!");
      return;
    }

    try {
      const headers = getAuthHeaders();
      const body = { ...newItem };
      // Agar faqat bitta kassa bo'lsa va newItem.kassa_id 0 bo'lsa (foydalanuvchi tanlamagan bo'lsa),
      // shu yagona kassaning ID sini avtomatik o'rnatamiz.
      // Lekin "Kassani tanlang" degan xabar bilan yuqorida buni oldini oldik.
      // Agar kelajakda avtomatik tanlash kerak bo'lsa, shu yerga logika qo'shiladi.
      // if (kassaList.length === 1 && body.kassa_id === 0) {
      //   body.kassa_id = kassaList[0].id;
      // }

      const response = await fetch(INVENTORY_ADD_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Mahsulot qo'shishda server xatosi.");
      }
      toast.success("Mahsulot muvaffaqiyatli qo'shildi!");
      setAddModalOpen(false);
      setNewItem({ product_id: 0, quantity: 1, comment: "", kassa_id: kassaList.length === 1 ? kassaList[0].id : 0 });
      fetchInventory();
    } catch (err: any) {
      toast.error(err.message);
      if (err.message.includes("Ruxsat berilmagan") || err.message.includes("Sessiya topilmadi")) {
        window.location.href = "/login";
      }
    }
  };

  const addKassa = async () => {
    // Qo'shimcha tekshiruv: Agar kassaList allaqachon elementga ega bo'lsa, qo'shishni rad etish
    if (kassaList.length > 0) {
      toast.error("Tizimda faqat bitta kassa bo'lishi mumkin. Yangi kassa qo'shib bo'lmaydi.");
      setAddKassaModalOpen(false); // Modalni yopish
      setNewKassa({ name: "", location: "", is_active: true }); // Formani tozalash
      return;
    }

    if (!newKassa.name.trim()) {
      toast.error("Kassa nomini kiriting!");
      return;
    }
    try {
      const headers = getAuthHeaders();
      const response = await fetch(KASSA_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(newKassa),
      });
      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = "Kassa qo'shishda server xatosi.";
        if (errorData && typeof errorData === 'object') {
            if (errorData.detail) errorMessage = errorData.detail;
            else if (errorData.name) errorMessage = `Nomi: ${errorData.name.join(', ')}`;
        }
        throw new Error(errorMessage);
      }
      toast.success("Kassa muvaffaqiyatli qo'shildi!");
      setAddKassaModalOpen(false);
      setNewKassa({ name: "", location: "", is_active: true });
      await fetchKassa(); // Kassani qayta yuklash

      // Yangi kassa qo'shilgandan so'ng, newItem.kassa_id ni avtomatik o'rnatish
      // (agar mahsulot qo'shish modalida kassa tanlanmagan bo'lsa)
      // Bu kassaList yangilangandan keyin amalga oshishi kerak
      // Lekin, kassaList yangilanishi asinxron bo'lgani uchun,
      // to'g'ridan-to'g'ri yangi kassa ID sini olish qiyinroq.
      // Eng yaxshisi, foydalanuvchi mahsulot qo'shishda tanlaydi yoki
      // agar faqat bitta kassa bo'lsa, addInventoryItem ichida uni o'rnatiladi.
      // Hozircha, newItem.kassa_id ni mahsulot qo'shish modalida tanlashga qoldiramiz.

    } catch (err: any) {
      toast.error(err.message);
      if (err.message.includes("Ruxsat berilmagan") || err.message.includes("Sessiya topilmadi")) {
        window.location.href = "/login";
      }
    }
  };

  const removeInventoryItem = async (deleteItem: DeleteInventoryItem) => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(INVENTORY_REMOVE_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          product_id: deleteItem.product_id,
          quantity: deleteItem.quantity,
          kassa_id: deleteItem.kassa_id,
          comment: deleteItem.comment || "",
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Mahsulotni o'chirishda server xatosi.");
      }
      const data = await response.json();
      setDeleteState((prev) => ({
        ...prev,
        open: false,
        operationResult: data,
        quantity: null,
        kassa_id: kassaList.length === 1 ? kassaList[0].id : 0,
        comment: "",
        removeAll: false,
      }));
      toast.success("Mahsulot muvaffaqiyatli o'chirildi!");
      fetchInventory();
    } catch (err: any)      {
      toast.error(`Xato: ${err.message}.`);
      if (err.message.includes("Ruxsat berilmagan") || err.message.includes("Sessiya topilmadi")) {
        window.location.href = "/login";
      }
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await fetchKassa(); // Avval kassa yuklanadi
      await fetchInventory();
      await fetchProducts();
    };
    initializeData();
  }, []);

  // newItem va deleteState uchun kassa_id ni avtomatik sozlash, agar faqat bitta kassa bo'lsa
  useEffect(() => {
    if (kassaList.length === 1) {
      const singleKassaId = kassaList[0].id;
      setNewItem(prev => ({ ...prev, kassa_id: prev.kassa_id === 0 ? singleKassaId : prev.kassa_id }));
      setDeleteState(prev => ({ ...prev, kassa_id: prev.kassa_id === 0 ? singleKassaId : prev.kassa_id }));
    }
  }, [kassaList]);


  const filteredData = inventoryData
    .filter((item) => item.quantity > 0) 
    .filter((item) =>
      item.product.name.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="space-y-6 p-4 md:p-6 animate-fade-in">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pos-primary to-pos-secondary bg-clip-text text-transparent">
          Ombor
        </h1>
        <div className="flex gap-2">
          {/* Kassa qo'shish tugmasi faqat kassa mavjud bo'lmaganda ko'rsatiladi */}
          {kassaList.length === 0 && (
            <Button
              className="flex items-center gap-2 bg-pos-primary text-white hover:bg-pos-secondary"
              onClick={() => setAddKassaModalOpen(true)}
            >
              <Building className="h-4 w-4" />
              Kassa qo‘shish
            </Button>
          )}
          <Button
            className="flex items-center gap-2 bg-pos-primary text-white hover:bg-pos-secondary"
            onClick={() => {
              setNewItem({ 
                product_id: 0, 
                quantity: 1, 
                comment: "", 
                kassa_id: kassaList.length === 1 ? kassaList[0].id : 0 // Agar bitta kassa bo'lsa, avtomatik tanlash
              });
              setAddModalOpen(true);
            }}
            disabled={kassaList.length === 0} // Agar kassa yo'q bo'lsa, mahsulot qo'shishni bloklash
            title={kassaList.length === 0 ? "Avval kassa qo'shing" : "Mahsulot qo'shish"}
          >
            <Plus className="h-4 w-4" />
            Mahsulot qo‘shish
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative md:w-96">
          <Input
            placeholder="Mahsulot nomi bo‘yicha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 border border-pos-accent bg-pos-background focus:ring-2 focus:ring-pos-primary"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <Card className="bg-pos-background border border-pos-accent shadow-lg">
        <CardHeader>
          <CardTitle className="text-pos-primary">Inventar holati</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-pos-primary">Mahsulot</TableHead>
                <TableHead className="text-pos-primary">Joriy zaxira</TableHead>
                <TableHead className="text-pos-primary">Minimal zaxira</TableHead>
                <TableHead className="text-pos-primary">Holati</TableHead>
                <TableHead className="text-pos-primary">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <p className="text-muted-foreground">Yuklanmoqda...</p>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <p className="text-red-600">{error}</p>
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <p className="text-muted-foreground">Hech qanday ma'lumot topilmadi.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.product.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.minimum_stock_level}</TableCell>
                    <TableCell
                      className={
                        item.is_low_stock ? "text-pos-danger" : "text-green-600"
                      }
                    >
                      {item.is_low_stock ? "Kam zaxira" : "Zaxirada"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setDeleteState({
                            item,
                            quantity: null,
                            // Agar faqat bitta kassa bo'lsa, avtomatik tanlash
                            kassa_id: kassaList.length === 1 ? kassaList[0].id : 0, 
                            comment: "",
                            removeAll: false,
                            open: true,
                            operationResult: null,
                          })
                        }
                        className="text-red-600 hover:text-red-800"
                        disabled={kassaList.length === 0} // Agar kassa yo'q bo'lsa, o'chirishni bloklash
                        title={kassaList.length === 0 ? "Avval kassa qo'shing" : "Mahsulotni o'chirish"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mahsulot qo'shish modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-[400px] max-h-[80vh] overflow-y-auto hide-scrollbar bg-pos-background border border-pos-accent animate-scale-in">
          <DialogHeader>
            <DialogTitle className="text-pos-primary">Yangi mahsulot qo‘shish</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="font-bold text-pos-primary">Mahsulot:</span>
              <select
                value={newItem.product_id}
                onChange={(e) =>
                  setNewItem({ ...newItem, product_id: parseInt(e.target.value) || 0 })
                }
                className="w-full p-2 border border-pos-accent bg-pos-background rounded focus:ring-2 focus:ring-pos-primary"
              >
                <option value={0}>Mahsulotni tanlang</option>
                {productList.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="font-bold text-pos-primary">Miqdor:</span>
              <Input
                type="number"
                min="1" // Minimal miqdor 1 bo'lishi kerak
                value={newItem.quantity === 0 ? "" : newItem.quantity} // 0 ni bo'sh satr sifatida ko'rsatish
                onChange={(e) => {
                  const valueString = e.target.value;
                  let updatedQuantity = newItem.quantity; 

                  if (valueString === "") {
                    updatedQuantity = 0; // Agar bo'sh bo'lsa 0
                  } else {
                    const parsedNum = Number(valueString);
                    if (!isNaN(parsedNum) && parsedNum >= 0) {
                      updatedQuantity = parsedNum;
                    }
                  }
                  setNewItem({ ...newItem, quantity: updatedQuantity });
                }}
                placeholder="Miqdor"
                className="border border-pos-accent bg-pos-background focus:ring-2 focus:ring-pos-primary"
              />
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="font-bold text-pos-primary">Izoh:</span>
              <Input
                type="text"
                value={newItem.comment}
                onChange={(e) =>
                  setNewItem({ ...newItem, comment: e.target.value })
                }
                placeholder="Izoh (ixtiyoriy)"
                className="border border-pos-accent bg-pos-background focus:ring-2 focus:ring-pos-primary"
              />
            </div>
            {/* Kassa tanlash inputi, agar bir nechta kassa bo'lsa ko'rsatiladi */}
            {kassaList.length > 1 && (
                <div className="grid grid-cols-2 items-center gap-4">
                <span className="font-bold text-pos-primary">Kassa:</span>
                <select
                    value={newItem.kassa_id}
                    onChange={(e) =>
                    setNewItem({ ...newItem, kassa_id: parseInt(e.target.value) || 0 })
                    }
                    className="w-full p-2 border border-pos-accent bg-pos-background rounded focus:ring-2 focus:ring-pos-primary"
                >
                    <option value={0}>Kassani tanlang</option>
                    {kassaList.map((kassa) => (
                    <option key={kassa.id} value={kassa.id}>
                        {kassa.name}
                    </option>
                    ))}
                </select>
                </div>
            )}
            {/* Agar faqat bitta kassa bo'lsa, uni ko'rsatish (tanlash imkoniyatisiz) */}
            {kassaList.length === 1 && (
                 <div className="grid grid-cols-2 items-center gap-4">
                    <span className="font-bold text-pos-primary">Kassa:</span>
                    <span>{kassaList[0].name}</span>
                 </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddModalOpen(false);
                setNewItem({ 
                    product_id: 0, 
                    quantity: 1, 
                    comment: "", 
                    kassa_id: kassaList.length === 1 ? kassaList[0].id : 0 
                });
              }}
              className="bg-pos-accent text-white hover:bg-pos-secondary"
            >
              Bekor qilish
            </Button>
            <Button
              onClick={addInventoryItem}
              className="bg-pos-primary text-white hover:bg-pos-secondary"
            >
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kassa qo'shish modal */}
      <Dialog open={addKassaModalOpen} onOpenChange={setAddKassaModalOpen}>
        <DialogContent className="sm:max-w-[400px] max-h-[80vh] overflow-y-auto hide-scrollbar bg-pos-background border border-pos-accent animate-scale-in">
          <DialogHeader>
            <DialogTitle className="text-pos-primary">Yangi kassa qo‘shish</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="kassa-name" className="text-right col-span-1 font-bold text-pos-primary">
                Nomi:
              </Label>
              <Input
                id="kassa-name"
                value={newKassa.name}
                onChange={(e) => setNewKassa({ ...newKassa, name: e.target.value })}
                placeholder="Kassa nomi"
                className="col-span-3 border border-pos-accent bg-pos-background focus:ring-2 focus:ring-pos-primary"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="kassa-location" className="text-right col-span-1 font-bold text-pos-primary">
                Joylashuvi:
              </Label>
              <Input
                id="kassa-location"
                value={newKassa.location}
                onChange={(e) => setNewKassa({ ...newKassa, location: e.target.value })}
                placeholder="Joylashuvi (ixtiyoriy)"
                className="col-span-3 border border-pos-accent bg-pos-background focus:ring-2 focus:ring-pos-primary"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="kassa-active" className="text-right col-span-1 font-bold text-pos-primary">
                Aktiv:
              </Label>
              <Checkbox
                id="kassa-active"
                checked={newKassa.is_active}
                onCheckedChange={(checked) => setNewKassa({ ...newKassa, is_active: !!checked })}
                className="col-span-3 justify-self-start"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddKassaModalOpen(false);
                setNewKassa({ name: "", location: "", is_active: true });
              }}
              className="bg-pos-accent text-white hover:bg-pos-secondary"
            >
              Bekor qilish
            </Button>
            <Button
              onClick={addKassa}
              className="bg-pos-primary text-white hover:bg-pos-secondary"
            >
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* O'chirish tasdiqlash modal */}
      <Dialog
        open={deleteState.open}
        onOpenChange={() =>
          setDeleteState({
            ...deleteState,
            open: false,
            item: null,
            quantity: null,
            kassa_id: kassaList.length === 1 ? kassaList[0].id : 0,
            comment: "",
            removeAll: false,
            operationResult: null,
          })
        }
      >
        <DialogContent className="sm:max-w-[400px] max-h-[80vh] overflow-y-auto hide-scrollbar bg-pos-background border border-pos-accent animate-scale-in">
          <DialogHeader>
            <DialogTitle className="text-pos-primary">Mahsulotni o‘chirish</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="font-bold text-pos-primary">Mahsulot:</span>
              <span>{deleteState.item?.product.name || "Tanlanmagan"}</span>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="font-bold text-pos-primary">Joriy zaxira:</span>
              <span>{deleteState.item?.quantity || 0}</span>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="font-bold text-pos-primary">O‘chiriladigan miqdor:</span>
              <Input
                type="number"
                min="1" // Minimal miqdor 1
                value={deleteState.quantity === null || deleteState.quantity === 0 ? "" : deleteState.quantity}
                onChange={(e) => {
                  const valueString = e.target.value;
                  let newQuantity: number | null;
                   if (valueString === "") {
                    newQuantity = null; 
                  } else {
                    const parsedNum = Number(valueString);
                    if(!isNaN(parsedNum) && parsedNum >=0){
                        newQuantity = parsedNum;
                    } else {
                        newQuantity = deleteState.quantity;
                    }
                  }
                  setDeleteState({
                    ...deleteState,
                    quantity: newQuantity,
                    removeAll: newQuantity !== null && deleteState.item !== null && newQuantity === deleteState.item.quantity,
                  });
                }}
                placeholder="Miqdor"
                className="border border-pos-accent bg-pos-background focus:ring-2 focus:ring-pos-primary"
              />
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="font-bold text-pos-primary">Hammasini o‘chirish:</span>
              <Checkbox
                checked={deleteState.removeAll}
                onCheckedChange={(checked) =>
                  setDeleteState({
                    ...deleteState,
                    removeAll: !!checked,
                    quantity: checked && deleteState.item ? deleteState.item.quantity : (deleteState.quantity === 0 ? null : deleteState.quantity),
                  })
                }
              />
            </div>
             {/* Kassa tanlash inputi, agar bir nechta kassa bo'lsa ko'rsatiladi */}
            {kassaList.length > 1 && (
                <div className="grid grid-cols-2 items-center gap-4">
                <span className="font-bold text-pos-primary">Kassa:</span>
                <select
                    value={deleteState.kassa_id}
                    onChange={(e) =>
                    setDeleteState({ ...deleteState, kassa_id: parseInt(e.target.value) || 0 })
                    }
                    className="w-full p-2 border border-pos-accent bg-pos-background rounded focus:ring-2 focus:ring-pos-primary"
                >
                    <option value={0}>Kassani tanlang</option>
                    {kassaList.map((kassa) => (
                    <option key={kassa.id} value={kassa.id}>
                        {kassa.name}
                    </option>
                    ))}
                </select>
                </div>
            )}
            {/* Agar faqat bitta kassa bo'lsa, uni ko'rsatish (tanlash imkoniyatisiz) */}
            {kassaList.length === 1 && (
                 <div className="grid grid-cols-2 items-center gap-4">
                    <span className="font-bold text-pos-primary">Kassa:</span>
                    <span>{kassaList[0].name}</span>
                 </div>
            )}
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="font-bold text-pos-primary">Izoh:</span>
              <Input
                type="text"
                value={deleteState.comment}
                onChange={(e) =>
                  setDeleteState({ ...deleteState, comment: e.target.value })
                }
                placeholder="Izoh (ixtiyoriy)"
                className="border border-pos-accent bg-pos-background focus:ring-2 focus:ring-pos-primary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setDeleteState({
                  ...deleteState,
                  open: false,
                  item: null,
                  quantity: null,
                  kassa_id: kassaList.length === 1 ? kassaList[0].id : 0,
                  comment: "",
                  removeAll: false,
                  operationResult: null,
                })
              }
              className="bg-pos-accent text-white hover:bg-pos-secondary"
            >
              Bekor qilish
            </Button>
            <Button
              onClick={() => {
                if (!deleteState.item) {
                  toast.error("Mahsulot tanlanmagan!");
                  return;
                }
                if (deleteState.kassa_id === 0 && kassaList.length > 0) { // Agar kassalar bo'lsa, lekin tanlanmagan bo'lsa
                    toast.error("Iltimos, kassani tanlang!");
                    return;
                } else if (kassaList.length === 0) { // Agar umuman kassa yo'q bo'lsa
                    toast.error("Tizimda kassa mavjud emas. Avval kassa qo'shing.");
                    return;
                }
                if (deleteState.quantity === null || deleteState.quantity <= 0) {
                  toast.error("Miqdor musbat son bo‘lishi kerak!");
                  return;
                }
                if (deleteState.quantity > (deleteState.item?.quantity || 0)) {
                  toast.error("O‘chiriladigan miqdor joriy zaxiradan ko‘p bo‘lmasligi kerak!");
                  return;
                }

                removeInventoryItem({
                  product_id: deleteState.item.product.id,
                  quantity: deleteState.quantity,
                  // Agar faqat bitta kassa bo'lsa va deleteState.kassa_id 0 bo'lsa, o'sha yagona kassani ishlatamiz
                  kassa_id: deleteState.kassa_id === 0 && kassaList.length === 1 ? kassaList[0].id : deleteState.kassa_id,
                  comment: deleteState.comment || "",
                });
              }}
              className="bg-red-600 text-white hover:bg-red-800"
            >
              O‘chirish
            </Button>
          </DialogFooter>
          {deleteState.operationResult && (
            <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded">
              <h4 className="font-bold text-green-800">Amaliyot muvaffaqiyatli!</h4>
              <p><strong>ID:</strong> {deleteState.operationResult.id}</p>
              <p><strong>Mahsulot:</strong> {deleteState.operationResult.product.name}</p>
              <p><strong>Kassa:</strong> {deleteState.operationResult.kassa.name}</p>
              <p><strong>Miqdor:</strong> {deleteState.operationResult.quantity}</p>
              <p><strong>Izoh:</strong> {deleteState.operationResult.comment}</p>
              <p><strong>Sana:</strong> {new Date(deleteState.operationResult.timestamp).toLocaleString()}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}