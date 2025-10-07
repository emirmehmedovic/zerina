import { API_URL } from "./api";

/**
 * Build a safe image URL for Next/Image.
 * - Returns absolute URL if `key` is already absolute (http/https).
 * - Otherwise prefixes with API_URL and ensures a leading slash.
 * - Falls back to a local placeholder if key is empty/invalid.
 */
export function imageUrl(key?: string | null): string {
  const placeholder = "/placeholder-product.svg";
  if (!key || typeof key !== "string") return placeholder;

  const trimmed = key.trim();
  if (!trimmed) return placeholder;

  // Absolute URL already
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // Ensure leading slash when joining with API_URL
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${API_URL}${path}`;
}

