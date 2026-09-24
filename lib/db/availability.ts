import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type Slot = { start_time: string; end_time: string };

/**
 * Bookable times for a service on a date. This calls the SAME database
 * function that validates a booking (get_available_slots), so what is shown
 * and what is accepted can never drift apart. It returns times only - never
 * anything about other patients.
 */
export async function getAvailableSlots(serviceId: string, date: string): Promise<Slot[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_available_slots", {
    p_service_id: serviceId,
    p_date: date,
  });

  if (error) {
    console.error("[db] get_available_slots failed:", error.code, error.message);
    throw new Error("SLOTS_UNAVAILABLE");
  }
  return (data ?? []) as Slot[];
}

// --- Admin: the weekly schedule and its exceptions --------------------------

export async function getAvailabilityRules(): Promise<Tables<"availability_rules">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("availability_rules")
    .select("*")
    .order("weekday", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("[db] getAvailabilityRules failed:", error.code, error.message);
    return [];
  }
  return data ?? [];
}

export async function getAvailabilityExceptions(
  from: string,
): Promise<Tables<"availability_exceptions">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("availability_exceptions")
    .select("*")
    .gte("date", from)
    .order("date", { ascending: true });

  if (error) {
    console.error("[db] getAvailabilityExceptions failed:", error.code, error.message);
    return [];
  }
  return data ?? [];
}
