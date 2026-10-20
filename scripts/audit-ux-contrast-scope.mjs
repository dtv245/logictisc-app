import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const roots = [
  "src/styles",
  "src/components",
  "src/features/dashboard",
  "src/features/loads/components/redesign",
];
const palette = new Map();
const variables = await readFile(path.join(root, "src/styles/_variables.scss"), "utf8");
for (const match of variables.matchAll(/^\$([\w-]+):\s*(#[\da-fA-F]{3,8})\s*;/gm)) palette.set(`$${match[1]}`, match[2]);

const files = [];
async function walk(relative) {
  for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) await walk(child);
    else if (/\.(scss|css|tsx)$/.test(entry.name)) files.push(child);
  }
}
for (const directory of roots) await walk(directory);

function parseColor(raw) {
  const value = raw.trim();
  const token = value.match(/^\$[\w-]+/);
  if (token && palette.has(token[0])) return parseColor(palette.get(token[0]));
  const cssToken = value.match(/^var\(--([\w-]+)/);
  if (cssToken) {
    const sassToken = `$${cssToken[1].replace(/^color-/, "color-")}`;
    if (palette.has(sassToken)) return parseColor(palette.get(sassToken));
    const fallback = value.match(/,\s*(#[\da-fA-F]{3,8})\s*\)/);
    if (fallback) return parseColor(fallback[1]);
  }
  const hex = value.match(/#([\da-fA-F]{3,8})/);
  if (hex) {
    let digits = hex[1];
    if (digits.length === 3 || digits.length === 4) digits = [...digits.slice(0, 3)].map((part) => part + part).join("") + (digits.length === 4 ? `${digits[3]}${digits[3]}` : "");
    if (digits.length === 6 || digits.length === 8) return { rgb: [0, 2, 4].map((offset) => Number.parseInt(digits.slice(offset, offset + 2), 16)), alpha: digits.length === 8 ? Number.parseInt(digits.slice(6, 8), 16) / 255 : 1, raw: `#${hex[1]}` };
  }
  const rgb = value.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/i);
  if (rgb) return { rgb: rgb.slice(1, 4).map(Number), alpha: rgb[4] ? (rgb[4].endsWith("%") ? Number.parseFloat(rgb[4]) / 100 : Number(rgb[4])) : 1, raw: rgb[0] };
  return null;
}

function colorsIn(value) {
  const found = [];
  const tokenRefs = [...value.matchAll(/\$[\w-]+/g)].map((match) => match[0]).filter((token) => palette.has(token));
  for (const token of tokenRefs) found.push(parseColor(token));
  const hexValues = [...value.matchAll(/#[\da-fA-F]{3,8}\b/g)].map((match) => match[0]);
  for (const color of hexValues) found.push(parseColor(color));
  const rgbValues = [...value.matchAll(/rgba?\([^)]*\)/gi)].map((match) => match[0]);
  for (const color of rgbValues) found.push(parseColor(color));
  const cssVars = [...value.matchAll(/var\(--[\w-]+(?:,\s*#[\da-fA-F]{3,8})?\)/g)].map((match) => match[0]);
  for (const color of cssVars) found.push(parseColor(color));
  return found.filter(Boolean).filter((color, index, all) => all.findIndex((other) => other.raw === color.raw) === index);
}

function composite(foreground, background) {
  return foreground.rgb.map((channel, index) => channel * foreground.alpha + background.rgb[index] * (1 - foreground.alpha));
}
function luminance(rgb) {
  const linear = rgb.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}
function ratio(foreground, background) {
  const fg = luminance(composite(foreground, background));
  const bg = luminance(background.rgb);
  return Number(((Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05)).toFixed(2));
}

const pairs = [];
const unresolved = [];
const declarationCount = { foreground: 0, nonText: 0, background: 0, inlineTsxForeground: 0 };
const stylesheetFiles = files.filter((file) => /\.(scss|css)$/.test(file));

for (const file of stylesheetFiles) {
  const source = (await readFile(path.join(root, file), "utf8")).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  const stack = [];
  let buffer = "";
  let line = 1;
  let blockStartLine = 1;
  const flush = (frame) => {
    const declarations = [...frame.body.matchAll(/(?:^|;)\s*([\w-]+)\s*:\s*([^;]+)(?=;|$)/g)].map((match) => ({ property: match[1].toLowerCase(), value: match[2].trim(), line: frame.line + (frame.body.slice(0, match.index).match(/\n/g)?.length ?? 0) }));
    const foregrounds = declarations.filter((declaration) => declaration.property === "color").flatMap((declaration) => colorsIn(declaration.value).map((color) => ({ declaration, color })));
    const nonText = declarations.filter((declaration) => ["border-color", "outline-color", "fill", "stroke"].includes(declaration.property)).flatMap((declaration) => colorsIn(declaration.value).map((color) => ({ declaration, color })));
    const ownBackgrounds = declarations.filter((declaration) => ["background", "background-color"].includes(declaration.property)).flatMap((declaration) => colorsIn(declaration.value));
    declarationCount.foreground += foregrounds.length;
    declarationCount.nonText += nonText.length;
    declarationCount.background += ownBackgrounds.length;
    if (!foregrounds.length && !nonText.length) return;
    const backgrounds = ownBackgrounds;
    const resolvedSelector = frame.selector || ":selector unavailable";
    for (const item of foregrounds.map((entry) => ({ ...entry, kind: "text", threshold: 4.5 }))) {
      if (!backgrounds.length) {
        unresolved.push({ file, line: item.declaration.line, selector: resolvedSelector, property: item.declaration.property, value: item.declaration.value, reason: "background is inherited or supplied by another selector; pair not inferred" });
        continue;
      }
      for (const background of backgrounds) {
        if (background.alpha < 1) {
          unresolved.push({ file, line: item.declaration.line, selector: resolvedSelector, property: item.declaration.property, value: item.declaration.value, reason: "paired background is translucent; underlying surface must be resolved" });
          continue;
        }
        const contrast = ratio(item.color, background);
        pairs.push({ file, line: item.declaration.line, selector: resolvedSelector, kind: item.kind, foreground: item.color.raw, background: background.raw, ratio: contrast, threshold: item.threshold, pass: contrast >= item.threshold });
      }
    }
    for (const item of nonText) unresolved.push({ file, line: item.declaration.line, selector: resolvedSelector, property: item.declaration.property, value: item.declaration.value, reason: "non-text boundary must be compared with the surrounding surface, not its own element background" });
    frame.backgrounds = ownBackgrounds;
  };

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === "\n") line += 1;
    if (character === "{") {
      const selector = buffer.trim().split(";").at(-1)?.trim().split("\n").at(-1)?.trim() ?? "";
      stack.push({ selector, body: "", line: blockStartLine, backgrounds: [] });
      buffer = "";
      blockStartLine = line;
    } else if (character === "}") {
      const frame = stack.at(-1);
      if (frame) {
        frame.body += buffer;
        flush(frame);
        stack.pop();
      }
      buffer = "";
      blockStartLine = line;
    } else if (character === ";") {
      if (stack.length) {
        const frame = stack.at(-1);
        frame.body += `${buffer};`;
        const background = buffer.match(/^\s*(?:background|background-color)\s*:\s*([^;]+)/i);
        if (background) frame.backgrounds = colorsIn(background[1]);
      }
      buffer = "";
      blockStartLine = line;
    } else buffer += character;
  }
}

const tsxFiles = files.filter((file) => file.endsWith(".tsx"));
for (const file of tsxFiles) {
  const source = await readFile(path.join(root, file), "utf8");
  for (const [lineIndex, line] of source.split("\n").entries()) {
    const foreground = line.match(/\bcolor\s*:\s*(["'])(#[\da-fA-F]{3,8}|rgba?\([^)]*\)|\$[\w-]+)\1/);
    if (!foreground) continue;
    declarationCount.inlineTsxForeground += 1;
    const bg = line.match(/\b(?:background|backgroundColor)\s*:\s*(["'])(#[\da-fA-F]{3,8}|rgba?\([^)]*\)|\$[\w-]+)\1/);
    const fgColor = parseColor(foreground[2]);
    const bgColor = bg ? parseColor(bg[2]) : null;
    if (fgColor && bgColor) {
      const contrast = ratio(fgColor, bgColor);
      pairs.push({ file, line: lineIndex + 1, selector: "inline style object", kind: "text", foreground: fgColor.raw, background: bgColor.raw, ratio: contrast, threshold: 4.5, pass: contrast >= 4.5 });
    } else {
      unresolved.push({ file, line: lineIndex + 1, selector: "inline style object", property: "color", value: foreground[2], reason: bgColor ? "unresolved foreground" : "inline style has no paired background on same line" });
    }
  }
}

const report = {
  scope: roots,
  generatedAt: new Date().toISOString(),
  counts: { files: files.length, stylesheets: stylesheetFiles.length, tsx: tsxFiles.length, declarations: declarationCount, paired: pairs.length, failures: pairs.filter((pair) => !pair.pass).length, unresolved: unresolved.length },
  pairs,
  unresolved,
};
const output = path.join(root, "docs/ux/contrast-audit-qa003.json");
if (!process.argv.includes("--no-write")) await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
if (process.argv.includes("--summary-json")) {
  console.log(JSON.stringify(report.counts));
} else {
  console.log(JSON.stringify(report.counts, null, 2));
}
console.table(pairs.filter((pair) => !pair.pass).map(({ file, line, selector, foreground, background, ratio, threshold }) => ({ file, line, selector, foreground, background, ratio, threshold })));
if (!process.argv.includes("--no-write")) console.log(`Report: ${path.relative(root, output)}`);
console.log(`UNPAIRED: ${unresolved.length}; these values are listed for manual/background-context review.`);
if (pairs.some((pair) => !pair.pass)) process.exitCode = 1;
