import React, { useState, useRef, useEffect } from "react";
import { Search, MapPin, AlertCircle, X, Loader2 } from "lucide-react";
import { useGeocode } from "../hooks/useGeocode";
import { useMapStore } from "../store/mapStore";
import type { GeocodingResult } from "../types";

export const AddressSearch: React.FC = () => {
  const { query, setQuery, results, isLoading, postalCodeError, clearResults } =
    useGeocode();
  const flyTo = useMapStore((s) => s.flyTo);
  const setSearchMarker = useMapStore((s) => s.setSearchMarker);

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: GeocodingResult) => {
    setQuery(item.name || item.formattedAddress);
    setSearchMarker(item.coordinates);
    flyTo(item.coordinates, 15);
    setIsOpen(false);
    clearResults();
  };

  const handleClear = () => {
    setQuery("");
    clearResults();
    setSearchMarker(null);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 380,
      }}
    >
      {/* Input tìm kiếm */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "#ffffff",
          borderRadius: 10,
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          padding: "6px 12px",
          transition: "border-color 0.15s ease",
        }}
      >
        <Search size={18} style={{ color: "#64748b", marginRight: 8, flexShrink: 0 }} />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Tìm địa chỉ hoặc mã bưu chính (VD: 700000)..."
          style={{
            border: "none",
            outline: "none",
            width: "100%",
            fontSize: 13,
            color: "#0f172a",
            background: "transparent",
          }}
        />

        {isLoading && (
          <Loader2
            size={16}
            style={{
              color: "#3b82f6",
              animation: "spin 1s linear infinite",
              marginRight: 6,
              flexShrink: 0,
            }}
          />
        )}

        {query && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 2,
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Cảnh báo định dạng mã bưu điện */}
      {postalCodeError && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: 8,
            padding: "6px 10px",
            marginTop: 6,
            fontSize: 12,
            color: "#b45309",
          }}
        >
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>{postalCodeError}</span>
        </div>
      )}

      {/* Dropdown kết quả */}
      {isOpen && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "#ffffff",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
            maxHeight: 280,
            overflowY: "auto",
            zIndex: 1000,
          }}
        >
          {results.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelect(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSelect(item);
              }}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "10px 12px",
                borderBottom: "1px solid #f1f5f9",
                cursor: "pointer",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <MapPin size={16} style={{ color: "#3b82f6", marginTop: 3, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                  {item.name}
                  {item.postalCode && (
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 11,
                        background: "#eff6ff",
                        color: "#2563eb",
                        padding: "1px 6px",
                        borderRadius: 4,
                      }}
                    >
                      {item.postalCode}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  {item.formattedAddress}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
