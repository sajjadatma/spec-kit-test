import argon2 from "argon2";

export function normalizeEmail(email: string) { return email.trim().toLowerCase(); }
export function validatePassword(password: string) { if (password.length < 12 || password.length > 128) throw new Error("PASSWORD_LENGTH_INVALID"); }
export async function hashPassword(password: string) { validatePassword(password); return argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 }); }
export async function verifyPassword(hash: string, password: string) { return argon2.verify(hash, password); }
