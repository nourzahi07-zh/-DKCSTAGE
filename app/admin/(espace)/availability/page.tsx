import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminBits";
import { AvailabilityManager } from "@/components/admin/AvailabilityManager";
import { Alert } from "@/components/ui/Alert";
import { getAvailabilityExceptions, getAvailabilityRules } from "@/lib/db/availability";
import { todayInMorocco } from "@/lib/format";

export const metadata: Metadata = { title: "Disponibilités" };

export default async function AdminAvailabilityPage() {
  const [rules, exceptions] = await Promise.all([
    getAvailabilityRules(),
    getAvailabilityExceptions(todayInMorocco()),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Disponibilités"
        description="Ces horaires déterminent les créneaux proposés aux patients."
      />

      {rules.length === 0 && (
        <Alert tone="info">
          Aucun horaire n&apos;est configuré : aucun créneau n&apos;est donc proposé à la
          réservation. Ajoutez vos horaires hebdomadaires ci-dessous.
        </Alert>
      )}

      <AvailabilityManager rules={rules} exceptions={exceptions} />

      <p className="text-sm text-ink-500">
        Supprimer un horaire n&apos;annule jamais un rendez-vous déjà réservé : vérifiez le planning
        si vous fermez une journée.
      </p>
    </div>
  );
}
