"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import AdminGuard from "./Guard";
import { Home, LayoutDashboard, Package, ShoppingBag, Store, UserPlus, Menu, X, LifeBuoy, User, Shield, BarChart2 } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import GlobalHeroBackground from "@/components/ui/global-hero-background";
import { Menu as HeadlessMenu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);
  
  const navItems = [
    { href: "/admin", label: "Overview", icon: <LayoutDashboard className="h-4 w-4 mr-2" /> },
    { href: "/admin/analytics", label: "Analytics", icon: <BarChart2 className="h-4 w-4 mr-2" /> },
    { href: "/admin/inventory", label: "Inventory", icon: <Package className="h-4 w-4 mr-2" /> },
    { href: "/admin/products/new", label: "New Product", icon: <ShoppingBag className="h-4 w-4 mr-2" /> },
    { href: "/admin/shops", label: "Shops", icon: <Store className="h-4 w-4 mr-2" /> },
    { href: "/admin/admins/new", label: "Create Admin", icon: <UserPlus className="h-4 w-4 mr-2" /> },
  ];

  const getPageTitle = () => {
    if (pathname === "/admin") return "Admin Overview";
    if (pathname === "/admin/inventory") return "Inventory Management";
    if (pathname === "/admin/products/new") return "Create New Product";
    if (pathname === "/admin/shops") return "Shops Management";
    if (pathname === "/admin/admins/new") return "Create Admin Account";
    return "Admin Panel";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 to-black text-zinc-200">
      <AdminGuard />
      <GlobalHeroBackground src="/abstract-bg.jpg" overlayOpacity={0.8} />
      <div className="flex h-screen relative z-10">
        {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)}></div>}
        
        <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-black/20 backdrop-blur-lg border-r border-white/10 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-5 border-b border-white/10 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-600">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <div className="font-bold text-xl text-white">Admin Panel</div>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link href={item.href} className={`group flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-red-500/20 to-orange-600/20 text-white shadow-inner-glow font-medium' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
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
                <li><Link href="/" className="group flex items-center px-3 py-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><Home className="h-4 w-4 mr-2" />Back to Site</Link></li>
                <li><LogoutButton className="group flex w-full items-center px-3 py-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors" /></li>
              </ul>
            </div>
          </nav>
        </aside>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-black/10 backdrop-blur-lg border-b border-white/10">
            <div className="px-6 h-20 flex items-center justify-between">
              <div className="flex items-center">
                <button className="lg:hidden -ml-2 mr-3 p-2 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
                  {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
                <h1 className="text-xl font-semibold text-white tracking-wide">{getPageTitle()}</h1>
              </div>
              <div className="flex items-center space-x-4">
                <button className="group flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors">
                  <LifeBuoy className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
                  <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">Help</span>
                </button>
                <HeadlessMenu as="div" className="relative inline-block text-left">
                  <div>
                    <HeadlessMenu.Button className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-orange-600 text-white flex items-center justify-center font-bold text-sm ring-2 ring-offset-2 ring-offset-zinc-900 ring-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
                      A
                    </HeadlessMenu.Button>
                  </div>
                  <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                    <HeadlessMenu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-white/10 rounded-md bg-black/50 backdrop-blur-lg shadow-lg ring-1 ring-white/10 focus:outline-none">
                      <div className="px-1 py-1 ">
                        <HeadlessMenu.Item>
                          {({ active }) => <Link href="/admin" className={`${active ? 'bg-white/10 text-white' : 'text-zinc-300'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}><User className="mr-2 h-5 w-5" />Profile</Link>}
                        </HeadlessMenu.Item>
                        <HeadlessMenu.Item>
                          {({ active }) => <Link href="/dashboard/settings/security" className={`${active ? 'bg-white/10 text-white' : 'text-zinc-300'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}><Shield className="mr-2 h-5 w-5" />Security</Link>}
                        </HeadlessMenu.Item>
                      </div>
                      <div className="px-1 py-1">
                        <HeadlessMenu.Item>
                          {({ active }) => <LogoutButton className={`${active ? 'bg-white/10 text-white' : 'text-zinc-300'} group flex w-full items-center rounded-md px-2 py-2 text-sm`} />}
                        </HeadlessMenu.Item>
                      </div>
                    </HeadlessMenu.Items>
                  </Transition>
                </HeadlessMenu>
              </div>
            </div>
          </header>
          
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
