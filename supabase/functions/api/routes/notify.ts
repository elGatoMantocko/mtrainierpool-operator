import { SendEmailCommand } from "@aws-sdk/client-ses";
import { createRoute, z } from "@hono/zod-openapi";
import { withSupabase } from "@supabase/server/adapters/hono";
import type { Context } from "hono";

import { SupabaseVariables } from "@/index.ts";
import { AwsVariables, withAws } from "@/middleware/aws.ts";
import { Tables } from "@/types/database.types.ts";
import { formatDate } from "@/utils/dates.ts";
import { DefaultOpenAPIHono } from "@/utils/hono.ts";

type PoolClosure = Pick<
  Tables<{ schema: "public" }, "pool_closures">,
  "closure_date" | "reopening_date" | "reasoning"
>;

type PoolUpdate = Pick<
  Tables<{ schema: "public" }, "pool_updates">,
  "id" | "message" | "source"
>;

interface PoolOperatorAnalysis {
  id: string;
  poolUpdate: PoolUpdate | null;
  closures: PoolClosure[];
}

const SMTP_ADMIN_EMAIL = Deno.env.get("SMTP_ADMIN_EMAIL");
const POOL_CLOSED_SUBJECT = "Mt. Rainier Pool — Closure Notice";

const NotifyEmailRequest = z.object({
  analysisId: z.uuid(),
}).openapi("NotifyEmailRequest", {
  description: "Deliver the pool-closure email for a pool operator analysis.",
});

const NotifyEmailResult = z.object({
  analysisId: z.uuid(),
  started: z.int(),
}).openapi("NotifyEmailResult", {
  description: "Per-recipient email delivery outcomes.",
});

const route = createRoute({
  operationId: "notifyEmail",
  method: "post",
  path: "/email",
  security: [{ SupabaseAuth: [] }],
  // secret key only — matches /check; implies supabaseAdmin
  middleware: [withSupabase({ auth: ["secret"] }), withAws()],
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: NotifyEmailRequest } },
    },
  },
  responses: {
    200: {
      description: "Delivery attempted; returns per-recipient outcomes.",
      content: { "application/json": { schema: NotifyEmailResult } },
    },
    404: {
      description: "No analysis exists for the given id.",
      content: { "text/plain": { schema: z.string() } },
    },
    500: {
      description: "Internal server error.",
      content: { "text/plain": { schema: z.string() } },
    },
  },
});

function emailData(analysis: PoolOperatorAnalysis): string {
  const blocks = analysis.closures.map((closure) => {
    const lines = [];
    if (closure.closure_date) {
      lines.push(`Closed since: ${formatDate(closure.closure_date)}`);
    }
    if (closure.reopening_date) {
      lines.push(`Expected to reopen: ${formatDate(closure.reopening_date)}`);
    }
    if (closure.reasoning) lines.push(`\nDetails: ${closure.reasoning}`);
    return lines.map((line) => `<p>${line}</p>`).join("\n");
  });
  const message = analysis.poolUpdate?.message;
  return `<html>
<body>
  <h2>The pool is most likely closed!</h2>
  ${message ? `<p><strong>Pool update:</strong> ${message}</p>` : ""}
  ${blocks.join("\n<hr />\n")}
</body>
</html>`;
}

async function sendEmails(
  c: Context<SupabaseVariables & AwsVariables>,
  recipients: Array<{ id: string; email: string }>,
  analysis: PoolOperatorAnalysis,
): Promise<void> {
  if (!SMTP_ADMIN_EMAIL) {
    throw new Error("missing configuration SMTP_ADMIN_EMAIL not set");
  }
  // Any recorded closure means the pool is closed; the recipient interprets the
  // specifics. The DB trigger already only notifies when closures exist, but
  // guard here too since the route can be called directly.
  if (analysis.closures.length === 0) {
    console.log("skipping notification, analysis has no closures.");
    return;
  }
  for (const user of recipients) {
    // Ensure a delivery row exists. Idempotent on (idempotency_key, user_id);
    // we don't care whether this inserted or no-op'd — the claim below decides
    // who actually sends.
    const { error: upsertError } = await c.var.supabaseContext.supabaseAdmin
      .from("notification_deliveries")
      .upsert({
        user_id: user.id,
        type: "pool_closure",
        idempotency_key: analysis.id,
        channel: "email",
        recipient: user.email,
        provider: "ses",
        payload: { pool_update_id: analysis.poolUpdate?.id ?? null },
      }, { onConflict: "idempotency_key,user_id", ignoreDuplicates: true });

    if (upsertError) {
      throw new Error("failed to upsert notification delivery", {
        cause: upsertError,
      });
    }

    const { data: claimed, error: claimError } = await c.var.supabaseContext
      .supabaseAdmin
      .from("notification_deliveries")
      .update({ status: "sending", attempts: 1 })
      .eq("idempotency_key", analysis.id)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (claimError) {
      throw new Error("failed to claim notification delivery", {
        cause: claimError,
      });
    }
    if (!claimed) {
      console.log("skipping delivery for user", user.id);
      continue;
    }

    const deliveryId = claimed.id;
    try {
      const res = await c.var.aws.ses.send(
        new SendEmailCommand({
          Source: SMTP_ADMIN_EMAIL,
          Destination: { ToAddresses: [user.email] },
          Message: {
            Subject: {
              Data: POOL_CLOSED_SUBJECT,
              Charset: "UTF-8",
            },
            Body: {
              Html: { Data: emailData(analysis), Charset: "UTF-8" },
            },
          },
        }),
      );

      await c.var.supabaseContext.supabaseAdmin.from("notification_deliveries")
        .update({
          status: "sent",
          provider_message_id: res.MessageId ?? null,
          sent_at: Temporal.Now.instant().toString(),
        }).eq("id", deliveryId);

      await c.var.supabaseContext.supabaseAdmin.from("email_deliveries").upsert(
        {
          delivery_id: deliveryId,
          from_address: SMTP_ADMIN_EMAIL,
          to_address: user.email,
          subject: POOL_CLOSED_SUBJECT,
        },
        { onConflict: "delivery_id" },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      await c.var.supabaseContext.supabaseAdmin.from("notification_deliveries")
        .update({
          status: "failed",
          error: message,
          failed_at: Temporal.Now.instant().toString(),
        }).eq("id", deliveryId);

      console.log("failed delivery for user", user.id, message);
    }
  }
}

export const app = new DefaultOpenAPIHono<SupabaseVariables & AwsVariables>()
  .openapi(
    route,
    async (c) => {
      const { analysisId } = c.req.valid("json");
      const supabase = c.var.supabaseContext.supabaseAdmin;

      const { data: analysis, error: analysisError } = await supabase
        .from("pool_operator_analysis")
        .select(
          `id
          , poolUpdate:pool_updates(id, message, source)
          , closures:pool_closures(closure_date, reopening_date, reasoning)`,
        )
        .eq("id", analysisId)
        .maybeSingle();

      if (analysisError) {
        throw new Error("failed to load pool operator analysis", {
          cause: analysisError,
        });
      }
      if (!analysis) {
        return c.text("no analysis for id", 404);
      }

      const { data: listUsersRes, error: listUsersError } = await supabase.auth
        .admin
        .listUsers();
      if (listUsersError) {
        throw new Error("failed to list users", { cause: listUsersError });
      }

      const recipients = listUsersRes.users
        .map((u) => ({ id: u.id, email: u.email }))
        .filter((
          u,
        ): u is { id: string; email: string } => u.email != null);

      EdgeRuntime.waitUntil(sendEmails(c, recipients, analysis));

      return c.json({
        analysisId: analysis.id,
        started: recipients.length,
      }, 200);
    },
  );
