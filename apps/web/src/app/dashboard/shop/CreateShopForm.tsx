"use client";

import { useState } from "react";
import { API_URL } from "@/lib/api";
import { getCsrfToken } from "@/lib/csrf";
import { Shop } from "@/lib/types";
 

interface CreateShopFormProps {
  onShopCreated: (shop: Shop) => void;
  beforeCreate?: () => Promise<void>;
}

export default function CreateShopForm({ onShopCreated, beforeCreate }: CreateShopFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // Run prerequisite action if provided (e.g., account registration)
      if (beforeCreate) {
        await beforeCreate();
      }
      const csrf = await getCsrfToken();
      // Ensure user is a vendor (BUYER -> VENDOR upgrade)
      await fetch(`${API_URL}/api/v1/vendor/upgrade`, {
        method: "POST",
        headers: { "X-CSRF-Token": csrf },
        credentials: "include",
      }).catch(()=>{});

      const res = await fetch(`${API_URL}/api/v1/shops`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        credentials: "include",
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        let msg = body?.error || `Failed to create shop (${res.status})`;
        if (res.status === 403) msg = 'You need a vendor account to create a shop. Please try again.';
        throw new Error(msg);
      }
      const newShop = (await res.json()) as Shop;
      onShopCreated(newShop);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card-base card-glass p-6 md:p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">Create Your Shop</h2>
      <p className="text-light-muted dark:text-dark-muted mb-6">You don&apos;t have a shop yet. Fill out the form below to get started.</p>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium mb-2">Shop Name</label>
          <input
            id="name"
            required
            className="w-full border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Artisan Crafts Co."
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium mb-2">Description (Optional)</label>
          <textarea
            id="description"
            className="w-full border border-light-glass-border rounded-md px-3 py-2 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what makes your shop special..."
            rows={4}
          />
        </div>
        <div className="md:col-span-2 text-right">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Creating..." : "Create Shop"}
          </button>
        </div>
      </form>
    </div>
  );
}
