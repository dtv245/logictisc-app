import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Avatar,
  Alert,
  Badge,
  Button,
  Card,
  Dropdown,
  Flex,
  Input,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import type { MenuProps } from "antd";
import {
  ArrowUpOutlined,
  BulbOutlined,
  CheckOutlined,
  ClearOutlined,
  CloseOutlined,
  DownOutlined,
  EditOutlined,
  EllipsisOutlined,
  EyeOutlined,
  FileTextOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  LoadingOutlined,
  LockOutlined,
  MinusCircleOutlined,
  ReloadOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  UserOutlined,
  VideoCameraOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useLocation, matchPath, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAiFeatures } from "@/hooks/ai/useAiFeatures";
import { useLoadAiGaps } from "@/hooks/ai/useLoadAiGaps";
import { getFieldMapping } from "@/api/ai/fieldKeyMapping";
import type { AiGap } from "@/api/ai/ai.types";
import { routes } from "@/constants/routes";
import { CORE_VERSIONED_WRITES_RUNTIME_VERIFIED } from "@/components/resources/resourceCapabilities";
import { useAiSettings } from "@/features/ai-dispatch/hooks/aiConfigStorage";
import type { AiProviderId } from "@/features/ai-dispatch/types/aiConfig.types";

const { Text, Paragraph } = Typography;

interface ChatMessage {
  id: string;
  sender: "user" | "ai" | "system";
  text: string;
  title?: string;
  timestamp: string;
  model?: string;
  provider?: string;
  thought?: string;
  contextTag?: string;
  bulletPoints?: string[];
  keyTakeaways?: string[];
  referenceResults?: Array<{
    icon: "file" | "video" | "alert";
    title: string;
    description?: string;
    gap?: AiGap;
  }>;
  gapActions?: Array<{
    gap: AiGap;
    label: string;
  }>;
}

interface ModelItem {
  providerId: AiProviderId;
  model: string;
  name: string;
  tag: string;
  sparkleColor: string;
}

const AVAILABLE_MODELS: ModelItem[] = [
  { providerId: "gemini", model: "gemini-2.0-flash", name: "Gemini 2.0 Flash", tag: "Fast", sparkleColor: "#4285f4" },
  { providerId: "gemini", model: "gemini-2.5-pro", name: "Gemini 2.5 Pro", tag: "Beta", sparkleColor: "#8ab4f8" },
  { providerId: "gemini", model: "gemini-1.5-pro", name: "Gemini 1.5 Pro", tag: "Reasoning", sparkleColor: "#1a73e8" },
  { providerId: "openai", model: "gpt-4o", name: "GPT-4o Omni", tag: "Multimodal", sparkleColor: "#10a37f" },
  { providerId: "openai", model: "gpt-4o-mini", name: "GPT-4o Mini", tag: "Light", sparkleColor: "#10a37f" },
  { providerId: "openai", model: "o1-mini", name: "o1-mini Reasoning", tag: "Deep", sparkleColor: "#059669" },
  { providerId: "claude", model: "claude-3-5-sonnet-latest", name: "Claude 3.5 Sonnet", tag: "Accurate", sparkleColor: "#d97706" },
  { providerId: "claude", model: "claude-3-5-haiku-latest", name: "Claude 3.5 Haiku", tag: "Speed", sparkleColor: "#f59e0b" },
  { providerId: "deepseek", model: "deepseek-chat", name: "DeepSeek V3", tag: "Smart", sparkleColor: "#0284c7" },
  { providerId: "deepseek", model: "deepseek-reasoner", name: "DeepSeek R1", tag: "Logic", sparkleColor: "#0369a1" },
  { providerId: "custom", model: "llama3.3:latest", name: "Llama 3.3 70B", tag: "Local", sparkleColor: "#6366f1" },
];

export function AiGapChatWidget() {
  // An toàn khi chạy trong unit test không có QueryClientProvider
  try {
    const client = useQueryClient();
    if (!client) return null;
  } catch {
    return null;
  }

  return <AiGapChatWidgetContent />;
}

function AiGapChatWidgetContent() {
  const { t } = useTranslation();
  const { enabled, isLoading: isFeatureLoading, isError: isFeatureError, data: featureData, refetch } = useAiFeatures();
  const { settings, updateSettings, activeProviderConfig } = useAiSettings();
  const location = useLocation();
  const navigate = useNavigate();

  // Nhận diện loadId từ URL hiện tại
  const match =
    matchPath({ path: "/loads/show/:id" }, location.pathname) ||
    matchPath({ path: "/loads/edit/:id" }, location.pathname) ||
    matchPath({ path: "/loads/:id" }, location.pathname);
  const loadId = match?.params?.id || "";

  // State giao diện
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<"chat" | "gaps">("chat");
  const [showThoughtMap, setShowThoughtMap] = useState<Record<string, boolean>>({});
  const [dismissingGapId, setDismissingGapId] = useState<string | null>(null);
  const [dismissReasonInput, setDismissReasonInput] = useState("");

  // State hội thoại
  const [inputPrompt, setInputPrompt] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [customContextPill, setCustomContextPill] = useState<string | null>(null);
  const selectedContextPill =
    customContextPill ??
    (loadId
      ? t("aiDispatch.loadContext", { id: loadId.slice(0, 8) })
      : t("aiDispatch.defaultContext"));

  const msgSeqRef = useRef(0);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Hook dữ liệu gaps cho chuyến hàng
  const {
    blockingGaps,
    warningGaps,
    isLoading: isGapsLoading,
    isRerunning,
    rerunAi,
    dismissGap,
    isDismissing,
  } = useLoadAiGaps({ loadId });

  // Khởi tạo tin nhắn chào mừng phong cách Canvas hiện đại
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    {
      id: "init-welcome",
      sender: "ai",
      title: t("aiDispatch.freeChatDemoTitle"),
      text: t("aiDispatch.freeChatDemoWelcome"),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      model: "DEMO",
      provider: "DEMO",
      contextTag: loadId ? t("aiDispatch.loadContext", { id: loadId.slice(0, 8) }) : "DEMO",
    },
  ]);

  // Cuộn xuống đáy mượt mà (an toàn trên cả trình duyệt và môi trường test JSDOM)
  const scrollToBottom = useCallback(() => {
    if (chatBodyRef.current) {
      if (typeof chatBodyRef.current.scrollTo === "function") {
        chatBodyRef.current.scrollTo({
          top: chatBodyRef.current.scrollHeight,
        });
      } else {
        chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, chatMessages, isThinking, viewMode, scrollToBottom]);

  // Lắng nghe sự kiện scroll để hiển thị nút cuộn xuống
  const handleScroll = () => {
    if (!chatBodyRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatBodyRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 120;
    setShowScrollBottom(isUp);
  };

  const isDevMode = import.meta.env.DEV;
  const [forceAiEnabled, setForceAiEnabled] = useState(() => {
    return (
      typeof window !== "undefined" &&
      window.localStorage?.getItem("logistics_force_ai_gap") === "true"
    );
  });
  const devForce =
    typeof window !== "undefined" &&
    window.localStorage?.getItem("logistics_force_ai_gap") === "true";
  const isEffectiveEnabled = enabled || forceAiEnabled || devForce;

  const handleEnableTestAi = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("logistics_force_ai_gap", "true");
    }
    setForceAiEnabled(true);
    void refetch();
  };

  const isTestEnv =
    (typeof process !== "undefined" && process.env?.NODE_ENV === "test") ||
    (typeof import.meta !== "undefined" && import.meta.env?.MODE === "test");

  // State hoạt ảnh trượt mượt mà
  const [isAnimatedIn, setIsAnimatedIn] = useState(false);

  const handleOpenChat = () => {
    setIsOpen(true);
  };

  const handleCloseChat = () => {
    if (isTestEnv) {
      setIsAnimatedIn(false);
      setIsOpen(false);
      return;
    }
    setIsAnimatedIn(false);
    setTimeout(() => {
      setIsOpen(false);
    }, 320);
  };

  const handleToggleChat = () => {
    if (isOpen) {
      handleCloseChat();
    } else {
      handleOpenChat();
    }
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsAnimatedIn(isOpen);
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  // Lắng nghe sự kiện click từ app-sider__logo
  useEffect(() => {
    const onToggle = () => handleToggleChat();
    const onOpen = () => handleOpenChat();
    const onClose = () => handleCloseChat();

    window.addEventListener("toggle-ai-gap-chat", onToggle);
    window.addEventListener("open-ai-gap-chat", onOpen);
    window.addEventListener("close-ai-gap-chat", onClose);

    return () => {
      window.removeEventListener("toggle-ai-gap-chat", onToggle);
      window.removeEventListener("open-ai-gap-chat", onOpen);
      window.removeEventListener("close-ai-gap-chat", onClose);
    };
  });

  // Xử lý chuyển trường form
  const handleNavigateToField = (gap: AiGap) => {
    const key = gap.fieldName || gap.fieldKey || "";
    const mapping = getFieldMapping(key);
    const targetFieldName = mapping ? mapping.formField : key;

    const targetElement =
      document.getElementById(targetFieldName) ||
      document.querySelector(`[name="${targetFieldName}"]`) ||
      (mapping?.sectionId ? document.getElementById(mapping.sectionId) : null);

    if (targetElement) {
      targetElement.scrollIntoView({ block: "center" });
      if ("focus" in targetElement && typeof (targetElement as HTMLElement).focus === "function") {
        (targetElement as HTMLElement).focus();
      }
      message.success(`Đã trỏ tới ô nhập: ${gap.fieldLabel || targetFieldName}`);
    } else {
      if (loadId) {
        if (!CORE_VERSIONED_WRITES_RUNTIME_VERIFIED) {
          message.info(t("aiDispatch.coreLoadEditorUnavailable"));
          return;
        }
        message.loading({
          content: `Đang chuyển sang trang chỉnh sửa để điền "${gap.fieldLabel || targetFieldName}"...`,
          key: "nav-edit",
          duration: 1.5,
        });
        navigate(`${routes.resources.loads.edit.replace(":id", encodeURIComponent(loadId))}?focusField=${encodeURIComponent(targetFieldName)}`);
      } else {
        message.info(`Vui lòng mở một chuyến hàng để điền thông tin.`);
      }
    }
  };

  // Xác nhận bỏ qua gap
  const handleConfirmDismiss = async (gapId: string) => {
    if (!dismissReasonInput.trim() || dismissReasonInput.trim().length < 3) {
      message.warning("Vui lòng nhập lý do bỏ qua ít nhất 3 ký tự");
      return;
    }

    try {
      await dismissGap({ gapId, reason: dismissReasonInput.trim() });
      setDismissingGapId(null);
      setDismissReasonInput("");
      message.success("Đã bỏ qua cảnh báo thành công");
    } catch {
      message.error("Không thể bỏ qua cảnh báo");
    }
  };

  // Tìm model hiện tại
  const currentModelItem =
    AVAILABLE_MODELS.find(
      (m) => m.providerId === settings.activeProvider && m.model === activeProviderConfig.model
    ) ||
    AVAILABLE_MODELS.find((m) => m.model === activeProviderConfig.model) ||
    AVAILABLE_MODELS[0];

  // Thay đổi Model AI
  const handleSelectModel = (item: ModelItem) => {
    updateSettings({
      ...settings,
      activeProvider: item.providerId,
      providers: {
        ...settings.providers,
        [item.providerId]: {
          ...settings.providers[item.providerId],
          model: item.model,
        },
      },
    });

    message.success(`Đã đổi mô hình sang: ${item.name}`);

    msgSeqRef.current += 1;
    setChatMessages((prev) => [
      ...prev,
      {
        id: `sys-model-${msgSeqRef.current}`,
        sender: "system",
        text: `Mô hình AI đã chuyển sang: ${item.name} (${item.providerId.toUpperCase()})`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        model: item.name,
      },
    ]);
  };

  // Menu chọn model
  const modelMenuItems: MenuProps["items"] = AVAILABLE_MODELS.map((item) => ({
    key: `${item.providerId}:${item.model}`,
    label: (
      <Flex justify="space-between" align="center" style={{ minWidth: 220, padding: "2px 0" }}>
        <Space size={8}>
          <span style={{ color: item.sparkleColor, fontSize: 13 }}>✦</span>
          <Text style={{ fontSize: 13, fontWeight: item.model === activeProviderConfig.model ? 600 : 400 }}>
            {item.name}
          </Text>
        </Space>
        <Space size={6}>
          <Tag style={{ fontSize: 10, margin: 0, padding: "0 4px", borderRadius: 4 }}>
            {item.tag}
          </Tag>
          {item.model === activeProviderConfig.model && (
            <CheckOutlined style={{ color: "#1677ff", fontSize: 12 }} />
          )}
        </Space>
      </Flex>
    ),
    onClick: () => handleSelectModel(item),
  }));

  // Menu thao tác tiêu đề New Chat
  const chatHeaderMenuItems: MenuProps["items"] = [
    {
      key: "new",
      icon: <EditOutlined />,
      label: t("aiDispatch.newChat"),
      onClick: () => {
        msgSeqRef.current += 1;
        setChatMessages([
          {
            id: `new-chat-${msgSeqRef.current}`,
            sender: "ai",
            title: t("aiDispatch.freeChatDemoTitle"),
            text: t("aiDispatch.freeChatDemoWelcome"),
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            model: "DEMO",
            provider: "DEMO",
          },
        ]);
        message.info("Đã tạo phiên trò chuyện AI mới");
      },
    },
    {
      key: "clear",
      icon: <ClearOutlined />,
      label: "Làm mới hội thoại",
      onClick: () => {
        msgSeqRef.current += 1;
        setChatMessages([
          {
            id: `init-reset-${msgSeqRef.current}`,
            sender: "ai",
            text: t("aiDispatch.freeChatDemoWelcome"),
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            model: "DEMO",
            provider: "DEMO",
          },
        ]);
        message.info("Đã làm mới hội thoại");
      },
    },
    {
      type: "divider",
    },
    {
      key: "rerun",
      icon: <ReloadOutlined />,
      label: "Quét lại toàn bộ dữ liệu GAP",
      onClick: () => void rerunAi(),
    },
  ];

  // Gửi tin nhắn
  const handleSendMessage = (customPrompt?: string) => {
    const promptToSend = (customPrompt ?? inputPrompt).trim();
    if (!promptToSend || isThinking) return;

    msgSeqRef.current += 1;
    const currentSeq = msgSeqRef.current;
    const currentTimestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMessage: ChatMessage = {
      id: `user-${currentSeq}`,
      sender: "user",
      text: promptToSend,
      timestamp: currentTimestamp,
      contextTag: selectedContextPill,
    };

    setChatMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) {
      setInputPrompt("");
    }

    const aiResponse: ChatMessage = {
      id: `ai-${currentSeq}`,
      sender: "ai",
      title: t("aiDispatch.freeChatDemoTitle"),
      text: t("aiDispatch.freeChatDemoResponse"),
      timestamp: currentTimestamp,
      model: "DEMO",
      provider: "DEMO",
    };

    if (isTestEnv) {
      setChatMessages((prev) => [...prev, aiResponse]);
      setIsThinking(false);
    } else {
      setIsThinking(true);
      setTimeout(() => {
        setChatMessages((prev) => [...prev, aiResponse]);
        setIsThinking(false);
      }, 400);
    }
  };

  const reasonText = isFeatureError
    ? "AI GAP (Không khả dụng): Lỗi kết nối backend hoặc chưa xác thực (401/Network)"
    : !featureData?.gapEnabled && !featureData?.enabled
    ? "AI GAP (Đang tắt): Cờ app.ai.gap-enabled đang là false trên backend"
    : isFeatureLoading
    ? "AI GAP: Đang kiểm tra cấu hình..."
    : "AI GAP: Tính năng chưa được kích hoạt";

  // NẾU TÍNH NĂNG AI TẮT VÀ CHƯA MỞ CHAT:
  if (!isEffectiveEnabled && !isOpen) {
    if (!isDevMode) {
      return null;
    }

    const disabledWidget = (
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
        data-testid="ai-gap-chat-container"
      >
        <Tooltip title={reasonText} placement="left">
          <Button
            shape="round"
            size="large"
            disabled
            icon={<RobotOutlined style={{ fontSize: 18, color: "#8c8c8c" }} />}
            data-testid="ai-gap-chat-button"
            data-disabled-reason={reasonText}
            onClick={() => void refetch()}
            style={{
              height: 44,
              padding: "0 16px",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 500,
              fontSize: 13,
              backgroundColor: "#f5f5f5",
              borderColor: "#d9d9d9",
              color: "#8c8c8c",
              cursor: "not-allowed",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            AI GAP (Tắt)
          </Button>
        </Tooltip>

        <Button
          size="small"
          type="dashed"
          onClick={handleEnableTestAi}
          style={{
            borderColor: "#94a3b8",
            color: "#475569",
            fontSize: 12,
            height: 28,
            borderRadius: 6,
          }}
        >
          Bật test AI
        </Button>
      </div>
    );

    return typeof document !== "undefined"
      ? createPortal(disabledWidget, document.body)
      : disabledWidget;
  }

  // KHI TÍNH NĂNG AI BẬT:
  const totalBlocking = blockingGaps.length;

  const widgetContent = (
    <>
      {/* 1. NÚT KÍCH HOẠT NỔI Ở GÓC DƯỚI PHẢI */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
        data-testid="ai-gap-chat-container"
      >
        <Tooltip title={isOpen ? "Thu nhỏ AI GAP" : "Mở khung trợ lý AI GAP"} placement="left">
          <Badge count={totalBlocking} overflowCount={99} offset={[-4, 4]}>
            <Button
              type="primary"
              shape="round"
              size="large"
              icon={<RobotOutlined style={{ fontSize: 20 }} />}
              onClick={handleToggleChat}
              data-testid="ai-gap-chat-button"
              style={{
                height: 48,
                padding: "0 20px",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 600,
                fontSize: 14,
                boxShadow: "0 8px 24px rgba(37, 99, 235, 0.35)",
                background:
                  totalBlocking > 0
                    ? "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)"
                    : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                border: "none",
              }}
            >
              AI GAP
            </Button>
          </Badge>
        </Tooltip>
      </div>

      {/* 2. CỬA SỔ CHAT PHONG CÁCH CANVAS HIỆN ĐẠI (CHUẨN THEO ẢNH MẪU) */}
      {isOpen && (
        <Card
          data-testid="ai-gap-chat-window"
          style={{
            position: "fixed",
            bottom: isFullscreen ? 16 : 24,
            right: isFullscreen ? 16 : 24,
            width: isFullscreen ? "calc(100vw - 32px)" : 680,
            maxWidth: "calc(100vw - 32px)",
            height: isFullscreen ? "calc(100vh - 32px)" : 760,
            maxHeight: "calc(100vh - 32px)",
            zIndex: 1001,
            display: "flex",
            flexDirection: "column",
            borderRadius: 28,
            boxShadow:
              "0 25px 70px -12px rgba(15, 23, 42, 0.28), 0 10px 30px -4px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.08)",
            overflow: "hidden",
            border: "1.5px solid #cbd5e1",
            backgroundColor: "#ffffff",
            opacity: isAnimatedIn ? 1 : 0,
            transform: isAnimatedIn
              ? (isFullscreen ? "none" : "translateY(0) scale(1)")
              : "translateY(36px) scale(0.95)",
            transformOrigin: "bottom right",
            transition:
              "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), width 0.25s ease, height 0.25s ease",
          }}
          styles={{
            body: {
              padding: 0,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
            },
          }}
        >
          {/* HEADER BAR */}
          <div
            style={{
              padding: "16px 20px 14px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1.5px solid #e2e8f0",
              backgroundColor: "#f8fafc",
            }}
          >
            {/* Tiêu đề & Menu phiên chat */}
            <Space align="center" size={10}>
              <Dropdown menu={{ items: chatHeaderMenuItems }} trigger={["click"]}>
                <Button
                  type="text"
                  style={{
                    padding: "0 6px",
                    height: 32,
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#111827",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>Trợ lý AI GAP</span>
                  <DownOutlined style={{ fontSize: 11, color: "#9ca3af" }} />
                </Button>
              </Dropdown>

              {/* Tag Private / Riêng tư */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: "#f3f4f6",
                  color: "#4b5563",
                  borderRadius: 9999,
                  padding: "3px 10px",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                <LockOutlined style={{ fontSize: 11, color: "#6b7280" }} />
                <span>{t("aiDispatch.privateContext")}</span>
              </div>


            </Space>

            {/* Các nút hành động bên phải */}
            <Space size={8} align="center">
              {/* Nút chuyển chế độ xem Gaps / Chat */}
              <Tooltip title={viewMode === "chat" ? t("aiDispatch.openGapChecklist") : t("aiDispatch.returnToChat")}>
                <Button
                  size="small"
                  shape="round"
                  onClick={() => setViewMode(viewMode === "chat" ? "gaps" : "chat")}
                  style={{
                    fontSize: 12,
                    color: viewMode === "gaps" ? "#2563eb" : "#4b5563",
                    borderColor: viewMode === "gaps" ? "#93c5fd" : "#e5e7eb",
                    backgroundColor: viewMode === "gaps" ? "#eff6ff" : "#fff",
                  }}
                >
                  <WarningOutlined style={{ color: totalBlocking > 0 ? "#ef4444" : undefined }} />
                  <span>{t("aiDispatch.gapChecklist")}</span>
                  {totalBlocking > 0 && (
                    <Badge count={totalBlocking} size="small" style={{ backgroundColor: "#ef4444" }} />
                  )}
                </Button>
              </Tooltip>

              <Tooltip title={t("aiDispatch.newChat")}>
                <Button
                  type="text"
                  shape="circle"
                  size="small"
                  icon={<EditOutlined style={{ fontSize: 15, color: "#4b5563" }} />}
                  onClick={() => {
                    msgSeqRef.current += 1;
                    setChatMessages([
                      {
                        id: `new-chat-${msgSeqRef.current}`,
                        sender: "ai",
                        title: t("aiDispatch.freeChatDemoTitle"),
                        text: t("aiDispatch.freeChatDemoWelcome"),
                        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        model: "DEMO",
                        provider: "DEMO",
                      },
                    ]);
                  }}
                />
              </Tooltip>

              <Tooltip title={isFullscreen ? "Thu nhỏ lại" : "Mở rộng toàn màn hình"}>
                <Button
                  type="text"
                  shape="circle"
                  size="small"
                  icon={
                    isFullscreen ? (
                      <FullscreenExitOutlined style={{ fontSize: 15, color: "#4b5563" }} />
                    ) : (
                      <FullscreenOutlined style={{ fontSize: 15, color: "#4b5563" }} />
                    )
                  }
                  onClick={() => setIsFullscreen(!isFullscreen)}
                />
              </Tooltip>

              <Dropdown menu={{ items: chatHeaderMenuItems }} trigger={["click"]}>
                <Button
                  type="text"
                  shape="circle"
                  size="small"
                  icon={<EllipsisOutlined style={{ fontSize: 16, color: "#6b7280" }} />}
                />
              </Dropdown>

              {/* Nút Đóng */}
              <Button
                type="text"
                shape="circle"
                size="small"
                icon={<CloseOutlined style={{ fontSize: 13, color: "#6b7280" }} />}
                onClick={handleCloseChat}
                data-testid="ai-gap-chat-close-button"
                style={{
                  backgroundColor: "#f3f4f6",
                  width: 28,
                  height: 28,
                }}
              />
            </Space>
          </div>

          {/* BANNER KHI TÍNH NĂNG AI ĐANG TẮT */}
          {!isEffectiveEnabled && (
            <div
              style={{
                padding: "8px 20px",
                backgroundColor: "#fffbe6",
                borderBottom: "1px solid #ffe58f",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <Space size={8}>
                <WarningOutlined style={{ color: "#d48806", fontSize: 14 }} />
                <span style={{ fontSize: 12, color: "#873800" }}>{reasonText}</span>
              </Space>
              <Button
                size="small"
                type="primary"
                onClick={handleEnableTestAi}
                style={{ fontSize: 12, height: 26 }}
              >
                Bật test AI
              </Button>
            </div>
          )}

          {/* VÙNG NỘI DUNG CHÍNH (CANVAS THREAD) */}
          <div
            ref={chatBodyRef}
            onScroll={handleScroll}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 24,
              backgroundColor: "#ffffff",
              position: "relative",
            }}
          >
            {/* CHẾ ĐỘ 1: XEM KHUNG CHAT AI AGENT */}
            {viewMode === "chat" && (
              <>
                <Alert
                  type="info"
                  showIcon
                  message={t("aiDispatch.freeChatDemoNotice")}
                />
                {chatMessages.map((msg) => {
                  if (msg.sender === "system") {
                    return (
                      <Flex justify="center" key={msg.id} style={{ margin: "2px 0" }}>
                        <Tag
                          style={{
                            fontSize: 11,
                            borderRadius: 16,
                            padding: "3px 10px",
                            backgroundColor: "#f9fafb",
                            borderColor: "#e5e7eb",
                            color: "#6b7280",
                          }}
                        >
                          {msg.text}
                        </Tag>
                      </Flex>
                    );
                  }

                  const isUser = msg.sender === "user";

                  if (isUser) {
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 6,
                        }}
                      >
                        {/* Tag tím Onboarding / Ngữ cảnh */}
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            backgroundColor: "#f5f3ff",
                            color: "#7c3aed",
                            borderRadius: 8,
                            padding: "2px 8px",
                            fontSize: 11,
                            fontWeight: 500,
                          }}
                        >
                          <span>≡</span>
                          <span>{msg.contextTag || selectedContextPill}</span>
                        </div>

                        {/* Bubble người dùng */}
                        <Flex align="center" gap={10}>
                          <div
                            style={{
                              backgroundColor: "#f3f4f6",
                              color: "#111827",
                              padding: "10px 18px",
                              borderRadius: 20,
                              fontSize: 14,
                              fontWeight: 400,
                              maxWidth: 520,
                              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                            }}
                          >
                            {msg.text}
                          </div>
                          <Avatar
                            size={32}
                            icon={<UserOutlined />}
                            style={{ backgroundColor: "#2563eb", flexShrink: 0 }}
                          />
                        </Flex>
                      </div>
                    );
                  }

                  // PHẢN HỒI CỦA AI (Canvas Minimalist Layout)
                  const isThoughtExpanded = showThoughtMap[msg.id] ?? false;

                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        paddingRight: 16,
                      }}
                    >
                      {/* Thought / Suy luận Accordion */}
                      {msg.thought && (
                        <div>
                          <Button
                            type="text"
                            size="small"
                            onClick={() =>
                              setShowThoughtMap((prev) => ({
                                ...prev,
                                [msg.id]: !isThoughtExpanded,
                              }))
                            }
                            style={{
                              padding: 0,
                              height: 24,
                              color: "#6b7280",
                              fontSize: 12,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <BulbOutlined style={{ fontSize: 13, color: "#9ca3af" }} />
                            <span>Suy luận (Thought)</span>
                            <span style={{ fontSize: 10, color: "#9ca3af" }}>
                              {isThoughtExpanded ? "▾" : "›"}
                            </span>
                          </Button>

                          {isThoughtExpanded && (
                            <div
                              style={{
                                marginTop: 6,
                                padding: "8px 14px",
                                backgroundColor: "#f9fafb",
                                borderLeft: "2px solid #d1d5db",
                                borderRadius: "0 8px 8px 0",
                                fontSize: 12,
                                color: "#4b5563",
                                lineHeight: 1.5,
                              }}
                            >
                              {msg.thought}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Chip Viewed / Đã phân tích */}
                      <Flex align="center" gap={8} wrap>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            color: "#6b7280",
                            fontSize: 12,
                          }}
                        >
                          <EyeOutlined style={{ color: "#9ca3af" }} />
                          <span>Đã phân tích</span>
                        </div>

                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            backgroundColor: "#f3f4f6",
                            padding: "2px 10px",
                            borderRadius: 14,
                            fontSize: 12,
                            color: "#374151",
                            fontWeight: 500,
                          }}
                        >
                          <VideoCameraOutlined style={{ color: "#2563eb", fontSize: 12 }} />
                          <span>{msg.contextTag || selectedContextPill}</span>
                        </div>
                      </Flex>

                      {/* Tiêu đề phần phản hồi */}
                      {msg.title && (
                        <Text
                          style={{
                            fontSize: 17,
                            fontWeight: 600,
                            color: "#111827",
                            letterSpacing: "-0.01em",
                            marginTop: 2,
                          }}
                        >
                          {msg.title}
                        </Text>
                      )}

                      {/* Đoạn mô tả chính */}
                      <Paragraph
                        style={{
                          fontSize: 13.5,
                          color: "#374151",
                          lineHeight: 1.6,
                          marginBottom: 4,
                        }}
                      >
                        {msg.text}
                      </Paragraph>

                      {/* Danh sách Bullet Points */}
                      {msg.bulletPoints && msg.bulletPoints.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {msg.bulletPoints.map((bp, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 10,
                                fontSize: 13.5,
                                color: "#374151",
                                lineHeight: 1.55,
                              }}
                            >
                              <span style={{ color: "#9ca3af", lineHeight: "20px" }}>•</span>
                              <div style={{ flex: 1 }}>
                                <span>{bp}</span>
                                <Space size={4} style={{ marginLeft: 6 }}>
                                  <Tag
                                    style={{
                                      fontSize: 10,
                                      margin: 0,
                                      padding: "0 4px",
                                      backgroundColor: "#f3f4f6",
                                      borderColor: "#e5e7eb",
                                      color: "#6b7280",
                                    }}
                                  >
                                    N
                                  </Tag>
                                  <Tag
                                    style={{
                                      fontSize: 10,
                                      margin: 0,
                                      padding: "0 4px",
                                      backgroundColor: "#f3f4f6",
                                      borderColor: "#e5e7eb",
                                      color: "#6b7280",
                                    }}
                                  >
                                    🔗
                                  </Tag>
                                </Space>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Key Takeaways */}
                      {msg.keyTakeaways && msg.keyTakeaways.length > 0 && (
                        <div style={{ marginTop: 6 }}>
                          <Text
                            style={{
                              fontSize: 14.5,
                              fontWeight: 600,
                              color: "#111827",
                              display: "block",
                              marginBottom: 8,
                            }}
                          >
                            Điểm then chốt (Key Takeaways)
                          </Text>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {msg.keyTakeaways.map((kt, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: 8,
                                  fontSize: 13.5,
                                  color: "#374151",
                                  lineHeight: 1.5,
                                }}
                              >
                                <span style={{ color: "#6b7280", fontWeight: 500 }}>{idx + 1}.</span>
                                <span>{kt}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Kết quả tham chiếu / Thẻ điểm nghẽn (12 results style) */}
                      {msg.referenceResults && msg.referenceResults.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <Text
                            type="secondary"
                            style={{ fontSize: 12, fontWeight: 500, display: "block", marginBottom: 8 }}
                          >
                            {msg.referenceResults.length} kết quả phân tích & quy tắc
                          </Text>

                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {msg.referenceResults.map((item, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "8px 12px",
                                  backgroundColor: "#f9fafb",
                                  borderRadius: 10,
                                  border: "1px solid #f3f4f6",
                                }}
                              >
                                <Space size={10}>
                                  {item.icon === "video" ? (
                                    <VideoCameraOutlined style={{ color: "#2563eb", fontSize: 14 }} />
                                  ) : item.icon === "alert" ? (
                                    <WarningOutlined style={{ color: "#ef4444", fontSize: 14 }} />
                                  ) : (
                                    <FileTextOutlined style={{ color: "#6b7280", fontSize: 14 }} />
                                  )}
                                  <Text style={{ fontSize: 13, color: "#1f2937", fontWeight: 500 }}>
                                    {item.title}
                                  </Text>
                                </Space>

                                {item.gap && (
                                  <Button
                                    size="small"
                                    type="link"
                                    icon={<EditOutlined />}
                                    onClick={() => handleNavigateToField(item.gap!)}
                                    style={{ fontSize: 12, padding: "0 4px" }}
                                  >
                                    Điền ngay
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Các nút hành động GAP */}
                      {msg.gapActions && msg.gapActions.length > 0 && (
                        <Space size="small" wrap style={{ marginTop: 6 }}>
                          {msg.gapActions.map((action, idx) => (
                            <Button
                              key={idx}
                              size="small"
                              shape="round"
                              type="primary"
                              icon={<EditOutlined />}
                              onClick={() => handleNavigateToField(action.gap)}
                              style={{
                                fontSize: 12,
                                height: 28,
                                backgroundColor: "#2563eb",
                              }}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </Space>
                      )}
                    </div>
                  );
                })}

                {/* Trạng thái đang suy nghĩ & sinh nội dung (Generating...) */}
                {isThinking && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <Flex align="center" gap={8} style={{ color: "#6b7280", fontSize: 12 }}>
                      <LoadingOutlined spin style={{ color: "#2563eb" }} />
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        Đang tạo kế hoạch điều phối với {currentModelItem.name}...
                      </Text>
                    </Flex>
                  </div>
                )}
              </>
            )}

            {/* CHẾ ĐỘ 2: XEM DANH SÁCH THẺ GAP (CHECKLIST CHI TIẾT) */}
            {viewMode === "gaps" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Flex justify="space-between" align="center">
                  <Text strong style={{ fontSize: 15, color: "#111827" }}>
                    Danh sách Điểm nghẽn Dữ liệu (GAP Checklist)
                  </Text>
                  <Button
                    size="small"
                    icon={<ReloadOutlined spin={isRerunning} />}
                    onClick={() => void rerunAi()}
                  >
                    Quét lại
                  </Button>
                </Flex>

                {!CORE_VERSIONED_WRITES_RUNTIME_VERIFIED && loadId && (
                  <Alert
                    type="info"
                    showIcon
                    message={t("aiDispatch.coreLoadEditorUnavailable")}
                  />
                )}

                {!loadId && (
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      backgroundColor: "#f9fafb",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <Text style={{ fontSize: 13, display: "block", marginBottom: 8 }}>
                      Hiện bạn chưa mở chi tiết một chuyến hàng nào. Vui lòng mở danh sách chuyến hàng để bắt đầu kiểm tra thông tin thiếu.
                    </Text>
                    <Button type="primary" size="small" onClick={() => navigate("/loads")}>
                      Xem danh sách Chuyến hàng
                    </Button>
                  </div>
                )}

                {loadId && isGapsLoading && (
                  <Flex justify="center" align="center" style={{ padding: "32px 0" }}>
                    <LoadingOutlined spin style={{ fontSize: 24, color: "#2563eb" }} />
                  </Flex>
                )}

                {loadId && !isGapsLoading && (
                  <>
                    {[...blockingGaps, ...warningGaps].map((gap) => {
                      const isBlocking = String(gap.severity).toUpperCase() === "BLOCKING";
                      const questionText =
                        gap.questionNatural || gap.questionTemplate || gap.question || "Thiếu thông tin";
                      const fieldTitle = gap.fieldLabel || gap.fieldName || gap.fieldKey || "Trường dữ liệu";

                      return (
                        <div
                          key={gap.id}
                          style={{
                            backgroundColor: "#fff",
                            borderRadius: 14,
                            padding: "14px 16px",
                            border: "1px solid #e5e7eb",
                            borderLeft: isBlocking ? "4px solid #ef4444" : "4px solid #f59e0b",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                          }}
                        >
                          <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
                            <Tag
                              color={isBlocking ? "error" : "warning"}
                              style={{ margin: 0, fontWeight: 500, borderRadius: 4 }}
                            >
                              {isBlocking ? "Chặn điều phối" : "Cảnh báo"}
                            </Tag>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              Hỏi {gap.askCount}/{gap.maxAsks} lần
                            </Text>
                          </Flex>

                          <Text strong style={{ fontSize: 14, display: "block", marginBottom: 4 }}>
                            {fieldTitle}
                          </Text>

                          <Paragraph
                            style={{
                              fontSize: 12.5,
                              color: "#4b5563",
                              marginBottom: 8,
                              lineHeight: 1.45,
                            }}
                          >
                            {questionText}
                          </Paragraph>

                          {gap.proposedValue && (
                            <div
                              style={{
                                background: "#f0fdf4",
                                border: "1px dashed #86efac",
                                borderRadius: 6,
                                padding: "4px 10px",
                                fontSize: 11.5,
                                marginBottom: 10,
                                color: "#166534",
                              }}
                            >
                              Gợi ý từ AI: <strong>{gap.proposedValue}</strong>
                            </div>
                          )}

                          <Space size="small">
                            <Button
                              type="primary"
                              size="small"
                              shape="round"
                              icon={<EditOutlined />}
                              onClick={() => handleNavigateToField(gap)}
                              disabled={!CORE_VERSIONED_WRITES_RUNTIME_VERIFIED}
                              title={!CORE_VERSIONED_WRITES_RUNTIME_VERIFIED ? t("aiDispatch.coreLoadEditorUnavailable") : undefined}
                              style={{ fontSize: 12, backgroundColor: "#2563eb" }}
                            >
                              Điền trên form
                            </Button>

                            {!isBlocking && (
                              <Button
                                size="small"
                                shape="round"
                                danger
                                icon={<MinusCircleOutlined />}
                                onClick={() => setDismissingGapId(gap.id)}
                                style={{ fontSize: 12 }}
                              >
                                Bỏ qua
                              </Button>
                            )}
                          </Space>

                          {dismissingGapId === gap.id && (
                            <div
                              style={{
                                marginTop: 10,
                                padding: 10,
                                background: "#fffbeb",
                                borderRadius: 8,
                              }}
                            >
                              <Text style={{ fontSize: 11, display: "block", marginBottom: 4 }}>
                                Nhập lý do bỏ qua (tối thiểu 3 ký tự):
                              </Text>
                              <Input.TextArea
                                size="small"
                                rows={2}
                                value={dismissReasonInput}
                                onChange={(e) => setDismissReasonInput(e.target.value)}
                                placeholder="Ví dụ: Đã có thỏa thuận bốc hàng riêng..."
                                style={{ marginBottom: 6, fontSize: 12 }}
                              />
                              <Space size="small">
                                <Button
                                  type="primary"
                                  size="small"
                                  loading={isDismissing}
                                  onClick={() => void handleConfirmDismiss(gap.id)}
                                >
                                  Xác nhận bỏ qua
                                </Button>
                                <Button size="small" onClick={() => setDismissingGapId(null)}>
                                  Hủy
                                </Button>
                              </Space>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            {/* Nút cuộn xuống đáy nổi */}
            {showScrollBottom && (
              <Button
                type="default"
                shape="circle"
                size="middle"
                icon={<DownOutlined style={{ fontSize: 12, color: "#4b5563" }} />}
                onClick={scrollToBottom}
                style={{
                  position: "sticky",
                  bottom: 12,
                  alignSelf: "center",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                  zIndex: 10,
                  backgroundColor: "#ffffff",
                }}
              />
            )}
          </div>

          {/* 3. CAPSULE INPUT BOX (CHÍNH XÁC THEO ẢNH MẪU CỦA NGƯỜI DÙNG) */}
          <div
            style={{
              padding: "12px 20px 10px 20px",
              backgroundColor: "#f8fafc",
              borderTop: "1.5px solid #e2e8f0",
            }}
          >
            <div
              style={{
                border: "1.5px solid #cbd5e1",
                borderRadius: 24,
                backgroundColor: "#ffffff",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)",
                padding: "10px 14px 10px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {/* Pill Context ở trên cùng của input box (kevin x louise style) */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "3px 10px 3px 6px",
                    borderRadius: 9999,
                    backgroundColor: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    fontSize: 12,
                    color: "#374151",
                    fontWeight: 500,
                  }}
                >
                  <Avatar size={18} icon={<RobotOutlined />} style={{ backgroundColor: "#2563eb" }} />
                  <span>{selectedContextPill}</span>
                  <Button
                    type="text"
                    size="small"
                    aria-label={t("aiDispatch.clearChatContext", { defaultValue: "Clear chat context" })}
                    icon={<CloseOutlined style={{ fontSize: 10, color: "#9ca3af" }} />}
                    onClick={() => setCustomContextPill(t("aiDispatch.allDataContext", { defaultValue: "All data" }))}
                    style={{ width: 20, height: 20, minWidth: 20, padding: 0, marginLeft: 2 }}
                  />
                </div>
              </div>

              {/* Ô nhập Ask AI anything */}
              <Input.TextArea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={t("aiDispatch.chatPlaceholder")}
                autoSize={{ minRows: 1, maxRows: 4 }}
                disabled={isThinking}
                bordered={false}
                style={{
                  padding: "4px 0",
                  fontSize: 14,
                  color: "#111827",
                  resize: "none",
                }}
              />

              {/* Toolbar đáy của Capsule Input */}
              <Flex justify="space-between" align="center" style={{ paddingTop: 2 }}>
                {/* Nhóm bên trái: Plus, Model Pill, Search, Magic */}
                <Space size={8} align="center">
                  {/* Model Selector Pill (✦ Gemini 3 Pro Beta style) */}
                  <Dropdown menu={{ items: modelMenuItems }} trigger={["click"]}>
                    <Button
                      type="text"
                      shape="round"
                      size="small"
                      style={{
                        height: 28,
                        padding: "0 10px",
                        backgroundColor: "#f3f4f6",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#111827",
                        border: "none",
                      }}
                    >
                      <span style={{ color: currentModelItem.sparkleColor, fontSize: 13 }}>✦</span>
                      <span>{currentModelItem.name}</span>
                      <Tag
                        style={{
                          margin: 0,
                          fontSize: 10,
                          padding: "0 4px",
                          borderRadius: 4,
                          border: "none",
                          backgroundColor: "#e5e7eb",
                          color: "#4b5563",
                        }}
                      >
                        {currentModelItem.tag}
                      </Tag>
                    </Button>
                  </Dropdown>

                  {/* Nút Magic Wand Prompt */}
                  <Tooltip title="Gợi ý câu hỏi tự động">
                    <Button
                      type="text"
                      shape="circle"
                      size="small"
                      icon={<ThunderboltOutlined style={{ fontSize: 14, color: "#6b7280" }} />}
                      onClick={() =>
                        handleSendMessage("Kiểm tra chi tiết các thông tin còn thiếu trên chuyến hàng")
                      }
                    />
                  </Tooltip>

                </Space>

                {/* Nhóm bên phải: gửi nội dung demo */}
                <Space size={10} align="center">
                  {/* Nút Gửi tròn xanh mũi tên lên ↑ */}
                  <Button
                    type="primary"
                    shape="circle"
                    data-testid="ai-gap-chat-send-button"
                    icon={<ArrowUpOutlined style={{ fontSize: 14, fontWeight: 700 }} />}
                    onClick={() => handleSendMessage()}
                    loading={isThinking}
                    disabled={isThinking}
                    style={{
                      width: 32,
                      height: 32,
                      backgroundColor: inputPrompt.trim() ? "#2563eb" : "#e5e7eb",
                      borderColor: "transparent",
                      color: inputPrompt.trim() ? "#ffffff" : "#9ca3af",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: inputPrompt.trim() ? "0 2px 6px rgba(37, 99, 235, 0.3)" : "none",
                    }}
                  />
                </Space>
              </Flex>
            </div>

            {/* Dòng Disclaimer dưới cùng (giống hệt ảnh mẫu) */}
            <div style={{ textAlign: "center", paddingTop: 6, paddingBottom: 2 }}>
              <Text style={{ fontSize: 11, color: "#9ca3af" }}>
                LogisticsX AI có thể mắc lỗi. Dữ liệu được rà soát tự động theo bộ quy tắc vận tải LogisticsX. Vui lòng kiểm tra lại.
              </Text>
            </div>
          </div>
        </Card>
      )}
    </>
  );

  return typeof document !== "undefined"
    ? createPortal(widgetContent, document.body)
    : widgetContent;
}
