"use client";

import { useActionState } from "react";
import { changePasswordAction, updateProfileAction } from "@/app/patient/actions";
import { Alert } from "@/components/ui/Alert";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { initialFormState } from "@/lib/auth/form-state";

/** Patient profile form. E-mail and role are not editable here by design. */
export function ProfileForm({
  fullName,
  phone,
  dateOfBirth,
}: {
  fullName: string;
  phone: string | null;
  dateOfBirth: string | null;
}) {
  const [state, action] = useActionState(updateProfileAction, initialFormState);

  return (
    <form action={action} className="space-y-4 p-5 sm:p-6" noValidate>
      {state.status === "success" && <Alert tone="success">{state.message}</Alert>}
      {state.status === "error" && state.message && <Alert tone="error">{state.message}</Alert>}

      <Field
        label="Nom complet"
        name="fullName"
        autoComplete="name"
        required
        defaultValue={fullName}
        errors={state.fieldErrors?.fullName}
      />
      <Field
        label="Téléphone"
        name="phone"
        type="tel"
        autoComplete="tel"
        required
        defaultValue={phone ?? ""}
        errors={state.fieldErrors?.phone}
      />
      <Field
        label="Date de naissance"
        name="dateOfBirth"
        type="date"
        defaultValue={dateOfBirth ?? ""}
        errors={state.fieldErrors?.dateOfBirth}
        hint="Facultatif."
      />
      <SubmitButton pendingLabel="Enregistrement…">Enregistrer</SubmitButton>
    </form>
  );
}

/** Password change, used by the patient profile and the admin account page. */
export function PasswordForm() {
  const [state, action] = useActionState(changePasswordAction, initialFormState);

  return (
    <form action={action} className="space-y-4 p-5 sm:p-6" noValidate>
      {state.status === "success" && <Alert tone="success">{state.message}</Alert>}
      {state.status === "error" && state.message && <Alert tone="error">{state.message}</Alert>}

      <Field
        label="Mot de passe actuel"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        required
        errors={state.fieldErrors?.currentPassword}
      />
      <Field
        label="Nouveau mot de passe"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        errors={state.fieldErrors?.password}
        hint="Au moins 8 caractères, dont une lettre et un chiffre."
      />
      <Field
        label="Confirmer le nouveau mot de passe"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        errors={state.fieldErrors?.confirmPassword}
      />
      <SubmitButton variant="secondary" pendingLabel="Modification…">
        Modifier le mot de passe
      </SubmitButton>
    </form>
  );
}
