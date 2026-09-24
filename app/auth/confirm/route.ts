import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { PATIENT_HOME, PATIENT_LOGIN, safeRedirect } from "@/lib/auth/redirects";

/**
 * Target of the links in Supabase e-mails (sign-up confirmation, password
 * reset). Opens the session, then redirects to `next`.
 *
 * Supports both link formats:
 *  - ?token_hash=...&type=...  (recommended e-mail templates, see README -
 *                               works even if the link is opened on another device)
 *  - ?code=...                 (Supabase default templates, PKCE flow)
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const code = params.get("code");

  const defaultNext = type === "recovery" ? "/auth/reset-password" : PATIENT_HOME;
  const next = safeRedirect(params.get("next"), defaultNext);

  const supabase = await createClient();
  let ok = false;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) console.error("[auth] verifyOtp failed:", error.code ?? "unknown");
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) console.error("[auth] exchangeCodeForSession failed:", error.code ?? "unknown");
    ok = !error;
  }

  const target = ok ? next : `${PATIENT_LOGIN}?error=link`;
  return NextResponse.redirect(new URL(target, request.url));
}
