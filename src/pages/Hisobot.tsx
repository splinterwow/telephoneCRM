import React, { useState, useEffect } from 'react';

interface Transaction {
  id: number;
  from: string;
  category: string;
  date: string;
  amountTaken: number;
  amountGiven: number;
}

interface Category {
  id: number;
  name: string;
}

const Notepad: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [form, setForm] = useState({
    from: '',
    category: '',
    date: '',
    amountTaken: '',
    amountGiven: '',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // API'dan kategoriyalarni olish
  useEffect(() => {
    const fetchCategories = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('Access token topilmadi');
        setLoading(false);
        return;
      }
      try {
        const response = await fetch('https://smartphone777.pythonanywhere.com/api/categories/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) throw new Error('Kategoriyalar olishda xatolik');
        const data = await response.json();
        setCategories(data.results || data); // Backend'dan kelgan formatga moslashtirish
      } catch (error) {
        console.error('Xatolik:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // localStorage'dan tranzaksiyalarni o'qish
  useEffect(() => {
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }
  }, []);

  // Tranzaksiyalarni localStorage'ga saqlash
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTransaction: Transaction = {
      id: Date.now(),
      from: form.from,
      category: form.category,
      date: form.date,
      amountTaken: parseFloat(form.amountTaken) || 0,
      amountGiven: parseFloat(form.amountGiven) || 0,
    };
    setTransactions((prev) => [...prev, newTransaction]);
    setForm({ from: '', category: '', date: '', amountTaken: '', amountGiven: '' });
  };

  const handleDelete = (id: number) => {
    setTransactions((prev) => prev.filter((transaction) => transaction.id !== id));
  };

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">Daftar</h1>

      {/* Forma */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Yangi tranzaksiya qo'shish</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <input
            type="text"
            name="from"
            value={form.from}
            onChange={handleInputChange}
            placeholder="Kimdan"
            className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <select
            name="category"
            value={form.category}
            onChange={handleInputChange}
            className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={loading}
          >
            <option value="">Mahsulot turini tanlang</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleInputChange}
            className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="number"
            name="amountTaken"
            value={form.amountTaken}
            onChange={handleInputChange}
            placeholder="Qancha olgan"
            className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="number"
            name="amountGiven"
            value={form.amountGiven}
            onChange={handleInputChange}
            placeholder="Qancha bergan"
            className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition"
            disabled={loading}
          >
            Qo'shish
          </button>
        </form>
      </div>

      {/* Tranzaksiyalar ro'yxati */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Tranzaksiyalar</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center">Hozircha tranzaksiyalar yo'q.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-left">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-3">Kimdan</th>
                  <th className="p-3">Mahsulot turi</th>
                  <th className="p-3">Sana</th>
                  <th className="p-3">Olgan</th>
                  <th className="p-3">Bergan</th>
                  <th className="p-3">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b">
                    <td className="p-3">{transaction.from}</td>
                    <td className="p-3">{transaction.category}</td>
                    <td className="p-3">{transaction.date}</td>
                    <td className="p-3">{transaction.amountTaken}</td>
                    <td className="p-3">{transaction.amountGiven}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-500"
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notepad;