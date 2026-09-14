import { handle, type Env } from "./router";

export default {
  fetch(request, env): Promise<Response> {
    return handle(request, env);
  },
} satisfies ExportedHandler<Env>;
