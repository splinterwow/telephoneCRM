// Gerekli kutubxonalar va komponentlar import qilinadi
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
// import { LanguageProvider } from "@/context/LanguageContext";

// Layout komponentlari
import { AppLayout } from "@/components/Layout/AppLayout";

// Sahifa komponentlari import qilinadi
import Employees from "./pages/Employees";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import POS from "./pages/POS";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import InstallmentPayments from "./pages/InstallmentPayments";
import NotFound from "./pages/NotFound";
import Hisobot from "./pages/Hisobot";

// React Query Client yaratish
const queryClient = new QueryClient();

// Asosiy App komponenti
const App = () => (
  // Providerlarni joylashtirish (ichma-ich)
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      {/* <LanguageProvider> */}
        <TooltipProvider>
          {/* UI komponentlari */}
          <Toaster />
          <Sonner />
          {/* Router */}
          <BrowserRouter>
            <Routes>
              {/* Login sahifasi uchun Route */}
              <Route path="/login" element={<Login />} />

              <Route path="/admin" element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                {/* Boshqa admin sahifalari */}
                <Route path="pos" element={<POS />} />
                <Route path="sales" element={<Sales />} />
                <Route path="products" element={<Products />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="reports" element={<Reports />} />
                <Route path="installments" element={<InstallmentPayments />} />
                {/* <Route path="settings" element={<Settings />} /> */}
                <Route path="employees" element={<Employees />} />
              </Route>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="pos" element={<POS />} />
                <Route path="sales" element={<Sales />} />
                <Route path="products" element={<Products />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="reports" element={<Reports />} />
                <Route path="installments" element={<InstallmentPayments />} />
                <Route path="hisobot" element={<Hisobot />} />
                
                {/* <Route path="settings" element={<Settings />} /> */}
                <Route path="employees" element={<Employees />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      {/* </LanguageProvider> */}
    </AppProvider>
  </QueryClientProvider>
);

// App komponentini export qilish
export default App;