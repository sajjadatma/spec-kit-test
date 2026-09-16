import { defineConfig, devices } from "@playwright/test";
export default defineConfig({ projects: [
  { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  { name: "webkit", use: { ...devices["Desktop Safari"] } },
  { name: "tablet", use: { ...devices["iPad (gen 7)"] } },
  { name: "narrow", use: { ...devices["iPhone 13"] } }
] });
