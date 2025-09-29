import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CartProvider from "@/components/CartProvider";
import { ToastProvider } from "../components/ToastProvider";
import ConditionalNavbarFooter from "@/components/ConditionalNavbarFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zerina - Multi-Vendor Marketplace",
  description: "A modern multi-vendor marketplace",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-light-background dark:bg-dark-background text-light-text dark:text-dark-text`}>
        <CartProvider>
          <ToastProvider>
            <div>
              <ConditionalNavbarFooter>
                {children}
              </ConditionalNavbarFooter>
            </div>
          </ToastProvider>
        </CartProvider>
      </body>
    </html>
  );
}
