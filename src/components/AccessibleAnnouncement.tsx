/**
 * AccessibleAnnouncement
 *
 * Announces asynchronous UI changes without adding duplicate visible text.
 * The visually hidden region remains available to assistive technology.
 */
import type { CSSProperties } from "react";

const visuallyHiddenStyle: CSSProperties = {
  border: 0,
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  margin: -1,
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  whiteSpace: "nowrap",
  width: 1,
};

export interface AccessibleAnnouncementProps {
  message: string;
  politeness?: "polite" | "assertive";
}

export function AccessibleAnnouncement({
  message,
  politeness = "polite",
}: AccessibleAnnouncementProps) {
  return (
    <span
      aria-atomic="true"
      aria-live={politeness}
      role={politeness === "assertive" ? "alert" : "status"}
      style={visuallyHiddenStyle}
    >
      {message}
    </span>
  );
}
