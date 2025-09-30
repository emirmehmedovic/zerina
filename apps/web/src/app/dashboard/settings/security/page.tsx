"use client";

import { useState } from 'react';
import { API_URL } from '@/lib/api';
import { getCsrfToken } from '@/lib/csrf';

export default function SecuritySettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch(`${API_URL}/api/v1/account/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'An unknown error occurred.');
      }
      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const FormInput = ({ label, id, ...props }: { label: string; id: string; [key: string]: unknown }) => (
    <div>
      <label className="block text-sm font-medium text-zinc-400 mb-1.5" htmlFor={id}>{label}</label>
      <input id={id} {...props} className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
    </div>
  );

  return (
    <main>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Security Settings</h1>
          <p className="text-zinc-400">Manage your password and account security.</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput label="Current Password" id="currentPassword" type="password" value={currentPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)} required />
            <FormInput label="New Password" id="newPassword" type="password" value={newPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)} required />
            <FormInput label="Confirm New Password" id="confirmPassword" type="password" value={confirmPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)} required />
            <div className="flex justify-end pt-2">
              <button type="submit" className="px-4 py-2 rounded-lg border border-transparent bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors" disabled={submitting}>
                {submitting ? 'Saving...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
