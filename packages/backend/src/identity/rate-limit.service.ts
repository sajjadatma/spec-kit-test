import { createHmac } from "node:crypto";
export const RATE_LIMITS = { loginIp: [10, 900], loginAccount: [5, 900], registerIp: [5, 3600], resetAccount: [3, 3600], resetIp: [10, 3600], refreshSession: [60, 60], uploadsUser: [30, 60], generationUser: [10, 3600] } as const;
export const subjectHash = (secret: string, value: string) => createHmac("sha256", secret).update(value).digest("hex");
