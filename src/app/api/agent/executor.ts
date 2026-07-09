import { AgentToolName } from "./tools";
import { decrypt } from "@/lib/encryption";

export async function executeTool(
  toolName: AgentToolName,
  args: Record<string, unknown>,
  omniSocialApiKey: string,
  supabaseUrl: string,
  supabaseServiceKey: string,
  userId: string
): Promise<string> {
  try {
    switch (toolName) {
      case "fetch_news":
        return await executeFetchNews(args, supabaseUrl);
      case "post_to_omnisocial":
        return await executePostToOmniSocial(args, omniSocialApiKey);
      case "create_whatsapp_campaign":
        return await executeCreateCampaign(args, supabaseUrl, supabaseServiceKey, userId);
      case "add_competitor":
        return await executeAddCompetitor(args, supabaseUrl, supabaseServiceKey, userId);
      case "get_analytics":
        return await executeGetAnalytics(args, omniSocialApiKey);
      case "manage_nfc_card":
        return await executeManageNfcCard(args, supabaseUrl, supabaseServiceKey, userId);
      case "generate_image":
        return await executeGenerateImage(args, supabaseUrl, supabaseServiceKey, userId);
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
  serviceKey: string,
  userId: string
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
      userId,
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
  serviceKey: string,
  userId: string
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
      userId,
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

  let url = `https://api.omnisocials.com/v1/analytics/overview?start_date=${startDate}&end_date=${endDate}`;
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
  serviceKey: string,
  userId: string
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
      userId,
      cardName: args.cardName,
      redirectType: (args.redirectType as string).toUpperCase(),
      destinationUrl: args.destinationUrl,
      cardSlug: `card-${Date.now().toString(36)}`,
      isActive: args.isActive ?? true,
    }),
  });

  if (!res.ok) {
    return `Failed to create NFC card: ${res.status}`;
  }

  return `NFC card "${args.cardName}" created. Redirect: ${args.redirectType} → ${args.destinationUrl}`;
}

// --- Higgsfield media generation ---------------------------------------------
// Higgsfield's official V2 API (https://platform.higgsfield.ai) authenticates with
// `Authorization: Key KEY_ID:KEY_SECRET` and runs generations as async jobs: submit a
// job, then poll its status until it reaches `completed` and exposes a media URL.
// See https://github.com/higgsfield-ai/higgsfield-js (official SDK) for the shapes.
// Base URL and endpoint paths are env-overridable so an operator can adjust them
// without a code change; the defaults track the documented official endpoints.
const HIGGSFIELD_BASE = process.env.HIGGSFIELD_API_URL || "https://platform.higgsfield.ai";
const HIGGSFIELD_IMAGE_PATH = process.env.HIGGSFIELD_IMAGE_PATH || "/v1/text2image/soul";
const HIGGSFIELD_VIDEO_PATH = process.env.HIGGSFIELD_VIDEO_PATH || "/v1/image2video/dop";
const HIGGSFIELD_POLL_ATTEMPTS = 30;
const HIGGSFIELD_POLL_INTERVAL_MS = 2000;

// Best-effort extraction of a hosted media URL from the varied Higgsfield response
// shapes (job-set results, images[], video, or a flat url field).
function extractHiggsfieldMediaUrl(payload: unknown): string | null {
  const seen = new Set<unknown>();
  const walk = (node: unknown, depth: number): string | null => {
    if (!node || depth > 6 || seen.has(node)) return null;
    if (typeof node === "string") {
      return /^https?:\/\/\S+\.(png|jpe?g|webp|gif|mp4|mov|webm)(\?\S*)?$/i.test(node) ? node : null;
    }
    if (typeof node !== "object") return null;
    seen.add(node);
    // Prefer the highest-fidelity known fields first.
    const obj = node as Record<string, unknown>;
    for (const key of ["raw", "result", "results", "output", "min"]) {
      if (key in obj) {
        const found = walk(obj[key], depth + 1);
        if (found) return found;
      }
    }
    for (const value of Object.values(obj)) {
      const found = walk(value, depth + 1);
      if (found) return found;
    }
    return null;
  };
  return walk(payload, 0);
}

function extractHiggsfieldStatus(payload: unknown): string | null {
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    const status = obj.status ?? (Array.isArray(obj.jobs) && obj.jobs[0] && (obj.jobs[0] as Record<string, unknown>).status);
    return typeof status === "string" ? status.toLowerCase() : null;
  }
  return null;
}

function extractHiggsfieldJobId(payload: unknown): string | null {
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    const id = obj.id ?? obj.request_id ?? obj.job_set_id ?? obj.jobSetId;
    if (typeof id === "string") return id;
  }
  return null;
}

async function executeGenerateImage(
  args: Record<string, unknown>,
  supabaseUrl: string,
  serviceKey: string,
  userId: string
): Promise<string> {
  const prompt = (args.prompt as string)?.trim();
  if (!prompt) {
    return "No prompt provided. Describe the image or video you want to generate.";
  }
  const type = (args.type as string) === "video" ? "video" : "image";
  const aspectRatio = (args.aspect_ratio as string) || "1:1";

  // Fetch this user's encrypted Higgsfield key from AgentConfig.
  const configRes = await fetch(
    `${supabaseUrl}/rest/v1/AgentConfig?userId=eq.${userId}&select=higgsfieldApiKeyEncrypted`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  ).catch(() => null);

  if (!configRes || !configRes.ok) {
    return "Could not load your agent configuration to read the Higgsfield API key.";
  }

  const rows = (await configRes.json().catch(() => [])) as Array<{ higgsfieldApiKeyEncrypted?: string | null }>;
  const encryptedKey = rows[0]?.higgsfieldApiKeyEncrypted;
  if (!encryptedKey) {
    return "Higgsfield API key not configured — add it in Settings > AI Agent Configuration.";
  }

  let credentials: string;
  try {
    credentials = decrypt(encryptedKey);
  } catch {
    return "Failed to decrypt the stored Higgsfield API key. Re-enter it in Settings.";
  }

  const authHeaders = {
    Authorization: `Key ${credentials}`,
    "Content-Type": "application/json",
  };

  const path = type === "video" ? HIGGSFIELD_VIDEO_PATH : HIGGSFIELD_IMAGE_PATH;
  const submitRes = await fetch(`${HIGGSFIELD_BASE}${path}`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      params: {
        prompt,
        aspect_ratio: aspectRatio,
        batch_size: 1,
      },
    }),
  }).catch(() => null);

  if (!submitRes) {
    return "Could not reach the Higgsfield API. Check your network or try again.";
  }
  if (submitRes.status === 401 || submitRes.status === 403) {
    return "Higgsfield rejected the API key (unauthorized). Check the KEY_ID:KEY_SECRET value in Settings.";
  }
  if (!submitRes.ok) {
    const errText = await submitRes.text().catch(() => "");
    return `Higgsfield generation request failed: ${submitRes.status}${errText ? ` — ${errText.slice(0, 300)}` : ""}`;
  }

  const submitData = await submitRes.json().catch(() => null);

  // Some responses return the finished media immediately; short-circuit if so.
  const immediateUrl = extractHiggsfieldMediaUrl(submitData);
  if (immediateUrl) {
    return `Generated ${type} ready: ${immediateUrl}`;
  }

  const jobId = extractHiggsfieldJobId(submitData);
  if (!jobId) {
    return "Higgsfield accepted the request but returned no job id or media URL to track.";
  }

  // Poll the job status until it completes (or fails / times out).
  for (let attempt = 0; attempt < HIGGSFIELD_POLL_ATTEMPTS; attempt++) {
    await new Promise((r) => setTimeout(r, HIGGSFIELD_POLL_INTERVAL_MS));

    const statusRes = await fetch(`${HIGGSFIELD_BASE}/v1/requests/${jobId}/status`, {
      headers: authHeaders,
    }).catch(() => null);
    if (!statusRes || !statusRes.ok) continue;

    const statusData = await statusRes.json().catch(() => null);
    const status = extractHiggsfieldStatus(statusData);

    if (status === "completed") {
      const url = extractHiggsfieldMediaUrl(statusData);
      return url
        ? `Generated ${type} ready: ${url}`
        : "Higgsfield reported the generation completed but no media URL was found in the response.";
    }
    if (status === "failed") {
      return "Higgsfield generation failed. Try rephrasing the prompt.";
    }
    if (status === "nsfw") {
      return "Higgsfield flagged the prompt as NSFW and did not generate media. Adjust the prompt.";
    }
  }

  return "Higgsfield generation is still processing after the wait window. Try again in a moment.";
}
