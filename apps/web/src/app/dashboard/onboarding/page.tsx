"use client";

import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Loader2,
  Mail,
  Phone,
  Shield,
  ClipboardList,
  AlertCircle,
  FileText,
  Sparkles,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { getCsrfToken } from "@/lib/csrf";
import { VendorDocumentUploader } from "@/components/vendor/VendorDocumentUploader";
import type { VendorDocument } from "@/types/vendor";

const steps = [
  { id: "account", title: "Account Verification", description: "Verify email and phone details." },
  { id: "application", title: "Vendor Application", description: "Submit your business information." },
  { id: "review", title: "Review & Approval", description: "Track status and next steps." },
] as const;

type StepId = typeof steps[number]["id"];

const GLASS_CARD = "rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 text-zinc-100 shadow-lg shadow-blue-500/5";
const GLASS_CARD_DENSE = "rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 text-zinc-100 shadow-lg shadow-blue-500/5";
const SECTION_LABEL = "text-xs font-semibold uppercase tracking-wide text-zinc-400";
const SUBTEXT = "text-sm text-zinc-400";
const INPUT_CLASS =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400/40 transition";

type VendorApplicationStatus = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  reviewedAt: string | null;
  notes: string | null;
  rejectionReason: string | null;
  identityVerificationStatus: "NOT_REQUIRED" | "PENDING" | "VERIFIED" | "FAILED" | null;
  identityVerificationProvider: string | null;
  identityVerificationCheckedAt: string | null;
  identityVerificationNotes: string | null;
  vendorDocuments: VendorDocument[];
};

type ApplicationStatusResponse = {
  user: {
    email: string;
    emailVerified: boolean;
    phoneNumber: string | null;
    phoneVerified: boolean;
    phoneRequired: boolean;
  };
  application: VendorApplicationStatus | null;
  securityDeposit: {
    required: boolean;
    amountCents: number;
    currency: string | null;
  };
};

export default function VendorOnboardingPage() {
  const [status, setStatus] = useState<ApplicationStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const refresh = useCallback(() => setRefreshIndex((i) => i + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/v1/vendor/application-status`, {
          credentials: "include",
        });
        const body = (await res.json().catch(() => ({}))) as ApplicationStatusResponse;
        if (!res.ok) {
          throw new Error(body && (body as any).error ? (body as any).error : `Failed to load status (${res.status})`);
        }
        if (!cancelled) setStatus(body);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load status");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshIndex]);

  const isAccountComplete = status?.user
    ? status.user.emailVerified && (!status.user.phoneRequired || status.user.phoneVerified)
    : false;
  const hasApplication = Boolean(status?.application);
  const isApproved = status?.application?.status === "APPROVED";

  const currentStep: StepId = useMemo(() => {
    if (!status) return "account";
    if (!isAccountComplete) return "account";
    if (!hasApplication) return "application";
    return "review";
  }, [status, isAccountComplete, hasApplication]);

  if (loading) {
    return (
      <main className="min-h-screen p-6 sm:p-10 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-zinc-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading onboarding status…
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen p-6 sm:p-10">
        <div className="max-w-3xl mx-auto rounded-xl border border-red-200 bg-red-50 text-red-700 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-1" />
            <div>
              <h2 className="font-semibold mb-1">Failed to load onboarding status</h2>
              <p className="text-sm">{error}</p>
              <button
                type="button"
                onClick={refresh}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-black/30 p-6 md:p-8 text-zinc-100 shadow-lg shadow-blue-500/5">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-200">
          <Sparkles className="h-4 w-4" />
          Vendor Onboarding
        </div>
        <div className="mt-4 space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Let’s get your shop ready to sell
          </h1>
          <p className="max-w-3xl text-sm text-zinc-300">
            Complete the steps below to finish your onboarding. We’ll guide you through verification, application submission, and the approval process so you can access every part of the dashboard.
          </p>
        </div>
      </section>

      <OnboardingProgress currentStep={currentStep} isApproved={isApproved} />

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <AccountVerificationStep
            status={status!}
            completed={isAccountComplete}
            onCompleted={refresh}
          />
          <ApplicationFormStep
            status={status!}
            disabled={!isAccountComplete}
            onSubmitted={refresh}
          />
        </div>
        <div className="space-y-6">
          <StatusTracker status={status!} />
          <NextStepsCard status={status!} onRefresh={refresh} />
        </div>
      </section>
    </div>
  );
}

type StepProps = {
  status: ApplicationStatusResponse;
};

type AccountVerificationStepProps = StepProps & {
  completed: boolean;
  onCompleted: () => void;
};

function AccountVerificationStep({ status, completed, onCompleted }: AccountVerificationStepProps) {
  const [emailSending, setEmailSending] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);

  const [phoneNumber, setPhoneNumber] = useState(status.user.phoneNumber ?? "");
  const [code, setCode] = useState("");
  const [phoneMessage, setPhoneMessage] = useState<string | null>(null);
  const [phoneSending, setPhoneSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    setPhoneNumber(status.user.phoneNumber ?? "");
  }, [status.user.phoneNumber]);

  const handleResendEmail = async () => {
    setEmailSending(true);
    setEmailMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/email/resend-verification`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Request failed (${res.status})`);
      }
      setEmailMessage("Verification email sent. Please check your inbox.");
    } catch (e: unknown) {
      setEmailMessage(e instanceof Error ? e.message : "Failed to send verification email");
    } finally {
      setEmailSending(false);
    }
  };

  const handleRequestCode = async () => {
    if (!phoneNumber) {
      setPhoneMessage("Please enter a phone number first.");
      return;
    }
    setPhoneSending(true);
    setPhoneMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/phone/request`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || `Request failed (${res.status})`);
      }
      setPhoneMessage("Verification code sent via SMS (mock).");
    } catch (e: unknown) {
      setPhoneMessage(e instanceof Error ? e.message : "Failed to send verification code");
    } finally {
      setPhoneSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code) {
      setPhoneMessage("Enter the code you received.");
      return;
    }
    setVerifying(true);
    setPhoneMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/phone/verify`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || `Verification failed (${res.status})`);
      }
      setPhoneMessage("Phone number verified successfully.");
      setCode("");
      onCompleted();
    } catch (e: unknown) {
      setPhoneMessage(e instanceof Error ? e.message : "Failed to verify code");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <section className={GLASS_CARD}>
      <header className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className={SECTION_LABEL}>Step 1</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Account Verification</h2>
          <p className={SUBTEXT}>Confirm your contact details so we can reach you during review.</p>
        </div>
        <StatusIcon complete={completed} />
      </header>

      <div className="space-y-5">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-rose-300 mt-0.5" />
            <div>
              <h3 className="font-medium text-white">Email address</h3>
              <p className="text-sm text-zinc-300">{status.user.email}</p>
              {status.user.emailVerified ? (
                <p className="mt-2 flex items-center gap-2 text-sm text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" /> Email verified
                </p>
              ) : (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleResendEmail}
                    disabled={emailSending}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 px-3 py-2 text-sm font-medium text-white shadow-lg shadow-rose-500/20 transition hover:from-rose-400 hover:to-rose-600 disabled:opacity-50"
                  >
                    {emailSending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Resend verification email
                  </button>
                  {emailMessage && <span className="text-sm text-zinc-300">{emailMessage}</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {status.user.phoneRequired && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-blue-300 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-white">Phone verification</h3>
                <p className={SUBTEXT}>We’ll mock-send a 6-digit code to confirm your number.</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1.5fr,auto]">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +387 61 123 456"
                    className={INPUT_CLASS}
                  />
                  <button
                    type="button"
                    onClick={handleRequestCode}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/10 disabled:opacity-50"
                    disabled={phoneSending}
                  >
                    {phoneSending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Send code
                  </button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr,auto]">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Verification code"
                    className={INPUT_CLASS}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-400 hover:to-purple-500 disabled:opacity-50"
                    disabled={verifying}
                  >
                    {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
                    Verify
                  </button>
                </div>
                {status.user.phoneVerified && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" /> Phone verified
                  </p>
                )}
                {phoneMessage && (
                  <p className="mt-2 text-sm text-zinc-300">{phoneMessage}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ApplicationFormStep({ status, disabled, onSubmitted }: StepProps & { disabled: boolean; onSubmitted: () => void }) {
  const application = status.application;
  const [legalName, setLegalName] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [documentIds, setDocumentIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [docUpdateMessage, setDocUpdateMessage] = useState<string | null>(null);
  const [docUpdating, setDocUpdating] = useState(false);

  useEffect(() => {
    if (application) {
      setMessage("Application already submitted.");
      const existingDocIds = application.vendorDocuments?.map((doc) => doc.id) ?? [];
      setDocumentIds(existingDocIds);
    }
  }, [application]);

  const submitDocumentsUpdate = async (overrideIds?: string[]) => {
    if (!application) return;
    setDocUpdateMessage(null);
    setDocUpdating(true);
    try {
      const ids = overrideIds ?? documentIds;
      const csrf = await getCsrfToken();
      const res = await fetch(`${API_URL}/api/v1/vendor/upgrade`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify({ documentIds: ids.length ? ids : undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || `Failed to update documents (${res.status})`);
      }
      setDocumentIds(ids);
      setDocUpdateMessage("Documents updated successfully.");
      onSubmitted();
    } catch (err) {
      setDocUpdateMessage(err instanceof Error ? err.message : "Failed to update documents");
    } finally {
      setDocUpdating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (application) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const csrf = await getCsrfToken();
      const body = {
        legalName,
        country,
        address: address || undefined,
        contactPhone: contactPhone || undefined,
        documentIds: documentIds.length ? documentIds : undefined,
      };

      const res = await fetch(`${API_URL}/api/v1/vendor/upgrade`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify(body),
      });
      const responseBody = await res.json().catch(() => ({}));
      if (!res.ok) {
        switch (responseBody?.error) {
          case "application_pending":
            setMessage("You already have a pending application. We'll keep you updated.");
            break;
          case "captcha_failed":
            setMessage("Captcha verification failed. Please refresh the page and try again.");
            break;
          case "too_many_requests":
            setMessage("Too many attempts. Please wait a few minutes before retrying.");
            break;
          case "email_not_verified":
            setMessage("Please verify your email address before submitting the application.");
            break;
          case "phone_not_verified":
            setMessage("Verify your phone number before submitting the application.");
            break;
          default:
            throw new Error(responseBody?.error || `Submission failed (${res.status})`);
        }
      } else {
        setMessage("Application submitted successfully.");
      }
      onSubmitted();
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={GLASS_CARD}>
      <header className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className={SECTION_LABEL}>Step 2</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Submit your vendor application</h2>
          <p className={SUBTEXT}>Provide your business information so our team can review and approve your shop.</p>
        </div>
        <StatusIcon complete={Boolean(application)} />
      </header>

      {application ? (
        <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-emerald-200">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4" /> Application submitted on {new Date(application.submittedAt).toLocaleString()}
          </div>
          <p className="mt-2 text-sm">
            Current status: <span className="font-semibold uppercase tracking-wide">{application.status}</span>
          </p>
          {application.vendorDocuments?.length ? (
            <div className="mt-4 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-200/80">Documents on file</h4>
              <ul className="space-y-1 text-xs text-emerald-100/90">
                {application.vendorDocuments.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-2">
                    <span className="truncate" title={doc.originalName}>
                      {doc.originalName}
                    </span>
                    <span className="opacity-70">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="mt-5 rounded-xl border border-rose-200/40 bg-rose-50/10 p-4 text-sm text-zinc-100">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-rose-200/80">Upload additional documents</h4>
            <p className="mt-2 text-xs text-zinc-200/80">
              Add more supporting files if reviewers requested them. Newly uploaded documents will attach to your pending application.
            </p>
            <div className="mt-3">
              <VendorDocumentUploader
                selectedIds={documentIds}
                onChange={(ids) => {
                  setDocumentIds(ids);
                  submitDocumentsUpdate(ids).catch(() => undefined);
                }}
                disabled={docUpdating}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => submitDocumentsUpdate().catch(() => undefined)}
                disabled={docUpdating}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-amber-500 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:from-rose-400 hover:to-amber-400 disabled:opacity-60"
              >
                {docUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Save documents
              </button>
              {docUpdateMessage && <span className="text-xs text-rose-200">{docUpdateMessage}</span>}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={`${SECTION_LABEL} block mb-1`} htmlFor="legalName">
              Legal / business name
            </label>
            <input
              id="legalName"
              required
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="e.g. Handmade Co."
              className={INPUT_CLASS}
              disabled={disabled}
            />
          </div>
          <div>
            <label className={`${SECTION_LABEL} block mb-1`} htmlFor="country">
              Country
            </label>
            <input
              id="country"
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. Bosnia and Herzegovina"
              className={INPUT_CLASS}
              disabled={disabled}
            />
          </div>
          <div>
            <label className={`${SECTION_LABEL} block mb-1`} htmlFor="contactPhone">
              Contact phone (optional)
            </label>
            <input
              id="contactPhone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="Enter a phone number"
              className={INPUT_CLASS}
              disabled={disabled}
            />
          </div>
          <div className="md:col-span-2">
            <label className={`${SECTION_LABEL} block mb-1`} htmlFor="address">
              Business address (optional)
            </label>
            <textarea
              id="address"
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, city, postal code"
              className={`${INPUT_CLASS} min-h-[88px]`}
              disabled={disabled}
            />
          </div>
          <div className="md:col-span-2">
            <label className={`${SECTION_LABEL} block mb-1`}>
              Supporting documents
            </label>
            <VendorDocumentUploader
              selectedIds={documentIds}
              onChange={setDocumentIds}
              disabled={disabled || submitting}
            />
            <p className="mt-2 text-xs text-zinc-400">
              Upload PDFs or images that verify your business. You can update these before approval.
            </p>
          </div>
          <div className="md:col-span-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-zinc-500">
              By submitting, you confirm all details are accurate and you agree to our vendor terms.
            </p>
            <button
              type="submit"
              disabled={disabled || submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition hover:from-amber-400 hover:to-rose-500 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit application
            </button>
          </div>
          {message && (
            <div className="md:col-span-2 text-sm text-amber-200/90">{message}</div>
          )}
        </form>
      )}
    </section>
  );
}

type StatusTrackerProps = StepProps;

function StatusTracker({ status }: StatusTrackerProps) {
  const items = useMemo(() => {
    const timeline: Array<{ title: string; description: string; state: "pending" | "done" | "current"; icon: JSX.Element }> = [];

    const accountDone = status.user.emailVerified && (!status.user.phoneRequired || status.user.phoneVerified);
    timeline.push({
      title: "Account verified",
      description: accountDone
        ? "Contact details confirmed."
        : "Verify email and phone so we can reach you during review.",
      state: accountDone ? "done" : "current",
      icon: accountDone ? <CheckCircle2 className="h-4 w-4" /> : <Shield className="h-4 w-4" />,
    });

    const appStatus = status.application?.status ?? null;
    timeline.push({
      title: "Application submitted",
      description: appStatus
        ? `Submitted on ${new Date(status.application!.submittedAt).toLocaleDateString()}`
        : "Provide your business details and supporting documentation.",
      state: appStatus ? "done" : accountDone ? "current" : "pending",
      icon: appStatus ? <CheckCircle2 className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />,
    });

    timeline.push({
      title: "Review decision",
      description: appStatus
        ? appStatus === "APPROVED"
          ? "Approved — you can now create your shop."
          : appStatus === "REJECTED"
          ? status.application?.rejectionReason || "Your application was rejected."
          : "Our team is reviewing your application."
        : "We’ll review your application once submitted.",
      state: appStatus === "APPROVED" ? "done" : appStatus ? "current" : "pending",
      icon:
        appStatus === "APPROVED" ? <CheckCircle2 className="h-4 w-4" /> : appStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <Circle className="h-4 w-4" />,
    });

    return timeline;
  }, [status]);

  return (
    <section className={GLASS_CARD_DENSE}>
      <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">Status tracker</h3>
      <ol className="space-y-4">
        {items.map((item, index) => (
          <li key={item.title} className="flex items-start gap-3">
            <span
              className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                item.state === "done"
                  ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                  : item.state === "current"
                  ? "border-amber-400 bg-amber-500/20 text-amber-200"
                  : "border-white/10 bg-white/5 text-zinc-300"
              }`}
            >
              {index + 1}
            </span>
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                {item.icon}
                {item.title}
              </div>
              <p className="text-sm text-zinc-300 mt-1">{item.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function NextStepsCard({ status, onRefresh }: StepProps & { onRefresh: () => void }) {
  const application = status.application;
  const identityStatus = application?.identityVerificationStatus ?? "NOT_REQUIRED";

  const identityMessage = () => {
    switch (identityStatus) {
      case "VERIFIED":
        return { tone: "success", text: "Identity verification completed." };
      case "FAILED":
        return {
          tone: "danger",
          text: application?.identityVerificationNotes || "We couldn’t verify your identity automatically. Please contact support.",
        };
      case "PENDING":
        return {
          tone: "warning",
          text: "Identity verification in progress. We’ll notify you once it’s done.",
        };
      default:
        return {
          tone: "neutral",
          text: "No additional identity action required right now.",
        };
    }
  };

  const identity = identityMessage();

  const securityDeposit = status.securityDeposit;

  return (
    <section className={`${GLASS_CARD_DENSE} space-y-4`}>
      <div>
        <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-1">Next steps</h3>
        <p className={SUBTEXT}>
          Keep an eye on these items while we review your application.
        </p>
      </div>

      <div
        className={`rounded-lg border px-3 py-3 text-sm ${
          identity.tone === "success"
            ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
            : identity.tone === "warning"
            ? "border-amber-400/40 bg-amber-500/10 text-amber-200"
            : identity.tone === "danger"
            ? "border-red-400/40 bg-red-500/10 text-red-200"
            : "border-white/10 bg-white/5 text-zinc-200"
        }`}
      >
        <div className="flex items-center gap-2 font-medium mb-1">
          <Shield className="h-4 w-4" /> Identity verification
        </div>
        <p>{identity.text}</p>
        {application?.identityVerificationProvider && (
          <p className="text-xs mt-1 text-zinc-400">Provider: {application.identityVerificationProvider}</p>
        )}
        <button
          type="button"
          onClick={onRefresh}
          className="mt-2 inline-flex items-center gap-1 text-xs text-rose-200 hover:text-rose-100"
        >
          Refresh status
        </button>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-zinc-200">
        <div className="flex items-center gap-2 font-medium mb-1">
          <FileText className="h-4 w-4" /> Application notes
        </div>
        {application?.notes ? (
          <p>{application.notes}</p>
        ) : (
          <p className={SUBTEXT}>Our reviewers will leave notes here if they need more information from you.</p>
        )}
        {application?.rejectionReason && (
          <p className="mt-2 text-sm text-red-300">Reason: {application.rejectionReason}</p>
        )}
      </div>

      {securityDeposit.required && (
        <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-3 text-sm text-amber-100">
          <div className="font-medium mb-1">Security deposit</div>
          <p>
            A security deposit of {(securityDeposit.amountCents / 100).toFixed(2)} {securityDeposit.currency || "EUR"} will be required
            before final approval. We’ll let you know when it’s time to pay.
          </p>
        </div>
      )}

      <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-zinc-200">
        <p className="text-sm">
          Need help? Visit the <Link href="/help" className="text-rose-200 hover:text-rose-100 font-medium">support center</Link> or
          email <a href="mailto:support@example.com" className="text-rose-200 hover:text-rose-100 font-medium">support@example.com</a>.
        </p>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Link href="/dashboard" className="text-sm text-rose-200 hover:text-rose-100 font-medium">
          Back to dashboard
        </Link>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 text-sm text-rose-200 hover:text-rose-100"
        >
          <Loader2 className="h-4 w-4" /> Refresh status
        </button>
      </div>
    </section>
  );
}

function OnboardingProgress({ currentStep, isApproved }: { currentStep: StepId; isApproved: boolean }) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <nav className={`${GLASS_CARD_DENSE} p-6`}>
      <ol className="grid gap-4 sm:grid-cols-3">
        {steps.map((step, index) => {
          const complete = index < currentIndex || (index === currentIndex && (step.id === "review" ? isApproved : false));
          const active = index === currentIndex;
          return (
            <li
              key={step.id}
              className={`rounded-xl border p-4 transition ${
                active
                  ? "border-blue-400/40 bg-blue-500/10 shadow-lg shadow-blue-500/10"
                  : complete
                  ? "border-emerald-400/40 bg-emerald-500/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                    complete
                      ? "bg-emerald-500 text-white"
                      : active
                      ? "bg-blue-500 text-white"
                      : "bg-white/10 text-zinc-200"
                  }`}
                >
                  {complete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                </span>
                <div>
                  <h3 className="font-medium text-white">{step.title}</h3>
                  <p className="text-xs text-zinc-300 mt-1">{step.description}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StatusIcon({ complete }: { complete: boolean }) {
  return complete ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-semibold">
      <CheckCircle2 className="h-4 w-4" /> Done
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-semibold">
      <AlertCircle className="h-4 w-4" /> In progress
    </span>
  );
}
