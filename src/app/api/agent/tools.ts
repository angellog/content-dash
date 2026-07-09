import { ToolDefinition } from "@/lib/llm";

export const AGENT_TOOLS: ToolDefinition[] = [
  {
    name: "fetch_news",
    description:
      "Fetch recent news articles from RSS feeds (TechCrunch, Harvard Business Review, Social Media Examiner). Use this to find trending content or breaking news to base social media posts on.",
    parameters: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description:
            "Topic or keyword to filter articles by (e.g. 'AI', 'social media', 'marketing', 'breaking news'). Use empty string for all topics.",
        },
        limit: {
          type: "number",
          description: "Max number of articles to return. Default 5.",
        },
      },
      required: ["topic"],
    },
  },
  {
    name: "post_to_omnisocial",
    description:
      "Create and publish a social media post via OmniSocial. Supports all platforms: instagram, facebook, linkedin, threads, tiktok, youtube, pinterest, bluesky, mastodon, x. For Instagram carousels, separate slide captions with '---SLIDE---'.",
    parameters: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description:
            "The post content. For carousels, separate slide text with '---SLIDE---'. Include hashtags.",
        },
        platforms: {
          type: "array",
          items: { type: "string" },
          description:
            "Array of platform names: instagram, facebook, linkedin, threads, tiktok, youtube, pinterest, bluesky, mastodon, x",
        },
        media_urls: {
          type: "array",
          items: { type: "string" },
          description:
            "Optional array of image URLs to attach to the post.",
        },
        scheduled_at: {
          type: "string",
          description:
            "ISO 8601 datetime to schedule the post. Omit for immediate posting.",
        },
      },
      required: ["text", "platforms"],
    },
  },
  {
    name: "create_whatsapp_campaign",
    description:
      "Create a WhatsApp billboard campaign that posts a status with a link to your NFC card or landing page.",
    parameters: {
      type: "object",
      properties: {
        campaignName: {
          type: "string",
          description: "Name of the campaign.",
        },
        caption: {
          type: "string",
          description: "Text content for the WhatsApp status.",
        },
        mediaUrl: {
          type: "string",
          description: "URL of the image to use, or gradient like 'from-purple-900 to-emerald-950'.",
        },
        scheduledAt: {
          type: "string",
          description: "When to publish the campaign.",
        },
      },
      required: ["campaignName", "caption"],
    },
  },
  {
    name: "add_competitor",
    description:
      "Add a competitor brand to the watch list for tracking and analysis.",
    parameters: {
      type: "object",
      properties: {
        brandName: { type: "string", description: "Competitor brand name" },
        handleInstagram: { type: "string", description: "Instagram handle (optional)" },
        handleYoutube: { type: "string", description: "YouTube channel (optional)" },
        handleTiktok: { type: "string", description: "TikTok handle (optional)" },
        handleX: { type: "string", description: "X/Twitter handle (optional)" },
        handleLinkedin: { type: "string", description: "LinkedIn page (optional)" },
      },
      required: ["brandName"],
    },
  },
  {
    name: "get_analytics",
    description:
      "Get a summary of social media analytics from OmniSocial including impressions, engagement rates, and top posts.",
    parameters: {
      type: "object",
      properties: {
        platform: {
          type: "string",
          description: "Specific platform to get analytics for, or 'all'.",
        },
        days: {
          type: "number",
          description: "Number of days to look back. Default 30.",
        },
      },
      required: [],
    },
  },
  {
    name: "manage_nfc_card",
    description:
      "Create or update an NFC card configuration. NFC cards redirect to a URL when tapped.",
    parameters: {
      type: "object",
      properties: {
        cardName: { type: "string", description: "Name for the NFC card" },
        redirectType: {
          type: "string",
          description: "Type: INSTAGRAM, LINK_IN_BIO, CUSTOM_URL, WHATSAPP_CHAT",
        },
        destinationUrl: { type: "string", description: "URL the card redirects to" },
        isActive: { type: "boolean", description: "Whether the card is active" },
      },
      required: ["cardName", "redirectType", "destinationUrl"],
    },
  },
  {
    name: "generate_image",
    description:
      "Generate an image or short video from a text prompt using Higgsfield AI, then return the hosted media URL. Use this to create original visual assets for social posts (e.g. before calling post_to_omnisocial with the returned URL as a media_url). Requires the user to have configured a Higgsfield API key in Settings.",
    parameters: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description:
            "Detailed description of the image or video to generate. Be specific about subject, style, lighting, and composition.",
        },
        type: {
          type: "string",
          description:
            "What to generate: 'image' (default) for a still image, or 'video' for a short generated clip.",
        },
        aspect_ratio: {
          type: "string",
          description:
            "Optional aspect ratio, e.g. '1:1', '9:16', '16:9'. Defaults to '1:1'.",
        },
      },
      required: ["prompt"],
    },
  },
];

export type AgentToolName = (typeof AGENT_TOOLS)[number]["name"];
