import { Command } from "@cliffy/command";
import "@std/dotenv/load";

const createClientCmd = new Command()
  .name("create-client")
  .description("Create a Supabase client.")
  .action(async () => {
    const { createClient, defineConfig } = await import("@hey-api/openapi-ts");
    const { doc } = await import("../supabase/functions/api/index.ts");

    console.log(doc);

    const config = await defineConfig({
      // deno-lint-ignore no-explicit-any
      input: doc as any,
      output: {
        path: "./scripts/client",
        case: "PascalCase",
        module: { extension: ".ts" },
      },
      plugins: [
        { name: "@hey-api/typescript" },
        {
          name: "@hey-api/sdk",
          auth: true,
          transformer: true,
          operations: { strategy: "single", containerName: "PoolClient" },
        },
        { name: "@hey-api/schemas", type: "json" },
        { name: "@hey-api/transformers" },
      ],
    });

    await createClient(config);

    console.log("created client");
  });

const checkCmd = new Command()
  .name("check")
  .description("Check for pool closures.")
  .env("SUPABASE_URL=<value:string>", "URL of the Supabase instance.", {
    required: true,
  })
  .env(
    "SUPABASE_ANON_KEY=<value:string>",
    "Supabase anonymous key.",
    { required: true },
  )
  .env(
    "SUPABASE_SERVICE_ROLE_KEY=<value:string>",
    "Supabase service role key.",
    { required: true },
  ).action(async ({ supabaseUrl, supabaseServiceRoleKey }) => {
    const { PoolClient } = await import("@/client/index.ts");
    const { createClient, createConfig } = await import(
      "@/client/client/index.ts"
    );

    const client = createClient(
      createConfig({
        baseUrl: `${supabaseUrl}/functions/v1`,
        auth: supabaseServiceRoleKey,
      }),
    );
    const api = new PoolClient({ client });
    const { data, error, request, response } = await api.check();
    if (error) {
      console.error(error, request, response);
      return;
    }
    console.log(request);
    console.log(data);
  });

const notifyCmd = new Command()
  .name("notify")
  .description("Notify pool users of closures.")
  .env("SUPABASE_URL=<value:string>", "URL of the Supabase instance.", {
    required: true,
  })
  .env(
    "SUPABASE_ANON_KEY=<value:string>",
    "Supabase anonymous key.",
    { required: true },
  )
  .env(
    "SUPABASE_SERVICE_ROLE_KEY=<value:string>",
    "Supabase service role key.",
    { required: true },
  ).argument("<analysisId:string>", "ID of the analysis to notify about.")
  .action(async ({ supabaseUrl, supabaseServiceRoleKey }, analysisId) => {
    const { PoolClient } = await import("@/client/index.ts");
    const { createClient, createConfig } = await import(
      "@/client/client/index.ts"
    );

    const client = createClient(
      createConfig({
        baseUrl: `${supabaseUrl}/functions/v1`,
        auth: supabaseServiceRoleKey,
      }),
    );
    const api = new PoolClient({ client });
    const { data, error, request, response } = await api.notifyEmail({
      body: { analysisId },
    });
    if (error) {
      console.error(error, request, response);
      return;
    }
    console.log(request);
    console.log(data);
  });

const getPromptCmd = new Command()
  .name("get-prompt")
  .description("Get the prompt for a pool update.")
  .argument("<bannerText:string>", "The banner text to use in the prompt.")
  .action(async (_, bannerText) => {
    const { getPrompt } = await import(
      "../supabase/functions/api/utils/operator.ts"
    );
    console.log(getPrompt(bannerText));
  });

const cmd = new Command()
  .name("pool")
  .description("Pool commands")
  .command("create-client", createClientCmd)
  .command("check", checkCmd)
  .command("notify", notifyCmd)
  .command("get-prompt", getPromptCmd);

if (import.meta.main) {
  await cmd.parse(Deno.args);
}
