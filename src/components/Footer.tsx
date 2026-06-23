import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";

export function Footer({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const year = new Date().getFullYear();
  const base = `/${lang}`;

  const links = [
    { href: `${base}/services`, label: dict.nav.services },
    { href: `${base}/work`, label: dict.nav.work },
    { href: `${base}/about`, label: dict.nav.about },
    { href: `${base}/contact`, label: dict.nav.contact },
  ];

  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div>
            <Link href={base} className="inline-flex items-center gap-2" aria-label="Amirehsan Noori">
              <span className="brand-gradient inline-flex h-8 w-8 items-center justify-center rounded-md font-heading text-xs font-bold text-white">
                AN
              </span>
              <span className="font-heading text-sm font-semibold tracking-tight text-foreground">
                Amirehsan Noori
              </span>
            </Link>
            <p className="mt-2 max-w-xs text-sm text-muted">{dict.footer.tagline}</p>
          </div>

          {/* Nav links */}
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-8 gap-y-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href={`${base}/book`}
              className="brand-gradient-text text-sm font-semibold transition-opacity hover:opacity-80"
            >
              {dict.nav.book}
            </Link>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            © {year} Amirehsan Noori · {dict.footer.rights}
          </p>
          <p className="text-xs text-muted">amirehsan.noori@gmail.com</p>
        </div>
      </div>
    </footer>
  );
}
