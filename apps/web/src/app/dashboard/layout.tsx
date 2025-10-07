"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { API_URL } from "@/lib/api";
import { LayoutDashboard, BarChart2, Package, ShoppingBag, ClipboardList, MapPin, Home, Menu, X, LifeBuoy, User, Shield, LogOut, FileText } from "lucide-react";
import { Menu as HeadlessMenu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
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
    { href: "/dashboard/blog", label: "Blog", icon: <FileText className="h-4 w-4 mr-2" /> },
    { href: "/dashboard/blog/new", label: "New Blog Post", icon: <FileText className="h-4 w-4 mr-2" /> },
    { href: "/dashboard/orders", label: "Orders", icon: <ClipboardList className="h-4 w-4 mr-2" /> },
    { href: "/dashboard/addresses", label: "My Addresses", icon: <MapPin className="h-4 w-4 mr-2" /> },
    { href: "/dashboard/shop/appearance", label: "Shop Appearance", icon: <ShoppingBag className="h-4 w-4 mr-2" /> },
  ];

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard Overview";
    if (pathname === "/dashboard/analytics") return "Analytics";
    if (pathname === "/dashboard/products") return "Products";
    if (pathname === "/dashboard/products/new") return "Create New Product";
    if (pathname === "/dashboard/blog") return "Blog";
    if (pathname === "/dashboard/blog/new") return "Create New Blog Post";
    if (pathname?.startsWith("/dashboard/blog/")) return "Edit Blog Post";
    if (pathname === "/dashboard/orders") return "Orders";
    if (pathname === "/dashboard/addresses") return "My Addresses";
    if (pathname === "/dashboard/shop/appearance") return "Shop Appearance";
    if (pathname?.startsWith("/dashboard/analytics/")) return "Analytics Details";
    return "Vendor Dashboard";
  };

  return (
    <div className="min-h-screen admin-dark-bg text-zinc-200">
      <div className="flex h-screen relative z-10">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden" 
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
        
        {/* Sidebar */}
        <aside 
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-black/20 backdrop-blur-lg border-r border-white/10 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="p-5 border-b border-white/10 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <div className="font-bold text-xl text-white">Vendor Panel</div>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link 
                      href={item.href} 
                      className={`group flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive 
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white shadow-inner-glow font-medium'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            
            <div className="mt-auto pt-4 space-y-4">
              <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase">Actions</div>
              <ul className="space-y-1.5">
                <li>
                  <Link 
                    href="/" 
                    className="group flex items-center px-3 py-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Back to Site
                  </Link>
                </li>
                <li>
                  <LogoutButton className="group flex w-full items-center px-3 py-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors" />
                </li>
              </ul>
            </div>
          </nav>
        </aside>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-black/10 backdrop-blur-lg border-b border-white/10">
            <div className="px-6 h-20 flex items-center justify-between">
              <div className="flex items-center">
                {/* Mobile menu button */}
                <button 
                  className="lg:hidden -ml-2 mr-3 p-2 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  aria-label="Toggle sidebar"
                >
                  {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />} 
                </button>
                
                <h1 className="text-xl font-semibold text-white tracking-wide">
                  {getPageTitle()}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <button className="group flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors">
                  <LifeBuoy className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
                  <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">Help</span>
                </button>
                <HeadlessMenu as="div" className="relative inline-block text-left">
                  <div>
                    <HeadlessMenu.Button className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm ring-2 ring-offset-2 ring-offset-zinc-900 ring-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
                      V
                    </HeadlessMenu.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <HeadlessMenu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-white/10 rounded-md bg-black/50 backdrop-blur-lg shadow-lg ring-1 ring-white/10 focus:outline-none">
                      <div className="px-1 py-1 ">
                        <HeadlessMenu.Item>
                          {({ active }) => (
                            <Link href="/dashboard" className={`${active ? 'bg-white/10 text-white' : 'text-zinc-300'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}>
                              <User className="mr-2 h-5 w-5" />
                              Profile
                            </Link>
                          )}
                        </HeadlessMenu.Item>
                        <HeadlessMenu.Item>
                          {({ active }) => (
                            <Link href="/dashboard/settings/security" className={`${active ? 'bg-white/10 text-white' : 'text-zinc-300'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}>
                              <Shield className="mr-2 h-5 w-5" />
                              Security
                            </Link>
                          )}
                        </HeadlessMenu.Item>
                      </div>
                      <div className="px-1 py-1">
                        <HeadlessMenu.Item>
                          {({ active }) => (
                            <LogoutButton className={`${active ? 'bg-white/10 text-white' : 'text-zinc-300'} group flex w-full items-center rounded-md px-2 py-2 text-sm`} />
                          )}
                        </HeadlessMenu.Item>
                      </div>
                    </HeadlessMenu.Items>
                  </Transition>
                </HeadlessMenu>
              </div>
            </div>
          </header>
          
          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-6 lg:p-8 max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
