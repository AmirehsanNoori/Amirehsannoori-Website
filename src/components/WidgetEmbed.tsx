"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

// Mounts the same embeddable widget script third-party sites use
// (/api/widget/loader.js) on the AEN site itself. Skipped on /consultant,
// which already is the full chat experience — a floating bubble there would
// just duplicate it with a separate conversation thread.
export function WidgetEmbed() {
  const pathname = usePathname();
  if (pathname.endsWith("/consultant")) return null;

  return <Script src="/api/widget/loader.js" strategy="afterInteractive" />;
}
