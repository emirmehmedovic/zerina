"use client";

import { useMemo, useState } from "react";
import { useCart } from "./CartProvider";

export type Variant = { id: string; attributes: Record<string, string | number>; priceCents: number; stock: number; sku?: string };

export default function VariantSelector({
  variants,
  currency,
  productId,
  slug,
  title,
  image,
  basePriceCents,
}: {
  variants: Variant[];
  currency: string;
  productId: string;
  slug: string;
  title: string;
  image?: string | null;
  basePriceCents: number;
}) {
  const cart = useCart();
  const attrKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const v of variants) {
      if (v.attributes && typeof v.attributes === 'object') {
        Object.keys(v.attributes).forEach((k) => keys.add(k));
      }
    }
    return Array.from(keys);
  }, [variants]);

  const [selection, setSelection] = useState<Record<string, string>>({});

  const matched = useMemo(() => {
    return variants.find((v) => {
      if (!v.attributes || typeof v.attributes !== 'object') return false;
      for (const k of Object.keys(selection)) {
        if (selection[k] && String(v.attributes[k]) !== selection[k]) return false;
      }
      // ensure all keys selected
      return attrKeys.every((k) => selection[k]);
    });
  }, [variants, selection, attrKeys]);

  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const addSelectedToCart = () => {
    const price = matched ? matched.priceCents : basePriceCents;
    setAddingToCart(true);
    
    // Add to cart
    cart.add({
      productId,
      variantId: matched?.id,
      title,
      slug,
      priceCents: price,
      currency,
      image: image || undefined,
    });
    
    // Show success animation
    setAddedToCart(true);
    setTimeout(() => {
      setAddingToCart(false);
      setTimeout(() => setAddedToCart(false), 1500);
    }, 500);
  };

  // Compute available values for a given key based on current selection of other keys
  const availableValues = (key: string): string[] => {
    const other = { ...selection };
    delete other[key];
    const vals = new Set<string>();
    variants.forEach((v) => {
      if (!v.attributes) return;
      // Check if v matches all other selected keys
      for (const ok of Object.keys(other)) {
        if (other[ok] && String(v.attributes[ok]) !== other[ok]) return;
      }
      const val = v.attributes[key];
      if (val != null) vals.add(String(val));
    });
    return Array.from(vals);
  };

  return (
    <div className="mt-4 space-y-3">
      {attrKeys.length === 0 ? (
        <div className="text-sm text-light-muted dark:text-dark-muted">No selectable attributes.</div>
      ) : (
        <div className="space-y-3">
          {attrKeys.map((k) => {
            const values = Array.from(new Set(variants.map((v) => v.attributes?.[k]).filter(Boolean))).map(String);
            const avail = new Set(availableValues(k));
            return (
              <div key={k}>
                <div className="text-sm text-light-muted dark:text-dark-muted mb-1">{k}</div>
                <div className="flex flex-wrap gap-2">
                  {values.map((val) => {
                    const selected = selection[k] === val;
                    const isAvailable = avail.has(val);
                    return (
                      <button
                        key={val}
                        type="button"
                        disabled={!isAvailable && !selected}
                        onClick={() => setSelection((s) => ({ ...s, [k]: selected ? "" : val }))}
                        className={`text-xs px-2 py-1 rounded-full border ${selected ? 'bg-white/60 dark:bg-zinc-800/60' : 'bg-transparent'} ${!isAvailable && !selected ? 'opacity-40 cursor-not-allowed' : ''}`}
                        aria-pressed={selected}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-sm">
        {matched ? (
          <>
            <div className="mb-1">Price: <span className="font-medium">{(matched.priceCents/100).toFixed(2)} {currency}</span></div>
            <div className="mb-2">Stock: {matched.stock}</div>
            <button 
              className={`btn-primary relative overflow-hidden ${addedToCart ? 'bg-green-600 border-green-700' : ''}`} 
              disabled={matched.stock <= 0 || addingToCart} 
              onClick={addSelectedToCart}
            >
              <span className={`transition-all duration-300 ${addingToCart ? 'opacity-0' : 'opacity-100'}`}>
                {addedToCart ? 'Added to cart ✓' : 'Add to cart'}
              </span>
              {addingToCart && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              )}
            </button>
          </>
        ) : (
          <>
            <div className="text-light-muted dark:text-dark-muted mb-2">Select all attributes to see price and availability.</div>
            {attrKeys.length === 0 && (
              <button className="btn-primary" onClick={addSelectedToCart}>Add to cart</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
