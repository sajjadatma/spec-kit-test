import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import Decimal from "decimal.js";

export const createPrismaClient = (databaseUrl: string) => new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: databaseUrl })) });
export const decimalString = (value: Decimal | string) => new Decimal(value).toFixed();
export const assertScale = (value: string, scale: number) => {
  const parsed = new Decimal(value);
  if (!parsed.isFinite() || parsed.decimalPlaces() > scale) throw new Error("DECIMAL_SCALE_INVALID");
  return parsed;
};
export const nextRevision = (revision: number) => revision + 1;
