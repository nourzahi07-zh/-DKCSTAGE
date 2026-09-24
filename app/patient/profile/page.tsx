import type { Metadata } from "next";
import { PasswordForm, ProfileForm } from "@/components/account/AccountForms";
import { Card, CardHeader } from "@/components/ui/Card";
import { requirePatient } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Mon profil", robots: { index: false } };

export default async function PatientProfilePage() {
  const profile = await requirePatient();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-ink-900">Mon profil</h1>
        <p className="mt-1.5 text-ink-600">
          Ces informations permettent au cabinet de vous contacter au sujet de vos rendez-vous.
        </p>
      </header>

      <Card>
        <CardHeader title="Mes informations" description={`Compte : ${profile.email}`} />
        <ProfileForm
          fullName={profile.full_name}
          phone={profile.phone}
          dateOfBirth={profile.date_of_birth}
        />
      </Card>

      <Card>
        <CardHeader
          title="Mot de passe"
          description="Votre mot de passe actuel est demandé pour valider le changement."
        />
        <PasswordForm />
      </Card>

      <p className="text-sm text-ink-500">
        Pour modifier votre adresse e-mail, contactez le cabinet.
      </p>
    </div>
  );
}
