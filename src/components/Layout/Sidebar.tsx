import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Users } from "lucide-react";
import {
  Home,
  ShoppingCart,
  Package,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  LogOut,
  FileText,
  CreditCard,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { logout } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="flex items-center justify-between p-4">
        {!collapsed && (
          <h2 className="text-xl font-bold text-sidebar-foreground gradient-heading">
            iPhone 777
          </h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="rounded-full"
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          <SidebarLink
            to="/"
            icon={<Home />}
            label="Boshqaruv paneli"
            collapsed={collapsed}
            active={location.pathname === "/"}
          />
          <SidebarLink
            to="/pos"
            icon={<ShoppingCart />}
            label="Do'kon"
            collapsed={collapsed}
            active={location.pathname === "/pos"}
          />
          <SidebarLink
            to="/sales"
            icon={<FileText />}
            label="Sotuvlar"
            collapsed={collapsed}
            active={location.pathname === "/sales"}
          />
          <SidebarLink
            to="/products"
            icon={<Package />}
            label="Mahsulotlar"
            collapsed={collapsed}
            active={location.pathname === "/products"}
          />
          <SidebarLink
            to="/inventory"
            icon={<Package />}
            label="Ombor"
            collapsed={collapsed}
            active={location.pathname === "/inventory"}
          />
          <SidebarLink
            to="/reports"
            icon={<BarChart3 />}
            label="Hisobotlar"
            collapsed={collapsed}
            active={location.pathname === "/reports"}
          />
          <SidebarLink
            to="/installments"
            icon={<CreditCard />}
            label="Muddatli to'lovlar"
            collapsed={collapsed}
            active={location.pathname.startsWith("/installments")}
          />
          <SidebarLink
            to="/employees"
            icon={<Users />}
            label="Hodimlar"
            collapsed={collapsed}
            active={location.pathname === "/employees"}
          />
           <SidebarLink
            to="/hisobot"
            icon={<notebook-pen />}
            label="Daftar"
            collapsed={collapsed}
            active={location.pathname === "/hisobot"}
          />
        </nav>
      </div>

      <div className="p-4">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed ? "px-2" : "px-4"
          )}
          onClick={logout}
        >
          <LogOut className="h-5 w-5 mr-2" />
          {!collapsed && <span>Chiqish</span>}
        </Button>
      </div>
    </div>
  );
}

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  active: boolean;
}

function SidebarLink({ to, icon, label, collapsed, active }: SidebarLinkProps) {
  return (
    <Link to={to}>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent",
          collapsed ? "px-2" : "px-4",
          active ? "bg-sidebar-accent" : ""
        )}
      >
        <span className="h-5 w-5 mr-2">{icon}</span>
        {!collapsed && <span>{label}</span>}
      </Button>
    </Link>
  );
}


// import { cn } from "@/lib/utils";
// import { Button } from "@/components/ui/button";
// import { useApp } from "@/context/AppContext";
// import { useState } from "react";
// import { Link, useLocation } from "react-router-dom";
// import {
//   Users,
//   Home,
//   ShoppingCart,
//   Package,
//   ChevronLeft,
//   ChevronRight,
//   BarChart3,
//   LogOut,
//   FileText,
//   CreditCard,
//   NotebookPen,
// } from "lucide-react";

// interface SidebarProps {
//   className?: string;
// }

// export function Sidebar({ className }: SidebarProps) {
//   const { logout } = useApp();
//   const [collapsed, setCollapsed] = useState(false);
//   const location = useLocation();

//   const toggleSidebar = () => {
//     setCollapsed(!collapsed);
//   };

//   return (
//     <div
//       className={cn(
//         "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
//         collapsed ? "w-16" : "w-64",
//         className
//       )}
//     >
//       <div className="flex items-center justify-between p-4">
//         {!collapsed && (
//           <h2 className="text-xl font-bold text-sidebar-foreground gradient-heading">
//             iPhone 777
//           </h2>
//         )}
//         <Button
//           variant="ghost"
//           size="icon"
//           onClick={toggleSidebar}
//           className="rounded-full"
//         >
//           {collapsed ? <ChevronRight /> : <ChevronLeft />}
//         </Button>
//       </div>

//       <div className="flex-1 overflow-y-auto py-4">
//         <nav className="space-y-1 px-2">
//           <SidebarLink
//             to="/"
//             icon={<Home />}
//             label="Boshqaruv paneli"
//             collapsed={collapsed}
//             active={location.pathname === "/"}
//           />
//           <SidebarLink
//             to="/pos"
//             icon={<ShoppingCart />}
//             label="Do'kon"
//             collapsed={collapsed}
//             active={location.pathname === "/pos"}
//           />
//           <SidebarLink
//             to="/sales"
//             icon={<FileText />}
//             label="Sotuvlar"
//             collapsed={collapsed}
//             active={location.pathname === "/sales"}
//           />
//           <SidebarLink
//             to="/products"
//             icon={<Package />}
//             label="Mahsulotlar"
//             collapsed={collapsed}
//             active={location.pathname === "/products"}
//           />
//           <SidebarLink
//             to="/inventory"
//             icon={<Package />} // Agar ombor uchun boshqa ikona bo'lsa, o'zgartiring
//             label="Ombor"
//             collapsed={collapsed}
//             active={location.pathname === "/inventory"}
//           />
//           <SidebarLink
//             to="/reports"
//             icon={<BarChart3 />}
//             label="Hisobotlar"
//             collapsed={collapsed}
//             active={location.pathname === "/reports"}
//           />
//           <SidebarLink
//             to="/installments"
//             icon={<CreditCard />}
//             label="Muddatli to'lovlar"
//             collapsed={collapsed}
//             active={location.pathname.startsWith("/installments")}
//           />
//           <SidebarLink
//             to="/employees"
//             icon={<Users />}
//             label="Hodimlar"
//             collapsed={collapsed}
//             active={location.pathname === "/employees"}
//           />
//           <SidebarLink
//             to="/hisobot"
//             icon={<NotebookPen />} {/* Ikonkani bu yerda ishlatamiz */}
//             label="Daftar"
//             collapsed={collapsed}
//             active={location.pathname === "/hisobot"}
//           />
//         </nav>
//       </div>

//       <div className="p-4">
//         <Button
//           variant="ghost"
//           className={cn(
//             "w-full justify-start text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent",
//             collapsed ? "px-2" : "px-4"
//           )}
//           onClick={logout}
//         >
//           <LogOut className="h-5 w-5 mr-2" />
//           {!collapsed && <span>Chiqish</span>}
//         </Button>
//       </div>
//     </div>
//   );
// }

// interface SidebarLinkProps {
//   to: string;
//   icon: React.ReactNode;
//   label: string;
//   collapsed: boolean;
//   active: boolean;
// }

// function SidebarLink({ to, icon, label, collapsed, active }: SidebarLinkProps) {
//   return (
//     <Link to={to}>
//       <Button
//         variant="ghost"
//         className={cn(
//           "w-full justify-start text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent",
//           collapsed ? "px-2" : "px-4",
//           active ? "bg-sidebar-accent" : ""
//         )}
//       >
//         {/* Ikonka uchun span class'i bir xil bo'lishi uchun, ikonka ReactNode bo'lgani uchun to'g'ridan-to'g'ri propga beriladi */}
//         <span className="h-5 w-5 mr-2 flex items-center justify-center">{icon}</span>
//         {!collapsed && <span>{label}</span>}
//       </Button>
//     </Link>
//   );
// }