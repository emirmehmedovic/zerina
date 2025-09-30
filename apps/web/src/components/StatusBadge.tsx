"use client";

import { cva } from 'class-variance-authority';

type OrderStatus = "PENDING_PAYMENT"|"PROCESSING"|"SHIPPED"|"DELIVERED"|"CANCELLED"|"REFUNDED";

const statusBadge = cva(
  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      status: {
        PENDING_PAYMENT: 'border-transparent bg-amber-500/20 text-amber-300',
        PROCESSING: 'border-transparent bg-blue-500/20 text-blue-300',
        SHIPPED: 'border-transparent bg-indigo-500/20 text-indigo-300',
        DELIVERED: 'border-transparent bg-emerald-500/20 text-emerald-300',
        CANCELLED: 'border-transparent bg-red-500/20 text-red-300',
        REFUNDED: 'border-transparent bg-zinc-500/20 text-zinc-300',
      },
    },
  }
);

export interface StatusBadgeProps {
  status: OrderStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <div className={statusBadge({ status })}>{status.replace(/_/g, ' ')}</div>;
}
