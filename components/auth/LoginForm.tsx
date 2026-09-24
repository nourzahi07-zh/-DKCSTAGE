"use client";

import Link from "next/link";
import { useActionState } from "react";
import { adminLoginAction, loginAction } from "@/app/auth/actions";
import { initialFormState } from "@/lib/auth/form-state";
import { Alert } from "@/components/ui/Alert";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

/** Login form, used by /auth/login (patients) and /admin/login (admin). */
export function LoginForm({
  area,
  next,
  pageError,
}: {
  area: "patient" | "admin";
  next?: string;
  pageError?: string;
}) {
  const [state, action] = useActionState(
    area === "admin" ? adminLoginAction : loginAction,
    initialFormState,
  );
  const email = state.values?.email ?? "";

  return (
    <div className="space-y-5">
      {pageError && state.status === "idle" && <Alert tone="error">{pageError}</Alert>}
      {state.message && <Alert tone="error">{state.message}</Alert>}

      <form action={action} className="space-y-4" noValidate>
        {next && <input type="hidden" name="next" value={next} />}
        <Field
          label="Adresse e-mail"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={email}
          errors={state.fieldErrors?.email}
        />
        <Field
          label="Mot de passe"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          errors={state.fieldErrors?.password}
        />
        {area === "patient" && (
          <div className="text-right">
            <Link
              href="/auth/forgot-password"
              className="text-sm font-medium text-teal-700 hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>
        )}
        <SubmitButton pendingLabel="Connexion…" className="w-full">Se connecter</SubmitButton>
      </form>
    </div>
  );
}
