"use client";

import { Shop } from "@/lib/types";
import Link from "next/link";
import { ExternalLink, PlusCircle } from "lucide-react";

interface ShopDetailsProps {
  shop: Shop;
}

export default function ShopDetails({ shop }: ShopDetailsProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'SUSPENDED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
    }
  };

  return (
    <div className="card-base card-glass p-6 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
        <h2 className="text-2xl font-bold mb-2 sm:mb-0">Your Shop Details</h2>
        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${getStatusVariant(shop.status)}`}>
          {shop.status.toLowerCase()}
        </span>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <p className="text-sm text-light-muted dark:text-dark-muted">Shop Name</p>
          <p className="text-lg font-semibold">{shop.name}</p>
        </div>
        {shop.description && (
          <div>
            <p className="text-sm text-light-muted dark:text-dark-muted">Description</p>
            <p className="text-zinc-700 dark:text-zinc-300">{shop.description}</p>
          </div>
        )}
        <div>
          <p className="text-sm text-light-muted dark:text-dark-muted">Public URL</p>
          <Link href={`/shops/${shop.slug}`} className="text-primary hover:underline flex items-center gap-2">
            /shops/{shop.slug} <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 pt-6 border-t border-light-glass-border">
        <Link href="/dashboard/products/new" className="btn-primary inline-flex items-center">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Product
        </Link>
        <Link href={`/shops/${shop.slug}`} className="btn-secondary inline-flex items-center">
          <ExternalLink className="mr-2 h-4 w-4" />
          View Public Shop Page
        </Link>
      </div>
    </div>
  );
}
