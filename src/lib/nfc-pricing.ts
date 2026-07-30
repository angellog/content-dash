// Single source of truth for the NFC card catalogue and pricing, shared by the
// storefront, the checkout route, and the payment webhook's amount verification.
//
// Pricing is per-order-quantity and colour-independent — that is what the
// storefront quotes, and the quoted price is the one we must charge.

/** Card finishes. Keys match the `NFCColor` DB enum, kebab-cased. */
export const CARD_COLORS = [
  "matte-black",
  "brushed-gold",
  "sterling-silver",
] as const;

export type CardColor = (typeof CARD_COLORS)[number];

/** Quantity bundles offered at checkout, in USD. */
export const QUANTITY_PRICES: Record<number, number> = {
  1: 29,
  3: 69,
  5: 99,
  10: 149,
};

/** Quantities the storefront sells, ascending. */
export const ORDERABLE_QUANTITIES = Object.keys(QUANTITY_PRICES)
  .map(Number)
  .sort((a, b) => a - b);

const UNIT_PRICE = 29;

/** Order total in USD for a quantity. Off-bundle quantities bill at unit price. */
export function priceForQuantity(quantity: number): number {
  return QUANTITY_PRICES[quantity] ?? UNIT_PRICE * quantity;
}

/** "matte-black" -> "MATTE_BLACK" (the `NFCColor` DB enum label). */
export function toDbColor(color: string): string {
  return color.replace(/-/g, "_").toUpperCase();
}
