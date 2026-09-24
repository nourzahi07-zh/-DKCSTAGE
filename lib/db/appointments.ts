import "server-only";
import { createClient } from "@/lib/supabase/server";
import { todayInMorocco } from "@/lib/format";
// The pure display rules live in lib/appointments.ts so they can be unit-tested.
export { canCancel, splitAppointments } from "@/lib/appointments";
import type { Enums, Tables } from "@/types/database";

/**
 * Appointment reads. Every query goes through RLS: a patient only ever
 * receives their own rows, an admin receives all of them. No query here
 * filters by patient id coming from the browser.
 */

export type AppointmentWithService = Tables<"appointments"> & {
  service: Pick<Tables<"services">, "id" | "name" | "category" | "price" | "duration_minutes"> | null;
};

export type AppointmentWithPatient = AppointmentWithService & {
  patient: Pick<Tables<"profiles">, "id" | "full_name" | "phone" | "email"> | null;
};

const WITH_SERVICE = "*, service:services(id, name, category, price, duration_minutes)";
const WITH_PATIENT = `${WITH_SERVICE}, patient:profiles(id, full_name, phone, email)`;

/** The signed-in patient's appointments (RLS scopes this to them). */
export async function getMyAppointments(): Promise<AppointmentWithService[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(WITH_SERVICE)
    .order("appointment_date", { ascending: false })
    .order("start_time", { ascending: false });

  if (error) {
    console.error("[db] getMyAppointments failed:", error.code, error.message);
    return [];
  }
  return (data ?? []) as AppointmentWithService[];
}

/** One appointment. Another patient's id simply returns null (RLS). */
export async function getAppointmentById(id: string): Promise<AppointmentWithService | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(WITH_SERVICE)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[db] getAppointmentById failed:", error.code, error.message);
    return null;
  }
  return data as AppointmentWithService | null;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export type AdminAppointmentFilters = {
  status?: Enums<"appointment_status">;
  from?: string;
  to?: string;
  serviceId?: string;
  patientId?: string;
};

export async function getAdminAppointments(
  filters: AdminAppointmentFilters = {},
  limit = 200,
): Promise<AppointmentWithPatient[]> {
  const supabase = await createClient();
  let query = supabase.from("appointments").select(WITH_PATIENT);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.from) query = query.gte("appointment_date", filters.from);
  if (filters.to) query = query.lte("appointment_date", filters.to);
  if (filters.serviceId) query = query.eq("service_id", filters.serviceId);
  if (filters.patientId) query = query.eq("patient_id", filters.patientId);

  const { data, error } = await query
    .order("appointment_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[db] getAdminAppointments failed:", error.code, error.message);
    return [];
  }
  return (data ?? []) as AppointmentWithPatient[];
}

export async function getAdminAppointmentById(id: string): Promise<AppointmentWithPatient | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(WITH_PATIENT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[db] getAdminAppointmentById failed:", error.code, error.message);
    return null;
  }
  return data as AppointmentWithPatient | null;
}

export type AdminStats = {
  today: number;
  upcoming: number;
  pending: number;
  confirmed: number;
  completed: number;
  patients: number;
};

/** Counts only - computed by the database, nothing sensitive is transferred. */
export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient();
  const today = todayInMorocco();
  const head = { count: "exact" as const, head: true };

  const [todayRes, upcomingRes, pendingRes, confirmedRes, completedRes, patientsRes] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("id", head)
        .eq("appointment_date", today)
        .in("status", ["pending", "confirmed"]),
      supabase
        .from("appointments")
        .select("id", head)
        .gte("appointment_date", today)
        .in("status", ["pending", "confirmed"]),
      supabase.from("appointments").select("id", head).eq("status", "pending"),
      supabase.from("appointments").select("id", head).eq("status", "confirmed"),
      supabase.from("appointments").select("id", head).eq("status", "completed"),
      supabase.from("profiles").select("id", head).eq("role", "patient"),
    ]);

  return {
    today: todayRes.count ?? 0,
    upcoming: upcomingRes.count ?? 0,
    pending: pendingRes.count ?? 0,
    confirmed: confirmedRes.count ?? 0,
    completed: completedRes.count ?? 0,
    patients: patientsRes.count ?? 0,
  };
}

/** Patients, for the admin patient list. */
export async function getPatients(search?: string): Promise<Tables<"profiles">[]> {
  const supabase = await createClient();
  let query = supabase.from("profiles").select("*").eq("role", "patient");

  if (search && search.trim().length > 1) {
    // Escape the PostgREST pattern characters before building the filter.
    const term = search.trim().replace(/[%,()]/g, " ");
    query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
  }

  const { data, error } = await query.order("full_name", { ascending: true }).limit(200);
  if (error) {
    console.error("[db] getPatients failed:", error.code, error.message);
    return [];
  }
  return data ?? [];
}

export async function getPatientById(id: string): Promise<Tables<"profiles"> | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("[db] getPatientById failed:", error.code, error.message);
    return null;
  }
  return data;
}
