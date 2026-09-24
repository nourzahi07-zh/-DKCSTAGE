import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { LOGIN_PAGE_ERRORS } from "@/lib/auth/errors";
import { safeRedirect } from "@/lib/auth/redirects";
import { getCurrentProfile, homeFor } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/auth/login">) {
  const profile = await getCurrentProfile();
  if (profile?.is_active) redirect(homeFor(profile));

  const params = await searchParams;
  const next = typeof params.next === "string" ? safeRedirect(params.next, "") : "";
  const error = typeof params.error === "string" ? LOGIN_PAGE_ERRORS[params.error] : undefined;

  return (
    <AuthShell
      title="Connexion"
      subtitle="Accédez à votre espace patient pour gérer vos rendez-vous."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link href="/auth/register" className="font-semibold text-teal-700 hover:underline">
            Créer un compte
          </Link>
        </>
      }
    >
      <LoginForm area="patient" next={next || undefined} pageError={error} />
    </AuthShell>
  );
}
