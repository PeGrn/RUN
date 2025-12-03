"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ActivityMapProps {
  gpxData: string;
}

export function ActivityMap({ gpxData }: ActivityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([0, 0], 13);
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Parse GPX and extract coordinates
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(gpxData, "text/xml");

    // Get all trackpoints from GPX
    const trkpts = xmlDoc.querySelectorAll("trkpt");
    const coordinates: [number, number][] = [];

    trkpts.forEach((trkpt) => {
      const lat = parseFloat(trkpt.getAttribute("lat") || "0");
      const lon = parseFloat(trkpt.getAttribute("lon") || "0");
      if (lat !== 0 && lon !== 0) {
        coordinates.push([lat, lon]);
      }
    });

    if (coordinates.length > 0) {
      // Draw the route as a polyline
      const polyline = L.polyline(coordinates, {
        color: "#3b82f6",
        weight: 4,
        opacity: 0.8,
      }).addTo(map);

      // Add start marker
      L.marker(coordinates[0], {
        icon: L.divIcon({
          className: "custom-marker",
          html: '<div style="background: #10b981; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
        }),
      })
        .addTo(map)
        .bindPopup("Départ");

      // Add end marker
      L.marker(coordinates[coordinates.length - 1], {
        icon: L.divIcon({
          className: "custom-marker",
          html: '<div style="background: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
        }),
      })
        .addTo(map)
        .bindPopup("Arrivée");

      // Fit map to route bounds
      map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [gpxData]);

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Carte du parcours
        </h2>
      </div>
      <div ref={mapRef} className="w-full h-96" />
    </div>
  );
}
