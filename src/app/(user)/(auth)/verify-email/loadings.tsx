import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <Skeleton className="h-16 w-16 rounded-full mx-auto" />
        <Skeleton className="h-10 w-48 mx-auto" />
        <Skeleton className="h-5 w-64 mx-auto" />
        <Skeleton className="h-12 w-40 mx-auto rounded-md" />
      </div>
    </div>
  );
}
