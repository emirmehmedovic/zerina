"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { getCsrfToken } from "@/lib/csrf";
import { Loader2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

export default function StripeCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("Processing Stripe connection...");

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      // Handle user cancellation or OAuth errors
      if (error) {
        setStatus("error");
        if (error === "access_denied") {
          setMessage("You cancelled the Stripe connection. You can try again from your payment settings.");
        } else {
          setMessage(errorDescription || `Stripe error: ${error}`);
        }
        return;
      }

      // Validate required params
      if (!code || !state) {
        setStatus("error");
        setMessage("Missing authorization code or state. Please try connecting again.");
        return;
      }

      try {
        const csrf = await getCsrfToken();
        const res = await fetch(`${API_URL}/api/v1/vendor/stripe/oauth/callback`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrf,
          },
          body: JSON.stringify({ code, state }),
        });

        const body = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(body?.error || `Failed to connect Stripe account (${res.status})`);
        }

        if (body?.success && body?.connected) {
          setStatus("success");
          setMessage("Your Stripe account is successfully connected and ready to receive payments!");
        } else if (body?.success) {
          setStatus("success");
          setMessage("Stripe account linked! You may need to complete additional verification steps.");
        } else {
          throw new Error("Unexpected response from server");
        }

        // Redirect to payment settings after 2 seconds
        setTimeout(() => {
          router.push("/dashboard/settings/payments?connected=true");
        }, 2000);
      } catch (err) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Failed to process Stripe connection");
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-8 text-center space-y-6">
          {status === "loading" && (
            <>
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white mb-2">Connecting to Stripe</h1>
                <p className="text-sm text-zinc-400">{message}</p>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white mb-2">Connection successful!</h1>
                <p className="text-sm text-zinc-400">{message}</p>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => router.push("/dashboard/settings/payments")}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-400 hover:to-purple-500 transition"
                >
                  Go to Payment Settings
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white mb-2">Connection failed</h1>
                <p className="text-sm text-zinc-400">{message}</p>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => router.push("/dashboard/settings/payments")}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-white/10 transition"
                >
                  Back to Payment Settings
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
