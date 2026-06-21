"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function LanguageSwitcher({ current }: { current: "fa" | "en" }) {
  const pathname = usePathname() || `/${current}`;
  const other = current === "fa" ? "en" : "fa";

  const segments = pathname.split("/");
  segments[1] = other; // swap the locale segment
  const href = segments.join("/") || `/${other}`;

  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface"
    >
      {other === "fa" ? "فارسی" : "EN"}
    </Link>
  );
}
