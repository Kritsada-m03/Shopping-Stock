import { defineConfig } from "@playwright/test";
import path from "node:path";

const databasePath = path.resolve(process.cwd(), `../.artifacts/browser-shopping-${Date.now()}.db`);

export default defineConfig({
  testDir: "./tests",
  outputDir: "../.artifacts/playwright",
  workers: 1,
  timeout: 45_000,
  use: { baseURL: "http://127.0.0.1:3100", channel: "msedge", headless: true,
    viewport: { width: 1440, height: 1000 }, trace: "retain-on-failure" },
  webServer: [
    {
      command: "dotnet bin/Debug/net10.0/Shopping.Api.dll",
      cwd: "../backend/Shopping.Api",
      env: { ASPNETCORE_URLS: "http://127.0.0.1:5199",
        ConnectionStrings__ShoppingDb: `Data Source=${databasePath};Foreign Keys=True;Default Timeout=15`,
        AllowedOrigins__0: "http://127.0.0.1:3100" },
      url: "http://127.0.0.1:5199/api/health",
      timeout: 30_000,
    },
    {
      command: "npm.cmd run dev -- --port 3100",
      env: { NEXT_PUBLIC_API_URL: "http://127.0.0.1:5199/api", NEXT_BUILD_DIR: ".next-e2e" },
      url: "http://127.0.0.1:3100",
      timeout: 60_000,
    },
  ],
});
