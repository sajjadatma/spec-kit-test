export type Currency = "IRR" | "TOMAN" | "USD";
export type Role = "SUPER_ADMIN" | "ADMIN" | "PRODUCT_MANAGER" | "USER";
export type ApiEnvelope<T> = { data: T; requestId?: string };
export type ApiError = { error: { code: string; message: string; requestId?: string } };
