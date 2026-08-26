import { SendRawEmailCommand } from "@aws-sdk/client-ses";
import { createRoute, z } from "@hono/zod-openapi";
import { withSupabase } from "@supabase/server/adapters/hono";
import ical, {
  ICalCalendar,
  ICalCalendarMethod,
  ICalEventData,
} from "ical-generator";

import { type AwsVariables, withAws } from "@/middleware/aws.ts";
import { type Database, Tables } from "@/types/database.types.ts";
import { formatDate } from "@/utils/dates.ts";
import { buildRawEmail } from "@/utils/email.ts";
import { DefaultOpenAPIHono } from "@/utils/hono.ts";
import { POOL_OPERATOR_ANALYSIS_FIELDS } from "@/utils/queries.ts";
import { type SupabaseContext } from "@supabase/server";
import { Context } from "hono";

type PoolClosure = Pick<
  Tables<{ schema: "public" }, "pool_closures">,
  "closed_at" | "opened_at" | "reasoning"
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
  middleware: [
    withSupabase<Database>({ auth: ["secret"] }),
    withAws(),
  ] as const,
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
    if (closure.closed_at) {
      lines.push(`Closed since: ${formatDate(closure.closed_at)}`);
    }
    if (closure.opened_at) {
      lines.push(`Expected to reopen: ${formatDate(closure.opened_at)}`);
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

function calendarData(analysis: PoolOperatorAnalysis): ICalCalendar {
  const cal = ical({ name: "Mt. Rainier Pool Operator" });
  cal.method(ICalCalendarMethod.REQUEST);

  for (const closure of analysis.closures) {
    if (closure.closed_at == null) {
      continue;
    }
    // Pass native Dates: ical-generator's edge-runtime build fails to detect
    // Temporal values and falls through to a dayjs path that needs the (absent)
    // UTC plugin. A `Date` takes its safe, plugin-free formatting path.
    const start = new Date(closure.closed_at);
    const end = closure.opened_at != null ? new Date(closure.opened_at) : null;
    const event = {
      start,
      end,
      summary: "Pool Closure",
      description: closure.reasoning,
    } satisfies ICalEventData;
    console.log(event);
    cal.createEvent(event);
  }

  return cal;
}

type SupabaseHonoContext = Context<
  { Variables: { supabaseContext: SupabaseContext<Database> } } & AwsVariables
>;

async function sendEmails<C extends SupabaseHonoContext>(
  c: C,
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

  const ics = calendarData(analysis).toString();
  const html = emailData(analysis);

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
        new SendRawEmailCommand({
          Source: SMTP_ADMIN_EMAIL,
          Destinations: [user.email],
          RawMessage: {
            Data: buildRawEmail({
              from: SMTP_ADMIN_EMAIL,
              to: user.email,
              subject: POOL_CLOSED_SUBJECT,
              html,
              ics,
            }),
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

export const app = new DefaultOpenAPIHono()
  .openapi(
    route,
    async (c) => {
      const { analysisId } = c.req.valid("json");
      const supabase = c.var.supabaseContext.supabaseAdmin;

      const { data: analysis, error: analysisError } = await supabase
        .from("pool_operator_analysis")
        .select(POOL_OPERATOR_ANALYSIS_FIELDS)
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
