-- ContentDash: correlate NFC card orders with Flutterwave transactions
--
-- 1. The payments webhook matches charge.completed events back to the card row
--    created at checkout via the tx_ref we generate, so store it on the card.
-- 2. The webhook marks a verified, correctly-priced order PAID — a state that
--    sits between ORDERED (checkout started) and PRINTED (fulfilment began).

ALTER TABLE "NFCCard" ADD COLUMN IF NOT EXISTS "txRef" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "uq_nfc_cards_tx_ref"
  ON "NFCCard"("txRef")
  WHERE "txRef" IS NOT NULL;

ALTER TYPE "NFCOrderStatus" ADD VALUE IF NOT EXISTS 'PAID' AFTER 'ORDERED';
