"use client";

import { useActionState } from "react";
import { registerAction } from "@/app/auth/actions";
import { initialFormState } from "@/lib/auth/form-state";
import { Alert } from "@/components/ui/Alert";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function RegisterForm() {
  // On success the Server Action redirects straight to /patient/dashboard,
  // so this form only ever displays errors.
  const [state, action] = useActionState(registerAction, initialFormState);
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message && <Alert tone="error">{state.message}</Alert>}
      <Field label="Nom complet" name="fullName" autoComplete="name" required defaultValue={v.fullName} errors={e.fullName} />
      <Field label="Adresse e-mail" name="email" type="email" autoComplete="email" required defaultValue={v.email} errors={e.email} />
      <Field
        label="Téléphone"
        name="phone"
        type="tel"
        autoComplete="tel"
        required
        placeholder="06 12 34 56 78"
        defaultValue={v.phone}
        errors={e.phone}
        hint="Le cabinet l'utilise uniquement pour vos rendez-vous."
      />
      <Field
        label="Mot de passe"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        errors={e.password}
        hint="Au moins 8 caractères, dont une lettre et un chiffre."
      />
      <Field
        label="Confirmer le mot de passe"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        errors={e.confirmPassword}
      />
      <SubmitButton pendingLabel="Création du compte…" className="w-full">Créer mon compte</SubmitButton>
    </form>
  );
}
