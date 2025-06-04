import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  DialogTrigger, // DialogTrigger'ni qo'shamiz
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PlusCircle, Edit3, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner"; // Ixtiyoriy, agar o'rnatilgan bo'lsa
import { v4 as uuidv4 } from 'uuid'; // Unikal ID uchun

// Interfeyslar
interface LedgerEntry {
  id: string;
  source: string; // Kimdan/Qayerdan
  item: string; // Nima olindi
  date: string; // Qachon (YYYY-MM-DD)
  totalAmount: number;
  paidAmount: number;
  description: string;
}

const LOCAL_STORAGE_KEY = 'hisobotDaftariEntries';

function HisobotPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<Partial<LedgerEntry>>({}); // Partial - qisman to'ldirilgan bo'lishi mumkin
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Sahifa yuklanishini ko'rsatish uchun

  // LocalStorage'dan yuklash
  useEffect(() => {
    try {
      const storedEntries = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedEntries) {
        setEntries(JSON.parse(storedEntries));
      }
    } catch (error) {
      console.error("localStorage'dan yozuvlarni o'qishda xatolik:", error);
      toast.error("Saqlangan yozuvlarni o'qishda muammo yuz berdi.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // LocalStorage'ga saqlash
  useEffect(() => {
    if (!isLoading) { // Faqat boshlang'ich yuklanishdan keyin saqlaymiz
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entries));
      } catch (error) {
        console.error("localStorage'ga yozuvlarni saqlashda xatolik:", error);
        toast.error("Yozuvlarni saqlashda muammo yuz berdi.");
      }
    }
  }, [entries, isLoading]);

  const remainingAmount = useMemo(() => {
    const total = parseFloat(currentEntry.totalAmount?.toString() || '0');
    const paid = parseFloat(currentEntry.paidAmount?.toString() || '0');
    if (!isNaN(total) && !isNaN(paid)) {
      return total - paid;
    }
    return 0;
  }, [currentEntry.totalAmount, currentEntry.paidAmount]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCurrentEntry((prev) => ({
      ...prev,
      [name]: name === 'totalAmount' || name === 'paidAmount' ? parseFloat(value) || 0 : value,
    }));
  };

  const resetForm = () => {
    setCurrentEntry({
      date: new Date().toISOString().split('T')[0], // Bugungi sana
      totalAmount: 0,
      paidAmount: 0,
      source: '',
      item: '',
      description: '',
    });
    setEditingId(null);
  };

  const openFormModal = (entryToEdit?: LedgerEntry) => {
    if (entryToEdit) {
      setCurrentEntry({ ...entryToEdit });
      setEditingId(entryToEdit.id);
    } else {
      resetForm();
    }
    setIsFormModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEntry.item?.trim() || !currentEntry.source?.trim()) {
      toast.error("Kimdan/Qayerdan va Nima olingani kiritilishi shart.");
      return;
    }
    if (currentEntry.totalAmount === undefined || currentEntry.paidAmount === undefined) {
        toast.error("Umumiy summa va Berilgan summa kiritilishi shart.");
        return;
    }

    if (editingId) {
      // Tahrirlash
      setEntries((prevEntries) =>
        prevEntries.map((entry) =>
          entry.id === editingId ? { ...currentEntry as LedgerEntry, id: editingId } : entry
        )
      );
      toast.success("Yozuv muvaffaqiyatli tahrirlandi!");
    } else {
      // Yangi qo'shish
      const newEntry: LedgerEntry = {
        id: uuidv4(),
        ...currentEntry as Omit<LedgerEntry, 'id'>, // id'dan tashqari hamma narsani olamiz
      };
      setEntries((prevEntries) => [newEntry, ...prevEntries]);
      toast.success("Yangi yozuv muvaffaqiyatli qo'shildi!");
    }
    setIsFormModalOpen(false);
    resetForm();
  };

  const openDeleteModal = (id: string) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingId) {
      setEntries((prevEntries) =>
        prevEntries.filter((entry) => entry.id !== deletingId)
      );
      toast.success("Yozuv muvaffaqiyatli o'chirildi!");
      setIsDeleteModalOpen(false);
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('uz-UZ', { // Yoki 'en-CA' YYYY-MM-DD uchun
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    } catch (e) {
        return dateString; // Agar formatlashda xato bo'lsa, asl stringni qaytaramiz
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || isNaN(amount)) return '-';
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm"; // Yoki valyutaga qarab o'zgartiring
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg">Daftar yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Xarajatlar Daftari
        </h1>
        <Button onClick={() => openFormModal()} className="flex items-center">
          <PlusCircle className="mr-2 h-5 w-5" /> Yangi Yozuv Qo'shish
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Yozuvlar Ro'yxati</CardTitle>
          <CardDescription>
            Jami {entries.length} ta yozuv mavjud.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p className="text-lg">Hozircha yozuvlar mavjud emas.</p>
              <p>Birinchi yozuvingizni qo'shing!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sana</TableHead>
                    <TableHead>Kimdan/Qayerdan</TableHead>
                    <TableHead>Nima olindi</TableHead>
                    <TableHead className="text-right">Umumiy Summa</TableHead>
                    <TableHead className="text-right">Berildi</TableHead>
                    <TableHead className="text-right">Qoldiq</TableHead>
                    <TableHead>Izoh</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap">{formatDate(entry.date)}</TableCell>
                      <TableCell>{entry.source}</TableCell>
                      <TableCell>{entry.item}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {formatCurrency(entry.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {formatCurrency(entry.paidAmount)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap font-semibold">
                        {formatCurrency(entry.totalAmount - entry.paidAmount)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={entry.description}>
                        {entry.description || "-"}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                          onClick={() => openFormModal(entry)}
                          title="Tahrirlash"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700 hover:bg-red-100 ml-1"
                          onClick={() => openDeleteModal(entry.id)}
                          title="O'chirish"
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

      {/* Yozuv qo'shish/tahrirlash modali */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Yozuvni Tahrirlash" : "Yangi Yozuv Qo'shish"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div>
              <Label htmlFor="date">Sana</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={currentEntry.date || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="source">Kimdan / Qayerdan</Label>
              <Input
                id="source"
                name="source"
                value={currentEntry.source || ''}
                onChange={handleInputChange}
                placeholder="Masalan: Do'kon nomi, Ism Familya"
                required
              />
            </div>
            <div>
              <Label htmlFor="item">Nima olindi</Label>
              <Input
                id="item"
                name="item"
                value={currentEntry.item || ''}
                onChange={handleInputChange}
                placeholder="Masalan: Mahsulot nomi, Xizmat turi"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="totalAmount">Umumiy Summa</Label>
                    <Input
                        id="totalAmount"
                        name="totalAmount"
                        type="number"
                        value={currentEntry.totalAmount || ''}
                        onChange={handleInputChange}
                        placeholder="0"
                        min="0"
                        step="any"
                        required
                    />
                </div>
                <div>
                    <Label htmlFor="paidAmount">Berilgan Summa</Label>
                    <Input
                        id="paidAmount"
                        name="paidAmount"
                        type="number"
                        value={currentEntry.paidAmount || ''}
                        onChange={handleInputChange}
                        placeholder="0"
                        min="0"
                        step="any"
                        required
                    />
                </div>
            </div>
            <div>
                <Label>Qoldiq Summa</Label>
                <Input
                    value={formatCurrency(remainingAmount)}
                    readOnly
                    className="bg-gray-100 cursor-default"
                />
            </div>
            <div>
              <Label htmlFor="description">Izoh</Label>
              <Textarea
                id="description"
                name="description"
                value={currentEntry.description || ''}
                onChange={handleInputChange}
                placeholder="Qo'shimcha ma'lumotlar..."
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormModalOpen(false)}>
                Bekor qilish
              </Button>
              <Button type="submit">{editingId ? "Saqlash" : "Qo'shish"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* O'chirishni tasdiqlash modali */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>O'chirishni Tasdiqlang</DialogTitle>
            <DialogDescription>
              Haqiqatan ham bu yozuvni o'chirmoqchimisiz? Bu amalni orqaga
              qaytarib bo'lmaydi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeletingId(null);
              }}
            >
              Bekor qilish
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Ha, O'chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default HisobotPage;