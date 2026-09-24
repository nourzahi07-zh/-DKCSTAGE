import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminBits";
import { ServiceManager } from "@/components/admin/ServiceManager";
import { getAllServices } from "@/lib/db/services";

export const metadata: Metadata = { title: "Prestations" };

export default async function AdminServicesPage() {
  const services = await getAllServices();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Prestations"
        description="Le catalogue affiché sur le site et proposé à la réservation."
      />
      <ServiceManager services={services} />
      <p className="text-sm text-ink-500">
        Une prestation déjà utilisée par un rendez-vous ne peut pas être supprimée : désactivez-la
        pour la retirer du site tout en conservant l&apos;historique.
      </p>
    </div>
  );
}
