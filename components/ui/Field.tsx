import type { InputHTMLAttributes } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  errors?: string[];
  hint?: string;
};

/** Labelled input with accessible error/hint messages. */
export function Field({ label, name, errors, hint, id, className, ...input }: FieldProps) {
  const inputId = id ?? name;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const hasError = Boolean(errors?.length);
  const describedBy = [hasError ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ");

  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-800">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy || undefined}
        className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 aria-[invalid]:border-red-500"
        {...input}
      />
      {hint && !hasError && (
        <p id={hintId} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      )}
      {hasError && (
        <p id={errorId} className="mt-1.5 text-sm text-red-600">
          {errors![0]}
        </p>
      )}
    </div>
  );
}
