"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { cancelAppointmentAction } from "@/app/patient/actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { initialFormState } from "@/lib/auth/form-state";

/**
 * Cancel button + confirmation dialog. The database re-checks ownership and
 * timing, so a forged request cannot cancel someone else's appointment.
 */
export function CancelAppointmentButton({
  appointmentId,
  size = "md",
}: {
  appointmentId: string;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(cancelAppointmentAction, initialFormState);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Once the cancellation succeeds the dialog is simply no longer rendered,
  // rather than being closed from an effect.
  const showDialog = open && state.status !== "success";

  useEffect(() => {
    if (!showDialog) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [showDialog]);

  return (
    <div>
      {state.status === "success" && <Alert tone="success">{state.message}</Alert>}
      {state.status === "error" && <Alert tone="error">{state.message}</Alert>}

      {state.status !== "success" && (
        <Button type="button" variant="danger" size={size} onClick={() => setOpen(true)}>
          Annuler le rendez-vous
        </Button>
      )}

      {showDialog && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/40 p-4 backdrop-blur-sm sm:items-center"
          onClick={(event) => event.target === event.currentTarget && setOpen(false)}
        >
          <div
            ref={dialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cancel-title"
            aria-describedby="cancel-text"
            tabIndex={-1}
            className="w-full max-w-md animate-rise rounded-2xl bg-white p-6 shadow-lift"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertTriangle aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2 id="cancel-title" className="font-display text-lg font-semibold text-ink-900">
                  Annuler ce rendez-vous ?
                </h2>
                <p id="cancel-text" className="mt-1.5 text-sm text-ink-600">
                  Le créneau sera à nouveau proposé à d&apos;autres patients. Cette action est
                  définitive : vous devrez réserver un nouveau rendez-vous.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Conserver
              </Button>
              <form action={action}>
                <input type="hidden" name="appointmentId" value={appointmentId} />
                <SubmitButton variant="destructive" pendingLabel="Annulation…">
                  Oui, annuler
                </SubmitButton>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
