/** State returned by auth Server Actions to their forms (useActionState). */
export type FormState = {
  status: "idle" | "error" | "success";
  /** General message shown above the form. */
  message?: string;
  /** Per-field validation messages. */
  fieldErrors?: Record<string, string[]>;
  /** Values sent back so the user doesn't retype them (never passwords). */
  values?: Record<string, string>;
};

export const initialFormState: FormState = { status: "idle" };
