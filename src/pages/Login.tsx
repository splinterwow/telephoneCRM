// src/pages/Login.tsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "@/context/AppContext"; // currentUser ni olish uchun
import { ThemeToggle } from "@/components/ThemeToggle"; // Dark mode toggle
import { Input } from "@/components/ui/input"; // UI input component
import { Button } from "@/components/ui/button"; // UI button component
import { toast } from "sonner"; // Notification library
import axios from "axios";

export default function Login() {
  const { isAuthenticated, login, logout, currentUser } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      // const from = location.state?.from?.pathname || "/"; // Bu qator hozircha ishlatilmayapti
      const role = currentUser.role;

      if (location.pathname === "/login") {
        if (role === "superadmin") {
          navigate("/superadmin", { replace: true });
        } else if (role === "admin") {
          navigate("/admin", { replace: true });
        } else {
          // Agar boshqa rollar bo'lsa yoki umumiy foydalanuvchi bo'lsa
          // Qayerga yo'naltirish kerakligini aniqlashtiring.
          // Misol uchun, agar oddiy foydalanuvchilar uchun alohida sahifa bo'lmasa, '/' ga yo'naltirish mumkin.
          navigate("/", { replace: true });
        }
      }
    }
  }, [isAuthenticated, currentUser, navigate, location]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => { // FormEvent tipini qo'shdim
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(
        "https://smartphone777.pythonanywhere.com/api/auth/login/",
        {
          username,
          password,
        }
      );

      const { access, refresh, user } = response.data;

      await login({ accessToken: access, refresh: refresh, user: user });
      
      // Muvaffaqiyatli kirishdan keyin toast ko'rsatish mumkin
      // toast.success("Muvaffaqiyatli kirildi!");

      // useEffect dagi navigatsiya logikasi o'zi ishlaydi,
      // lekin agar darhol yo'naltirish kerak bo'lsa, bu yerda ham qilsa bo'ladi,
      // ammo useEffect dagi bilan konflikt bo'lmasligi uchun ehtiyot bo'ling.
      // Misol uchun, user.role ga qarab shu yerda navigate() qilish.
      // Agar useEffect ga ishonsak, bu yerda qo'shimcha navigatsiya shart emas.

    } catch (error: any) { // error tipini any qilib belgiladim, yaxshiroq tip berish mumkin
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Noto'g'ri foydalanuvchi nomi yoki parol";

      toast.error(errorMessage);
      console.error("Login error:", error.response?.data || error.message || error);
      // logout() ni bu yerda chaqirish shart emas, chunki login muvaffaqiyatsiz bo'ldi,
      // AppContext dagi holat o'zgarmagan bo'lishi kerak.
      // Agar login() funksiyasi ichida qandaydir state ni o'zgartirib,
      // keyin xatolik yuz bersa, o'shanda tozalash uchun kerak bo'lishi mumkin.
    } finally {
      setIsLoading(false);
    }
  };

  // fillStoreDemo funksiyasi mavjud emas, agar test uchun kerak bo'lsa,
  // uni qoldirishingiz yoki olib tashlashingiz mumkin.
  // const fillStoreDemo = () => {
  //   setUsername("assalom");
  //   setPassword("password");
  // };

  // Agar foydalanuvchi allaqachon kirgan bo'lsa va /login sahifasiga to'g'ridan-to'g'ri kirmoqchi bo'lsa,
  // uni darhol kerakli sahifaga yo'naltirish uchun useEffect dan tashqari
  // komponent render bo'lishidan oldin tekshiruv qo'shish mumkin,
  // lekin useEffect hozirgi holatda buni qoplaydi.
  // Agar siz `isAuthenticated` va `currentUser` mavjud bo'lganda login sahifasini umuman ko'rsatmaslikni istasangiz:
  // if (isAuthenticated && currentUser) {
  //    // Bu yerda navigate qilish o'rniga, useEffect kutadi.
  //    // Yoki bu yerda null yoki biror "Yuklanmoqda..." komponentini qaytarishingiz mumkin.
  //    // Misol: return <Navigate to="/" replace />; (lekin bu useEffect bilan ziddiyatga olib kelishi mumkin)
  // }


  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-pos-background to-background">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle /> {/* LanguageSelector removed */}
      </div>

      <div className="w-full max-w-md animate-fade-in">
        <div className="bg-card/90 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-border">
          <div className="text-center mb-6">
            <p className="text-muted-foreground">Tizimga kirish</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Foydalanuvchi nomi
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="assalom"
                required
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Parol
                </label>
                <span className="text-xs text-primary cursor-pointer hover:underline">
                  Parolni unutdingizmi?
                </span>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full pos-button" // Agar 'pos-button' maxsus stil bo'lsa, uni tekshiring
            >
              {isLoading ? "Yuklanmoqda..." : "Kirish"}
            </Button>
          </form>
          {/* Test uchun demo ma'lumotlarni to'ldirish tugmasi
           <Button onClick={fillStoreDemo} variant="outline" className="w-full mt-2">
            Demo ma'lumotlar
          </Button>
          */}
        </div>
      </div>
    </div>
  );
}