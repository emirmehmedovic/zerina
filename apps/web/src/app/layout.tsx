import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import CartProvider from "@/components/CartProvider";
import { ToastProvider } from "../components/ToastProvider";
import ConditionalNavbarFooter from "@/components/ConditionalNavbarFooter";
import { metadata } from "./metadata";

export { metadata };

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AE" suppressHydrationWarning className="force-light">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-light-background text-light-text`}>
        {recaptchaSiteKey ? (
          <Script
            id="recaptcha-enterprise"
            src={`https://www.google.com/recaptcha/enterprise.js?render=${recaptchaSiteKey}`}
            strategy="afterInteractive"
            onError={(err) => {
              console.error("Failed to load reCAPTCHA", err);
            }}
          />
        ) : null}
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
