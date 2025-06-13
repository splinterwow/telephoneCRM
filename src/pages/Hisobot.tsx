// src/pages/DaftarPage.tsx (Yoki sizning fayl nomingiz Hisobot.tsx)
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as PageCardDescription } from "@/components/ui/card";
import { PlusCircle, Loader2, X, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

// --- Interfeyslar ---
interface PurchaseOrderItem {
  id: string;
  product_name: string;
  quantity_ordered: number;
  purchase_price_currency: string; // Narxi
  custom_kassa_name?: string | null;
  payment_status_custom?: string | null; // Har bir item uchun to'lov holati/turi
}

interface PurchaseEntry {
  id: string;
  source_details: string; // Manba
  source_phone?: string | null;
  order_date?: string | null; // Kirim sanasi
  currency: "UZS" | "USD";
  total_amount?: string | null;      // Umumiy summa
  amount_paid?: string | null;       // To'langan summa
  due_date_for_remaining?: string | null; // Qoldiqni to'lash sanasi
  notes?: string | null;             // Izohlar
  items: PurchaseOrderItem[];
}

interface FormItem extends Omit<PurchaseOrderItem, 'id'> {
  tempId: string;
}

// Modal uchun ma'lumotlar strukturasi (items alohida)
interface ModalEntryData extends Omit<PurchaseEntry, 'id' | 'items'> {}

const LOCAL_STORAGE_MODAL_ENTRY_KEY = 'newPurchaseEntryData_modal_v2'; // Kalitlarni yangilash mumkin
const LOCAL_STORAGE_MODAL_ITEMS_KEY = 'newPurchaseFormItems_modal_v2';
const LOCAL_STORAGE_ALL_ENTRIES_KEY = 'allPurchaseEntries_v2';

function DaftarPage() { 
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [allEntries, setAllEntries] = useState<PurchaseEntry[]>([]);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<PurchaseEntry | null>(null);

  const getInitialModalEntryData = (): ModalEntryData => {
    const saved = localStorage.getItem(LOCAL_STORAGE_MODAL_ENTRY_KEY);
    const defaultData: ModalEntryData = {
      source_details: '', source_phone: '', currency: 'UZS',
      order_date: new Date().toISOString().slice(0, 16),
      total_amount: '', amount_paid: '', due_date_for_remaining: '', notes: '',
    };
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error("Lokal saqlangan modal asosiy ma'lumotlarni o'qishda xato:", e); }
    }
    return defaultData;
  };

  const getInitialModalFormItems = (): FormItem[] => {
    const saved = localStorage.getItem(LOCAL_STORAGE_MODAL_ITEMS_KEY);
    const defaultItems: FormItem[] = [{ 
        tempId: uuidv4(), product_name: '', quantity_ordered: 1, 
        purchase_price_currency: '', custom_kassa_name: '', payment_status_custom: '' 
    }];
    if (saved) {
      try {
        const parsedItems = JSON.parse(saved);
        return parsedItems.length > 0 ? parsedItems.map((item: any) => ({...item, tempId: item.tempId || uuidv4() })) : defaultItems;
      } catch (e) { console.error("Lokal saqlangan modal qator ma'lumotlarini o'qishda xato:", e); }
    }
    return defaultItems;
  };
  
  const [currentModalEntryData, setCurrentModalEntryData] = useState<ModalEntryData>(getInitialModalEntryData);
  const [currentModalFormItems, setCurrentModalFormItems] = useState<FormItem[]>(getInitialModalFormItems);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedEntries = localStorage.getItem(LOCAL_STORAGE_ALL_ENTRIES_KEY);
    if (savedEntries) {
      try { setAllEntries(JSON.parse(savedEntries)); } catch (e) { setAllEntries([]); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_ALL_ENTRIES_KEY, JSON.stringify(allEntries));
  }, [allEntries]);

  useEffect(() => {
    if (isFormModalOpen) {
      setCurrentModalEntryData(getInitialModalEntryData());
      setCurrentModalFormItems(getInitialModalFormItems());
    }
  }, [isFormModalOpen]);

  useEffect(() => {
    if (isFormModalOpen) {
      localStorage.setItem(LOCAL_STORAGE_MODAL_ENTRY_KEY, JSON.stringify(currentModalEntryData));
    }
  }, [currentModalEntryData, isFormModalOpen]);

  useEffect(() => {
    if (isFormModalOpen) {
      localStorage.setItem(LOCAL_STORAGE_MODAL_ITEMS_KEY, JSON.stringify(currentModalFormItems));
    }
  }, [currentModalFormItems, isFormModalOpen]);

  const handleAddItem = () => {
    setCurrentModalFormItems(prev => [...prev, { 
        tempId: uuidv4(), product_name: '', quantity_ordered: 1, 
        purchase_price_currency: '', custom_kassa_name: '', payment_status_custom: '',
    }]);
  };

  const handleRemoveItem = (tempId: string) => {
    if (currentModalFormItems.length > 1) {
      setCurrentModalFormItems(prev => prev.filter(item => item.tempId !== tempId));
    } else { toast.info("Kamida bitta yozuv qatori bo'lishi kerak."); }
  };

  const handleItemChange = (tempId: string, field: keyof Omit<FormItem, 'tempId'>, value: string) => {
    setCurrentModalFormItems(prevItems =>
      prevItems.map(item => {
        if (item.tempId === tempId) {
          let processedValue: string | number | null = value;
          if (field === 'quantity_ordered') {
            if (value === '') { processedValue = 0; } 
            else { const num = parseFloat(value); processedValue = (!isNaN(num) && num >= 0) ? num : 0; }
          } else if (field === 'purchase_price_currency') {
             if (value === '') { processedValue = ''; } 
             else { const num = parseFloat(value); processedValue = (!isNaN(num) && num >= 0) ? num.toString() : ''; }
          } else if (field === 'custom_kassa_name' || field === 'payment_status_custom') {
            processedValue = value.trim() === '' ? null : value;
          }
          return { ...item, [field]: processedValue };
        }
        return item;
      })
    );
  };
  
  const handleMainFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Raqamli maydonlar uchun qo'shimcha tekshiruv
    if (name === "total_amount" || name === "amount_paid") {
        const numValue = value.replace(/[^0-9.]/g, ''); // Faqat raqamlar va nuqta
        setCurrentModalEntryData(prev => ({ ...prev, [name]: numValue }));
    } else {
        setCurrentModalEntryData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: keyof Pick<PurchaseEntry, 'currency'>, value: string) => {
    setCurrentModalEntryData(prev => ({ ...prev, [name]: value as "UZS" | "USD" }));
  };

  const resetModalFormAndState = useCallback((clearModalLocalStorage = false) => {
    const defaultEntryData: ModalEntryData = {
      source_details: '', source_phone: '', currency: 'UZS',
      order_date: new Date().toISOString().slice(0, 16),
      total_amount: '', amount_paid: '', due_date_for_remaining: '', notes: '',
    };
    const defaultFormItems: FormItem[] = [{ 
        tempId: uuidv4(), product_name: '', quantity_ordered: 1, 
        purchase_price_currency: '', custom_kassa_name: '', payment_status_custom: '',
    }];

    setCurrentModalEntryData(defaultEntryData);
    setCurrentModalFormItems(defaultFormItems);
    
    if (clearModalLocalStorage) {
      localStorage.removeItem(LOCAL_STORAGE_MODAL_ENTRY_KEY);
      localStorage.removeItem(LOCAL_STORAGE_MODAL_ITEMS_KEY);
    }
  }, []);

  const openFormModal = () => {
    setIsFormModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!currentModalEntryData.source_details?.trim()) {
        toast.error('Kimdan/Qayerdan (Manba) kiritilishi shart.');
        setIsSubmitting(false); return;
    }
    // Umumiy summa va To'langan summa kabi asosiy maydonlar uchun validatsiya qo'shish mumkin
    if (!currentModalEntryData.total_amount?.trim()) {
        toast.error('Umumiy summa kiritilishi shart.');
        setIsSubmitting(false); return;
    }

    if (currentModalFormItems.some(item => 
        !item.product_name.trim() || item.quantity_ordered <= 0 ||
        !item.purchase_price_currency.toString().trim()
    )) {
      toast.error("Barcha qatorlar uchun 'Nomi', Miqdor (>0) va Narx to'g'ri to'ldirilishi shart.");
      setIsSubmitting(false); return;
    }

    const newEntry: PurchaseEntry = {
      id: uuidv4(),
      source_details: currentModalEntryData.source_details!.trim(),
      source_phone: currentModalEntryData.source_phone?.trim() || null,
      order_date: currentModalEntryData.order_date ? new Date(currentModalEntryData.order_date).toISOString() : new Date().toISOString(),
      currency: currentModalEntryData.currency || 'UZS',
      total_amount: currentModalEntryData.total_amount?.trim() || null,
      amount_paid: currentModalEntryData.amount_paid?.trim() || null,
      due_date_for_remaining: currentModalEntryData.due_date_for_remaining?.trim() || null,
      notes: currentModalEntryData.notes?.trim() || null,
      items: currentModalFormItems.map(({ tempId, ...itemData }) => ({
        id: uuidv4(), ...itemData,
        product_name: itemData.product_name.trim(),
        purchase_price_currency: itemData.purchase_price_currency.toString(),
        quantity_ordered: Number(itemData.quantity_ordered),
        custom_kassa_name: itemData.custom_kassa_name?.trim() || null,
        payment_status_custom: itemData.payment_status_custom?.trim() || null,
      })),
    };
    
    setAllEntries(prevEntries => [newEntry, ...prevEntries]);
    
    toast.success("Yangi kirim yozuvi lokal saqlandi!");
    setIsFormModalOpen(false);
    resetModalFormAndState(true);
    setIsSubmitting(false);
  };

  const formatDateForDisplay = (dateString?: string | null) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleString('uz-Latn-UZ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return dateString; }
  };

  const handleDeleteClick = (entry: PurchaseEntry) => {
    setEntryToDelete(entry);
    setIsDeleteConfirmModalOpen(true);
  };

  const confirmDelete = () => {
    if (entryToDelete) {
      setAllEntries(prevEntries => prevEntries.filter(e => e.id !== entryToDelete.id));
      toast.success(`"${entryToDelete.source_details}" manbali yozuv o'chirildi.`);
      setEntryToDelete(null);
      setIsDeleteConfirmModalOpen(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <header className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Kirim Daftari
        </h1>
        <Button onClick={openFormModal} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white">
          <PlusCircle className="mr-2 h-5 w-5" /> Yangi Yozuv Qo'shish
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Saqlangan Kirim Yozuvlari</CardTitle>
          <PageCardDescription>
            Jami {allEntries.length} ta yozuv lokal saqlangan.
          </PageCardDescription>
        </CardHeader>
        <CardContent>
          {allEntries.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p>Hozircha saqlangan kirim yozuvlari mavjud emas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kimdan/Qayerdan</TableHead>
                    <TableHead>Umumiy Summa</TableHead>
                    <TableHead>To'langan</TableHead>
                    <TableHead>Qoldiq To'lash Sanasi</TableHead>
                    <TableHead>Izohlar</TableHead>
                    <TableHead>Mahsulotlar</TableHead> {/* Mahsulotlar uchun yangi ustun */}
                    <TableHead>Sana</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.source_details}</TableCell>
                      <TableCell>{entry.total_amount || '-'} {entry.currency}</TableCell>
                      <TableCell>{entry.amount_paid || '-'}{entry.amount_paid ? ` ${entry.currency}` : ''}</TableCell>
                      <TableCell>{entry.due_date_for_remaining ? new Date(entry.due_date_for_remaining).toLocaleDateString('uz-Latn-UZ') : '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={entry.notes || undefined}>{entry.notes || '-'}</TableCell>
                      <TableCell>
                        <ul className="list-disc list-inside max-w-[250px]">
                            {entry.items.slice(0, 2).map(item => ( // Faqat birinchi 2 tasini ko'rsatish
                                <li key={item.id} className="truncate" title={`${item.product_name} (${item.quantity_ordered} x ${item.purchase_price_currency}) - ${item.payment_status_custom || 'N/A'}`}>
                                    {item.product_name} ({item.quantity_ordered} dona)
                                </li>
                            ))}
                            {entry.items.length > 2 && <li>... va yana {entry.items.length - 2} ta</li>}
                        </ul>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatDateForDisplay(entry.order_date)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" size="icon" title="O'chirish" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-100"
                          onClick={() => handleDeleteClick(entry)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
         <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
                Yangi Kirim Yozuvi Qo'shish
            </DialogTitle>
             <DialogDescription>
              Kerakli ma'lumotlarni to'ldiring. Majburiy maydonlar <span className="text-red-500">*</span> bilan belgilangan.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2 p-4 border rounded-md shadow-sm bg-gray-50">
                <Label className="text-lg font-medium text-gray-700">Asosiy Ma'lumotlar</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                        <Label htmlFor="source_details_modal" className="font-medium">Manba Tavsifi <span className="text-red-500">*</span></Label>
                        <Input id="source_details_modal" name="source_details" value={currentModalEntryData.source_details || ''} onChange={handleMainFormChange} disabled={isSubmitting} placeholder="Kimdan yoki qayerdan olindi"/>
                    </div>
                    <div>
                        <Label htmlFor="source_phone_modal" className="font-medium">Telefoni (Ixtiyoriy)</Label>
                        <Input id="source_phone_modal" name="source_phone" type="text" value={currentModalEntryData.source_phone || ''} onChange={handleMainFormChange} disabled={isSubmitting} placeholder="+998 XX XXX XX XX"/>
                    </div>
                    <div>
                        <Label htmlFor="currency_modal" className="font-medium">Valyuta <span className="text-red-500">*</span></Label>
                        <Select 
                            value={currentModalEntryData.currency || 'UZS'} 
                            onValueChange={(val) => handleSelectChange('currency', val as 'UZS'|'USD')} 
                            disabled={isSubmitting}
                        >
                            <SelectTrigger id="currency_modal"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="UZS">UZS (O'zbek so'mi)</SelectItem>
                                <SelectItem value="USD">USD (AQSh dollari)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <Label htmlFor="total_amount_modal" className="font-medium">Umumiy Summa ({currentModalEntryData.currency}) <span className="text-red-500">*</span></Label>
                        <Input id="total_amount_modal" name="total_amount" type="text" inputMode="decimal" value={currentModalEntryData.total_amount || ''} onChange={handleMainFormChange} placeholder="0.00" disabled={isSubmitting}/>
                    </div>
                    <div>
                        <Label htmlFor="amount_paid_modal" className="font-medium">To'langan Summa ({currentModalEntryData.currency})</Label>
                        <Input id="amount_paid_modal" name="amount_paid" type="text" inputMode="decimal" value={currentModalEntryData.amount_paid || ''} onChange={handleMainFormChange} placeholder="0.00" disabled={isSubmitting}/>
                    </div>
                    <div>
                        <Label htmlFor="due_date_for_remaining_modal" className="font-medium">Qoldiq Summani To'lash Sanasi</Label>
                        <Input id="due_date_for_remaining_modal" name="due_date_for_remaining" type="date" value={currentModalEntryData.due_date_for_remaining || ''} onChange={handleMainFormChange} disabled={isSubmitting}/>
                    </div>
                     <div> {/* Sana maydoni Asosiy Ma'lumotlarga ko'chirildi */}
                        <Label htmlFor="order_date_modal" className="font-medium">Kirim Sanasi va Vaqti</Label>
                        <Input id="order_date_modal" name="order_date" type="datetime-local" value={currentModalEntryData.order_date || ''} onChange={handleMainFormChange} disabled={isSubmitting}/>
                    </div>
                </div>
                 <div className="pt-2">
                    <Label htmlFor="notes_modal" className="font-medium">Izohlar</Label>
                    <Textarea id="notes_modal" name="notes" value={currentModalEntryData.notes || ''} onChange={handleMainFormChange} rows={3} disabled={isSubmitting} placeholder="Qo'shimcha ma'lumotlar..."/>
                </div>
            </div>

            <div className="space-y-3 p-4 border rounded-md shadow-sm">
                <div className='flex justify-between items-center mb-3'>
                    <Label className="text-lg font-medium text-gray-700">Olingan Narsalar / Xarajatlar</Label>
                    <Button type="button" size="sm" variant="outline" onClick={handleAddItem} className="flex items-center text-blue-600 border-blue-600 hover:bg-blue-50" disabled={isSubmitting}>
                        <Plus className="h-4 w-4 mr-1" /> Qator Qo'shish
                    </Button>
                </div>
                {currentModalFormItems.map((item) => (
                    <div key={item.tempId} className="p-3 border rounded-md space-y-3 relative bg-slate-50 shadow-xs">
                        {currentModalFormItems.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7 text-red-500 hover:bg-red-100 p-1" onClick={() => handleRemoveItem(item.tempId)} disabled={isSubmitting} title="Qatorni o'chirish">
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"> {/* 3 ustunli itemlar uchun */}
                            <div>
                                <Label htmlFor={`product_name_modal-${item.tempId}`} className="font-medium">Nomi <span className="text-red-500">*</span></Label>
                                <Input id={`product_name_modal-${item.tempId}`} type="text" value={item.product_name || ''} onChange={(e) => handleItemChange(item.tempId, 'product_name', e.target.value)} disabled={isSubmitting} placeholder="Mahsulot yoki xizmat nomi"/>
                            </div>
                            <div>
                                <Label htmlFor={`quantity_ordered_modal-${item.tempId}`} className="font-medium">Miqdori <span className="text-red-500">*</span></Label>
                                <Input id={`quantity_ordered_modal-${item.tempId}`} type="number" min="0" step="any" value={item.quantity_ordered === 0 && item.product_name ? '' : item.quantity_ordered.toString()} onChange={(e) => handleItemChange(item.tempId, 'quantity_ordered', e.target.value)} placeholder="0" disabled={isSubmitting}/>
                            </div>
                            <div>
                                <Label htmlFor={`purchase_price_currency_modal-${item.tempId}`} className="font-medium">Narxi ({currentModalEntryData.currency}) <span className="text-red-500">*</span></Label>
                                <Input id={`purchase_price_currency_modal-${item.tempId}`} type="text" inputMode="decimal" value={item.purchase_price_currency.toString() === '0' ? '' : item.purchase_price_currency.toString()} onChange={(e) => handleItemChange(item.tempId, 'purchase_price_currency', e.target.value)} placeholder="0.00" disabled={isSubmitting}/>
                            </div>
                            <div>
                                <Label htmlFor={`custom_kassa_name_modal-${item.tempId}`} className="font-medium">Kassa (Ixtiyoriy)</Label>
                                <Input id={`custom_kassa_name_modal-${item.tempId}`} type="text" value={item.custom_kassa_name || ''} onChange={(e) => handleItemChange(item.tempId, 'custom_kassa_name', e.target.value)} disabled={isSubmitting} placeholder="Kassa nomi yoki raqami"/>
                            </div>
                            <div className="md:col-span-2"> {/* To'lov holati kengroq bo'lishi uchun */}
                                <Label htmlFor={`payment_status_custom_modal-${item.tempId}`} className="font-medium">To'lov Turi/Holati (Ixtiyoriy)</Label>
                                <Input id={`payment_status_custom_modal-${item.tempId}`} type="text" value={item.payment_status_custom || ''} onChange={(e) => handleItemChange(item.tempId, 'payment_status_custom', e.target.value)} disabled={isSubmitting} placeholder="Masalan: Naqd, Plastik, Qarz, To'landi"/>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <DialogFooter className="pt-5">
              <Button type="button" variant="outline" onClick={() => { setIsFormModalOpen(false); resetModalFormAndState(false); }} disabled={isSubmitting}>
                Bekor qilish
              </Button>
              <Button 
                type="submit" 
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Saqlash (Lokal)
              </Button>
            </DialogFooter>
          </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmModalOpen} onOpenChange={setIsDeleteConfirmModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>O'chirishni Tasdiqlang</DialogTitle>
            <DialogDescription>
              Haqiqatan ham <span className="font-semibold">"{entryToDelete?.source_details}"</span> manbali yozuvni o'chirmoqchimisiz?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => {setIsDeleteConfirmModalOpen(false); setEntryToDelete(null);}}>
              Yo'q
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Ha, O'chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DaftarPage;