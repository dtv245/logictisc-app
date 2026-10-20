import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Button, Dropdown, Drawer, Input, Modal, Popover, Select, Skeleton, Spin, Tooltip } from "antd";
import "@/styles/global.scss";

export function ReducedMotionOverlayFixture() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <main>
      <h1>Reduced motion overlays</h1>
      <Button onClick={() => setModalOpen(true)}>Open modal</Button>
      <Modal title="Modal fixture" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}>
        Modal content
      </Modal>

      <Button onClick={() => setDrawerOpen(true)}>Open drawer</Button>
      <Drawer title="Drawer fixture" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        Drawer content
      </Drawer>

      <Popover
        title="Popover fixture"
        content={<span>Popover content</span>}
        trigger="click"
        open={popoverOpen}
        onOpenChange={setPopoverOpen}
      >
        <Button>Open popover</Button>
      </Popover>

      <Dropdown
        menu={{ items: [{ key: "item", label: "Dropdown item" }] }}
        trigger={["click"]}
        open={dropdownOpen}
        onOpenChange={setDropdownOpen}
      >
        <Button>Open dropdown</Button>
      </Dropdown>

      <label htmlFor="overlay-select">Select fixture</label>
      <Select
        id="overlay-select"
        aria-label="Select fixture"
        style={{ width: 180 }}
        options={[{ value: "one", label: "Option one" }]}
      />

      <Tooltip title="Tooltip fixture" trigger={["focus"]}>
        <Button>Focus tooltip</Button>
      </Tooltip>

      <section aria-label="Persistent loading indicators">
        <Spin spinning aria-label="Still loading">
          <div>Pending request</div>
        </Spin>
        <Skeleton active aria-label="Loading placeholder" />
      </section>
      <Input aria-label="Move focus away from tooltip" />
    </main>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(<ReducedMotionOverlayFixture />);
