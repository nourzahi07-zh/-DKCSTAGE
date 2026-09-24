import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminBits";
import { PasswordForm } from "@/components/account/AccountForms";
import { Card, CardHeader } from "@/components/ui/Card";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Mon compte" };

export default async function AdminAccountPage() {
  const profile = await requireAdmin();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <AdminPageHeader title="Mon compte" description="Votre accès à l'administration du cabinet." />

      <Card>
        <CardHeader title="Informations" />
        <dl className="divide-y divide-ink-100">
          <div className="flex justify-between gap-4 p-5 text-sm">
            <dt className="text-ink-500">Nom</dt>
            <dd className="font-medium text-ink-900">{profile.full_name}</dd>
          </div>
          <div className="flex justify-between gap-4 p-5 text-sm">
            <dt className="text-ink-500">E-mail</dt>
            <dd className="break-all font-medium text-ink-900">{profile.email}</dd>
          </div>
          <div className="flex justify-between gap-4 p-5 text-sm">
            <dt className="text-ink-500">Rôle</dt>
            <dd className="font-medium text-ink-900">Administratrice</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <CardHeader
          title="Mot de passe"
          description="Votre mot de passe actuel est demandé pour valider le changement."
        />
        <PasswordForm />
      </Card>
    </div>
  );
}
