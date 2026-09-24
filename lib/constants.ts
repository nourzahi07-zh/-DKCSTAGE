import type { Enums } from "@/types/database";

/** French labels + styling for the database enums. One source for the whole UI. */

export type AppointmentStatus = Enums<"appointment_status">;
export type LocationType = Enums<"location_type">;
export type ServiceCategory = Enums<"service_category">;

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  completed: "Terminé",
  cancelled: "Annulé",
};

export const STATUS_STYLES: Record<AppointmentStatus, { badge: string; dot: string }> = {
  pending: { badge: "bg-sand-100 text-sand-800", dot: "bg-sand-500" },
  confirmed: { badge: "bg-brand-50 text-brand-700", dot: "bg-brand-500" },
  completed: { badge: "bg-ink-100 text-ink-700", dot: "bg-ink-400" },
  cancelled: { badge: "bg-red-50 text-red-700", dot: "bg-red-400" },
};

export const LOCATION_LABELS: Record<LocationType, string> = {
  cabinet: "Au cabinet",
  home: "À domicile",
};

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  kinesitherapie: "Kinésithérapie",
  massage: "Massages",
  hijama: "Hijama",
  diabetes_care: "Soins du diabète",
};

export const CATEGORY_DESCRIPTIONS: Record<ServiceCategory, string> = {
  kinesitherapie: "Rééducation et accompagnement du mouvement.",
  massage: "Massages de détente, thérapeutiques et sportifs, à la séance ou en forfait.",
  hijama: "Séances de hijama (thérapie par ventouses), au cabinet.",
  diabetes_care: "Programmes dédiés à l'accompagnement des patients diabétiques.",
};

/** Order used everywhere categories are listed. */
export const CATEGORY_ORDER: ServiceCategory[] = [
  "diabetes_care",
  "kinesitherapie",
  "massage",
  "hijama",
];

/** Booking rules mirrored from the database functions (display only). */
export const BOOKING_HORIZON_DAYS = 60;
export const BOOKING_NOTICE_HOURS = 2;

/** ISO weekday order used by availability_rules (1 = Monday). */
export const WEEKDAYS: { value: number; label: string; short: string }[] = [
  { value: 1, label: "Lundi", short: "Lun" },
  { value: 2, label: "Mardi", short: "Mar" },
  { value: 3, label: "Mercredi", short: "Mer" },
  { value: 4, label: "Jeudi", short: "Jeu" },
  { value: 5, label: "Vendredi", short: "Ven" },
  { value: 6, label: "Samedi", short: "Sam" },
  { value: 7, label: "Dimanche", short: "Dim" },
];
