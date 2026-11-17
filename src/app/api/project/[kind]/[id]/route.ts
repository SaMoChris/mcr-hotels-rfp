import { fail, ok, readJson, withMember } from "@/lib/http";
import { deleteItem, loadProject, ProjectError, updateItem } from "@/lib/project";

type Ctx = RouteContext<"/api/project/[kind]/[id]">;

const toId = (raw: string) => (/^\d+$/.test(raw) ? Number(raw) : null);

export async function PATCH(request: Request, ctx: Ctx) {
  return withMember(async (user) => {
    const { kind, id } = await ctx.params;
    const n = toId(id);
    if (n === null) return fail("That item doesn't exist.", 404);
    try {
      await updateItem(user, kind, n, await readJson(request));
    } catch (e) {
      if (e instanceof ProjectError) return fail(e.message, 400);
      throw e;
    }
    return ok(await loadProject());
  });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  return withMember(async (user) => {
    const { kind, id } = await ctx.params;
    const n = toId(id);
    if (n === null) return fail("That item doesn't exist.", 404);
    try {
      await deleteItem(user, kind, n);
    } catch (e) {
      if (e instanceof ProjectError) return fail(e.message, 400);
      throw e;
    }
    return ok(await loadProject());
  });
}
