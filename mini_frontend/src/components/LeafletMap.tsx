import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  status: "moving" | "delayed" | "delivered" | "current";
}

interface LeafletMapProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  showRoute?: boolean;
}

const statusColors: Record<string, string> = {
  moving: "#3b82f6",
  delayed: "#ef4444",
  delivered: "#22c55e",
  current: "#f97316",
};

const LeafletMap = ({ markers, center = [22.5, 78.5], zoom = 5, className = "", showRoute = false }: LeafletMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark tile layer
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing layers
    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    if (showRoute && markers.length > 1) {
      const latlngs = markers.map(m => [m.lat, m.lng] as [number, number]);
      L.polyline(latlngs, {
        color: "#f97316",
        weight: 2,
        opacity: 0.5,
        dashArray: "10, 10",
        className: "ai-route-line"
      }).addTo(map);
    }

    markers.forEach((m) => {
      const color = statusColors[m.status] || "#3b82f6";

      // Outer pulse ring
      L.circleMarker([m.lat, m.lng], {
        radius: 12,
        color,
        fillColor: color,
        fillOpacity: 0.15,
        weight: 1,
        opacity: 0.4,
      }).addTo(map);

      // Inner dot
      L.circleMarker([m.lat, m.lng], {
        radius: 5,
        color,
        fillColor: color,
        fillOpacity: 0.9,
        weight: 2,
        opacity: 1,
      })
        .bindTooltip(
          `<div style="font-family:Space Grotesk,sans-serif;font-size:12px;font-weight:600;color:#fff">${m.id}</div>
           <div style="font-size:11px;color:rgba(255,255,255,0.6)">${m.label}</div>
           <div style="font-size:10px;color:${color};text-transform:capitalize">${m.status}</div>`,
          {
            className: "leaflet-dark-tooltip",
            direction: "top",
            offset: [0, -8],
          }
        )
        .addTo(map);
    });
  }, [markers]);

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      <div ref={mapRef} className="h-full w-full" />
      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] flex gap-3 rounded-lg border border-white/[0.08] bg-[#0a0a14]/90 px-3 py-2 backdrop-blur-sm">
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5 text-[10px] text-white/50">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="capitalize">{status}</span>
          </div>
        ))}
      </div>
      <style>{`
        .leaflet-dark-tooltip {
          background: rgba(10,10,20,0.95) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4) !important;
        }
        .leaflet-dark-tooltip::before {
          border-top-color: rgba(10,10,20,0.95) !important;
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
        @keyframes dash {
          to {
            stroke-dashoffset: -100;
          }
        }
        .ai-route-line {
          stroke-dasharray: 10, 10;
          animation: dash 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LeafletMap;
