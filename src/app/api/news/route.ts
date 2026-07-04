import { NextResponse } from "next/server";

const RSS_FEEDS = [
  { url: "https://techcrunch.com/category/social/feed/", source: "TechCrunch", category: "Tools" },
  { url: "https://hbr.org/feed", source: "Harvard Business Review", category: "Business" },
  { url: "https://feeds.feedburner.com/SocialMediaExaminer", source: "Social Media Examiner", category: "Growth" },
];

interface ParsedItem {
  id: string;
  title: string;
  source: string;
  date: string;
  summary: string;
  readTime: string;
  category: string;
  url: string;
  suggestedPrompt: string;
}

function parseXmlItems(xml: string, source: string, category: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  const itemRegex = /<item[\s\S]*?<\/item>/gi;
  const matches = xml.match(itemRegex) || [];

  for (const match of matches.slice(0, 5)) {
    const titleMatch = match.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
    const linkMatch = match.match(/<link>(.*?)<\/link>/);
    const descMatch = match.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/);
    const dateMatch = match.match(/<pubDate>(.*?)<\/pubDate>/);

    const title = titleMatch ? (titleMatch[1] || titleMatch[2] || "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">") : "";
    const link = linkMatch ? linkMatch[1] : "";
    const desc = descMatch ? (descMatch[1] || descMatch[2] || "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").trim().slice(0, 300) : "";
    const pubDate = dateMatch ? dateMatch[1] : "";

    if (!title) continue;

    const wordCount = desc.split(/\s+/).length;
    const readTime = `${Math.max(2, Math.round(wordCount / 200))} min read`;

    items.push({
      id: `rss-${Buffer.from(link).toString("base64url")}`,
      title,
      source,
      date: pubDate ? new Date(pubDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recent",
      summary: desc || title,
      readTime,
      category,
      url: link,
      suggestedPrompt: `Create a social post summarizing the key insights from "${title}" and how they apply to content creators in 2026.`,
    });
  }

  return items;
}

export async function GET() {
  try {
    const results = await Promise.allSettled(
      RSS_FEEDS.map(async (feed) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
          const res = await fetch(feed.url, {
            signal: controller.signal,
            headers: { "User-Agent": "ContentDash/1.0" },
          });
          clearTimeout(timeout);
          if (!res.ok) return [];
          const xml = await res.text();
          return parseXmlItems(xml, feed.source, feed.category);
        } catch {
          clearTimeout(timeout);
          return [];
        }
      })
    );

    const articles: ParsedItem[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        articles.push(...result.value);
      }
    }

    articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ articles, isLive: articles.length > 0 });
  } catch {
    return NextResponse.json({ articles: [], isLive: false }, { status: 500 });
  }
}
