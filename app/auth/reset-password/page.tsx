import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/PasswordForms";
import { Alert } from "@/components/ui/Alert";
import { getCurrentProfile } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false } };

/** Reached from the reset e-mail: /auth/confirm has already opened a session. */
export default async function ResetPasswordPage() {
  const profile = await getCurrentProfile();

  return (
    <AuthShell title="Nouveau mot de passe" subtitle="Choisissez votre nouveau mot de passe.">
      {profile ? (
        <ResetPasswordForm />
      ) : (
        <div className="space-y-4">
          <Alert tone="error">Ce lien est invalide ou a expiré.</Alert>
          <Link
            href="/auth/forgot-password"
            className="block text-center text-sm font-semibold text-teal-700 hover:underline"
          >
            Demander un nouveau lien
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
