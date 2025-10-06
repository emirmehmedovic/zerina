import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_URL } from "@/lib/api";

export async function GET(_req: NextRequest) {
  try {
    const cookieHeader = cookies().toString();
    const res = await fetch(`${API_URL}/api/v1/shops/mine`, {
      method: "GET",
      headers: { Cookie: cookieHeader },
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
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Proxy error" }, { status: 500 });
  }
}
