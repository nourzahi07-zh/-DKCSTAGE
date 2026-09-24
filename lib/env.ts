/**
 * Central, validated access to public environment variables.
 *
 * NEXT_PUBLIC_* variables must be read with their literal name
 * (process.env.NEXT_PUBLIC_X) so Next.js can inline them into the browser
 * bundle - that's why they are listed one by one below.
 *
 * Server-only secrets (GEMINI_API_KEY) are NOT read here: they live in
 * server-only modules so they can never be imported by a client component.
 */

export class ConfigError extends Error {
  constructor(variable: string) {
    super(
      `Missing environment variable ${variable}. ` +
        `Copy .env.example to .env.local (or set it in Vercel) and restart.`,
    );
    this.name = "ConfigError";
  }
}

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") throw new ConfigError(name);
  return value.trim();
}

/**
 * The Supabase client needs the bare project URL (https://<ref>.supabase.co)
 * and appends /auth/v1, /rest/v1… itself. A URL copied with a path such as
 * ".../rest/v1/" would send Auth requests to ".../rest/v1/auth/v1/..." (404),
 * so only the origin is kept.
 */
function projectUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not a valid URL. Expected https://<project-ref>.supabase.co",
    );
  }
  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must use https.");
  }
  return url.origin;
}

/** Supabase connection settings (public by design, protected by RLS). */
export function getSupabaseEnv() {
  return {
    url: projectUrl(required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL)),
    publishableKey: required(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
  };
}

/** Public base URL of the site, without a trailing slash. */
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return url.replace(/\/+$/, "");
}
