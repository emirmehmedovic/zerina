import { API_URL } from "@/lib/api";

export async function getCsrfToken(): Promise<string> {
  // Cache token in memory per tab
  if (typeof window !== 'undefined') {
    const w = window as any;
    if (w.__csrfToken) return w.__csrfToken as string;
    const res = await fetch(`${API_URL}/api/v1/auth/csrf`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      w.__csrfToken = data?.csrfToken || '';
      return w.__csrfToken;
    }
    return '';
  }
  return '';
}
