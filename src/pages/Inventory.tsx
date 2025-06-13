import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Search, Plus, Trash2, Building, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const INVENTORY_API_URL = "https://smartphone777.pythonanywhere.com/api/inventory/";
const INVENTORY_ADD_URL = "https://smartphone777.pythonanywhere.com/api/inventory/add/";
const INVENTORY_REMOVE_URL = "https://smartphone777.pythonanywhere.com/api/inventory/remove/";
const PRODUCTS_API_URL = "https://smartphone777.pythonanywhere.com/api/products/";
const KASSA_API_URL = "https://smartphone777.pythonanywhere.com/api/kassa/";

interface InventoryItem {
  id: number;
  product: { id: number; name: string };
  quantity: number;
  minimum_stock_level: number;
  is_low_stock: boolean;
}

interface Product {
  id: number;
  name: string;
  is_active?: boolean; 
}

interface Kassa {
  id: number;
  name: string;
  location?: string;
  is_active?: boolean;
}

interface NewKassaItem {
  name: string;
  location: string;
  is_active: boolean;
}

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

interface NewInventoryItem {
  product_id: number;
  quantity: number;
  comment: string;
  kassa_id: number;
}

interface DeleteInventoryItemData {
  product_id: number;
  quantity: number;
  comment: string;
  kassa_id: number;
}

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
  
  const [overallLoading, setOverallLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [kassaLoading, setKassaLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteState, setDeleteState] = useState<DeleteState>({
    item: null, quantity: null, kassa_id: 0, comment: "",
    removeAll: false, open: false, operationResult: null,
  });
  
  const [allProductsList, setAllProductsList] = useState<Product[]>([]);
  const [kassaList, setKassaList] = useState<Kassa[]>([]);
  
  const [newItem, setNewItem] = useState<NewInventoryItem>({
    product_id: 0, quantity: 1, comment: "", kassa_id: 0,
  });

  const [addKassaModalOpen, setAddKassaModalOpen] = useState(false);
  const [newKassa, setNewKassa] = useState<NewKassaItem>({
    name: "", location: "", is_active: true,
  });

  const getAuthHeaders = useCallback(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast.error("Sessiya topilmadi. Iltimos, tizimga qayta kiring.");
      window.location.href = "/login"; 
      throw new Error("Sessiya topilmadi.");
    }
    return {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
  }, []);

  const fetchAllProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const headers = getAuthHeaders();
      const response = await fetch(PRODUCTS_API_URL, { method: "GET", headers });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error( errorData.detail || "Barcha mahsulotlar ro'yxatini olishda xato.");
      }
      const data = await response.json();
      setAllProductsList(data.results || []);
    } catch (err: any) {
      toast.error(`Mahsulotlarni yuklash xatosi: ${err.message}`);
      setAllProductsList([]);
    } finally {
      setProductsLoading(false);
    }
  }, [getAuthHeaders]);

  const fetchInventory = useCallback(async () => {
    setInventoryLoading(true);
    try {
      const headers = getAuthHeaders();
      const response = await fetch(INVENTORY_API_URL, { method: "GET", headers });
      if (!response.ok) {
        if (response.status === 401) throw new Error("Ruxsat berilmagan. Iltimos, tizimga qayta kiring.");
        const errorData = await response.json();
        throw new Error(errorData.detail || "Ombor ma'lumotlarini olishda xato yuz berdi.");
      }
      const data = await response.json();
      setInventoryData(data.results || []);
      setError(null); 
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      if (err.message.includes("Ruxsat berilmagan") || err.message.includes("Sessiya topilmadi")) {
        window.location.href = "/login";
      }
    } finally {
      setInventoryLoading(false);
    }
  }, [getAuthHeaders]);

  const fetchKassa = useCallback(async () => {
    setKassaLoading(true);
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
      toast.error(`Kassalarni yuklashda xato: ${err.message}`);
      setKassaList([]);
    } finally {
      setKassaLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    const initializeData = async () => {
      setError(null);
      await Promise.all([
        fetchAllProducts(),
        fetchKassa(),
      ]);
      await fetchInventory(); 
    };
    initializeData();
  }, [fetchAllProducts, fetchKassa, fetchInventory]);
  
  useEffect(() => {
    if (!productsLoading && !inventoryLoading && !kassaLoading) {
      setOverallLoading(false);
    } else {
      setOverallLoading(true);
    }
  }, [productsLoading, inventoryLoading, kassaLoading]);

  useEffect(() => {
    if (kassaList.length === 1) {
      const singleKassaId = kassaList[0].id;
      if (newItem.kassa_id === 0) {
        setNewItem(prev => ({ ...prev, kassa_id: singleKassaId }));
      }
      if (deleteState.open && deleteState.kassa_id === 0) {
        setDeleteState(prev => ({ ...prev, kassa_id: singleKassaId }));
      }
    }
  }, [kassaList, newItem.kassa_id, deleteState.open, deleteState.kassa_id]);

  const addInventoryItem = async () => {
    if (newItem.product_id === 0) { toast.error("Iltimos, mahsulotni tanlang!"); return; }
    if (newItem.quantity <= 0) { toast.error("Miqdor musbat son bo‘lishi kerak!"); return; }
    if (kassaList.length > 0 && newItem.kassa_id === 0) { toast.error("Iltimos, kassani tanlang!"); return; }
    if (kassaList.length === 0) { toast.error("Tizimda kassa mavjud emas. Avval kassa qo'shing."); return; }

    try {
      const headers = getAuthHeaders();
      const body = { ...newItem }; 
      const response = await fetch(INVENTORY_ADD_URL, { method: "POST", headers, body: JSON.stringify(body) });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Mahsulot qo'shishda server xatosi.");
      }
      toast.success("Mahsulot omborga muvaffaqiyatli qo'shildi!");
      setAddModalOpen(false);
      resetNewItemForm();
      fetchInventory();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const resetNewItemForm = () => {
    setNewItem({ product_id: 0, quantity: 1, comment: "", kassa_id: kassaList.length === 1 ? kassaList[0].id : 0 });
  };

  const addKassa = async () => {
    if (kassaList.length > 0) { toast.error("Tizimda faqat bitta kassa bo'lishi mumkin."); setAddKassaModalOpen(false); return; }
    if (!newKassa.name.trim()) { toast.error("Kassa nomini kiriting!"); return; }
    try {
      const headers = getAuthHeaders();
      const response = await fetch(KASSA_API_URL, { method: "POST", headers, body: JSON.stringify(newKassa) });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || (errorData.name ? `Nomi: ${errorData.name.join(', ')}` : "Kassa qo'shishda xato."));
      }
      toast.success("Kassa muvaffaqiyatli qo'shildi!");
      setAddKassaModalOpen(false);
      setNewKassa({ name: "", location: "", is_active: true });
      await fetchKassa();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const removeInventoryItem = async (dataToRemove: DeleteInventoryItemData) => {
    if (!dataToRemove.product_id) { toast.error("Mahsulot tanlanmagan!"); return; }
    if (kassaList.length > 0 && dataToRemove.kassa_id === 0) { toast.error("Iltimos, kassani tanlang!"); return; }
    if (kassaList.length === 0) { toast.error("Tizimda kassa mavjud emas."); return; }
    if (dataToRemove.quantity <= 0) { toast.error("Kamaytiriladigan miqdor musbat bo‘lishi kerak!"); return; }
    
    const currentItemInInventory = inventoryData.find(inv => inv.product.id === dataToRemove.product_id);
    if (currentItemInInventory && dataToRemove.quantity > currentItemInInventory.quantity) {
      toast.error("Kamaytiriladigan miqdor joriy zaxiradan ko‘p bo‘lmasligi kerak!"); return;
    }

    try {
      const headers = getAuthHeaders();
      const response = await fetch(INVENTORY_REMOVE_URL, { method: "POST", headers, body: JSON.stringify(dataToRemove) });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Mahsulot miqdorini kamaytirishda xato.");
      }
      const operationResultData: InventoryOperation = await response.json();
      toast.success("Mahsulot miqdori muvaffaqiyatli kamaytirildi!");
      setDeleteState(prev => ({ 
          ...prev, open: false, item: null, quantity: null, comment: "", removeAll: false, 
          kassa_id: kassaList.length === 1 ? kassaList[0].id : 0,
          operationResult: operationResultData 
      }));
      fetchInventory();
    } catch (err: any) {
      toast.error(`Xato: ${err.message}.`);
    }
  };

  const filteredInventoryDisplayData = inventoryData
    .filter(invItem => {
        if (productsLoading && allProductsList.length === 0) return false; // Agar hali yuklanmagan bo'lsa yoki bo'sh bo'lsa, ko'rsatmaymiz
        // Agar `is_active` ni Products API dan olsak, shuni ham tekshirishimiz mumkin:
        // const productInList = allProductsList.find(p => p.id === invItem.product.id);
        // return productInList && productInList.is_active !== false;
        return allProductsList.some(p => p.id === invItem.product.id);
    })
    .filter(item => item.quantity > 0)
    .filter(item => item.product.name.toLowerCase().includes(search.toLowerCase()));

  const productsForAddDropdown = allProductsList.filter(p => {
    // Agar faqat aktivlarini qo'shish kerak bo'lsa
    // return p.is_active !== false; 
    return true; 
  });

  return (
    <div className="space-y-6 p-4 md:p-6 animate-fade-in">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-sky-400 bg-clip-text text-transparent">
          Ombor
        </h1>
        <div className="flex gap-2">
          {kassaList.length === 0 && !kassaLoading && (
            <Button
              className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => setAddKassaModalOpen(true)}
            > <Building className="h-4 w-4" /> Kassa qo‘shish </Button>
          )}
          <Button
            className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
            onClick={() => { resetNewItemForm(); setAddModalOpen(true); }}
            disabled={kassaList.length === 0 || kassaLoading || productsLoading || allProductsList.length === 0}
            title={
                kassaList.length === 0 ? "Avval kassa qo'shing" : 
                productsLoading || allProductsList.length === 0 ? "Mahsulotlar ro'yxati yuklanmoqda yoki bo'sh..." : 
                "Mahsulot qo'shish"
            }
          > <Plus className="h-4 w-4" /> Mahsulot qo‘shish </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative md:w-96">
          <Input
            placeholder="Mahsulot nomi bo‘yicha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>

      <Card className="border-gray-200 shadow-md">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-lg text-gray-700">Inventar holati</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="text-gray-600 font-semibold">Mahsulot</TableHead>
                <TableHead className="text-gray-600 font-semibold">Joriy zaxira</TableHead>
                <TableHead className="text-gray-600 font-semibold">Minimal zaxira</TableHead>
                <TableHead className="text-gray-600 font-semibold">Holati</TableHead>
                <TableHead className="text-gray-600 font-semibold text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overallLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <div className="flex justify-center items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
                        <p className="text-gray-500">Ma'lumotlar yuklanmoqda...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <p className="text-red-600 font-medium">Xatolik: {error}</p>
                    <Button onClick={() => {
                         setOverallLoading(true); setError(null);
                         Promise.all([fetchAllProducts(), fetchKassa()]).then(() => fetchInventory());
                    }} variant="outline" size="sm" className="mt-2"> Qayta yuklash </Button>
                  </TableCell>
                </TableRow>
              ) : filteredInventoryDisplayData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <p className="text-gray-500">
                        {search ? "Qidiruv bo'yicha omborda mahsulot topilmadi." : 
                         !productsLoading && allProductsList.length === 0 && !inventoryLoading && inventoryData.length > 0 ? "Ombordagi mahsulotlar umumiy ro'yxatda topilmadi." :
                         !productsLoading && allProductsList.length === 0 ? "Mahsulotlar ro'yxati bo'sh. Avval mahsulot qo'shing." :
                         "Omborda mahsulotlar mavjud emas."}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInventoryDisplayData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-800">{item.product.name}</TableCell>
                    <TableCell className="text-gray-700">{item.quantity}</TableCell>
                    <TableCell className="text-gray-700">{item.minimum_stock_level}</TableCell>
                    <TableCell className={`font-semibold ${item.is_low_stock ? "text-red-600" : "text-green-600"}`}>
                      {item.is_low_stock ? "Kam qolgan" : "Yetarli"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon"
                        onClick={() => setDeleteState({
                            item, quantity: null, 
                            kassa_id: kassaList.length === 1 ? kassaList[0].id : 0, 
                            comment: "", removeAll: false, open: true, operationResult: null,
                        })}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100"
                        disabled={kassaList.length === 0 || kassaLoading}
                        title={kassaList.length === 0 ? "Avval kassa qo'shing" : "Miqdorni kamaytirish"}
                      > <Trash2 className="h-4 w-4" /> </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader> <DialogTitle className="text-xl text-gray-800">Omborga Mahsulot Qo‘shish</DialogTitle> </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="product_id_add" className="font-medium text-gray-700">Mahsulot:</Label>
              <select id="product_id_add" value={newItem.product_id}
                onChange={(e) => setNewItem({ ...newItem, product_id: parseInt(e.target.value) || 0 })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={productsLoading || productsForAddDropdown.length === 0}
              >
                <option value={0} disabled>
                    {productsLoading ? "Mahsulotlar yuklanmoqda..." : productsForAddDropdown.length === 0 ? "Qo'shish uchun mahsulot yo'q" : "Mahsulotni tanlang..."}
                </option>
                {productsForAddDropdown.map((product) => ( <option key={product.id} value={product.id}> {product.name} </option> ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quantity_add" className="font-medium text-gray-700">Miqdor:</Label>
              <Input id="quantity_add" type="number" min="1"
                value={newItem.quantity === 0 ? "" : newItem.quantity.toString()}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewItem(prev => ({ ...prev, quantity: val === "" ? 0 : (parseInt(val) >= 1 ? parseInt(val) : 1) }));
                }}
                placeholder="Miqdorni kiriting" className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {kassaList.length > 1 && (
                <div className="space-y-1.5">
                <Label htmlFor="kassa_id_add" className="font-medium text-gray-700">Kassa:</Label>
                <select id="kassa_id_add" value={newItem.kassa_id}
                    onChange={(e) => setNewItem({ ...newItem, kassa_id: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={kassaLoading}
                > <option value={0} disabled>{kassaLoading ? "Yuklanmoqda..." : "Kassani tanlang..."}</option>
                    {kassaList.map((kassa) => ( <option key={kassa.id} value={kassa.id}>{kassa.name}</option> ))}
                </select></div>
            )}
             {kassaList.length === 1 && !kassaLoading && (
                 <div className="space-y-1.5">
                    <Label className="font-medium text-gray-700">Kassa:</Label>
                    <p className="p-2 border border-gray-300 rounded-md bg-gray-50">{kassaList[0].name}</p>
                 </div>
            )}
             {kassaLoading && kassaList.length === 0 && ( // Agar kassa yuklanayotgan bo'lsa
                 <div className="space-y-1.5">
                    <Label className="font-medium text-gray-700">Kassa:</Label>
                    <p className="p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">Kassalar yuklanmoqda...</p>
                 </div>
             )}
            <div className="space-y-1.5">
              <Label htmlFor="comment_add" className="font-medium text-gray-700">Izoh (ixtiyoriy):</Label>
              <Input id="comment_add" type="text" value={newItem.comment}
                onChange={(e) => setNewItem({ ...newItem, comment: e.target.value })}
                placeholder="Qo'shimcha ma'lumot" className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddModalOpen(false); resetNewItemForm(); }}> Bekor qilish </Button>
            <Button onClick={addInventoryItem} className="bg-green-600 hover:bg-green-700 text-white"
              disabled={newItem.product_id === 0 || newItem.quantity <= 0 || (kassaList.length > 0 && newItem.kassa_id === 0) || productsLoading || kassaLoading }
            > Saqlash </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addKassaModalOpen} onOpenChange={setAddKassaModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader> <DialogTitle className="text-xl text-gray-800">Yangi Kassa Qo‘shish</DialogTitle> </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="kassa-name" className="font-medium text-gray-700">Nomi:</Label>
              <Input id="kassa-name" value={newKassa.name} onChange={(e) => setNewKassa({ ...newKassa, name: e.target.value })} placeholder="Kassa nomi" className="border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kassa-location" className="font-medium text-gray-700">Joylashuvi (ixtiyoriy):</Label>
              <Input id="kassa-location" value={newKassa.location} onChange={(e) => setNewKassa({ ...newKassa, location: e.target.value })} placeholder="Joylashuvi" className="border-gray-300 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox id="kassa-active" checked={newKassa.is_active} onCheckedChange={(checked) => setNewKassa({ ...newKassa, is_active: !!checked })} />
              <Label htmlFor="kassa-active" className="font-medium text-gray-700 cursor-pointer">Aktiv</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddKassaModalOpen(false); setNewKassa({ name: "", location: "", is_active: true }); }}>Bekor qilish</Button>
            <Button onClick={addKassa} className="bg-blue-600 hover:bg-blue-700 text-white" disabled={!newKassa.name.trim()}>Saqlash</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteState.open} onOpenChange={(isOpen) => setDeleteState(prev => ({ ...prev, open: isOpen, operationResult: isOpen ? prev.operationResult : null }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader> <DialogTitle className="text-xl text-gray-800">Miqdorni Kamaytirish</DialogTitle> </DialogHeader>
          {deleteState.item && (
            <div className="grid gap-5 py-4">
                <div>
                <p className="text-sm text-gray-600">Mahsulot: <span className="font-semibold text-gray-800">{deleteState.item.product.name}</span></p>
                <p className="text-sm text-gray-600">Joriy zaxira: <span className="font-semibold text-gray-800">{deleteState.item.quantity}</span></p>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="quantity_delete" className="font-medium text-gray-700">Kamaytiriladigan miqdor:</Label>
                    <Input id="quantity_delete" type="number" min="1"
                        value={deleteState.quantity === null || deleteState.quantity === 0 ? "" : deleteState.quantity.toString()}
                        onChange={(e) => {
                        const val = e.target.value; let newQuantity: number | null;
                        if (val === "") newQuantity = null; 
                        else { const pNum = parseInt(val); newQuantity = (!isNaN(pNum) && pNum >=0) ? pNum : deleteState.quantity; }
                        setDeleteState(prev => ({ ...prev, quantity: newQuantity, removeAll: newQuantity !== null && prev.item !== null && newQuantity === prev.item.quantity }));
                        }}
                        placeholder="Miqdorni kiriting" className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div className="flex items-center space-x-2">
                <Checkbox id="removeAll" checked={deleteState.removeAll}
                    onCheckedChange={(checked) =>
                    setDeleteState(prev => ({ ...prev, removeAll: !!checked, quantity: (checked && prev.item) ? prev.item.quantity : (prev.quantity === 0 ? null : prev.quantity) }))
                    }
                />
                <Label htmlFor="removeAll" className="font-medium text-gray-700 cursor-pointer">Hammasini kamaytirish</Label>
                </div>
                {kassaList.length > 1 && (
                    <div className="space-y-1.5">
                    <Label htmlFor="kassa_id_delete" className="font-medium text-gray-700">Kassa:</Label>
                    <select id="kassa_id_delete" value={deleteState.kassa_id}
                        onChange={(e) => setDeleteState(prev => ({ ...prev, kassa_id: parseInt(e.target.value) || 0 })) }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                         disabled={kassaLoading}
                    > <option value={0} disabled>{kassaLoading ? "Yuklanmoqda..." : "Kassani tanlang..."}</option>
                        {kassaList.map((kassa) => ( <option key={kassa.id} value={kassa.id}>{kassa.name}</option> ))}
                    </select></div>
                )}
                {kassaList.length === 1 && !kassaLoading && (
                    <div className="space-y-1.5">
                        <Label className="font-medium text-gray-700">Kassa:</Label>
                        <p className="p-2 border border-gray-300 rounded-md bg-gray-50">{kassaList[0].name}</p>
                    </div>
                )}
                {kassaLoading && kassaList.length === 0 && (
                     <div className="space-y-1.5">
                        <Label className="font-medium text-gray-700">Kassa:</Label>
                        <p className="p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">Kassalar yuklanmoqda...</p>
                     </div>
                 )}
                <div className="space-y-1.5">
                <Label htmlFor="comment_delete" className="font-medium text-gray-700">Izoh (ixtiyoriy):</Label>
                <Input id="comment_delete" type="text" value={deleteState.comment} onChange={(e) => setDeleteState(prev => ({ ...prev, comment: e.target.value }))} placeholder="Sababi yoki qo'shimcha ma'lumot" className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"/>
                </div>
            </div>
          )}
          {deleteState.operationResult && (
             <div className="mt-4 p-3 bg-green-50 border border-green-300 rounded-md text-sm">
              <h4 className="font-semibold text-green-700">Amaliyot Muvaffaqiyatli!</h4>
              <p><strong>ID:</strong> {deleteState.operationResult.id}</p>
              <p><strong>Mahsulot:</strong> {deleteState.operationResult.product.name}</p>
              <p><strong>Kamaytirilgan miqdor:</strong> {deleteState.operationResult.quantity}</p>
              <p><strong>Kassa:</strong> {deleteState.operationResult.kassa.name}</p>
              {deleteState.operationResult.comment && <p><strong>Izoh:</strong> {deleteState.operationResult.comment}</p>}
              <p><strong>Sana:</strong> {new Date(deleteState.operationResult.timestamp).toLocaleString()}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteState(prev => ({ ...prev, open: false, item: null, quantity: null, kassa_id: kassaList.length === 1 ? kassaList[0].id : 0, comment: "", removeAll: false, operationResult: null }))}>
              Bekor qilish
            </Button>
            <Button
              onClick={() => {
                if (deleteState.item) {
                    removeInventoryItem({ 
                        product_id: deleteState.item.product.id, 
                        quantity: deleteState.quantity || 0,
                        kassa_id: deleteState.kassa_id, 
                        comment: deleteState.comment 
                    });
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!deleteState.item || deleteState.quantity === null || deleteState.quantity <= 0 || (kassaList.length > 0 && deleteState.kassa_id === 0) || kassaLoading }
            >
              Kamaytirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}