"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Sparkles,
  Lock,
  QrCode,
  Plus,
  X,
  GripVertical,
  ArrowRight,
  Upload,
  Save,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import type { NFCLinkType } from "@/types/db";
import QRCode from "qrcode";

const LINK_TYPES: { value: NFCLinkType; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "google_review", label: "Google Review" },
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "website", label: "Website" },
  { value: "maps", label: "Google Maps" },
  { value: "shop", label: "Online Shop" },
  { value: "booking", label: "Booking" },
  { value: "youtube", label: "YouTube" },
  { value: "twitter", label: "X / Twitter" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "facebook", label: "Facebook" },
  { value: "custom", label: "Custom Link" },
];

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

interface LinkItem {
  id: string;
  type: NFCLinkType;
  label: string;
  url: string;
  linkOrder: number;
}

interface ProfileData {
  id: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  theme: string;
  links: LinkItem[];
}

interface CardRow {
  id: string;
  cardName: string | null;
  cardSlug: string | null;
  profileSlug: string | null;
  isActivated: boolean;
}

interface ActivatedCard {
  cardId: string;
  cardName: string;
  cardSlug: string;
  profileSlug: string | null;
}

export default function SmartProfileEditor() {
  const [step, setStep] = useState<"activate" | "editor">("activate");
  const [activationCode, setActivationCode] = useState("");
  const [activating, setActivating] = useState(false);
  const [activatedCard, setActivatedCard] = useState<ActivatedCard | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    async function checkExisting() {
      try {
        const cardsRes = await fetch("/api/nfc/cards");
        if (cardsRes.ok) {
          const data = await cardsRes.json();
          const activatedCards = (data.cards || []).filter(
            (c: CardRow) => c.isActivated === true
          );
          if (activatedCards.length > 0) {
            const card = activatedCards[0];
            const cardData: ActivatedCard = {
              cardId: card.id,
              cardName: card.cardName ?? "",
              cardSlug: card.cardSlug ?? "",
              profileSlug: card.profileSlug ?? null,
            };
            setActivatedCard(cardData);
            setStep("editor");
            await loadProfile(cardData.cardId);
          }
        }
      } catch {}
    }
    checkExisting();
  }, []);

  async function loadProfile(cardId: string) {
    setLoadingProfile(true);
    try {
      const res = await fetch(`/api/nfc/profile?cardId=${cardId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          const p = data.profile as ProfileData;
          setDisplayName(p.displayName || "");
          setBio(p.bio || "");
          setAvatarUrl(p.avatarUrl || "");
          setAvatarPreview(p.avatarUrl || null);
          setLinks(
            (p.links || []).map((l: { id?: string; type?: NFCLinkType; label?: string; url?: string; linkOrder?: number }) => ({
              id: l.id || crypto.randomUUID(),
              type: l.type || "custom",
              label: l.label || "",
              url: l.url || "",
              linkOrder: l.linkOrder ?? 0,
            }))
          );
        }
      }
    } catch {} finally {
      setLoadingProfile(false);
    }
  }

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    if (!activationCode.trim()) return;
    setActivating(true);
    try {
      const res = await fetch("/api/nfc/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activationCode: activationCode.trim().toUpperCase() }),
      });
      if (res.ok) {
        const data = await res.json();
        setActivatedCard(data);
        toast.success("Card activated successfully!");
        setStep("editor");
        await loadProfile(data.cardId);
      } else {
        const err = await res.json();
        toast.error(err.error || "Invalid activation code");
      }
    } catch {
      toast.error("Failed to activate card");
    } finally {
      setActivating(false);
    }
  }

  function addLink() {
    setLinks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "website",
        label: "",
        url: "",
        linkOrder: prev.length,
      },
    ]);
  }

  function updateLink(id: string, field: keyof LinkItem, value: string | number) {
    setLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  }

  function removeLink(id: string) {
    setLinks((prev) => prev.filter((l) => l.id !== id).map((l, i) => ({ ...l, linkOrder: i })));
  }

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  async function generateQR(slug: string) {
    try {
      const url = `${window.location.origin}/p/${slug}`;
      const dataUrl = await QRCode.toDataURL(url, { width: 200, margin: 2, color: { dark: "#ffffff", light: "#00000000" } });
      setQrDataUrl(dataUrl);
    } catch {}
  }

  useEffect(() => {
    if (!activatedCard?.profileSlug) return;
    let cancelled = false;
    (async () => {
      try {
        const url = `${window.location.origin}/p/${activatedCard.profileSlug}`;
        const dataUrl = await QRCode.toDataURL(url, { width: 200, margin: 2, color: { dark: "#ffffff", light: "#00000000" } });
        if (!cancelled) setQrDataUrl(dataUrl);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [activatedCard?.profileSlug]);

  async function handleSave() {
    if (!activatedCard) return;
    setSaving(true);
    try {
      let finalAvatarUrl = avatarUrl;

      if (avatarFile) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const formData = new FormData();
        formData.append("file", avatarFile);
        formData.append("cardId", activatedCard.cardId);

        const uploadRes = await fetch("/api/nfc/avatar", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalAvatarUrl = uploadData.url;
          setAvatarUrl(finalAvatarUrl);
        }
      }

      const res = await fetch("/api/nfc/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: activatedCard.cardId,
          displayName,
          bio,
          avatarUrl: finalAvatarUrl,
          theme: "default",
          links: links.map((l, i) => ({
            ...l,
            linkOrder: i,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Smart Profile saved!");
        if (data.profileSlug && data.profileSlug !== activatedCard.profileSlug) {
          setActivatedCard((prev) => prev ? { ...prev, profileSlug: data.profileSlug } : prev);
          generateQR(data.profileSlug);
        }
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save profile");
      }
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (step === "activate") {
    return (
      <>
        <Header title="Smart Profile Editor" />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-md mx-auto mt-16">
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader className="text-center">
                <div className="mx-auto size-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-3">
                  <Lock className="size-7 text-indigo-400" />
                </div>
                <CardTitle className="text-xl text-zinc-100">Activate Your Card</CardTitle>
                <CardDescription className="text-zinc-400">
                  Enter the activation code from your NFC card order to get started.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleActivate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="activation-code" className="text-zinc-300 text-sm">Activation Code</Label>
                    <Input
                      id="activation-code"
                      value={activationCode}
                      onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                      placeholder="e.g. X9K2M4P7"
                      className="bg-zinc-950 border border-zinc-700 rounded-lg text-center text-xl font-mono tracking-widest text-zinc-100 placeholder:text-zinc-600 focus:ring-indigo-500"
                      maxLength={8}
                    />
                  </div>
                  <Button type="submit" disabled={activating || !activationCode.trim()} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">
                    {activating ? "Activating..." : "Activate Card"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    );
  }

  const profileUrl = activatedCard?.profileSlug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/p/${activatedCard.profileSlug}`
    : "";

  return (
    <>
      <Header title="Smart Profile Editor" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="grid gap-6 xl:grid-cols-5">
          <div className="xl:col-span-3 space-y-6">
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-lg text-zinc-100 flex items-center gap-2">
                  <Sparkles className="size-5 text-indigo-400" /> Profile Details
                </CardTitle>
                <CardDescription className="text-zinc-500">This info appears on your public Smart Profile page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-sm">Display Name</Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="bg-zinc-950 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300 text-sm">Bio</Label>
                  <Input
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="A short description about you or your business"
                    className="bg-zinc-950 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:ring-indigo-500"
                    maxLength={500}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300 text-sm">Profile Photo / Logo</Label>
                  <div className="flex items-center gap-4">
                    {avatarPreview ? (
                      <div className="size-16 rounded-full overflow-hidden border border-zinc-700 shrink-0">
                        <Image src={avatarPreview} alt="Avatar" width={64} height={64} className="size-full object-cover" unoptimized />
                      </div>
                    ) : (
                      <div className="size-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                        <Upload className="size-5 text-zinc-600" />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <Input
                        value={avatarUrl}
                        onChange={(e) => {
                          setAvatarUrl(e.target.value);
                          setAvatarPreview(e.target.value || null);
                          setAvatarFile(null);
                        }}
                        placeholder="Paste image URL or upload below"
                        className="bg-zinc-950 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:ring-indigo-500 text-sm"
                      />
                      <label className="cursor-pointer">
                        <span className="text-xs text-indigo-400 hover:text-indigo-300">Upload file instead</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-zinc-100">Links</CardTitle>
                  <Button variant="outline" size="sm" onClick={addLink} className="border-zinc-700 text-zinc-300 hover:text-zinc-100">
                    <Plus className="size-4 mr-1" /> Add Link
                  </Button>
                </div>
                <CardDescription className="text-zinc-500">Add social media, contact, and custom links. They appear as buttons on your profile.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {links.length === 0 && (
                  <div className="text-center py-8 text-zinc-600 text-sm">
                    No links yet. Click &ldquo;Add Link&rdquo; to get started.
                  </div>
                )}
                {links.map((link, index) => (
                  <div key={link.id} className="flex items-start gap-2 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                    <GripVertical className="size-5 text-zinc-600 mt-2 shrink-0 cursor-grab" />
                    <div className="flex-1 grid gap-2 sm:grid-cols-3">
                      <Select
                        value={link.type}
                        onValueChange={(v) => v && updateLink(link.id, "type", v)}
                      >
                        <SelectTrigger className="bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-200 focus:ring-indigo-500 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-zinc-800 bg-zinc-900">
                          {LINK_TYPES.map((lt) => (
                            <SelectItem key={lt.value} value={lt.value}>
                              {LINK_ICONS[lt.value]?.icon} {lt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={link.label}
                        onChange={(e) => updateLink(link.id, "label", e.target.value)}
                        placeholder="Label"
                        className="bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:ring-indigo-500 text-sm"
                      />
                      <Input
                        value={link.url}
                        onChange={(e) => updateLink(link.id, "url", e.target.value)}
                        placeholder="https://..."
                        className="bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:ring-indigo-500 text-sm"
                      />
                    </div>
                    <button onClick={() => removeLink(link.id)} className="mt-2 text-zinc-600 hover:text-red-400 shrink-0">
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving || !displayName.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white flex-1">
                <Save className="size-4 mr-2" /> {saving ? "Saving..." : "Save Profile"}
              </Button>
              {profileUrl && (
                <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-transparent px-4 py-2 text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors">
                  <ExternalLink className="size-4 mr-2" /> View
                </a>
              )}
            </div>
          </div>

          <div className="xl:col-span-2 space-y-6">
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                  <QrCode className="size-4 text-indigo-400" /> Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="mx-auto w-full max-w-[320px] rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.08),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(139,92,246,0.06),transparent_60%)] pointer-events-none" />

                  <div className="flex flex-col items-center text-center space-y-3 relative z-10">
                    {avatarPreview ? (
                      <div className="size-20 rounded-full overflow-hidden border-2 border-zinc-700">
                        <Image src={avatarPreview} alt="Avatar" width={80} height={80} className="size-full object-cover" unoptimized />
                      </div>
                    ) : (
                      <div className="size-20 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center">
                        <Sparkles className="size-8 text-zinc-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-zinc-100">{displayName || "Your Name"}</h3>
                      {bio && <p className="text-xs text-zinc-400 mt-1">{bio}</p>}
                    </div>
                  </div>

                  <div className="space-y-2 relative z-10">
                    {links.length === 0 && (
                      <p className="text-center text-xs text-zinc-600 py-4">No links added yet</p>
                    )}
                    {links.map((link) => {
                      const iconInfo = LINK_ICONS[link.type] || LINK_ICONS.custom;
                      return (
                        <div key={link.id} className="flex items-center gap-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 px-4 py-3">
                          <span className="text-base">{iconInfo.icon}</span>
                          <span className="text-sm text-zinc-200 flex-1 truncate">{link.label || link.type}</span>
                          <ArrowRight className="size-3.5 text-zinc-600 shrink-0" />
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-[10px] text-zinc-600 text-center relative z-10">Powered by ContentDash</p>
                </div>

                {qrDataUrl && activatedCard?.profileSlug && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-white rounded-xl">
                      <Image src={qrDataUrl} alt="QR Code" width={150} height={150} unoptimized />
                    </div>
                    <p className="text-xs text-zinc-500 font-mono break-all text-center">{profileUrl}</p>
                  </div>
                )}

                {!activatedCard?.profileSlug && (
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="p-3 bg-zinc-800 rounded-xl">
                      <QrCode className="size-[150px] text-zinc-600" />
                    </div>
                    <p className="text-xs text-zinc-600">Save your profile to generate a QR code</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
