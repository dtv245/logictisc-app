import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { expectNoRawTranslationKeys } from "./fixtures/assertNoRawTranslationKeys";

type ContrastEntry = {
  screen: string;
  selector: string;
  kind: "text" | "control-boundary" | "focus-indicator";
  text?: string;
  foreground?: string;
  background?: string;
  ratio?: number;
  threshold?: number;
  pass?: boolean;
  reason?: string;
  backgroundStops?: string[];
  backgroundStopRatios?: number[];
};

const screens = [
  ["Operations", "/operations"],
  ["Loads list", "/loads"],
  ["Load show", "/loads/show/contrast-load-1"],
  ["AI Dispatch", "/ai-dispatch"],
  ["Optimization", "/optimization"],
  ["Documents", "/documents"],
  ["Fleet", "/reports/fleet"],
] as const;

test("measures runtime WCAG contrast across priority screens and sidebar", async ({ page }) => {
  const entries: ContrastEntry[] = [];

  for (const [screen, route] of screens) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/e2e/fixtures/contrast-runtime.html?route=${encodeURIComponent(route)}`);
    await expect(page.locator(".app-sider")).toBeVisible({ timeout: 15000 });
    await expectNoRawTranslationKeys(page);
    await page.waitForTimeout(350);

    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    });
    await page.keyboard.press("Tab");
    await expect.poll(() => page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.matches(":focus-visible"))).toBe(true);

    const measurements = await page.evaluate((screenName): ContrastEntry[] => {
      type Color = { r: number; g: number; b: number; a: number };
      const parseColor = (value: string): Color | null => {
        const values = value.match(/[\d.]+/g)?.map(Number);
        if (!values || values.length < 3) return null;
        return { r: values[0], g: values[1], b: values[2], a: values.length > 3 ? values[3] : 1 };
      };
      const composite = (top: Color, bottom: Color): Color => {
        const alpha = top.a + bottom.a * (1 - top.a);
        if (alpha === 0) return { r: 255, g: 255, b: 255, a: 0 };
        return {
          r: (top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / alpha,
          g: (top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / alpha,
          b: (top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / alpha,
          a: alpha,
        };
      };
      const luminance = (color: Color) => {
        const channels = [color.r, color.g, color.b].map((channel) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
      };
      const ratio = (first: Color, second: Color) => {
        const a = luminance(first);
        const b = luminance(second);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      };
      const isVisible = (element: Element) => {
        const style = getComputedStyle(element);
        const visuallyHidden = element.matches(".sr-only, .visually-hidden, .ops-mini-map-sr-only, [aria-hidden='true']")
          || Boolean(element.closest("[aria-hidden='true']"))
          || (style.position === "absolute" && style.clip !== "auto" && element.getClientRects().length <= 1);
        const rect = element.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return false;
        for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
          const parentStyle = getComputedStyle(parent);
          const parentRect = parent.getBoundingClientRect();
          if (/(hidden|clip|scroll|auto)/.test(`${parentStyle.overflow} ${parentStyle.overflowX} ${parentStyle.overflowY}`)
            && (rect.right <= parentRect.left || rect.left >= parentRect.right || rect.bottom <= parentRect.top || rect.top >= parentRect.bottom)) return false;
        }
        return !visuallyHidden && style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0 && element.getClientRects().length > 0;
      };
      const selectorForElement = (element: Element) => {
        const testId = element.getAttribute("data-testid");
        if (testId) return `[data-testid="${testId}"]`;
        const ariaLabel = element.getAttribute("aria-label");
        if (ariaLabel) return `${element.tagName.toLowerCase()}[aria-label="${ariaLabel}"]`;
        const parts: string[] = [];
        let current: Element | null = element;
        while (current && current !== document.body && parts.length < 5) {
          let part = current.tagName.toLowerCase();
          const stableClass = [...current.classList].find((name) => !/^(css-|ant-.*-[a-z0-9]{5,})/.test(name));
          if (stableClass) part += `.${stableClass}`;
          const parent: Element | null = current.parentElement;
          if (parent) {
            const siblings = [...parent.children].filter((child) => child.tagName === current?.tagName);
            if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
          }
          parts.unshift(part);
          current = current.parentElement;
        }
        return parts.join(" > ");
      };
      const backgroundFor = (element: Element) => {
        const chain: Element[] = [];
        for (let current: Element | null = element; current; current = current.parentElement) chain.unshift(current);
        let background: Color = { r: 255, g: 255, b: 255, a: 1 };
        const reasons: string[] = [];
        const imageColors: Color[] = [];
        let opacity = 1;
        for (const node of chain) {
          const style = getComputedStyle(node);
          if (style.backgroundImage !== "none") {
            reasons.push(`background-image=${style.backgroundImage}`);
            for (const match of style.backgroundImage.matchAll(/rgba?\([^)]*\)/g)) {
              const imageColor = parseColor(match[0]);
              if (imageColor) imageColors.push(imageColor);
            }
          }
          const color = parseColor(style.backgroundColor);
          if (color && color.a > 0) background = composite(color, background);
          const nodeOpacity = Number(style.opacity);
          if (Number.isFinite(nodeOpacity) && nodeOpacity < 1) {
            opacity *= nodeOpacity;
            reasons.push(`ancestor opacity=${nodeOpacity}; layered compositing cannot be reduced to one solid background`);
          }
        }
        return { background, opacity, imageColors, reason: reasons.length ? reasons.join("; ") : undefined };
      };
      const result: ContrastEntry[] = [];
      const directText = [...document.querySelectorAll("body *")].filter((element) =>
        isVisible(element) && [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim())),
      );

      for (const element of directText) {
        const style = getComputedStyle(element);
        const text = [...element.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent?.trim()).filter(Boolean).join(" ");
        if (!text) continue;
        const selector = selectorForElement(element);
        const layer = backgroundFor(element);
        const foreground = parseColor(style.color);
        const fontSize = Number.parseFloat(style.fontSize);
        const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
        const large = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
        const threshold = large ? 3 : 4.5;
        const disabled = Boolean(element.closest(":disabled, [aria-disabled='true']"));
        if (disabled) {
          result.push({ screen: screenName, selector, kind: "text", text, foreground: style.color, background: `rgb(${Math.round(layer.background.r)}, ${Math.round(layer.background.g)}, ${Math.round(layer.background.b)})`, threshold, reason: "disabled control text is exempt from WCAG text contrast; the disabled state is also conveyed by control semantics" });
          continue;
        }
        if (layer.reason || !foreground) {
          const gradientStopRatios = foreground && layer.imageColors.length > 0
            ? layer.imageColors.map((stop) => Number(ratio(composite({ ...foreground, a: foreground.a * layer.opacity }, stop), stop).toFixed(3)))
            : undefined;
          result.push({
            screen: screenName,
            selector,
            kind: "text",
            text,
            foreground: style.color,
            background: `rgb(${layer.background.r}, ${layer.background.g}, ${layer.background.b})`,
            threshold,
            reason: layer.reason ?? "foreground color could not be parsed",
            ...(gradientStopRatios ? {
              backgroundStops: layer.imageColors.map((stop) => `rgb(${Math.round(stop.r)}, ${Math.round(stop.g)}, ${Math.round(stop.b)})`),
              backgroundStopRatios: gradientStopRatios,
            } : {}),
          });
          continue;
        }
        const effectiveForeground = composite({ ...foreground, a: foreground.a * layer.opacity }, layer.background);
        const value = ratio(effectiveForeground, layer.background);
        const primaryBlueForeground = foreground.r === 22 && foreground.g === 119 && foreground.b === 255;
        const primaryBlueBackground = layer.background.r === 22 && layer.background.g === 119 && layer.background.b === 255;
        const primaryPair = primaryBlueForeground || primaryBlueBackground;
        result.push({ screen: screenName, selector, kind: "text", text, foreground: style.color, background: `rgb(${Math.round(layer.background.r)}, ${Math.round(layer.background.g)}, ${Math.round(layer.background.b)})`, ratio: Number(value.toFixed(3)), threshold, pass: value >= threshold, ...(value < threshold && primaryPair ? { reason: "current primary-blue pair fails; color was not changed under the primary-color constraint" } : {}) });
      }

      const interactive = [...document.querySelectorAll("button, a[href], input, select, textarea, [role=button], [role=menuitem], [role=combobox], .ant-select-selector, .ant-picker")].filter((element) =>
        isVisible(element)
        && !(element.matches("a[href]") && element.querySelector("button"))
        && !(element.matches("input") && element.closest(".ant-input-affix-wrapper, .ant-select, .ant-picker")),
      );
      for (const element of interactive) {
        const style = getComputedStyle(element);
        const selector = selectorForElement(element);
        const ownBackground = backgroundFor(element);
        const parentBackground = element.parentElement ? backgroundFor(element.parentElement) : { background: { r: 255, g: 255, b: 255, a: 1 }, opacity: 1, reason: undefined };
        const borderWidth = Math.max(...["top", "right", "bottom", "left"].map((side) => Number.parseFloat(style.getPropertyValue(`border-${side}-width`)) || 0));
        const borderColor = parseColor(style.borderTopColor);
        const icon = element.querySelector("svg");
        const iconStyle = icon ? getComputedStyle(icon) : undefined;
        const iconColor = iconStyle ? parseColor(iconStyle.color) : null;
        const noVisibleText = !element.textContent?.trim();
        const disabled = Boolean(element.closest(":disabled, [aria-disabled='true'], .ant-select-disabled, .ant-picker-disabled, .ant-input-affix-wrapper-disabled"));
        if (disabled) {
          result.push({ screen: screenName, selector, kind: "control-boundary", reason: "disabled control boundary is exempt from WCAG non-text contrast; disabled semantics are exposed" });
        } else if (borderWidth > 0 && borderColor && borderColor.a > 0 && parentBackground.reason) {
          result.push({ screen: screenName, selector, kind: "control-boundary", foreground: style.borderTopColor, reason: `adjacent background is indeterminate: ${parentBackground.reason}` });
        } else if (borderWidth > 0 && borderColor && borderColor.a > 0) {
          const value = ratio(composite(borderColor, parentBackground.background), parentBackground.background);
          result.push({ screen: screenName, selector, kind: "control-boundary", foreground: style.borderTopColor, background: `rgb(${Math.round(parentBackground.background.r)}, ${Math.round(parentBackground.background.g)}, ${Math.round(parentBackground.background.b)})`, ratio: Number(value.toFixed(3)), threshold: 3, pass: value >= 3, reason: ownBackground.reason ?? parentBackground.reason });
        }
        if (!disabled && icon && iconColor && ownBackground.reason) {
          result.push({ screen: screenName, selector, kind: "control-boundary", foreground: iconStyle?.color, reason: `icon background is indeterminate: ${ownBackground.reason}` });
        } else if (!disabled && icon && iconColor) {
          const value = ratio(composite(iconColor, ownBackground.background), ownBackground.background);
          result.push({ screen: screenName, selector, kind: "control-boundary", foreground: iconStyle?.color, background: `rgb(${Math.round(ownBackground.background.r)}, ${Math.round(ownBackground.background.g)}, ${Math.round(ownBackground.background.b)})`, ratio: Number(value.toFixed(3)), threshold: 3, pass: value >= 3, reason: ownBackground.reason });
        } else if (!disabled && noVisibleText && borderWidth === 0) {
          result.push({ screen: screenName, selector, kind: "control-boundary", reason: ownBackground.reason ?? "icon-only control has no measurable SVG or border; custom icon requires visual review" });
        }
      }

      const focusables = [...document.querySelectorAll<HTMLElement>("a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])")]
        .filter((element) => isVisible(element) && element.tabIndex >= 0 && !element.matches(":disabled, [aria-disabled='true']"));
      for (const focusable of focusables) {
        focusable.focus();
        const style = getComputedStyle(focusable);
        const layer = focusable.parentElement ? backgroundFor(focusable.parentElement) : backgroundFor(focusable);
        const outlineWidth = Number.parseFloat(style.outlineWidth) || 0;
        const outline = parseColor(style.outlineColor);
        const selector = selectorForElement(focusable);
        if (!focusable.matches(":focus-visible")) {
          result.push({ screen: screenName, selector, kind: "focus-indicator", reason: "keyboard-modality focus did not match :focus-visible after browser keyboard input" });
        } else if (layer.reason) {
          result.push({ screen: screenName, selector, kind: "focus-indicator", reason: `focus background is indeterminate: ${layer.reason}` });
        } else if (outlineWidth > 0 && style.outlineStyle !== "none" && outline && outline.a > 0) {
          const value = ratio(composite(outline, layer.background), layer.background);
          result.push({ screen: screenName, selector, kind: "focus-indicator", foreground: style.outlineColor, background: `rgb(${Math.round(layer.background.r)}, ${Math.round(layer.background.g)}, ${Math.round(layer.background.b)})`, ratio: Number(value.toFixed(3)), threshold: 3, pass: value >= 3 });
        } else {
          const shadowColors = [...style.boxShadow.matchAll(/rgba?\([^)]*\)/g)].map((match) => parseColor(match[0])).filter((color): color is Color => Boolean(color && color.a > 0));
          if (shadowColors.length > 0) {
            const values = shadowColors.map((shadowColor) => ratio(composite(shadowColor, layer.background), layer.background));
            const value = Math.max(...values);
            result.push({ screen: screenName, selector, kind: "focus-indicator", foreground: style.boxShadow, background: `rgb(${Math.round(layer.background.r)}, ${Math.round(layer.background.g)}, ${Math.round(layer.background.b)})`, ratio: Number(value.toFixed(3)), threshold: 3, pass: value >= 3, reason: "focus ring uses box-shadow; highest-contrast visible ring layer measured" });
          } else {
            result.push({ screen: screenName, selector, kind: "focus-indicator", reason: "focus-visible element has no measurable outline or box-shadow" });
          }
        }
      }
      return result;
    }, screen);

    entries.push(...measurements);
  }

  const reportPath = process.env.RUNTIME_CONTRAST_REPORT ?? path.join(process.cwd(), "test-results", "contrast-runtime.json");
  await writeFile(reportPath, JSON.stringify({ generatedAt: new Date().toISOString(), entries }, null, 2));
  expect(entries.some((entry) => entry.screen === "Operations" && entry.kind === "text")).toBe(true);
  expect(entries.some((entry) => entry.screen === "Fleet" && entry.kind === "text")).toBe(true);
});
