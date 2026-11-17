import { fail, ok, readJson, withMember } from "@/lib/http";
import { InputError, loadModel, setModelValue } from "@/lib/model/store";

export async function GET() {
  return withMember(async () => ok(await loadModel()));
}

// Body: { key, value } to save an input, or { key, reset: true } for its default.
export async function PUT(request: Request) {
  return withMember(async (user) => {
    const body = await readJson(request);
    if (typeof body.key !== "string") return fail("Name the input to change.", 400);
    const value = body.reset === true ? null : typeof body.value === "number" ? body.value : NaN;
    try {
      await setModelValue(user, body.key, value);
    } catch (e) {
      if (e instanceof InputError) return fail(e.message, 400);
      throw e;
    }
    return ok(await loadModel());
  });
}
