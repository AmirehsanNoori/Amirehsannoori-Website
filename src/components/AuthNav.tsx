"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function AuthNav({
  lang,
  loginLabel,
  accountLabel,
}: {
  lang: string;
  loginLabel: string;
  accountLabel: string;
}) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session?.user);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Avoid a flash before we know the auth state.
  if (signedIn === null) {
    return <span className="inline-block h-9 w-16" aria-hidden="true" />;
  }

  return (
    <Link
      href={signedIn ? `/${lang}/account` : `/${lang}/login`}
      className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface"
    >
      {signedIn ? accountLabel : loginLabel}
    </Link>
  );
}
