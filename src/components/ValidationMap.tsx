import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type ValidationMarkerType = "source" | "destination" | "source-po" | "destination-po";

export interface ValidationMapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  sublabel?: string;
  type: ValidationMarkerType;
}

interface ValidationMapProps {
  markers: ValidationMapMarker[];
  routeCoordinates?: number[][];
  className?: string;
}

const markerColors: Record<ValidationMarkerType, string> = {
  source: "#f97316",
  destination: "#a78bfa",
  "source-po": "#22c55e",
  "destination-po": "#38bdf8",
};

const ValidationMap = ({ markers, routeCoordinates = [], className = "" }: ValidationMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [22.5, 78.5],
      zoom: 5,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      className: "validation-map-tiles",
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    layersRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layersRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layersRef.current;
    if (!map || !layers) return;

    layers.clearLayers();

    if (routeCoordinates.length > 1) {
      const latlngs = routeCoordinates.map(([lat, lng]) => [lat, lng] as [number, number]);
      L.polyline(latlngs, {
        color: "#f97316",
        weight: 3,
        opacity: 0.75,
        dashArray: "8, 12",
        className: "validation-route-line",
      }).addTo(layers);
    }

    markers.forEach((m) => {
      const color = markerColors[m.type];

      L.circleMarker([m.lat, m.lng], {
        radius: 14,
        color,
        fillColor: color,
        fillOpacity: 0.12,
        weight: 1,
        opacity: 0.5,
      }).addTo(layers);

      L.circleMarker([m.lat, m.lng], {
        radius: 6,
        color,
        fillColor: color,
        fillOpacity: 0.95,
        weight: 2,
        opacity: 1,
      })
        .bindPopup(
          `<div style="font-family:Space Grotesk,sans-serif;min-width:140px">
            <div style="font-size:12px;font-weight:700;color:#111">${m.label}</div>
            ${m.sublabel ? `<div style="font-size:11px;color:#666;margin-top:2px">${m.sublabel}</div>` : ""}
            <div style="font-size:10px;color:${color};margin-top:4px;text-transform:uppercase;font-weight:600">${m.id}</div>
          </div>`,
          { className: "validation-map-popup" }
        )
        .addTo(layers);
    });

    const allPoints: [number, number][] = [
      ...markers.map((m) => [m.lat, m.lng] as [number, number]),
      ...routeCoordinates.map(([lat, lng]) => [lat, lng] as [number, number]),
    ];

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [markers, routeCoordinates]);

  if (markers.length === 0) return null;

  return (
    <div className={`relative overflow-hidden rounded-xl border border-white/[0.07] ${className}`}>
      <div ref={mapRef} className="h-full w-full min-h-[280px]" />
      <div className="absolute top-3 left-3 z-[1000] rounded-lg border border-white/[0.08] bg-[#0a0a14]/90 px-3 py-2 backdrop-blur-sm">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5">Live Route Map</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {(
            [
              ["Source", markerColors.source],
              ["Destination", markerColors.destination],
              ["Origin PO", markerColors["source-po"]],
              ["Dest PO", markerColors["destination-po"]],
            ] as const
          ).map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5 text-[10px] text-white/50">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .validation-map-tiles {
          filter: brightness(0.75) contrast(1.1) saturate(0.85);
        }
        .validation-map-popup .leaflet-popup-content-wrapper {
          border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }
        .leaflet-control-zoom a {
          background: rgba(10,10,20,0.9) !important;
          color: rgba(255,255,255,0.7) !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(20,20,30,0.95) !important;
          color: #fff !important;
        }
        @keyframes route-dash {
          to { stroke-dashoffset: -100; }
        }
        .validation-route-line {
          animation: route-dash 24s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ValidationMap;
