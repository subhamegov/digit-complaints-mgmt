/**
 * ComplaintMap — SSR-safe wrapper around the Leaflet implementation.
 *
 * Leaflet touches `window` at import time so the inner module is loaded
 * via React.lazy after mount; on SSR (and the first client paint before
 * hydration completes) we render a neutral skeleton.
 */
import { Suspense, lazy, useEffect, useState } from "react";
import type { Complaint } from "@/lib/mock-data";

const ComplaintMapInner = lazy(() => import("./ComplaintMapInner"));

export function ComplaintMap({ complaints }: { complaints: Complaint[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <MapSkeleton />;

  return (
    <Suspense fallback={<MapSkeleton />}>
      <ComplaintMapInner complaints={complaints} />
    </Suspense>
  );
}

function MapSkeleton() {
  return (
    <div className="flex h-full min-h-[480px] items-center justify-center rounded-sm border border-border bg-muted/30 text-[12px] text-muted-foreground">
      Loading map…
    </div>
  );
}
