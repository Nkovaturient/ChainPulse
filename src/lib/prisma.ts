import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

/** Recover from common mis-pastes, e.g. `DIRECT_URL=postgresql://...` or `KEY=VALUE=postgresql://...`. */
function resolveDatabaseUrl(raw: string | undefined): string {
  if (!raw?.trim()) {
    throw new Error(
      "DATABASE_URL is empty.",
    );
  }
  let url = raw.trim();
  if (url.startsWith("DIRECT_URL=")) {
    url = url.slice("DIRECT_URL=".length).trim();
  }
  if (!/^postgres(ql)?:\/\//i.test(url)) {
    const m = url.match(/(postgres(ql)?:\/\/[^\s"]+)/i);
    if (m) {
      url = m[1]!;
    }
  }
  if (!/^postgres(ql)?:\/\//i.test(url)) {
    throw new Error(
      "DATABASE_URL must start with postgresql:// or postgres://.",
    );
  }

  try {
    const forUrl = new URL(
      url.replace(/^postgresql:/i, "http:").replace(/^postgres:/i, "http:"),
    );
    if (
      forUrl.hostname.includes("pooler.supabase.com") &&
      forUrl.port === "6543"
    ) {
      const qs = new URLSearchParams(forUrl.search);
      if (!qs.has("pgbouncer")) {
        qs.set("pgbouncer", "true");
      }
      if (!qs.has("sslmode")) {
        qs.set("sslmode", "require");
      }
      forUrl.search = qs.toString();
      return forUrl.toString().replace(/^http:/, "postgresql:");
    }
  } catch {
    /* use raw url */
  }

  return url;
}

function createPool() {
  const connectionString = resolveDatabaseUrl(process.env.DATABASE_URL);
  const isLocal = connectionString.includes("localhost");
  const isProd = process.env.NODE_ENV === "production";

  return new Pool({
    connectionString,
    max: isProd ? 1 : 10,
    idleTimeoutMillis: isProd ? 10_000 : 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(
      globalForPrisma.pgPool ?? (globalForPrisma.pgPool = createPool()),
    ),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;
