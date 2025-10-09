"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { getCsrfToken } from "@/lib/csrf";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

export default function AccountPage() {
  const router = useRouter();
  const [me, setMe] = useState<{ id: string; email: string; name?: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Change password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/users/me`, { credentials: "include" });
        if (res.status === 401) { router.push("/login"); return; }
        const u = await res.json();
        setMe(u);
      } catch (e: any) {
        setError(e?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    setPwdLoading(true);
    try {
      const csrf = await getCsrfToken();
      const res = await fetch(`${API_URL}/api/v1/account/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      setPwdMsg('Password updated successfully.');
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (e: any) {
      setPwdMsg(e?.message || 'Failed to update password');
    } finally {
      setPwdLoading(false);
    }
  };

  if (loading) return <main className="p-6"><div>Loading…</div></main>;
  if (!me) return <main className="p-6"><div className="text-rose-500">{error || 'Not signed in'}</div></main>;

  return (
    <main className="min-h-screen p-6 sm:p-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-amber-900">My Account</h1>
          <p className="text-amber-900/70">Manage your profile and password.</p>
        </header>

        <section className="rounded-2xl bg-white/75 backdrop-blur-md border border-amber-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-900 mb-4">Profile</h2>
          <div className="space-y-2 text-amber-900">
            <div><span className="font-medium">Email:</span> {me.email}</div>
            {me.name && <div><span className="font-medium">Name:</span> {me.name}</div>}
            <div><span className="font-medium">Role:</span> {me.role}</div>
          </div>
          <div className="mt-4">
            <LogoutButton className="px-3 py-2 rounded-md border border-amber-200 text-amber-900 bg-white/70 hover:bg-white" />
          </div>
        </section>

        <section className="rounded-2xl bg-white/75 backdrop-blur-md border border-amber-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-900 mb-4">Change Password</h2>
          <form onSubmit={onChangePassword} className="space-y-4">
            {pwdMsg && <div className="text-sm {pwdLoading ? 'text-amber-900' : 'text-amber-900'}">{pwdMsg}</div>}
            <div>
              <label className="block text-sm font-medium text-amber-900/80 mb-1.5" htmlFor="currentPassword">Current Password</label>
              <input id="currentPassword" type="password" required className="w-full px-3 py-2 bg-white/90 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-300 focus:outline-none text-amber-900" value={currentPassword} onChange={(e)=> setCurrentPassword(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-900/80 mb-1.5" htmlFor="newPassword">New Password</label>
              <input id="newPassword" type="password" required minLength={8} className="w-full px-3 py-2 bg-white/90 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-300 focus:outline-none text-amber-900" value={newPassword} onChange={(e)=> setNewPassword(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-900/80 mb-1.5" htmlFor="confirmPassword">Confirm New Password</label>
              <input id="confirmPassword" type="password" required className="w-full px-3 py-2 bg-white/90 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-300 focus:outline-none text-amber-900" value={confirmPassword} onChange={(e)=> setConfirmPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={pwdLoading} className="px-4 py-2.5 rounded-lg border border-amber-200 bg-amber-100 text-amber-900 font-semibold hover:bg-amber-200 transition-colors">
              {pwdLoading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
