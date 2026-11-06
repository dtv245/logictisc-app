import { TmsFlowLayout } from "@/pages/tms-flow/TmsFlowLayout";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";

function CurrentPath() {
  const { pathname } = useLocation();
  return <output data-testid="current-path">{pathname}</output>;
}

describe("TmsFlowLayout", () => {
  it("removes the duplicate horizontal navigation and preserves the create-load action", async () => {
    render(
      <MemoryRouter initialEntries={["/tms"]}>
        <Routes>
          <Route element={<TmsFlowLayout />} path="/tms">
            <Route element={<p>Trang TMS</p>} index />
          </Route>
          <Route element={<CurrentPath />} path="/loads/create" />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Trang TMS")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Các màn hình điều hành" })).toBeNull();
    expect(document.querySelector(".tms-subnav")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Tạo lô hàng" }));
    expect(await screen.findByTestId("current-path")).toHaveTextContent("/loads/create");
  });
});
