import type { Metadata } from "next";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminBits";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { getPatients } from "@/lib/db/appointments";
import { initials } from "@/lib/format";

export const metadata: Metadata = { title: "Patients" };

export default async function AdminPatientsPage({ searchParams }: PageProps<"/admin/patients">) {
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q : "";
  const patients = await getPatients(search);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Patients"
        description="Les comptes patients inscrits sur le site."
      />

      <Card className="p-4">
        <form action="/admin/patients" className="flex flex-wrap items-end gap-3" role="search">
          <div className="min-w-[16rem] flex-1">
            <label htmlFor="q" className="mb-1 block text-xs font-medium text-ink-600">
              Rechercher (nom, e-mail, téléphone)
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400"
              />
              <input
                id="q"
                name="q"
                type="search"
                defaultValue={search}
                placeholder="Ex. Amina, 06…, @gmail.com"
                className="w-full rounded-lg border border-ink-300 py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Rechercher
          </button>
          {search && (
            <Link href="/admin/patients" className="text-sm font-medium text-ink-500 hover:text-brand-700">
              Réinitialiser
            </Link>
          )}
        </form>
      </Card>

      <Card>
        <CardHeader title={`${patients.length} patient${patients.length > 1 ? "s" : ""}`} />
        {patients.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Users aria-hidden="true" className="size-6" />}
              title="Aucun patient trouvé"
              description={
                search
                  ? "Aucun compte ne correspond à cette recherche."
                  : "Les comptes créés depuis le site apparaîtront ici."
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-ink-100">
            {patients.map((patient) => (
              <li key={patient.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
                  {initials(patient.full_name)}
                </span>
                <div className="min-w-[10rem] flex-1">
                  <p className="font-semibold text-ink-900">
                    <Link href={`/admin/patients/${patient.id}`} className="hover:text-brand-700">
                      {patient.full_name}
                    </Link>
                  </p>
                  <p className="break-all text-xs text-ink-500">{patient.email}</p>
                </div>
                <p className="text-sm text-ink-600">{patient.phone ?? "—"}</p>
                {!patient.is_active && <Badge tone="neutral">Désactivé</Badge>}
                <Link
                  href={`/admin/patients/${patient.id}`}
                  className="ml-auto text-sm font-semibold text-brand-700 hover:underline"
                >
                  Voir la fiche
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
