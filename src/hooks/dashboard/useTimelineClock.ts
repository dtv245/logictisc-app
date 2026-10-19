import { useEffect, useState } from "react";

const currentTime = (): string => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());

export function useTimelineClock(override?: string): string {
  const [clock, setClock] = useState(currentTime);
  useEffect(() => {
    if (override !== undefined) return;
    const timer = window.setInterval(() => setClock(currentTime()), 30_000);
    return () => window.clearInterval(timer);
  }, [override]);
  return override ?? clock;
}
