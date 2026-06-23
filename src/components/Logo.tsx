import Link from "next/link";

/**
 * AN monogram — exact brand guide logo.
 *
 * 4 strokes — directly from the brand guide (page 12):
 *   Left (chaos):   two short diagonal strokes going up-right (broken, open)
 *   Right (systems): one long diagonal going down-right + one vertical (complete N)
 *
 * "from open and broken on the left to structured and complete on the right"
 */
export function LogoMark({ size = 36 }: { size?: number }) {
  const w = Math.round(size * 0.65);
  const h = Math.round(size * 0.65);
  return (
    <span
      className="brand-gradient inline-flex shrink-0 items-center justify-center rounded-[8px]"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/*
        viewBox 30x30

        Stroke 1 (short chaos ↗):  (2,27) → (7,17)   — cut short, broken, open
        Stroke 2 (longer chaos ↗): (10,27) → (18,7)   — reaches higher, still open at top
        Stroke 3 (N diagonal ↘):   (18,3) → (27,27)   — complete, structured
        Stroke 4 (N vertical ↓):   (27,3) → (27,27)   — complete, structured

        Gap between stroke 2 top (y=7) and stroke 3 top (y=3): the "open peak"
        that is intentionally never closed — the A's apex left broken.
      */}
      <svg
        width={w}
        height={h}
        viewBox="0 0 30 30"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line x1="2"  y1="27" x2="7"  y2="17" stroke="white" strokeWidth="1.7" strokeLinecap="round" />
        <line x1="10" y1="27" x2="18" y2="7"  stroke="white" strokeWidth="1.7" strokeLinecap="round" />
        <line x1="18" y1="3"  x2="27" y2="27" stroke="white" strokeWidth="1.7" strokeLinecap="round" />
        <line x1="27" y1="3"  x2="27" y2="27" stroke="white" strokeWidth="1.7" strokeLinecap="round" />
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
      <span className="hidden font-heading text-xs font-semibold uppercase tracking-widest text-foreground sm:inline">
        Amirehsan Noori
      </span>
    </Link>
  );
}