import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getCurrentProfile, homeFor } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Créer un compte",
  description: "Créez votre compte patient DKC pour prendre rendez-vous en ligne.",
};

export default async function RegisterPage() {
  const profile = await getCurrentProfile();
  if (profile?.is_active) redirect(homeFor(profile));

  return (
    <AuthShell
      title="Créer un compte"
      subtitle="Votre espace patient pour prendre et suivre vos rendez-vous."
      footer={
        <>
          Déjà inscrit ?{" "}
          <Link href="/auth/login" className="font-semibold text-teal-700 hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
