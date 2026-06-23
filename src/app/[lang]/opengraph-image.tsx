import { ImageResponse } from "next/og";
import { getDictionary, hasLocale } from "@/lib/i18n";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const isFa = hasLocale(lang) && lang === "fa";
  const dict = hasLocale(lang) ? await getDictionary(lang) : null;

  const tagline = isFa ? "تبدیل پیچیدگی به وضوح" : "Turning complexity into clarity";
  const role = isFa
    ? "معمار سیستم‌های هوش مصنوعی و اتوماسیون"
    : "AI Systems & Automation Architect";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0c0c0d",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "72px 80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Blueprint grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(to right, #26262a 1px, transparent 1px), linear-gradient(to bottom, #26262a 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            opacity: 0.6,
          }}
        />
        {/* Radial fade */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 100% 80% at 50% 120%, transparent 30%, #0c0c0d 80%)",
          }}
        />
        {/* Gradient accent top-right */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -200,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Content */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 0 }}>
          {/* AN Monogram badge */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "linear-gradient(135deg, #2563EB, #8B5CF6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 36,
              fontSize: 28,
              fontWeight: 800,
              color: "white",
              fontFamily: "sans-serif",
              letterSpacing: "-1px",
            }}
          >
            AN
          </div>

          {/* Name */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: "#f2f2f3",
              fontFamily: "sans-serif",
              lineHeight: 1.1,
              marginBottom: 16,
              letterSpacing: "-2px",
            }}
          >
            Amirehsan Noori
          </div>

          {/* Role */}
          <div
            style={{
              fontSize: 26,
              color: "#9aa0a6",
              fontFamily: "sans-serif",
              marginBottom: 32,
            }}
          >
            {role}
          </div>

          {/* Tagline with gradient line accent */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 40,
                height: 3,
                borderRadius: 2,
                background: "linear-gradient(135deg, #2563EB, #8B5CF6)",
              }}
            />
            <div
              style={{
                fontSize: 22,
                background: "linear-gradient(135deg, #2563EB, #8B5CF6)",
                backgroundClip: "text",
                color: "transparent",
                fontFamily: "sans-serif",
                fontWeight: 600,
              }}
            >
              {tagline}
            </div>
          </div>
        </div>

        {/* URL bottom right */}
        <div
          style={{
            position: "absolute",
            bottom: 48,
            right: 80,
            fontSize: 18,
            color: "#4a4a52",
            fontFamily: "sans-serif",
          }}
        >
          aen-website.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
