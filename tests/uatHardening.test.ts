import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readProjectFile = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("UAT icon badge layout", () => {
  it("keeps official SDG artwork as a compact, undistorted lower-right badge", () => {
    const css = readProjectFile("src/styles.css");
    expect(css).toMatch(/\.tile-icon\s*\{[^}]*z-index:\s*0[^}]*right:[^}]*bottom:[^}]*width:\s*28%[^}]*height:\s*28%[^}]*object-fit:\s*contain/s);
    expect(css).toMatch(/\.tile-compact\s+\.tile-icon\s*\{[^}]*width:\s*32%[^}]*height:\s*32%/s);
    expect(css).toMatch(/\.tile strong\s*\{[^}]*z-index:\s*1/s);
    expect(css).toMatch(/\.tile span:not\(\.wheel\)\s*\{[^}]*z-index:\s*1/s);
  });
});

describe("service-worker deployment updates", () => {
  it("uses a network-first navigation shell with offline fallback and clears stale app caches", () => {
    const worker = readProjectFile("public/sw.js");
    expect(worker).toContain('event.request.mode === "navigate"');
    expect(worker).toContain('fetch(event.request)');
    expect(worker).toContain('caches.match("/index.html")');
    expect(worker).toContain('key.startsWith("sdg-escape-") && key !== CACHE');
    expect(worker).toContain("self.skipWaiting()");
    expect(worker).toContain("self.clients.claim()");
  });

  it("registers the worker without reusing a cached worker script", () => {
    const registration = readProjectFile("src/pwa/registerServiceWorker.ts");
    expect(registration).toContain('register("/sw.js", { updateViaCache: "none" })');
    expect(registration).toContain("registration.update()");
  });
});
