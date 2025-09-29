"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";

interface AddToCartButtonProps {
  product: {
    productId: string;
    title: string;
    slug: string;
    priceCents: number;
    currency: string;
    image?: string | null;
    variantId?: string;
  };
  className?: string;
}

export default function AddToCartButton({ product, className = "" }: AddToCartButtonProps) {
  const cart = useCart();
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const handleAddToCart = () => {
    setAddingToCart(true);
    
    // Add to cart
    cart.add({
      productId: product.productId,
      variantId: product.variantId,
      title: product.title,
      slug: product.slug,
      priceCents: product.priceCents,
      currency: product.currency,
      image: product.image || undefined,
    });
    
    // Show success animation
    setAddedToCart(true);
    setTimeout(() => {
      setAddingToCart(false);
      setTimeout(() => setAddedToCart(false), 1500);
    }, 500);
  };

  return (
    <button 
      className={`btn-primary relative overflow-hidden mt-4 ${addedToCart ? 'bg-green-600 border-green-700' : ''} ${className}`} 
      disabled={addingToCart} 
      onClick={handleAddToCart}
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
  );
}
