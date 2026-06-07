import { z } from "zod";

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
  twilioAccountSid: z.string().optional(),
  twilioAuthToken: z.string().optional(),
  twilioWhatsappNumber: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export const paymentPostSchema = z.object({
  cardColor: z.enum(["matte-black", "pearl-white", "rose-gold", "chrome-silver", "obsidian-carbon"]),
  quantity: z.int().positive().max(100).optional().default(1),
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
}).strict();

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

export function validateBody<T extends z.ZodType>(schema: T, body: unknown): { data: z.infer<T> } | { error: string } {
  const result = schema.safeParse(body);
  if (result.success) return { data: result.data };
  return { error: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
}
