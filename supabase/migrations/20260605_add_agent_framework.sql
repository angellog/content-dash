-- ContentDash: Add Hermes agent framework support
-- Users can now choose between OpenClaw (cloud LLM APIs) and Hermes (self-hosted LLM endpoint)

ALTER TABLE "AgentConfig"
  ADD COLUMN IF NOT EXISTS "agentFramework" TEXT NOT NULL DEFAULT 'openclaw',
  ADD COLUMN IF NOT EXISTS "hermesEndpointUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "hermesApiKeyEncrypted" TEXT;

-- Add check constraint for valid framework values
ALTER TABLE "AgentConfig"
  ADD CONSTRAINT "chk_agent_framework" CHECK ("agentFramework" IN ('openclaw', 'hermes'));
