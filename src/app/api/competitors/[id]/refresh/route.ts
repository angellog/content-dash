import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { libraryBridgeFetch } from "@/lib/agent/library-bridge";

interface InsightsMedia {
  like_count: number;
  comments_count: number;
  timestamp: string;
}

// Compute a recent-cadence estimate (posts per week) from media timestamps.
function postsPerWeek(media: InsightsMedia[]): number {
  const times = media
    .map((m) => new Date(m.timestamp).getTime())
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => a - b);
  if (times.length < 2) return 0;
  const spanDays = (times[times.length - 1] - times[0]) / 86_400_000;
  if (spanDays <= 0) return 0;
  return Math.round((times.length / (spanDays / 7)) * 10) / 10;
}

function avgEngagementRate(media: InsightsMedia[], followers: number): number {
  if (followers <= 0 || media.length === 0) return 0;
  const perPost = media.map((m) => (m.like_count + m.comments_count) / followers);
  const mean = perPost.reduce((s, v) => s + v, 0) / perPost.length;
  return Math.round(mean * 1000) / 10; // → percentage, 1 dp
}

// Refresh one competitor's metrics from IG business_discovery (via the bridge),
// then persist them — the first-ever writer for CompetitorWatch's metric
// columns. IG-only; other handles stay "not tracked". Dormant-safe: if the
// bridge is NOT_CONFIGURED it reports that plainly and writes nothing.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: competitor, error: readErr } = await supabase
    .from("CompetitorWatch")
    .select("id, handleInstagram")
    .eq("id", id)
    .eq("userId", user.id)
    .single();

  if (readErr || !competitor) {
    return NextResponse.json({ error: "Competitor not found" }, { status: 404 });
  }
  if (!competitor.handleInstagram) {
    return NextResponse.json(
      { error: "This competitor has no Instagram handle to refresh." },
      { status: 400 }
    );
  }

  const { ok, status, data } = await libraryBridgeFetch(
    `/api/bridge/competitor-insights?username=${encodeURIComponent(competitor.handleInstagram)}`
  );

  if (!ok) {
    const body = data as { error?: string; status?: string };
    // 503 NOT_CONFIGURED / 404 NOT_FOUND / 502 error — pass through honestly,
    // persist nothing.
    return NextResponse.json(
      { error: body.error ?? "Failed to fetch insights", status: body.status ?? "ERROR" },
      { status }
    );
  }

  const insights = data as { followers_count: number; media: InsightsMedia[] };
  const followers = insights.followers_count ?? 0;
  const media = insights.media ?? [];

  const { data: updated, error: writeErr } = await supabase
    .from("CompetitorWatch")
    .update({
      followersCount: followers,
      avgEngagementRate: avgEngagementRate(media, followers),
      postingFrequencyWeekly: postsPerWeek(media),
      lastScrapedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("userId", user.id)
    .select()
    .single();

  if (writeErr) return NextResponse.json({ error: writeErr.message }, { status: 500 });
  return NextResponse.json(updated);
}
