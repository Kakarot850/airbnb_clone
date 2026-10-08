"use client";

// Leaflet needs `window`, so map components are only rendered in the browser (ssr: false).
import dynamic from "next/dynamic";

const placeholder = () => <div className="h-full w-full animate-pulse bg-soft" />;

export const ListingsMap = dynamic(() => import("./ListingsMapInner"), { ssr: false, loading: placeholder });
export const LocationMap = dynamic(() => import("./LocationMapInner"), { ssr: false, loading: placeholder });
export const PinPicker = dynamic(() => import("./PinPickerInner"), { ssr: false, loading: placeholder });
