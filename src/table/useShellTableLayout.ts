/** Đo vùng còn lại trong app-shell để giữ footer phân trang nằm gọn trong khung nhìn. */
import { useEffect, useRef, useState, type RefObject } from "react";

interface ShellTableLayout {
  height: number;
  bodyHeight: number;
}

interface UseShellTableLayoutResult {
  wrapperRef: RefObject<HTMLDivElement>;
  layout: ShellTableLayout | undefined;
}

export const useShellTableLayout = (enabled: boolean): UseShellTableLayoutResult => {
  // Ref giữ DOM cần đo; geometry là state giao diện, không chứa dữ liệu API.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<ShellTableLayout>();

  // Đồng bộ ResizeObserver và viewport; cleanup hủy mọi observer/timer sau unmount.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const scroller = wrapper?.closest<HTMLElement>(".app-shell .ant-layout-content");
    if (!enabled || !wrapper || !scroller || wrapper.closest(".ant-modal, .ant-drawer")) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const measure = () => {
      const shellRect = scroller.getBoundingClientRect();
      const tableRect = wrapper.getBoundingClientRect();
      if (!shellRect.height || !tableRect.width) return;

      // Dùng vị trí trong trang, không dùng scrollTop hiện tại.
      const tableOffset = tableRect.top - shellRect.top + scroller.scrollTop;
      let bottomPadding = 0;
      for (let parent = wrapper.parentElement; parent && parent !== scroller; parent = parent.parentElement) {
        const parentStyle = getComputedStyle(parent);
        bottomPadding += (parseFloat(parentStyle.paddingBottom) || 0) + (parseFloat(parentStyle.borderBottomWidth) || 0);
      }
      const height = Math.max(240, Math.floor(shellRect.height - tableOffset - bottomPadding));
      const style = getComputedStyle(wrapper);
      const padding = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
      const headerHeight = wrapper.querySelector<HTMLElement>(".ant-table-header")?.getBoundingClientRect().height
        || (wrapper.querySelector<HTMLElement>(".ant-table-thead")?.getBoundingClientRect().height || 44) + 16;
      const pagination = wrapper.querySelector<HTMLElement>(".ant-pagination");
      const footerHeight = pagination ? (pagination.getBoundingClientRect().height || 32) + 12 : 0;
      // Chừa khoảng cách hàng và thanh cuộn ngang; footer luôn nằm ngoài thân bảng.
      const bodyHeight = Math.max(52, Math.floor(height - padding - headerHeight - footerHeight - 24));
      setLayout((previous) => previous?.height === height && previous.bodyHeight === bodyHeight
        ? previous : { height, bodyHeight });
    };
    const scheduleMeasure = () => {
      clearTimeout(timer);
      timer = setTimeout(measure, 120);
    };
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(scroller);
    observer.observe(wrapper);
    // Toolbar, bộ lọc, header nhiều hàng và pagination mobile có thể đổi chiều cao.
    const content = wrapper.closest<HTMLElement>(".app-content");
    if (content) observer.observe(content);
    let observedParts = new Set<HTMLElement>();
    const observeTableParts = () => {
      const nextParts = new Set(wrapper.querySelectorAll<HTMLElement>(".ant-table-header, .ant-table-thead, .ant-pagination"));
      const toolbar = wrapper.parentElement?.querySelector<HTMLElement>(".resource-list-toolbar");
      if (toolbar) nextParts.add(toolbar);
      for (const element of observedParts) if (!nextParts.has(element)) observer.unobserve(element);
      for (const element of nextParts) if (!observedParts.has(element)) observer.observe(element);
      observedParts = nextParts;
    };
    observeTableParts();
    // Ant Design dựng lại header/body khi chuyển sang scroll.y hoặc nhận trang dữ liệu mới.
    const mutations = new MutationObserver(() => {
      observeTableParts();
      scheduleMeasure();
    });
    mutations.observe(wrapper, { childList: true, subtree: true });
    measure();
    window.addEventListener("resize", scheduleMeasure);
    window.visualViewport?.addEventListener("resize", scheduleMeasure);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      clearTimeout(timer);
      window.removeEventListener("resize", scheduleMeasure);
      window.visualViewport?.removeEventListener("resize", scheduleMeasure);
    };
  }, [enabled]);

  return { wrapperRef, layout: enabled ? layout : undefined };
};
