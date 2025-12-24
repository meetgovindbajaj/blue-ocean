import { Skeleton } from "@/components/ui/skeleton";
import { ProductGridSkeleton, CarouselSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen">
      {/* Hero skeleton */}
      <Skeleton className="w-full h-[60vh] rounded-none" />

      {/* Featured products */}
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-10 w-64 mb-8" />
        <ProductGridSkeleton count={4} />
      </div>

      {/* Categories section */}
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>

      {/* New arrivals carousel */}
      <div className="container mx-auto px-4 py-12">
        <CarouselSkeleton title="New Arrivals" count={4} />
      </div>
    </div>
  );
}
