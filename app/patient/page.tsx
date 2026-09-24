import { redirect } from "next/navigation";
import { PATIENT_HOME } from "@/lib/auth/redirects";

export default function PatientIndex() {
  redirect(PATIENT_HOME);
}
