import type { TerminalResponse } from "@/types/terminal.dto";
import type { Terminal } from "@/types/terminal.types";

export function mapTerminalResponse(response: TerminalResponse): Terminal {
  return {
    ...response,
    createdAt: new Date(response.createdAt),
    lastModifiedAt: response.lastModifiedAt ? new Date(response.lastModifiedAt) : null,
  };
}
