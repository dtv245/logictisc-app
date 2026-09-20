import { toDate, toDateOrNull } from "@formatters/dateTime";
import type { TerminalResponse } from "@/types/terminal.dto";
import type { Terminal } from "@/types/terminal.types";

export function mapTerminalResponse(response: TerminalResponse): Terminal {
  return {
    ...response,
    createdAt: toDate(response.createdAt),
    lastModifiedAt: toDateOrNull(response.lastModifiedAt),
  };
}
