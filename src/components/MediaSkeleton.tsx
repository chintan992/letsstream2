import { cn } from "@/lib/utils";

interface MediaSkeletonProps {
  listView?: boolean;
}

function MediaSkeleton({ listView }: MediaSkeletonProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg",
        listView ? "flex w-full gap-4" : "flex flex-col"
      )}
    >
      <div
        className={cn(
          "bg-accent/10 animate-pulse",
          listView ? "h-[100px] w-[180px]" : "aspect-[2/3] w-full"
        )}
      />
      <div className={cn("flex flex-col gap-2", listView ? "py-2" : "p-4")}>
        <div className="bg-accent/10 h-4 w-3/4 animate-pulse rounded" />
        <div className="bg-accent/10 h-4 w-1/2 animate-pulse rounded" />
      </div>
    </div>
  );
}

export function MediaGridSkeleton({ listView }: MediaSkeletonProps) {
  return (
    <div
      className={cn(
        "grid gap-6",
        listView
          ? "grid-cols-1"
          : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      )}
    >
      {Array.from({ length: 20 }).map((_, i) => (
        <MediaSkeleton key={i} listView={listView} />
      ))}
    </div>
  );
}
