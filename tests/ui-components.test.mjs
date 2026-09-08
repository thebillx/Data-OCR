import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true },
});

after(async () => {
  await vite.close();
});

async function readCssTree(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const contents = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return readCssTree(entryPath);
      }
      return entry.name.endsWith(".css") ? readFile(entryPath, "utf8") : "";
    }),
  );
  return contents.join("\n");
}

test("emits editor styling and the reference card aspect ratio", async () => {
  const css = await readCssTree(path.join(root, "dist"));

  assert.match(css, /--tw-enter-opacity/);
  assert.match(css, /\.canvas-wrap/);
  assert.match(css, /aspect-ratio:1\.5/);
  assert.match(css, /\.download-button/);
  assert.match(css, /Sarabun-Regular\.ttf/);
  assert.match(css, /CardThai-Looped-Bold\.ttf/);
});

test("forwards progress semantics to the primitive", async () => {
  const { Progress } = await vite.ssrLoadModule("/components/ui/progress.tsx");
  const html = renderToStaticMarkup(React.createElement(Progress, { value: 37 }));

  assert.match(html, /aria-valuenow="37"/);
  assert.match(html, /aria-valuetext="37%"/);
  assert.match(html, /data-state="loading"/);
});

test("renders a single nullable title picker with no title text input", async () => {
  const { TitleField } = await vite.ssrLoadModule("/app/card-inputs.tsx");
  const empty = renderToStaticMarkup(React.createElement(TitleField, { value: null, onChange(){} }));
  const selected = renderToStaticMarkup(React.createElement(TitleField, { value: 'mr', onChange(){} }));
  assert.equal((empty.match(/aria-label="คำนำหน้า"/g) ?? []).length, 1);
  assert.doesNotMatch(empty, /<input\b/);
  assert.match(empty, /ยังไม่แสดงคำนำหน้าทั้งสองภาษา/);
  assert.match(selected, /ไทย: นาย · อังกฤษ: Mr\./);
  assert.doesNotMatch(selected, /กำหนดเอง|คำนำหน้า \(อังกฤษ\)/);
});

test("emits chart themes for the starter's media dark mode", async () => {
  const { ChartStyle } = await vite.ssrLoadModule("/components/ui/chart.tsx");
  const html = renderToStaticMarkup(
    React.createElement(ChartStyle, {
      id: "contract",
      config: {
        latency: { theme: { light: "#ffffff", dark: "#000000" } },
      },
    }),
  );

  assert.match(html, /\[data-chart=contract\]/);
  assert.match(html, /@media \(prefers-color-scheme: dark\)/);
  assert.doesNotMatch(html, /\.dark/);
});

test("renders sidebar skeletons deterministically", async () => {
  const { SidebarMenuSkeleton } = await vite.ssrLoadModule(
    "/components/ui/sidebar.tsx",
  );
  const first = renderToStaticMarkup(React.createElement(SidebarMenuSkeleton));
  const second = renderToStaticMarkup(React.createElement(SidebarMenuSkeleton));

  assert.equal(first, second);
  assert.match(first, /--skeleton-width:70%/);
});
