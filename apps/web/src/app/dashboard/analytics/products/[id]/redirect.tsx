"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Force a reload of the page to ensure Next.js re-renders the page
    window.location.reload();
  }, []);
  
  return (
    <div className="p-6 text-center">
      <div className="text-lg font-medium mb-2">Loading...</div>
      <div className="text-sm text-light-muted dark:text-dark-muted">Please wait while we load the product analytics.</div>
    </div>
  );
}
