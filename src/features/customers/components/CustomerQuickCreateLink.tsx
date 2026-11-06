import { Button } from "antd";
import { useState } from "react";

import { AutoOpen } from "@/components/AutoOpen";
import { CustomerCreateModal } from "@/components/customers/CustomerCreateModal";
import type { CustomerView } from "@/types/handoff.generated";

export interface CustomerQuickCreateLinkProps {
  onCreated: (customer: CustomerView) => void;
}

/**
 * Lối tắt "Tạo khách hàng mới" ngay dưới ô chọn khách hàng của form.
 * Modal chỉ được mount sau lần bấm đầu tiên để không tải trước form tạo khách hàng.
 */
export function CustomerQuickCreateLink({ onCreated }: CustomerQuickCreateLinkProps) {
  const [opened, setOpened] = useState(0);

  return (
    <>
      <Button
        onClick={() => setOpened((current) => current + 1)}
        size="small"
        style={{ paddingInline: 0 }}
        type="link"
      >
        + Tạo khách hàng mới
      </Button>
      {opened > 0 && (
        <CustomerCreateModal
          key={opened}
          onCreated={onCreated}
          trigger={(show) => <AutoOpen show={show} />}
        />
      )}
    </>
  );
}
