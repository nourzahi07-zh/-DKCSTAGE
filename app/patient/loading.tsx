import { CardSkeleton, Skeleton } from "@/components/ui/States";

export default function PatientLoading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} lines={1} />
        ))}
      </div>
      <span className="sr-only">Chargement de votre espace…</span>
    </div>
  );
}
