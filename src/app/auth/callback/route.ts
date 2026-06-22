import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// OAuth (Google) and magic-link callback: exchange the code for a session.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/fa";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — send the user back to the login page.
  return NextResponse.redirect(`${origin}/fa/login`);
}
