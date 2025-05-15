import React from "react";
import { useApp } from "@/context/AppContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axios from "axios";

export function AppHeader() {
  const { currentUser, currentStore, exchangeRate, logout, updateExchangeRate } = useApp();
  const usdToUzsRate = exchangeRate?.usdToUzs || 0;
  const [isEditingCurrency, setIsEditingCurrency] = React.useState(false);
  const [newCurrencyRate, setNewCurrencyRate] = React.useState("");

  const handleUpdateCurrency = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.patch(
        "https://smartphone777.pythonanywhere.com/api/settings/currency/",
        { rate: Number(newCurrencyRate) },
        {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        }
      );
      const updatedRate = response.data.rate || response.data.value;
      updateExchangeRate({ usdToUzs: updatedRate });
      setIsEditingCurrency(false);
      setNewCurrencyRate("");
      toast.success("Valyuta kursi muvaffaqiyatli yangilandi");
    } catch (error) {
      toast.error("Valyuta kursini yangilashda xato yuz berdi: " + error.message);
      console.error("Xato:", error.response?.data);
    }
  };

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-3 bg-background z-10">
      {/* Valyuta kursi */}
      <div className="flex items-center">
        {currentStore && (
          <div className="text-sm">
            {isEditingCurrency ? (
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={newCurrencyRate}
                  onChange={(e) => setNewCurrencyRate(e.target.value)}
                  placeholder="Yangi kursni kiriting"
                  className="w-32"
                />
                <Button type="button" onClick={handleUpdateCurrency} disabled={!newCurrencyRate}>
                  Saqlash
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditingCurrency(false)}>
                  Bekor qilish
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground">1 USD = {usdToUzsRate || "N/A"} UZS</p>
                <Button type="button" variant="outline" onClick={() => setIsEditingCurrency(true)}>
                  O'zgartirish
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* O'ng tarafdagi elementlar */}
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarFallback className="bg-pos-primary text-white">
                  {currentUser?.name?.substring(0, 2)?.toUpperCase() || ""}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex flex-col px-2 py-1.5">
                <p className="text-sm font-medium">{currentUser?.name}</p>
                <p className="text-xs text-muted-foreground">{currentUser?.username}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>Chiqish</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}

export default AppHeader;