import Link from "next/link";

export function Logo({ href }: { href: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2" aria-label="Amirehsan Noori">
      <span className="brand-gradient inline-flex h-9 w-9 items-center justify-center rounded-md font-heading text-sm font-bold text-white">
        AN
      </span>
      <span className="hidden font-heading text-sm font-semibold tracking-tight text-foreground sm:inline">
        Amirehsan Noori
      </span>
    </Link>
  );
}
