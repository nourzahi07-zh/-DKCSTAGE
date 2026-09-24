"use client";

import { useActionState } from "react";
import { setPatientStatusAction } from "@/app/admin/(espace)/actions";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { initialFormState } from "@/lib/auth/form-state";

/**
 * Deactivating a patient never deletes anything: the account and its
 * appointment history are kept, the patient simply can't sign in any more.
 */
export function PatientStatusButton({
  patientId,
  isActive,
}: {
  patientId: string;
  isActive: boolean;
}) {
  const [state, action] = useActionState(setPatientStatusAction, initialFormState);

  return (
    <div className="space-y-2">
      {state.message && (
        <Alert tone={state.status === "success" ? "success" : "error"}>{state.message}</Alert>
      )}
      <form action={action}>
        <input type="hidden" name="patientId" value={patientId} />
        <input type="hidden" name="isActive" value={isActive ? "false" : "true"} />
        <SubmitButton
          variant={isActive ? "danger" : "secondary"}
          size="sm"
          pendingLabel="Enregistrement…"
        >
          {isActive ? "Désactiver le compte" : "Réactiver le compte"}
        </SubmitButton>
      </form>
      <p className="text-xs text-ink-500">
        {isActive
          ? "Le patient ne pourra plus se connecter. Son historique est conservé."
          : "Le patient pourra de nouveau se connecter et réserver."}
      </p>
    </div>
  );
}
