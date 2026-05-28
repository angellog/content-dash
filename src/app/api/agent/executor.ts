import { AgentToolName } from "./tools";

export async function executeTool(
  toolName: AgentToolName,
  args: Record<string, unknown>,
  omniSocialApiKey: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<string> {
  try {
    switch (toolName) {
      case "fetch_news":
        return await executeFetchNews(args, supabaseUrl);
      case "post_to_omnisocial":
        return await executePostToOmniSocial(args, omniSocialApiKey);
      case "create_whatsapp_campaign":
        return await executeCreateCampaign(args, supabaseUrl, supabaseServiceKey);
      case "add_competitor":
        return await executeAddCompetitor(args, supabaseUrl, supabaseServiceKey);
      case "get_analytics":
        return await executeGetAnalytics(args, omniSocialApiKey);
      case "manage_nfc_card":
        return await executeManageNfcCard(args, supabaseUrl, supabaseServiceKey);
      default:
        return `Unknown tool: ${toolName}`;
    }
  } catch (err) {
    return `Error executing ${toolName}: ${err instanceof Error ? err.message : String(err)}`;
  }
}

async function executeFetchNews(
  args: Record<string, unknown>,
  supabaseUrl: string
): Promise<string> {
  const topic = (args.topic as string) || "";
  const limit = (args.limit as number) || 5;

  const res = await fetch(`${supabaseUrl}/functions/v1/news?topic=${encodeURIComponent(topic)}&limit=${limit}`, {
    headers: { "Content-Type": "application/json" },
  }).catch(() => null);

  if (!res || !res.ok) {
    const fallback = await fetch("https://api.omnisocials.com/v1/news?limit=5").catch(() => null);
    if (fallback && fallback.ok) {
      const data = await fallback.json();
      return JSON.stringify(data.articles ?? data.data ?? []);
    }
    return "No news articles available at this time.";
  }

  const data = await res.json();
  return JSON.stringify(data.articles ?? data);
}

async function executePostToOmniSocial(
  args: Record<string, unknown>,
  apiKey: string
): Promise<string> {
  const text = args.text as string;
  const platforms = args.platforms as string[];
  const mediaUrls = (args.media_urls as string[]) ?? [];
  const scheduledAt = args.scheduled_at as string | undefined;

  const res = await fetch("https://api.omnisocials.com/v1/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      platforms,
      media: mediaUrls.length > 0 ? mediaUrls : undefined,
      scheduled_at: scheduledAt,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return `Failed to create post: ${res.status} — ${err}`;
  }

  const data = await res.json();
  return `Post created successfully! ID: ${data.data?.id ?? data.id ?? "unknown"}. Platforms: ${platforms.join(", ")}. ${scheduledAt ? `Scheduled for: ${scheduledAt}` : "Published immediately."}`;
}

async function executeCreateCampaign(
  args: Record<string, unknown>,
  supabaseUrl: string,
  serviceKey: string
): Promise<string> {
  const res = await fetch(`${supabaseUrl}/rest/v1/WhatsAppBillboardCampaign`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      id: crypto.randomUUID(),
      campaignName: args.campaignName,
      caption: args.caption,
      mediaUrl: args.mediaUrl ?? "",
      scheduledAt: args.scheduledAt ?? new Date().toISOString(),
      status: "QUEUED",
    }),
  });

  if (!res.ok) {
    return `Failed to create campaign: ${res.status}`;
  }

  return `WhatsApp campaign "${args.campaignName}" created and queued!`;
}

async function executeAddCompetitor(
  args: Record<string, unknown>,
  supabaseUrl: string,
  serviceKey: string
): Promise<string> {
  const res = await fetch(`${supabaseUrl}/rest/v1/CompetitorWatch`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      id: crypto.randomUUID(),
      brandName: args.brandName,
      handleInstagram: args.handleInstagram || null,
      handleYoutube: args.handleYoutube || null,
      handleTiktok: args.handleTiktok || null,
      handleX: args.handleX || null,
      handleLinkedin: args.handleLinkedin || null,
    }),
  });

  if (!res.ok) {
    return `Failed to add competitor: ${res.status}`;
  }

  return `Competitor "${args.brandName}" added to watch list.`;
}

async function executeGetAnalytics(
  args: Record<string, unknown>,
  apiKey: string
): Promise<string> {
  const platform = args.platform as string || "";
  const days = args.days as number || 30;
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
  const endDate = new Date().toISOString().split("T")[0];

  let url = `https://api.omnisocials.com/v1/analytics?start_date=${startDate}&end_date=${endDate}`;
  if (platform && platform !== "all") {
    url += `&platform=${platform}`;
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    return `Failed to fetch analytics: ${res.status}`;
  }

  const data = await res.json();
  return JSON.stringify(data.data ?? data, null, 2);
}

async function executeManageNfcCard(
  args: Record<string, unknown>,
  supabaseUrl: string,
  serviceKey: string
): Promise<string> {
  const res = await fetch(`${supabaseUrl}/rest/v1/NFCCard`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      id: crypto.randomUUID(),
      cardName: args.cardName,
      redirectType: (args.redirectType as string).toUpperCase(),
      destinationUrl: args.targetUrl,
      cardSlug: `card-${Date.now().toString(36)}`,
      isActive: args.isActive ?? true,
    }),
  });

  if (!res.ok) {
    return `Failed to create NFC card: ${res.status}`;
  }

  return `NFC card "${args.cardName}" created. Redirect: ${args.redirectType} → ${args.targetUrl}`;
}
