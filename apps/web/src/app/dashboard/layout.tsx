"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { API_URL } from "@/lib/api";
import { LayoutDashboard, BarChart2, Package, ShoppingBag, ClipboardList, MapPin, Home, Menu, X } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

type Me = { id: string; role: "BUYER"|"VENDOR"|"ADMIN" };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/v1/users/me`, { credentials: "include" });
        if (res.ok) setMe(await res.json());
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!me || (me.role !== "VENDOR" && me.role !== "ADMIN")) {
    if (typeof window !== 'undefined') window.location.href = "/login";
    return null;
  }

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: <LayoutDashboard className="h-4 w-4 mr-2" /> },
    { href: "/dashboard/analytics", label: "Analytics", icon: <BarChart2 className="h-4 w-4 mr-2" /> },
    { href: "/dashboard/products", label: "Products", icon: <Package className="h-4 w-4 mr-2" /> },
    { href: "/dashboard/products/new", label: "New Product", icon: <ShoppingBag className="h-4 w-4 mr-2" /> },
    { href: "/dashboard/orders", label: "Orders", icon: <ClipboardList className="h-4 w-4 mr-2" /> },
    { href: "/dashboard/addresses", label: "My Addresses", icon: <MapPin className="h-4 w-4 mr-2" /> },
  ];

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard Overview";
    if (pathname === "/dashboard/analytics") return "Analytics";
    if (pathname === "/dashboard/products") return "Products";
    if (pathname === "/dashboard/products/new") return "Create New Product";
    if (pathname === "/dashboard/orders") return "Orders";
    if (pathname === "/dashboard/addresses") return "My Addresses";
    if (pathname?.startsWith("/dashboard/analytics/")) return "Analytics Details";
    return "Vendor Dashboard";
  };

  return (
    // Override the global layout with a clean admin layout
    <div className="min-h-screen bg-white text-gray-800">
      <div className="flex h-screen">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-20 bg-gray-800/50 lg:hidden" 
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
        
        {/* Sidebar */}
        <aside 
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-50 border-r border-gray-200 flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="font-bold text-xl text-blue-600">Vendor Panel</div>
            </div>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link 
                      href={item.href}
                      className={`flex items-center px-4 py-2 rounded-md transition-colors ${isActive 
                        ? 'bg-blue-100 text-blue-700 font-medium' 
                        : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            
            <div className="mt-8 pt-4 border-t border-gray-200">
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">Actions</div>
              <ul className="space-y-1">
                <li>
                  <Link 
                    href="/" 
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Back to Site
                  </Link>
                </li>
                <li>
                  <LogoutButton />
                </li>
              </ul>
            </div>
          </nav>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 w-full lg:w-auto">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                {/* Mobile menu button */}
                <button 
                  className="lg:hidden mr-3 p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  aria-label="Toggle sidebar"
                >
                  {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
                
                <h1 className="text-xl font-semibold text-gray-800">
                  {getPageTitle()}
                </h1>
              </div>
              <div className="flex items-center space-x-3">
                <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm flex items-center">
                  <span className="mr-1">Help</span>
                </button>
                <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                  V
                </div>
              </div>
            </div>
          </header>
          
          {/* Page content */}
          <div className="p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
