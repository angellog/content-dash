import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";

type LinkData = {
  id: string;
  type: string;
  label: string;
  url: string;
  linkOrder: number;
};

type ProfileData = {
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  theme: string;
  links: LinkData[];
};

const LINK_ICONS: Record<string, { icon: string; color: string }> = {
  instagram: { icon: "📸", color: "text-pink-500" },
  whatsapp: { icon: "📱", color: "text-emerald-500" },
  google_review: { icon: "⭐", color: "text-yellow-500" },
  phone: { icon: "📞", color: "text-blue-500" },
  email: { icon: "📧", color: "text-violet-500" },
  website: { icon: "🌐", color: "text-cyan-500" },
  maps: { icon: "📍", color: "text-orange-500" },
  shop: { icon: "🛍️", color: "text-rose-500" },
  booking: { icon: "📅", color: "text-teal-500" },
  youtube: { icon: "▶️", color: "text-red-500" },
  twitter: { icon: "🐦", color: "text-sky-500" },
  linkedin: { icon: "💼", color: "text-blue-600" },
  facebook: { icon: "📘", color: "text-blue-500" },
  custom: { icon: "🔗", color: "text-zinc-400" },
};

// Public profile pages are rendered server-side and read with the service
// role, never the publishable key. The anon path depended on NFCCard's
// "Public read cards by cardSlug" policy, which — RLS being row-level rather
// than column-level — exposed activationCode, txRef and flwTransactionId to
// anyone holding that key. NFCProfile's and NFCLink's own public policies
// subquery NFCCard, so they would have gone dark the moment that policy was
// dropped; reading here as the service role is what makes dropping it safe.
//
// Only the columns each query names are ever sent to the browser, and both
// callers still filter on isActivated, so an unactivated card stays private.
function publicReader() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY not set — public profile pages cannot be rendered"
    );
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ profileSlug: string }>;
}): Promise<Metadata> {
  const { profileSlug } = await params;
  const supabase = publicReader();

  const { data: card } = await supabase
    .from("NFCCard")
    .select("id")
    .eq("profileSlug", profileSlug)
    .eq("isActivated", true)
    .single();

  let title = "Smart Profile";
  let description = "Connect with me";

  if (card) {
    const { data: profile } = await supabase
      .from("NFCProfile")
      .select("displayName, bio")
      .eq("cardId", card.id)
      .single();

    if (profile) {
      title = profile.displayName;
      description = profile.bio || `Connect with ${profile.displayName}`;
    }
  }

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ profileSlug: string }>;
}) {
  const { profileSlug } = await params;

  const supabase = publicReader();

  const { data: card } = await supabase
    .from("NFCCard")
    .select("id")
    .eq("profileSlug", profileSlug)
    .eq("isActivated", true)
    .single();

  if (!card) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-bold text-zinc-200">Profile Not Found</h1>
          <p className="text-sm text-zinc-500">This Smart Profile doesn&apos;t exist or hasn&apos;t been activated yet.</p>
        </div>
      </div>
    );
  }

  const { data: profileData } = await supabase
    .from("NFCProfile")
    .select("*, links:NFCLink(id, type, label, url, linkOrder)")
    .eq("cardId", card.id)
    .single();

  if (!profileData) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-bold text-zinc-200">Profile Not Set Up</h1>
          <p className="text-sm text-zinc-500">This card has been activated but the profile hasn&apos;t been created yet.</p>
        </div>
      </div>
    );
  }

  const profile = profileData as unknown as ProfileData;
  const links = (profile.links || []).sort(
    (a: LinkData, b: LinkData) => (a.linkOrder ?? 0) - (b.linkOrder ?? 0)
  );

  function resolveUrl(type: string, url: string): string {
    if (type === "phone") return `tel:${url}`;
    if (type === "email") return `mailto:${url}`;
    return url;
  }

  return (
    <div className="min-h-screen bg-zinc-950 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.1),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(139,92,246,0.07),transparent_60%)] pointer-events-none" />

      <div className="relative z-10 max-w-md mx-auto px-6 py-12 space-y-8">
        <div className="flex flex-col items-center text-center space-y-3">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="size-20 rounded-full object-cover border-2 border-zinc-700"
            />
          ) : (
            <div className="size-20 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center">
              <span className="text-2xl text-zinc-600">👤</span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">{profile.displayName}</h1>
            {profile.bio && <p className="text-sm text-zinc-400 mt-1 max-w-xs">{profile.bio}</p>}
          </div>
        </div>

        <div className="space-y-3">
          {links.map((link) => {
            const iconInfo = LINK_ICONS[link.type] || LINK_ICONS.custom;
            const href = resolveUrl(link.type, link.url);
            return (
              <a
                key={link.id}
                href={href}
                target={link.type === "phone" || link.type === "email" ? undefined : "_blank"}
                rel={link.type === "phone" || link.type === "email" ? undefined : "noopener noreferrer"}
                className="flex items-center gap-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 px-5 py-3.5 transition-colors hover:bg-zinc-800/80 hover:border-zinc-700"
              >
                <span className="text-lg">{iconInfo.icon}</span>
                <span className="text-sm text-zinc-200 flex-1 truncate">{link.label || link.type}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 text-zinc-600 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                </svg>
              </a>
            );
          })}
        </div>

        <p className="text-center text-[10px] text-zinc-600 pt-8">
          Powered by ContentDash
        </p>
      </div>
    </div>
  );
}
