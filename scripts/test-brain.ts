/**
 * Standalone brain smoke test — verifies the RAG pipeline end to end without
 * any channel. Ingests a small Persian document, embeds + stores it, then runs
 * a query through retrieval and prints the top matches.
 *
 * Run:  npx tsx scripts/test-brain.ts
 * Needs env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, COHERE_API_KEY
 * and the 0002_chatbot.sql migration applied.
 */
import { config } from "dotenv";
import { createRequire } from "node:module";
config({ path: ".env.local" });

// "server-only" throws when imported outside Next's build (it relies on Next's
// bundler to alias it to a no-op). Standalone via tsx, so shim it before any
// brain module (which all `import "server-only"`) gets required.
const req = createRequire(import.meta.url);
const serverOnlyPath = req.resolve("server-only");
req.cache[serverOnlyPath] = {
  id: serverOnlyPath,
  filename: serverOnlyPath,
  loaded: true,
  exports: {},
} as NodeJS.Module;

async function main() {
  // Imported after env is loaded so the clients pick up the keys.
  const { createAdminClient } = await import("../src/lib/supabase/admin");
  const { processDocument } = await import("../src/lib/brain/kb");
  const { retrieve } = await import("../src/lib/brain/retrieve");

  const supabase = createAdminClient();

  const sample = `امیراحسان نوری معمار سیستم‌های هوش مصنوعی و اتوماسیون است.
او در دو سطح مشاوره ارائه می‌دهد: جلسهٔ آشنایی رایگان ۳۰ دقیقه‌ای و جلسهٔ استراتژی ۶۰ دقیقه‌ای.
پرداخت پیش از نهایی‌شدن نوبت انجام می‌شود. تمرکز او روی طراحی سیستم‌هایی است که واقعاً کار می‌کنند.`;

  console.log("→ ثبت سند نمونه…");
  const { data: doc, error } = await supabase
    .from("documents")
    .insert({
      title: "تست مغز — خدمات",
      source_type: "text",
      raw_text: sample,
      tags: ["test"],
      status: "pending",
    })
    .select("id")
    .single();
  if (error) throw error;

  console.log("→ پردازش (chunk + embed)…");
  await processDocument(doc.id);

  const { data: chunks } = await supabase
    .from("chunks")
    .select("id")
    .eq("document_id", doc.id);
  console.log(`  ✓ ${chunks?.length ?? 0} chunk ساخته شد.`);

  const query = "قیمت و مدت جلسهٔ مشاوره چطور است؟";
  console.log(`→ بازیابی برای پرسش: «${query}»`);
  const results = await retrieve(query);
  for (const r of results) {
    console.log(`  [${(r.similarity * 100).toFixed(0)}%] ${r.content.slice(0, 80)}…`);
  }

  console.log("→ پاک‌سازی سند تست…");
  await supabase.from("documents").delete().eq("id", doc.id);
  console.log("✓ تمام شد.");
}

main().catch((e) => {
  console.error("✗ خطا:", e);
  process.exit(1);
});
