import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

function detectChromium(): string | undefined {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  const direct = [
    "/opt/pw-browsers/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
  ];
  for (const p of direct) {
    if (existsSync(p)) return p;
  }
  // /opt/pw-browsers/chromium-XXXX/chrome-linux/chrome (Playwright kapsayıcı düzeni)
  if (existsSync("/opt/pw-browsers")) {
    for (const entry of readdirSync("/opt/pw-browsers")) {
      if (!entry.startsWith("chromium")) continue;
      for (const rel of ["chrome-linux/chrome", "chrome-linux64/chrome", "chrome-mac/Chromium.app/Contents/MacOS/Chromium"]) {
        const cand = path.join("/opt/pw-browsers", entry, rel);
        if (existsSync(cand)) return cand;
      }
    }
  }
  return undefined;
}

const PORT = Number(process.env.E2E_PORT || 3111);
const AFF_PORT = Number(process.env.E2E_AFF_PORT || 3112);
const LIVE_PORT = Number(process.env.E2E_LIVE_PORT || 3113);
const MOCK_TP_PORT = Number(process.env.MOCK_TP_PORT || 3119);
const BASE_URL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`;
const AFF_BASE_URL = process.env.E2E_AFF_BASE_URL || `http://localhost:${AFF_PORT}`;
const LIVE_BASE_URL = process.env.E2E_LIVE_BASE_URL || `http://localhost:${LIVE_PORT}`;
const executablePath = detectChromium();

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "off",
    locale: "tr-TR",
    launchOptions: executablePath ? { executablePath, args: ["--no-sandbox"] } : { args: ["--no-sandbox"] },
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        launchOptions: executablePath ? { executablePath, args: ["--no-sandbox"] } : { args: ["--no-sandbox"] },
      },
      testIgnore: /(mobile|affiliate|live-widget)\.spec\.ts/,
    },
    {
      name: "mobile",
      use: {
        ...devices["iPhone 13"],
        defaultBrowserType: "chromium",
        launchOptions: executablePath ? { executablePath, args: ["--no-sandbox"] } : { args: ["--no-sandbox"] },
      },
      testMatch: /mobile\.spec\.ts/,
    },
    {
      name: "affiliate",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: AFF_BASE_URL,
        viewport: { width: 1440, height: 900 },
        launchOptions: executablePath ? { executablePath, args: ["--no-sandbox"] } : { args: ["--no-sandbox"] },
      },
      testMatch: /affiliate\.spec\.ts/,
    },
    {
      name: "live-widget",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: LIVE_BASE_URL,
        viewport: { width: 1440, height: 900 },
        timezoneId: "Europe/Amsterdam",
        launchOptions: executablePath ? { executablePath, args: ["--no-sandbox"] } : { args: ["--no-sandbox"] },
      },
      testMatch: /live-widget\.spec\.ts/,
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        {
          command: `npx next start -p ${PORT}`,
          url: BASE_URL,
          reuseExistingServer: false,
          timeout: 30_000,
          env: {
            ...process.env,
            // Örnek veri modu (ağ gerektirmez; derlemede widget kimliği olsa bile demo testleri etkilenmez)
            TRAVELPAYOUTS_TOKEN: "",
            DUFFEL_ACCESS_TOKEN: "",
            NEXT_PUBLIC_TP_WL_WIDGET_ID: "",
            PIRPIR_DISABLE_LIVE_WIDGET: "1",
            ECB_RATES_URL: "http://127.0.0.1:1/offline",
          },
        },
        {
          command: `node tests/e2e/fixtures/mock-travelpayouts.mjs`,
          url: `http://127.0.0.1:${MOCK_TP_PORT}/health`,
          reuseExistingServer: false,
          timeout: 15_000,
          env: {
            ...process.env,
            MOCK_TP_PORT: String(MOCK_TP_PORT),
          },
        },
        {
          command: `npx next start -p ${AFF_PORT}`,
          url: AFF_BASE_URL,
          reuseExistingServer: false,
          timeout: 30_000,
          env: {
            ...process.env,
            // Ortaklık + yerel sahte Travelpayouts modu (canlı widget kapalı)
            TRAVELPAYOUTS_TOKEN: "test",
            TRAVELPAYOUTS_API_URL: `http://127.0.0.1:${MOCK_TP_PORT}`,
            DUFFEL_ACCESS_TOKEN: "",
            NEXT_PUBLIC_TP_WL_WIDGET_ID: "",
            PIRPIR_DISABLE_LIVE_WIDGET: "1",
            ECB_RATES_URL: "http://127.0.0.1:1/offline",
          },
        },
        {
          command: `npx next start -p ${LIVE_PORT}`,
          url: LIVE_BASE_URL,
          reuseExistingServer: false,
          timeout: 30_000,
          env: {
            ...process.env,
            // Canlı widget modu (tpwgt.com betiği testte sahte gölge kökle yakalanır, ağ gerektirmez)
            TRAVELPAYOUTS_TOKEN: "test",
            TRAVELPAYOUTS_API_URL: `http://127.0.0.1:${MOCK_TP_PORT}`,
            DUFFEL_ACCESS_TOKEN: "",
            TP_WL_WIDGET_ID: "25161",
            PIRPIR_DISABLE_LIVE_WIDGET: "",
            ECB_RATES_URL: "http://127.0.0.1:1/offline",
          },
        },
      ],
});
