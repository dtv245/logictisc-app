export function useOperationsPreview(): {
  isPreview: boolean;
  setPreviewEnabled: (enabled: boolean) => void;
} {
  return {
    isPreview: false,
    setPreviewEnabled: () => undefined,
  };
}
