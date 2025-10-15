"use client";

import { useState } from 'react';
import { API_URL } from '@/lib/api';

interface StaticImageProps {
  fileName: string | null | undefined;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
}

/**
 * Komponenta za prikaz statičke slike s fallback opcijom
 */
export default function StaticImage({ 
  fileName, 
  alt = 'Image', 
  className = 'h-60 w-full object-cover rounded-md', 
  fallbackClassName = 'h-60 w-full rounded-md bg-light-muted/10 dark:bg-dark-muted/10' 
}: StaticImageProps) {
  const [error, setError] = useState(false);
  const [triedAlt, setTriedAlt] = useState(false);
  
  // Ako nema fileName ili je došlo do greške pri učitavanju, prikaži fallback
  if (!fileName || error) {
    return <div className={fallbackClassName} />;
  }
  
  // Primarni URL: API_URL + /uploads + samo ime datoteke
  const primaryUrl = `${API_URL}/uploads/${fileName.split('/').pop()}`;
  // Alternativni URL: ako storageKey već sadrži /uploads/, probaj direktno
  const maybeHasUploads = typeof fileName === 'string' && fileName.includes('/uploads/');
  const altUrl = maybeHasUploads
    ? `${API_URL}${fileName.startsWith('/') ? fileName : `/${fileName}`}`
    : primaryUrl;
  const imageUrl = triedAlt ? altUrl : primaryUrl;

  // Debug
  if (process.env.NODE_ENV !== 'production') {
     
    console.log('[StaticImage] src =', imageUrl, 'from fileName =', fileName);
  }
  
  return (
    <img 
      src={imageUrl} 
      alt={alt} 
      className={className} 
      onError={(e) => {
        if (!triedAlt && imageUrl === primaryUrl) {
          // Prvi pokušaj nije uspio, probaj alternativni URL
          setTriedAlt(true);
        } else {
          setError(true);
           
          console.error('Error loading image:', fileName, 'tried =', imageUrl);
        }
      }} 
    />
  );
}
