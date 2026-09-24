"use server";

/**
 * Patient Server Actions. They never trust the browser for identity: the
 * database functions derive the patient from the session (auth.uid()), and
 * every rule (availability, overlap, limits, ownership) is checked there.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePatient } from "@/lib/auth/session";
import { dbErrorMessage } from "@/lib/db/errors";
import { getAvailableSlots, type Slot } from "@/lib/db/availability";
import { fieldErrors } from "@/lib/validation/auth";
import {
  appointmentIdSchema,
  bookingSchema,
  passwordChangeSchema,
  profileSchema,
  slotQuerySchema,
} from "@/lib/validation/appointment";
import { authErrorMessage } from "@/lib/auth/errors";
import type { FormState } from "@/lib/auth/form-state";

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/** Slots for the booking wizard (same function that validates the booking). */
export async function fetchSlotsAction(
  serviceId: string,
  date: string,
): Promise<{ slots: Slot[]; error?: string }> {
  await requirePatient();
  const parsed = slotQuerySchema.safeParse({ serviceId, date });
  if (!parsed.success) return { slots: [], error: "Demande invalide." };

  try {
    return { slots: await getAvailableSlots(parsed.data.serviceId, parsed.data.date) };
  } catch {
    return { slots: [], error: "Impossible de charger les créneaux. Veuillez réessayer." };
  }
}

export async function bookAppointmentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requirePatient();

  const parsed = bookingSchema.safeParse({
    serviceId: text(formData, "serviceId"),
    date: text(formData, "date"),
    startTime: text(formData, "startTime"),
    location: text(formData, "location"),
    homeAddress: text(formData, "homeAddress"),
    notes: text(formData, "notes"),
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error) };
  }

  const { serviceId, date, startTime, location, homeAddress, notes } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("book_appointment", {
    p_service_id: serviceId,
    p_date: date,
    p_start_time: startTime,
    p_location: location,
    p_home_address: location === "home" ? homeAddress : undefined,
    p_notes: notes || undefined,
  });

  if (error) {
    return { status: "error", message: dbErrorMessage(error, "book_appointment") };
  }

  revalidatePath("/patient/dashboard");
  revalidatePath("/patient/appointments");
  redirect(`/patient/appointments/${data}?confirme=1`);
}

export async function cancelAppointmentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requirePatient();

  const parsed = appointmentIdSchema.safeParse({ appointmentId: text(formData, "appointmentId") });
  if (!parsed.success) return { status: "error", message: "Rendez-vous introuvable." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_appointment", { p_id: parsed.data.appointmentId });
  if (error) {
    return { status: "error", message: dbErrorMessage(error, "cancel_appointment") };
  }

  revalidatePath("/patient/dashboard");
  revalidatePath("/patient/appointments");
  revalidatePath(`/patient/appointments/${parsed.data.appointmentId}`);
  return { status: "success", message: "Votre rendez-vous a été annulé." };
}

export async function updateProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const profile = await requirePatient();

  const parsed = profileSchema.safeParse({
    fullName: text(formData, "fullName"),
    phone: text(formData, "phone"),
    dateOfBirth: text(formData, "dateOfBirth"),
  });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  // RLS restricts this to the caller's own row, and a database trigger
  // refuses any attempt to touch role, e-mail or is_active here.
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      date_of_birth: parsed.data.dateOfBirth || null,
    })
    .eq("id", profile.id);

  if (error) return { status: "error", message: dbErrorMessage(error, "updateProfile") };

  revalidatePath("/patient/profile");
  revalidatePath("/patient/dashboard");
  return { status: "success", message: "Vos informations ont été mises à jour." };
}

/** Password change: the current password is verified first. */
export async function changePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const email = claims?.claims?.email as string | undefined;
  if (!email) return { status: "error", message: "Votre session a expiré. Veuillez vous reconnecter." };

  const parsed = passwordChangeSchema.safeParse({
    currentPassword: text(formData, "currentPassword"),
    password: text(formData, "password"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.currentPassword,
  });
  if (signInError) {
    return { status: "error", fieldErrors: { currentPassword: ["Mot de passe actuel incorrect."] } };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { status: "error", message: authErrorMessage(error) };

  return { status: "success", message: "Votre mot de passe a été modifié." };
}
