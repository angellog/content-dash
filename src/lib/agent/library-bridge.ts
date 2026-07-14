// Direct server-to-server calls into feetbit-content-library's bridge, for use
// by agent tool executors (which run outside any browser request/session, so
// they can't reuse src/lib/api/library-proxy.ts's cookie-based auth check —
// they authenticate the same way that proxy does downstream: a shared secret).
export async function libraryBridgeFetch(
  path: string,
  options?: { method?: string; body?: unknown }
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const baseUrl = process.env.FEETBIT_LIBRARY_URL;
  const secret = process.env.FEETBIT_LIBRARY_BRIDGE_SECRET;

  if (!baseUrl || !secret) {
    return { ok: false, status: 503, data: { error: "Content library bridge is not configured" } };
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method: options?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${secret}`,
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
    },
    ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}
