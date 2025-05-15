
import { Sidebar } from "@/components/Layout/Sidebar";
import { AppHeader } from "@/components/Layout/AppHeader";
import { useApp } from "@/context/AppContext";
import { Navigate, Outlet } from "react-router-dom";

export function AppLayout() {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col w-full overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
