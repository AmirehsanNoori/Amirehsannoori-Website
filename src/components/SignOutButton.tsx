"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({
  lang,
  label,
}: {
  lang: string;
  label: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push(`/${lang}`);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="inline-flex h-10 items-center rounded-md border border-border px-5 text-sm font-medium transition-colors hover:bg-surface"
    >
      {label}
    </button>
  );
}
