'use client';

import { PRODUCT_STATUS_META } from '@/lib/product-status';
import type { ProductStatus } from '@/lib/product-model';

export function ProductStatusChip({ status }: { readonly status: ProductStatus }) {
  const meta = PRODUCT_STATUS_META[status];
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${meta.badge}`}
      data-testid={`product-status-${status}`}
    >
      {meta.label}
    </span>
  );
}
