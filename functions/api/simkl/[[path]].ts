import simklWorker, { type Env } from "../../simkl-token";

export function onRequest({
  request,
  env,
}: {
  request: Request;
  env: Env;
}): Promise<Response> {
  return simklWorker.fetch(request, env);
}
