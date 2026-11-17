import { fail, ok, readJson, withMember } from "@/lib/http";
import { createItem, loadProject, ProjectError } from "@/lib/project";

export async function POST(request: Request, ctx: RouteContext<"/api/project/[kind]">) {
  return withMember(async (user) => {
    const { kind } = await ctx.params;
    try {
      await createItem(user, kind, await readJson(request));
    } catch (e) {
      if (e instanceof ProjectError) return fail(e.message, 400);
      throw e;
    }
    return ok(await loadProject());
  });
}
