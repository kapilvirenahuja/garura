import type { ProductStatus } from '@/lib/product-model';

export const PRODUCT_STATUS_META: Readonly<
  Record<
    ProductStatus,
    {
      readonly label: string;
      readonly badge: string;
      readonly glow: string;
      readonly rail: string;
    }
  >
> = {
  live: {
    label: 'Live',
    badge: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200',
    glow: 'shadow-[0_0_30px_rgba(16,185,129,0.2)]',
    rail: 'from-emerald-400 to-teal-300',
  },
  partial: {
    label: 'Partial',
    badge: 'border-sky-500/40 bg-sky-500/15 text-sky-200',
    glow: 'shadow-[0_0_30px_rgba(56,189,248,0.18)]',
    rail: 'from-sky-400 to-cyan-300',
  },
  pilot: {
    label: 'Pilot',
    badge: 'border-violet-500/40 bg-violet-500/15 text-violet-200',
    glow: 'shadow-[0_0_30px_rgba(139,92,246,0.18)]',
    rail: 'from-violet-400 to-fuchsia-300',
  },
  planned: {
    label: 'Planned',
    badge: 'border-amber-500/40 bg-amber-500/15 text-amber-200',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.16)]',
    rail: 'from-amber-300 to-yellow-200',
  },
  dormant: {
    label: 'Dormant',
    badge: 'border-slate-500/40 bg-slate-500/15 text-slate-200',
    glow: 'shadow-[0_0_30px_rgba(100,116,139,0.14)]',
    rail: 'from-slate-400 to-slate-200',
  },
} as const;
