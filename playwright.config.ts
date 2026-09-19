import { defineConfig, devices } from "@playwright/test";
const chromium = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { ...devices["Desktop Chrome"], launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } } : devices["Desktop Chrome"];
export default defineConfig({ projects: [
  { name: "chromium", use: chromium },
  { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  { name: "webkit", use: { ...devices["Desktop Safari"] } },
  { name: "tablet", use: { ...devices["iPad (gen 7)"] } },
  { name: "narrow", use: { ...devices["iPhone 13"] } }
] });
