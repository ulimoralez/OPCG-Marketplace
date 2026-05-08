import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function ListingCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-[180px] w-full rounded-none" />
      <CardContent className="p-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-10" />
          <Skeleton className="h-5 w-12" />
        </div>
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </CardContent>
    </Card>
  );
}
