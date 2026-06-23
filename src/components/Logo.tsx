import Link from "next/link";

/**
 * AN monogram — A and N fused into one geometric mark.
 *
 * Brand concept: "from chaos to systems."
 * Left side (A):  left leg is intentionally short / broken — open, chaotic.
 * Right side (N): two full verticals + diagonal — structured, complete.
 * Shared stroke:  A's implied right leg IS N's central diagonal.
 */
export function LogoMark({ size = 36 }: { size?: number }) {
  const w = Math.round(size * 0.64);
  const h = Math.round(size * 0.72);
  return (
    <span
      className="brand-gradient inline-flex shrink-0 items-center justify-center rounded-[8px]"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/*
        viewBox 26x30  (portrait, mirrors brand guide proportions)

        Peak (A apex / N top-left)     : (13, 3)
        A left-leg base                : (2, 28)
        A left-leg SHORT end           : (6, 15)  -- stops at ~55% height (broken)
        A crossbar (y=19)              : x~5 (on left leg) to x~20 (on shared diagonal)
        Shared diagonal (A right / N central): (13,3) -> (25,28)
        N left vertical                : (13,3)  -> (13,28)
        N right vertical               : (25,3)  -> (25,28)
      */}
      <svg
        width={w}
        height={h}
        viewBox="0 0 26 30"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* A left leg (short/broken -- chaos side) */}
        <line x1="2" y1="28" x2="6" y2="15" stroke="white" strokeWidth="1.7" strokeLinecap="round" />
        {/* A crossbar connecting the broken left leg to the shared diagonal */}
        <line x1="5" y1="19" x2="20" y2="19" stroke="white" strokeWidth="1.7" strokeLinecap="round" />

        {/* Shared diagonal: A right-leg implied + N central diagonal */}
        <line x1="13" y1="3" x2="25" y2="28" stroke="white" strokeWidth="1.7" strokeLinecap="round" />

        {/* N left vertical (full height -- systems side) */}
        <line x1="13" y1="3" x2="13" y2="28" stroke="white" strokeWidth="1.7" strokeLinecap="round" />
        {/* N right vertical (complete) */}
        <line x1="25" y1="3" x2="25" y2="28" stroke="white" strokeWidth="1.7" strokeLinecap="round" />

        {/* Blueprint crosshair -- very subtle, architect/precision aesthetic */}
        <line x1="0" y1="15" x2="26" y2="15" stroke="white" strokeWidth="0.3" strokeOpacity="0.2" />
        <line x1="13" y1="0" x2="13" y2="30" stroke="white" strokeWidth="0.3" strokeOpacity="0.2" />
      </svg>
    </span>
  );
}

export function Logo({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2.5"
      aria-label="Amirehsan Noori -- Home"
    >
      <LogoMark size={36} />
      <span className="hidden font-heading text-xs font-semibold uppercase tracking-widest text-foreground sm:inline">
        Amirehsan Noori
      </span>
    </Link>
  );
}
