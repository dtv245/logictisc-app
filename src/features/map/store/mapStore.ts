import { create } from "zustand";
import type { DeliveryPoint, DeliveryStatus, LngLat, VehicleType } from "../types";

export interface ViewportState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

export interface MapStoreState {
  // 1. Viewport
  viewport: ViewportState;
  setViewport: (viewport: Partial<ViewportState>) => void;
  flyTo: (coords: LngLat, zoom?: number) => void;

  // 2. Filters
  selectedVehicles: VehicleType[];
  toggleVehicle: (vehicle: VehicleType) => void;
  selectAllVehicles: () => void;
  clearAllVehicles: () => void;

  selectedStatuses: DeliveryStatus[];
  toggleStatus: (status: DeliveryStatus) => void;
  selectAllStatuses: () => void;

  // 3. Layer Toggles
  pointsEnabled: boolean;
  setPointsEnabled: (enabled: boolean) => void;

  h3Enabled: boolean;
  setH3Enabled: (enabled: boolean) => void;
  toggleH3: () => void;
  h3Resolution: number;
  setH3Resolution: (res: number) => void;

  zonesEnabled: boolean;
  setZonesEnabled: (enabled: boolean) => void;

  routesEnabled: boolean;
  setRoutesEnabled: (enabled: boolean) => void;

  // 4. Selections & Hover
  selectedPoint: DeliveryPoint | null;
  setSelectedPoint: (point: DeliveryPoint | null) => void;

  hoveredPoint: DeliveryPoint | null;
  hoverCoords: { x: number; y: number } | null;
  setHoveredPoint: (
    point: DeliveryPoint | null,
    coords?: { x: number; y: number } | null,
  ) => void;

  // 5. Search Marker
  searchMarker: LngLat | null;
  setSearchMarker: (marker: LngLat | null) => void;
}

// Toạ độ mặc định trung tâm TP. Hồ Chí Minh
const DEFAULT_CENTER: LngLat = [106.660172, 10.762622];

export const useMapStore = create<MapStoreState>((set) => ({
  // Viewport
  viewport: {
    longitude: DEFAULT_CENTER[0],
    latitude: DEFAULT_CENTER[1],
    zoom: 12,
    pitch: 0,
    bearing: 0,
  },
  setViewport: (patch) =>
    set((state) => ({ viewport: { ...state.viewport, ...patch } })),
  flyTo: (coords, zoom = 14) =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        longitude: coords[0],
        latitude: coords[1],
        zoom,
      },
    })),

  // Filters
  selectedVehicles: ["motorbike", "van", "truck_1t"],
  toggleVehicle: (vehicle) =>
    set((state) => {
      const exists = state.selectedVehicles.includes(vehicle);
      if (exists) {
        // Nếu chỉ còn 1 phương tiện thì không cho bỏ chọn hết
        if (state.selectedVehicles.length === 1) return state;
        return {
          selectedVehicles: state.selectedVehicles.filter((v) => v !== vehicle),
        };
      }
      return { selectedVehicles: [...state.selectedVehicles, vehicle] };
    }),
  selectAllVehicles: () =>
    set({ selectedVehicles: ["motorbike", "van", "truck_1t"] }),
  clearAllVehicles: () => set({ selectedVehicles: [] }),

  selectedStatuses: ["pending", "in_transit", "delivered", "failed"],
  toggleStatus: (status) =>
    set((state) => {
      const exists = state.selectedStatuses.includes(status);
      if (exists) {
        if (state.selectedStatuses.length === 1) return state;
        return {
          selectedStatuses: state.selectedStatuses.filter((s) => s !== status),
        };
      }
      return { selectedStatuses: [...state.selectedStatuses, status] };
    }),
  selectAllStatuses: () =>
    set({ selectedStatuses: ["pending", "in_transit", "delivered", "failed"] }),

  // Layers
  pointsEnabled: true,
  setPointsEnabled: (pointsEnabled) => set({ pointsEnabled }),

  h3Enabled: false,
  setH3Enabled: (h3Enabled) => set({ h3Enabled }),
  toggleH3: () => set((state) => ({ h3Enabled: !state.h3Enabled })),
  h3Resolution: 8,
  setH3Resolution: (h3Resolution) => set({ h3Resolution }),

  zonesEnabled: true,
  setZonesEnabled: (zonesEnabled) => set({ zonesEnabled }),

  routesEnabled: true,
  setRoutesEnabled: (routesEnabled) => set({ routesEnabled }),

  // Selections
  selectedPoint: null,
  setSelectedPoint: (selectedPoint) => set({ selectedPoint }),

  hoveredPoint: null,
  hoverCoords: null,
  setHoveredPoint: (hoveredPoint, hoverCoords = null) =>
    set({ hoveredPoint, hoverCoords }),

  // Search
  searchMarker: null,
  setSearchMarker: (searchMarker) => set({ searchMarker }),
}));
