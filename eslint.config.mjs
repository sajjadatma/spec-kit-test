import js from "@eslint/js";
import globals from "globals";
import parser from "@typescript-eslint/parser";
import plugin from "@typescript-eslint/eslint-plugin";

export default [
  { ignores: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/.next/**", "coverage/**"] },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser, globals: { ...globals.node, ...globals.browser, React: "readonly" } },
    plugins: { "@typescript-eslint": plugin },
    rules: { ...plugin.configs.recommended.rules, "no-undef": "off" }
  },
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: ["@industrial-dashboard/backend", "@industrial-dashboard/backend/*", "@prisma/*"] }]
    }
  }
];
