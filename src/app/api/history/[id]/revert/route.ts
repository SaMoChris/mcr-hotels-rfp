import { DocError } from "@/lib/docs";
import { revert, RevertError } from "@/lib/history";
import { fail, ok, withMember } from "@/lib/http";
import { InputError } from "@/lib/model/store";
import { ProjectError } from "@/lib/project";

export async function POST(_request: Request, ctx: RouteContext<"/api/history/[id]/revert">) {
  return withMember(async (user) => {
    const { id } = await ctx.params;
    if (!/^\d+$/.test(id)) return fail("That history entry doesn't exist.", 404);
    try {
      await revert(user, Number(id));
    } catch (e) {
      if (e instanceof RevertError || e instanceof InputError || e instanceof DocError || e instanceof ProjectError) {
        return fail(e.message, 400);
      }
      throw e;
    }
    return ok({ ok: true });
  });
}
