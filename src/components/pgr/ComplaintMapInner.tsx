/**
 * ComplaintMapInner — Leaflet implementation of the Civic Operations Hub map.
 *
 * Three tabs (Complaints Filed / Open / Resolved) drive a choropleth across
 * a District → Subdistrict → Sub-subdistrict hierarchy. At the deepest zoom
 * we drop one pin per complaint (green=resolved, red=open) regardless of tab.
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
  LOCALITY_POLYGONS, WARD_POLYGONS, SUBWARD_POLYGONS,
  LOCALITY_BY_WARD_FIELD, WARD_BY_LOCALITY_FIELD,
  subwardCodeForComplaint,
  pinForComplaint, type BoundaryPolygon,
} from "./bangaloreGeo";
import { ChevronRight, Home, Crosshair, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

type MetricMode = "filed" | "open" | "resolved";

/* ----------------------------- status helpers ----------------------------- */

const RESOLVED_STATUSES = new Set(["RESOLVED", "CLOSED"]);
const OPEN_STATUSES = new Set(["OPEN", "ASSIGNED", "IN_PROGRESS", "REOPENED"]);

function isResolved(c: Complaint) { return RESOLVED_STATUSES.has(c.status); }
function isOpen(c: Complaint) { return OPEN_STATUSES.has(c.status); }

/* ------------------------------- palettes ------------------------------- */

interface Ramp {
  /** ramp stops, increasing threshold. Pick the first stop whose `max` >= value. */
  stops: { max: number; fill: string; stroke: string; label: string }[];
  emptyFill: string;
  emptyStroke: string;
}

// Blue ramp — raw counts. Buckets are picked dynamically from data max.
const BLUE_FILLS = ["#eff6ff", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#1d4ed8"];
const BLUE_STROKES = ["#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#1d4ed8", "#1e3a8a"];

// Red ramp — % open.
const RED_RAMP: Ramp = {
  emptyFill: "#f8fafc", emptyStroke: "#cbd5e1",
  stops: [
    { max: 0.0001, fill: "#fef2f2", stroke: "#fecaca", label: "0%" },
    { max: 0.20,   fill: "#fecaca", stroke: "#fca5a5", label: "≤ 20%" },
    { max: 0.40,   fill: "#fca5a5", stroke: "#f87171", label: "20–40%" },
    { max: 0.60,   fill: "#f87171", stroke: "#ef4444", label: "40–60%" },
    { max: 0.80,   fill: "#dc2626", stroke: "#b91c1c", label: "60–80%" },
    { max: 1.01,   fill: "#7f1d1d", stroke: "#450a0a", label: "> 80%" },
  ],
};

// Green ramp — % resolved.
const GREEN_RAMP: Ramp = {
  emptyFill: "#f8fafc", emptyStroke: "#cbd5e1",
  stops: [
    { max: 0.0001, fill: "#f0fdf4", stroke: "#bbf7d0", label: "0%" },
    { max: 0.20,   fill: "#bbf7d0", stroke: "#86efac", label: "≤ 20%" },
    { max: 0.40,   fill: "#86efac", stroke: "#4ade80", label: "20–40%" },
    { max: 0.60,   fill: "#4ade80", stroke: "#22c55e", label: "40–60%" },
    { max: 0.80,   fill: "#16a34a", stroke: "#15803d", label: "60–80%" },
    { max: 1.01,   fill: "#14532d", stroke: "#052e16", label: "> 80%" },
  ],
};

function buildBlueRamp(maxCount: number): Ramp {
  const m = Math.max(1, maxCount);
  // 6 evenly spaced buckets up to max.
  const stops = BLUE_FILLS.map((fill, i) => {
    const upper = Math.round((m * (i + 1)) / BLUE_FILLS.length);
    const lower = i === 0 ? 1 : Math.round((m * i) / BLUE_FILLS.length) + 1;
    const label = i === 0 ? `1–${upper}` : lower >= upper ? `${upper}` : `${lower}–${upper}`;
    return { max: upper + 0.5, fill, stroke: BLUE_STROKES[i], label };
  });
  return { emptyFill: "#f8fafc", emptyStroke: "#cbd5e1", stops };
}

function rampColor(ramp: Ramp, value: number | null): { fill: string; stroke: string } {
  if (value === null) return { fill: ramp.emptyFill, stroke: ramp.emptyStroke };
  for (const s of ramp.stops) if (value <= s.max) return { fill: s.fill, stroke: s.stroke };
  const last = ramp.stops[ramp.stops.length - 1];
  return { fill: last.fill, stroke: last.stroke };
}

const PIN_COLOR = {
  resolved: { fill: "#16a34a", stroke: "#14532d", label: "Resolved" },
  open:     { fill: "#dc2626", stroke: "#7f1d1d", label: "Open" },
};

/* ------------------------ per-polygon aggregate ------------------------ */

interface PolyAgg {
  total: number;
  open: number;
  resolved: number;
  openPct: number | null;     // null when total = 0
  resolvedPct: number | null; // null when total = 0
}

function aggregate(complaints: Complaint[]): PolyAgg {
  let open = 0, resolved = 0;
  for (const c of complaints) {
    if (isResolved(c)) resolved++;
    else if (isOpen(c)) open++;
  }
  const total = complaints.length;
  return {
    total, open, resolved,
    openPct: total === 0 ? null : open / total,
    resolvedPct: total === 0 ? null : resolved / total,
  };
}

/* --------------------------- map helpers --------------------------- */

function ZoomWatcher({ onZoom }: { onZoom: (z: number) => void }) {
  const map = useMap();
  useEffect(() => { onZoom(map.getZoom()); }, [map, onZoom]);
  useMapEvents({ zoomend: (e) => onZoom(e.target.getZoom()) });
  return null;
}

function MapController({ target }: { target: { center: [number, number]; zoom: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target.center, target.zoom, { duration: 0.6 });
  }, [target, map]);
  return null;
}

function ResizeInvalidator({ targetRef }: { targetRef: React.RefObject<HTMLDivElement | null> }) {
  const map = useMap();
  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;
    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => map.invalidateSize({ animate: false }));
    });
    ro.observe(el);
    raf = requestAnimationFrame(() => map.invalidateSize({ animate: false }));
    return () => { ro.disconnect(); cancelAnimationFrame(raf); };
  }, [map, targetRef]);
  return null;
}

function MapRefBridge({ onReady }: { onReady: (m: LeafletMap) => void }) {
  const map = useMap();
  useEffect(() => { onReady(map); }, [map, onReady]);
  return null;
}

/* --------------------------- main component --------------------------- */

const TABS: { id: MetricMode; label: string }[] = [
  { id: "filed",    label: "Created" },
  { id: "open",     label: "Open" },
  { id: "resolved", label: "Resolved" },
];

export default function ComplaintMapInner({ complaints }: { complaints: Complaint[] }) {
  const [metric, setMetric] = useState<MetricMode>("filed");
  const [zoom, setZoom] = useState(11);
  const [selectedLocality, setSelectedLocality] = useState<BoundaryPolygon | null>(null);
  const [selectedWard, setSelectedWard] = useState<BoundaryPolygon | null>(null);
  const [selectedSubward, setSelectedSubward] = useState<BoundaryPolygon | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ center: [number, number]; zoom: number } | null>(null);

  /** Group complaints by each polygon level using dataset fields + deterministic sub-ward bucketing. */
  const { byLocality, byWard, bySubward } = useMemo(() => {
    const byLocality = new Map<string, Complaint[]>();
    const byWard = new Map<string, Complaint[]>();
    const bySubward = new Map<string, Complaint[]>();
    for (const c of complaints) {
      const loc = LOCALITY_BY_WARD_FIELD[c.ward];
      if (loc) {
        if (!byLocality.has(loc.code)) byLocality.set(loc.code, []);
        byLocality.get(loc.code)!.push(c);
      }
      const wd = WARD_BY_LOCALITY_FIELD[c.locality];
      if (wd) {
        if (!byWard.has(wd.code)) byWard.set(wd.code, []);
        byWard.get(wd.code)!.push(c);
        const swCode = subwardCodeForComplaint(c.id, wd.code);
        if (!bySubward.has(swCode)) bySubward.set(swCode, []);
        bySubward.get(swCode)!.push(c);
      }
    }
    return { byLocality, byWard, bySubward };
  }, [complaints]);

  const localityAgg = useMemo(
    () => new Map(LOCALITY_POLYGONS.map((p) => [p.code, aggregate(byLocality.get(p.code) ?? [])])),
    [byLocality],
  );
  const wardAgg = useMemo(
    () => new Map(WARD_POLYGONS.map((p) => [p.code, aggregate(byWard.get(p.code) ?? [])])),
    [byWard],
  );
  const subwardAgg = useMemo(
    () => new Map(SUBWARD_POLYGONS.map((p) => [p.code, aggregate(bySubward.get(p.code) ?? [])])),
    [bySubward],
  );

  // Zoom-driven hierarchy: District (≤11) → Subdistrict (12–13) → Sub-subdistrict (14) → Pins (≥15).
  const showLocalities = zoom <= 11;
  const showWards = zoom >= 12 && zoom <= 13;
  const showSubwards = zoom === 14;
  const showPins = zoom >= 15;

  const levelLabel =
    showPins ? "Complaints" :
    showSubwards ? "Sub-subdistrict" :
    showWards ? "Subdistrict" : "District";

  // Build the active ramp + value extractor per tab.
  const { ramp, valueOf, metricLabel, formatValue } = useMemo(() => {
    if (metric === "filed") {
      const allTotals = [
        ...Array.from(localityAgg.values()).map((a) => a.total),
        ...Array.from(wardAgg.values()).map((a) => a.total),
        ...Array.from(subwardAgg.values()).map((a) => a.total),
      ];
      const maxCount = Math.max(0, ...allTotals);
      return {
        ramp: buildBlueRamp(maxCount),
        valueOf: (a: PolyAgg) => (a.total === 0 ? null : a.total),
        metricLabel: "Complaints filed",
        formatValue: (v: number | null) => (v === null ? "—" : String(Math.round(v))),
      };
    }
    if (metric === "open") {
      return {
        ramp: RED_RAMP,
        valueOf: (a: PolyAgg) => a.openPct,
        metricLabel: "% Open",
        formatValue: (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`),
      };
    }
    return {
      ramp: GREEN_RAMP,
      valueOf: (a: PolyAgg) => a.resolvedPct,
      metricLabel: "% Resolved",
      formatValue: (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`),
    };
  }, [metric, localityAgg, wardAgg, subwardAgg]);

  const cityBounds: LatLngBoundsExpression = BANGALORE_BOUNDS;
  const mapRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [legendOpen, setLegendOpen] = useState(true);

  const resetView = () => {
    setSelectedLocality(null);
    setSelectedWard(null);
    setSelectedSubward(null);
    setFlyTarget({ center: BANGALORE_CENTER, zoom: 11 });
  };
  const fitToSelection = () => {
    const target = selectedSubward ?? selectedWard ?? selectedLocality;
    if (target) setFlyTarget({ center: target.center, zoom: selectedSubward ? 15 : selectedWard ? 14 : 13 });
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
        setSelectedSubward(null);
        setFlyTarget({ center: selectedLocality.center, zoom: 13 });
      },
    });
  }
  if (selectedWard) {
    breadcrumb.push({
      label: selectedWard.name,
      onClick: () => {
        setSelectedSubward(null);
        setFlyTarget({ center: selectedWard.center, zoom: 14 });
      },
    });
  }
  if (selectedSubward) {
    breadcrumb.push({ label: selectedSubward.name });
  }

  const activeName =
    selectedSubward?.name ?? selectedWard?.name ?? selectedLocality?.name ?? "Bengaluru";

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={`Complaint distribution map for ${activeName} — ${metricLabel}`}
      className="flex h-full min-h-[260px] w-full flex-col gap-2 p-3"
    >
      {/* Toolbar: metric tabs + breadcrumb */}
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Map metric" className="inline-flex overflow-hidden rounded-sm border border-border text-[11px]">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              onClick={() => setMetric(t.id)}
              aria-selected={metric === t.id}
              className={cn(
                "px-2.5 py-1 font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                metric === t.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
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

          {/* District (Locality) layer */}
          {showLocalities && LOCALITY_POLYGONS.map((p) => {
            const agg = localityAgg.get(p.code)!;
            const v = valueOf(agg);
            const col = rampColor(ramp, v);
            const isSelected = selectedLocality?.code === p.code;
            return (
              <Polygon
                key={p.code}
                positions={p.polygon}
                pathOptions={{
                  fillColor: col.fill,
                  fillOpacity: isSelected ? 0.55 : 0.4,
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
                      setSelectedSubward(null);
                      setFlyTarget({ center: p.center, zoom: 13 });
                    }
                  },
                }}
              >
                <PolyTooltip name={p.name} agg={agg} level="District" metricLabel={metricLabel} value={formatValue(v)} />
              </Polygon>
            );
          })}

          {/* Subdistrict (Ward) layer */}
          {showWards && WARD_POLYGONS.map((p) => {
            const agg = wardAgg.get(p.code)!;
            const v = valueOf(agg);
            const col = rampColor(ramp, v);
            const isSelected = selectedWard?.code === p.code;
            return (
              <Polygon
                key={p.code}
                positions={p.polygon}
                pathOptions={{
                  fillColor: col.fill,
                  fillOpacity: isSelected ? 0.6 : 0.42,
                  color: col.stroke,
                  weight: isSelected ? 2.2 : 1.1,
                  opacity: 0.85,
                }}
                eventHandlers={{
                  click: () => {
                    if (selectedWard?.code === p.code) {
                      setSelectedWard(null);
                      setSelectedSubward(null);
                      if (selectedLocality) setFlyTarget({ center: selectedLocality.center, zoom: 13 });
                    } else {
                      setSelectedWard(p);
                      setSelectedSubward(null);
                      const loc = LOCALITY_POLYGONS.find((l) => l.code === p.parentCode) ?? null;
                      setSelectedLocality(loc);
                      setFlyTarget({ center: p.center, zoom: 14 });
                    }
                  },
                }}
              >
                <PolyTooltip name={p.name} agg={agg} level="Subdistrict" metricLabel={metricLabel} value={formatValue(v)} />
              </Polygon>
            );
          })}

          {/* Sub-subdistrict (Sub-ward) layer */}
          {showSubwards && SUBWARD_POLYGONS.map((p) => {
            const agg = subwardAgg.get(p.code)!;
            const v = valueOf(agg);
            const col = rampColor(ramp, v);
            const isSelected = selectedSubward?.code === p.code;
            return (
              <Polygon
                key={p.code}
                positions={p.polygon}
                pathOptions={{
                  fillColor: col.fill,
                  fillOpacity: isSelected ? 0.65 : 0.45,
                  color: col.stroke,
                  weight: isSelected ? 2.2 : 1.1,
                  opacity: 0.85,
                }}
                eventHandlers={{
                  click: () => {
                    if (selectedSubward?.code === p.code) {
                      setSelectedSubward(null);
                      if (selectedWard) setFlyTarget({ center: selectedWard.center, zoom: 14 });
                    } else {
                      setSelectedSubward(p);
                      const parentWard = WARD_POLYGONS.find((w) => w.code === p.parentCode) ?? null;
                      if (parentWard) {
                        setSelectedWard(parentWard);
                        const loc = LOCALITY_POLYGONS.find((l) => l.code === parentWard.parentCode) ?? null;
                        setSelectedLocality(loc);
                      }
                      setFlyTarget({ center: p.center, zoom: 15 });
                    }
                  },
                }}
              >
                <PolyTooltip name={p.name} agg={agg} level="Sub-subdistrict" metricLabel={metricLabel} value={formatValue(v)} />
              </Polygon>
            );
          })}

          {/* Pin layer — identical across tabs */}
          {showPins && complaints.map((c) => {
            const ward = WARD_BY_LOCALITY_FIELD[c.locality];
            if (!ward) return null;
            const [lat, lng] = pinForComplaint(c.id, ward);
            const tone = isResolved(c) ? PIN_COLOR.resolved : PIN_COLOR.open;
            const type = complaintTypeOf(c.typeCode);
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
                    <div>State: <span className="font-medium" style={{ color: tone.stroke }}>{tone.label}</span></div>
                    <div className="text-muted-foreground">{c.locality} · {c.ward}</div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-2 left-2 z-[400] max-w-[200px] rounded-sm border border-border bg-background/95 text-[10.5px] shadow-sm">
          <button
            type="button"
            onClick={() => setLegendOpen((v) => !v)}
            aria-expanded={legendOpen}
            aria-controls="map-legend-body"
            className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 font-semibold text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <span>{metricLabel}</span>
            <span aria-hidden className="text-muted-foreground">{legendOpen ? "–" : "+"}</span>
          </button>
          {legendOpen && (
            <div id="map-legend-body" className="px-2.5 pb-2">
              <div className="grid grid-cols-1 gap-1">
                {ramp.stops.map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <span aria-hidden className="inline-block h-2.5 w-3.5 rounded-sm" style={{ background: s.fill, border: `1px solid ${s.stroke}` }} />
                    <span className="text-foreground">{s.label}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5">
                  <span aria-hidden className="inline-block h-2.5 w-3.5 rounded-sm" style={{ background: ramp.emptyFill, border: `1px solid ${ramp.emptyStroke}` }} />
                  <span className="text-muted-foreground">No complaints</span>
                </div>
              </div>
              {showPins && (
                <>
                  <div className="mt-2 mb-1 font-semibold text-foreground">Pin · status</div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: PIN_COLOR.resolved.fill, border: `1px solid ${PIN_COLOR.resolved.stroke}` }} />
                      <span className="text-foreground">Resolved</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: PIN_COLOR.open.fill, border: `1px solid ${PIN_COLOR.open.stroke}` }} />
                      <span className="text-foreground">Open</span>
                    </div>
                  </div>
                </>
              )}
              <div className="mt-2 border-t border-border pt-1.5 text-[10px] text-muted-foreground">
                Zoom in to drill down · click a {levelLabel.toLowerCase()} to focus
              </div>
            </div>
          )}
        </div>

        {(selectedLocality || selectedWard || selectedSubward) && (
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

function PolyTooltip({
  name, agg, level, metricLabel, value,
}: { name: string; agg: PolyAgg; level: string; metricLabel: string; value: string }) {
  return (
    <Tooltip direction="top" sticky opacity={1}>
      <div className="text-[11.5px] leading-snug">
        <div className="font-semibold">{name} <span className="font-normal text-muted-foreground">· {level}</span></div>
        <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5">
          <span className="text-muted-foreground">{metricLabel}</span><span className="tabular-nums font-medium">{value}</span>
          <span className="text-muted-foreground">Total filed</span><span className="tabular-nums">{agg.total}</span>
          <span className="text-muted-foreground">Open</span><span className="tabular-nums">{agg.open}</span>
          <span className="text-muted-foreground">Resolved</span><span className="tabular-nums">{agg.resolved}</span>
        </div>
      </div>
    </Tooltip>
  );
}
