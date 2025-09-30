"use client";

import { useCart } from "@/components/CartProvider";
import StaticImage from "@/components/StaticImage";

export default function CartPage() {
  const { items, setQty, remove, clear, totalCents } = useCart();

  return (
    <main className="min-h-screen p-6 sm:p-10 relative overflow-hidden">
      {/* Subtle decorative elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-slate-200/10 to-zinc-200/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-zinc-200/10 to-slate-200/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Enhanced header */}
        <div className="mb-10 relative">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-zinc-400 via-zinc-300 to-transparent rounded-full" />
          <h1 className="text-4xl sm:text-5xl font-bold mb-3 text-zinc-900 dark:text-zinc-100 tracking-tight">
            Shopping Cart
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-zinc-400 rounded-full animate-pulse" />
            {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
        
        {items.length === 0 ? (
          <div className="card-base card-glass p-8 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">Your cart is empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card-base card-glass p-4">
            {/* Desktop view */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2">Item</th>
                    <th className="py-2">Price</th>
                    <th className="py-2">Qty</th>
                    <th className="py-2">Total</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-t border-light-glass-border">
                      <td className="py-2 pr-2">
                        <div className="flex items-center gap-3">
                          {it.image ? (
                            <StaticImage fileName={it.image} alt={it.title} className="h-14 w-14 object-cover rounded" />
                          ) : (
                            <div className="h-14 w-14 rounded bg-light-muted/10 dark:bg-dark-muted/10" />
                          )}
                          <div>
                            <div className="font-medium">{it.title}</div>
                            {it.variantId && <div className="text-xs text-light-muted dark:text-dark-muted">Variant: {it.variantId}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="py-2 pr-2">{(it.priceCents/100).toFixed(2)} {it.currency}</td>
                      <td className="py-2 pr-2">
                        <div className="inline-flex items-center gap-2">
                          <button className="btn-secondary" onClick={() => setQty(it.id, Math.max(1, it.qty - 1))}>-</button>
                          <input
                            type="number"
                            min={1}
                            className="w-16 text-center border border-light-glass-border rounded-md px-2 py-1 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30"
                            value={it.qty}
                            onChange={(e) => setQty(it.id, Math.max(1, Number(e.target.value) || 1))}
                          />
                          <button className="btn-secondary" onClick={() => setQty(it.id, it.qty + 1)}>+</button>
                        </div>
                      </td>
                      <td className="py-2 pr-2">{((it.priceCents * it.qty)/100).toFixed(2)} {it.currency}</td>
                      <td className="py-2 pr-2">
                        <button 
                          className="text-sm underline underline-offset-4 text-rose-600" 
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
                  <li key={it.id} className="border-b border-light-glass-border pb-4">
                    <div className="flex items-center gap-3 mb-2">
                      {it.image ? (
                        <StaticImage fileName={it.image} alt={it.title} className="h-16 w-16 object-cover rounded" />
                      ) : (
                        <div className="h-16 w-16 rounded bg-light-muted/10 dark:bg-dark-muted/10" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{it.title}</div>
                        {it.variantId && <div className="text-xs text-light-muted dark:text-dark-muted">Variant: {it.variantId}</div>}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm">Price:</div>
                      <div className="font-medium">{(it.priceCents/100).toFixed(2)} {it.currency}</div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm">Quantity:</div>
                      <div className="flex items-center gap-2">
                        <button className="btn-secondary text-xs h-7 w-7 flex items-center justify-center" onClick={() => setQty(it.id, Math.max(1, it.qty - 1))}>-</button>
                        <input
                          type="number"
                          min={1}
                          className="w-12 text-center border border-light-glass-border rounded-md px-2 py-1 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30 text-sm"
                          value={it.qty}
                          onChange={(e) => setQty(it.id, Math.max(1, Number(e.target.value) || 1))}
                        />
                        <button className="btn-secondary text-xs h-7 w-7 flex items-center justify-center" onClick={() => setQty(it.id, it.qty + 1)}>+</button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-sm">Total:</div>
                      <div className="font-medium">{((it.priceCents * it.qty)/100).toFixed(2)} {it.currency}</div>
                    </div>
                    
                    <button 
                      className="text-sm underline underline-offset-4 text-rose-600 w-full text-center" 
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
            <div className="mt-4">
              <button 
                className="btn-danger" 
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear your entire cart?')) {
                    clear();
                  }
                }}
              >
                Clear cart
              </button>
            </div>
          </div>
          <div className="card-base card-glass p-4 h-fit">
            <div className="text-lg font-semibold mb-2">Summary</div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm text-light-muted dark:text-dark-muted">Subtotal</div>
              <div className="text-sm font-medium">{(totalCents/100).toFixed(2)} {items[0]?.currency || 'EUR'}</div>
            </div>
            <div className="text-xs text-light-muted dark:text-dark-muted mb-3">Shipping and taxes calculated at checkout.</div>
            <a href="/checkout" className="btn-primary w-full text-center block">Checkout</a>
          </div>
        </div>
        )}
      </div>
    </main>
  );
}
