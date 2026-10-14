import type { TerminalType } from "@/types/terminal.types";

export const TERMINAL_TYPE_OPTIONS: Array<{ label: string; value: TerminalType }> = [
  { label: "Cảng biển (Sea Port)", value: "SEA_PORT" },
  { label: "Ga đường sắt (Rail Terminal)", value: "RAIL_TERMINAL" },
  { label: "Kho nội địa / ICD (Inland Depot)", value: "INLAND_DEPOT" },
  { label: "Kho hàng không (Air Cargo)", value: "AIR_CARGO" },
  { label: "Cửa khẩu (Border Crossing)", value: "BORDER_CROSSING" },
];
