import type { Dictionary, Locale } from "@/lib/i18n";

export function Footer({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-10 sm:flex-row sm:items-center sm:px-6">
        <div>
          <p className="font-heading text-sm font-semibold text-foreground">
            Amirehsan Noori
          </p>
          <p className="text-sm text-muted">{dict.footer.tagline}</p>
        </div>
        <p className="text-xs text-muted">
          © {year} · {dict.footer.rights}
        </p>
      </div>
    </footer>
  );
}
