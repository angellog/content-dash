import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 bg-zinc-800" />
        <Skeleton className="h-4 w-80 bg-zinc-800" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg bg-zinc-800" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="col-span-2 h-80 rounded-lg bg-zinc-800" />
        <Skeleton className="h-80 rounded-lg bg-zinc-800" />
      </div>
    </div>
  );
}
