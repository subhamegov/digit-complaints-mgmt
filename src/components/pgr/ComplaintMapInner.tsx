/**
 * ComplaintMapInner — Leaflet implementation of the Civic Operations Hub map.
 *
 * This module is loaded ONLY on the client (via React.lazy from the
 * SSR-safe ComplaintMap wrapper) because Leaflet touches `window` at
 * module evaluation time.
 */
import "leaflet/dist/leaflet.css";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer, TileLayer, Polygon, CircleMarker, Popup, Tooltip,
  useMap, useMapEvents,
} from "react-leaflet";
import type { LatLngBoundsExpression, Map as LeafletMap } from "leaflet";
import type { Complaint } from "@/lib/mock-data";
import { complaintTypeOf } from "@/lib/mock-data";
import {
  BANGALORE_CENTER, BANGALORE_BOUNDS,
  LOCALITY_POLYGONS, WARD_POLYGONS,
  LOCALITY_BY_WARD_FIELD, WARD_BY_LOCALITY_FIELD,
  pinForComplaint, type BoundaryPolygon,
} from "./bangaloreGeo";
import { ChevronRight, Home, Crosshair, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

type MetricMode = "wow" | "sla";

/* ----------------------------- palette ----------------------------- */

// Diverging WoW palette — teal (improving) → neutral → amber → red (spike).
const WOW_STOPS: { test: (delta: number, isNew: boolean) => boolean; fill: string; stroke: string; label: string }[] = [
  { test: (d) => d <= -25,             fill: "#0d9488", stroke: "#0f766e", label: "↓ > 25%" },
  { test: (d) => d > -25 && d <= -5,   fill: "#99f6e4", stroke: "#5eead4", label: "↓ 5–25%" },
  { test: (d) => d > -5 && d < 5,      fill: "#e5e7eb", stroke: "#9ca3af", label: "flat ±5%" },
  { test: (d) => d >= 5 && d <= 25,    fill: "#fde68a", stroke: "#f59e0b", label: "↑ 5–25%" },
  { test: (d) => d > 25 && d <= 100,   fill: "#fb923c", stroke: "#ea580c", label: "↑ 25–100%" },
  { test: (d, isNew) => d > 100 || isNew, fill: "#dc2626", stroke: "#991b1b", label: "↑ >100% / new" },
];

// Sequential SLA breach palette (share of complaints in poly with state BREACHED).
const SLA_STOPS: { max: number; fill: string; stroke: string; label: string }[] = [
  { max: 0.001, fill: "#f1f5f9", stroke: "#cbd5e1", label: "0%" },
  { max: 0.10,  fill: "#fee2e2", stroke: "#fecaca", label: "≤ 10%" },
  { max: 0.25,  fill: "#fca5a5", stroke: "#f87171", label: "10–25%" },
  { max: 0.50,  fill: "#f87171", stroke: "#dc2626", label: "25–50%" },
  { max: 0.75,  fill: "#dc2626", stroke: "#991b1b", label: "50–75%" },
  { max: 1.01,  fill: "#7f1d1d", stroke: "#450a0a", label: "> 75%" },
];

const PIN_COLOR: Record<string, { fill: string; stroke: string; label: string }> = {
  WITHIN:   { fill: "#14b8a6", stroke: "#0f766e", label: "Within SLA" },
  NEARING:  { fill: "#f59e0b", stroke: "#b45309", label: "Breaching" },
  BREACHED: { fill: "#dc2626", stroke: "#7f1d1d", label: "Breached" },
};

/* ------------------------ per-polygon aggregate ------------------------ */

interface PolyAgg {
  total: number;
  thisWeek: number;
  lastWeek: number;
  /** WoW delta as a percentage. null = both weeks zero. */
  wowPct: number | null;
  /** true when last week was 0 but this week > 0 ("new spike"). */
  isNewSpike: boolean;
  within: number;
  nearing: number;
  breached: number;
  /** share breached, 0..1. */
  slaShare: number;
}

function aggregate(complaints: Complaint[], referenceNow: number): PolyAgg {
  const sevenDays = 7 * 24 * 3600 * 1000;
  let thisWeek = 0, lastWeek = 0;
  let within = 0, nearing = 0, breached = 0;
  for (const c of complaints) {
    const ts = new Date(c.filedOn).getTime();
    const ageMs = referenceNow - ts;
    if (ageMs >= 0 && ageMs < sevenDays) thisWeek++;
    else if (ageMs >= sevenDays && ageMs < 2 * sevenDays) lastWeek++;
    if (c.slaState === "WITHIN") within++;
    else if (c.slaState === "NEARING") nearing++;
    else if (c.slaState === "BREACHED") breached++;
  }
  let wowPct: number | null = null;
  let isNewSpike = false;
  if (lastWeek === 0 && thisWeek === 0) wowPct = null;
  else if (lastWeek === 0) { isNewSpike = true; wowPct = 999; }
  else wowPct = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  const total = complaints.length;
  const slaShare = total === 0 ? 0 : breached / total;
  return { total, thisWeek, lastWeek, wowPct, isNewSpike, within, nearing, breached, slaShare };
}

function colorForWow(agg: PolyAgg): { fill: string; stroke: string } {
  if (agg.total === 0) return { fill: "#f8fafc", stroke: "#cbd5e1" };
  if (agg.wowPct === null) return { fill: "#e5e7eb", stroke: "#9ca3af" };
  for (const stop of WOW_STOPS) {
    if (stop.test(agg.wowPct, agg.isNewSpike)) return stop;
  }
  return { fill: "#e5e7eb", stroke: "#9ca3af" };
}

function colorForSla(agg: PolyAgg): { fill: string; stroke: string } {
  if (agg.total === 0) return { fill: "#f8fafc", stroke: "#cbd5e1" };
  for (const stop of SLA_STOPS) {
    if (agg.slaShare <= stop.max) return stop;
  }
  return SLA_STOPS[SLA_STOPS.length - 1];
}

/* --------------------------- zoom watcher --------------------------- */

function ZoomWatcher({ onZoom }: { onZoom: (z: number) => void }) {
  const map = useMap();
  useEffect(() => { onZoom(map.getZoom()); }, [map, onZoom]);
  useMapEvents({ zoomend: (e) => onZoom(e.target.getZoom()) });
  return null;
}

/** Imperative helper for breadcrumb "fly to" actions. */
function MapController({ target }: { target: { center: [number, number]; zoom: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target.center, target.zoom, { duration: 0.6 });
  }, [target, map]);
  return null;
}

/**
 * Keeps Leaflet's internal canvas in sync with the parent container size.
 * Required because the dashboard widget is user-resizable; without this the
 * map clips and tiles don't reflow until the next window resize.
 */
function ResizeInvalidator({ targetRef }: { targetRef: React.RefObject<HTMLDivElement | null> }) {
  const map = useMap();
  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;
    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      // debounce to a single frame after the resize settles
      raf = requestAnimationFrame(() => map.invalidateSize({ animate: false }));
    });
    ro.observe(el);
    // initial sync once mounted
    raf = requestAnimationFrame(() => map.invalidateSize({ animate: false }));
    return () => { ro.disconnect(); cancelAnimationFrame(raf); };
  }, [map, targetRef]);
  return null;
}

/** Exposes the Leaflet map instance to the parent for toolbar actions. */
function MapRefBridge({ onReady }: { onReady: (m: LeafletMap) => void }) {
  const map = useMap();
  useEffect(() => { onReady(map); }, [map, onReady]);
  return null;
}

/* --------------------------- main component --------------------------- */

export default function ComplaintMapInner({ complaints }: { complaints: Complaint[] }) {
  const [metric, setMetric] = useState<MetricMode>("wow");
  const [zoom, setZoom] = useState(11);
  const [selectedLocality, setSelectedLocality] = useState<BoundaryPolygon | null>(null);
  const [selectedWard, setSelectedWard] = useState<BoundaryPolygon | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ center: [number, number]; zoom: number } | null>(null);

  /** Reference "now" = most recent filedOn in the dataset (data is mock-dated 2026-05). */
  const referenceNow = useMemo(() => {
    let m = 0;
    for (const c of complaints) {
      const t = new Date(c.filedOn).getTime();
      if (t > m) m = t;
    }
    return m || Date.now();
  }, [complaints]);

  /** Group complaints by their map polygon, using the dataset's ward/locality fields. */
  const { byLocality, byWard } = useMemo(() => {
    const byLocality = new Map<string, Complaint[]>();
    const byWard = new Map<string, Complaint[]>();
    for (const c of complaints) {
      // dataset.ward → map locality
      const loc = LOCALITY_BY_WARD_FIELD[c.ward];
      if (loc) {
        if (!byLocality.has(loc.code)) byLocality.set(loc.code, []);
        byLocality.get(loc.code)!.push(c);
      }
      // dataset.locality → map ward
      const wd = WARD_BY_LOCALITY_FIELD[c.locality];
      if (wd) {
        if (!byWard.has(wd.code)) byWard.set(wd.code, []);
        byWard.get(wd.code)!.push(c);
      }
    }
    return { byLocality, byWard };
  }, [complaints]);

  const localityAgg = useMemo(
    () => new Map(LOCALITY_POLYGONS.map((p) => [p.code, aggregate(byLocality.get(p.code) ?? [], referenceNow)])),
    [byLocality, referenceNow],
  );
  const wardAgg = useMemo(
    () => new Map(WARD_POLYGONS.map((p) => [p.code, aggregate(byWard.get(p.code) ?? [], referenceNow)])),
    [byWard, referenceNow],
  );

  // Layer-of-detail decisions driven by current zoom.
  const showLocalities = zoom <= 11;
  const showWards = zoom >= 12 && zoom <= 13;
  const showPins = zoom >= 14;

  const activeStops = metric === "wow" ? WOW_STOPS : SLA_STOPS;
  const colorFor = metric === "wow" ? colorForWow : colorForSla;

  const cityBounds: LatLngBoundsExpression = BANGALORE_BOUNDS;

  const mapRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [legendOpen, setLegendOpen] = useState(true);

  const resetView = () => {
    setSelectedLocality(null);
    setSelectedWard(null);
    setFlyTarget({ center: BANGALORE_CENTER, zoom: 11 });
  };
  const fitToSelection = () => {
    const target = selectedWard ?? selectedLocality;
    if (target) setFlyTarget({ center: target.center, zoom: selectedWard ? 15 : 13 });
    else setFlyTarget({ center: BANGALORE_CENTER, zoom: 11 });
  };
  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.();
  };

  const breadcrumb: { label: string; onClick?: () => void }[] = [
    { label: "Bengaluru", onClick: resetView },
  ];
  if (selectedLocality) {
    breadcrumb.push({
      label: selectedLocality.name,
      onClick: () => {
        setSelectedWard(null);
        setFlyTarget({ center: selectedLocality.center, zoom: 13 });
      },
    });
  }
  if (selectedWard) {
    breadcrumb.push({ label: selectedWard.name });
  }

  const activeName = selectedWard?.name ?? selectedLocality?.name ?? "Bengaluru";
  const levelLabel = showLocalities ? "Locality" : showWards ? "Ward" : "Complaints";

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={`Complaint distribution map for ${activeName} by ${levelLabel.toLowerCase()}`}
      className="flex h-full min-h-[260px] w-full flex-col gap-2 p-3"
    >
      {/* Toolbar: metric switch + breadcrumb */}
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Map metric" className="inline-flex overflow-hidden rounded-sm border border-border text-[11px]">
          {(["wow", "sla"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetric(m)}
              aria-pressed={metric === m}
              className={cn(
                "px-2.5 py-1 font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                metric === m
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-muted-foreground hover:text-foreground",
              )}
            >
              {m === "wow" ? "WoW change" : "SLA breach"}
            </button>
          ))}
        </div>

        <nav aria-label="Selected geography" className="flex flex-wrap items-center gap-1 text-[11.5px] text-muted-foreground">
          {breadcrumb.map((b, i) => (
            <span key={i} className="inline-flex items-center gap-1">
              {i === 0 && <Home className="h-3 w-3" aria-hidden />}
              {b.onClick && i < breadcrumb.length - 1 ? (
                <button
                  type="button"
                  onClick={b.onClick}
                  className="hover:text-foreground hover:underline focus:outline-none focus-visible:underline"
                >{b.label}</button>
              ) : (
                <span className={cn(i === breadcrumb.length - 1 && "font-medium text-foreground")}>{b.label}</span>
              )}
              {i < breadcrumb.length - 1 && <ChevronRight className="h-3 w-3 opacity-60" aria-hidden />}
            </span>
          ))}
          <span className="ml-2 rounded-sm bg-muted px-1.5 py-0.5 text-[10.5px] tabular-nums">
            zoom {zoom} · {levelLabel}
          </span>
        </nav>

        <div className="ml-auto inline-flex items-center gap-1">
          <button
            type="button"
            onClick={fitToSelection}
            title="Fit to selected geography"
            aria-label="Fit to selected geography"
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-border bg-surface text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Crosshair className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={resetView}
            title="Reset view"
            aria-label="Reset map view"
            className="inline-flex h-7 items-center gap-1 rounded-sm border border-border bg-surface px-2 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Home className="h-3 w-3" aria-hidden /> Reset
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            title="Toggle fullscreen"
            aria-label="Toggle fullscreen"
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-border bg-surface text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-sm border border-border">
        <MapContainer
          center={BANGALORE_CENTER}
          zoom={11}
          minZoom={10}
          maxZoom={16}
          maxBounds={cityBounds}
          maxBoundsViscosity={0.9}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ZoomWatcher onZoom={setZoom} />
          <MapController target={flyTarget} />
          <MapRefBridge onReady={(m) => { mapRef.current = m; }} />
          <ResizeInvalidator targetRef={containerRef} />

          {/* Locality layer */}
          {showLocalities && LOCALITY_POLYGONS.map((p) => {
            const agg = localityAgg.get(p.code)!;
            const col = colorFor(agg);
            const isSelected = selectedLocality?.code === p.code;
            return (
              <Polygon
                key={p.code}
                positions={p.polygon}
                pathOptions={{
                  fillColor: col.fill,
                  fillOpacity: isSelected ? 0.5 : 0.32,
                  color: col.stroke,
                  weight: isSelected ? 2.2 : 1.1,
                  opacity: 0.85,
                }}
                eventHandlers={{
                  click: () => {
                    if (selectedLocality?.code === p.code) {
                      resetView();
                    } else {
                      setSelectedLocality(p);
                      setSelectedWard(null);
                      setFlyTarget({ center: p.center, zoom: 13 });
                    }
                  },
                }}
              >
                <PolyTooltip name={p.name} agg={agg} level="Locality" />
              </Polygon>
            );
          })}

          {/* Ward layer */}
          {showWards && WARD_POLYGONS.map((p) => {
            const agg = wardAgg.get(p.code)!;
            const col = colorFor(agg);
            const isSelected = selectedWard?.code === p.code;
            return (
              <Polygon
                key={p.code}
                positions={p.polygon}
                pathOptions={{
                  fillColor: col.fill,
                  fillOpacity: isSelected ? 0.55 : 0.35,
                  color: col.stroke,
                  weight: isSelected ? 2.2 : 1.1,
                  opacity: 0.85,
                }}
                eventHandlers={{
                  click: () => {
                    if (selectedWard?.code === p.code) {
                      setSelectedWard(null);
                      if (selectedLocality) setFlyTarget({ center: selectedLocality.center, zoom: 13 });
                    } else {
                      setSelectedWard(p);
                      const loc = LOCALITY_POLYGONS.find((l) => l.code === p.parentCode) ?? null;
                      setSelectedLocality(loc);
                      setFlyTarget({ center: p.center, zoom: 15 });
                    }
                  },
                }}
              >
                <PolyTooltip name={p.name} agg={agg} level="Ward" />
              </Polygon>
            );
          })}

          {/* Pin layer */}
          {showPins && complaints.map((c) => {
            const ward = WARD_BY_LOCALITY_FIELD[c.locality];
            if (!ward) return null;
            const [lat, lng] = pinForComplaint(c.id, ward);
            const tone = PIN_COLOR[c.slaState] ?? PIN_COLOR.WITHIN;
            const type = complaintTypeOf(c.typeCode);
            const filed = new Date(c.filedOn);
            const ageH = Math.max(0, Math.round((referenceNow - filed.getTime()) / 3600_000));
            const ageLabel = ageH < 48 ? `${ageH}h ago` : `${Math.round(ageH / 24)}d ago`;
            return (
              <CircleMarker
                key={c.id}
                center={[lat, lng]}
                radius={6}
                pathOptions={{
                  fillColor: tone.fill, fillOpacity: 0.95,
                  color: tone.stroke, weight: 1.5,
                }}
              >
                <Popup>
                  <div className="text-[12px] leading-snug">
                    <div className="font-semibold">{type?.name ?? c.typeCode}</div>
                    <div className="text-muted-foreground">{c.id}</div>
                    <div className="mt-1">Status: <span className="font-medium">{c.status.replaceAll("_", " ")}</span></div>
                    <div>SLA: <span className="font-medium" style={{ color: tone.stroke }}>{tone.label}</span></div>
                    <div>Filed: {ageLabel}</div>
                    <div className="text-muted-foreground">{c.locality} · {c.ward}</div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-2 left-2 z-[400] max-w-[180px] rounded-sm border border-border bg-background/95 text-[10.5px] shadow-sm">
          <button
            type="button"
            onClick={() => setLegendOpen((v) => !v)}
            aria-expanded={legendOpen}
            aria-controls="map-legend-body"
            className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 font-semibold text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <span>{metric === "wow" ? "Week-over-week change" : "SLA breach share"}</span>
            <span aria-hidden className="text-muted-foreground">{legendOpen ? "–" : "+"}</span>
          </button>
          {legendOpen && (
            <div id="map-legend-body" className="px-2.5 pb-2">
              <div className="grid grid-cols-1 gap-1">
                {(metric === "wow" ? WOW_STOPS : SLA_STOPS).map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <span aria-hidden className="inline-block h-2.5 w-3.5 rounded-sm" style={{ background: s.fill, border: `1px solid ${s.stroke}` }} />
                    <span className="text-foreground">{s.label}</span>
                  </div>
                ))}
              </div>
              {showPins && (
                <>
                  <div className="mt-2 mb-1 font-semibold text-foreground">Pin · SLA state</div>
                  <div className="flex flex-col gap-1">
                    {(["WITHIN", "NEARING", "BREACHED"] as const).map((s) => (
                      <div key={s} className="flex items-center gap-1.5">
                        <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: PIN_COLOR[s].fill, border: `1px solid ${PIN_COLOR[s].stroke}` }} />
                        <span className="text-foreground">{PIN_COLOR[s].label}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <div className="mt-2 border-t border-border pt-1.5 text-[10px] text-muted-foreground">
                Click a {levelLabel.toLowerCase()} to focus · click again to clear
              </div>
            </div>
          )}
        </div>

        {(selectedLocality || selectedWard) && (
          <div
            role="status"
            aria-live="polite"
            className="absolute top-2 right-2 z-[400] inline-flex items-center gap-2 rounded-sm border border-border bg-background/95 px-2 py-1 text-[11px] shadow-sm"
          >
            <span className="text-muted-foreground">Filter:</span>
            <span className="font-medium text-foreground">{activeName}</span>
            <button
              type="button"
              onClick={resetView}
              className="text-primary hover:underline focus:outline-none focus-visible:underline"
            >Clear</button>
          </div>
        )}
      </div>
    </div>
  );
}

function PolyTooltip({ name, agg, level }: { name: string; agg: PolyAgg; level: string }) {
  const wow = agg.wowPct === null
    ? "—"
    : agg.isNewSpike
    ? "new spike"
    : `${agg.wowPct > 0 ? "+" : ""}${agg.wowPct}%`;
  return (
    <Tooltip direction="top" sticky opacity={1}>
      <div className="text-[11.5px] leading-snug">
        <div className="font-semibold">{name} <span className="font-normal text-muted-foreground">· {level}</span></div>
        <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5">
          <span className="text-muted-foreground">This week</span><span className="tabular-nums">{agg.thisWeek}</span>
          <span className="text-muted-foreground">Last week</span><span className="tabular-nums">{agg.lastWeek}</span>
          <span className="text-muted-foreground">WoW</span><span className="tabular-nums">{wow}</span>
          <span className="text-muted-foreground">Total</span><span className="tabular-nums">{agg.total}</span>
        </div>
        <div className="mt-1 flex gap-2 text-[11px]">
          <span style={{ color: "#0f766e" }}>● {agg.within} within</span>
          <span style={{ color: "#b45309" }}>● {agg.nearing} breaching</span>
          <span style={{ color: "#991b1b" }}>● {agg.breached} breached</span>
        </div>
      </div>
    </Tooltip>
  );
}
