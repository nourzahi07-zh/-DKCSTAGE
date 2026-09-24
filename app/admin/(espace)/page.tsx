import { redirect } from "next/navigation";
import { ADMIN_HOME } from "@/lib/auth/redirects";

export default function AdminIndex() {
  redirect(ADMIN_HOME);
}
