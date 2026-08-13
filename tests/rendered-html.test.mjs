import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);
const previewRoot = new URL("../app/_sites-preview/", import.meta.url);

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the finished OpenOptics landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /OpenOptics Lab/);
  assert.match(html, /把光路先算清楚/);
  assert.match(html, /成像光学/);
  assert.match(html, /激光光束/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});
test("server-renders both optical laboratories", async () => {
  const [imagingResponse, laserResponse] = await Promise.all([
    render("/imaging"),
    render("/laser"),
  ]);
  assert.equal(imagingResponse.status, 200);
  assert.equal(laserResponse.status, 200);
  const [imagingHtml, laserHtml] = await Promise.all([
    imagingResponse.text(),
    laserResponse.text(),
  ]);
  assert.match(imagingHtml, /成像光学实验室/);
  assert.match(imagingHtml, /系统参数/);
  assert.match(imagingHtml, /艾里斑直径/);
  assert.match(laserHtml, /激光光束实验室/);
  assert.match(laserHtml, /瑞利长度/);
  assert.match(laserHtml, /IEC 60825-1/);
});

test("removes all disposable starter assets", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /把光路先算清楚/);
  assert.match(layout, /OpenOptics Lab/);
  assert.doesNotMatch(page, /codex-preview|_sites-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(previewRoot));
  await assert.rejects(access(new URL("public/_sites-preview", templateRoot)));
});
