import Link from "next/link";

/**
 * AN monogram — geometric strokes on a gradient tile.
 * Blueprint concept: precise, architect-grade letterforms.
 * Use `size` to scale proportionally (default matches header h-9 / 36px container).
 */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <span
      className="brand-gradient inline-flex shrink-0 items-center justify-center rounded-[8px]"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Viewport 30×30: A occupies left half, N occupies right half */}
      <svg
        width={Math.round(size * 0.67)}
        height={Math.round(size * 0.67)}
        viewBox="0 0 30 30"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ── A ─────────────────────────────────────────── */}
        {/* Left diagonal: (1,28) → peak (7,2) */}
        {/* Right diagonal: peak (7,2) → (13,28) */}
        <path
          d="M1 28L7 2L13 28"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Crossbar at y=17.5 — interpolated between diagonals */}
        <line
          x1="3.6"
          y1="17.5"
          x2="10.4"
          y2="17.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* ── N ─────────────────────────────────────────── */}
        {/* Left vertical */}
        <line
          x1="16"
          y1="2"
          x2="16"
          y2="28"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Diagonal stroke */}
        <line
          x1="16"
          y1="2"
          x2="28"
          y2="28"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Right vertical */}
        <line
          x1="28"
          y1="2"
          x2="28"
          y2="28"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Blueprint detail: thin crosshair (suggests precision/architecture) */}
        <line
          x1="0"
          y1="15"
          x2="30"
          y2="15"
          stroke="white"
          strokeWidth="0.35"
          strokeOpacity="0.25"
        />
        <line
          x1="15"
          y1="0"
          x2="15"
          y2="30"
          stroke="white"
          strokeWidth="0.35"
          strokeOpacity="0.25"
        />
      </svg>
    </span>
  );
}

export function Logo({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2.5"
      aria-label="Amirehsan Noori — Home"
    >
      <LogoMark size={36} />
      <span className="hidden font-heading text-sm font-semibold tracking-tight text-foreground sm:inline">
        Amirehsan Noori
      </span>
    </Link>
  );
}
