"use client";

import { useActionState } from "react";
import { Check, CheckCheck, X } from "lucide-react";
import { setAppointmentStatusAction } from "@/app/admin/(espace)/actions";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { initialFormState } from "@/lib/auth/form-state";
import type { AppointmentStatus } from "@/lib/constants";

/**
 * Admin actions on one appointment. Only the transitions the database
 * accepts are offered (pending → confirmé → terminé, annulation possible
 * tant que le rendez-vous est actif); the database refuses anything else.
 */
export function StatusActions({
  appointmentId,
  status,
  hasStarted,
  size = "sm",
}: {
  appointmentId: string;
  status: AppointmentStatus;
  hasStarted: boolean;
  size?: "sm" | "md";
}) {
  const [state, action] = useActionState(setAppointmentStatusAction, initialFormState);

  if (status === "completed" || status === "cancelled") {
    return state.message ? <Alert tone="success">{state.message}</Alert> : null;
  }

  return (
    <div className="space-y-2">
      {state.status === "error" && <Alert tone="error">{state.message}</Alert>}
      <div className="flex flex-wrap gap-2">
        {status === "pending" && (
          <form action={action}>
            <input type="hidden" name="appointmentId" value={appointmentId} />
            <input type="hidden" name="status" value="confirmed" />
            <SubmitButton size={size} pendingLabel="…">
              <Check aria-hidden="true" className="size-4" />
              Confirmer
            </SubmitButton>
          </form>
        )}

        {status === "confirmed" && hasStarted && (
          <form action={action}>
            <input type="hidden" name="appointmentId" value={appointmentId} />
            <input type="hidden" name="status" value="completed" />
            <SubmitButton size={size} pendingLabel="…">
              <CheckCheck aria-hidden="true" className="size-4" />
              Marquer terminé
            </SubmitButton>
          </form>
        )}

        <form action={action}>
          <input type="hidden" name="appointmentId" value={appointmentId} />
          <input type="hidden" name="status" value="cancelled" />
          <SubmitButton size={size} variant="danger" pendingLabel="…">
            <X aria-hidden="true" className="size-4" />
            Annuler
          </SubmitButton>
        </form>
      </div>
      {status === "confirmed" && !hasStarted && (
        <p className="text-xs text-ink-500">
          « Terminé » sera disponible une fois la séance commencée.
        </p>
      )}
    </div>
  );
}
