import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "./generated/client";

const ADAPTER_VERSION = 2;

function sslFromDatabaseUrl(url: URL) {
  const sslaccept = url.searchParams.get("sslaccept");
  if (sslaccept === "strict") return { rejectUnauthorized: true };
  if (sslaccept === "accept_invalid_certs")
    return { rejectUnauthorized: false };
  if (sslaccept) return true;
  if (url.hostname.includes("tidbcloud.com"))
    return { rejectUnauthorized: true };
  return undefined;
}

function createAdapter() {
  const url = new URL(process.env.DATABASE_URL!);
  const ssl = sslFromDatabaseUrl(url);
  return new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1).split("?")[0],
    connectionLimit: 5,
    ...(ssl !== undefined ? { ssl } : {}),
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  adapterVersion?: number;
};

function getPrismaClient() {
  if (
    globalForPrisma.prisma &&
    globalForPrisma.adapterVersion === ADAPTER_VERSION
  ) {
    return globalForPrisma.prisma;
  }

  if (globalForPrisma.prisma) {
    void globalForPrisma.prisma.$disconnect();
  }

  const prisma = new PrismaClient({ adapter: createAdapter() });
  globalForPrisma.prisma = prisma;
  globalForPrisma.adapterVersion = ADAPTER_VERSION;
  return prisma;
}

export const db = getPrismaClient();
