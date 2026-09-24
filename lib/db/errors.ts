/**
 * Translates the database's DKC_* error codes (raised by the SQL functions in
 * migration 0003) into French messages. Any other error is logged server-side
 * and shown as a generic message - raw SQL errors never reach the user.
 */
const MESSAGES: Record<string, string> = {
  DKC_NOT_AUTHENTICATED: "Votre session a expiré. Veuillez vous reconnecter.",
  DKC_FORBIDDEN: "Vous n'êtes pas autorisé à effectuer cette action.",
  DKC_SERVICE_UNAVAILABLE: "Cette prestation n'est plus disponible à la réservation.",
  DKC_LOCATION_NOT_OFFERED: "Cette prestation n'est pas proposée à ce lieu.",
  DKC_HOME_ADDRESS_REQUIRED: "Veuillez indiquer l'adresse de la visite à domicile.",
  DKC_SLOT_UNAVAILABLE:
    "Ce créneau n'est plus disponible. Veuillez en choisir un autre dans la liste.",
  DKC_SLOT_TAKEN: "Ce créneau vient d'être réservé par une autre personne. Choisissez-en un autre.",
  DKC_TOO_MANY_APPOINTMENTS:
    "Vous avez atteint le nombre maximum de rendez-vous à venir. Annulez-en un pour en réserver un nouveau.",
  DKC_NOT_FOUND: "Ce rendez-vous est introuvable.",
  DKC_INVALID_STATUS: "Cette action n'est pas possible pour ce rendez-vous.",
  DKC_TOO_LATE: "Ce rendez-vous a déjà commencé et ne peut plus être annulé en ligne.",
  DKC_NOT_STARTED: "Ce rendez-vous n'a pas encore eu lieu.",
};

export const GENERIC_DB_ERROR =
  "Une erreur est survenue. Veuillez réessayer dans un instant.";

/** Extracts the DKC_ code from a Postgres error message. */
export function dbErrorMessage(
  error: { message?: string; code?: string } | null | undefined,
  context: string,
): string {
  const raw = error?.message ?? "";
  const key = Object.keys(MESSAGES).find((code) => raw.includes(code));
  if (key) return MESSAGES[key];

  console.error(`[db] ${context} failed:`, error?.code ?? "unknown", raw.slice(0, 200));
  return GENERIC_DB_ERROR;
}
