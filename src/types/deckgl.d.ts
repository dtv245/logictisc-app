declare module "@deck.gl/mapbox" {
  export interface MapboxOverlayProps {
    layers?: unknown[];
    interleaved?: boolean;
    [key: string]: unknown;
  }

  export class MapboxOverlay {
    constructor(props?: MapboxOverlayProps);
    setProps(props: MapboxOverlayProps): void;
    finalize(): void;
    onAdd(map: unknown): HTMLElement;
    onRemove(): void;
  }
}

declare module "deck.gl" {
  export interface PickingInfo<D = unknown> {
    object?: D;
    x: number;
    y: number;
    [key: string]: unknown;
  }

  export interface LayerProps<D = unknown> {
    id?: string;
    data?: D[] | unknown;
    pickable?: boolean;
    opacity?: number;
    stroked?: boolean;
    filled?: boolean;
    wireframe?: boolean;
    extruded?: boolean;
    radiusScale?: number;
    radiusMinPixels?: number;
    radiusMaxPixels?: number;
    lineWidthMinPixels?: number;
    lineWidthMaxPixels?: number;
    widthScale?: number;
    widthMinPixels?: number;
    widthMaxPixels?: number;
    capRounded?: boolean;
    jointRounded?: boolean;
    getPosition?: (d: D) => [number, number] | number[];
    getFillColor?: ((d: D) => [number, number, number] | [number, number, number, number] | number[]) | [number, number, number] | [number, number, number, number] | number[];
    getLineColor?: ((d: D) => [number, number, number] | [number, number, number, number] | number[]) | [number, number, number] | [number, number, number, number] | number[];
    getRadius?: ((d: D) => number) | number;
    getLineWidth?: ((d: D) => number) | number;
    getPath?: (d: D) => [number, number][] | number[][];
    getColor?: ((d: D) => [number, number, number] | [number, number, number, number] | number[]) | [number, number, number] | [number, number, number, number] | number[];
    getWidth?: ((d: D) => number) | number;
    getPolygon?: (d: D) => [number, number][] | number[][];
    updateTriggers?: Record<string, unknown>;
    onHover?: (info: PickingInfo<D>) => void;
    onClick?: (info: PickingInfo<D>) => void;
    [key: string]: unknown;
  }

  export class Layer<D = unknown> {
    constructor(props?: LayerProps<D>);
  }

  export class ScatterplotLayer<D = unknown> extends Layer<D> {}
  export class PolygonLayer<D = unknown> extends Layer<D> {}
  export class PathLayer<D = unknown> extends Layer<D> {}
  export class GeoJsonLayer<D = unknown> extends Layer<D> {}
}
