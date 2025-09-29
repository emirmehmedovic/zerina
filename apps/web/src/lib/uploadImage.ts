import { API_URL } from "./api";
import { getCsrfToken } from "./csrf";

/**
 * Utility function to upload an image with proper CSRF protection
 * @param file File to upload
 * @returns Promise with upload result
 */
export async function uploadImage(file: File) {
  // Get CSRF token for protection
  const csrfToken = await getCsrfToken();
  
  // Create form data
  const form = new FormData();
  form.append("file", file);
  
  // Upload the file
  const res = await fetch(`${API_URL}/api/v1/uploads`, { 
    method: "POST", 
    credentials: "include", 
    headers: {
      "X-CSRF-Token": csrfToken
    },
    body: form 
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error || `Upload failed (${res.status})`);
  }
  
  return await res.json();
}
