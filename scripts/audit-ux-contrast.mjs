import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const tokenSource = await readFile(path.join(root, "src/styles/_variables.scss"), "utf8");
const tokenValues = Object.fromEntries(
  [...tokenSource.matchAll(/^\$([\w-]+):\s*(#[\da-fA-F]{3,8})\s*;/gm)].map((match) => [match[1], match[2]]),
);

const pairs = [
  { id: "token.text.primary-on-container", foreground: "$color-text", background: "$color-bg-container", kind: "text" },
  { id: "token.text.secondary-on-container", foreground: "$color-text-secondary", background: "$color-bg-container", kind: "text" },
  { id: "token.text.tertiary-on-container", foreground: "$color-text-tertiary", background: "$color-bg-container", kind: "text" },
  { id: "token.status.success", foreground: "$color-success-text", background: "$color-success-bg", kind: "text" },
  { id: "token.status.warning", foreground: "$color-warning-text", background: "$color-warning-bg", kind: "text" },
  { id: "token.status.error", foreground: "$color-error-text", background: "$color-error-bg", kind: "text" },
  { id: "token.status.info", foreground: "$color-info-text", background: "$color-info-bg", kind: "text" },
  { id: "token.status.neutral", foreground: "$color-neutral-text", background: "$color-neutral-bg", kind: "text" },
  { id: "token.button.primary", foreground: "$color-text-inverse", background: "$color-primary", kind: "text" },
  { id: "dashboard.kpi.label", source: "src/features/dashboard/components/KpiStrip.scss", foreground: "#8c8a95", background: "#ffffff", target: "$color-text-tertiary", targetBackground: "$color-bg-container", kind: "text" },
  { id: "dashboard.kpi.context", source: "src/features/dashboard/components/KpiStrip.scss", foreground: "#92909a", background: "#ffffff", target: "$color-text-tertiary", targetBackground: "$color-bg-container", kind: "text" },
  { id: "dashboard.timeline.caption", source: "src/features/dashboard/components/DispatchTimeline.scss", foreground: "#83818a", background: "#f5f6f3", target: "$color-text-tertiary", targetBackground: "$color-bg-subtle", kind: "text" },
  { id: "dashboard.map.caption", source: "src/features/dashboard/components/NetworkMiniMap.scss", foreground: "#83857d", background: "#f1f2ee", target: "$color-text-tertiary", targetBackground: "$color-bg-subtle", kind: "text" },
  { id: "loads.metadata", source: "src/features/loads/components/redesign/ShipmentDetail.scss", foreground: "#94a3b8", background: "#ffffff", target: "$color-text-tertiary", targetBackground: "$color-bg-container", kind: "text" },
  { id: "dashboard.purple-button", source: "src/features/dashboard/components/OperationsDashboardView.scss", foreground: "#ffffff", background: "#703eff", kind: "text" },
];

const normalizeHex = (value) => {
  const raw = value.startsWith("$") ? tokenValues[value.slice(1)] : value;
  if (!raw) throw new Error(`Unknown color token: ${value}`);
  const hex = raw.slice(1);
  if (hex.length === 3) return [...hex].map((part) => parseInt(part + part, 16));
  if (hex.length === 6) return [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
  throw new Error(`Unsupported color: ${value}`);
};

const luminance = (value) => {
  const channels = normalizeHex(value).map((part) => part / 255).map((part) =>
    part <= 0.04045 ? part / 12.92 : ((part + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const contrastRatio = (foreground, background) => {
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
};

const baselinePath = path.join(root, "docs/ux/contrast-baseline.json");
const baselineMode = process.argv.includes("--baseline");
const afterMode = process.argv.includes("--after");
const prior = baselineMode ? {} : JSON.parse(await readFile(baselinePath, "utf8"));
const results = pairs.map((pair) => {
  const foreground = baselineMode ? pair.foreground : (pair.target ?? pair.foreground);
  const background = baselineMode ? pair.background : (pair.targetBackground ?? pair.background);
  const ratio = Number(contrastRatio(foreground, background).toFixed(2));
  const previous = prior[pair.id]?.ratio;
  return {
    id: pair.id,
    source: pair.source ?? "src/styles/_variables.scss",
    foreground,
    background,
    ratio,
    threshold: pair.kind === "text" ? 4.5 : 3,
    noWorse: previous === undefined || ratio >= previous,
    pass: ratio >= (pair.kind === "text" ? 4.5 : 3),
  };
});

if (baselineMode) {
  await writeFile(baselinePath, `${JSON.stringify(Object.fromEntries(results.map((result) => [result.id, result])), null, 2)}\n`);
  console.log(`BASELINE written: ${path.relative(root, baselinePath)}`);
} else {
  const worsened = results.filter((result) => !result.noWorse);
  if (worsened.length) throw new Error(`Contrast worsened for: ${worsened.map((result) => result.id).join(", ")}`);
}

if (afterMode) {
  const afterPath = path.join(root, "docs/ux/contrast-after-ds003.json");
  await writeFile(afterPath, `${JSON.stringify(Object.fromEntries(results.map((result) => [result.id, result])), null, 2)}\n`);
  console.log(`AFTER written: ${path.relative(root, afterPath)}`);
}

console.table(results.map(({ id, foreground, background, ratio, threshold, noWorse, pass }) => ({ id, foreground, background, ratio, threshold, noWorse, pass })));
console.log(`${results.filter((result) => result.pass).length}/${results.length} pairs meet WCAG thresholds; ${results.filter((result) => !result.pass).map((result) => result.id).join(", ") || "no failures"}`);

if (!baselineMode && results.some((result) => !result.pass)) process.exitCode = 1;
