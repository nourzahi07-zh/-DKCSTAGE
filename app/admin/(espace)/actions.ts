"use server";

/**
 * Admin Server Actions.
 * Every one of them calls requireAdmin() first, but that is only the first
 * layer: the database itself refuses these writes for a non-admin (RLS on
 * services / availability / profiles, and set_appointment_status checks
 * is_admin() before touching an appointment).
 */
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/session";
import { dbErrorMessage } from "@/lib/db/errors";
import { fieldErrors } from "@/lib/validation/auth";
import {
  availabilityExceptionSchema,
  availabilityRuleSchema,
  patientStatusSchema,
  serviceSchema,
  statusChangeSchema,
  uuid,
} from "@/lib/validation/appointment";
import type { FormState } from "@/lib/auth/form-state";

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function checked(formData: FormData, name: string): boolean {
  return formData.get(name) === "on" || formData.get(name) === "true";
}

function revalidateAppointments(id?: string) {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/appointments");
  revalidatePath("/admin/planning");
  if (id) revalidatePath(`/admin/appointments/${id}`);
}

// ---------------------------------------------------------------------------
// Appointments: confirm / complete / cancel (the database enforces the
// allowed transitions, e.g. "terminé" only once the appointment has started)
// ---------------------------------------------------------------------------
export async function setAppointmentStatusAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const parsed = statusChangeSchema.safeParse({
    appointmentId: text(formData, "appointmentId"),
    status: text(formData, "status"),
  });
  if (!parsed.success) return { status: "error", message: "Action invalide." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_appointment_status", {
    p_id: parsed.data.appointmentId,
    p_status: parsed.data.status,
  });
  if (error) return { status: "error", message: dbErrorMessage(error, "set_appointment_status") };

  revalidateAppointments(parsed.data.appointmentId);
  const labels = {
    confirmed: "Rendez-vous confirmé.",
    completed: "Rendez-vous marqué comme terminé.",
    cancelled: "Rendez-vous annulé.",
  };
  return { status: "success", message: labels[parsed.data.status] };
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------
export async function saveServiceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const idValue = text(formData, "id");
  const parsed = serviceSchema.safeParse({
    id: idValue || undefined,
    name: text(formData, "name"),
    description: text(formData, "description"),
    category: text(formData, "category"),
    price: text(formData, "price"),
    priceType: text(formData, "priceType"),
    sessionsIncluded: text(formData, "sessionsIncluded"),
    durationMinutes: text(formData, "durationMinutes"),
    atCabinet: checked(formData, "atCabinet"),
    atHome: checked(formData, "atHome"),
    isActive: checked(formData, "isActive"),
  });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };

  const d = parsed.data;
  const row = {
    name: d.name,
    description: d.description,
    category: d.category,
    price: d.price === "" ? null : Number(d.price),
    price_type: d.priceType,
    sessions_included:
      d.priceType === "package" && d.sessionsIncluded !== "" ? Number(d.sessionsIncluded) : null,
    duration_minutes: Number(d.durationMinutes),
    at_cabinet: d.atCabinet,
    at_home: d.atHome,
    is_active: d.isActive,
  };

  const supabase = await createClient();
  const { error } = d.id
    ? await supabase.from("services").update(row).eq("id", d.id)
    : await supabase.from("services").insert(row);

  if (error) {
    if (error.code === "23505") {
      return { status: "error", fieldErrors: { name: ["Une prestation porte déjà ce nom."] } };
    }
    return { status: "error", message: dbErrorMessage(error, "saveService") };
  }

  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/");
  return { status: "success", message: d.id ? "Prestation mise à jour." : "Prestation créée." };
}

export async function toggleServiceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const id = uuid.safeParse(text(formData, "serviceId"));
  if (!id.success) return { status: "error", message: "Prestation introuvable." };
  const activate = checked(formData, "activate");

  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({ is_active: activate })
    .eq("id", id.data);
  if (error) return { status: "error", message: dbErrorMessage(error, "toggleService") };

  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/");
  return {
    status: "success",
    message: activate ? "Prestation réactivée." : "Prestation désactivée.",
  };
}

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------
export async function addAvailabilityRuleAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const parsed = availabilityRuleSchema.safeParse({
    weekday: text(formData, "weekday"),
    startTime: text(formData, "startTime"),
    endTime: text(formData, "endTime"),
  });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("availability_rules").insert({
    weekday: parsed.data.weekday,
    start_time: parsed.data.startTime,
    end_time: parsed.data.endTime,
  });
  if (error) return { status: "error", message: dbErrorMessage(error, "addAvailabilityRule") };

  revalidatePath("/admin/availability");
  return { status: "success", message: "Créneau hebdomadaire ajouté." };
}

export async function deleteAvailabilityRuleAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = uuid.safeParse(text(formData, "ruleId"));
  if (!id.success) return { status: "error", message: "Créneau introuvable." };

  const supabase = await createClient();
  const { error } = await supabase.from("availability_rules").delete().eq("id", id.data);
  if (error) return { status: "error", message: dbErrorMessage(error, "deleteAvailabilityRule") };

  revalidatePath("/admin/availability");
  return { status: "success", message: "Créneau supprimé." };
}

export async function addAvailabilityExceptionAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const isClosed = checked(formData, "isClosed");
  const parsed = availabilityExceptionSchema.safeParse({
    date: text(formData, "date"),
    isClosed,
    startTime: text(formData, "startTime"),
    endTime: text(formData, "endTime"),
    reason: text(formData, "reason"),
  });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("availability_exceptions").insert({
    date: parsed.data.date,
    is_closed: parsed.data.isClosed,
    start_time: parsed.data.isClosed ? null : parsed.data.startTime,
    end_time: parsed.data.isClosed ? null : parsed.data.endTime,
    reason: parsed.data.reason || null,
  });
  if (error) return { status: "error", message: dbErrorMessage(error, "addException") };

  revalidatePath("/admin/availability");
  return {
    status: "success",
    message: parsed.data.isClosed ? "Journée marquée comme fermée." : "Horaires exceptionnels ajoutés.",
  };
}

export async function deleteAvailabilityExceptionAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = uuid.safeParse(text(formData, "exceptionId"));
  if (!id.success) return { status: "error", message: "Exception introuvable." };

  const supabase = await createClient();
  const { error } = await supabase.from("availability_exceptions").delete().eq("id", id.data);
  if (error) return { status: "error", message: dbErrorMessage(error, "deleteException") };

  revalidatePath("/admin/availability");
  return { status: "success", message: "Exception supprimée." };
}

// ---------------------------------------------------------------------------
// Patients: activate / deactivate (never delete - the history is kept).
// The database refuses a role change here, and an admin cannot deactivate
// their own account.
// ---------------------------------------------------------------------------
export async function setPatientStatusAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const parsed = patientStatusSchema.safeParse({
    patientId: text(formData, "patientId"),
    isActive: checked(formData, "isActive"),
  });
  if (!parsed.success) return { status: "error", message: "Patient introuvable." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: parsed.data.isActive })
    .eq("id", parsed.data.patientId)
    .eq("role", "patient");
  if (error) return { status: "error", message: dbErrorMessage(error, "setPatientStatus") };

  revalidatePath("/admin/patients");
  revalidatePath(`/admin/patients/${parsed.data.patientId}`);
  return {
    status: "success",
    message: parsed.data.isActive ? "Compte réactivé." : "Compte désactivé.",
  };
}
