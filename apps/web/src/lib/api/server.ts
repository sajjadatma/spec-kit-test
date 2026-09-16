import { cookies } from "next/headers";
export async function serverApiFetch(path: string) { const cookie = (await cookies()).toString(); return fetch(`${process.env.API_ORIGIN ?? "http://localhost:3001/api/v1"}${path}`, { cache: "no-store", headers: { cookie } }); }
