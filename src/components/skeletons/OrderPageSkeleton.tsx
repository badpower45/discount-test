import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function OrderPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-accent/10 via-background to-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <Card className="shadow-xl border-2 border-primary/20">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b-2 border-primary/10">
                <Skeleton className="h-8 w-48" />
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <div className="pt-4 border-t">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <Skeleton className="h-7 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-24">
              <Card className="shadow-2xl border-2 border-primary/20">
                <CardHeader className="bg-gradient-to-br from-primary to-purple-600 text-white">
                  <Skeleton className="h-7 w-32 bg-white/20" />
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <div className="border-t pt-4 space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-6 w-28" />
                  </div>
                  <Skeleton className="h-12 w-full rounded-xl" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
