import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type Service = Tables<"services">;

const LIST_ORDER = { column: "name", ascending: true } as const;

/**
 * Services visible to everyone. RLS already hides inactive ones from
 * visitors and patients, but is_active is requested explicitly so the
 * intention is clear in the code too.
 */
export async function getActiveServices(): Promise<Service[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order(LIST_ORDER.column, { ascending: LIST_ORDER.ascending });

  if (error) {
    console.error("[db] getActiveServices failed:", error.code, error.message);
    return [];
  }
  return data ?? [];
}

export async function getActiveServiceById(id: string): Promise<Service | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("[db] getActiveServiceById failed:", error.code, error.message);
    return null;
  }
  return data;
}

/** Admin list: RLS returns inactive services too when the caller is an admin. */
export async function getAllServices(): Promise<Service[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("category", { ascending: true })
    .order(LIST_ORDER.column, { ascending: LIST_ORDER.ascending });

  if (error) {
    console.error("[db] getAllServices failed:", error.code, error.message);
    return [];
  }
  return data ?? [];
}
