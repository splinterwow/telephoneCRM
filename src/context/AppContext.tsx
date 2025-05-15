
// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { Language, User, ExchangeRate, Store, SubscriptionPlan } from '@/types';
// import { toast } from 'sonner';

// interface AppContextType {
//   language: Language;
//   setLanguage: (lang: Language) => void;
//   isDarkMode: boolean;
//   toggleDarkMode: () => void;
//   currentUser: User | null;
//   exchangeRate: ExchangeRate;
//   currentStore: Store | null;
//   isAuthenticated: boolean;
//   isSuperuser: boolean;
//   subscriptionPlans: SubscriptionPlan[];
//   login: (username: string, password: string) => Promise<void>;
//   logout: () => void;
// }

// // Initial dummy data
// const initialExchangeRate: ExchangeRate = {
//   date: new Date(),
//   usdToUzs: 12500,
// };

// const demoUser: User = {
//   id: "1",
//   name: "Demo Admin",
//   username: "demo",
//   role: "admin",
//   storeId: "1",
//   phone: "+998 90 123 4567"
// };

// const demoSuperuser: User = {
//   id: "super1",
//   name: "Superadmin",
//   username: "superadmin",
//   role: "superuser",
//   phone: "+998 99 999 9999"
// };

// const demoStore: Store = {
//   id: "1",
//   name: "Demo Phone Store",
//   subscription: "gold",
//   validUntil: new Date("2025-12-31"),
//   owner: "1",
//   status: "active",
//   branches: [
//     {
//       id: "1",
//       name: "Main Branch",
//       location: "Tashkent, Uzbekistan",
//       storeId: "1",
//       registers: [
//         {
//           id: "1",
//           name: "Main Register",
//           branchId: "1",
//           balance: {
//             uzs: 1500000,
//             usd: 120
//           }
//         }
//       ]
//     }
//   ]
// };

// const subscriptionPlans: SubscriptionPlan[] = [
//   {
//     tier: "free",
//     name: "Free",
//     price: 0,
//     features: ["1 branch", "100 products", "Basic features"],
//     maxProducts: 100,
//     maxBranches: 1,
//     maxRegisters: 1,
//     allowsInstallments: false,
//     allowsMultipleCurrencies: false
//   },
//   {
//     tier: "silver",
//     name: "Silver",
//     price: 199000,
//     features: ["2 branches", "500 products", "Basic reports", "Installment payments"],
//     maxProducts: 500,
//     maxBranches: 2,
//     maxRegisters: 5,
//     allowsInstallments: true,
//     allowsMultipleCurrencies: false
//   },
//   {
//     tier: "gold",
//     name: "Gold",
//     price: 399000,
//     features: ["5 branches", "2000 products", "Advanced reports", "Multi-currency", "SMS notifications"],
//     maxProducts: 2000,
//     maxBranches: 5,
//     maxRegisters: 15,
//     allowsInstallments: true,
//     allowsMultipleCurrencies: true
//   },
//   {
//     tier: "platinum",
//     name: "Platinum",
//     price: 799000,
//     features: ["10 branches", "10000 products", "Premium support", "All features"],
//     maxProducts: 10000,
//     maxBranches: 10,
//     maxRegisters: 30,
//     allowsInstallments: true,
//     allowsMultipleCurrencies: true
//   },
//   {
//     tier: "vip",
//     name: "V.I.P",
//     price: 1999000,
//     features: ["Unlimited branches", "Unlimited products", "24/7 Support", "Custom features"],
//     maxProducts: Infinity,
//     maxBranches: Infinity,
//     maxRegisters: Infinity,
//     allowsInstallments: true,
//     allowsMultipleCurrencies: true
//   }
// ];

// const AppContext = createContext<AppContextType | undefined>(undefined);

// export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [language, setLanguage] = useState<Language>("uz_latin");
//   const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
//   const [currentUser, setCurrentUser] = useState<User | null>(null);
//   const [exchangeRate, setExchangeRate] = useState<ExchangeRate>(initialExchangeRate);
//   const [currentStore, setCurrentStore] = useState<Store | null>(null);
//   const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
//   const [isSuperuser, setIsSuperuser] = useState<boolean>(false);

//   // Check system preference for dark mode
//   useEffect(() => {
//     if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
//       setIsDarkMode(true);
//     }

//     // Add dark mode class to body if needed
//     if (isDarkMode) {
//       document.documentElement.classList.add('dark');
//     } else {
//       document.documentElement.classList.remove('dark');
//     }
//   }, [isDarkMode]);

//   const toggleDarkMode = () => {
//     setIsDarkMode(prev => !prev);
//   };

//   const login = async (username: string, password: string) => {
//     // In a real application, this would make an API call
//     // For demonstration purposes, we'll just set demo user data
//     if (username === "demo" && password === "password") {
//       setCurrentUser(demoUser);
//       setCurrentStore(demoStore);
//       setIsAuthenticated(true);
//       setIsSuperuser(false);
//       toast.success("Login successful as store admin");
//     } else if (username === "superadmin" && password === "xAI2025") {
//       setCurrentUser(demoSuperuser);
//       setCurrentStore(null);
//       setIsAuthenticated(true);
//       setIsSuperuser(true);
//       toast.success("Login successful as superadmin");
//     } else {
//       throw new Error("Invalid credentials");
//     }
//   };

//   const logout = () => {
//     setCurrentUser(null);
//     setCurrentStore(null);
//     setIsAuthenticated(false);
//     setIsSuperuser(false);
//   };

//   const value = {
//     language,
//     setLanguage,
//     isDarkMode,
//     toggleDarkMode,
//     currentUser,
//     exchangeRate,
//     currentStore,
//     isAuthenticated,
//     isSuperuser,
//     subscriptionPlans,
//     login,
//     logout,
//   };

//   return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
// };

// export const useApp = (): AppContextType => {
//   const context = useContext(AppContext);
//   if (context === undefined) {
//     throw new Error('useApp must be used within an AppProvider');
//   }
//   return context;
// };




// src/context/AppContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, User, ExchangeRate, Store, SubscriptionPlan } from '@/types'; // Sizning type fayllaringizga mos
import { toast } from 'sonner';
import axios from 'axios'; // Agar store ma'lumotini API dan olish uchun kerak bo'lsa

// Context tipi - login funksiyasining signature o'zgartirildi
interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  currentUser: User | null;
  exchangeRate: ExchangeRate;
  currentStore: Store | null;
  isAuthenticated: boolean;
  isSuperuser: boolean;
  subscriptionPlans: SubscriptionPlan[]; // Bu API dan kelishi yoki qattiq kodlangan bo'lishi mumkin
  // Yangi login funksiyasi: API javobidan kelgan datani qabul qiladi
  login: (data: { accessToken: string; refresh: string; user: User }) => Promise<void>;
  logout: () => void;
  // Agar zarur bo'lsa, store ma'lumotini yuklash uchun funksiya qo'shish mumkin
  // loadStore: (storeId: string, token: string) => Promise<void>;
}

// Initial dummy data (agar API dan yuklanmasa)
const initialExchangeRate: ExchangeRate = {
  date: new Date(),
  usdToUzs: 12500, // Bu API dan olinishi kerak
};

// Bu demo datalar endi login logikasida ishlatilmaydi, lekin types uchun kerak bo'lishi mumkin
const demoStore: Store = {
  id: "1", // API dan kelgan user.storeId ga mos kelishi kerak
  name: "Demo Phone Store",
  subscription: "gold", // API dan kelishi kerak
  validUntil: new Date("2025-12-31"), // API dan kelishi kerak
  owner: "1", // API dan kelishi kerak
  status: "active", // API dan kelishi kerak
  branches: [
    {
      id: "1",
      name: "Main Branch",
      location: "Tashkent, Uzbekistan",
      storeId: "1",
      registers: [
        {
          id: "1",
          name: "Main Register",
          branchId: "1",
          balance: {
            uzs: 1500000,
            usd: 120
          }
        }
      ]
    }
  ]
};

// Obuna planlari (bu ham API dan kelishi mumkin)
const subscriptionPlans: SubscriptionPlan[] = [
  // ... yuqoridagi demo planlar
    {
    tier: "free",
    name: "Free",
    price: 0,
    features: ["1 branch", "100 products", "Basic features"],
    maxProducts: 100,
    maxBranches: 1,
    maxRegisters: 1,
    allowsInstallments: false,
    allowsMultipleCurrencies: false
  },
  {
    tier: "silver",
    name: "Silver",
    price: 199000,
    features: ["2 branches", "500 products", "Basic reports", "Installment payments"],
    maxProducts: 500,
    maxBranches: 2,
    maxRegisters: 5,
    allowsInstallments: true,
    allowsMultipleCurrencies: false
  },
  {
    tier: "gold",
    name: "Gold",
    price: 399000,
    features: ["5 branches", "2000 products", "Advanced reports", "Multi-currency", "SMS notifications"],
    maxProducts: 2000,
    maxBranches: 5,
    maxRegisters: 15,
    allowsInstallments: true,
    allowsMultipleCurrencies: true
  },
  {
    tier: "platinum",
    name: "Platinum",
    price: 799000,
    features: ["10 branches", "10000 products", "Premium support", "All features"],
    maxProducts: 10000,
    maxBranches: 10,
    maxRegisters: 30,
    allowsInstallments: true,
    allowsMultipleCurrencies: true
  },
  {
    tier: "vip",
    name: "V.I.P",
    price: 1999000,
    features: ["Unlimited branches", "Unlimited products", "24/7 Support", "Custom features"],
    maxProducts: Infinity,
    maxBranches: Infinity,
    maxRegisters: Infinity,
    allowsInstallments: true,
    allowsMultipleCurrencies: true
  }
];


const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Tilni localStorage dan yuklash
    const savedLang = localStorage.getItem('language');
    return (savedLang as Language) || 'uz_latin'; // Default til
  });

  const [isDarkMode, setIsDarkModeState] = useState<boolean>(() => {
     // Dark mode ni localStorage yoki tizim preference dan yuklash
     const savedMode = localStorage.getItem('darkMode');
     if (savedMode !== null) {
        return savedMode === 'true';
     }
     return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; // Tizim default
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate>(initialExchangeRate); // API dan olinishi kerak
  const [currentStore, setCurrentStore] = useState<Store | null>(null); // API dan olinishi kerak
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isSuperuser, setIsSuperuser] = useState<boolean>(false);
  // subscriptionPlans state qo'shish mumkin, agar API dan kelsa


  // Komponent mount bo'lganda sessionni tiklash
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const savedUserJson = localStorage.getItem('currentUser');

    if (accessToken && refreshToken && savedUserJson) {
       try {
           const user: User = JSON.parse(savedUserJson);
           // Tokenlar mavjud va user ma'lumoti saqlangan bo'lsa, sessionni tiklaymiz
           setCurrentUser(user);
           setIsAuthenticated(true);
           setIsSuperuser(user.role === 'superadmin');

           // Agar admin roli bo'lsa va storeId mavjud bo'lsa, store ma'lumotini yuklash kerak
           // BU QISM API DAN STORE MA'LUMOTINI OLISH UCHUN LOGIKA TALAB QILADI
           if (user.role === 'admin' && user.storeId) {
              // store ni API dan yuklash funksiyasini chaqirish
              // Masalan: loadStore(user.storeId, accessToken);
              // Hozircha demo store ni set qilamiz
               setCurrentStore(demoStore); // Real ilovada buni API dan olishingiz kerak
           } else {
               setCurrentStore(null); // Superadmin yoki boshqa rollar uchun store null
           }

           // Valyuta kursini ham API dan yuklash kerak bo'lishi mumkin
           // fetchExchangeRate(accessToken);

           // Obuna planlarini ham API dan yuklash kerak bo'lishi mumkin
           // fetchSubscriptionPlans(accessToken);

       } catch (e) {
           console.error("Failed to restore session:", e);
           // Agar tiklashda xato bo'lsa (masalan, JSON parsing xatosi), logout qilamiz
           logout();
       }
    } else {
      // Tokenlar mavjud emas yoki user ma'lumoti yo'q bo'lsa, logout holatiga o'rnatamiz
      logout(); // Bu shunchaki state'larni null/false qilish uchun, localStorage allaqachon bo'sh bo'lishi mumkin
    }

     // Valyuta kursini va obuna planlarini yuklash (masalan, tokenlar mavjud bo'lsa)
     // loadInitialData(accessToken); // Qo'shimcha funksiya yozish mumkin
  }, []); // Empty dependency array ensures this runs only once on mount


  // Til o'zgarganda state va localStorage ni yangilash
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

   // Dark mode o'zgarganda state, localStorage va HTML class ni yangilash
  const toggleDarkMode = () => {
    setIsDarkModeState(prev => {
        const newState = !prev;
        localStorage.setItem('darkMode', newState.toString());
        if (newState) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        return newState;
    });
  };

  // LOGIN FUNKSIYASI: API dan kelgan datani qabul qiladi va state'larni yangilaydi
  const login = async (data: { accessToken: string; refresh: string; user: User }) => {
      const { accessToken, refresh, user } = data;

      // Tokenlarni va user ma'lumotini localStoragega saqlash
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refresh);
      localStorage.setItem("currentUser", JSON.stringify(user)); // User ob'ektini string qilib saqlaymiz

      // Context state'larini yangilash
      setCurrentUser(user);
      setIsAuthenticated(true);
      setIsSuperuser(user.role === 'superadmin'); // Rolga qarab isSuperuser ni o'rnatamiz

      // Store ma'lumotini API dan kelgan userga bog'lab yuklash kerak bo'ladi agar admin bo'lsa
      // BU QISM API DAN STORE MA'LUMOTINI OLISH UCHUN LOGIKA TALAB QILADI
      if (user.role === 'admin' && user.storeId) {
         // store ni API dan yuklash funksiyasini chaqirish
         // Masalan: loadStore(user.storeId, accessToken);
         // Hozircha demo store ni set qilamiz
         setCurrentStore(demoStore); // Real ilovada buni API dan olishingiz kerak
      } else {
         setCurrentStore(null); // Superadmin yoki boshqa rollar uchun store null
      }

      // Login muvaffaqiyatli bo'lganda boshqa initial datalarni ham yuklash mumkin
      // fetchExchangeRate(accessToken);
      // fetchSubscriptionPlans(accessToken);

      // Bu funksiya o'zi xato tashlamasligi kerak agar data formati to'g'ri kelsa.
      // Error holatlari API chaqiruvi paytida Login.tsx da yuz beradi va u yerda ishlanadi.
  };

  // LOGOUT FUNKSIYASI: State va localStorage ni tozalaydi
  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("currentUser"); // User ma'lumotini ham o'chiramiz

    setCurrentUser(null);
    setCurrentStore(null);
    setIsAuthenticated(false);
    setIsSuperuser(false);

    // Logout bo'lganda tilni yoki dark modeni defaultga qaytarish mumkin
    // setLanguageState('uz_latin');
    // setIsDarkModeState(false);
  };

  // Agar kerak bo'lsa, bu yerga store yoki boshqa datalarni yuklash uchun async funksiyalar yozish mumkin
  // va ularni context value ga qo'shish mumkin.
  // const loadStore = async (storeId: string, token: string) => { /* ... API call ... */ }
  // const fetchExchangeRate = async (token: string) => { /* ... API call ... */ }
  // const fetchSubscriptionPlans = async (token: string) => { /* ... API call ... */ }


  // Context value object
  const value: AppContextType = {
    language,
    setLanguage,
    isDarkMode,
    toggleDarkMode,
    currentUser,
    exchangeRate, // Buni API dan yuklash kerak
    currentStore, // Buni API dan yuklash kerak
    isAuthenticated,
    isSuperuser,
    subscriptionPlans, // Buni API dan yuklash kerak
    login,
    logout,
    // loadStore, // Agar yozilgan bo'lsa
  };

  // Provider komponenti
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// useApp hook
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};