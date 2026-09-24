/**
 * Orchestrates the fail-closed startup sequence:
 * runtime config -> locale -> public API health.
 */

import { loadRuntimeConfig } from "./loadRuntimeConfig";
import { probeHealth, type HealthProbeResult } from "./healthProbe";
import {
  RuntimeConfigError,
  type RuntimeConfig,
  type SupportedLocale,
} from "./types";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  createConfigErrorState,
  createHealthProbeState,
  initialAppBootstrapState,
  resolveHealthProbeState,
  type AppBootstrapState,
} from "./bootstrapState";

type LoadConfig = (signal: AbortSignal) => Promise<RuntimeConfig>;
type ProbeApiHealth = (
  config: RuntimeConfig,
  signal: AbortSignal,
) => Promise<HealthProbeResult>;
type ApplyLocale = (
  locale: SupportedLocale,
) => void | Promise<void>;

export interface UseAppBootstrapOptions {
  applyLocale: ApplyLocale;
  loadConfig?: LoadConfig;
  probeApiHealth?: ProbeApiHealth;
}

export interface UseAppBootstrapResult {
  isRetrying: boolean;
  retry: () => void;
  state: AppBootstrapState;
}

const defaultLoadConfig: LoadConfig = (signal) =>
  loadRuntimeConfig({ signal });

const defaultProbeApiHealth: ProbeApiHealth = (config, signal) =>
  probeHealth(config, { signal });

function normalizeBootstrapError(reason: unknown): RuntimeConfigError {
  // Chuẩn hóa mọi lỗi startup về một loại duy nhất để BootstrapStateView không
  // cần biết lỗi phát sinh từ fetch, locale hay health probe implementation.
  if (reason instanceof RuntimeConfigError) {
    return reason;
  }

  return new RuntimeConfigError(
    "CONFIG_FETCH_FAILED",
    "Application bootstrap failed.",
    [],
    { cause: reason },
  );
}

export function useAppBootstrap({
  applyLocale,
  loadConfig = defaultLoadConfig,
  probeApiHealth = defaultProbeApiHealth,
}: UseAppBootstrapOptions): UseAppBootstrapResult {
  const [attempt, setAttempt] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [state, setState] = useState<AppBootstrapState>(
    initialAppBootstrapState,
  );
  const activeRunRef = useRef(0);
  const retryInFlightRef = useRef(false);
  // Giữ dependency mới nhất trong ref để effect chỉ chạy lại khi `attempt`
  // tăng. Nếu đưa các callback inject vào dependency array, caller tạo hàm mới
  // mỗi render có thể vô tình khởi động lại toàn bộ bootstrap.
  const dependenciesRef = useRef({
    applyLocale,
    loadConfig,
    probeApiHealth,
  });

  useEffect(() => {
    dependenciesRef.current = {
      applyLocale,
      loadConfig,
      probeApiHealth,
    };
  }, [applyLocale, loadConfig, probeApiHealth]);

  const retry = useCallback(() => {
    // Chặn double-click tạo nhiều lượt probe song song.
    if (retryInFlightRef.current) {
      return;
    }

    retryInFlightRef.current = true;
    setIsRetrying(true);
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const runId = activeRunRef.current + 1;
    const retryAttempt = attempt > 0;
    activeRunRef.current = runId;

    const isCurrentRun = () =>
      !controller.signal.aborted &&
      activeRunRef.current === runId;

    const settleRetry = () => {
      if (!isCurrentRun()) {
        return;
      }

      retryInFlightRef.current = false;
      setIsRetrying(false);
    };

    const bootstrap = async () => {
      const dependencies = dependenciesRef.current;

      try {
        const config = await dependencies.loadConfig(
          controller.signal,
        );
        if (!isCurrentRun()) {
          return;
        }

        await dependencies.applyLocale(config.defaultLocale);
        if (!isCurrentRun()) {
          return;
        }

        if (!retryAttempt) {
          // Lần đầu hiển thị trạng thái probing. Khi retry, giữ nguyên màn hình
          // lỗi cũ cùng request ID trong lúc nút đang loading để tránh UI nháy.
          setState(createHealthProbeState(config));
        }

        const health = await dependencies.probeApiHealth(
          config,
          controller.signal,
        );
        if (!isCurrentRun()) {
          return;
        }

        setState(resolveHealthProbeState(config, health));
      } catch (reason) {
        if (!isCurrentRun()) {
          return;
        }

        setState(
          createConfigErrorState(normalizeBootstrapError(reason)),
        );
      } finally {
        settleRetry();
      }
    };

    void bootstrap();

    return () => {
      // Abort request khi unmount hoặc trước lượt mới; runId phía trên còn ngăn
      // promise không tuân AbortSignal ghi đè state của lượt mới hơn.
      controller.abort();
    };
  }, [attempt]);

  return {
    isRetrying,
    retry,
    state,
  };
}
