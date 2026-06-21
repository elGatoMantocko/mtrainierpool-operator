import { SESClient } from "@aws-sdk/client-ses";
import { MiddlewareHandler } from "hono";

interface AWS {
  ses: SESClient;
}
export interface AwsVariables {
  Variables: { aws: AWS };
}

function createSesClient(): SESClient {
  return new SESClient({
    region: Deno.env.get("AWS_REGION") ?? "us-west-2",
    credentials: {
      accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID")!,
      secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY")!,
    },
  });
}

export function withAws(): MiddlewareHandler<AwsVariables> {
  return (c, next) => {
    const sesClient = createSesClient();
    c.set("aws", { ses: sesClient });
    return next();
  };
}
