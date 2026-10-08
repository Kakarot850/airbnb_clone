"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Circle, MapContainer, Marker, TileLayer } from "react-leaflet";
import { TILE_ATTRIBUTION, TILE_URL } from "./config";

const homeIcon = L.divIcon({
  className: "",
  iconSize: [0, 0],
  html: `<div class="home-pin"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></div>`,
});

/** Map with the (approximate) location of one listing. */
export default function LocationMapInner({ latitude, longitude }: { latitude: number; longitude: number }) {
  return (
    <MapContainer center={[latitude, longitude]} zoom={13} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <Circle center={[latitude, longitude]} radius={600} pathOptions={{ color: "#ff385c", weight: 0, fillOpacity: 0.12 }} />
      <Marker position={[latitude, longitude]} icon={homeIcon} />
    </MapContainer>
  );
}
