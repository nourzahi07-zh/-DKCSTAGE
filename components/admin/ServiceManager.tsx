"use client";

import { useActionState, useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { saveServiceAction, toggleServiceAction } from "@/app/admin/(espace)/actions";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { initialFormState } from "@/lib/auth/form-state";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/constants";
import { formatDuration, formatPrice } from "@/lib/format";
import type { Service } from "@/lib/db/services";

/** Create / edit / activate / deactivate services. Deleting is never offered:
 *  a service used by an appointment must keep existing (foreign key). */
export function ServiceManager({ services }: { services: Service[] }) {
  const [editing, setEditing] = useState<Service | "new" | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setEditing("new")}>
          <Plus aria-hidden="true" className="size-4" />
          Nouvelle prestation
        </Button>
      </div>

      {editing && (
        <ServiceForm
          service={editing === "new" ? null : editing}
          onDone={() => setEditing(null)}
        />
      )}

      {CATEGORY_ORDER.filter((c) => services.some((s) => s.category === c)).map((category) => (
        <Card key={category}>
          <CardHeader title={CATEGORY_LABELS[category]} />
          <ul className="divide-y divide-ink-100">
            {services
              .filter((service) => service.category === category)
              .map((service) => (
                <li key={service.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <div className="min-w-[12rem] flex-1">
                    <p className="font-semibold text-ink-900">{service.name}</p>
                    <p className="text-xs text-ink-500">
                      {formatDuration(service.duration_minutes)} ·{" "}
                      {[service.at_cabinet && "cabinet", service.at_home && "domicile"]
                        .filter(Boolean)
                        .join(" / ")}
                    </p>
                  </div>
                  <p className="font-medium text-brand-800">{formatPrice(service.price)}</p>
                  {service.is_active ? (
                    <Badge tone="brand">Active</Badge>
                  ) : (
                    <Badge tone="neutral">Désactivée</Badge>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(service)}
                    >
                      <Pencil aria-hidden="true" className="size-4" />
                      Modifier
                    </Button>
                    <ToggleServiceButton id={service.id} isActive={service.is_active} />
                  </div>
                </li>
              ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}

function ToggleServiceButton({ id, isActive }: { id: string; isActive: boolean }) {
  const [state, action] = useActionState(toggleServiceAction, initialFormState);

  return (
    <form action={action}>
      <input type="hidden" name="serviceId" value={id} />
      <input type="hidden" name="activate" value={isActive ? "false" : "true"} />
      <SubmitButton variant={isActive ? "danger" : "secondary"} size="sm" pendingLabel="…">
        {isActive ? "Désactiver" : "Réactiver"}
      </SubmitButton>
      {state.status === "error" && (
        <span className="sr-only" role="alert">
          {state.message}
        </span>
      )}
    </form>
  );
}

function ServiceForm({ service, onDone }: { service: Service | null; onDone: () => void }) {
  const [state, action] = useActionState(saveServiceAction, initialFormState);
  const [priceType, setPriceType] = useState(service?.price_type ?? "session");

  if (state.status === "success") {
    return (
      <Card className="p-5">
        <Alert tone="success">{state.message}</Alert>
        <div className="mt-4">
          <Button type="button" variant="secondary" onClick={onDone}>
            Fermer
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={service ? "Modifier la prestation" : "Nouvelle prestation"}
        action={
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            <X aria-hidden="true" className="size-4" />
            Fermer
          </Button>
        }
      />
      <form action={action} className="space-y-4 p-5" noValidate>
        {state.status === "error" && state.message && <Alert tone="error">{state.message}</Alert>}
        {service && <input type="hidden" name="id" value={service.id} />}

        <Field
          label="Nom"
          name="name"
          required
          defaultValue={service?.name}
          errors={state.fieldErrors?.name}
        />

        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-ink-800">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={2000}
            defaultValue={service?.description ?? ""}
            className="block w-full rounded-lg border border-ink-300 px-3.5 py-2.5 text-ink-900 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-ink-800">
              Catégorie
            </label>
            <select
              id="category"
              name="category"
              defaultValue={service?.category ?? "massage"}
              className="block w-full rounded-lg border border-ink-300 px-3.5 py-2.5"
            >
              {CATEGORY_ORDER.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="priceType" className="mb-1.5 block text-sm font-medium text-ink-800">
              Type de tarif
            </label>
            <select
              id="priceType"
              name="priceType"
              value={priceType}
              onChange={(event) => setPriceType(event.target.value as "session" | "package")}
              className="block w-full rounded-lg border border-ink-300 px-3.5 py-2.5"
            >
              <option value="session">À la séance</option>
              <option value="package">Forfait / programme</option>
            </select>
          </div>

          <Field
            label="Tarif (MAD)"
            name="price"
            type="number"
            min={0}
            step="1"
            defaultValue={service?.price ?? ""}
            errors={state.fieldErrors?.price}
            hint="Laisser vide pour « Tarif sur demande »."
          />

          <Field
            label="Durée (minutes)"
            name="durationMinutes"
            type="number"
            min={15}
            max={480}
            step={15}
            required
            defaultValue={service?.duration_minutes ?? 60}
            errors={state.fieldErrors?.durationMinutes}
            hint="Multiple de 15 minutes."
          />

          {priceType === "package" && (
            <Field
              label="Séances incluses"
              name="sessionsIncluded"
              type="number"
              min={2}
              max={100}
              defaultValue={service?.sessions_included ?? ""}
              errors={state.fieldErrors?.sessionsIncluded}
              hint="Facultatif."
            />
          )}
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-ink-800">Disponibilité</legend>
          {state.fieldErrors?.atCabinet && (
            <p className="text-sm text-red-600">{state.fieldErrors.atCabinet[0]}</p>
          )}
          <label className="flex items-center gap-2.5 text-sm text-ink-700">
            <input
              type="checkbox"
              name="atCabinet"
              defaultChecked={service?.at_cabinet ?? true}
              className="size-4 rounded border-ink-300"
            />
            Proposée au cabinet
          </label>
          <label className="flex items-center gap-2.5 text-sm text-ink-700">
            <input
              type="checkbox"
              name="atHome"
              defaultChecked={service?.at_home ?? false}
              className="size-4 rounded border-ink-300"
            />
            Proposée à domicile
          </label>
          <label className="flex items-center gap-2.5 text-sm text-ink-700">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={service?.is_active ?? true}
              className="size-4 rounded border-ink-300"
            />
            Visible sur le site et réservable
          </label>
        </fieldset>

        <div className="flex gap-3">
          <SubmitButton pendingLabel="Enregistrement…">
            {service ? "Enregistrer" : "Créer la prestation"}
          </SubmitButton>
          <Button type="button" variant="ghost" onClick={onDone}>
            Annuler
          </Button>
        </div>
      </form>
    </Card>
  );
}
