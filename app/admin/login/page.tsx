import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { ADMIN_HOME, safeRedirect } from "@/lib/auth/redirects";
import { getCurrentProfile } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Espace administrateur", robots: { index: false } };

/**
 * Separate login for Rihab. Same Supabase Auth, but the Server Action
 * refuses (and signs out) any account whose role is not 'admin'.
 */
export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const profile = await getCurrentProfile();
  if (profile?.is_active && profile.role === "admin") redirect(ADMIN_HOME);

  const params = await searchParams;
  const next = typeof params.next === "string" ? safeRedirect(params.next, "") : "";

  return (
    <AuthShell title="Espace administrateur" subtitle="Accès réservé au cabinet DKC.">
      <LoginForm area="admin" next={next.startsWith("/admin") ? next : undefined} />
    </AuthShell>
  );
}
