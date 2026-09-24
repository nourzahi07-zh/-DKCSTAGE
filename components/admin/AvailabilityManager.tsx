"use client";

import { useActionState } from "react";
import { CalendarOff, Plus, Trash2 } from "lucide-react";
import {
  addAvailabilityExceptionAction,
  addAvailabilityRuleAction,
  deleteAvailabilityExceptionAction,
  deleteAvailabilityRuleAction,
} from "@/app/admin/(espace)/actions";
import { Alert } from "@/components/ui/Alert";
import { Card, CardHeader } from "@/components/ui/Card";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { initialFormState } from "@/lib/auth/form-state";
import { WEEKDAYS } from "@/lib/constants";
import { formatDate, formatTime, todayInMorocco } from "@/lib/format";
import type { Tables } from "@/types/database";

/**
 * Weekly opening hours + dated exceptions. These feed get_available_slots,
 * so what is configured here is exactly what patients can book.
 */
export function AvailabilityManager({
  rules,
  exceptions,
}: {
  rules: Tables<"availability_rules">[];
  exceptions: Tables<"availability_exceptions">[];
}) {
  const [ruleState, addRule] = useActionState(addAvailabilityRuleAction, initialFormState);
  const [exceptionState, addException] = useActionState(
    addAvailabilityExceptionAction,
    initialFormState,
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Horaires hebdomadaires"
          description="Les créneaux réservables sont générés toutes les 30 minutes à l'intérieur de ces plages."
        />

        <div className="space-y-4 p-5">
          {ruleState.message && (
            <Alert tone={ruleState.status === "success" ? "success" : "error"}>
              {ruleState.message}
            </Alert>
          )}

          <form action={addRule} className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="weekday" className="mb-1 block text-xs font-medium text-ink-600">
                Jour
              </label>
              <select
                id="weekday"
                name="weekday"
                className="rounded-lg border border-ink-300 px-3 py-2 text-sm"
              >
                {WEEKDAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="startTime" className="mb-1 block text-xs font-medium text-ink-600">
                De
              </label>
              <input
                id="startTime"
                name="startTime"
                type="time"
                step={900}
                defaultValue="09:00"
                required
                className="rounded-lg border border-ink-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="endTime" className="mb-1 block text-xs font-medium text-ink-600">
                À
              </label>
              <input
                id="endTime"
                name="endTime"
                type="time"
                step={900}
                defaultValue="17:00"
                required
                className="rounded-lg border border-ink-300 px-3 py-2 text-sm"
              />
            </div>
            <SubmitButton size="sm" pendingLabel="Ajout…">
              <Plus aria-hidden="true" className="size-4" />
              Ajouter
            </SubmitButton>
          </form>
          {ruleState.fieldErrors?.endTime && (
            <p className="text-sm text-red-600">{ruleState.fieldErrors.endTime[0]}</p>
          )}
        </div>

        <ul className="divide-y divide-ink-100 border-t border-ink-100">
          {WEEKDAYS.map((day) => {
            const dayRules = rules.filter((rule) => rule.weekday === day.value);
            return (
              <li key={day.value} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <span className="w-24 text-sm font-semibold text-ink-900">{day.label}</span>
                {dayRules.length === 0 ? (
                  <span className="text-sm text-ink-400">Fermé</span>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {dayRules.map((rule) => (
                      <li key={rule.id}>
                        <DeleteRuleButton
                          id={rule.id}
                          label={`${formatTime(rule.start_time)} – ${formatTime(rule.end_time)}`}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <CardHeader
          title="Exceptions"
          description="Fermeture ponctuelle ou horaires différents pour une date précise. Une exception remplace les horaires habituels de ce jour."
        />

        <div className="space-y-4 p-5">
          {exceptionState.message && (
            <Alert tone={exceptionState.status === "success" ? "success" : "error"}>
              {exceptionState.message}
            </Alert>
          )}

          <form action={addException} className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="date" className="mb-1 block text-xs font-medium text-ink-600">
                Date
              </label>
              <input
                id="date"
                name="date"
                type="date"
                min={todayInMorocco()}
                required
                className="rounded-lg border border-ink-300 px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 pb-2 text-sm text-ink-700">
              <input type="checkbox" name="isClosed" className="size-4 rounded border-ink-300" />
              Fermé toute la journée
            </label>
            <div>
              <label htmlFor="exStart" className="mb-1 block text-xs font-medium text-ink-600">
                De
              </label>
              <input
                id="exStart"
                name="startTime"
                type="time"
                step={900}
                className="rounded-lg border border-ink-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="exEnd" className="mb-1 block text-xs font-medium text-ink-600">
                À
              </label>
              <input
                id="exEnd"
                name="endTime"
                type="time"
                step={900}
                className="rounded-lg border border-ink-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="min-w-[12rem] flex-1">
              <label htmlFor="reason" className="mb-1 block text-xs font-medium text-ink-600">
                Motif (facultatif)
              </label>
              <input
                id="reason"
                name="reason"
                maxLength={200}
                className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
              />
            </div>
            <SubmitButton size="sm" pendingLabel="Ajout…">
              <Plus aria-hidden="true" className="size-4" />
              Ajouter
            </SubmitButton>
          </form>
          {exceptionState.fieldErrors?.startTime && (
            <p className="text-sm text-red-600">{exceptionState.fieldErrors.startTime[0]}</p>
          )}
        </div>

        {exceptions.length > 0 ? (
          <ul className="divide-y divide-ink-100 border-t border-ink-100">
            {exceptions.map((exception) => (
              <li key={exception.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <span className="text-sm font-semibold capitalize text-ink-900">
                  {formatDate(exception.date)}
                </span>
                {exception.is_closed ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                    <CalendarOff aria-hidden="true" className="size-3.5" />
                    Fermé
                  </span>
                ) : (
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                    {formatTime(exception.start_time!)} – {formatTime(exception.end_time!)}
                  </span>
                )}
                {exception.reason && <span className="text-sm text-ink-500">{exception.reason}</span>}
                <div className="ml-auto">
                  <DeleteExceptionButton id={exception.id} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-t border-ink-100 px-5 py-4 text-sm text-ink-500">
            Aucune exception à venir.
          </p>
        )}
      </Card>
    </div>
  );
}

function DeleteRuleButton({ id, label }: { id: string; label: string }) {
  const [, action] = useActionState(deleteAvailabilityRuleAction, initialFormState);

  return (
    <form action={action}>
      <input type="hidden" name="ruleId" value={id} />
      <button
        type="submit"
        className="group inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 transition-colors hover:bg-red-50 hover:text-red-700"
      >
        {label}
        <Trash2 aria-hidden="true" className="size-3.5" />
        <span className="sr-only">Supprimer ce créneau</span>
      </button>
    </form>
  );
}

function DeleteExceptionButton({ id }: { id: string }) {
  const [, action] = useActionState(deleteAvailabilityExceptionAction, initialFormState);

  return (
    <form action={action}>
      <input type="hidden" name="exceptionId" value={id} />
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-ink-500 transition-colors hover:bg-red-50 hover:text-red-700"
      >
        <Trash2 aria-hidden="true" className="size-4" />
        Supprimer
      </button>
    </form>
  );
}
