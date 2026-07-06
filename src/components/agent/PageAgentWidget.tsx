"use client";

import { useEffect } from "react";

// Mounts Alibaba's page-agent (https://github.com/alibaba/page-agent): a
// floating in-page GUI agent that operates the dashboard from natural
// language. The baseURL points at our server-side proxy, which holds the
// real LLM key and pins the model — the apiKey below is a placeholder the
// proxy ignores. The model string is likewise overridden server-side; it
// only exists because page-agent requires one in its config.
export function PageAgentWidget() {
  useEffect(() => {
    let cancelled = false;

    async function mount() {
      if (window.pageAgent) return;

      try {
        const res = await fetch("/api/agent/config");
        if (!res.ok) return;
        const config = await res.json();
        if (!config.isActive || !config.llmApiKeyMasked) return;

        const { PageAgent } = await import("page-agent");
        if (cancelled || window.pageAgent) return;

        window.pageAgent = new PageAgent({
          baseURL: `${window.location.origin}/api/agent/llm-proxy`,
          model: "feetbit-dash-agent",
          apiKey: "proxied-server-side",
          language: "en-US",
          instructions: {
            system:
              "You are operating the ContentDash dashboard for FeetBit Sneakers. " +
              "It manages social posts (Social Manager), a content approval library " +
              "(Content Library), a calendar, analytics, competitors, and settings. " +
              "Never navigate to external sites.",
          },
        });
      } catch {
        // page-agent is an enhancement — never break the dashboard over it.
      }
    }

    mount();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
