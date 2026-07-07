import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "../globals.css";

// The widget is its own root layout: chrome-free, no site header/footer, meant
// to be loaded inside an <iframe> injected by /api/widget/loader.js.

const vazir = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazir",
  display: "swap",
});

export const metadata: Metadata = {
  title: "دستیار هوش مصنوعی",
  robots: { index: false, follow: false },
};

export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={vazir.variable}>
      <body
        className="h-dvh overflow-hidden bg-background text-foreground"
        style={{ fontFamily: "var(--font-vazir), system-ui, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
