import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/auth/actions";

/** Logout is a POST (Server Action), so it can't be triggered by a simple link. */
export function LogoutButton({ area }: { area: "patient" | "admin" }) {
  return (
    <form action={logoutAction}>
      <input type="hidden" name="area" value={area} />
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-teal-700"
      >
        <LogOut aria-hidden="true" className="size-4" />
        Se déconnecter
      </button>
    </form>
  );
}
