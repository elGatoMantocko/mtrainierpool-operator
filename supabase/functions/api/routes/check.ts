import { DOMParser } from "@b-fuze/deno-dom";
import { createRoute, z } from "@hono/zod-openapi";
import * as uuid from "@std/uuid";
import { withSupabase } from "@supabase/server/adapters/hono";
import { Buffer } from "node:buffer";

import type { Database } from "@/types/database.types.ts";
import { DefaultOpenAPIHono } from "@/utils/hono.ts";
import { runPoolOperator } from "@/utils/operator.ts";
import { POOL_UPDATES_FIELDS } from "@/utils/queries.ts";

const NAMESPACE_POOL_UPDATE = await uuid.v5.generate(
  uuid.NAMESPACE_URL,
  Buffer.from("@mycah/pool-closure", "utf8"),
);

const PoolClosure = z.object({
  id: z.uuid(),
  closedAt: z.iso.datetime().nullable(),
  openedAt: z.iso.datetime().nullable(),
  reasoning: z.string().nullable(),
  confidenceScore: z.int().nullable(),
  flags: z.array(z.string()),
});

const Analysis = z.object({
  id: z.uuid(),
  model: z.string().nullable(),
  closures: z.array(PoolClosure),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime().nullable(),
});

const StatusUpdate = z.object({
  id: z.uuid(),
  message: z.string().nullable(),
  source: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime().nullable(),
  analysis: Analysis.nullable(),
}).openapi("StatusUpdate", {
  description: "A Mt. Rainier pool status update.",
});

const route = createRoute({
  operationId: "check",
  method: "get",
  path: "/",
  security: [{ SupabaseAuth: [] }],
  // don't use `as const` because this type doesn't fully support DB types
  // publishable or secret imply supabaseAdmin
  middleware: [withSupabase<Database>({ auth: ["secret"] })] as const,
  responses: {
    200: {
      description: "Found a pool status update.",
      content: {
        "application/json": {
          schema: StatusUpdate,
        },
      },
    },
    204: {
      description: "No status update available.",
    },
    500: {
      description: "Internal server error.",
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
    },
  },
});

export const app = new DefaultOpenAPIHono().openapi(
  route,
  async (c) => {
    // get new idempotent pool closure message
    const res = await fetch("https://mtrainierpool.com");
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, "text/html");
    const updateMessages = new Set([
      ...doc.querySelectorAll("#updates_banner p"),
    ].map((el) => el.textContent.trim()));

    const bannerText = [...updateMessages].join("\n\n");

    if (bannerText == null) {
      return c.body(null, 204);
    }

    // dedupe messages by using uuid5
    const id = await uuid.v5.generate(
      NAMESPACE_POOL_UPDATE,
      Buffer.from(bannerText, "utf8"),
    );
    const { data, error } = await c.var.supabaseContext.supabaseAdmin
      .from("pool_updates")
      .upsert({ id, message: bannerText, source: "mtrainierpool.com" })
      .select(POOL_UPDATES_FIELDS)
      .single();

    if (error) {
      throw new Error("failed to create new pool update record", {
        cause: error,
      });
    }

    console.log("got a pool update", data);

    if (data.analysis != null) {
      console.log("analysis already exists", data.analysis);
      return c.json(data satisfies z.infer<typeof StatusUpdate>, 200);
    }

    // need to run and apply an analysis
    console.log("running pool-operator analysis");
    EdgeRuntime.waitUntil(runPoolOperator(c, data.id, bannerText));

    return c.json(data satisfies z.infer<typeof StatusUpdate>, 200);
  },
);
