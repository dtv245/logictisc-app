import React, { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { App as AntdApp, Button, ConfigProvider } from "antd";

import { initializeAppI18n } from "../../src/locales";
import { ConfirmActionModal } from "../../src/components/ConfirmActionModal";
import { AiMovementPlanCard } from "../../src/features/ai-dispatch/components/AiMovementPlanCard";
import { AiDispatchRunForm } from "../../src/features/ai-dispatch/components/AiDispatchRunForm";
import type { AiDispatchActionsResult } from "../../src/features/ai-dispatch/hooks/useAiDispatchActions";
import { DocumentDropboxDrawer } from "../../src/features/documents/components/DocumentDropboxDrawer";
import { OptimizationCandidateDrawer } from "../../src/features/optimization/components/OptimizationCandidateDrawer";
import { candidate } from "../../src/tests/fixtures/optimization";
import { initialMovementPlan } from "../../src/tests/fixtures/aiMovementPlan";
import type { Document } from "../../src/types/document.types";
import "../../src/styles/global.scss";

const i18n = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });
const sampleDocument: Document = {
  id: "keyboard-document",
  ownerType: "load",
  fileName: "keyboard-bill-of-lading.pdf",
  originalFileName: "keyboard-bill-of-lading.pdf",
  contentType: "application/pdf",
  fileSizeBytes: 256,
  blobPath: "fixture/keyboard-bill-of-lading.pdf",
  blobContainer: "fixture",
  type: "bill_of_lading",
  status: "active",
  uploadedById: "fixture-user",
  createdAt: "2026-10-20T10:00:00Z",
};

export function KeyboardFocusFixture() {
  const [optimizationOpen, setOptimizationOpen] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [aiRunResult, setAiRunResult] = useState<string | null>(null);
  const [optimizationTrigger, setOptimizationTrigger] = useState<HTMLButtonElement | null>(null);
  const documentTrigger = useRef<HTMLButtonElement>(null);
  const actions = {
    plans: [initialMovementPlan],
    activePlan: initialMovementPlan,
    pending: false,
    error: null,
    initialLoadPending: false,
    initialLoadError: null,
    retryInitialLoad: () => undefined,
    canRun: true,
    canApprove: true,
    runAiDispatch: async () => initialMovementPlan,
    approvePlan: async () => undefined,
    rejectPlan: async () => undefined,
    selectPlan: () => undefined,
  } as unknown as AiDispatchActionsResult;

  return (
    <I18nextProvider i18n={i18n}>
      <ConfigProvider>
        <AntdApp>
          <MemoryRouter>
            <main style={{ maxWidth: 900, margin: "24px auto", padding: 24 }}>
              <h1>Keyboard focus fixture</h1>
              <Button onClick={(event) => {
                setOptimizationTrigger(event.currentTarget);
                setOptimizationOpen(true);
              }}>
                Open optimization candidate drawer
              </Button>
              <OptimizationCandidateDrawer
                candidate={optimizationOpen ? candidate : null}
                onClose={() => setOptimizationOpen(false)}
                triggerElement={optimizationTrigger}
              />

              <ConfirmActionModal
                triggerLabel="Open optimization confirmation"
                triggerAriaLabel="Open optimization confirmation"
                title="Optimization run confirmation"
                description="Confirm the fixture optimization run."
                onConfirm={() => undefined}
                confirmLabel="Confirm optimization"
                cancelLabel="Cancel optimization"
              />

              <section aria-label="AI Dispatch approve fixture">
                <AiMovementPlanCard plan={initialMovementPlan} actions={actions} />
              </section>
              <section aria-label="AI Dispatch run fixture">
                <AiDispatchRunForm actions={actions} onPlanCreated={(plan) => setAiRunResult(plan.id)} />
                {aiRunResult && <output data-testid="ai-run-result">{aiRunResult}</output>}
              </section>

              <Button ref={documentTrigger} onClick={() => setDocumentsOpen(true)}>
                Open documents drawer
              </Button>
              <DocumentDropboxDrawer
                open={documentsOpen}
                document={sampleDocument}
                onClose={() => setDocumentsOpen(false)}
                onDownload={() => undefined}
                onDelete={async () => false}
              />
            </main>
          </MemoryRouter>
        </AntdApp>
      </ConfigProvider>
    </I18nextProvider>
  );
}

createRoot(document.getElementById("root")!).render(<KeyboardFocusFixture />);
