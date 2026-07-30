import { z } from "zod";
import { CARD_COLORS, ORDERABLE_QUANTITIES } from "@/lib/nfc-pricing";

export const agentExecuteSchema = z.object({
  message: z.string().min(1),
  source: z.enum(["web", "whatsapp", "api"]).optional().default("web"),
});

export const agentConfigPutSchema = z.object({
  agentFramework: z.enum(["openclaw", "hermes"]).optional().default("openclaw"),
  llmProvider: z.enum(["openai", "anthropic", "gemini"]).optional().default("openai"),
  llmApiKey: z.string().min(1).optional(),
  hermesEndpointUrl: z.string().url("Invalid Hermes endpoint URL").optional().or(z.literal("")),
  hermesApiKey: z.string().min(1).optional(),
  higgsfieldApiKey: z.string().min(1).optional(),
  twilioAccountSid: z.string().optional(),
  twilioAuthToken: z.string().optional(),
  twilioWhatsappNumber: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export const paymentPostSchema = z.object({
  cardColor: z.enum(CARD_COLORS),
  // Only the quantities the storefront actually quotes a price for.
  quantity: z
    .union(ORDERABLE_QUANTITIES.map((q) => z.literal(q)) as [z.ZodLiteral<number>, ...z.ZodLiteral<number>[]])
    .optional()
    .default(1),
  cardName: z.string().min(1).max(100).optional(),
  redirectType: z.enum(["INSTAGRAM", "LINK_IN_BIO", "CUSTOM_URL", "WHATSAPP_CHAT"]).optional(),
  destinationUrl: z.string().url().optional(),
});

export const nfcCardPostSchema = z.object({
  cardSlug: z.string().regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "Slug must be lowercase alphanumeric with hyphens"),
  cardName: z.string().min(1).max(100),
  destinationUrl: z.string().url(),
  color: z.enum(["MATTE_BLACK", "BRUSHED_GOLD", "STERLING_SILVER"]).optional().default("MATTE_BLACK"),
  redirectType: z.enum(["INSTAGRAM", "LINK_IN_BIO", "CUSTOM_URL", "WHATSAPP_CHAT"]).optional().default("CUSTOM_URL"),
});

export const nfcCardPatchSchema = z.object({
  id: z.string().min(1),
  cardName: z.string().min(1).max(100).optional(),
  destinationUrl: z.string().url().optional(),
  color: z.enum(["MATTE_BLACK", "BRUSHED_GOLD", "STERLING_SILVER"]).optional(),
  redirectType: z.enum(["INSTAGRAM", "LINK_IN_BIO", "CUSTOM_URL", "WHATSAPP_CHAT"]).optional(),
  isActive: z.boolean().optional(),
  profileSlug: z.string().regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "Slug must be lowercase alphanumeric with hyphens").optional(),
}).strict();

export const nfcActivateSchema = z.object({
  activationCode: z.string().min(1),
});

export const nfcProfileUpsertSchema = z.object({
  cardId: z.string().min(1),
  displayName: z.string().min(1).max(100),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  theme: z.string().max(50).optional().default("default"),
  links: z.array(z.object({
    id: z.string().optional(),
    type: z.enum([
      "instagram", "whatsapp", "google_review", "phone", "email",
      "website", "maps", "shop", "booking", "youtube", "twitter",
      "linkedin", "facebook", "custom",
    ]),
    label: z.string().min(1).max(100),
    url: z.string().min(1),
    linkOrder: z.int().min(0).optional().default(0),
  })).optional().default([]),
});

export const whatsappCampaignPostSchema = z.object({
  campaignName: z.string().min(1).max(200),
  mediaUrl: z.string().url(),
  caption: z.string().max(1000).optional(),
  redirectUrl: z.string().url().optional(),
  scheduledAt: z.string().datetime(),
});

export const competitorPostSchema = z.object({
  brandName: z.string().min(1).max(200),
  handleInstagram: z.string().max(100).optional(),
  handleYoutube: z.string().max(100).optional(),
  handleTiktok: z.string().max(100).optional(),
  handleX: z.string().max(100).optional(),
  handleLinkedin: z.string().max(100).optional(),
});

export const omnisocialConfigPutSchema = z.object({
  apiKey: z.string().min(1).optional(),
  input: z.string().min(1).optional(),
}).refine((d) => d.apiKey || d.input, {
  message: "API key or MCP URL is required",
});

export const omnisocialValidateSchema = z.object({
  apiKey: z.string().min(1),
});

export const librarySearchSchema = z.object({
  query: z.string().min(1),
  limit: z.int().positive().max(50).optional().default(12),
});

export const libraryPostPatchSchema = z.object({
  id: z.int().positive(),
  status: z.enum(["pending", "approved", "rejected", "queued"]),
});

export const libraryQueuePostSchema = z.object({
  post_id: z.int().positive(),
  target_id: z.int().positive(),
  rewritten_caption: z.string().optional().nullable(),
  scheduled_at: z.string().optional().nullable(),
});

export const libraryQueuePatchSchema = z.object({
  id: z.int().positive(),
  publish_status: z.enum(["draft", "scheduled", "publishing", "published", "failed"]).optional(),
  scheduled_at: z.string().optional().nullable(),
  rewritten_caption: z.string().optional().nullable(),
});

export const libraryQueueDeleteSchema = z.object({
  id: z.int().positive(),
});

export function validateBody<T extends z.ZodType>(schema: T, body: unknown): { data: z.infer<T> } | { error: string } {
  const result = schema.safeParse(body);
  if (result.success) return { data: result.data };
  return { error: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
}
