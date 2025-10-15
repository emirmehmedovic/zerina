"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { getCsrfToken } from "@/lib/csrf";
import { Shop } from "@/lib/types";
import { VendorDocumentUploader } from "@/components/vendor/VendorDocumentUploader";
import {
  ArrowRight,
  CheckCircle2,
  Shield,
  Sparkles,
  Store,
  UserPlus,
  FileText,
  Building,
  ClipboardList,
  CheckCircle,
  Mail,
  Phone,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

declare global {
  interface GrecaptchaEnterprise {
    ready(callback: () => void): void;
    execute(siteKey: string, options: { action: string }): Promise<string>;
  }

  interface Window {
    grecaptcha?: {
      enterprise?: GrecaptchaEnterprise;
    };
  }
}

type MeResponse = { id: string; name?: string | null; email?: string | null };

type VendorApplicationPayload = {
  legalName: string;
  country: string;
  contactPhone: string;
  address: string;
  documentIds: string[];
};

const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

const wizardSteps = [
  { id: "account", label: "Account", description: "Create or sign in to your account" },
  { id: "business", label: "Business details", description: "Tell us about your company" },
  { id: "documents", label: "Documents", description: "Upload verification files" },
  { id: "shop", label: "Shop", description: "Name and describe your storefront" },
] as const;

type StepId = typeof wizardSteps[number]["id"];

const ACCOUNT_INPUT_CLASS =
  "w-full rounded-lg border border-rose-200/70 bg-white px-3 py-2 text-sm text-amber-900 placeholder:text-amber-800/60 focus:outline-none focus:ring-2 focus:ring-rose-200/80";

const SECTION_CARD_CLASS =
  "rounded-2xl border border-rose-100/70 bg-white/95 p-5 shadow-sm shadow-rose-200/40";

export default function BecomeSellerClient() {
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<StepId>("account");

  // Inline account state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [accountErr, setAccountErr] = useState<string | null>(null);
  const onGoogle = () => {
    const redirect = `${window.location.origin}/become-a-seller`;
    window.location.href = `${API_URL}/api/v1/auth/google/start?redirect=${encodeURIComponent(redirect)}`;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setMeLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/v1/users/me`, { credentials: 'include' });
        if (res.ok) {
          const u = await res.json();
          if (!cancelled) setMe(u);
        } else if (!cancelled) {
          setMe(null);
        }
      } catch {
        if (!cancelled) setMe(null);
      } finally {
        if (!cancelled) setMeLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [legalName, setLegalName] = useState("");
  const [country, setCountry] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [documentIds, setDocumentIds] = useState<string[]>([]);
  const [shopName, setShopName] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const getRecaptchaToken = useCallback(async (action: string) => {
    if (!recaptchaSiteKey || typeof window === "undefined") {
      return null;
    }
    const enterprise = window.grecaptcha?.enterprise;
    if (!enterprise?.execute) {
      return null;
    }
    await new Promise<void>((resolve) => {
      enterprise.ready(resolve);
    });
    try {
      const token = await enterprise.execute(recaptchaSiteKey, { action });
      return token;
    } catch (error) {
      console.warn("[recaptcha] execute failed", error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (me) {
      setLegalName((prev) => prev || (me.name ?? ""));
    }
  }, [me]);

  const vendorValues = useMemo(
    () => ({
      legalName: legalName.trim(),
      country: country.trim(),
      contactPhone: contactPhone.trim(),
      address: address.trim(),
      documentIds,
    }),
    [legalName, country, contactPhone, address, documentIds]
  );

  const handleAccountStep = async () => {
    setAccountErr(null);
    if (me) return true;
    if (!email || !password) {
      setAccountErr("Please enter email and password");
      return false;
    }
    if (password.length < 8) {
      setAccountErr("Password must be at least 8 characters");
      return false;
    }

    const registerRes = await fetch(`${API_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, name: name || undefined }),
    });
    const registerBody = await registerRes.json().catch(() => ({}));
    if (!registerRes.ok) {
      const err = registerBody?.error;
      if (err === "captcha_failed") {
        setAccountErr("Captcha check failed. Please refresh and try again.");
        return false;
      }
      if (err === "too_many_requests") {
        setAccountErr("Too many attempts. Please wait before retrying.");
        return false;
      }
      if (err === "email_taken") {
        setAccountErr("Email is already in use. Try signing in instead.");
        return false;
      }
      setAccountErr(registerBody?.error || `Registration failed (${registerRes.status})`);
      return false;
    }

    try {
      const meRes = await fetch(`${API_URL}/api/v1/users/me`, { credentials: "include" });
      if (meRes.ok) setMe(await meRes.json());
    } catch {}
    return true;
  };

  const goToNextStep = async () => {
    if (currentStep === "account") {
      const ok = await handleAccountStep();
      if (!ok) return;
    }
    if (currentStep === "business") {
      if (!vendorValues.legalName || !vendorValues.country) {
        setSubmissionError("Business name and country are required.");
        return;
      }
      setSubmissionError(null);
    }
    if (currentStep === "shop") {
      await handleSubmit();
      return;
    }

    const index = wizardSteps.findIndex((s) => s.id === currentStep);
    const next = wizardSteps[index + 1];
    if (next) setCurrentStep(next.id);
  };

  const goToPreviousStep = () => {
    const index = wizardSteps.findIndex((s) => s.id === currentStep);
    const prev = wizardSteps[index - 1];
    if (prev) setCurrentStep(prev.id);
  };

  const handleSubmit = async () => {
    setSubmissionError(null);
    setSubmitting(true);
    try {
      let captchaToken: string | null = null;
      if (recaptchaSiteKey) {
        captchaToken = await getRecaptchaToken("vendor_upgrade_submit");
        if (!captchaToken) {
          throw new Error("Captcha verification failed. Please refresh and try again.");
        }
      }
      const csrf = await getCsrfToken();
      const shopRes = await fetch(`${API_URL}/api/v1/shops`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        credentials: "include",
        body: JSON.stringify({ name: shopName.trim(), description: shopDescription.trim() }),
      });
      if (!shopRes.ok) {
        const body = await shopRes.json().catch(() => ({}));
        let msg = body?.error || `Failed to create shop (${shopRes.status})`;
        if (shopRes.status === 403) msg = "You need a vendor account to create a shop. Please try again.";
        throw new Error(msg);
      }
      const newShop = (await shopRes.json()) as Shop;

      const payload: Record<string, unknown> = {
        legalName: vendorValues.legalName,
        country: vendorValues.country,
      };
      if (vendorValues.contactPhone) payload.contactPhone = vendorValues.contactPhone;
      if (vendorValues.address) payload.address = vendorValues.address;
      if (vendorValues.documentIds.length) payload.documentIds = vendorValues.documentIds;
      if (captchaToken) payload.captchaToken = captchaToken;

      const upgradeRes = await fetch(`${API_URL}/api/v1/vendor/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!upgradeRes.ok) {
        const body = await upgradeRes.json().catch(() => ({}));
        const err = body?.error as string | undefined;
        if (err && ["application_pending", "already_approved"].includes(err)) {
          console.info(`[vendor-upgrade] ${err}`);
        } else if (err === "captcha_failed" || err === "too_many_requests") {
          setSubmissionError(body?.error || "Vendor verification could not be completed. Please try again later.");
        } else {
          console.warn("Vendor upgrade failed", body);
        }
      }

      setShop(newShop);
      router.push("/dashboard/shop");
    } catch (err) {
      setSubmissionError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen p-6 sm:p-10 text-amber-900">
      <div className="pointer-events-none absolute -top-20 -left-24 h-80 w-80 rounded-full bg-rose-200/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-32 h-96 w-96 rounded-full bg-amber-200/25 blur-3xl" />

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[28px] border border-rose-100/70 bg-gradient-to-br from-rose-50 via-white to-amber-50 shadow-[0_25px_60px_-35px_rgba(244,114,182,0.45)] overflow-hidden">
          <div className="absolute -bottom-3 left-0 right-0 h-6 [mask-image:radial-gradient(12px_12px_at_12px_6px,transparent_10px,#000_10px)] bg-white" />

          <div className="relative grid gap-10 px-6 py-10 sm:px-8 lg:grid-cols-[1.1fr,0.9fr]">
            <section className="space-y-10">
              <header className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/80 bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-rose-700">
                  <Sparkles className="h-4 w-4" /> Vendor program
                </div>
                <h1 className="text-4xl font-semibold leading-snug tracking-tight text-amber-900 sm:text-5xl">
                  Build a storefront that design-first customers will love
                </h1>
                <p className="max-w-2xl text-lg text-amber-800/90">
                  Launch in minutes, manage your artisan catalogue with powerful tools, and join a curated marketplace focused on quality and storytelling.
                </p>
              </header>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-rose-100/70 bg-white/90 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100/80">
                      <Store className="h-5 w-5 text-rose-500" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-amber-900">Tailored storefront</h3>
                      <p className="mt-1 text-sm text-amber-800/80">Curate collections with storytelling blocks, lookbooks, and featured drops.</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-amber-100/70 bg-white/90 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100/80">
                      <Shield className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-amber-900">Verified marketplace</h3>
                      <p className="mt-1 text-sm text-amber-800/80">Reach buyers who trust curated vendors, secure payments, and responsive support.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-amber-800/80">
                <div className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Personalized onboarding support
                </div>
                <div className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Marketing placement for featured launches
                </div>
              </div>
            </section>

            <section>
              <div className="relative rounded-3xl border border-rose-100/80 bg-white/95 p-6 shadow-[0_25px_60px_-35px_rgba(244,114,182,0.35)]">
                <header className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Start selling</p>
                    <h2 className="mt-1 text-lg font-semibold text-amber-900">Apply & launch your shop</h2>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-rose-100/80 bg-rose-50/80 px-3 py-1 text-xs text-rose-700">
                    Guided wizard
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </header>

                <div className="mt-6 flex flex-col gap-4">
                  <nav className="flex flex-col gap-3">
                    {wizardSteps.map((step, idx) => {
                      const active = currentStep === step.id;
                      const completedIndex = wizardSteps.findIndex((s) => s.id === currentStep);
                      const stepIndex = wizardSteps.findIndex((s) => s.id === step.id);
                      const completed = stepIndex < completedIndex;
                      return (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => {
                            if (step.id === currentStep) return;
                            if (stepIndex > completedIndex + 1) return;
                            setCurrentStep(step.id);
                          }}
                          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                            active
                              ? "border-rose-200 bg-rose-50 text-rose-900 shadow-sm"
                              : completed
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : "border-rose-100 bg-white/90 text-amber-900 hover:border-rose-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`flex h-8 w-8 items-center justify-center rounded-full ${active ? "bg-rose-500 text-white" : completed ? "bg-emerald-500 text-white" : "bg-rose-100 text-rose-600"}`}>
                              {completed ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                            </span>
                            <div>
                              <p className="text-sm font-semibold">{step.label}</p>
                              <p className="text-xs opacity-70">{step.description}</p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 opacity-60" />
                        </button>
                      );
                    })}
                  </nav>

                  <div className="rounded-3xl border border-rose-100/80 bg-white p-6 shadow-sm">
                    {currentStep === "account" && (
                      <AccountStep
                        me={me}
                        loading={meLoading}
                        accountErr={accountErr}
                        email={email}
                        password={password}
                        name={name}
                        onGoogle={onGoogle}
                        onEmailChange={setEmail}
                        onPasswordChange={setPassword}
                        onNameChange={setName}
                      />
                    )}

                    {currentStep === "business" && (
                      <BusinessStep
                        legalName={legalName}
                        country={country}
                        contactPhone={contactPhone}
                        address={address}
                        onLegalNameChange={setLegalName}
                        onCountryChange={setCountry}
                        onContactPhoneChange={setContactPhone}
                        onAddressChange={setAddress}
                        error={submissionError}
                      />
                    )}

                    {currentStep === "documents" && (
                      <DocumentsStep
                        documentIds={documentIds}
                        onChange={setDocumentIds}
                      />
                    )}

                    {currentStep === "shop" && (
                      <ShopStep
                        name={shopName}
                        description={shopDescription}
                        onNameChange={setShopName}
                        onDescriptionChange={setShopDescription}
                        error={submissionError}
                      />
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={goToPreviousStep}
                      disabled={currentStep === "account" || submitting}
                      className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={goToNextStep}
                      disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-400 to-amber-400 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-rose-500 hover:to-amber-500 disabled:opacity-60"
                    >
                      {currentStep === "shop" ? (
                        <>
                          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          Launch shop
                        </>
                      ) : (
                        <>
                          Continue
                          <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

type AccountStepProps = {
  me: MeResponse | null;
  loading: boolean;
  accountErr: string | null;
  email: string;
  password: string;
  name: string;
  onGoogle: () => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onNameChange: (value: string) => void;
};

function AccountStep({ me, loading, accountErr, email, password, name, onGoogle, onEmailChange, onPasswordChange, onNameChange }: AccountStepProps) {
  if (loading) {
    return <div className="text-sm text-rose-700">Checking account status…</div>;
  }

  if (me) {
    return (
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" /> Signed in as {me.email ?? me.name ?? "vendor"}
        </div>
        <p className="text-sm text-rose-700/80">You can proceed to the next step.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-rose-500" /> Create your account
        </h3>
        <p className="text-sm text-amber-800/80">Sign in or register to save your onboarding progress.</p>
      </div>
      {accountErr && <div className="rounded-lg border border-red-300/70 bg-red-100/60 px-3 py-2 text-sm text-red-700">{accountErr}</div>}
      <button
        type="button"
        onClick={onGoogle}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-rose-200 to-amber-200 px-4 py-2 text-sm font-semibold text-amber-900 shadow-sm shadow-rose-200/50 transition hover:from-rose-300 hover:to-amber-300"
      >
        Continue with Google
      </button>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-rose-700" htmlFor="acc_name">
            Full name (optional)
          </label>
          <input
            id="acc_name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className={`${ACCOUNT_INPUT_CLASS} mt-1`}
            placeholder="e.g., Ada Lovelace"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-rose-700" htmlFor="acc_email">
            Email
          </label>
          <input
            id="acc_email"
            type="email"
            required
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className={`${ACCOUNT_INPUT_CLASS} mt-1`}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-rose-700" htmlFor="acc_password">
            Password
          </label>
          <input
            id="acc_password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className={`${ACCOUNT_INPUT_CLASS} mt-1`}
            placeholder="********"
          />
        </div>
      </div>
      <p className="text-[11px] text-amber-700/70">Password must be at least 8 characters.</p>
    </div>
  );
}

type BusinessStepProps = {
  legalName: string;
  country: string;
  contactPhone: string;
  address: string;
  onLegalNameChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onContactPhoneChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  error: string | null;
};

function BusinessStep({ legalName, country, contactPhone, address, onLegalNameChange, onCountryChange, onContactPhoneChange, onAddressChange, error }: BusinessStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
          <Building className="h-5 w-5 text-rose-500" /> Business information
        </h3>
        <p className="text-sm text-amber-800/80">Provide the legal details for your company or sole proprietorship.</p>
      </div>
      {error && <div className="rounded-lg border border-red-300/70 bg-red-100/60 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="space-y-4">
        <div className={SECTION_CARD_CLASS}>
          <label className="text-xs font-semibold uppercase tracking-wide text-rose-700" htmlFor="legal_name">
            Legal / business name
          </label>
          <input
            id="legal_name"
            value={legalName}
            onChange={(e) => onLegalNameChange(e.target.value)}
            className={`${ACCOUNT_INPUT_CLASS} mt-2`}
            placeholder="e.g., Aurora Atelier d.o.o."
            required
          />
        </div>
        <div className={SECTION_CARD_CLASS}>
          <label className="text-xs font-semibold uppercase tracking-wide text-rose-700" htmlFor="country_input">
            Country
          </label>
          <input
            id="country_input"
            value={country}
            onChange={(e) => onCountryChange(e.target.value)}
            className={`${ACCOUNT_INPUT_CLASS} mt-2`}
            placeholder="e.g., Bosnia and Herzegovina"
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={SECTION_CARD_CLASS}>
            <label className="text-xs font-semibold uppercase tracking-wide text-rose-700" htmlFor="contact_phone">
              Contact phone (optional)
            </label>
            <div className="mt-2 flex items-center gap-2">
              <Phone className="h-4 w-4 text-rose-400" />
              <input
                id="contact_phone"
                value={contactPhone}
                onChange={(e) => onContactPhoneChange(e.target.value)}
                className="flex-1 rounded-lg border border-rose-200/70 bg-white px-3 py-2 text-sm text-amber-900 placeholder:text-amber-800/60 focus:outline-none focus:ring-2 focus:ring-rose-200/80"
                placeholder="e.g., +387 61 123 456"
              />
            </div>
          </div>
          <div className={SECTION_CARD_CLASS}>
            <label className="text-xs font-semibold uppercase tracking-wide text-rose-700" htmlFor="address_input">
              Business address (optional)
            </label>
            <textarea
              id="address_input"
              value={address}
              onChange={(e) => onAddressChange(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-lg border border-rose-200/70 bg-white px-3 py-2 text-sm text-amber-900 placeholder:text-amber-800/60 focus:outline-none focus:ring-2 focus:ring-rose-200/80"
              placeholder="Street, city, postal code"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

type DocumentsStepProps = {
  documentIds: string[];
  onChange: (ids: string[]) => void;
};

function DocumentsStep({ documentIds, onChange }: DocumentsStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
          <FileText className="h-5 w-5 text-rose-500" /> Upload your documents
        </h3>
        <p className="text-sm text-amber-800/80">
          Provide identification or registration certificates. You can return later to add more.
        </p>
      </div>
      <div className="rounded-2xl border border-rose-100/70 bg-rose-50/80 p-4">
        <VendorDocumentUploader selectedIds={documentIds} onChange={onChange} disabled={false} />
      </div>
    </div>
  );
}

type ShopStepProps = {
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  error: string | null;
};

function ShopStep({ name, description, onNameChange, onDescriptionChange, error }: ShopStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
          <Store className="h-5 w-5 text-rose-500" /> Shop profile
        </h3>
        <p className="text-sm text-amber-800/80">Choose a memorable name and describe what you sell.</p>
      </div>
      {error && <div className="rounded-lg border border-red-300/70 bg-red-100/60 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="space-y-4">
        <div className={SECTION_CARD_CLASS}>
          <label className="text-xs font-semibold uppercase tracking-wide text-rose-700" htmlFor="shop_name">
            Shop name
          </label>
          <input
            id="shop_name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className={`${ACCOUNT_INPUT_CLASS} mt-2`}
            placeholder="e.g., Aurora Atelier"
            required
          />
        </div>
        <div className={SECTION_CARD_CLASS}>
          <label className="text-xs font-semibold uppercase tracking-wide text-rose-700" htmlFor="shop_description">
            Description (optional)
          </label>
          <textarea
            id="shop_description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={5}
            className="mt-2 w-full rounded-lg border border-rose-200/70 bg-white px-3 py-2 text-sm text-amber-900 placeholder:text-amber-800/60 focus:outline-none focus:ring-2 focus:ring-rose-200/80"
            placeholder="Tell customers what you create and why they will love it."
          />
        </div>
      </div>
    </div>
  );
}

