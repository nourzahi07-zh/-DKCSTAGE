/** Joins class names, ignoring false/undefined - avoids a dependency. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
