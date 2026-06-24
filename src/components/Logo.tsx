import Image from "next/image";
import Link from "next/link";

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <span
      className="brand-gradient inline-flex shrink-0 items-center justify-center rounded-[8px] overflow-hidden"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Image
        src="/logo-mark.png"
        alt=""
        width={233}
        height={208}
        style={{ width: size * 0.8, height: "auto", mixBlendMode: "screen" }}
        priority
        unoptimized
      />
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