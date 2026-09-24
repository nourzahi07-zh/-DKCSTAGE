import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getCurrentProfile } from "@/lib/auth/session";

/** Public site shell: header (session-aware) + content + footer. */
export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const profile = await getCurrentProfile();
  const session =
    profile && profile.is_active
      ? { role: profile.role as "patient" | "admin", name: profile.full_name.split(" ")[0] }
      : null;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader session={session} />
      <main id="contenu" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
