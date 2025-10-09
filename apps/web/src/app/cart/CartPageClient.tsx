"use client";

import { useCart } from "@/components/CartProvider";
import StaticImage from "@/components/StaticImage";
import GlobalHeroBackground from "@/components/ui/global-hero-background";
import LiquidGlass from "@/components/ui/LiquidGlass";
import Link from "next/link";
export default function CartPageClient() {
  const { items, setQty, remove, clear, totalCents } = useCart();

  return (
    <main className="min-h-screen p-6 sm:p-10 relative overflow-hidden">
      {/* Ambient background consistent with auth pages */}
      <GlobalHeroBackground useImage={false} />
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <img src="/svgs/1.svg" alt="" className="absolute opacity-[0.20] animate-float-slow select-none" style={{ top: '6%', left: '4%', width: '220px' }} />
        <img src="/svgs/2.svg" alt="" className="absolute opacity-[0.18] animate-drift select-none" style={{ bottom: '10%', left: '12%', width: '260px' }} />
        <img src="/svgs/3.svg" alt="" className="absolute opacity-[0.16] animate-float select-none" style={{ top: '12%', right: '8%', width: '280px' }} />
        <img src="/svgs/5.svg" alt="" className="absolute opacity-[0.12] animate-float select-none hidden md:block" style={{ bottom: '6%', right: '4%', width: '320px', background: 'transparent', mixBlendMode: 'multiply' as any }} />
        <img src="/svgs/4.svg" alt="" className="absolute opacity-[0.14] animate-drift-slow select-none" style={{ top: '40%', left: '50%', transform: 'translateX(-50%)', width: '360px', background: 'transparent', mixBlendMode: 'multiply' as any }} />
        <img src="/svgs/7.svg" alt="" className="absolute opacity-[0.10] animate-drift-slow select-none hidden sm:block" style={{ top: '18%', left: '18%', width: '260px', background: 'transparent', mixBlendMode: 'multiply' as any }} />
        <img src="/svgs/8.svg" alt="" className="absolute opacity-[0.12] animate-float select-none hidden lg:block" style={{ bottom: '18%', left: '50%', transform: 'translateX(-50%)', width: '300px', background: 'transparent', mixBlendMode: 'multiply' as any }} />
        <img src="/svgs/9.svg" alt="" className="absolute opacity-[0.08] animate-float-slow select-none hidden xl:block" style={{ top: '8%', right: '24%', width: '340px', background: 'transparent', mixBlendMode: 'multiply' as any }} />
      </div>

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Hero-like header using LiquidGlass */}
        <div className="mb-8">
          <LiquidGlass cornerRadius={24} padding="0" className="w-full" tint="rose">
            <div className="px-6 py-6 sm:px-8 sm:py-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-amber-900">
                Your Cart
              </h1>
              <p className="mt-2 inline-flex items-center gap-2 text-base sm:text-lg text-amber-900/90">
                <span className="inline-block w-2 h-2 bg-amber-600 rounded-full animate-pulse" />
                {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
              </p>
              <div className="mt-4">
                <Link href="/products" className="inline-flex items-center px-4 py-2 rounded-lg border border-amber-200 bg-amber-100 text-amber-900 font-medium hover:bg-amber-200 transition-colors">
                  Continue shopping
                </Link>
              </div>
            </div>
          </LiquidGlass>
        </div>
        
        {items.length === 0 ? (
          <div className="card-base card-glass p-8 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">Your cart is empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LiquidGlass cornerRadius={24} padding="0" className="w-full ring-1 ring-rose-200/40 dark:ring-white/10" tint="rose">
              <div className="p-6 relative">
                {/* warm gradient accent */}
                <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-[radial-gradient(80%_60%_at_50%_0%,rgba(244,114,182,0.18),rgba(255,255,255,0)_60%)] dark:bg-[radial-gradient(80%_60%_at_50%_0%,rgba(244,114,182,0.08),rgba(0,0,0,0)_60%)]" />
                {/* subtle top divider glow */}
                <div aria-hidden className="pointer-events-none absolute top-0 left-0 right-0 h-px rounded-[inherit] bg-gradient-to-r from-rose-200/50 via-rose-300/50 to-rose-200/50" />
                <div className="mb-3 text-lg font-semibold text-amber-900 dark:text-amber-900">Items in your cart</div>
                {/* Desktop view */}
                <div className="hidden md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-amber-900 dark:text-amber-900">
                        <th className="py-2">Item</th>
                        <th className="py-2">Price</th>
                        <th className="py-2">Qty</th>
                        <th className="py-2">Total</th>
                        <th className="py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it) => (
                        <tr
                          key={it.id}
                          className="border-t border-amber-100/40 dark:border-white/10 transition-colors hover:bg-rose-50/50 dark:hover:bg-rose-500/10"
                        >
                          <td className="py-2 pr-2">
                            <div className="flex items-center gap-3">
                              {it.image ? (
                                <StaticImage fileName={it.image} alt={it.title} className="h-14 w-14 object-cover rounded-lg shadow-sm ring-1 ring-transparent hover:ring-rose-300 transition" />
                              ) : (
                                <div className="h-14 w-14 rounded-lg bg-light-muted/10 dark:bg-dark-muted/10" />
                              )}
                              <div>
                                <div className="font-semibold text-amber-900 dark:text-amber-900">{it.title}</div>
                                {it.variantId && (
                                  <div className="mt-0.5 inline-block px-2 py-0.5 rounded-full bg-rose-100/70 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200 border border-rose-200/50 dark:border-rose-400/20 text-[11px] font-medium">
                                    Variant: {it.variantId}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-2 pr-2 font-semibold text-amber-900 dark:text-amber-900">{(it.priceCents/100).toFixed(2)} {it.currency}</td>
                          <td className="py-2 pr-2">
                            <div className="inline-flex items-center gap-2">
                              <button className="btn-secondary hover:brightness-110 text-rose-800 dark:text-rose-200" onClick={() => setQty(it.id, Math.max(1, it.qty - 1))}>-</button>
                              <input
                                type="number"
                                min={1}
                                className="w-16 text-center border border-amber-300 rounded-lg px-2 py-1 bg-white text-zinc-900 placeholder:text-zinc-500 dark:bg-zinc-800/70 dark:border-white/10 dark:text-zinc-100 focus-visible:ring-1 focus-visible:ring-rose-300 focus:outline-none"
                                value={it.qty}
                                onChange={(e) => setQty(it.id, Math.max(1, Number(e.target.value) || 1))}
                              />
                              <button className="btn-secondary hover:brightness-110 text-rose-800 dark:text-rose-200" onClick={() => setQty(it.id, it.qty + 1)}>+</button>
                            </div>
                          </td>
                          <td className="py-2 pr-2 font-semibold text-amber-900 dark:text-amber-900">{((it.priceCents * it.qty)/100).toFixed(2)} {it.currency}</td>
                          <td className="py-2 pr-2">
                            <button 
                              className="text-sm text-amber-600 dark:text-amber-300 border border-rose-200/60 dark:border-rose-400/20 bg-rose-50/40 dark:bg-rose-500/5 hover:bg-rose-100/60 dark:hover:bg-rose-500/10 rounded-md px-2 py-1 transition-colors" 
                              onClick={() => {
                                if (window.confirm(`Remove ${it.title} from cart?`)) {
                                  remove(it.id);
                                }
                              }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Mobile view */}
                <div className="md:hidden">
                  <ul className="space-y-4">
                    {items.map((it) => (
                      <li
                        key={it.id}
                        className="border border-amber-100/60 dark:border-white/10 pb-4 px-3 pt-3 rounded-xl bg-rose-50/40 dark:bg-rose-500/5 shadow-sm backdrop-blur-[2px]"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          {it.image ? (
                            <StaticImage fileName={it.image} alt={it.title} className="h-16 w-16 object-cover rounded-lg shadow-sm ring-1 ring-transparent hover:ring-rose-300 transition" />
                          ) : (
                            <div className="h-16 w-16 rounded-lg bg-light-muted/10 dark:bg-dark-muted/10" />
                          )}
                          <div className="flex-1">
                            <div className="font-medium text-amber-900 dark:text-amber-900">{it.title}</div>
                            {it.variantId && (
                              <div className="mt-0.5 inline-block px-2 py-0.5 rounded-full bg-rose-100/70 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200 border border-rose-200/50 dark:border-rose-400/20 text-[11px] font-medium">
                                Variant: {it.variantId}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm text-amber-900 dark:text-amber-900">Price:</div>
                          <div className="font-semibold text-amber-900 dark:text-amber-900">{(it.priceCents/100).toFixed(2)} {it.currency}</div>
                        </div>
                        
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm text-amber-900 dark:text-amber-900">Quantity:</div>
                          <div className="flex items-center gap-2">
                            <button className="btn-secondary text-xs h-7 w-7 flex items-center justify-center hover:brightness-110" onClick={() => setQty(it.id, Math.max(1, it.qty - 1))}>-</button>
                            <input
                              type="number"
                              min={1}
                              className="w-12 text-center border border-amber-200 rounded-lg px-2 py-1 bg-white/90 backdrop-blur-md text-sm text-zinc-900 placeholder:text-zinc-500 dark:bg-zinc-800/60 dark:border-white/10 dark:text-zinc-100 focus-visible:ring-1 focus-visible:ring-rose-300 focus:outline-none"
                              value={it.qty}
                              onChange={(e) => setQty(it.id, Math.max(1, Number(e.target.value) || 1))}
                            />
                            <button className="btn-secondary text-xs h-7 w-7 flex items-center justify-center hover:brightness-110 text-rose-800 dark:text-rose-200" onClick={() => setQty(it.id, it.qty + 1)}>+</button>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center mb-3">
                          <div className="text-sm text-amber-900 dark:text-amber-900">Total:</div>
                          <div className="font-semibold text-amber-900 dark:text-amber-900">{((it.priceCents * it.qty)/100).toFixed(2)} {it.currency}</div>
                        </div>
                        
                        <button 
                          className="text-sm text-amber-600 dark:text-amber-300 w-full text-center border border-rose-200/60 dark:border-rose-400/20 bg-rose-50/40 dark:bg-rose-500/5 hover:bg-rose-100/60 dark:hover:bg-rose-500/10 rounded-md px-2 py-1 transition-colors" 
                          onClick={() => {
                            if (window.confirm(`Remove ${it.title} from cart?`)) {
                              remove(it.id);
                            }
                          }}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </LiquidGlass>
          </div>
          <div className="h-fit">
            <LiquidGlass cornerRadius={24} padding="0" className="w-full h-full ring-1 ring-rose-200/40 dark:ring-white/10" tint="rose">
              <div className="p-6 relative">
                {/* subtle background accent */}
                <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-[radial-gradient(90%_70%_at_50%_0%,rgba(244,114,182,0.15),rgba(255,255,255,0)_60%)] dark:bg-[radial-gradient(90%_70%_at_50%_0%,rgba(244,114,182,0.07),rgba(0,0,0,0)_60%)]" />
                <div aria-hidden className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-rose-200/50 via-rose-300/50 to-rose-200/50" />
                <div className="text-lg font-semibold mb-2 text-amber-900 dark:text-amber-900">Summary</div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm text-amber-900/70 dark:text-amber-900/70">Subtotal</div>
                  <div className="text-sm font-semibold text-amber-900 dark:text-amber-900">{(totalCents/100).toFixed(2)} {items[0]?.currency || 'EUR'}</div>
                </div>
                <div className="text-xs text-amber-900/60 dark:text-amber-900/60 mb-4">Shipping and taxes calculated at checkout.</div>
                <a
                  href="/checkout"
                  className="group relative w-full block text-center rounded-xl px-4 py-3 font-semibold text-amber-900 dark:text-amber-900 shadow-sm ring-1 ring-rose-200/60 dark:ring-rose-400/20 bg-gradient-to-r from-rose-100/80 via-amber-100/80 to-rose-100/80 dark:from-rose-500/20 dark:via-amber-400/20 dark:to-rose-500/20 hover:from-rose-100 dark:hover:from-rose-500/30 hover:to-amber-100 dark:hover:to-amber-400/30 transition-colors"
                >
                  Checkout
                  <span aria-hidden className="absolute inset-0 rounded-xl pointer-events-none shadow-[0_0_0_1px_rgba(244,114,182,0.25)_inset]" />
                </a>
              </div>
            </LiquidGlass>
          </div>
        </div>
        )}
      </div>
    </main>
  );
}
