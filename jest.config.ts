import type { Config } from "jest";
const config: Config = { testEnvironment: "node", roots: ["<rootDir>/tests", "<rootDir>/packages"], testMatch: ["**/*.spec.ts"], transform: {} };
export default config;
