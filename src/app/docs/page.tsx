"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Cpu,
  Sparkles,
  Server,
  Wrench,
  MessageCircle,
  CreditCard,
  Shield,
  Code2,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  Cloud,
  Lock,
  Wifi,
  DollarSign,
  Globe,
  Settings,
  Terminal,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "getting-started", label: "Getting Started", icon: BookOpen },
  { id: "agent-frameworks", label: "Agent Frameworks", icon: Cpu },
  { id: "openclaw-setup", label: "OpenClaw Setup", icon: Sparkles },
  { id: "hermes-setup", label: "Hermes Setup", icon: Server },
  { id: "tool-reference", label: "Tool Reference", icon: Wrench },
  { id: "whatsapp-integration", label: "WhatsApp Integration", icon: MessageCircle },
  { id: "nfc-cards", label: "NFC Cards", icon: CreditCard },
  { id: "security", label: "Security", icon: Shield },
  { id: "api-reference", label: "API Reference", icon: Code2 },
  { id: "faq", label: "FAQ", icon: HelpCircle },
];

function SectionNav({
  active,
  onNavigate,
}: {
  active: string;
  onNavigate: (id: string) => void;
}) {
  return (
    <nav className="sticky top-6 space-y-1">
      {SECTIONS.map((s) => {
        const Icon = s.icon;
        return (
          <button
            key={s.id}
            onClick={() => onNavigate(s.id)}
            className={cn(
              "flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
              active === s.id
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{s.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function ComparisonTable() {
  const rows = [
    { aspect: "Architecture", openclaw: "Direct cloud LLM API calls", hermes: "Self-hosted LLM via OpenAI-compatible endpoint" },
    { aspect: "LLM Providers", openclaw: "OpenAI, Anthropic, Google Gemini", hermes: "Any model via vLLM/Ollama/LM Studio" },
    { aspect: "Data Flow", openclaw: "You → ContentDash → Cloud API → You", hermes: "You → ContentDash → Your Server → You" },
    { aspect: "Cost", openclaw: "Pay-per-token (~$0.075–5/1M tokens)", hermes: "Free after hardware (or ~$0.20–1/hr GPU)" },
    { aspect: "Privacy", openclaw: "Data passes through third-party API", hermes: "All data stays on your infrastructure" },
    { aspect: "Latency", openclaw: "1–3 seconds per call", hermes: "2–10 seconds per call (GPU dependent)" },
    { aspect: "Offline", openclaw: "No — requires internet", hermes: "Yes — works on local network" },
    { aspect: "Setup", openclaw: "Low — just enter an API key", hermes: "Medium — set up a model server" },
    { aspect: "Customization", openclaw: "Limited to provider capabilities", hermes: "Full control over model and parameters" },
    { aspect: "Hardware", openclaw: "None (cloud)", hermes: "GPU with 8GB+ VRAM (8B), 24GB+ (70B)" },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-700">
            <th className="py-3 px-4 text-left text-zinc-400 font-medium">Aspect</th>
            <th className="py-3 px-4 text-left text-zinc-400 font-medium">
              <span className="flex items-center gap-1.5"><Sparkles className="size-3.5 text-purple-400" /> OpenClaw</span>
            </th>
            <th className="py-3 px-4 text-left text-zinc-400 font-medium">
              <span className="flex items-center gap-1.5"><Server className="size-3.5 text-amber-400" /> Hermes</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-zinc-900/50" : ""}>
              <td className="py-2.5 px-4 text-zinc-300 font-medium">{r.aspect}</td>
              <td className="py-2.5 px-4 text-zinc-400">{r.openclaw}</td>
              <td className="py-2.5 px-4 text-zinc-400">{r.hermes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CodeBlock({ children, lang }: { children: string; lang?: string }) {
  return (
    <div className="relative rounded-lg border border-zinc-700 bg-zinc-950 p-4 overflow-x-auto">
      {lang && (
        <span className="absolute top-2 right-3 text-[10px] text-zinc-600 uppercase">{lang}</span>
      )}
      <pre className="text-sm text-emerald-400 font-mono whitespace-pre">{children}</pre>
    </div>
  );
}

function BenefitCard({
  icon: Icon,
  title,
  items,
  accent,
}: {
  icon: React.ElementType;
  title: string;
  items: string[];
  accent: string;
}) {
  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-zinc-100">
          <Icon className={cn("size-5", accent)} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-500" />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function ToolCard({
  name,
  description,
  params,
  examples,
}: {
  name: string;
  description: string;
  params: { name: string; type: string; required: boolean; desc: string }[];
  examples: string[];
}) {
  return (
    <Card className="border-zinc-800 bg-zinc-900" id={`tool-${name}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-zinc-100 flex items-center gap-2">
          <code className="text-emerald-400 bg-zinc-800 px-2 py-0.5 rounded text-sm">{name}</code>
        </CardTitle>
        <CardDescription className="text-zinc-400">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Parameters</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="py-1.5 px-3 text-left text-zinc-500 font-medium">Parameter</th>
                  <th className="py-1.5 px-3 text-left text-zinc-500 font-medium">Type</th>
                  <th className="py-1.5 px-3 text-left text-zinc-500 font-medium">Required</th>
                  <th className="py-1.5 px-3 text-left text-zinc-500 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {params.map((p) => (
                  <tr key={p.name} className="border-b border-zinc-800/50">
                    <td className="py-1.5 px-3 text-emerald-400 font-mono text-xs">{p.name}</td>
                    <td className="py-1.5 px-3 text-zinc-500 font-mono text-xs">{p.type}</td>
                    <td className="py-1.5 px-3">
                      {p.required ? (
                        <Badge variant="outline" className="border-amber-600 text-amber-400 text-[10px]">Required</Badge>
                      ) : (
                        <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-[10px]">Optional</Badge>
                      )}
                    </td>
                    <td className="py-1.5 px-3 text-zinc-400">{p.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Example Commands</p>
          <ul className="space-y-1.5">
            {examples.map((e, i) => (
              <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                <Terminal className="size-3.5 shrink-0 mt-0.5 text-zinc-600" />
                <code className="text-zinc-300">&quot;{e}&quot;</code>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function ApiRouteTable({
  routes,
}: {
  routes: { method: string; path: string; purpose: string; auth?: string; rateLimit?: string }[];
}) {
  const methodColor: Record<string, string> = {
    GET: "text-emerald-400",
    POST: "text-blue-400",
    PUT: "text-amber-400",
    PATCH: "text-orange-400",
    DELETE: "text-red-400",
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-700">
            <th className="py-2.5 px-3 text-left text-zinc-500 font-medium">Method</th>
            <th className="py-2.5 px-3 text-left text-zinc-500 font-medium">Path</th>
            <th className="py-2.5 px-3 text-left text-zinc-500 font-medium">Purpose</th>
            <th className="py-2.5 px-3 text-left text-zinc-500 font-medium">Auth</th>
            <th className="py-2.5 px-3 text-left text-zinc-500 font-medium">Rate Limit</th>
          </tr>
        </thead>
        <tbody>
          {routes.map((r, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-zinc-900/50" : ""}>
              <td className="py-2 px-3">
                <span className={cn("font-mono font-bold text-xs", methodColor[r.method])}>{r.method}</span>
              </td>
              <td className="py-2 px-3 font-mono text-xs text-zinc-300">{r.path}</td>
              <td className="py-2 px-3 text-zinc-400">{r.purpose}</td>
              <td className="py-2 px-3 text-zinc-500 text-xs">{r.auth || "—"}</td>
              <td className="py-2 px-3 text-zinc-500 text-xs">{r.rateLimit || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="space-y-2 py-4">
      <h4 className="text-sm font-medium text-zinc-200 flex items-start gap-2">
        <HelpCircle className="size-4 shrink-0 mt-0.5 text-purple-400" />
        {q}
      </h4>
      <p className="text-sm text-zinc-400 pl-6">{a}</p>
    </div>
  );
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("getting-started");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <Header title="Documentation" />

      <main className="flex-1 overflow-y-auto">
        <div className="flex">
          <aside className="hidden xl:block w-56 shrink-0 border-r border-zinc-800 p-6 h-[calc(100vh-3.5rem)] overflow-y-auto">
            <SectionNav active={activeSection} onNavigate={scrollTo} />
          </aside>

          <div className="flex-1 max-w-4xl mx-auto px-6 py-8 space-y-16">

            <section id="getting-started" className="scroll-mt-20 space-y-6">
              <div className="flex items-center gap-3">
                <BookOpen className="size-6 text-emerald-400" />
                <h2 className="text-2xl font-bold text-zinc-100">Getting Started</h2>
              </div>
              <p className="text-zinc-400 max-w-2xl">
                ContentDash is an AI-powered content management dashboard that connects your OmniSocial account to 10 social media platforms, an autonomous AI agent, WhatsApp billboard campaigns, NFC cards, and competitor tracking.
              </p>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { step: "1", title: "Create Account", desc: "Sign up and verify your email. No credit card required." },
                  { step: "2", title: "Connect OmniSocial", desc: "Add your OmniSocial API key in Settings to link your social accounts." },
                  { step: "3", title: "Configure Agent", desc: "Choose OpenClaw (cloud) or Hermes (self-hosted) and start using the AI agent." },
                ].map((s) => (
                  <Card key={s.step} className="border-zinc-800 bg-zinc-900">
                    <CardContent className="pt-5 space-y-2">
                      <div className="size-8 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-sm font-bold">{s.step}</div>
                      <h3 className="text-sm font-semibold text-zinc-200">{s.title}</h3>
                      <p className="text-xs text-zinc-500">{s.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-zinc-200">Supported Platforms</h3>
                <div className="flex flex-wrap gap-2">
                  {["Instagram", "Facebook", "LinkedIn", "X (Twitter)", "TikTok", "YouTube", "Pinterest", "Threads", "Bluesky", "Mastodon"].map((p) => (
                    <Badge key={p} variant="outline" className="border-zinc-700 text-zinc-300">{p}</Badge>
                  ))}
                </div>
              </div>
            </section>

            <Separator className="bg-zinc-800" />

            <section id="agent-frameworks" className="scroll-mt-20 space-y-6">
              <div className="flex items-center gap-3">
                <Cpu className="size-6 text-purple-400" />
                <h2 className="text-2xl font-bold text-zinc-100">Agent Frameworks</h2>
              </div>
              <p className="text-zinc-400 max-w-2xl">
                ContentDash supports two agent frameworks. Both share the same 6 tools and execution engine — the difference is how they call the LLM.
              </p>

              <ComparisonTable />

              <div className="grid gap-6 md:grid-cols-2">
                <BenefitCard
                  icon={Sparkles}
                  title="OpenClaw Benefits"
                  accent="text-purple-400"
                  items={[
                    "Zero infrastructure — just add an API key",
                    "Best reasoning quality (GPT-4o, Claude, Gemini)",
                    "Fastest setup — configure in under 2 minutes",
                    "Switch providers anytime (OpenAI, Anthropic, Google)",
                    "No GPU required — runs entirely in the cloud",
                    "Automatic model updates from providers",
                  ]}
                />
                <BenefitCard
                  icon={Server}
                  title="Hermes Benefits"
                  accent="text-amber-400"
                  items={[
                    "Complete data privacy — nothing leaves your server",
                    "Zero per-token cost after hardware investment",
                    "Works offline in air-gapped environments",
                    "Full model control — temperature, context, sampling",
                    "No vendor lock-in — not dependent on any provider",
                    "GOAP reasoning with built-in scratch pad",
                    "Supports custom fine-tuned models",
                  ]}
                />
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-zinc-200">When to Use Which</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-700">
                        <th className="py-2 px-4 text-left text-zinc-500 font-medium">Scenario</th>
                        <th className="py-2 px-4 text-left text-zinc-500 font-medium">Recommended</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Just getting started", "OpenClaw"],
                        ["Small team, low volume", "OpenClaw"],
                        ["Enterprise with data privacy requirements", "Hermes"],
                        ["High volume (>10K requests/day)", "Hermes"],
                        ["Air-gapped or offline environment", "Hermes"],
                        ["Custom/fine-tuned model experimentation", "Hermes"],
                        ["Best-in-class reasoning for complex tasks", "OpenClaw"],
                        ["Startup with limited DevOps", "OpenClaw"],
                        ["Regulated industry (finance, healthcare)", "Hermes"],
                        ["Predictable flat monthly costs", "Hermes"],
                      ].map(([scenario, rec], i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-zinc-900/50" : ""}>
                          <td className="py-2 px-4 text-zinc-400">{scenario}</td>
                          <td className="py-2 px-4">
                            <Badge variant="outline" className={rec === "Hermes" ? "border-amber-600 text-amber-400" : "border-purple-600 text-purple-400"}>
                              {rec}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <Separator className="bg-zinc-800" />

            <section id="openclaw-setup" className="scroll-mt-20 space-y-6">
              <div className="flex items-center gap-3">
                <Sparkles className="size-6 text-purple-400" />
                <h2 className="text-2xl font-bold text-zinc-100">OpenClaw Setup</h2>
              </div>

              <div className="space-y-6">
                <Card className="border-zinc-800 bg-zinc-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-zinc-100">Step 1: Choose Your LLM Provider</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-zinc-400 mb-3">In Settings, select OpenClaw as the framework, then choose a provider:</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        { name: "OpenAI", model: "GPT-4o", best: "General-purpose, best reasoning", price: "~$5/1M tokens" },
                        { name: "Anthropic", model: "Claude Sonnet 4", best: "Nuanced writing, analysis", price: "~$3/1M tokens" },
                        { name: "Google", model: "Gemini 2.0 Flash", best: "Speed, cost efficiency", price: "~$0.075/1M tokens" },
                      ].map((p) => (
                        <div key={p.name} className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3 space-y-1">
                          <p className="text-sm font-semibold text-zinc-200">{p.name}</p>
                          <p className="text-xs text-zinc-500">{p.model}</p>
                          <p className="text-xs text-zinc-400">{p.best}</p>
                          <p className="text-xs text-emerald-400">{p.price}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-zinc-100">Step 2: Get Your API Key</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <Cloud className="size-4 text-zinc-500" />
                      <span className="text-zinc-300 font-medium">OpenAI:</span>
                      <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 flex items-center gap-1">
                        platform.openai.com/api-keys <ExternalLink className="size-3" />
                      </a>
                      <span className="text-zinc-600">→ starts with sk-...</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Cloud className="size-4 text-zinc-500" />
                      <span className="text-zinc-300 font-medium">Anthropic:</span>
                      <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 flex items-center gap-1">
                        console.anthropic.com <ExternalLink className="size-3" />
                      </a>
                      <span className="text-zinc-600">→ starts with sk-ant-...</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Cloud className="size-4 text-zinc-500" />
                      <span className="text-zinc-300 font-medium">Google:</span>
                      <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 flex items-center gap-1">
                        aistudio.google.com <ExternalLink className="size-3" />
                      </a>
                      <span className="text-zinc-600">→ starts with AIza...</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-zinc-100">Step 3 & 4: Enter in Settings & Test</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-zinc-400">
                    <div className="flex items-start gap-2">
                      <ArrowRight className="size-4 shrink-0 mt-0.5 text-emerald-400" />
                      <span>Go to <strong className="text-zinc-200">Settings → AI Agent Configuration</strong>, select OpenClaw, choose provider, paste API key, click Save</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ArrowRight className="size-4 shrink-0 mt-0.5 text-emerald-400" />
                      <span>Go to <strong className="text-zinc-200">OpenClaw</strong>, type: <code className="text-emerald-400 bg-zinc-800 px-1.5 py-0.5 rounded text-xs">&quot;Post about AI trends on Instagram and Twitter&quot;</code></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ArrowRight className="size-4 shrink-0 mt-0.5 text-emerald-400" />
                      <span>The agent will: fetch AI news → generate content → publish to both platforms → log the result</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            <Separator className="bg-zinc-800" />

            <section id="hermes-setup" className="scroll-mt-20 space-y-6">
              <div className="flex items-center gap-3">
                <Server className="size-6 text-amber-400" />
                <h2 className="text-2xl font-bold text-zinc-100">Hermes Setup</h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 mb-6">
                {[
                  { name: "Ollama", difficulty: "Easy", gpu: "Optional", best: "Local dev, quick setup" },
                  { name: "vLLM", difficulty: "Medium", gpu: "Required", best: "Production, high throughput" },
                  { name: "LM Studio", difficulty: "Easy", gpu: "Optional", best: "Desktop, GUI preference" },
                ].map((m) => (
                  <div key={m.name} className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4 space-y-1">
                    <p className="text-sm font-semibold text-zinc-200">{m.name}</p>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-[10px]">{m.difficulty}</Badge>
                      <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-[10px]">GPU: {m.gpu}</Badge>
                    </div>
                    <p className="text-xs text-zinc-400">{m.best}</p>
                  </div>
                ))}
              </div>

              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-zinc-100 flex items-center gap-2">
                    <Terminal className="size-4 text-zinc-400" /> Option A: Ollama (Recommended for getting started)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <CodeBlock lang="bash">{`# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull the Hermes 3 model (~5GB download)
ollama pull hermes3

# Start the server (http://localhost:11434)
ollama serve`}</CodeBlock>
                  <p className="text-xs text-zinc-500">OpenAI-compatible endpoint: <code className="text-emerald-400">http://localhost:11434/v1</code></p>
                </CardContent>
              </Card>

              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-zinc-100 flex items-center gap-2">
                    <Terminal className="size-4 text-zinc-400" /> Option B: vLLM (Recommended for production)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <CodeBlock lang="bash">{`# Install vLLM
pip install vllm

# Start with Hermes 3 (8B model, 8GB+ VRAM)
python -m vllm.entrypoints.openai.api_server \\
  --model NousResearch/Hermes-3-Llama-3.1-8B \\
  --host 0.0.0.0 \\
  --port 11434 \\
  --max-model-len 4096`}</CodeBlock>
                  <p className="text-xs text-zinc-500">OpenAI-compatible endpoint: <code className="text-emerald-400">http://localhost:11434/v1</code></p>
                  <div className="mt-2 rounded-lg bg-zinc-800/50 p-3 space-y-1">
                    <p className="text-xs font-medium text-zinc-400">Larger models (better quality, more GPU):</p>
                    <p className="text-xs text-zinc-500 font-mono">70B: --model NousResearch/Hermes-3-Llama-3.1-70B (4x A100)</p>
                    <p className="text-xs text-zinc-500 font-mono">Quantized 8B: add --quantization awq (consumer GPUs)</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-zinc-100 flex items-center gap-2">
                    <Globe className="size-4 text-zinc-400" /> Option C: LM Studio (GUI)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-zinc-400">
                  <div className="flex items-start gap-2"><span className="text-emerald-400 font-bold">1.</span> Download LM Studio from <a href="https://lmstudio.ai" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">lmstudio.ai</a></div>
                  <div className="flex items-start gap-2"><span className="text-emerald-400 font-bold">2.</span> Search for &quot;Hermes 3&quot; in the model browser and download the 8B model</div>
                  <div className="flex items-start gap-2"><span className="text-emerald-400 font-bold">3.</span> Go to <strong className="text-zinc-200">Local Server</strong> tab → Click <strong className="text-zinc-200">Start Server</strong></div>
                  <div className="flex items-start gap-2"><span className="text-emerald-400 font-bold">4.</span> Ensure &quot;OpenAI-compatible API&quot; is enabled</div>
                  <p className="text-xs text-zinc-500 mt-2">Endpoint: <code className="text-emerald-400">http://localhost:1234/v1</code></p>
                </CardContent>
              </Card>

              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-zinc-100 flex items-center gap-2">
                    <Settings className="size-4 text-zinc-400" /> Configure in ContentDash
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-zinc-400">
                  <div className="flex items-start gap-2"><ArrowRight className="size-4 shrink-0 mt-0.5 text-emerald-400" /> Go to <strong className="text-zinc-200">Settings → AI Agent Configuration</strong></div>
                  <div className="flex items-start gap-2"><ArrowRight className="size-4 shrink-0 mt-0.5 text-emerald-400" /> Select <strong className="text-zinc-200">Hermes (Self-Hosted LLM)</strong> as the framework</div>
                  <div className="flex items-start gap-2"><ArrowRight className="size-4 shrink-0 mt-0.5 text-emerald-400" /> Enter your endpoint URL (see table below)</div>
                  <div className="flex items-start gap-2"><ArrowRight className="size-4 shrink-0 mt-0.5 text-emerald-400" /> Add optional API key if your endpoint requires auth</div>
                  <div className="flex items-start gap-2"><ArrowRight className="size-4 shrink-0 mt-0.5 text-emerald-400" /> Click <strong className="text-zinc-200">Save Agent Config</strong></div>
                </CardContent>
              </Card>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-700">
                      <th className="py-2 px-3 text-left text-zinc-500 font-medium">Server</th>
                      <th className="py-2 px-3 text-left text-zinc-500 font-medium">Default Endpoint URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Ollama", "http://localhost:11434/v1"],
                      ["vLLM", "http://localhost:11434/v1"],
                      ["LM Studio", "http://localhost:1234/v1"],
                      ["Remote server", "https://your-server.com/v1"],
                    ].map(([server, url], i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-zinc-900/50" : ""}>
                        <td className="py-2 px-3 text-zinc-300">{server}</td>
                        <td className="py-2 px-3 font-mono text-xs text-emerald-400">{url}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-zinc-200">Troubleshooting Hermes</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { issue: "Endpoint URL not configured", fix: "Enter the URL in Settings → AI Agent Configuration" },
                    { issue: "Error: 404", fix: "Ensure server is running and URL ends with /v1" },
                    { issue: "Connection refused", fix: "Start the server: ollama serve or vllm" },
                    { issue: "Error: 401", fix: "Your endpoint needs auth — add the API key" },
                    { issue: "Tools not working", fix: "Use a Hermes function-calling model (Hermes 2 Pro / 3)" },
                    { issue: "Slow responses", fix: "Use GPU, or try a smaller model (8B vs 70B)" },
                    { issue: "Out of memory", fix: "Use quantized model (AWQ/GGUF), reduce max-model-len" },
                    { issue: "Remote not accessible", fix: "Check firewall, open port, verify HTTPS" },
                  ].map((t, i) => (
                    <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                      <p className="text-xs text-red-400 font-medium">{t.issue}</p>
                      <p className="text-xs text-zinc-400 mt-1">{t.fix}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <Separator className="bg-zinc-800" />

            <section id="tool-reference" className="scroll-mt-20 space-y-6">
              <div className="flex items-center gap-3">
                <Wrench className="size-6 text-blue-400" />
                <h2 className="text-2xl font-bold text-zinc-100">Tool Reference</h2>
              </div>
              <p className="text-zinc-400">Both frameworks share the same 6 tools. The agent decides which to call based on your natural language command.</p>

              <div className="grid gap-4">
                <ToolCard
                  name="fetch_news"
                  description="Fetch recent news articles from RSS feeds (TechCrunch, HBR, Social Media Examiner)"
                  params={[
                    { name: "topic", type: "string", required: true, desc: "Keyword to filter by (e.g. 'AI'). Empty string for all." },
                    { name: "limit", type: "number", required: false, desc: "Max articles to return. Default: 5" },
                  ]}
                  examples={[
                    "Fetch the latest AI news",
                    "Get 10 articles about social media marketing",
                    "What's trending in tech?",
                  ]}
                />

                <ToolCard
                  name="post_to_omnisocial"
                  description="Create and publish a social media post via OmniSocial across 10 platforms"
                  params={[
                    { name: "text", type: "string", required: true, desc: "Post content. Use ---SLIDE--- for Instagram carousels." },
                    { name: "platforms", type: "string[]", required: true, desc: "Array of platform names (instagram, facebook, linkedin, etc.)" },
                    { name: "media_urls", type: "string[]", required: false, desc: "Array of image URLs to attach." },
                    { name: "scheduled_at", type: "string", required: false, desc: "ISO 8601 datetime to schedule the post." },
                  ]}
                  examples={[
                    "Post about our new launch on Instagram and Twitter",
                    "Schedule a post for tomorrow 9am on LinkedIn",
                    "Create an Instagram carousel with 5 marketing tips",
                  ]}
                />

                <ToolCard
                  name="create_whatsapp_campaign"
                  description="Create a WhatsApp billboard campaign with a status update and media"
                  params={[
                    { name: "campaignName", type: "string", required: true, desc: "Name of the campaign." },
                    { name: "caption", type: "string", required: true, desc: "Text content for the WhatsApp status." },
                    { name: "mediaUrl", type: "string", required: false, desc: "Image URL or gradient spec." },
                    { name: "scheduledAt", type: "string", required: false, desc: "When to publish the campaign." },
                  ]}
                  examples={[
                    "Create a WhatsApp campaign called Summer Sale",
                    "Post a WhatsApp billboard about our new NFC cards",
                  ]}
                />

                <ToolCard
                  name="add_competitor"
                  description="Add a competitor brand to the watch list for tracking"
                  params={[
                    { name: "brandName", type: "string", required: true, desc: "Competitor brand name." },
                    { name: "handleInstagram", type: "string", required: false, desc: "Instagram handle (without @)." },
                    { name: "handleYoutube", type: "string", required: false, desc: "YouTube channel name." },
                    { name: "handleTiktok", type: "string", required: false, desc: "TikTok handle (without @)." },
                    { name: "handleX", type: "string", required: false, desc: "X/Twitter handle (without @)." },
                    { name: "handleLinkedin", type: "string", required: false, desc: "LinkedIn company page slug." },
                  ]}
                  examples={[
                    "Add Nike to my competitor watch list",
                    "Track Adidas on Instagram, TikTok, and X",
                  ]}
                />

                <ToolCard
                  name="get_analytics"
                  description="Get social media analytics summary from OmniSocial"
                  params={[
                    { name: "platform", type: "string", required: false, desc: "Specific platform or 'all'. Default: all." },
                    { name: "days", type: "number", required: false, desc: "Days to look back. Default: 30." },
                  ]}
                  examples={[
                    "Show my Instagram analytics for the last week",
                    "Get analytics across all platforms for 30 days",
                  ]}
                />

                <ToolCard
                  name="manage_nfc_card"
                  description="Create an NFC card configuration that redirects when tapped"
                  params={[
                    { name: "cardName", type: "string", required: true, desc: "Name for the NFC card." },
                    { name: "redirectType", type: "string", required: true, desc: "One of: INSTAGRAM, LINK_IN_BIO, CUSTOM_URL, WHATSAPP_CHAT" },
                    { name: "destinationUrl", type: "string", required: true, desc: "URL the card redirects to." },
                    { name: "isActive", type: "boolean", required: false, desc: "Whether the card is active. Default: true." },
                  ]}
                  examples={[
                    "Create an NFC card called Business Card redirecting to my Instagram",
                    "Make an NFC card for my WhatsApp chat",
                  ]}
                />
              </div>
            </section>

            <Separator className="bg-zinc-800" />

            <section id="whatsapp-integration" className="scroll-mt-20 space-y-6">
              <div className="flex items-center gap-3">
                <MessageCircle className="size-6 text-indigo-400" />
                <h2 className="text-2xl font-bold text-zinc-100">WhatsApp Integration</h2>
              </div>

              <div className="space-y-4">
                <Card className="border-zinc-800 bg-zinc-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-zinc-100">Prerequisites</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-zinc-400">
                      <li className="flex items-start gap-2"><CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-500" /> A <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">Twilio</a> account with WhatsApp Business API access</li>
                      <li className="flex items-start gap-2"><CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-500" /> A Twilio phone number with WhatsApp enabled</li>
                      <li className="flex items-start gap-2"><CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-500" /> Your ContentDash app deployed and publicly accessible</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-zinc-100">Setup Steps</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-zinc-400">
                    <div className="flex items-start gap-2"><span className="text-emerald-400 font-bold">1.</span> Get Twilio credentials from <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-purple-400">console.twilio.com</a> (Account SID, Auth Token, WhatsApp number)</div>
                    <div className="flex items-start gap-2"><span className="text-emerald-400 font-bold">2.</span> Enter them in <strong className="text-zinc-200">Settings → Twilio WhatsApp Integration</strong></div>
                    <div className="flex items-start gap-2"><span className="text-emerald-400 font-bold">3.</span> In Twilio Console, set webhook URL to:</div>
                    <CodeBlock lang="url">{`https://your-app.vercel.app/api/agent/whatsapp`}</CodeBlock>
                    <div className="flex items-start gap-2"><span className="text-emerald-400 font-bold">4.</span> Set HTTP method to <strong className="text-zinc-200">POST</strong> and save</div>
                    <div className="flex items-start gap-2"><span className="text-emerald-400 font-bold">5.</span> Send a WhatsApp message to your Twilio number to test</div>
                  </CardContent>
                </Card>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">How It Works</p>
                <div className="flex items-center gap-2 flex-wrap text-sm text-zinc-400">
                  <span className="bg-zinc-800 px-2 py-1 rounded">WhatsApp</span>
                  <ArrowRight className="size-3 text-zinc-600" />
                  <span className="bg-zinc-800 px-2 py-1 rounded">Twilio</span>
                  <ArrowRight className="size-3 text-zinc-600" />
                  <span className="bg-zinc-800 px-2 py-1 rounded text-emerald-400">Validate HMAC</span>
                  <ArrowRight className="size-3 text-zinc-600" />
                  <span className="bg-zinc-800 px-2 py-1 rounded text-purple-400">Match User</span>
                  <ArrowRight className="size-3 text-zinc-600" />
                  <span className="bg-zinc-800 px-2 py-1 rounded text-amber-400">Agent (OpenClaw/Hermes)</span>
                  <ArrowRight className="size-3 text-zinc-600" />
                  <span className="bg-zinc-800 px-2 py-1 rounded">Reply via TwiML</span>
                </div>
              </div>
            </section>

            <Separator className="bg-zinc-800" />

            <section id="nfc-cards" className="scroll-mt-20 space-y-6">
              <div className="flex items-center gap-3">
                <CreditCard className="size-6 text-cyan-400" />
                <h2 className="text-2xl font-bold text-zinc-100">NFC Cards</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-700">
                      <th className="py-2 px-3 text-left text-zinc-500 font-medium">Redirect Type</th>
                      <th className="py-2 px-3 text-left text-zinc-500 font-medium">Description</th>
                      <th className="py-2 px-3 text-left text-zinc-500 font-medium">Example Destination</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["INSTAGRAM", "Redirects to an Instagram profile", "https://instagram.com/yourbrand"],
                      ["LINK_IN_BIO", "A general link-in-bio page", "https://linktr.ee/yourbrand"],
                      ["CUSTOM_URL", "Any custom URL", "https://yourwebsite.com/promo"],
                      ["WHATSAPP_CHAT", "Opens a WhatsApp chat", "https://wa.me/1234567890"],
                    ].map(([type, desc, url], i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-zinc-900/50" : ""}>
                        <td className="py-2 px-3 font-mono text-xs text-cyan-400">{type}</td>
                        <td className="py-2 px-3 text-zinc-400">{desc}</td>
                        <td className="py-2 px-3 font-mono text-xs text-zinc-500">{url}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-2">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">How NFC Taps Work</p>
                <div className="flex items-center gap-2 flex-wrap text-sm text-zinc-400">
                  <span className="bg-zinc-800 px-2 py-1 rounded">Phone taps card</span>
                  <ArrowRight className="size-3 text-zinc-600" />
                  <span className="bg-zinc-800 px-2 py-1 rounded">Reads NFC tag URL</span>
                  <ArrowRight className="size-3 text-zinc-600" />
                  <span className="bg-zinc-800 px-2 py-1 rounded text-cyan-400">ContentDash looks up card</span>
                  <ArrowRight className="size-3 text-zinc-600" />
                  <span className="bg-zinc-800 px-2 py-1 rounded">Logs tap event</span>
                  <ArrowRight className="size-3 text-zinc-600" />
                  <span className="bg-zinc-800 px-2 py-1 rounded text-emerald-400">Redirects to destination</span>
                </div>
              </div>
            </section>

            <Separator className="bg-zinc-800" />

            <section id="security" className="scroll-mt-20 space-y-6">
              <div className="flex items-center gap-3">
                <Shield className="size-6 text-emerald-400" />
                <h2 className="text-2xl font-bold text-zinc-100">Security</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="border-zinc-800 bg-zinc-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-zinc-100 flex items-center gap-2">
                      <Lock className="size-4 text-emerald-400" /> Encryption at Rest
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-zinc-400 space-y-2">
                    <p>All sensitive keys are encrypted using AES-256-GCM before storage:</p>
                    <ul className="space-y-1 text-xs">
                      <li className="text-zinc-500">• LLM API keys (OpenAI/Anthropic/Gemini)</li>
                      <li className="text-zinc-500">• Hermes endpoint API keys</li>
                      <li className="text-zinc-500">• Twilio auth tokens</li>
                      <li className="text-zinc-500">• OmniSocial API keys</li>
                    </ul>
                    <p className="text-xs text-zinc-500">Encryption failures throw — no fallback to plaintext.</p>
                  </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-zinc-100 flex items-center gap-2">
                      <DollarSign className="size-4 text-emerald-400" /> Rate Limiting
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-zinc-400">
                    <p className="mb-2">In-memory sliding window rate limiter:</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span className="text-zinc-500">/api/agent/execute</span><span className="text-zinc-300">10 req/min</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">/api/payments</span><span className="text-zinc-300">5 req/min</span></div>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">Returns 429 with X-RateLimit-* headers.</p>
                  </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-zinc-100 flex items-center gap-2">
                      <Wifi className="size-4 text-emerald-400" /> Webhook Validation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-zinc-400 space-y-1 text-xs">
                    <p>Twilio: HMAC-SHA1 with constant-time comparison</p>
                    <p>Flutterwave: SHA256 hash with constant-time comparison</p>
                    <p className="text-zinc-500 mt-1">Both use timingSafeEqual to prevent timing attacks.</p>
                  </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-zinc-100 flex items-center gap-2">
                      <Shield className="size-4 text-emerald-400" /> Multi-Tenancy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-zinc-400 space-y-1 text-xs">
                    <p>All queries use userId from authenticated session</p>
                    <p>WhatsApp matches number to AgentConfig</p>
                    <p>Tool executions write userId to all rows</p>
                    <p>RLS policies enforce user isolation on all tables</p>
                  </CardContent>
                </Card>
              </div>
            </section>

            <Separator className="bg-zinc-800" />

            <section id="api-reference" className="scroll-mt-20 space-y-6">
              <div className="flex items-center gap-3">
                <Code2 className="size-6 text-blue-400" />
                <h2 className="text-2xl font-bold text-zinc-100">API Reference</h2>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-200 mb-3">Agent Routes</h3>
                  <ApiRouteTable routes={[
                    { method: "POST", path: "/api/agent/execute", purpose: "Run agent with natural language command", auth: "Required", rateLimit: "10/min" },
                    { method: "POST", path: "/api/agent/whatsapp", purpose: "WhatsApp webhook (Twilio)", auth: "Twilio HMAC" },
                    { method: "GET", path: "/api/agent/config", purpose: "Get agent configuration", auth: "Required" },
                    { method: "PUT", path: "/api/agent/config", purpose: "Update agent configuration", auth: "Required" },
                    { method: "DELETE", path: "/api/agent/config", purpose: "Deactivate agent", auth: "Required" },
                    { method: "GET", path: "/api/agent/logs", purpose: "Get execution history", auth: "Required" },
                  ]} />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-zinc-200 mb-3">OmniSocial Routes</h3>
                  <ApiRouteTable routes={[
                    { method: "GET", path: "/api/omnisocial/config", purpose: "Get connection status", auth: "Required" },
                    { method: "PUT", path: "/api/omnisocial/config", purpose: "Save API key / MCP URL", auth: "Required" },
                    { method: "DELETE", path: "/api/omnisocial/config", purpose: "Disconnect", auth: "Required" },
                    { method: "GET", path: "/api/omnisocial/accounts", purpose: "List connected accounts", auth: "Required" },
                    { method: "GET", path: "/api/omnisocial/posts", purpose: "List scheduled posts", auth: "Required" },
                    { method: "POST", path: "/api/omnisocial/upload", purpose: "Upload media", auth: "Required" },
                    { method: "DELETE", path: "/api/omnisocial/posts/[id]", purpose: "Delete a post", auth: "Required" },
                  ]} />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-zinc-200 mb-3">NFC Routes</h3>
                  <ApiRouteTable routes={[
                    { method: "GET", path: "/api/nfc/cards", purpose: "List user's NFC cards", auth: "Required" },
                    { method: "POST", path: "/api/nfc/cards", purpose: "Create NFC card", auth: "Required" },
                    { method: "PATCH", path: "/api/nfc/cards/[id]", purpose: "Update NFC card (strict)", auth: "Required" },
                    { method: "DELETE", path: "/api/nfc/cards/[id]", purpose: "Delete NFC card", auth: "Required" },
                    { method: "GET", path: "/t/[cardSlug]", purpose: "Redirect on NFC tap", auth: "Public" },
                  ]} />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-zinc-200 mb-3">Other Routes</h3>
                  <ApiRouteTable routes={[
                    { method: "GET", path: "/api/competitors", purpose: "List competitors", auth: "Required" },
                    { method: "POST", path: "/api/competitors", purpose: "Add competitor", auth: "Required" },
                    { method: "PATCH", path: "/api/competitors/[id]", purpose: "Update competitor", auth: "Required" },
                    { method: "DELETE", path: "/api/competitors/[id]", purpose: "Remove competitor", auth: "Required" },
                    { method: "POST", path: "/api/payments", purpose: "Initiate Flutterwave charge", auth: "Required", rateLimit: "5/min" },
                    { method: "POST", path: "/api/payments/webhook", purpose: "Flutterwave webhook", auth: "Hash validation" },
                    { method: "GET", path: "/api/news", purpose: "RSS news feed", auth: "Required" },
                    { method: "GET", path: "/api/analytics", purpose: "OmniSocial analytics", auth: "Required" },
                    { method: "POST", path: "/api/whatsapp/campaigns", purpose: "Create WhatsApp campaign", auth: "Required" },
                    { method: "DELETE", path: "/api/whatsapp/campaigns/[id]", purpose: "Delete WhatsApp campaign", auth: "Required" },
                  ]} />
                </div>
              </div>
            </section>

            <Separator className="bg-zinc-800" />

            <section id="faq" className="scroll-mt-20 space-y-2">
              <div className="flex items-center gap-3 mb-4">
                <HelpCircle className="size-6 text-purple-400" />
                <h2 className="text-2xl font-bold text-zinc-100">FAQ</h2>
              </div>

              <FaqItem
                q='I get "AI agent not configured" — what do I do?'
                a="Go to Settings → AI Agent Configuration, select a framework (OpenClaw or Hermes), provide the required credentials (API key for OpenClaw, endpoint URL for Hermes), and click Save."
              />
              <Separator className="bg-zinc-800" />
              <FaqItem
                q='I get "Failed to decrypt LLM API key"'
                a="The ENCRYPTION_SALT env var may have changed. If you had keys encrypted with the old salt, set ENCRYPTION_SALT=contentdash-salt-v1 temporarily, re-save your API key through Settings, then switch to the new salt."
              />
              <Separator className="bg-zinc-800" />
              <FaqItem
                q="Hermes is selected but I get 'Hermes endpoint URL not configured'"
                a="You selected Hermes but didn't provide an endpoint URL. Go to Settings and enter your model server URL (e.g., http://localhost:11434/v1)."
              />
              <Separator className="bg-zinc-800" />
              <FaqItem
                q="Hermes responds but doesn't call tools"
                a="Make sure you're using a Hermes function-calling model (Hermes 2 Pro or Hermes 3). Regular Llama models don't support the tool_call format."
              />
              <Separator className="bg-zinc-800" />
              <FaqItem
                q="How do I switch from Hermes back to OpenClaw?"
                a='Go to Settings → AI Agent Configuration → change the framework dropdown to "OpenClaw" → enter your LLM API key → Save.'
              />
              <Separator className="bg-zinc-800" />
              <FaqItem
                q="WhatsApp messages aren't getting responses"
                a="Check that (1) your Twilio webhook URL is set correctly, (2) your agent is configured and active in Settings, (3) your Twilio auth token matches what's saved in ContentDash."
              />
              <Separator className="bg-zinc-800" />
              <FaqItem
                q='I get "Rate limit exceeded" (429 error)'
                a="You've made more than 10 agent requests in a minute. Wait 60 seconds and try again. The response headers include X-RateLimit-Reset with the reset timestamp."
              />
              <Separator className="bg-zinc-800" />
              <FaqItem
                q="Can I see my stored API keys?"
                a="No — keys are encrypted at rest and only displayed as masked (****1234) in the API. The full key is never returned to the client."
              />
              <Separator className="bg-zinc-800" />
              <FaqItem
                q="The agent says it can't do something I expected"
                a="The agent is limited to its 6 tools (fetch_news, post_to_omnisocial, create_whatsapp_campaign, add_competitor, get_analytics, manage_nfc_card). If you ask for something outside those capabilities, it will explain what it can do instead."
              />
            </section>

            <div className="py-8 text-center text-xs text-zinc-600">
              ContentDash v2.1.0 Documentation — Last updated June 2026
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
