/**
 * Verified DKC information - the single source used by the website AND the
 * chatbot. Never invent values here: anything unknown stays `null` and is
 * simply not displayed.
 */
export const CABINET = {
  name: "DKC",
  fullName: "Diabète Kiné Care",
  founder: "Rihab",
  founderTitle: "Kinésithérapeute",
  city: "Fès",
  country: "Maroc",
  address: "18 Rue Ibnou Rochd, V.N., Étage 1, Bureau 3, Fès, Maroc 30000",
  homeService: true,
  // Not provided yet - fill in when known (see README "Cabinet information").
  phone: null as string | null,
  whatsapp: null as string | null,
  email: null as string | null,
  mapsUrl: null as string | null,
  instagram: null as string | null,
};

/** Timezone used for every date/time decision in the app. */
export const APP_TIMEZONE = "Africa/Casablanca";
