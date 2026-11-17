import { DocError, DOCS, loadDoc, saveSection } from "@/lib/docs";
import { fail, ok, readJson, withMember } from "@/lib/http";

export async function GET(_request: Request, ctx: RouteContext<"/api/docs/[doc]">) {
  return withMember(async () => {
    const { doc } = await ctx.params;
    const sections = await loadDoc(doc);
    if (!sections) return fail("That document doesn't exist.", 404);
    return ok({ doc, title: DOCS[doc].title, description: DOCS[doc].description, sections });
  });
}

// Body: { key, title, body } to save a section, or { key, reset: true } for the starting text.
export async function PUT(request: Request, ctx: RouteContext<"/api/docs/[doc]">) {
  return withMember(async (user) => {
    const { doc } = await ctx.params;
    const body = await readJson(request);
    if (typeof body.key !== "string") return fail("Name the section to change.", 400);
    const next =
      body.reset === true
        ? null
        : { title: typeof body.title === "string" ? body.title : "", body: typeof body.body === "string" ? body.body : "" };
    try {
      await saveSection(user, doc, body.key, next);
    } catch (e) {
      if (e instanceof DocError) return fail(e.message, 400);
      throw e;
    }
    return ok({ sections: await loadDoc(doc) });
  });
}
