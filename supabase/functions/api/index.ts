import { OpenAPIHono } from "@hono/zod-openapi";
import type { SupabaseContext } from "@supabase/server";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";

import { app as checkApp } from "@/routes/check.ts";
import { Database } from "./types/database.types.ts";

export type SupabaseVariables = {
  Variables: { supabaseContext: SupabaseContext<Database> };
};

const api = new OpenAPIHono();
api.route("/check", checkApp);

const app = new OpenAPIHono();
app
  .use(cors())
  .use(logger());
app.openAPIRegistry.registerComponent("securitySchemes", "SupabaseAuth", {
  type: "apiKey",
  name: "apiKey",
  in: "header",
});
app.route("/api", api);
app.onError((err, c) => {
  console.error(err);
  if (err instanceof HTTPException) return c.text(err.message, err.status);
  return c.text("Unknown error", 500);
});

export const doc = app.getOpenAPIDocument({
  info: { title: "MT Rainier Pool API", version: "v1.0.0" },
  openapi: "v3.0.0",
});

export default app;
