import "server-only";

// =============================================================================
// Cost estimation. OpenRouter publishes per-model $/token pricing on its public
// models endpoint — fetched (and cached briefly) rather than hardcoded, since
// per-token prices change and we'd otherwise silently show a stale number on
// a real cost dashboard.
// =============================================================================

interface ModelPrice {
  promptUsdPerToken: number;
  completionUsdPerToken: number;
}

let cache: { at: number; prices: Map<string, ModelPrice> } | null = null;
const CACHE_MS = 60 * 60 * 1000; // 1 hour

async function loadPrices(): Promise<Map<string, ModelPrice>> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.prices;

  const prices = new Map<string, ModelPrice>();
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      for (const m of data.data ?? []) {
        prices.set(m.id, {
          promptUsdPerToken: Number(m.pricing?.prompt ?? 0),
          completionUsdPerToken: Number(m.pricing?.completion ?? 0),
        });
      }
    }
  } catch {
    // best-effort — dashboard just shows 0 cost if unreachable
  }

  cache = { at: Date.now(), prices };
  return prices;
}

export async function estimateCostUsd(
  usageByModel: Record<string, { tokensIn: number; tokensOut: number }>
): Promise<{ totalUsd: number; byModel: Record<string, number> }> {
  const prices = await loadPrices();
  const byModel: Record<string, number> = {};
  let totalUsd = 0;

  for (const [model, usage] of Object.entries(usageByModel)) {
    const p = prices.get(model);
    const cost = p
      ? usage.tokensIn * p.promptUsdPerToken + usage.tokensOut * p.completionUsdPerToken
      : 0;
    byModel[model] = cost;
    totalUsd += cost;
  }

  return { totalUsd, byModel };
}
