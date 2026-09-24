/**
 * Translates Supabase Auth errors into French messages for the user.
 * Raw technical errors are never shown; unknown ones get a generic message
 * and are logged server-side by the caller.
 */
const MESSAGES: Record<string, string> = {
  invalid_credentials: "E-mail ou mot de passe incorrect.",
  email_not_confirmed:
    "Votre adresse e-mail n'est pas encore confirmée. Consultez votre boîte de réception.",
  weak_password: "Ce mot de passe est trop faible. Choisissez-en un plus long ou plus varié.",
  same_password: "Le nouveau mot de passe doit être différent de l'ancien.",
  over_email_send_rate_limit:
    "Trop d'e-mails envoyés. Veuillez patienter quelques minutes avant de réessayer.",
  over_request_rate_limit: "Trop de tentatives. Veuillez patienter quelques minutes.",
  signup_disabled: "Les inscriptions sont momentanément fermées.",
  otp_expired: "Ce lien a expiré ou a déjà été utilisé. Veuillez en demander un nouveau.",
  session_not_found: "Votre session a expiré. Veuillez vous reconnecter.",
};

export const GENERIC_AUTH_ERROR = "Une erreur est survenue. Veuillez réessayer dans un instant.";

export function authErrorMessage(error: { code?: string } | null | undefined): string {
  return (error?.code && MESSAGES[error.code]) || GENERIC_AUTH_ERROR;
}

/** Messages for ?error=... on the login pages (after a redirect). */
export const LOGIN_PAGE_ERRORS: Record<string, string> = {
  link: "Ce lien est invalide ou a expiré. Veuillez réessayer.",
  inactive: "Votre compte a été désactivé. Veuillez contacter le cabinet.",
};
