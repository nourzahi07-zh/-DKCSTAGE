import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { robots: { index: false } };

/**
 * Guard for every admin page (except /admin/login, which sits outside this
 * route group). A patient is sent back to their own area; the data itself is
 * protected independently by RLS and the SQL functions.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin();
  return <AdminShell name={profile.full_name}>{children}</AdminShell>;
}
