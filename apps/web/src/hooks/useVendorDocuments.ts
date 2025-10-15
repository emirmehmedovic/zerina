"use client";

import { useCallback, useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { getCsrfToken } from "@/lib/csrf";
import type { VendorDocument } from "@/types/vendor";

type UseVendorDocumentsResult = {
  documents: VendorDocument[];
  loading: boolean;
  error: string | null;
  uploading: boolean;
  deletingIds: string[];
  refresh: () => Promise<void>;
  uploadDocuments: (files: File[] | FileList) => Promise<VendorDocument[]>;
  deleteDocument: (id: string) => Promise<boolean>;
};

export function useVendorDocuments(): UseVendorDocumentsResult {
  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/vendor/documents`, {
        credentials: "include",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || `Failed to load documents (${res.status})`);
      }
      const docs = Array.isArray(body?.documents) ? (body.documents as VendorDocument[]) : [];
      setDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadDocuments = useCallback<UseVendorDocumentsResult["uploadDocuments"]>(
    async (files) => {
      const fileArray = Array.from(files);
      if (!fileArray.length) return [];
      setUploading(true);
      setError(null);
      const uploaded: VendorDocument[] = [];

      try {
        const csrf = await getCsrfToken();
        for (const file of fileArray) {
          const formData = new FormData();
          formData.append("file", file);

          const res = await fetch(`${API_URL}/api/v1/vendor/documents`, {
            method: "POST",
            credentials: "include",
            headers: {
              "X-CSRF-Token": csrf,
            },
            body: formData,
          });
          const body = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(body?.error || `Failed to upload ${file.name}`);
          }
          if (body?.document) {
            uploaded.push(body.document as VendorDocument);
            setDocuments((prev) => [body.document as VendorDocument, ...prev]);
          }
        }
        return uploaded;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload documents");
        throw err;
      } finally {
        setUploading(false);
      }
    },
    []
  );

  const deleteDocument = useCallback<UseVendorDocumentsResult["deleteDocument"]>(
    async (id) => {
      setDeletingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      setError(null);
      try {
        const csrf = await getCsrfToken();
        const res = await fetch(`${API_URL}/api/v1/vendor/documents/${id}`, {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrf,
          },
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body?.error || `Failed to delete document`);
        }
        setDocuments((prev) => prev.filter((doc) => doc.id !== id));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete document");
        return false;
      } finally {
        setDeletingIds((prev) => prev.filter((docId) => docId !== id));
      }
    },
    []
  );

  return {
    documents,
    loading,
    error,
    uploading,
    deletingIds,
    refresh: fetchDocuments,
    uploadDocuments,
    deleteDocument,
  };
}
