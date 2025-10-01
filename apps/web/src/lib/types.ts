// This file contains shared type definitions for the application.

export type Shop = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
};
