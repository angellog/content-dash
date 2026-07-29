import { describe, it, expect } from "vitest";
import {
  CARD_COLORS,
  ORDERABLE_QUANTITIES,
  QUANTITY_PRICES,
  priceForQuantity,
  toDbColor,
} from "@/lib/nfc-pricing";

describe("nfc pricing", () => {
  it("charges exactly what the storefront quotes for each bundle", () => {
    expect(priceForQuantity(1)).toBe(29);
    expect(priceForQuantity(3)).toBe(69);
    expect(priceForQuantity(5)).toBe(99);
    expect(priceForQuantity(10)).toBe(149);
  });

  it("prices bundles below the unit-price total (the advertised saving is real)", () => {
    for (const quantity of ORDERABLE_QUANTITIES) {
      expect(priceForQuantity(quantity)).toBeLessThanOrEqual(29 * quantity);
    }
  });

  it("falls back to unit price for off-bundle quantities", () => {
    expect(priceForQuantity(2)).toBe(58);
    expect(priceForQuantity(7)).toBe(203);
  });

  it("exposes every quoted quantity as orderable", () => {
    expect(ORDERABLE_QUANTITIES).toEqual([1, 3, 5, 10]);
    expect(Object.keys(QUANTITY_PRICES)).toHaveLength(ORDERABLE_QUANTITIES.length);
  });
});

describe("toDbColor", () => {
  it("maps every catalogue colour onto an NFCColor enum label", () => {
    // These are the three labels that exist in the DB enum. A colour the
    // storefront offers but the enum lacks fails the checkout insert.
    const dbEnum = ["MATTE_BLACK", "BRUSHED_GOLD", "STERLING_SILVER"];
    for (const color of CARD_COLORS) {
      expect(dbEnum).toContain(toDbColor(color));
    }
  });
});
