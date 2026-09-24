"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CalendarX,
  Check,
  Clock,
  Home,
  MapPin,
  Tag,
} from "lucide-react";
import { bookAppointmentAction, fetchSlotsAction } from "@/app/patient/actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, Spinner } from "@/components/ui/States";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { initialFormState } from "@/lib/auth/form-state";
import { BOOKING_HORIZON_DAYS, CATEGORY_LABELS, CATEGORY_ORDER, LOCATION_LABELS } from "@/lib/constants";
import { dateInDays, formatDate, formatDuration, formatPrice, formatTime, todayInMorocco } from "@/lib/format";
import { cn } from "@/lib/ui";
import type { Service } from "@/lib/db/services";
import type { Slot } from "@/lib/db/availability";

type LocationChoice = "cabinet" | "home";

const STEPS = ["Prestation", "Lieu", "Date & heure", "Confirmation"] as const;

/**
 * Four-step booking flow. The slots come from the database function
 * get_available_slots, and the booking itself goes through book_appointment,
 * which re-checks everything server-side - this component cannot bypass it.
 */
export function BookingWizard({
  services,
  preselectedServiceId,
  defaultAddress,
}: {
  services: Service[];
  preselectedServiceId?: string;
  defaultAddress?: string;
}) {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(preselectedServiceId ? 1 : 0);
  const [serviceId, setServiceId] = useState(preselectedServiceId ?? "");
  const [location, setLocation] = useState<LocationChoice | "">("");
  const [homeAddress, setHomeAddress] = useState(defaultAddress ?? "");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [notes, setNotes] = useState("");

  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [loadingSlots, startLoadingSlots] = useTransition();

  const [state, action] = useActionState(bookAppointmentAction, initialFormState);

  const service = useMemo(() => services.find((s) => s.id === serviceId), [services, serviceId]);
  const minDate = todayInMorocco();
  const maxDate = dateInDays(BOOKING_HORIZON_DAYS);

  // Load the bookable times whenever the service or the date changes.
  useEffect(() => {
    if (!serviceId || !date) return;
    startLoadingSlots(async () => {
      const result = await fetchSlotsAction(serviceId, date);
      setSlots(result.slots);
      setSlotsError(result.error ?? null);
    });
  }, [serviceId, date]);

  function chooseDate(value: string) {
    setDate(value);
    setStartTime("");
    setSlots([]);
    setSlotsError(null);
  }

  function chooseService(id: string) {
    setServiceId(id);
    const next = services.find((s) => s.id === id);
    // Keep a location only if the new service still offers it.
    if (location === "cabinet" && !next?.at_cabinet) setLocation("");
    if (location === "home" && !next?.at_home) setLocation("");
    setDate("");
    setStartTime("");
    setSlots([]);
    setStep(1);
  }

  const canContinue = [
    Boolean(serviceId),
    Boolean(location) && (location !== "home" || homeAddress.trim().length >= 5),
    Boolean(date && startTime),
    true,
  ][step];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
      <div>
        <Stepper step={step} onStepClick={(i) => i < step && setStep(i)} />

        {state.message && (
          <div className="mt-6">
            <Alert tone="error">{state.message}</Alert>
          </div>
        )}

        <div className="mt-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, x: -16 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {step === 0 && <ServiceStep services={services} onChoose={chooseService} />}

              {step === 1 && service && (
                <LocationStep
                  service={service}
                  location={location}
                  setLocation={setLocation}
                  homeAddress={homeAddress}
                  setHomeAddress={setHomeAddress}
                  addressError={state.fieldErrors?.homeAddress?.[0]}
                />
              )}

              {step === 2 && service && (
                <DateTimeStep
                  date={date}
                  setDate={chooseDate}
                  minDate={minDate}
                  maxDate={maxDate}
                  slots={slots}
                  loading={loadingSlots}
                  error={slotsError}
                  startTime={startTime}
                  setStartTime={setStartTime}
                  duration={service.duration_minutes}
                />
              )}

              {step === 3 && service && location && (
                <ConfirmStep
                  service={service}
                  location={location}
                  homeAddress={homeAddress}
                  date={date}
                  startTime={startTime}
                  notes={notes}
                  setNotes={setNotes}
                  action={action}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {step < 3 && (
          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Retour
            </Button>
            <Button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canContinue}>
              Continuer
            </Button>
          </div>
        )}
        {step === 3 && (
          <div className="mt-6">
            <Button type="button" variant="ghost" onClick={() => setStep(2)}>
              <ArrowLeft aria-hidden="true" className="size-4" />
              Modifier le créneau
            </Button>
          </div>
        )}
      </div>

      <Summary
        service={service}
        location={location}
        homeAddress={homeAddress}
        date={date}
        startTime={startTime}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

function Stepper({ step, onStepClick }: { step: number; onStepClick: (index: number) => void }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 sm:gap-3">
      {STEPS.map((label, index) => {
        const done = index < step;
        const current = index === step;
        return (
          <li key={label} className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => onStepClick(index)}
              disabled={!done}
              aria-current={current ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                current && "bg-brand-700 text-white",
                done && "bg-brand-50 text-brand-700 hover:bg-brand-100",
                !current && !done && "text-ink-400",
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-xs font-semibold",
                  current ? "bg-white/20" : done ? "bg-brand-200/60" : "bg-ink-100",
                )}
              >
                {done ? <Check aria-hidden="true" className="size-3" /> : index + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
            {index < STEPS.length - 1 && (
              <span aria-hidden="true" className="h-px w-4 bg-ink-200 sm:w-6" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ServiceStep({
  services,
  onChoose,
}: {
  services: Service[];
  onChoose: (id: string) => void;
}) {
  const categories = CATEGORY_ORDER.filter((c) => services.some((s) => s.category === c));

  return (
    <div className="space-y-8">
      <h2 className="font-display text-xl font-semibold text-ink-900">
        Quelle prestation souhaitez-vous réserver ?
      </h2>

      {categories.map((category) => (
        <section key={category}>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
            {CATEGORY_LABELS[category]}
          </h3>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {services
              .filter((s) => s.category === category)
              .map((service) => (
                <li key={service.id}>
                  <button
                    type="button"
                    onClick={() => onChoose(service.id)}
                    className="h-full w-full rounded-2xl border border-ink-200/70 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card"
                  >
                    <p className="font-semibold text-ink-900">{service.name}</p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock aria-hidden="true" className="size-3.5" />
                        {formatDuration(service.duration_minutes)}
                      </span>
                      <span className="font-medium text-brand-700">{formatPrice(service.price)}</span>
                    </p>
                  </button>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function LocationStep({
  service,
  location,
  setLocation,
  homeAddress,
  setHomeAddress,
  addressError,
}: {
  service: Service;
  location: LocationChoice | "";
  setLocation: (value: LocationChoice) => void;
  homeAddress: string;
  setHomeAddress: (value: string) => void;
  addressError?: string;
}) {
  const options = [
    { value: "cabinet" as const, icon: Building2, available: service.at_cabinet, hint: "Ville Nouvelle, Fès" },
    { value: "home" as const, icon: Home, available: service.at_home, hint: "Le cabinet se déplace chez vous" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-semibold text-ink-900">Où souhaitez-vous être reçu ?</h2>

      <fieldset>
        <legend className="sr-only">Lieu de la séance</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all",
                location === option.value
                  ? "border-brand-600 bg-brand-50/60 shadow-card"
                  : "border-ink-200/70 bg-white hover:border-brand-300",
                !option.available && "cursor-not-allowed opacity-50 hover:border-ink-200/70",
              )}
            >
              <input
                type="radio"
                name="location-choice"
                className="sr-only"
                checked={location === option.value}
                disabled={!option.available}
                onChange={() => setLocation(option.value)}
              />
              <option.icon aria-hidden="true" className="mt-0.5 size-5 text-brand-700" />
              <span>
                <span className="block font-semibold text-ink-900">
                  {LOCATION_LABELS[option.value]}
                </span>
                <span className="mt-1 block text-sm text-ink-500">
                  {option.available ? option.hint : "Non proposé pour cette prestation"}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {location === "home" && (
        <div>
          <label htmlFor="homeAddress" className="mb-1.5 block text-sm font-medium text-ink-800">
            Adresse de la visite
          </label>
          <textarea
            id="homeAddress"
            value={homeAddress}
            onChange={(event) => setHomeAddress(event.target.value)}
            rows={3}
            maxLength={300}
            required
            aria-invalid={Boolean(addressError) || undefined}
            aria-describedby="homeAddress-hint"
            className="block w-full rounded-xl border border-ink-300 bg-white px-3.5 py-2.5 text-ink-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
            placeholder="Numéro, rue, quartier, étage, ville…"
          />
          <p id="homeAddress-hint" className="mt-1.5 text-xs text-ink-500">
            {addressError ?? "Indiquez une adresse complète pour que le cabinet puisse se déplacer."}
          </p>
        </div>
      )}
    </div>
  );
}

function DateTimeStep({
  date,
  setDate,
  minDate,
  maxDate,
  slots,
  loading,
  error,
  startTime,
  setStartTime,
  duration,
}: {
  date: string;
  setDate: (value: string) => void;
  minDate: string;
  maxDate: string;
  slots: Slot[];
  loading: boolean;
  error: string | null;
  startTime: string;
  setStartTime: (value: string) => void;
  duration: number;
}) {
  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-semibold text-ink-900">
        Choisissez une date et un créneau
      </h2>

      <div>
        <label htmlFor="date" className="mb-1.5 block text-sm font-medium text-ink-800">
          Date du rendez-vous
        </label>
        <input
          id="date"
          type="date"
          value={date}
          min={minDate}
          max={maxDate}
          onChange={(event) => setDate(event.target.value)}
          className="block w-full rounded-xl border border-ink-300 bg-white px-3.5 py-2.5 text-ink-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 sm:max-w-xs"
        />
        <p className="mt-1.5 text-xs text-ink-500">
          Réservation possible jusqu&apos;à {BOOKING_HORIZON_DAYS} jours à l&apos;avance.
        </p>
      </div>

      {!date && (
        <Card className="p-6 text-sm text-ink-600">
          Sélectionnez une date pour afficher les créneaux réellement disponibles.
        </Card>
      )}

      {date && loading && (
        <div className="flex items-center gap-3 rounded-2xl border border-ink-200/70 bg-white p-6 text-sm text-ink-600">
          <Spinner className="text-brand-600" />
          Recherche des créneaux disponibles…
        </div>
      )}

      {date && !loading && error && <Alert tone="error">{error}</Alert>}

      {date && !loading && !error && slots.length === 0 && (
        <EmptyState
          icon={<CalendarX aria-hidden="true" className="size-6" />}
          title="Aucun créneau disponible ce jour-là"
          description="Le cabinet est fermé ou complet à cette date. Essayez une autre journée."
        />
      )}

      {date && !loading && slots.length > 0 && (
        <fieldset>
          <legend className="text-sm font-medium text-ink-800">
            Créneaux disponibles — séance de {formatDuration(duration)}
          </legend>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
            {slots.map((slot) => {
              const value = formatTime(slot.start_time);
              const selected = startTime === value;
              return (
                <label
                  key={slot.start_time}
                  className={cn(
                    "cursor-pointer rounded-xl border px-2 py-2.5 text-center text-sm font-semibold transition-all",
                    selected
                      ? "border-brand-600 bg-brand-700 text-white shadow-card"
                      : "border-ink-200 bg-white text-ink-800 hover:-translate-y-0.5 hover:border-brand-300",
                  )}
                >
                  <input
                    type="radio"
                    name="slot"
                    className="sr-only"
                    checked={selected}
                    onChange={() => setStartTime(value)}
                  />
                  {value}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}
    </div>
  );
}

function ConfirmStep({
  service,
  location,
  homeAddress,
  date,
  startTime,
  notes,
  setNotes,
  action,
}: {
  service: Service;
  location: LocationChoice;
  homeAddress: string;
  date: string;
  startTime: string;
  notes: string;
  setNotes: (value: string) => void;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="space-y-6">
      <h2 className="font-display text-xl font-semibold text-ink-900">Confirmez votre rendez-vous</h2>

      <input type="hidden" name="serviceId" value={service.id} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="startTime" value={startTime} />
      <input type="hidden" name="location" value={location} />
      <input type="hidden" name="homeAddress" value={location === "home" ? homeAddress : ""} />

      <Card className="divide-y divide-ink-100">
        <Row icon={Tag} label="Prestation" value={`${service.name} · ${formatPrice(service.price)}`} />
        <Row icon={CalendarDays} label="Date" value={formatDate(date)} />
        <Row
          icon={Clock}
          label="Heure"
          value={`${startTime} · ${formatDuration(service.duration_minutes)}`}
        />
        <Row
          icon={location === "home" ? Home : MapPin}
          label="Lieu"
          value={location === "home" ? `À domicile — ${homeAddress}` : "Au cabinet, Fès"}
        />
      </Card>

      <div>
        <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-ink-800">
          Message pour le cabinet <span className="font-normal text-ink-500">(facultatif)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={500}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="block w-full rounded-xl border border-ink-300 bg-white px-3.5 py-2.5 text-ink-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
          placeholder="Une information utile pour votre séance…"
        />
        <p className="mt-1.5 text-xs text-ink-500">
          N&apos;indiquez pas d&apos;informations médicales détaillées ici.
        </p>
      </div>

      <Alert tone="info">
        Votre demande sera enregistrée comme <strong>en attente</strong>. Le cabinet la confirme
        ensuite ; vous retrouverez son statut dans votre espace patient.
      </Alert>

      <SubmitButton pendingLabel="Réservation en cours…">Confirmer le rendez-vous</SubmitButton>
    </form>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Tag;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4">
      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-600" />
      <div>
        <p className="text-sm text-ink-500">{label}</p>
        <p className="font-medium text-ink-900">{value}</p>
      </div>
    </div>
  );
}

function Summary({
  service,
  location,
  homeAddress,
  date,
  startTime,
}: {
  service?: Service;
  location: LocationChoice | "";
  homeAddress: string;
  date: string;
  startTime: string;
}) {
  return (
    <Card className="p-5 lg:sticky lg:top-24">
      <p className="text-sm font-semibold uppercase tracking-wide text-ink-500">Votre sélection</p>
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-ink-500">Prestation</dt>
          <dd className="font-medium text-ink-900">{service?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-ink-500">Lieu</dt>
          <dd className="font-medium text-ink-900">
            {location ? LOCATION_LABELS[location] : "—"}
            {location === "home" && homeAddress && (
              <span className="mt-0.5 block text-xs font-normal text-ink-500">{homeAddress}</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-ink-500">Date et heure</dt>
          <dd className="font-medium text-ink-900">
            {date ? formatDate(date, "short") : "—"}
            {startTime && ` · ${startTime}`}
          </dd>
        </div>
        {service && (
          <div className="border-t border-ink-100 pt-3">
            <dt className="text-ink-500">Tarif indiqué</dt>
            <dd className="font-display text-lg font-semibold text-brand-800">
              {formatPrice(service.price)}
            </dd>
          </div>
        )}
      </dl>
    </Card>
  );
}
