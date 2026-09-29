import type { ProductId } from '@forge/contracts';

// Display copy for the two mock products. Sandbox only: nothing is ever charged.
export interface ProductDisplay {
  id: ProductId;
  label: string;
  price: string;
  note?: string;
  badge?: string;
}

export const PRODUCTS: readonly ProductDisplay[] = [
  {
    id: 'forge_plus_yearly',
    label: 'Yearly',
    price: '$59.99 / year',
    note: '$5.00 / month, billed yearly',
    badge: 'Best value',
  },
  { id: 'forge_plus_monthly', label: 'Monthly', price: '$9.99 / month' },
];
