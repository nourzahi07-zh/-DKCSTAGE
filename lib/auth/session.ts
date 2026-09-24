import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import { ADMIN_HOME, ADMIN_LOGIN, PATIENT_HOME, PATIENT_LOGIN } from "./redirects";

export type Profile = Tables<"profiles">;

/**
 * The logged-in user's profile, or null. Cached for the duration of one
 * request, so layouts and pages can all call it without extra queries.
 * getClaims() verifies the session token; the profile is read through RLS.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[auth] profile lookup failed:", error.code, error.message);
    return null;
  }
  return profile;
});

/** Guard for every page of the patient area. */
export async function requirePatient(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect(PATIENT_LOGIN);
  if (!profile.is_active) redirect("/auth/signout?reason=inactive");
  if (profile.role !== "patient") redirect(ADMIN_HOME);
  return profile;
}

/** Guard for every page of the admin area. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect(ADMIN_LOGIN);
  if (!profile.is_active) redirect("/auth/signout?reason=inactive");
  if (profile.role !== "admin") redirect(PATIENT_HOME);
  return profile;
}

/** Home page of a profile's area. */
export function homeFor(profile: Pick<Profile, "role">): string {
  return profile.role === "admin" ? ADMIN_HOME : PATIENT_HOME;
}
