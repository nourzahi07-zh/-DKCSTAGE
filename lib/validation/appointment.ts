import { z } from "zod";

/** Shapes accepted by the patient/admin Server Actions. */

export const uuid = z.uuid("Identifiant invalide.");
export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.");
export const isoTime = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure invalide.");

export const bookingSchema = z
  .object({
    serviceId: uuid,
    date: isoDate,
    startTime: isoTime,
    location: z.enum(["cabinet", "home"], { error: "Veuillez choisir le lieu de la séance." }),
    homeAddress: z
      .string()
      .trim()
      .max(300, "Adresse trop longue (300 caractères maximum).")
      .optional()
      .default(""),
    notes: z.string().trim().max(500, "Message trop long (500 caractères maximum).").optional().default(""),
  })
  .refine((d) => d.location !== "home" || d.homeAddress.length >= 5, {
    path: ["homeAddress"],
    message: "Veuillez indiquer l'adresse complète de la visite à domicile.",
  });

export const slotQuerySchema = z.object({ serviceId: uuid, date: isoDate });

export const appointmentIdSchema = z.object({ appointmentId: uuid });

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Veuillez indiquer votre nom complet.").max(100, "Nom trop long."),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/(?!^\+)[^0-9]/g, ""))
    .pipe(z.string().regex(/^\+?[0-9]{8,15}$/, "Numéro de téléphone invalide.")),
  dateOfBirth: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Date de naissance invalide.")
    .refine((v) => v === "" || v <= new Date().toISOString().slice(0, 10), {
      message: "La date de naissance ne peut pas être dans le futur.",
    }),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Veuillez saisir votre mot de passe actuel."),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
      .max(72)
      .regex(/[A-Za-z]/, "Le mot de passe doit contenir au moins une lettre.")
      .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre."),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas.",
  })
  .refine((d) => d.password !== d.currentPassword, {
    path: ["password"],
    message: "Le nouveau mot de passe doit être différent de l'ancien.",
  });

// --- Admin -----------------------------------------------------------------

export const statusChangeSchema = z.object({
  appointmentId: uuid,
  status: z.enum(["confirmed", "completed", "cancelled"]),
});

export const serviceSchema = z.object({
  id: uuid.optional(),
  name: z.string().trim().min(2, "Nom trop court.").max(120, "Nom trop long."),
  description: z.string().trim().max(2000, "Description trop longue.").optional().default(""),
  category: z.enum(["kinesitherapie", "massage", "hijama", "diabetes_care"]),
  price: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0), "Tarif invalide."),
  priceType: z.enum(["session", "package"]),
  sessionsIncluded: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine(
      (v) => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 2 && Number(v) <= 100),
      "Nombre de séances invalide (entre 2 et 100).",
    ),
  durationMinutes: z
    .string()
    .trim()
    .refine(
      (v) => Number.isInteger(Number(v)) && Number(v) >= 15 && Number(v) <= 480 && Number(v) % 15 === 0,
      "Durée invalide : un multiple de 15 minutes, entre 15 et 480.",
    ),
  atCabinet: z.boolean(),
  atHome: z.boolean(),
  isActive: z.boolean(),
}).refine((d) => d.atCabinet || d.atHome, {
  path: ["atCabinet"],
  message: "La prestation doit être proposée au cabinet et/ou à domicile.",
});

export const availabilityRuleSchema = z
  .object({
    weekday: z.coerce.number().int().min(1).max(7),
    startTime: isoTime,
    endTime: isoTime,
  })
  .refine((d) => d.startTime < d.endTime, {
    path: ["endTime"],
    message: "L'heure de fin doit être après l'heure de début.",
  });

export const availabilityExceptionSchema = z
  .object({
    date: isoDate,
    isClosed: z.boolean(),
    startTime: z.string().trim().optional().default(""),
    endTime: z.string().trim().optional().default(""),
    reason: z.string().trim().max(200, "Motif trop long.").optional().default(""),
  })
  .refine(
    (d) =>
      d.isClosed ||
      (/^([01]\d|2[0-3]):[0-5]\d$/.test(d.startTime) &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(d.endTime) &&
        d.startTime < d.endTime),
    { path: ["startTime"], message: "Indiquez des horaires valides (début avant fin)." },
  );

export const patientStatusSchema = z.object({
  patientId: uuid,
  isActive: z.boolean(),
});
