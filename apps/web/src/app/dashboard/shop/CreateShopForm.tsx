import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { getCsrfToken } from "@/lib/csrf";
import { Shop } from "@/lib/types";
import { VendorDocumentUploader } from "@/components/vendor/VendorDocumentUploader";


interface CreateShopFormProps {
  onShopCreated: (shop: Shop) => void;
  beforeCreate?: (context: { vendorApplication?: VendorApplicationFormState }) => Promise<void>;
  showVendorApplication?: boolean;
  vendorInitialValues?: Partial<VendorApplicationFormState>;
  theme?: "light" | "dark";
}

type VendorApplicationFormState = {
  legalName: string;
  country: string;
  contactPhone: string;
  address: string;
  documentIds: string[];
};

export default function CreateShopForm({
  onShopCreated,
  beforeCreate,
  showVendorApplication = false,
  vendorInitialValues,
  theme = "dark",
}: CreateShopFormProps) {
  const isLight = theme === "light";
  const INPUT_CLASS = isLight
    ? "w-full rounded-lg border border-rose-200/70 bg-white px-3 py-2 text-sm text-amber-900 placeholder:text-amber-900/60 focus:outline-none focus:ring-2 focus:ring-rose-200"
    : "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400/40 transition";
  const LABEL_CLASS = isLight ? "block text-sm font-medium text-amber-900 mb-2" : "block text-sm font-medium text-zinc-200 mb-2";
  const sectionBadgeClass = isLight
    ? "text-xs font-semibold uppercase tracking-wide text-amber-700"
    : "text-xs font-semibold uppercase tracking-wide text-zinc-400";
  const headerTitleClass = isLight ? "mt-2 text-2xl font-semibold tracking-tight text-amber-900" : "mt-2 text-2xl font-semibold tracking-tight text-white";
  const headerBodyClass = isLight ? "mt-2 text-sm text-amber-800" : "mt-2 text-sm text-zinc-300";
  const containerClass = isLight
    ? "rounded-3xl border border-rose-100/70 bg-white/90 backdrop-blur p-6 md:p-8 text-amber-900 shadow-[0_20px_45px_-25px_rgba(244,114,182,0.35)]"
    : "rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 md:p-8 text-zinc-100 shadow-lg shadow-blue-500/5";
  const errorClass = isLight
    ? "mb-6 rounded-xl border border-red-300/70 bg-red-100/60 px-4 py-3 text-sm text-red-700"
    : "mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200";
  const vendorBadgeClass = isLight
    ? "rounded-full border border-rose-200/70 bg-rose-50/80 px-3 py-1 text-xs text-rose-600"
    : "rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300";
  const helperTextClass = isLight ? "text-xs text-amber-700/70" : "text-xs text-zinc-400";
  const footerNoteClass = isLight ? "text-xs text-amber-800/70" : "text-xs text-zinc-400";
  const submitButtonClass = isLight
    ? "inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-200 to-amber-200 px-4 py-2 text-sm font-semibold text-amber-900 shadow-sm shadow-rose-200/60 transition hover:from-rose-300 hover:to-amber-300 disabled:opacity-60"
    : "inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-400 hover:to-purple-500 disabled:opacity-60";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [legalName, setLegalName] = useState(vendorInitialValues?.legalName ?? "");
  const [country, setCountry] = useState(vendorInitialValues?.country ?? "");
  const [contactPhone, setContactPhone] = useState(vendorInitialValues?.contactPhone ?? "");
  const [address, setAddress] = useState(vendorInitialValues?.address ?? "");
  const [documentIds, setDocumentIds] = useState<string[]>(vendorInitialValues?.documentIds ?? []);

  useEffect(() => {
    if (!showVendorApplication) return;
    if (vendorInitialValues?.legalName && !legalName) setLegalName(vendorInitialValues.legalName);
    if (vendorInitialValues?.country && !country) setCountry(vendorInitialValues.country);
    if (vendorInitialValues?.contactPhone && !contactPhone) setContactPhone(vendorInitialValues.contactPhone);
    if (vendorInitialValues?.address && !address) setAddress(vendorInitialValues.address);
    if (vendorInitialValues?.documentIds && !documentIds.length) setDocumentIds(vendorInitialValues.documentIds);
  }, [vendorInitialValues, showVendorApplication, legalName, country, contactPhone, address, documentIds.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      let vendorApplicationState: VendorApplicationFormState | undefined;
      if (showVendorApplication) {
        const trimmedLegalName = legalName.trim();
        const trimmedCountry = country.trim();
        if (!trimmedLegalName || !trimmedCountry) {
          setError("Please provide your legal business name and country.");
          setSubmitting(false);
          return;
        }

        vendorApplicationState = {
          legalName: trimmedLegalName,
          country: trimmedCountry,
          contactPhone: contactPhone.trim(),
          address: address.trim(),
          documentIds,
        };
      }

      // Run prerequisite action if provided (e.g., account registration)
      if (beforeCreate) {
        await beforeCreate({ vendorApplication: vendorApplicationState });
      }
      const csrf = await getCsrfToken();
      const shopRes = await fetch(`${API_URL}/api/v1/shops`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        credentials: "include",
        body: JSON.stringify({ name, description }),
      });
      if (!shopRes.ok) {
        const body = await shopRes.json().catch(() => ({}));
        let msg = body?.error || `Failed to create shop (${shopRes.status})`;
        if (shopRes.status === 403) msg = 'You need a vendor account to create a shop. Please try again.';
        throw new Error(msg);
      }
      const newShop = (await shopRes.json()) as Shop;

      if (vendorApplicationState) {
        try {
          const upgradePayload: Record<string, unknown> = {
            legalName: vendorApplicationState.legalName,
            country: vendorApplicationState.country,
          };
          if (vendorApplicationState.address) upgradePayload.address = vendorApplicationState.address;
          if (vendorApplicationState.contactPhone) upgradePayload.contactPhone = vendorApplicationState.contactPhone;
          if (vendorApplicationState.documentIds?.length) {
            upgradePayload.documentIds = vendorApplicationState.documentIds;
          }

          const upgradeRes = await fetch(`${API_URL}/api/v1/vendor/upgrade`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
            credentials: "include",
            body: JSON.stringify(upgradePayload),
          });

          if (!upgradeRes.ok) {
            const body = await upgradeRes.json().catch(() => ({}));
            const err = body?.error as string | undefined;
            if (err && ["application_pending", "already_approved"].includes(err)) {
              console.info(`[vendor-upgrade] ${err}`);
            } else if (err === "captcha_failed" || err === "too_many_requests") {
              setError(body?.error || "Vendor verification could not be completed. Please try again later.");
            } else {
              console.warn("Vendor upgrade failed", body);
            }
          }
        } catch (upgradeError) {
          console.warn("vendor upgrade after shop creation failed", upgradeError);
        }
      }

      onShopCreated(newShop);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={containerClass}>
      <header className="mb-6">
        <p className={sectionBadgeClass}>Step 1</p>
        <h2 className={headerTitleClass}>Create your shop</h2>
        <p className={headerBodyClass}>
          Start by giving your storefront a name and telling shoppers what makes it special. You can edit these details later.
        </p>
      </header>

      {error && (
        <div className={errorClass} role="alert">
          <strong className="font-semibold">Error:</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {showVendorApplication && (
          <>
            <div className="md:col-span-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className={sectionBadgeClass}>Vendor details</p>
                  <h3 className={isLight ? "text-lg font-semibold text-amber-900" : "text-lg font-semibold text-white"}>Tell us about your business</h3>
                </div>
                <span className={vendorBadgeClass}>
                  Required for approval
                </span>
              </div>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="legalName" className={LABEL_CLASS}>Legal / business name</label>
              <input
                id="legalName"
                required
                className={INPUT_CLASS}
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="e.g., Aurora Atelier d.o.o."
              />
            </div>
            <div>
              <label htmlFor="country" className={LABEL_CLASS}>Country</label>
              <input
                id="country"
                required
                className={INPUT_CLASS}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g., Bosnia and Herzegovina"
              />
            </div>
            <div>
              <label htmlFor="contactPhone" className={LABEL_CLASS}>Contact phone (optional)</label>
              <input
                id="contactPhone"
                className={INPUT_CLASS}
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="e.g., +387 61 123 456"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="address" className={LABEL_CLASS}>Business address (optional)</label>
              <textarea
                id="address"
                className={`${INPUT_CLASS} min-h-[88px]`}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, city, postal code"
              />
            </div>
            <div className="md:col-span-2">
              <label className={LABEL_CLASS}>Supporting documents</label>
              <VendorDocumentUploader
                selectedIds={documentIds}
                onChange={setDocumentIds}
                className="mt-2"
                disabled={submitting}
              />
              <p className={`mt-2 ${helperTextClass}`}>
                Upload up to 10 PDFs or images. You can remove documents unless they are already attached to an application.
              </p>
            </div>
          </>
        )}
        <div className="md:col-span-2">
          <label htmlFor="name" className={LABEL_CLASS}>Shop name</label>
          <input
            id="name"
            required
            className={INPUT_CLASS}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Aurora Atelier"
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="description" className={LABEL_CLASS}>Description (optional)</label>
          <textarea
            id="description"
            className={`${INPUT_CLASS} min-h-[140px]`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell customers what you create and why they will love it."
          />
        </div>
        <div className="md:col-span-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className={footerNoteClass}>You can add cover photography, policies, and more details after onboarding.</p>
          <button
            type="submit"
            className={submitButtonClass}
            disabled={submitting}
          >
            {submitting ? "Creating…" : "Create shop"}
          </button>
        </div>
      </form>
    </section>
  );
}
