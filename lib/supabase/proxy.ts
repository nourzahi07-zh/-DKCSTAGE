import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/env";
import { loginRedirectFor } from "@/lib/auth/redirects";

/**
 * Runs before every page request (see /proxy.ts):
 *  1. refreshes the Supabase session and writes the new cookies;
 *  2. sends visitors WITHOUT a session away from /patient and /admin pages
 *     to the right login page (remembering where they wanted to go).
 * Role checks (patient vs admin) are done by the area layouts, and the data
 * itself is protected by RLS - this is only the first, fast layer.
 */
export async function updateSession(request: NextRequest) {
  const { url, publishableKey } = getSupabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Validates the token (and refreshes it if expired). Do not remove.
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    const target = loginRedirectFor(request.nextUrl.pathname);
    if (target) {
      const redirect = NextResponse.redirect(new URL(target, request.url));
      // Keep any cookie changes (e.g. a cleared expired session).
      response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
      return redirect;
    }
  }

  return response;
}
