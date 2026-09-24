/**
 * Trạng thái "chưa có nguồn dữ liệu".
 *
 * Ghi rõ lý do và endpoint còn thiếu. Không bao giờ hiển thị số ước lượng, số
 * mẫu, hay dữ liệu giả — trên màn hình ban điều hành, một con số sai còn tệ
 * hơn một ô trống nói rõ vì sao nó trống.
 */

import { DatabaseOutlined } from "@ant-design/icons";
import { Typography } from "antd";
import { useTranslation } from "react-i18next";

interface UnavailableNoticeProps {
  /** Locale key giải thích vì sao chỉ số này chưa có dữ liệu. */
  reasonKey: string;
  /**
   * Endpoint backend cần bổ sung, CHỈ khi endpoint đó còn thiếu.
   *
   * Bỏ trống khi endpoint đã tồn tại nhưng kỳ này không ra số — lúc đó không có
   * endpoint nào để chỉ ra, và in ra một cái tên ở đây sẽ khiến người đọc đi
   * tìm một việc đã làm xong rồi.
   */
  requiredEndpoint?: string;
}

export const UnavailableNotice = ({
  reasonKey,
  requiredEndpoint,
}: UnavailableNoticeProps) => {
  const { t } = useTranslation();

  return (
    <div className="exec-unavailable">
      <DatabaseOutlined className="exec-unavailable__icon" />
      <Typography.Text className="exec-unavailable__title" strong>
        {t("executive.unavailable.title")}
      </Typography.Text>
      <Typography.Text className="exec-unavailable__reason" type="secondary">
        {t(reasonKey)}
      </Typography.Text>
      {requiredEndpoint ? (
        <span className="exec-unavailable__endpoint">
          <span className="exec-unavailable__endpoint-label">
            {t("executive.unavailable.requiredEndpoint")}
          </span>
          <code>{requiredEndpoint}</code>
        </span>
      ) : null}
    </div>
  );
};
