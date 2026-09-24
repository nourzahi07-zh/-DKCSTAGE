import { z } from "zod";

/** Form schemas for authentication. Messages are shown to the user (French). */

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Adresse e-mail trop longue.")
  .pipe(z.email("Adresse e-mail invalide."));

const password = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
  .max(72, "Le mot de passe doit contenir au plus 72 caractères.")
  .regex(/[A-Za-z]/, "Le mot de passe doit contenir au moins une lettre.")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre.");

// Keeps only digits and a leading "+", e.g. "06 12-34.56.78" -> "0612345678".
// Same format as the database check on profiles.phone.
const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/(?!^\+)[^0-9]/g, ""))
  .pipe(z.string().regex(/^\+?[0-9]{8,15}$/, "Numéro de téléphone invalide."));

const fullName = z
  .string()
  .trim()
  .min(2, "Veuillez indiquer votre nom complet.")
  .max(100, "Nom trop long.");

export const registerSchema = z
  .object({
    fullName,
    email,
    phone,
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas.",
  });

export const loginSchema = z.object({
  email,
  // No strength rules at login: only the server decides if it's correct.
  password: z.string().min(1, "Veuillez saisir votre mot de passe.").max(72),
});

export const emailOnlySchema = z.object({ email });

export const newPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas.",
  });

/** Turns a zod error into { field: [messages] } for the form. */
export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}
