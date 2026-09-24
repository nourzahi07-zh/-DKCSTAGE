import { CardSkeleton, Skeleton } from "@/components/ui/States";

export default function AdminLoading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} lines={1} />
        ))}
      </div>
      <CardSkeleton lines={4} />
      <span className="sr-only">Chargement…</span>
    </div>
  );
}
