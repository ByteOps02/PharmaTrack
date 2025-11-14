import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",

  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "postgres://medflow_user:medflow_secure_password@localhost:5432/medflow_db",
  },

  verbose: true,
  strict: true
});
