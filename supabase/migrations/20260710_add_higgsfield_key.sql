-- ContentDash: Add Higgsfield connector support
-- Stores the user's Higgsfield API credentials (KEY_ID:KEY_SECRET) encrypted at rest,
-- powering the OpenClaw agent's generate_image tool (prompt-to-image / prompt-to-video).

ALTER TABLE "AgentConfig"
  ADD COLUMN IF NOT EXISTS "higgsfieldApiKeyEncrypted" TEXT;
