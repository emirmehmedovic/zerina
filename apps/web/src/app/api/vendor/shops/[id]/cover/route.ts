import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_URL } from "@/lib/api";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const shopId = id;
    const body = await req.json().catch(() => ({}));
    const cookieStore = await cookies();
    const baseCookieHeader = cookieStore.toString();

    // 1) Get CSRF token from upstream (sets/returns token)
    const csrfRes = await fetch(`${API_URL}/api/v1/auth/csrf`, {
      method: "GET",
      headers: { Cookie: baseCookieHeader },
      cache: "no-store",
    });
    let csrfToken = "";
    try {
      const data = await csrfRes.json();
      csrfToken = (data?.csrfToken || "").toString();
    } catch {}
    // Compose cookie header including csrf_token cookie so upstream sees it
    const cookieHeader = csrfToken
      ? `${baseCookieHeader ? baseCookieHeader + '; ' : ''}csrf_token=${csrfToken}`
      : baseCookieHeader;

    const res = await fetch(`${API_URL}/api/v1/shops/${shopId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify(body),
      // Do not cache
      cache: "no-store",
    });

    const text = await res.text();
    let data: any = null;
    try { data = JSON.parse(text); } catch {}

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error || `Upstream error (${res.status})`, status: res.status, data },
        { status: res.status }
      );
    }

    return NextResponse.json(data ?? { ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Proxy error" }, { status: 500 });
  }
}
