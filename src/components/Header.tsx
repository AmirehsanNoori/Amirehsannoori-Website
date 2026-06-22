import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { AuthNav } from "./AuthNav";

export function Header({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const base = `/${lang}`;
  const nav = [
    { href: base, label: dict.nav.home },
    { href: `${base}/services`, label: dict.nav.services },
    { href: `${base}/work`, label: dict.nav.work },
    { href: `${base}/about`, label: dict.nav.about },
    { href: `${base}/contact`, label: dict.nav.contact },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo href={base} />

        <nav className="hidden items-center gap-6 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher current={lang} />
          <ThemeToggle label={dict.theme.toggle} />
          <AuthNav
            lang={lang}
            loginLabel={dict.auth.login}
            accountLabel={dict.auth.account}
          />
          <Link
            href={`${base}/services`}
            className="hidden h-9 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90 sm:inline-flex"
          >
            {dict.nav.book}
          </Link>
        </div>
      </div>
    </header>
  );
}
