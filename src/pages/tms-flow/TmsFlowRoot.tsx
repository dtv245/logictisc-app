import { TmsFlowProvider } from "@/hooks/tms-flow/useTmsFlow";
import { TmsFlowLayout } from "@/pages/tms-flow/TmsFlowLayout";

/** Entry point for the `/tms` demo route group: one provider for S01–S09. */
export function TmsFlowRoot() {
  return (
    <TmsFlowProvider>
      <TmsFlowLayout />
    </TmsFlowProvider>
  );
}
