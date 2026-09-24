"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

/** Last-resort error screen: technical details are never shown to the user. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] unhandled error:", error.digest ?? error.message);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          Une erreur est survenue
        </h1>
        <p className="mt-3 text-ink-600">
          Nous n&apos;avons pas pu afficher cette page. Réessayez dans un instant.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" onClick={reset}>
            Réessayer
          </Button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
