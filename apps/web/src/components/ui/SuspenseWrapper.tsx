"use client";

import { Suspense } from 'react';
import SearchBar from './SearchBar';

export default function SuspenseWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchBar />
    </Suspense>
  );
}
