"use server";

/**
 * Authentication Server Actions. They run on the server only: the browser
 * just posts the form. Supabase Auth stores the passwords (hashed) and manages
 * the session (cookies set by @supabase/ssr) - we never store or hash
 * passwords ourselves.
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/env";
import {
  emailOnlySchema,
  fieldErrors,
  loginSchema,
  newPasswordSchema,
  registerSchema,
} from "@/lib/validation/auth";
import { authErrorMessage, GENERIC_AUTH_ERROR } from "@/lib/auth/errors";
import type { FormState } from "@/lib/auth/form-state";
import { ADMIN_HOME, ADMIN_LOGIN, PATIENT_HOME, safeRedirect } from "@/lib/auth/redirects";
import { homeFor } from "@/lib/auth/session";

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function logAuthError(action: string, error: { code?: string; status?: number }) {
  // Only the error code/status: never e-mails or passwords.
  console.error(`[auth] ${action} failed:`, error.code ?? "unknown", error.status ?? "");
}

/** Link placed in the password-reset e-mail; /auth/confirm opens the session. */
function confirmUrl(next: string): string {
  return `${getSiteUrl()}/auth/confirm?next=${encodeURIComponent(next)}`;
}

// ---------------------------------------------------------------------------
// Registration (patients only - the database always creates role 'patient')
// "Confirm email" is OFF in Supabase: sign-up returns a session immediately
// and no e-mail is sent.
// ---------------------------------------------------------------------------
export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = {
    fullName: text(formData, "fullName"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
  };
  const parsed = registerSchema.safeParse({
    ...values,
    password: text(formData, "password"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  }

  const { fullName, email, phone, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // Only name + phone. The role is NOT taken from here (see migration 0002).
    options: { data: { full_name: fullName, phone } },
  });

  if (error) {
    if (error.code === "user_already_exists" || error.code === "email_exists") {
      return {
        status: "error",
        message:
          "Un compte existe déjà avec cette adresse e-mail. Connectez-vous ou utilisez « Mot de passe oublié ».",
        values,
      };
    }
    logAuthError("signUp", error);
    return { status: "error", message: authErrorMessage(error), values };
  }

  // Normal case: the account is created and the session cookies are set.
  if (data.session) redirect(PATIENT_HOME);

  // Only reachable if "Confirm email" gets switched back ON in Supabase.
  console.error("[auth] signUp returned no session - is 'Confirm email' enabled in Supabase?");
  return {
    status: "error",
    message: "Votre compte a été créé, mais la connexion automatique a échoué. Veuillez vous connecter.",
  };
}

// ---------------------------------------------------------------------------
// Login - shared by the patient and the admin forms
// ---------------------------------------------------------------------------
async function signIn(formData: FormData, area: "patient" | "admin"): Promise<FormState> {
  const values = { email: text(formData, "email") };
  const parsed = loginSchema.safeParse({ ...values, password: text(formData, "password") });
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.code !== "invalid_credentials") logAuthError("signIn", error);
    return {
      status: "error",
      message: authErrorMessage(error),
      values,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();
    return { status: "error", message: GENERIC_AUTH_ERROR, values };
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();
    return {
      status: "error",
      message: "Votre compte a été désactivé. Veuillez contacter le cabinet.",
      values,
    };
  }

  if (area === "admin" && profile.role !== "admin") {
    await supabase.auth.signOut();
    // Deliberately vague: don't confirm that the account exists.
    return {
      status: "error",
      message: "Identifiants incorrects ou accès non autorisé à l'espace administrateur.",
      values,
    };
  }

  const fallback = homeFor(profile);
  const next = safeRedirect(text(formData, "next"), fallback);
  // Never send someone into the other area after login.
  const nextFitsRole =
    profile.role === "admin" ? next.startsWith("/admin") : !next.startsWith("/admin");
  redirect(nextFitsRole ? next : fallback);
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return signIn(formData, "patient");
}

export async function adminLoginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return signIn(formData, "admin");
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------
export async function logoutAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) logAuthError("signOut", error);
  redirect(text(formData, "area") === "admin" ? ADMIN_LOGIN : "/");
}

// ---------------------------------------------------------------------------
// Forgotten password: send the reset link
// ---------------------------------------------------------------------------
export async function forgotPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = { email: text(formData, "email") };
  const parsed = emailOnlySchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: confirmUrl("/auth/reset-password"),
  });

  // Rate limits are worth telling the user; any other error is hidden so the
  // form cannot reveal whether an address has an account.
  if (error) {
    logAuthError("resetPasswordForEmail", error);
    if (error.code?.startsWith("over_")) {
      return { status: "error", message: authErrorMessage(error), values };
    }
  }
  return {
    status: "success",
    message:
      "Si un compte existe avec cette adresse, un e-mail contenant un lien de réinitialisation vient d'être envoyé.",
  };
}

// ---------------------------------------------------------------------------
// Choose a new password (user arrives logged in from the reset link)
// ---------------------------------------------------------------------------
export async function resetPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = newPasswordSchema.safeParse({
    password: text(formData, "password"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) {
    return {
      status: "error",
      message: "Votre lien a expiré. Veuillez demander un nouveau lien de réinitialisation.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    logAuthError("updateUser(password)", error);
    return { status: "error", message: authErrorMessage(error) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", claims.claims.sub)
    .maybeSingle();
  redirect(`${profile?.role === "admin" ? ADMIN_HOME : PATIENT_HOME}?password=updated`);
}
