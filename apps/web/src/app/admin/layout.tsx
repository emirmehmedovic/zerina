"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import AdminGuard from "./Guard";
import { Home, LayoutDashboard, Package, ShoppingBag, Store, UserPlus, Menu, X } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);
  
  const navItems = [
    { href: "/admin", label: "Overview", icon: <LayoutDashboard className="h-4 w-4 mr-2" /> },
    { href: "/admin/inventory", label: "Inventory", icon: <Package className="h-4 w-4 mr-2" /> },
    { href: "/admin/products/new", label: "New Product", icon: <ShoppingBag className="h-4 w-4 mr-2" /> },
    { href: "/admin/shops", label: "Shops", icon: <Store className="h-4 w-4 mr-2" /> },
    { href: "/admin/admins/new", label: "Create Admin", icon: <UserPlus className="h-4 w-4 mr-2" /> },
  ];

  return (
    // Override the global layout with a clean admin layout
    <div className="min-h-screen bg-white text-gray-800">
      <AdminGuard />
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
              <div className="font-bold text-xl text-blue-600">Admin Panel</div>
            </div>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
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
                  {pathname === "/admin" && "Dashboard Overview"}
                  {pathname === "/admin/inventory" && "Inventory Management"}
                  {pathname === "/admin/products/new" && "Create New Product"}
                  {pathname === "/admin/shops" && "Shops Management"}
                  {pathname === "/admin/admins/new" && "Create Admin Account"}
                  {!navItems.some(item => item.href === pathname) && "Admin Panel"}
                </h1>
              </div>
              <div className="flex items-center space-x-3">
                <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm flex items-center">
                  <span className="mr-1">Help</span>
                </button>
                <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                  A
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
