import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cardSlug: string }> }
) {
  const { cardSlug } = await params;

  const card = await prisma.nFCCard.findUnique({
    where: { cardSlug },
    include: { tapEvents: false },
  });

  if (!card || !card.isActive) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const forwarded = req.headers.get("x-forwarded-for");
  const ipAddress = forwarded?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? null;
  const userAgent = req.headers.get("user-agent") ?? null;

  let deviceType: "IOS" | "ANDROID" | "DESKTOP" = "DESKTOP";
  if (userAgent) {
    if (/iPhone|iPad/i.test(userAgent)) {
      deviceType = "IOS";
    } else if (/Android/i.test(userAgent)) {
      deviceType = "ANDROID";
    }
  }

  prisma.nFCTapEvent
    .create({
      data: { cardId: card.id, ipAddress, userAgent, deviceType },
    })
    .catch(() => {});

  return NextResponse.redirect(new URL(card.destinationUrl, req.url), 302);
}
