import { OpenAPIHono } from "@hono/zod-openapi";
import type { Env } from "hono";

export class DefaultOpenAPIHono<E extends Env> extends OpenAPIHono<E> {
  constructor() {
    super({
      defaultHook: (result) => {
        if (!result.success) {
          console.error(
            `failed validation hook: ${result.target}`,
            result.error,
          );
        }
      },
    });
  }
}
