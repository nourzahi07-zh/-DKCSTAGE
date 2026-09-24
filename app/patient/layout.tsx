import type { Metadata } from "next";
import { PatientNav } from "@/components/layout/PatientNav";
import { requirePatient } from "@/lib/auth/session";

export const metadata: Metadata = { robots: { index: false } };

/** Every /patient/* page goes through this server-side guard. */
export default async function PatientLayout({ children }: LayoutProps<"/patient">) {
  const profile = await requirePatient();

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <PatientNav name={profile.full_name} />
      <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
