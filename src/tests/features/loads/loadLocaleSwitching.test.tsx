import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ShipmentHeader } from "@/features/loads/components/redesign/ShipmentHeader";
import type { Load } from "@/types/load.types";
import { setTestLocale } from "@/tests/testLocale";

describe("Load detail locale switching", () => {
  it.each([
    { locale: "vi" as const, back: "Quay lại", call: "Gọi tài xế", foreign: ["Back", "Call driver", "戻る", "ドライバーに電話"] },
    { locale: "en" as const, back: "Back", call: "Call driver", foreign: ["Quay lại", "Gọi tài xế", "戻る", "ドライバーに電話"] },
    { locale: "ja" as const, back: "戻る", call: "ドライバーに電話", foreign: ["Quay lại", "Gọi tài xế", "Back", "Call driver"] },
  ])("renders Load header copy in $locale without mixed locale labels", async ({ locale, back, call, foreign }) => {
    await setTestLocale(locale);
    const load = { id: "load-1", number: 42, status: "in_transit", customerName: "Fixture customer" } as Load;
    render(<ShipmentHeader load={load} driverPhone="555-0100" />);

    expect(screen.getByRole("button", { name: back })).toBeInTheDocument();
    const callLink = screen.getByRole("link");
    expect(callLink).toHaveAttribute("href", "tel:555-0100");
    expect(callLink).toHaveTextContent(call);
    expect(screen.getByText(/Fixture customer/)).toBeInTheDocument();
    for (const label of foreign) {
      expect(screen.queryByRole("button", { name: label })).not.toBeInTheDocument();
      expect(screen.queryByText(label, { exact: true })).not.toBeInTheDocument();
    }
  });
});
