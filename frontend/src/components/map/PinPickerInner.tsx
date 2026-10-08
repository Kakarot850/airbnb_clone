"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import { TILE_ATTRIBUTION, TILE_URL } from "./config";

const pinIcon = L.divIcon({
  className: "",
  iconSize: [0, 0],
  html: `<div class="home-pin"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></div>`,
});

interface PinPickerProps {
  position: [number, number] | null;
  onChange: (position: [number, number]) => void;
}

function ClickToPlace({ onChange }: { onChange: PinPickerProps["onChange"] }) {
  useMapEvents({ click: (event) => onChange([Number(event.latlng.lat.toFixed(5)), Number(event.latlng.lng.toFixed(5))]) });
  return null;
}

/** Host wizard: click the map (or drag the pin) to set the listing's exact location. */
export default function PinPickerInner({ position, onChange }: PinPickerProps) {
  return (
    <MapContainer center={position ?? [25, 10]} zoom={position ? 12 : 2} className="h-full w-full">
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <ClickToPlace onChange={onChange} />
      {position && (
        <Marker
          position={position}
          icon={pinIcon}
          draggable
          eventHandlers={{
            dragend: (event) => {
              const { lat, lng } = (event.target as L.Marker).getLatLng();
              onChange([Number(lat.toFixed(5)), Number(lng.toFixed(5))]);
            },
          }}
        />
      )}
    </MapContainer>
  );
}
