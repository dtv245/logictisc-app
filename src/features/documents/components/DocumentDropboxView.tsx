import React, { useMemo, useState } from "react";
import {
  Breadcrumb,
  Button,
  Card,
  Col,
  Empty,
  Input,
  Pagination,
  Row,
  Segmented,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import {
  AppstoreOutlined,
  CloudOutlined,
  FilterOutlined,
  HomeOutlined,
  ReloadOutlined,
  SearchOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { useDelete } from "@refinedev/core";
import { useTable } from "@refinedev/antd";
import { useTranslation } from "react-i18next";
import type { Document } from "@/types/document.types";
import type { ApiError } from "@/types/api.types";
import { DocumentStatsBar } from "./DocumentStatsBar";
import { DocumentDropboxDropzone } from "./DocumentDropboxDropzone";
import { DocumentDropboxCard } from "./DocumentDropboxCard";
import { DocumentDropboxTable } from "./DocumentDropboxTable";
import { DocumentDropboxDrawer } from "./DocumentDropboxDrawer";
import {
  DOCUMENT_CATEGORY_OPTIONS,
} from "../utils/documentUtils";

const { Text, Title } = Typography;

export const DocumentDropboxView: React.FC = () => {
  const { t } = useTranslation();

  // Chế độ xem: grid (lưới dạng thẻ Dropbox) hoặc list (bảng danh sách)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Tìm kiếm cục bộ theo từ khóa
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  // Phân loại danh mục được chọn
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Bộ lọc trạng thái
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Sắp xếp
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "nameAsc" | "sizeDesc">("newest");

  // File chi tiết đang mở trong Drawer
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Hook Refine useTable đồng bộ URL (?pageSize=10&current=1)
  const {
    tableProps,
    tableQueryResult,
    current,
    setCurrent,
    pageSize,
    setPageSize,
  } = useTable<Document, ApiError>({
    resource: "documents",
    pagination: { mode: "server" },
    syncWithLocation: true,
  });

  // Hook xóa tài liệu
  const { mutate: deleteDocument } = useDelete();

  // Toàn bộ documents từ kết quả API
  const rawDocuments = useMemo(
    () => (tableProps.dataSource as Document[]) || [],
    [tableProps.dataSource],
  );
  const isLoading = tableQueryResult.isLoading || tableQueryResult.isFetching;

  const paginationTotal =
    tableProps.pagination && typeof tableProps.pagination === "object"
      ? (tableProps.pagination.total ?? rawDocuments.length)
      : rawDocuments.length;

  // Thống kê nhanh
  const stats = useMemo(() => {
    let totalSizeBytes = 0;
    let transportCount = 0;
    let fleetCount = 0;
    let activeCount = 0;

    for (const doc of rawDocuments) {
      if (doc.fileSizeBytes) {
        totalSizeBytes += doc.fileSizeBytes;
      }
      if (doc.type === "bill_of_lading" || doc.type === "proof_of_delivery") {
        transportCount++;
      }
      if (doc.type === "driver_license" || doc.type === "inspection") {
        fleetCount++;
      }
      if (doc.status === "active") {
        activeCount++;
      }
    }

    return {
      totalDocuments: paginationTotal,
      totalSizeBytes,
      transportCount,
      fleetCount,
      activeCount,
    };
  }, [rawDocuments, paginationTotal]);

  // Lọc và sắp xếp danh sách tài liệu hiển thị
  const filteredDocuments = useMemo(() => {
    let result = [...rawDocuments];

    // Lọc theo danh mục
    if (selectedCategory !== "all") {
      result = result.filter((d) => d.type === selectedCategory);
    }

    // Lọc theo trạng thái
    if (selectedStatus !== "all") {
      result = result.filter((d) => d.status === selectedStatus);
    }

    // Lọc theo từ khóa tìm kiếm (tên file, mô tả, tên file gốc)
    if (searchKeyword.trim()) {
      const q = searchKeyword.trim().toLowerCase();
      result = result.filter(
        (d) =>
          d.fileName.toLowerCase().includes(q) ||
          (d.description && d.description.toLowerCase().includes(q)) ||
          (d.originalFileName && d.originalFileName.toLowerCase().includes(q)) ||
          (d.loadId && d.loadId.toLowerCase().includes(q)) ||
          (d.truckId && d.truckId.toLowerCase().includes(q)),
      );
    }

    // Sắp xếp
    result.sort((a, b) => {
      if (sortBy === "nameAsc") {
        return a.fileName.localeCompare(b.fileName);
      }
      if (sortBy === "sizeDesc") {
        return (b.fileSizeBytes ?? 0) - (a.fileSizeBytes ?? 0);
      }
      if (sortBy === "oldest") {
        const timeA = new Date(a.capturedAt ?? a.createdAt ?? 0).getTime();
        const timeB = new Date(b.capturedAt ?? b.createdAt ?? 0).getTime();
        return timeA - timeB;
      }
      // default: newest
      const timeA = new Date(a.capturedAt ?? a.createdAt ?? 0).getTime();
      const timeB = new Date(b.capturedAt ?? b.createdAt ?? 0).getTime();
      return timeB - timeA;
    });

    return result;
  }, [rawDocuments, selectedCategory, selectedStatus, searchKeyword, sortBy]);

  // Hành động xem chi tiết
  const handlePreview = (doc: Document) => {
    setSelectedDoc(doc);
    setDrawerOpen(true);
  };

  // Hành động tải xuống
  const handleDownload = (doc: Document) => {
    message.loading({
      content: `${t("documents.dropbox.downloadStarted")}: ${doc.fileName}`,
      key: "doc-download",
    });
    try {
      const downloadUrl = doc.blobPath || `/api/documents/${doc.id}/download`;
      const link = window.document.createElement("a");
      link.href = downloadUrl;
      link.download = doc.fileName;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      message.success({
        content: `${t("documents.dropbox.download")}: ${doc.fileName}`,
        key: "doc-download",
      });
    } catch {
      message.error({
        content: t("documents.dropbox.downloadFailed"),
        key: "doc-download",
      });
    }
  };

  // Hành động xóa tài liệu
  const handleDelete = (doc: Document) => {
    deleteDocument(
      {
        resource: "documents",
        id: doc.id,
        mutationMode: "pessimistic",
      },
      {
        onSuccess: () => {
          message.success(t("documents.dropbox.deleteSuccess"));
          void tableQueryResult.refetch();
        },
        onError: (err) => {
          const apiErr = err as unknown as { message?: string };
          message.error(apiErr?.message || "Không thể xóa tài liệu");
        },
      },
    );
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "16px 20px 40px" }}>
      {/* 1. Header & Breadcrumb */}
      <div style={{ marginBottom: 20 }}>
        <Breadcrumb
          items={[
            {
              title: (
                <Space size={4}>
                  <HomeOutlined />
                  <span>Trang chủ</span>
                </Space>
              ),
            },
            {
              title: (
                <Space size={4}>
                  <CloudOutlined style={{ color: "#2563eb" }} />
                  <span>Dropbox</span>
                </Space>
              ),
            },
            {
              title: t("documents.dropbox.title"),
            },
          ]}
          style={{ marginBottom: 12 }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <Space align="center" size={10}>
              <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>
                {t("documents.dropbox.title")}
              </Title>
              <Tag
                color="blue"
                style={{
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 12,
                  padding: "2px 8px",
                }}
              >
                {t("documents.dropbox.brand")}
              </Tag>
            </Space>
            <Text type="secondary" style={{ fontSize: 14, display: "block", marginTop: 4 }}>
              {t("documents.dropbox.subtitle")}
            </Text>
          </div>

          {/* Công cụ xem: Grid / List view */}
          <Space size={10}>
            <Segmented
              value={viewMode}
              onChange={(val) => setViewMode(val as "grid" | "list")}
              options={[
                {
                  value: "grid",
                  icon: <AppstoreOutlined />,
                  label: t("documents.dropbox.gridView"),
                },
                {
                  value: "list",
                  icon: <UnorderedListOutlined />,
                  label: t("documents.dropbox.listView"),
                },
              ]}
              style={{
                borderRadius: 8,
                padding: 3,
                background: "#f1f5f9",
              }}
            />

            <Button
              icon={<ReloadOutlined spin={isLoading} />}
              onClick={() => void tableQueryResult.refetch()}
              style={{ borderRadius: 8 }}
            />
          </Space>
        </div>
      </div>

      {/* 2. Thẻ chỉ số & Dung lượng Dropbox */}
      <DocumentStatsBar
        totalDocuments={stats.totalDocuments}
        totalSizeBytes={stats.totalSizeBytes}
        transportCount={stats.transportCount}
        fleetCount={stats.fleetCount}
        activeCount={stats.activeCount}
        loading={isLoading && rawDocuments.length === 0}
      />

      {/* 3. Khu vực Kéo thả tệp tin (Dropbox Dropzone) */}
      <DocumentDropboxDropzone
        onFileSelect={(file) => {
          message.info(`Đã chọn tệp: ${file.name}`);
        }}
      />

      {/* 4. Thanh lọc danh mục nhanh (Category Pills) */}
      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 12,
          marginBottom: 16,
          scrollbarWidth: "thin",
        }}
      >
        {DOCUMENT_CATEGORY_OPTIONS.map((cat) => {
          const isSelected = selectedCategory === cat.value;
          return (
            <Button
              key={cat.key}
              type={isSelected ? "primary" : "default"}
              icon={cat.icon}
              onClick={() => setSelectedCategory(cat.value)}
              style={{
                borderRadius: 20,
                fontSize: 13,
                fontWeight: isSelected ? 600 : 400,
                flexShrink: 0,
                borderColor: isSelected ? "#2563eb" : "#e2e8f0",
                background: isSelected ? "#2563eb" : "#ffffff",
                boxShadow: isSelected ? "0 2px 6px rgba(37, 99, 235, 0.25)" : "none",
              }}
            >
              {t(cat.labelKey)}
            </Button>
          );
        })}
      </div>

      {/* 5. Toolbar tìm kiếm, lọc trạng thái và sắp xếp */}
      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          marginBottom: 20,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          background: "#ffffff",
        }}
        bodyStyle={{ padding: "14px 18px" }}
      >
        <Row gutter={[16, 12]} align="middle" justify="space-between">
          <Col xs={24} md={10} lg={8}>
            <Input
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              placeholder={t("documents.dropbox.searchPlaceholder")}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              allowClear
              style={{ borderRadius: 8 }}
            />
          </Col>

          <Col xs={24} md={14} lg={12}>
            <Space
              size={12}
              style={{ width: "100%", justifyContent: "flex-end" }}
              wrap
            >
              <Space size={6}>
                <FilterOutlined style={{ color: "#64748b" }} />
                <Select
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  style={{ width: 150 }}
                  options={[
                    { value: "all", label: t("documents.dropbox.allStatuses") },
                    { value: "active", label: t("documents.status.active") },
                    { value: "archived", label: t("documents.status.archived") },
                    { value: "deleted", label: t("documents.status.deleted") },
                  ]}
                />
              </Space>

              <Select
                value={sortBy}
                onChange={setSortBy}
                style={{ width: 170 }}
                options={[
                  { value: "newest", label: t("documents.dropbox.sortNewest") },
                  { value: "oldest", label: t("documents.dropbox.sortOldest") },
                  { value: "nameAsc", label: t("documents.dropbox.sortNameAsc") },
                  { value: "sizeDesc", label: t("documents.dropbox.sortSizeDesc") },
                ]}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 6. Nội dung hiển thị tài liệu (Grid hoặc List) */}
      {isLoading && rawDocuments.length === 0 ? (
        <Row gutter={[16, 16]}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Col xs={24} sm={12} md={8} lg={6} key={i}>
              <Card style={{ borderRadius: 14 }}>
                <Skeleton active avatar paragraph={{ rows: 3 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : filteredDocuments.length === 0 ? (
        <Card
          bordered={false}
          style={{
            borderRadius: 14,
            padding: "48px 20px",
            textAlign: "center",
            background: "#ffffff",
          }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Title level={5} style={{ color: "#475569", marginBottom: 4 }}>
                  {t("documents.dropbox.emptyTitle")}
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {t("documents.dropbox.emptyDescription")}
                </Text>
              </div>
            }
          />
        </Card>
      ) : viewMode === "grid" ? (
        <Row gutter={[16, 16]}>
          {filteredDocuments.map((doc) => (
            <Col xs={24} sm={12} md={8} lg={6} key={doc.id}>
              <DocumentDropboxCard
                document={doc}
                onPreview={handlePreview}
                onDownload={handleDownload}
                onDelete={handleDelete}
              />
            </Col>
          ))}
        </Row>
      ) : (
        <DocumentDropboxTable
          documents={filteredDocuments}
          loading={isLoading}
          onPreview={handlePreview}
          onDownload={handleDownload}
          onDelete={handleDelete}
        />
      )}

      {/* 7. Phân trang đồng bộ URL (?pageSize=10&current=1) */}
      <div
        style={{
          marginTop: 28,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <Text type="secondary" style={{ fontSize: 13 }}>
          Hiển thị {filteredDocuments.length} trên tổng số {paginationTotal} tài liệu
        </Text>

        <Pagination
          current={current}
          pageSize={pageSize}
          total={paginationTotal}
          showSizeChanger
          pageSizeOptions={["10", "20", "50"]}
          onChange={(page, newPageSize) => {
            setCurrent(page);
            if (newPageSize !== pageSize) {
              setPageSize(newPageSize);
            }
          }}
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} / ${total} tài liệu`
          }
        />
      </div>

      {/* 8. Slide Drawer xem chi tiết tài liệu (Dropbox file inspector) */}
      <DocumentDropboxDrawer
        open={drawerOpen}
        document={selectedDoc}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedDoc(null);
        }}
        onDownload={handleDownload}
        onDelete={handleDelete}
      />
    </div>
  );
};
