"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Phone,
  QrCode,
  CreditCard,
  Sparkles,
  Lock,
  ShieldCheck,
  Cpu,
  Wifi,
  MapPin,
  Eye,
  Link,
  Send,
  Upload,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SmartNfcCards() {
  // Configuration Form State
  const [redirectType, setRedirectType] = useState("instagram");
  const [redirectUrl, setRedirectUrl] = useState("https://instagram.com/mybusiness");
  const [whatsappMessage, setWhatsappMessage] = useState("Hi! I tapped your Smart NFC Card and would love to chat.");
  const [customTitle, setCustomTitle] = useState("Tap to Connect");
  
  // Checkout Form State
  const [cardColor, setCardColor] = useState("matte-black");
  const [businessLogoName, setBusinessLogoName] = useState("");
  const [cardQuantity, setCardQuantity] = useState(1);
  const [checkoutStep, setCheckoutStep] = useState("form"); // form | success

  // Mock stats
  const [activeCards, setActiveCards] = useState([
    { id: "nfc-1", name: "HQ Front Desk Card", type: "Link-in-Bio", taps: 428, status: "Active" },
    { id: "nfc-2", name: "CEO's Pitch Tag", type: "WhatsApp Chat", taps: 189, status: "Active" },
    { id: "nfc-3", name: "Conference Metal Card", type: "Custom URL", taps: 94, status: "Active" },
  ]);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    async function fetchCards() {
      try {
        const res = await fetch("/api/nfc/cards");
        if (res.ok) {
          const data = await res.json();
          if (data.cards && data.cards.length > 0) {
            setActiveCards(
              data.cards.map((c: Record<string, unknown>) => ({
                id: c.id as string,
                name: (c.cardName as string) ?? "",
                type: (c.redirectType as string) ?? "Custom URL",
                taps: (c.tapEvents as { count: number }[])?.[0]?.count ?? 0,
                status: (c.isActive as boolean) ? "Active" : "Inactive",
              }))
            );
            setIsLive(true);
          }
        }
      } catch {}
    }
    fetchCards();
  }, []);

  const handleConfigSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetUrl =
      redirectType === "whatsapp"
        ? `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`
        : redirectUrl;

    try {
      const res = await fetch("/api/nfc/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardName: customTitle || "My NFC Card",
          redirectType: redirectType.toUpperCase(),
          targetUrl,
          isActive: true,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setActiveCards((prev) => [
          ...prev,
          {
            id: saved.card?.id ?? `nfc-${Date.now()}`,
            name: customTitle || "My NFC Card",
            type: redirectType === "whatsapp" ? "WhatsApp Chat" : redirectType === "instagram" ? "Link-in-Bio" : "Custom URL",
            taps: 0,
            status: "Active",
          },
        ]);
        setIsLive(true);
        toast.success("NFC card configuration saved successfully!");
      }
    } catch {
      toast.error("Failed to save NFC configuration.");
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/nfc/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardName: businessLogoName || `NFC Card - ${cardColor}`,
          redirectType: redirectType.toUpperCase(),
          targetUrl: redirectType === "whatsapp"
            ? `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`
            : redirectUrl,
          isActive: true,
        }),
      });
    } catch {
      toast.error("Failed to create NFC card order.");
    }
    setCheckoutStep("success");
    toast.success("NFC card order placed successfully!");
  };

  // Helper to determine active preview URL based on selections
  const getPreviewUrl = () => {
    if (redirectType === "instagram") return "https://instagram.com/yourbrand";
    if (redirectType === "linkinbio") return "https://contentdash.ai/yourbrand";
    if (redirectType === "whatsapp") return "https://wa.me/123456789?text=Hello";
    return redirectUrl;
  };

  return (
    <>
      <Header title="Smart NFC Cards" />

      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        {/* Promo Hero */}
        <section className="relative overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-indigo-950/20 p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Wifi className="size-3 mr-1 inline-block animate-pulse" />
                  NFC Enabled
                </Badge>
                <Badge variant="outline" className="border-zinc-800 text-zinc-400">
                  Hardware Integration
                </Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                Smart NFC Business Cards
              </h1>
              <p className="max-w-2xl text-sm text-zinc-400">
                Bridge the physical and digital worlds. Tap a physical brushed metal NFC card 
                against any smartphone to instantly launch your custom campaign landing pages, social links, 
                or WhatsApp auto-chats. Fully manage link redirects in real-time without ever re-printing.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button onClick={() => {
                const el = document.getElementById("order-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }} className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium">
                <CreditCard className="size-4 mr-2" /> Buy Physical NFC Cards
              </Button>
            </div>
          </div>
        </section>

        {/* NFC Card Product Preview & Redirect Config */}
        <section className="grid gap-6 lg:grid-cols-5">
          
          {/* Card Mockup (2 Cols) */}
          <div className="lg:col-span-2 flex flex-col justify-stretch">
            <Card className="border-zinc-800 bg-zinc-900/50 p-6 flex flex-col justify-between overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div>
                <h3 className="text-white text-sm font-semibold mb-1 flex items-center gap-2">
                  <Cpu className="size-4 text-indigo-400" /> Physical Product Preview
                </h3>
                <p className="text-xs text-zinc-500 mb-6">
                  Brushed metal hardware card featuring an embedded high-range NTAG213 microchip.
                </p>
              </div>

              {/* CARD MOCK */}
              <div className="flex items-center justify-center py-6">
                <div className={cn(
                  "relative w-full max-w-[340px] aspect-[1.586/1] rounded-2xl border border-zinc-700/50 shadow-2xl p-6 flex flex-col justify-between overflow-hidden select-none transition-all duration-300",
                  cardColor === "matte-black" 
                    ? "bg-gradient-to-br from-zinc-800 to-zinc-950 text-white" 
                    : cardColor === "brushed-gold"
                    ? "bg-gradient-to-br from-amber-600 via-amber-800 to-amber-950 text-amber-100"
                    : "bg-gradient-to-br from-zinc-200 via-zinc-400 to-zinc-600 text-zinc-950 border-zinc-300"
                )}>
                  {/* Subtle brushed metal effect overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.03)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.03)_50%,rgba(255,255,255,0.03)_75%,transparent_75%,transparent)] bg-[length:4px_4px] opacity-30 pointer-events-none"></div>

                  <div className="flex justify-between items-start z-10">
                    <div>
                      {/* Brand Logo inside mockup */}
                      <div className="flex items-center gap-1">
                        <Sparkles className={cn("size-5", cardColor === "brushed-silver" ? "text-indigo-600" : "text-indigo-400")} />
                        <span className="text-xs font-black tracking-wider uppercase">
                          {businessLogoName || "YOUR BRAND"}
                        </span>
                      </div>
                      <p className={cn("text-[9px] mt-1 tracking-widest uppercase", cardColor === "brushed-silver" ? "text-zinc-600" : "text-zinc-400")}>
                        SMART CONNECTIONS
                      </p>
                    </div>

                    <Wifi className={cn("size-6 animate-pulse", cardColor === "brushed-silver" ? "text-indigo-600" : "text-indigo-400")} />
                  </div>

                  {/* Bottom half: Contact name & Mock QR Code */}
                  <div className="flex justify-between items-end z-10">
                    <div>
                      <p className="text-sm font-semibold tracking-wide">
                        {customTitle}
                      </p>
                      <p className={cn("text-[8px] font-mono mt-0.5", cardColor === "brushed-silver" ? "text-zinc-600" : "text-zinc-400")}>
                        Chip ID: NTAG213-C9A8D4
                      </p>
                    </div>

                    {/* QR Code Container */}
                    <div className={cn("size-14 rounded-lg p-1.5 flex items-center justify-center border", 
                      cardColor === "brushed-silver" ? "bg-white border-zinc-300 text-zinc-950" : "bg-zinc-950 border-zinc-800 text-white"
                    )}>
                      <QrCode className="size-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card specs badges */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-800/50">
                <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-[10px]">
                  No Battery Needed
                </Badge>
                <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-[10px]">
                  iOS & Android Safe
                </Badge>
                <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-[10px]">
                  Laser Engraved
                </Badge>
              </div>
            </Card>
          </div>

          {/* Configuration Form (3 Cols) */}
          <Card className="border-zinc-800 bg-zinc-900 lg:col-span-3">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Link className="size-5 text-indigo-400" />
                <CardTitle className="text-white text-lg">Configure NFC Redirect Link</CardTitle>
              </div>
              <CardDescription className="text-zinc-500">
                Instantly change where smartphones redirect when tapping your physical NFC card. No physical reprogramming required.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleConfigSave}>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="redirect-type" className="text-zinc-300 font-medium">Destination Action</Label>
                    <Select
                      value={redirectType}
                      onValueChange={(val) => {
                        if (val) {
                          setRedirectType(val);
                          if (val === "instagram") setRedirectUrl("https://instagram.com/mybusiness");
                          else if (val === "linkinbio") setRedirectUrl("https://contentdash.ai/mybusiness");
                          else if (val === "whatsapp") setRedirectUrl("https://wa.me/123456789");
                        }
                      }}
                    >
                      <SelectTrigger className="border-zinc-800 bg-zinc-950 text-white focus:ring-indigo-500">
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent className="border-zinc-800 bg-zinc-900 text-white">
                        <SelectItem value="instagram">Instagram Profile</SelectItem>
                        <SelectItem value="linkinbio">OmniSocial Link-in-Bio</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp Auto-Chat</SelectItem>
                        <SelectItem value="custom">Custom URL / Website</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="card-title-text" className="text-zinc-300 font-medium">Card Onscreen Name</Label>
                    <Input
                      id="card-title-text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="e.g. John Doe - Founder"
                      className="border-zinc-800 bg-zinc-950 text-white focus-visible:ring-indigo-500"
                    />
                  </div>
                </div>

                {redirectType !== "whatsapp" ? (
                  <div className="space-y-2">
                    <Label htmlFor="redirect-url" className="text-zinc-300 font-medium">Destination URL</Label>
                    <Input
                      id="redirect-url"
                      value={redirectUrl}
                      onChange={(e) => setRedirectUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="border-zinc-800 bg-zinc-950 text-white focus-visible:ring-indigo-500"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="wa-phone" className="text-zinc-300 font-medium">WhatsApp Phone Number</Label>
                      <Input
                        id="wa-phone"
                        placeholder="+1 (555) 123-4567"
                        className="border-zinc-800 bg-zinc-950 text-white focus-visible:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wa-msg" className="text-zinc-300 font-medium">Pre-filled Chat Text</Label>
                      <Input
                        id="wa-msg"
                        value={whatsappMessage}
                        onChange={(e) => setWhatsappMessage(e.target.value)}
                        placeholder="Write a message users send on click..."
                        className="border-zinc-800 bg-zinc-950 text-white focus-visible:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950/40 text-xs flex gap-2 items-start">
                  <ShieldCheck className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-zinc-400 space-y-1">
                    <p className="font-semibold text-zinc-300">Fast cloud redirections active</p>
                    <p>When someone taps your card, they will securely hit our edge redirection server and route to <b>{getPreviewUrl()}</b> in under 45ms.</p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="border-t border-zinc-800/50 pt-4 flex justify-between items-center">
                <span className="text-xs text-zinc-500">Live configuration automatically synced to chips.</span>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                  Save Card Config
                </Button>
              </CardFooter>
            </form>
          </Card>
        </section>

        {/* Tap Analytics and Map mock */}
        <section className="grid gap-6 lg:grid-cols-3">
          {/* Active tags table */}
          <Card className="border-zinc-800 bg-zinc-900 lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Wifi className="size-4 text-indigo-400" /> Connected Active NFC Tags
              </CardTitle>
              <CardDescription className="text-zinc-500">
                Monitor taps and redirects on your registered physical devices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-zinc-950 border-zinc-800">
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-400">Card Name</TableHead>
                    <TableHead className="text-zinc-400">Action Type</TableHead>
                    <TableHead className="text-zinc-400 text-right">Taps</TableHead>
                    <TableHead className="text-zinc-400 text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeCards.map((c) => (
                    <TableRow key={c.id} className="border-zinc-800 hover:bg-zinc-800/30">
                      <TableCell className="text-white font-medium">{c.name}</TableCell>
                      <TableCell className="text-zinc-400">{c.type}</TableCell>
                      <TableCell className="text-right text-zinc-300 font-mono font-semibold">{c.taps}</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {c.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Location / Device Mock */}
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <MapPin className="size-4 text-indigo-400" /> Tap Locations & Devices
              </CardTitle>
              <CardDescription className="text-zinc-500">
                Audience source analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Map Mockup */}
              <div className="h-28 rounded-lg bg-zinc-950 border border-zinc-800 relative flex items-center justify-center overflow-hidden">
                {/* Simulated Grid / Map dots */}
                <div className="absolute inset-0 bg-[radial-gradient(#312e81_1px,transparent_1px)] [background-size:16px_16px] opacity-45"></div>
                <div className="absolute size-3 rounded-full bg-indigo-500/30 border border-indigo-400 animate-ping top-1/3 left-1/4"></div>
                <div className="absolute size-2 rounded-full bg-indigo-500 top-1/3 left-1/4"></div>
                
                <div className="absolute size-3 rounded-full bg-emerald-500/30 border border-emerald-400 animate-ping bottom-1/3 right-1/3"></div>
                <div className="absolute size-2 rounded-full bg-emerald-500 bottom-1/3 right-1/3"></div>
                
                <span className="text-[10px] text-zinc-500 font-mono z-10 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                  New York & London Active
                </span>
              </div>

              {/* Devices mock */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">iOS (iPhone)</span>
                  <span className="text-white font-semibold">78%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-[78%]"></div>
                </div>

                <div className="flex justify-between text-xs pt-1">
                  <span className="text-zinc-400">Android (Samsung, Pixel, etc.)</span>
                  <span className="text-white font-semibold">22%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[22%]"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Order Physical Cards Form */}
        <section id="order-section" className="scroll-mt-6">
          <Card className="border-zinc-800 bg-zinc-900 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

            <CardHeader className="border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-indigo-400" />
                <CardTitle className="text-white text-lg">Order Physical Customized Cards</CardTitle>
              </div>
              <CardDescription className="text-zinc-400">
                Premium lasers-engraved brushed metal cards. Zero subscription setup fee. Ships worldwide in 3-5 days.
              </CardDescription>
            </CardHeader>

            {checkoutStep === "form" ? (
              <form onSubmit={handleCheckoutSubmit}>
                <CardContent className="p-6 space-y-6">
                  <div className="grid gap-6 md:grid-cols-3">
                    
                    {/* Choose Finishes */}
                    <div className="space-y-3">
                      <Label className="text-zinc-200 font-semibold text-sm">Select Brushed Finish</Label>
                      <div className="grid gap-2">
                        <button
                          type="button"
                          onClick={() => setCardColor("matte-black")}
                          className={cn(
                            "w-full p-3 rounded-lg border text-left flex items-center justify-between",
                            cardColor === "matte-black" 
                              ? "bg-zinc-800/80 border-indigo-500 text-white" 
                              : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                          )}
                        >
                          <div>
                            <p className="text-sm font-semibold">Matte Black Steel</p>
                            <p className="text-xxs text-zinc-500">Premium heavy metal look</p>
                          </div>
                          <div className="size-4 rounded-full bg-zinc-950 border border-zinc-700 flex items-center justify-center">
                            {cardColor === "matte-black" && <div className="size-2 rounded-full bg-indigo-500"></div>}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCardColor("brushed-gold")}
                          className={cn(
                            "w-full p-3 rounded-lg border text-left flex items-center justify-between",
                            cardColor === "brushed-gold" 
                              ? "bg-zinc-800/80 border-indigo-500 text-white" 
                              : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                          )}
                        >
                          <div>
                            <p className="text-sm font-semibold">Brushed Gold</p>
                            <p className="text-xxs text-zinc-500">Luxurious titanium look</p>
                          </div>
                          <div className="size-4 rounded-full bg-zinc-950 border border-zinc-700 flex items-center justify-center">
                            {cardColor === "brushed-gold" && <div className="size-2 rounded-full bg-indigo-500"></div>}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCardColor("brushed-silver")}
                          className={cn(
                            "w-full p-3 rounded-lg border text-left flex items-center justify-between",
                            cardColor === "brushed-silver" 
                              ? "bg-zinc-800/80 border-indigo-500 text-white" 
                              : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                          )}
                        >
                          <div>
                            <p className="text-sm font-semibold">Sterling Silver</p>
                            <p className="text-xxs text-zinc-500">Sleek metallic chrome look</p>
                          </div>
                          <div className="size-4 rounded-full bg-zinc-950 border border-zinc-700 flex items-center justify-center">
                            {cardColor === "brushed-silver" && <div className="size-2 rounded-full bg-indigo-500"></div>}
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Logo upload & branding text */}
                    <div className="space-y-4">
                      <Label className="text-zinc-200 font-semibold text-sm">Logo & Engraving</Label>
                      
                      <div className="space-y-2">
                        <Label htmlFor="logo-name" className="text-zinc-400 text-xs">Engraved Business Name</Label>
                        <Input
                          id="logo-name"
                          value={businessLogoName}
                          onChange={(e) => setBusinessLogoName(e.target.value.toUpperCase())}
                          placeholder="e.g. ACME CORP"
                          maxLength={15}
                          className="border-zinc-800 bg-zinc-950 text-white focus-visible:ring-indigo-500 uppercase"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-zinc-400 text-xs">Upload Vector SVG / High-Res Logo</Label>
                        <div className="border border-dashed border-zinc-800 bg-zinc-950 rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-900/40 transition">
                          <Upload className="size-5 text-zinc-600 mb-2" />
                          <p className="text-xxs font-medium text-zinc-300">Drag logo files here or browse</p>
                          <p className="text-[10px] text-zinc-600 mt-1">SVG, PNG, AI up to 10MB</p>
                        </div>
                      </div>
                    </div>

                    {/* Quantity / Billing details */}
                    <div className="space-y-4 bg-zinc-950/40 p-4 rounded-lg border border-zinc-800 flex flex-col justify-between">
                      <div className="space-y-3">
                        <Label className="text-zinc-200 font-semibold text-sm">Select Quantity & Billing</Label>
                        
                        <div className="space-y-2">
                          <Label htmlFor="card-qty" className="text-zinc-400 text-xs">Quantity</Label>
                          <Select
                            value={cardQuantity.toString()}
                            onValueChange={(val) => {
                              if (val) setCardQuantity(parseInt(val));
                            }}
                          >
                            <SelectTrigger className="border-zinc-800 bg-zinc-950 text-white focus:ring-indigo-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-zinc-800 bg-zinc-900 text-white">
                              <SelectItem value="1">1 Card ($29.00)</SelectItem>
                              <SelectItem value="3">3 Cards ($69.00) - Save 20%</SelectItem>
                              <SelectItem value="5">5 Cards ($99.00) - Save 30%</SelectItem>
                              <SelectItem value="10">10 Cards ($149.00) - Best Value</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2 pt-4 border-t border-zinc-800/80">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400">Physical Cards Subtotal:</span>
                          <span className="text-white font-mono">${(cardQuantity === 1 ? 29 : cardQuantity === 3 ? 69 : cardQuantity === 5 ? 99 : 149).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400">NFC Cloud Connection:</span>
                          <span className="text-emerald-400 font-semibold">FREE FOREVER</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold border-t border-zinc-850 pt-2 text-white">
                          <span>Total to Pay:</span>
                          <span>${(cardQuantity === 1 ? 29 : cardQuantity === 3 ? 69 : cardQuantity === 5 ? 99 : 149).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </CardContent>

                <CardFooter className="border-t border-zinc-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-950/20">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-5 text-emerald-400 shrink-0" />
                    <span className="text-xs text-zinc-500">Secure Stripe Checkout. 30-Day Money Back Satisfaction Guarantee.</span>
                  </div>
                  <Button type="submit" size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white">
                    Submit NFC Order & Generate QR
                  </Button>
                </CardFooter>
              </form>
            ) : (
              <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
                <CheckCircle className="size-16 text-emerald-400 animate-bounce" />
                <h3 className="text-xl font-bold text-white">NFC Order Placed!</h3>
                <p className="text-sm text-zinc-400">
                  Awesome! Your custom engraved smart metal card is now in production. We are printing your custom branding <b>{businessLogoName || "YOUR BRAND"}</b> right now.
                </p>
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 w-full text-center">
                  Tracking Code: CD-NFC-{Math.floor(100000 + Math.random() * 900000)}
                </div>
                <Button 
                  onClick={() => {
                    setCheckoutStep("form");
                    setBusinessLogoName("");
                  }} 
                  className="bg-indigo-600 hover:bg-indigo-500 text-white w-full"
                >
                  Order Another Card
                </Button>
              </div>
            )}
          </Card>
        </section>
      </main>
    </>
  );
}
