/** Measure emitted static JS dependencies, excluding deferred import() modules. */
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { gzipSync } from "node:zlib";
// Existing Vite toolchain dependency; this does not affect the production bundle.
import { init, parse } from "es-module-lexer";

const buildRoot = path.resolve(process.argv[2] ?? "dist");
const outputPath = process.argv[3];
await init;
const assetRoot = path.join(buildRoot, "assets");
const files = (await readdir(assetRoot)).filter((file) => file.endsWith(".js")).sort();
const graph = new Map();
for (const file of files) {
  const source = await readFile(path.join(assetRoot, file));
  const [imports] = parse(source.toString());
  graph.set(file, {
    bytes: source.length,
    gzipBytes: gzipSync(source).length,
    staticImports: imports.filter((item) => item.d === -1 && item.n?.startsWith("./"))
      .map((item) => path.basename(item.n)),
  });
}
function closure(root, result = new Set()) {
  if (result.has(root)) return result;
  const node = graph.get(root);
  if (!node) throw new Error(`Missing emitted dependency: ${root}`);
  result.add(root);
  for (const dependency of node.staticImports) closure(dependency, result);
  return result;
}
function measure(names) {
  return [...names].reduce((result, name) => ({
    bytes: result.bytes + graph.get(name).bytes,
    gzipBytes: result.gzipBytes + graph.get(name).gzipBytes,
  }), { bytes: 0, gzipBytes: 0 });
}
const html = await readFile(path.join(buildRoot, "index.html"), "utf8");
const entry = html.match(/<script[^>]+src="[^"]*\/([^/"]+\.js)"/)?.[1];
if (!entry) throw new Error("Built HTML has no JS entry");
const bootstrap = closure(entry);
const featureNames = ["DashboardPage", "OperationsDashboardPage", "FinancialSection", "PayrollRunShow", "PayslipShow", "leaflet-src"];
const features = Object.fromEntries(featureNames.map((feature) => {
  const root = files.find((file) => file.startsWith(`${feature}-`));
  if (!root) return [feature, { emitted: false }];
  const dependencies = closure(root);
  const additional = new Set([...dependencies].filter((file) => !bootstrap.has(file)));
  return [feature, {
    root,
    inBootstrap: bootstrap.has(root),
    staticClosure: measure(dependencies),
    additionalToBootstrap: measure(additional),
    files: [...additional].sort(),
  }];
}));
const report = {
  method: "Minified emitted JS; static dependency closure only; gzip summed per asset. Dynamic imports and CSS excluded. This measures dependency boundaries, not browser transfer/timing or total route-complete payload.",
  bootstrap: { root: entry, ...measure(bootstrap), files: [...bootstrap].sort() },
  features,
  largestChunks: [...graph.entries()].sort((a, b) => b[1].bytes - a[1].bytes)
    .slice(0, 8).map(([file, { bytes, gzipBytes }]) => ({ file, bytes, gzipBytes })),
  totalJavaScript: measure(new Set(files)),
};
const json = `${JSON.stringify(report, null, 2)}\n`;
if (outputPath) await writeFile(outputPath, json);
else process.stdout.write(json);
