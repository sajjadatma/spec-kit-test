import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(), WEB_ORIGIN: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32), JWT_REFRESH_SECRET: z.string().min(32),
  CSRF_SECRET: z.string().min(32), TOKEN_HASH_SECRET: z.string().min(32),
  IMAGE_PROVIDER: z.enum(["fake", "openai"]).default("fake"),
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local")
});
export type AppConfig = z.infer<typeof schema>;
export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const value = schema.parse(source);
  if (value.NODE_ENV === "production" && (value.IMAGE_PROVIDER === "fake" || value.STORAGE_DRIVER === "local")) throw new Error("Production requires configured image and storage providers.");
  if (value.NODE_ENV === "test" && value.IMAGE_PROVIDER !== "fake") throw new Error("Tests must use the fake image provider.");
  return value;
}
export const publicConfig = (config: AppConfig) => ({ webOrigin: config.WEB_ORIGIN });
