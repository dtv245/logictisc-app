import { useSearchParams } from "react-router-dom";

export function useOperationsPreview(): {
  isPreview: boolean;
  setPreviewEnabled: (enabled: boolean) => void;
} {
  const [searchParams, setSearchParams] = useSearchParams();

  const setPreviewEnabled = (enabled: boolean): void => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (enabled) next.set("demo", "1");
      else next.delete("demo");
      return next;
    }, { replace: true });
  };

  return { isPreview: searchParams.get("demo") === "1", setPreviewEnabled };
}
