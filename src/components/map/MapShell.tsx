import { Button, Drawer, Grid } from "antd";
import { ChevronDown, ChevronUp, MapPin, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from "lucide-react";
import mapboxgl from "mapbox-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { validateMapboxPublicToken } from "@/utils/tms-flow/mapbox";

import { MapContext } from "./MapContext";
import "mapbox-gl/dist/mapbox-gl.css";
import "./MapShell.css";

const DEFAULT_MAP_CENTER: [number, number] = [106.660172, 10.762622];
const DEFAULT_MAP_ZOOM = 4;
const MOBILE_DRAWER_WIDTH = 380;
const EMPTY_PADDING = { top: 16, right: 16, bottom: 16, left: 16 };

interface MapLifecycleRecord {
  map: mapboxgl.Map;
  cleanupRevision: number;
  removed: boolean;
}

// React StrictMode replays effects in development. Reuse the same Map instance
// across that synchronous replay instead of destroying and recreating its GL context.
const mapsByContainer = new WeakMap<HTMLDivElement, MapLifecycleRecord>();

export interface MapShellProps {
  testId?: string;
  fallbackContent?: ReactNode;
  top?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  bottom?: ReactNode;
  leftTitle?: string;
  rightTitle?: string;
  bottomTitle?: string;
  children?: ReactNode;
}

type MobilePanel = "left" | "right" | null;

export function MapShell({
  testId,
  fallbackContent,
  top,
  left,
  right,
  bottom,
  leftTitle,
  rightTitle,
  bottomTitle,
  children,
}: MapShellProps) {
  const { t } = useTranslation();
  const translateRef = useRef(t);
  const screens = Grid.useBreakpoint();
  const isNarrow = !screens.xl;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapElementRef = useRef<HTMLDivElement>(null);
  const topPanelRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLElement>(null);
  const rightPanelRef = useRef<HTMLElement>(null);
  const bottomPanelRef = useRef<HTMLElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const loadedRef = useRef(false);
  const webglLostRef = useRef(false);
  const lastPaddingRef = useRef<string>("");
  const [loadedMap, setLoadedMap] = useState<mapboxgl.Map | null>(null);
  const [mapError, setMapError] = useState<string>();
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [bottomCollapsed, setBottomCollapsed] = useState(false);
  const [webglSupported] = useState(() => {
    try {
      return mapboxgl.supported();
    } catch {
      return false;
    }
  });

  const rawToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  const tokenValidation = useMemo(() => validateMapboxPublicToken(rawToken), [rawToken]);
  const styleUrl =
    import.meta.env.VITE_MAPBOX_STYLE_URL?.trim() ||
    import.meta.env.VITE_MAP_STYLE_URL?.trim();

  useEffect(() => {
    translateRef.current = t;
  }, [t]);

  useEffect(() => {
    loadedRef.current = false;
    webglLostRef.current = false;
    lastPaddingRef.current = "";

    if (!tokenValidation.valid || !tokenValidation.token) {
      return undefined;
    }
    const mapContainer = mapElementRef.current;
    if (!styleUrl || !mapContainer || !webglSupported) {
      return undefined;
    }

    let disposed = false;
    let map: mapboxgl.Map;
    let mapRecord: MapLifecycleRecord;
    let reusedMap = false;
    let canvas: HTMLCanvasElement;
    try {
      const existingRecord = mapsByContainer.get(mapContainer);
      if (existingRecord && !existingRecord.removed) {
        reusedMap = true;
        mapRecord = existingRecord;
        mapRecord.cleanupRevision += 1;
        map = mapRecord.map;
      } else {
        map = new mapboxgl.Map({
          accessToken: tokenValidation.token,
          center: DEFAULT_MAP_CENTER,
          container: mapContainer,
          minZoom: DEFAULT_MAP_ZOOM,
          pitch: 45,
          style: styleUrl,
          zoom: DEFAULT_MAP_ZOOM,
        });
        mapRecord = { map, cleanupRevision: 0, removed: false };
        mapsByContainer.set(mapContainer, mapRecord);
        map.addControl(new mapboxgl.NavigationControl(), "bottom-right");
      }
      mapRef.current = map;
      canvas = map.getCanvas();
    } catch {
      console.warn("[MapShell] Map initialization failed.");
      queueMicrotask(() => setMapError(translateRef.current("tmsDashboard.mapUnavailable")));
      return undefined;
    }

    const handleLoad = () => {
      if (disposed || webglLostRef.current) return;
      loadedRef.current = true;
      setMapError(undefined);
      setLoadedMap(map);
    };
    const handleStyleLoad = () => {
      if (disposed) return;
      if (webglLostRef.current) return;
      try {
        if (!map.isStyleLoaded()) return;
        loadedRef.current = true;
        setMapError(undefined);
        setLoadedMap(map);
      } catch {
        // A style event may race with WebGL context loss; restoration will retry.
      }
    };
    const handleWebglContextLost = (event: Event) => {
      event.preventDefault();
      if (disposed) return;
      webglLostRef.current = true;
      console.warn("[MapShell] WebGL context lost; map layers paused until restoration.");
      loadedRef.current = false;
      setLoadedMap(null);
      setMapError(translateRef.current("tmsDashboard.mapUnavailable"));
    };
    const handleWebglContextRestored = () => {
      if (disposed) return;
      webglLostRef.current = false;
      try {
        map.resize();
        handleStyleLoad();
      } catch {
        // The style.load event will re-enable map layers once Mapbox is ready.
      }
    };
    const handleError = (event: mapboxgl.ErrorEvent) => {
      if (!disposed && !loadedRef.current && event.error) {
        console.warn("[MapShell] Map style failed to load.");
        setMapError(translateRef.current("tmsDashboard.mapUnavailable"));
      }
    };
    map.on("load", handleLoad);
    map.on("style.load", handleStyleLoad);
    map.on("error", handleError);
    canvas.addEventListener("webglcontextlost", handleWebglContextLost, false);
    canvas.addEventListener("webglcontextrestored", handleWebglContextRestored, false);
    // A map reused after StrictMode's effect replay may have loaded already.
    try {
      if (reusedMap && map.isStyleLoaded()) handleStyleLoad();
    } catch {
      // Mapbox may still be restoring its WebGL context.
    }

    return () => {
      disposed = true;
      map.off("load", handleLoad);
      map.off("style.load", handleStyleLoad);
      map.off("error", handleError);
      canvas.removeEventListener("webglcontextlost", handleWebglContextLost);
      canvas.removeEventListener("webglcontextrestored", handleWebglContextRestored);
      const cleanupRevision = ++mapRecord.cleanupRevision;
      queueMicrotask(() => {
        if (mapRecord.removed || mapRecord.cleanupRevision !== cleanupRevision) return;
        try {
          map.remove();
        } catch {
          // The WebGL context may already be lost; still release the React/map references.
        }
        mapRecord.removed = true;
        if (mapsByContainer.get(mapContainer) === mapRecord) {
          mapsByContainer.delete(mapContainer);
        }
      });
      if (mapRef.current === map) mapRef.current = null;
      loadedRef.current = false;
    };
  }, [styleUrl, tokenValidation.reason, tokenValidation.token, tokenValidation.valid, webglSupported]);

  useEffect(() => {
    const map = loadedMap;
    const container = containerRef.current;
    if (!map || !container) return undefined;

    let frame = 0;
    const updateLayout = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        try {
          map.resize();
        } catch {
          return;
        }
        const drawerWidth = Math.min(window.innerWidth * 0.9, MOBILE_DRAWER_WIDTH);
        const leftWidth = isNarrow
          ? mobilePanel === "left" ? drawerWidth : 0
          : left && !leftCollapsed ? leftPanelRef.current?.getBoundingClientRect().width ?? 0 : 0;
        const rightWidth = isNarrow
          ? mobilePanel === "right" ? drawerWidth : 0
          : right && !rightCollapsed ? rightPanelRef.current?.getBoundingClientRect().width ?? 0 : 0;
        const topHeight = topPanelRef.current?.getBoundingClientRect().height ?? 0;
        const bottomHeight = bottom && !bottomCollapsed
          ? bottomPanelRef.current?.getBoundingClientRect().height ?? 0
          : 0;
        const padding = {
          top: topHeight + EMPTY_PADDING.top,
          right: rightWidth + EMPTY_PADDING.right,
          bottom: bottomHeight + EMPTY_PADDING.bottom,
          left: leftWidth + EMPTY_PADDING.left,
        };
        const key = `${padding.top}:${padding.right}:${padding.bottom}:${padding.left}`;
        if (key !== lastPaddingRef.current) {
          lastPaddingRef.current = key;
          try {
            map.easeTo({ padding, duration: 220 });
          } catch {
            // Context restoration will trigger another layout update.
          }
        }
      });
    };

    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(updateLayout);
    [container, topPanelRef.current, leftPanelRef.current, rightPanelRef.current, bottomPanelRef.current]
      .filter((element): element is HTMLElement => element !== null)
      .forEach((element) => observer?.observe(element));
    window.addEventListener("resize", updateLayout);
    updateLayout();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", updateLayout);
    };
  }, [bottom, bottomCollapsed, isNarrow, left, leftCollapsed, loadedMap, mobilePanel, right, rightCollapsed, top]);

  const fallbackMessage = mapError ?? (
    !tokenValidation.valid || !tokenValidation.token
      ? tokenValidation.reason === "missing"
        ? t("tmsDashboard.mapTokenMissing")
        : t("tmsDashboard.mapUnavailable")
      : !styleUrl || !webglSupported
        ? t("tmsDashboard.mapUnavailable")
        : undefined
  );
  const hasError = Boolean(fallbackMessage);
  const mapContent = loadedMap && !hasError ? (
    <MapContext.Provider value={loadedMap}>{children}</MapContext.Provider>
  ) : null;

  return (
    <div className="map-shell" data-testid={testId ?? "map-shell"} ref={containerRef}>
      <div aria-hidden="true" className="map-shell__map" ref={mapElementRef} />
      {hasError ? (
        <div className="map-shell__fallback" role="status">
          <MapPin aria-hidden="true" className="map-shell__fallback-icon" size={28} />
          <p>{fallbackMessage}</p>
          {fallbackContent}
        </div>
      ) : null}
      {mapContent}

      <div className="map-shell__overlay" data-testid="map-shell-overlay">
        <div className="map-shell__top" ref={topPanelRef}>
          <div className="map-shell__top-content">{top}</div>
          {isNarrow && (left || right) ? (
            <div className="map-shell__mobile-controls">
              {left ? (
                <Button
                  aria-label={leftTitle}
                  icon={<PanelLeftOpen aria-hidden="true" size={18} />}
                  onClick={() => setMobilePanel("left")}
                  title={leftTitle}
                />
              ) : null}
              {right ? (
                <Button
                  aria-label={rightTitle}
                  icon={<PanelRightOpen aria-hidden="true" size={18} />}
                  onClick={() => setMobilePanel("right")}
                  title={rightTitle}
                />
              ) : null}
            </div>
          ) : null}
        </div>

        {!isNarrow && left && !leftCollapsed ? (
          <aside className="map-shell__panel map-shell__panel--left" ref={leftPanelRef}>
            <Button
              aria-label={leftTitle}
              className="map-shell__collapse map-shell__collapse--left"
              icon={<PanelLeftClose aria-hidden="true" size={16} />}
              onClick={() => setLeftCollapsed(true)}
              title={leftTitle}
            />
            {left}
          </aside>
        ) : null}
        {!isNarrow && left && leftCollapsed ? (
          <Button
            aria-label={leftTitle}
            className="map-shell__reopen map-shell__reopen--left"
            icon={<PanelLeftOpen aria-hidden="true" size={16} />}
            onClick={() => setLeftCollapsed(false)}
            title={leftTitle}
          />
        ) : null}

        {!isNarrow && right && !rightCollapsed ? (
          <aside className="map-shell__panel map-shell__panel--right" ref={rightPanelRef}>
            <Button
              aria-label={rightTitle}
              className="map-shell__collapse map-shell__collapse--right"
              icon={<PanelRightClose aria-hidden="true" size={16} />}
              onClick={() => setRightCollapsed(true)}
              title={rightTitle}
            />
            {right}
          </aside>
        ) : null}
        {!isNarrow && right && rightCollapsed ? (
          <Button
            aria-label={rightTitle}
            className="map-shell__reopen map-shell__reopen--right"
            icon={<PanelRightOpen aria-hidden="true" size={16} />}
            onClick={() => setRightCollapsed(false)}
            title={rightTitle}
          />
        ) : null}

        {bottom ? (
          <div className={`map-shell__bottom${bottomCollapsed ? " is-collapsed" : ""}`}>
            <Button
              aria-label={bottomTitle}
              className="map-shell__bottom-toggle"
              icon={bottomCollapsed ? <ChevronUp aria-hidden="true" size={16} /> : <ChevronDown aria-hidden="true" size={16} />}
              onClick={() => setBottomCollapsed((value) => !value)}
              title={bottomTitle}
            />
            {!bottomCollapsed ? (
              <aside className="map-shell__panel map-shell__panel--bottom" ref={bottomPanelRef}>
                {bottom}
              </aside>
            ) : null}
          </div>
        ) : null}
      </div>

      <Drawer
        className="map-shell__drawer"
        onClose={() => setMobilePanel(null)}
        open={mobilePanel === "left"}
        placement="left"
        title={leftTitle}
        width={MOBILE_DRAWER_WIDTH}
      >
        {left}
      </Drawer>
      <Drawer
        className="map-shell__drawer"
        onClose={() => setMobilePanel(null)}
        open={mobilePanel === "right"}
        placement="right"
        title={rightTitle}
        width={MOBILE_DRAWER_WIDTH}
      >
        {right}
      </Drawer>
    </div>
  );
}
