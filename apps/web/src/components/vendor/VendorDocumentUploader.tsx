"use client";

import { useRef, type ChangeEvent } from "react";
import { Loader2, Trash, Upload, CheckCircle2, FileText, X } from "lucide-react";
import { useVendorDocuments } from "@/hooks/useVendorDocuments";
import type { VendorDocument } from "@/types/vendor";

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return "";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exp);
  return `${value.toFixed(value >= 10 || exp === 0 ? 0 : 1)} ${units[exp]}`;
}

export type VendorDocumentUploaderProps = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  allowRemoval?: boolean;
  className?: string;
};

export function VendorDocumentUploader({
  selectedIds,
  onChange,
  disabled = false,
  allowRemoval = true,
  className,
}: VendorDocumentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { documents, loading, uploading, deletingIds, error, uploadDocuments, deleteDocument, refresh } =
    useVendorDocuments();

  const isSelected = (docId: string) => selectedIds.includes(docId);
  const toggleSelect = (docId: string) => {
    if (isSelected(docId)) {
      onChange(selectedIds.filter((id) => id !== docId));
    } else {
      onChange([docId, ...selectedIds]);
    }
  };

  const handleUploadClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !files.length) return;
    try {
      const uploaded = await uploadDocuments(files);
      if (uploaded.length) {
        const newIds = uploaded.map((doc) => doc.id);
        onChange([...newIds, ...selectedIds]);
      }
    } catch (err) {
      console.error("Failed to upload vendor documents", err);
    } finally {
      event.target.value = "";
    }
  };

  const handleRemove = async (doc: VendorDocument) => {
    if (!allowRemoval) return;
    const ok = await deleteDocument(doc.id);
    if (ok) {
      onChange(selectedIds.filter((id) => id !== doc.id));
    }
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={disabled || uploading}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-amber-500 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-rose-400/30 transition hover:from-rose-400 hover:to-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading…" : "Upload document"}
        </button>
        <button
          type="button"
          onClick={() => refresh()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-rose-100/70 bg-white px-3 py-2 text-sm text-amber-900 shadow-sm transition hover:bg-rose-50 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshIcon />}
          Refresh
        </button>
        {error && <span className="text-sm text-rose-600">{error}</span>}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,image/*"
        onChange={handleFileChange}
        multiple
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {documents.map((doc) => {
          const selected = isSelected(doc.id);
          const deleting = deletingIds.includes(doc.id);
          const cardClass = selected
            ? "border-rose-300 bg-rose-50/90 text-rose-950"
            : "border-rose-100/70 bg-white text-amber-900";
          const iconClass = selected
            ? "bg-rose-100 text-rose-600"
            : "bg-rose-50 text-rose-500";
          const metaClass = selected ? "text-xs text-rose-700" : "text-xs text-amber-700";
          const selectButtonClass = selected
            ? "border border-rose-400 bg-rose-100/90 text-rose-700"
            : "border border-rose-200 bg-white text-rose-500";
          return (
            <article
              key={doc.id}
              className={`rounded-xl border p-4 transition shadow-sm ${cardClass}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`mt-1 flex h-10 w-10 items-center justify-center rounded-xl shadow-inner ${iconClass}`}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold break-all">{doc.originalName}</p>
                    <p className={metaClass}>
                      {doc.mimeType} · {formatBytes(doc.sizeBytes)} · {new Date(doc.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSelect(doc.id)}
                  disabled={disabled}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition ${selectButtonClass}`}
                >
                  {selected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CircleIcon />}
                  {selected ? "Selected" : "Select"}
                </button>
              </div>

              {allowRemoval && !doc.applicationId && (
                <button
                  type="button"
                  onClick={() => handleRemove(doc)}
                  disabled={deleting}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                >
                  {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash className="h-3.5 w-3.5" />}
                  Remove
                </button>
              )}
              {doc.applicationId && (
                <p className="mt-3 inline-flex items-center gap-2 text-xs text-amber-600">
                  <LockIcon /> Attached to application
                </p>
              )}
            </article>
          );
        })}

        {!documents.length && !loading && (
          <p className="rounded-xl border border-dashed border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            Upload identity or registration documents. Accepted formats: PDF, PNG, JPG, WEBP, GIF. Max 10 MB each.
          </p>
        )}
      </div>
    </div>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.08-3.36L23 10" />
      <path d="M20.49 15a9 9 0 0 1-14.08 3.36L1 14" />
    </svg>
  );
}

function CircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
