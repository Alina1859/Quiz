import 'dotenv/config'
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    // Use SQLite file in project root if env is not available
    url: env("DATABASE_URL") || "file:./dev.db",
  },
});
