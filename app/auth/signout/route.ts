import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PATIENT_LOGIN } from "@/lib/auth/redirects";

/**
 * Used by the area guards when a logged-in account has been deactivated by
 * the admin: ends the session and shows the explanation on the login page.
 * It only signs out accounts that really are inactive, so a malicious link to
 * this URL cannot log a normal user out. (Normal logout is a Server Action.)
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", userId)
      .maybeSingle();
    if (profile && !profile.is_active) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL(`${PATIENT_LOGIN}?error=inactive`, request.url));
    }
  }
  return NextResponse.redirect(new URL("/", request.url));
}
