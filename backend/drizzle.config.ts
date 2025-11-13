import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgres",

  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "postgres://medflow_user:medflow_secure_password@localhost:5432/medflow_db",
  },

  verbose: true,
  strict: true,

  // ✅ Multi-schema support (correct key)
  schemas: ["public"],

  // ✅ Migrations settings
  migrations: {
    table: "__drizzle_migrations__",
    schema: "public",
  },
});
