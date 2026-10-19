import { useState, useEffect, useMemo } from "react";
import type { GeocodingResult, LngLat } from "@/features/map/types";
import { VietnamPostalCodeSchema } from "@/features/map/types";

export interface GeocodeAdapter {
  search(query: string): Promise<GeocodingResult[]>;
}

/**
 * Photon OpenStreetMap Geocoding Adapter (Miễn phí, không cần token).
 * Mặc định ưu tiên tìm kiếm quanh TP.HCM [lng: 106.66, lat: 10.76].
 */
export class PhotonGeocodeAdapter implements GeocodeAdapter {
  private baseUrl: string;

  constructor(
    baseUrl: string = import.meta.env.VITE_GEOCODE_API_URL || "https://photon.komoot.io/api",
  ) {
    this.baseUrl = baseUrl;
  }

  async search(query: string): Promise<GeocodingResult[]> {
    if (!query || query.trim().length < 2) return [];

    try {
      // Ưu tiên tìm kiếm trong phạm vi Việt Nam và gần TP.HCM
      const url = new URL(this.baseUrl);
      url.searchParams.set("q", query);
      url.searchParams.set("lat", "10.762622");
      url.searchParams.set("lon", "106.660172");
      url.searchParams.set("limit", "5");

      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        throw new Error(`Geocoding HTTP error: ${res.status}`);
      }

      interface PhotonFeature {
        geometry: { coordinates: [number, number] };
        properties: {
          osm_id?: number | string;
          name?: string;
          street?: string;
          city?: string;
          state?: string;
          country?: string;
          postcode?: string;
          type?: string;
        };
      }

      const data = (await res.json()) as { features?: PhotonFeature[] };
      const features = data.features || [];

      return features.map((f, index): GeocodingResult => {
        const props = f.properties;
        const [lng, lat] = f.geometry.coordinates; // Photon trả về [lng, lat]

        const addressParts = [
          props.name,
          props.street,
          props.city,
          props.state,
          props.country,
        ].filter(Boolean);

        return {
          id: String(props.osm_id || `geo-${index}-${Date.now()}`),
          name: props.name || props.street || query,
          formattedAddress: addressParts.join(", ") || query,
          coordinates: [lng, lat] as LngLat,
          postalCode: props.postcode,
          type: props.type,
        };
      });
    } catch (error) {
      console.warn("Geocode error, returning local fallback:", error);
      return [];
    }
  }
}

/**
 * Hook tìm kiếm địa chỉ với debounce và hỗ trợ kiểm tra mã bưu chính Việt Nam.
 */
export function useGeocode(adapter: GeocodeAdapter = new PhotonGeocodeAdapter()) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Derive postalCodeError trực tiếp trong render thay vì gọi setState trong effect
  const postalCodeError = useMemo(() => {
    const trimmed = query.trim();
    if (/^\d+$/.test(trimmed)) {
      const validation = VietnamPostalCodeSchema.safeParse(trimmed);
      return validation.success ? null : "Mã bưu chính chưa hợp lệ (cần 6 chữ số).";
    }
    return null;
  }, [query]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      const timer = setTimeout(() => {
        setResults([]);
        setIsLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    // 2. Debounce gọi API geocoding 350ms
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await adapter.search(trimmed);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, adapter]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    postalCodeError,
    clearResults: () => setResults([]),
  };
}
