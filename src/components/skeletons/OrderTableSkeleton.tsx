import { Skeleton } from "@/components/ui/skeleton";

export function OrderTableRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export function OrderTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <Skeleton className="h-6 w-40" />
      </div>
      <div>
        {Array.from({ length: rows }).map((_, i) => (
          <OrderTableRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
