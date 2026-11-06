/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPBOX_ACCESS_TOKEN?: string;
  readonly VITE_MAPBOX_STYLE_URL?: string;
  readonly VITE_MAP_STYLE_URL?: string;
  readonly VITE_VEHICLE_3D?: "true" | "false";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
