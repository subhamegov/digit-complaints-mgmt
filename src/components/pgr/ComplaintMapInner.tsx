/**
 * ComplaintMapInner — Leaflet implementation of the Civic Operations Hub map.
 *
 * This module is loaded ONLY on the client (via React.lazy from the
 * SSR-safe ComplaintMap wrapper) because Leaflet touches `window` at
 * module evaluation time.
 */
import "leaflet/dist/leaflet.css";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer, TileLayer, Polygon, CircleMarker, Popup, Tooltip,
  useMap, useMapEvents,
} from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import type { Complaint } from "@/lib/mock-data";
import { complaintTypeOf } from "@/lib/mock-data";
import {
  BANGALORE_CENTER, BANGALORE_BOUNDS,
  LOCALITY_POLYGONS, WARD_POLYGONS,
  LOCALITY_BY_WARD_FIELD, WARD_BY_LOCALITY_FIELD,
  pinForComplaint, type BoundaryPolygon,
} from "./bangaloreGeo";
import { ChevronRight, Home } from "lucide-react";
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

  const breadcrumb: { label: string; onClick?: () => void }[] = [
    { label: "Bangalore", onClick: () => {
      setSelectedLocality(null); setSelectedWard(null);
      setFlyTarget({ center: BANGALORE_CENTER, zoom: 11 });
    } },
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

  return (
    <div className="flex h-full min-h-[480px] flex-col gap-2">
      {/* Toolbar: metric switch + breadcrumb */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex overflow-hidden rounded-sm border border-border text-[11px]">
          {(["wow", "sla"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetric(m)}
              className={cn(
                "px-2.5 py-1 font-medium transition-colors",
                metric === m
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-muted-foreground hover:text-foreground",
              )}
            >
              {m === "wow" ? "WoW change" : "SLA breach"}
            </button>
          ))}
        </div>

        <nav className="flex flex-wrap items-center gap-1 text-[11.5px] text-muted-foreground">
          {breadcrumb.map((b, i) => (
            <span key={i} className="inline-flex items-center gap-1">
              {i === 0 && <Home className="h-3 w-3" />}
              {b.onClick && i < breadcrumb.length - 1 ? (
                <button
                  type="button"
                  onClick={b.onClick}
                  className="hover:text-foreground hover:underline"
                >{b.label}</button>
              ) : (
                <span className={cn(i === breadcrumb.length - 1 && "font-medium text-foreground")}>{b.label}</span>
              )}
              {i < breadcrumb.length - 1 && <ChevronRight className="h-3 w-3 opacity-60" />}
            </span>
          ))}
          <span className="ml-2 rounded-sm bg-muted px-1.5 py-0.5 text-[10.5px] tabular-nums">
            zoom {zoom} · {showLocalities ? "Locality" : showWards ? "Ward" : "Complaints"}
          </span>
        </nav>
      </div>

      {/* Map */}
      <div className="relative flex-1 overflow-hidden rounded-sm border border-border">
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

          {/* Locality layer */}
          {showLocalities && LOCALITY_POLYGONS.map((p) => {
            const agg = localityAgg.get(p.code)!;
            const col = colorFor(agg);
            return (
              <Polygon
                key={p.code}
                positions={p.polygon}
                pathOptions={{
                  fillColor: col.fill, fillOpacity: 0.55,
                  color: col.stroke, weight: 1.2,
                }}
                eventHandlers={{
                  click: () => {
                    setSelectedLocality(p);
                    setSelectedWard(null);
                    setFlyTarget({ center: p.center, zoom: 13 });
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
            return (
              <Polygon
                key={p.code}
                positions={p.polygon}
                pathOptions={{
                  fillColor: col.fill, fillOpacity: 0.6,
                  color: col.stroke, weight: 1.2,
                }}
                eventHandlers={{
                  click: () => {
                    setSelectedWard(p);
                    const loc = LOCALITY_POLYGONS.find((l) => l.code === p.parentCode) ?? null;
                    setSelectedLocality(loc);
                    setFlyTarget({ center: p.center, zoom: 15 });
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
        <div className="pointer-events-none absolute bottom-2 left-2 z-[400] rounded-sm border border-border bg-background/95 px-2.5 py-2 text-[10.5px] shadow-sm">
          <div className="mb-1 font-semibold text-foreground">
            {metric === "wow" ? "Week-over-week change" : "SLA breach share"}
          </div>
          <div className="grid grid-cols-1 gap-1">
            {metric === "wow"
              ? WOW_STOPS.map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-3.5 rounded-sm" style={{ background: s.fill, border: `1px solid ${s.stroke}` }} />
                    <span className="text-foreground">{s.label}</span>
                  </div>
                ))
              : SLA_STOPS.map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-3.5 rounded-sm" style={{ background: s.fill, border: `1px solid ${s.stroke}` }} />
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
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: PIN_COLOR[s].fill, border: `1px solid ${PIN_COLOR[s].stroke}` }} />
                    <span className="text-foreground">{PIN_COLOR[s].label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
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
