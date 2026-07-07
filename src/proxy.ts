import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const locales = ["fa", "en"] as const;
const defaultLocale = "fa";

function getLocale(request: NextRequest): string {
  const accept = request.headers.get("accept-language");
  if (accept) {
    const preferred = accept.split(",")[0]?.split("-")[0]?.toLowerCase();
    if (preferred && (locales as readonly string[]).includes(preferred)) {
      return preferred;
    }
  }
  return defaultLocale;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1) i18n: redirect locale-less paths to the preferred locale.
  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );
  if (!hasLocale) {
    const locale = getLocale(request);
    request.nextUrl.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(request.nextUrl);
  }

  // 2) Refresh the Supabase auth session and forward updated cookies.
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Touch the user to trigger a token refresh when needed.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Run on everything except Next internals, API routes, the /auth handlers,
  // the chrome-free /admin and /widget roots (each has its own layout outside
  // [lang] and must never get a locale prefix), and files with an extension.
  matcher: ["/((?!_next|api|auth|admin|widget|.*\\..*).*)"],
};
