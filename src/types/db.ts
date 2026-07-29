export type Plan = "FREE" | "PRO";
export type OmniSocialStatus = "UNCONFIGURED" | "ACTIVE" | "INVALID";
export type ConnectionType = "api_key" | "mcp_url";
export type NFCColor = "MATTE_BLACK" | "BRUSHED_GOLD" | "STERLING_SILVER";
export type NFCRedirectType = "INSTAGRAM" | "LINK_IN_BIO" | "CUSTOM_URL" | "WHATSAPP_CHAT";
export type NFCOrderStatus = "ORDERED" | "PAID" | "PRINTED" | "SHIPPED" | "ACTIVE";
export type DeviceType = "IOS" | "ANDROID" | "DESKTOP" | "OTHER";
export type Sentiment = "POSITIVE" | "NEUTRAL" | "NEGATIVE";
export type WhatsAppStatus = "QUEUED" | "SENDING" | "PUBLISHED" | "FAILED";
export type AgentLogStatus = "completed" | "failed" | "running";
export type AgentLogSource = "web" | "whatsapp" | "api";

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  plan: Plan;
  createdAt: string;
  updatedAt: string;
}

export interface OmniSocialConfig {
  id: string;
  userId: string;
  apiKeyEncrypted: string;
  connectionType: ConnectionType;
  mcpUrl: string | null;
  lastSyncedAt: string | null;
  status: OmniSocialStatus;
  createdAt: string;
  updatedAt: string;
}

export type NFCLinkType = 
  | "instagram" | "whatsapp" | "google_review" | "phone" | "email"
  | "website" | "maps" | "shop" | "booking" | "youtube" | "twitter"
  | "linkedin" | "facebook" | "custom";

export interface NFCCard {
  id: string;
  userId: string;
  cardSlug: string;
  cardName: string;
  color: NFCColor;
  redirectType: NFCRedirectType;
  destinationUrl: string;
  isActive: boolean;
  orderStatus: NFCOrderStatus;
  txRef: string | null;
  flwTransactionId: string | null;
  activationCode: string | null;
  isActivated: boolean;
  profileSlug: string | null;
}

export interface NFCProfile {
  id: string;
  cardId: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  theme: string;
  createdAt: string;
  updatedAt: string;
}

export interface NFCLink {
  id: string;
  profileId: string;
  type: NFCLinkType;
  label: string;
  url: string;
  linkOrder: number;
  createdAt: string;
}

export interface NFCTapEvent {
  id: string;
  cardId: string;
  tappedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceType: DeviceType;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}

export type AgentFramework = "openclaw" | "hermes";

export interface AgentConfig {
  id: string;
  userId: string;
  llmProvider: string;
  llmApiKeyEncrypted: string | null;
  agentFramework: AgentFramework;
  hermesEndpointUrl: string | null;
  hermesApiKeyEncrypted: string | null;
  higgsfieldApiKeyEncrypted: string | null;
  twilioAccountSid: string | null;
  twilioAuthTokenEncrypted: string | null;
  twilioWhatsappNumber: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AgentLog {
  id: string;
  userId: string;
  source: AgentLogSource;
  intent: string | null;
  toolCalls: unknown | null;
  result: string | null;
  status: AgentLogStatus;
  createdAt: string;
}

export interface CompetitorWatch {
  id: string;
  userId: string;
  brandName: string;
  handleInstagram: string | null;
  handleYoutube: string | null;
  handleTiktok: string | null;
  handleX: string | null;
  handleLinkedin: string | null;
  followersCount: number;
  avgEngagementRate: number;
  postingFrequencyWeekly: number;
  lastScrapedAt: string | null;
  audienceSentiment: Sentiment;
  activeAdCampaignsCount: number;
  estimatedAdSpendMonthly: number;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppBillboardCampaign {
  id: string;
  userId: string;
  campaignName: string;
  mediaUrl: string;
  caption: string | null;
  redirectUrl: string | null;
  scheduledAt: string;
  status: WhatsAppStatus;
  errors: string | null;
  viewsCount: number;
  clicksCount: number;
  repliesCount: number;
  createdAt: string;
  updatedAt: string;
}
