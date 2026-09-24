"use client";

import { useActionState } from "react";
import { forgotPasswordAction, resetPasswordAction } from "@/app/auth/actions";
import { initialFormState } from "@/lib/auth/form-state";
import { Alert } from "@/components/ui/Alert";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

/** Step 1: ask for the e-mail and send the reset link. */
export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, initialFormState);

  if (state.status === "success") return <Alert tone="success">{state.message}</Alert>;

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message && <Alert tone="error">{state.message}</Alert>}
      <Field
        label="Adresse e-mail"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
      />
      <SubmitButton pendingLabel="Envoi…" className="w-full">Recevoir le lien</SubmitButton>
    </form>
  );
}

/** Step 2: the user opened the e-mail link and chooses a new password. */
export function ResetPasswordForm() {
  const [state, action] = useActionState(resetPasswordAction, initialFormState);

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message && <Alert tone="error">{state.message}</Alert>}
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
        label="Confirmer le mot de passe"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        errors={state.fieldErrors?.confirmPassword}
      />
      <SubmitButton pendingLabel="Enregistrement…" className="w-full">Enregistrer le mot de passe</SubmitButton>
    </form>
  );
}
